import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST(request) {
  try {
    const { userAddress, projectId } = await request.json();

    if (!userAddress || !projectId) {
      return NextResponse.json(
        { error: "User address and project ID are required" },
        { status: 400 },
      );
    }

    console.log(`🔄 Processing mint request for address: ${userAddress}, project: ${projectId}`);

    // Path ke mockOracle.js (sesuaikan dengan struktur folder Anda)
    const contractDir = path.join(process.cwd(), "..", "contract");
    const command = `cd ${contractDir} && node scripts/mockOracle.js ${userAddress} ${projectId}`;

    console.log(`🔧 Executing command: ${command}`);
    console.log(`📁 Contract directory: ${contractDir}`);

    // Check if contract directory exists
    const fs = require("fs");
    if (!fs.existsSync(contractDir)) {
      throw new Error(`Contract directory not found: ${contractDir}`);
    }

    // Check if mockOracle.js exists
    const oracleScript = path.join(contractDir, "scripts", "mockOracle.js");
    if (!fs.existsSync(oracleScript)) {
      throw new Error(`Oracle script not found: ${oracleScript}`);
    }

    console.log(`✅ Oracle script found: ${oracleScript}`);

    // Execute mockOracle.js dengan timeout 60 detik
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000,
      cwd: contractDir,
    });

    console.log("=== Oracle stdout ===");
    console.log(stdout);
    console.log("=== End stdout ===");

    if (stderr) {
      console.log("=== Oracle stderr ===");
      console.log(stderr);
      console.log("=== End stderr ===");
    }

    // Parse output untuk mendapatkan informasi mint
    const lines = stdout.split("\n");
    let carbonCredit = 0;
    let transactionHash = "";
    let projectInfo = "";
    let status = "";

    console.log("🔍 Parsing oracle output...");

    for (const line of lines) {
      console.log(`Checking line: ${line}`);

      if (line.includes("Total credit:") || line.includes("Net credit:")) {
        const match = line.match(/(-?\d+(?:\.\d+)?)\s*CCT/);
        if (match) {
          carbonCredit = parseFloat(match[1]);
          console.log(`✅ Found carbon credit: ${carbonCredit}`);
        }
      }
      if (line.includes("Transaction hash:")) {
        transactionHash = line.split("Transaction hash:")[1]?.trim();
        console.log(`✅ Found transaction hash: ${transactionHash}`);
      }
      if (line.includes("Status:")) {
        status = line.split("Status:")[1]?.trim();
        console.log(`✅ Found status: ${status}`);
      }
      if (line.includes("Valid project found:")) {
        projectInfo = line.split("Valid project found:")[1]?.trim();
        console.log(`✅ Found project info: ${projectInfo}`);
      }
    }

    // Check for errors in output
    if (stdout.includes("❌")) {
      const errorLine = lines.find((line) => line.includes("❌"));
      const errorMessage = errorLine?.replace("❌", "").trim() || "Oracle execution failed";
      console.error(`❌ Oracle error found: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    if (stderr && stderr.includes("Error") && !stderr.includes("Warning")) {
      console.error(`❌ Stderr error: ${stderr}`);
      throw new Error(`Oracle execution error: ${stderr}`);
    }

    // Success response (even if no transaction hash - some operations might not need it)
    const responseData = {
      projectId,
      userAddress,
      carbonCredit,
      transactionHash: transactionHash || "No transaction required",
      status: status || "Processed",
      projectInfo: projectInfo || "Project processed",
      oracleOutput: stdout,
    };

    console.log("✅ Returning success response:", responseData);

    return NextResponse.json({
      success: true,
      message: "Tokens processed successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("❌ Mint API Error:", error);

    let errorMessage = error.message;
    let errorType = "execution_error";

    if (error.code === "TIMEOUT") {
      errorType = "timeout";
      errorMessage = "Request timeout - proses minting memerlukan waktu lebih lama";
    } else if (error.message.includes("ENOENT") || error.message.includes("not found")) {
      errorType = "file_not_found";
      errorMessage = "Oracle script or contract directory not found";
    } else if (error.message.includes("Project ID tidak valid")) {
      errorType = "invalid_project";
    } else if (error.message.includes("Wallet address tidak ditemukan")) {
      errorType = "invalid_wallet";
    } else if (error.message.includes("sudah digunakan")) {
      errorType = "project_used";
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process tokens",
        details: errorMessage,
        type: errorType,
      },
      { status: 500 },
    );
  }
}
