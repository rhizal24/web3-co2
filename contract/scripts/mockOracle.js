const hre = require("hardhat");

async function main() {
  const [oracleSigner] = await hre.ethers.getSigners();

  // UPDATE INI DENGAN ADDRESS HASIL DEPLOY BARU
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const receiverAddress =
    process.env.RECEIVER_ADDRESS ||
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const projectId = process.env.PROJECT_ID || "proj1";

  console.log("🚀 Mock Oracle - Enhanced Project Validation");
  console.log("📍 Contract:", tokenAddress);
  console.log("👤 Receiver:", receiverAddress);
  console.log("🆔 Project ID:", projectId);

  try {
    // Check contract
    const code = await hre.ethers.provider.getCode(tokenAddress);
    if (code === "0x") {
      console.log("❌ Contract tidak ditemukan - deploy dulu!");
      return;
    }

    const CarbonCreditToken = await hre.ethers.getContractFactory(
      "CarbonCreditToken"
    );
    const token = CarbonCreditToken.attach(tokenAddress);

    // Test basic contract call
    const name = await token.name();
    console.log("✅ Contract name:", name);

    // Set oracle if needed
    const currentOracle = await token.oracle();
    if (currentOracle.toLowerCase() !== oracleSigner.address.toLowerCase()) {
      console.log("🔧 Setting oracle...");
      await token.setOracle(oracleSigner.address);
      console.log("✅ Oracle set");
    }

    // Import fetch untuk API calls
    const { default: fetch } = await import("node-fetch");

    console.log("🔍 Step 1: Validating project ownership and availability...");

    // Enhanced project validation dengan API baru
    try {
      const validationResponse = await fetch(
        "http://localhost:3002/api/validate-project",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: projectId,
            userAddress: receiverAddress,
          }),
        }
      );

      const validationResult = await validationResponse.json();
      console.log("📋 Validation result:", validationResult);

      if (!validationResponse.ok || !validationResult.success) {
        // Handle specific errors dengan pesan yang jelas
        console.log("❌ Project validation failed");

        switch (validationResult.errorType) {
          case "invalid_wallet":
            console.log("❌ ERROR: WALLET NOT REGISTERED");
            console.log(
              `   Wallet ${receiverAddress} tidak terdaftar dalam sistem`
            );
            console.log(
              "   Available wallets:",
              validationResult.availableAddresses || []
            );
            throw new Error(
              `Wallet address ${receiverAddress} tidak terdaftar dalam sistem`
            );

          case "invalid_project":
            console.log("❌ ERROR: PROJECT NOT FOUND");
            console.log(`   Project ID "${projectId}" tidak ditemukan`);
            if (validationResult.availableProjects) {
              console.log("   Available projects for your company:");
              validationResult.availableProjects.forEach((proj, idx) => {
                console.log(
                  `      ${idx + 1}. ${proj.id} - ${proj.name} (Used: ${
                    proj.used
                  })`
                );
              });
            }
            throw new Error(`Project ID "${projectId}" tidak ditemukan`);

          case "unauthorized_project":
            console.log("❌ ERROR: PROJECT NOT OWNED BY YOUR COMPANY");
            console.log(
              `   Project "${projectId}" milik ${validationResult.details.projectOwner}`
            );
            console.log(
              `   Your company: ${validationResult.details.yourCompany}`
            );
            console.log("   Available projects for your company:");
            validationResult.availableProjects.forEach((proj, idx) => {
              console.log(
                `      ${idx + 1}. ${proj.id} - ${proj.name} (${
                  proj.offsetTon
                } tons)`
              );
            });
            throw new Error(
              `Project "${projectId}" bukan milik perusahaan Anda (${validationResult.details.yourCompany}). Project ini milik ${validationResult.details.projectOwner}.`
            );

          case "project_used":
            console.log("❌ ERROR: PROJECT ALREADY USED");
            console.log(`   Project "${projectId}" sudah pernah digunakan`);
            console.log(`   Used at: ${validationResult.details.usedAt}`);
            console.log("   Available projects for your company:");
            validationResult.availableProjects.forEach((proj, idx) => {
              console.log(
                `      ${idx + 1}. ${proj.id} - ${proj.name} (${
                  proj.offsetTon
                } tons)`
              );
            });
            throw new Error(
              `Project "${projectId}" (${validationResult.details.projectName}) sudah pernah digunakan sebelumnya`
            );

          default:
            throw new Error(
              validationResult.message || "Project validation failed"
            );
        }
      }

      // If validation passed
      const { project, wallet } = validationResult;
      console.log("✅ Project validation successful");
      console.log(`   Project: ${project.projectName}`);
      console.log(`   Company: ${wallet.name}`);
      console.log(`   Offset: ${project.offsetTon} tons`);

      // Check if project already used in blockchain
      const isUsedInContract = await token.isProjectUsed(projectId);
      if (isUsedInContract) {
        console.log("❌ Project already marked as used in smart contract");
        throw new Error(
          `Project "${projectId}" sudah digunakan dalam smart contract`
        );
      }

      // Execute minting
      const offsetAmount = project.offsetTon;
      const amountToMint = hre.ethers.parseEther(offsetAmount.toString());

      console.log(`🎯 Minting ${offsetAmount} CCT for project ${projectId}...`);
      console.log(`📊 Project details:`);
      console.log(`   - Name: ${project.projectName}`);
      console.log(`   - Company: ${project.companyName}`);
      console.log(`   - Offset: ${project.offsetTon} tons`);
      console.log(`   - Description: ${project.description}`);

      // Mint tokens
      const tx = await token
        .connect(oracleSigner)
        .mintCarbonCredit(receiverAddress, amountToMint, projectId);
      console.log("📝 Transaction hash:", tx.hash);
      await tx.wait();
      console.log("✅ Minting successful!");

      // Mark project as used in API
      try {
        const markUsedResponse = await fetch(
          `http://localhost:3002/api/carbon-offset-projects/${projectId}/use`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (markUsedResponse.ok) {
          console.log("✅ Project marked as used in API");
        } else {
          console.log("⚠️ Could not mark project as used in API");
        }
      } catch (markError) {
        console.log(
          "⚠️ Error marking project as used in API:",
          markError.message
        );
      }

      // Get updated balances
      const balance = await token.balanceOf(receiverAddress);
      const formattedBalance = hre.ethers.formatEther(balance);

      console.log("\n" + "=".repeat(60));
      console.log("🎉 MOCK ORACLE SUCCESS!");
      console.log("=".repeat(60));
      console.log(`✅ Project: ${projectId} (${project.projectName})`);
      console.log(`💰 Minted: ${offsetAmount} CCT (based on project offset)`);
      console.log(`💰 Total balance: ${formattedBalance} CCT`);
      console.log(`📝 Transaction: ${tx.hash}`);
      console.log(`🏢 Company: ${wallet.name}`);
      console.log("=".repeat(60));
    } catch (validationError) {
      console.log(
        "❌ Project validation or execution failed:",
        validationError.message
      );
      throw validationError;
    }
  } catch (error) {
    console.log("❌ Oracle execution failed:", error.message);
    process.exit(1); // Exit dengan error code
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
