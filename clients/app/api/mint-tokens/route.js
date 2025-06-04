import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(request) {
  try {
    console.log("🔄 API mint-tokens called");

    const body = await request.json();
    const { userAddress, projectId } = body;

    console.log("📋 Request data:", { userAddress, projectId });

    // Validate input
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

    // Pre-validate project via API
    console.log("🔍 Pre-validating project...");

    try {
      const validationResponse = await fetch("http://localhost:3002/api/validate-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, userAddress }),
      });

      if (!validationResponse.ok) {
        const validationError = await validationResponse.json();
        console.log("❌ Pre-validation failed:", validationError);

        // Return specific error messages
        return NextResponse.json(
          {
            success: false,
            error: validationError.error,
            message: validationError.message,
            errorType: validationError.errorType,
            details: validationError.details,
            availableProjects: validationError.availableProjects,
          },
          { status: validationResponse.status },
        );
      }

      const validationResult = await validationResponse.json();
      console.log("✅ Pre-validation successful:", validationResult.message);
    } catch (preValidationError) {
      console.error("❌ Pre-validation error:", preValidationError);
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_FAILED",
          message: "Could not validate project before processing",
          details: preValidationError.message,
        },
        { status: 500 },
      );
    }

    console.log("✅ Pre-validation passed, executing oracle...");

    // Path ke contract directory
    const contractDir = path.join(process.cwd(), "..", "contract");

    // Execute mockOracle.js using spawn
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
          cwd: contractDir,
          env: env,
          stdio: "pipe",
        },
      );

      let stdout = "";
      let stderr = "";

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

      child.on("close", (code) => {
        console.log("🏁 Oracle process finished with code:", code);

        if (code === 0) {
          // Parse successful output
          try {
            const lines = stdout.split("\n");

            let carbonCredit = 0;
            let transactionHash = "";
            let projectName = "";

            // Parse output
            lines.forEach((line) => {
              if (line.includes("Minted:") && line.includes("CCT")) {
                const match = line.match(/Minted:\s*(\d+)\s*CCT/);
                if (match) carbonCredit = parseInt(match[1]);
              }
              if (line.includes("Transaction:")) {
                const match = line.match(/Transaction:\s*(0x[a-fA-F0-9]+)/);
                if (match) transactionHash = match[1];
              }
              if (line.includes("Project:") && line.includes("(")) {
                const match = line.match(/Project:\s*\w+\s*\(([^)]+)\)/);
                if (match) projectName = match[1];
              }
            });

            resolve(
              NextResponse.json({
                success: true,
                message: "Carbon credits minted successfully",
                data: {
                  carbonCredit,
                  transactionHash,
                  projectId,
                  projectName,
                  status: "success",
                  userAddress,
                },
              }),
            );
          } catch (parseError) {
            resolve(
              NextResponse.json({
                success: true,
                message: "Operation completed but could not parse details",
                data: {
                  carbonCredit: 0,
                  transactionHash: "unknown",
                  projectId,
                  status: "completed",
                  userAddress,
                },
              }),
            );
          }
        } else {
          // Enhanced error parsing
          let errorMessage = "Unknown error occurred";
          let errorType = "execution_error";

          if (
            stdout.includes("bukan milik perusahaan Anda") ||
            stderr.includes("bukan milik perusahaan")
          ) {
            errorMessage = `Project "${projectId}" bukan milik perusahaan Anda`;
            errorType = "unauthorized_project";
          } else if (
            stdout.includes("sudah pernah digunakan") ||
            stderr.includes("sudah pernah digunakan")
          ) {
            errorMessage = `Project "${projectId}" sudah pernah digunakan sebelumnya`;
            errorType = "project_used";
          } else if (stdout.includes("tidak terdaftar") || stderr.includes("tidak terdaftar")) {
            errorMessage = `Wallet address tidak terdaftar dalam sistem`;
            errorType = "invalid_wallet";
          } else if (stdout.includes("tidak ditemukan") || stderr.includes("tidak ditemukan")) {
            errorMessage = `Project ID "${projectId}" tidak ditemukan`;
            errorType = "invalid_project";
          } else if (stderr.includes("Cannot connect") || stderr.includes("ECONNREFUSED")) {
            errorMessage = "Cannot connect to blockchain network";
            errorType = "network_error";
          }

          resolve(
            NextResponse.json(
              {
                success: false,
                error: errorMessage,
                errorType: errorType,
                details: stderr || stdout || "No error details available",
                projectId: projectId,
              },
              { status: 500 },
            ),
          );
        }
      });

      child.on("error", (error) => {
        resolve(
          NextResponse.json(
            {
              success: false,
              error: "Failed to execute oracle script",
              details: error.message,
            },
            { status: 500 },
          ),
        );
      });
    });
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
