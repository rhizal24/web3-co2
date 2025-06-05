import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

// ===== CONFIGURATION =====
const CONFIG = {
  API_BASE_URL: "http://localhost:3002/api",
  CONTRACT_DIR: path.join(process.cwd(), "..", "contract"),
  ORACLE_TIMEOUT: 60000, // 60 seconds
};

// ===== MAIN API HANDLER =====
export async function POST(request) {
  try {
    console.log("🔄 API mint-tokens called");

    const { userAddress, projectId } = await request.json();
    console.log("📋 Request data:", { userAddress, projectId });

    // Validate input
    const validationError = validateInput(userAddress, projectId);
    if (validationError) return validationError;

    // Pre-validate project
    const preValidationResult = await preValidateProject(projectId, userAddress);
    if (!preValidationResult.success) return preValidationResult.response;

    console.log("✅ Pre-validation passed, executing oracle...");

    // Execute oracle
    return await executeOracle(userAddress, projectId);
  } catch (error) {
    console.error("❌ API Error:", error);
    return createErrorResponse("Internal server error", error.message, 500);
  }
}

// ===== VALIDATION FUNCTIONS =====
function validateInput(userAddress, projectId) {
  if (!userAddress || !projectId) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing required fields",
        details: "userAddress and projectId are required",
      },
      { status: 400 },
    );
  }
  return null;
}

async function preValidateProject(projectId, userAddress) {
  console.log("🔍 Pre-validating project...");

  try {
    const validationResponse = await fetch(`${CONFIG.API_BASE_URL}/validate-project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, userAddress }),
    });

    if (!validationResponse.ok) {
      const validationError = await validationResponse.json();
      console.log("❌ Pre-validation failed:", validationError);

      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: validationError.error,
            message: validationError.message,
            errorType: validationError.errorType,
            details: validationError.details,
            availableProjects: validationError.availableProjects,
          },
          { status: validationResponse.status },
        ),
      };
    }

    const validationResult = await validationResponse.json();
    console.log("✅ Pre-validation successful:", validationResult.message);

    return { success: true };
  } catch (preValidationError) {
    console.error("❌ Pre-validation error:", preValidationError);

    return {
      success: false,
      response: createErrorResponse(
        "VALIDATION_FAILED",
        "Could not validate project before processing",
        500,
        preValidationError.message,
      ),
    };
  }
}

// ===== ORACLE EXECUTION =====
async function executeOracle(userAddress, projectId) {
  return new Promise((resolve) => {
    const env = {
      ...process.env,
      RECEIVER_ADDRESS: userAddress,
      PROJECT_ID: projectId,
    };

    console.log("🚀 Executing mockOracle script...");

    const child = spawn(
      "npx",
      ["hardhat", "run", "scripts/mockOracle.js", "--network", "localhost"],
      {
        cwd: CONFIG.CONTRACT_DIR,
        env: env,
        stdio: "pipe",
      },
    );

    let stdout = "";
    let stderr = "";

    // Handle process output
    child.stdout.on("data", (data) => {
      const output = data.toString();
      stdout += output;
      console.log("📤 Oracle stdout:", output);
    });

    child.stderr.on("data", (data) => {
      const error = data.toString();
      stderr += error;
      console.log("❌ Oracle stderr:", error);
    });

    // Handle process completion
    child.on("close", (code) => {
      console.log("🏁 Oracle process finished with code:", code);

      if (code === 0) {
        resolve(handleSuccessfulExecution(stdout, projectId, userAddress));
      } else {
        resolve(handleFailedExecution(stdout, stderr, projectId));
      }
    });

    // Handle process error
    child.on("error", (error) => {
      resolve(createErrorResponse("Failed to execute oracle script", error.message, 500));
    });

    // Set timeout
    setTimeout(() => {
      child.kill();
      resolve(
        createErrorResponse("Oracle execution timeout", "Process took longer than expected", 408),
      );
    }, CONFIG.ORACLE_TIMEOUT);
  });
}

// ===== SUCCESS HANDLING =====
function handleSuccessfulExecution(stdout, projectId, userAddress) {
  try {
    const parsedData = parseOracleOutput(stdout);

    return NextResponse.json({
      success: true,
      message: "Carbon credits minted successfully",
      data: {
        ...parsedData,
        projectId,
        userAddress,
        status: "success",
      },
    });
  } catch (parseError) {
    console.warn("⚠️ Could not parse oracle output:", parseError);

    return NextResponse.json({
      success: true,
      message: "Operation completed but could not parse details",
      data: {
        carbonCredit: 0,
        transactionHash: "unknown",
        projectName: "",
        projectId,
        userAddress,
        status: "completed",
      },
    });
  }
}

function parseOracleOutput(stdout) {
  const lines = stdout.split("\n");
  let carbonCredit = 0;
  let transactionHash = "";
  let projectName = "";

  lines.forEach((line) => {
    // Parse minted amount
    if (line.includes("Minted:") && line.includes("CCT")) {
      const match = line.match(/Minted:\s*(\d+)\s*CCT/);
      if (match) carbonCredit = parseInt(match[1]);
    }

    // Parse transaction hash
    if (line.includes("Transaction:")) {
      const match = line.match(/Transaction:\s*(0x[a-fA-F0-9]+)/);
      if (match) transactionHash = match[1];
    }

    // Parse project name
    if (line.includes("Project:") && line.includes("(")) {
      const match = line.match(/Project:\s*\w+\s*\(([^)]+)\)/);
      if (match) projectName = match[1];
    }
  });

  return { carbonCredit, transactionHash, projectName };
}

// ===== ERROR HANDLING =====
function handleFailedExecution(stdout, stderr, projectId) {
  const { errorMessage, errorType } = parseOracleError(stdout, stderr, projectId);

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      errorType: errorType,
      details: stderr || stdout || "No error details available",
      projectId: projectId,
    },
    { status: 500 },
  );
}

function parseOracleError(stdout, stderr, projectId) {
  const errorPatterns = [
    {
      pattern: /bukan milik perusahaan/i,
      message: `Project "${projectId}" bukan milik perusahaan Anda`,
      type: "unauthorized_project",
    },
    {
      pattern: /sudah pernah digunakan/i,
      message: `Project "${projectId}" sudah pernah digunakan sebelumnya`,
      type: "project_used",
    },
    {
      pattern: /tidak terdaftar/i,
      message: "Wallet address tidak terdaftar dalam sistem",
      type: "invalid_wallet",
    },
    {
      pattern: /tidak ditemukan/i,
      message: `Project ID "${projectId}" tidak ditemukan`,
      type: "invalid_project",
    },
    {
      pattern: /(Cannot connect|ECONNREFUSED)/i,
      message: "Cannot connect to blockchain network",
      type: "network_error",
    },
  ];

  const combinedOutput = stdout + stderr;

  for (const { pattern, message, type } of errorPatterns) {
    if (pattern.test(combinedOutput)) {
      return { errorMessage: message, errorType: type };
    }
  }

  return {
    errorMessage: "Unknown error occurred during oracle execution",
    errorType: "execution_error",
  };
}

// ===== UTILITY FUNCTIONS =====
function createErrorResponse(error, details, status, additionalDetails = null) {
  const response = {
    success: false,
    error,
    details,
  };

  if (additionalDetails) {
    response.additionalDetails = additionalDetails;
  }

  return NextResponse.json(response, { status });
}
