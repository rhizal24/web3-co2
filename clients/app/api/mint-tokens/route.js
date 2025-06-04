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

    // Validate Ethereum address format
    if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid address format",
          details: "userAddress must be a valid Ethereum address",
        },
        { status: 400 },
      );
    }

    console.log("✅ Input validation passed");

    // Path ke contract directory
    const contractDir = path.join(process.cwd(), "..", "contract");
    const scriptPath = path.join(contractDir, "scripts", "mockOracle.js");

    console.log("📁 Contract directory:", contractDir);
    console.log("📁 Script path:", scriptPath);

    // Execute mockOracle.js using spawn
    return new Promise((resolve) => {
      const env = {
        ...process.env,
        RECEIVER_ADDRESS: userAddress,
        PROJECT_ID: projectId,
      };

      console.log("🚀 Executing mockOracle script...");
      console.log("📋 Environment:", { RECEIVER_ADDRESS: userAddress, PROJECT_ID: projectId });

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
        console.log("📤 Full stdout:", stdout);
        console.log("❌ Full stderr:", stderr);

        if (code === 0) {
          // Parse successful output
          try {
            // Extract information from stdout
            const lines = stdout.split("\n");

            let carbonCredit = 0;
            let transactionHash = "";
            let projectName = "";
            let status = "success";

            // Parse output untuk extract data
            lines.forEach((line) => {
              if (line.includes("Minted:") && line.includes("CCT")) {
                const match = line.match(/Minted:\s*(\d+)\s*CCT/);
                if (match) {
                  carbonCredit = parseInt(match[1]);
                }
              }
              if (line.includes("Transaction:")) {
                const match = line.match(/Transaction:\s*(0x[a-fA-F0-9]+)/);
                if (match) {
                  transactionHash = match[1];
                }
              }
              if (line.includes("Project:") && line.includes("(")) {
                const match = line.match(/Project:\s*\w+\s*\(([^)]+)\)/);
                if (match) {
                  projectName = match[1];
                }
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
                  status,
                  userAddress,
                  rawOutput: stdout,
                },
              }),
            );
          } catch (parseError) {
            console.error("❌ Error parsing oracle output:", parseError);
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
                  rawOutput: stdout,
                },
              }),
            );
          }
        } else {
          // Handle errors
          let errorMessage = "Unknown error occurred";
          let errorType = "execution_error";

          if (stderr.includes("Project tidak valid") || stdout.includes("Project tidak valid")) {
            errorMessage = `Project ID "${projectId}" tidak valid atau sudah digunakan`;
            errorType = "invalid_project";
          } else if (
            stderr.includes("Wallet address not found") ||
            stdout.includes("Wallet address not found")
          ) {
            errorMessage = `Wallet address tidak ditemukan dalam sistem`;
            errorType = "invalid_wallet";
          } else if (
            stderr.includes("Project already used") ||
            stdout.includes("Project already used")
          ) {
            errorMessage = `Project "${projectId}" sudah digunakan sebelumnya`;
            errorType = "project_used";
          } else if (stderr.includes("Cannot connect") || stderr.includes("ECONNREFUSED")) {
            errorMessage =
              "Cannot connect to blockchain network. Please ensure Hardhat node is running.";
            errorType = "network_error";
          } else if (stderr.includes("file not found") || stderr.includes("ENOENT")) {
            errorMessage = "Oracle script not found. Please check system configuration.";
            errorType = "file_not_found";
          }

          resolve(
            NextResponse.json(
              {
                success: false,
                error: errorMessage,
                errorType: errorType,
                details: stderr || stdout || "No error details available",
                code: code,
              },
              { status: 500 },
            ),
          );
        }
      });

      child.on("error", (error) => {
        console.error("❌ Oracle spawn error:", error);
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
