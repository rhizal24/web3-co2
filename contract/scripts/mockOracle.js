const hre = require("hardhat");

async function main() {
  const [oracleSigner] = await hre.ethers.getSigners();

  // Contract address
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Determine mode berdasarkan environment variables
  const mode = process.env.MODE || "project"; // "project" atau "emission"

  if (mode === "project") {
    await handleProjectMinting();
  } else if (mode === "emission") {
    await handleEmissionUpdate();
  } else {
    console.log("❌ Invalid mode. Use MODE=project or MODE=emission");
    process.exit(1);
  }

  async function handleProjectMinting() {
    const receiverAddress =
      process.env.RECEIVER_ADDRESS ||
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const projectId = process.env.PROJECT_ID || "proj1";

    console.log("🚀 CARBON ORACLE - PROJECT MINTING MODE");
    console.log("=".repeat(60));
    console.log("📍 Contract:", tokenAddress);
    console.log("👤 Receiver:", receiverAddress);
    console.log("🆔 Project ID:", projectId);
    console.log("=".repeat(60));

    try {
      // Check contract
      const code = await hre.ethers.provider.getCode(tokenAddress);
      if (code === "0x") {
        throw new Error("❌ Contract tidak ditemukan - deploy dulu!");
      }

      const CarbonCreditToken = await hre.ethers.getContractFactory(
        "CarbonCreditToken"
      );
      const token = CarbonCreditToken.attach(tokenAddress);

      // Set oracle if needed
      await ensureOracleSet(token, oracleSigner);

      // Import fetch
      const { default: fetch } = await import("node-fetch");

      console.log(
        "🔍 Step 1: Validating project ownership and availability..."
      );

      // Project validation
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

      if (!validationResponse.ok || !validationResult.success) {
        await handleProjectValidationError(
          validationResult,
          projectId,
          receiverAddress
        );
        return;
      }

      const { project, wallet } = validationResult;
      console.log("✅ Project validation successful");
      console.log(`   Project: ${project.projectName}`);
      console.log(`   Company: ${wallet.name}`);
      console.log(`   Offset: ${project.offsetTon} tons`);

      // Check blockchain
      const isUsedInContract = await token.isProjectUsed(projectId);
      if (isUsedInContract) {
        throw new Error(
          `Project "${projectId}" sudah digunakan dalam smart contract`
        );
      }

      // Execute minting
      const offsetAmount = project.offsetTon;
      const amountToMint = hre.ethers.parseEther(offsetAmount.toString());

      console.log(`🎯 Minting ${offsetAmount} CCT for project ${projectId}...`);

      const tx = await token
        .connect(oracleSigner)
        .mintCarbonCredit(receiverAddress, amountToMint, projectId);
      console.log("📝 Transaction hash:", tx.hash);
      await tx.wait();
      console.log("✅ Minting successful!");

      // Mark project as used in API
      await markProjectAsUsed(projectId);

      // Show results
      const balance = await token.balanceOf(receiverAddress);
      const formattedBalance = hre.ethers.formatEther(balance);

      console.log("\n" + "=".repeat(60));
      console.log("🎉 PROJECT MINTING SUCCESS!");
      console.log("=".repeat(60));
      console.log(`✅ Project: ${projectId} (${project.projectName})`);
      console.log(`💰 Minted: ${offsetAmount} CCT`);
      console.log(`💰 Total balance: ${formattedBalance} CCT`);
      console.log(`📝 Transaction: ${tx.hash}`);
      console.log(`🏢 Company: ${wallet.name}`);
      console.log("=".repeat(60));
    } catch (error) {
      console.error("❌ Project minting failed:", error.message);
      process.exit(1);
    }
  }

  async function handleEmissionUpdate() {
    const companyAddress =
      process.env.COMPANY_ADDRESS ||
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const year = process.env.YEAR || "2024";

    console.log("🌍 CARBON ORACLE - EMISSION UPDATE MODE");
    console.log("=".repeat(60));
    console.log("📅 Year:", year);
    console.log("🏭 Company Address:", companyAddress);
    console.log("📍 Contract:", tokenAddress);
    console.log("⚡ Oracle:", oracleSigner.address);
    console.log("=".repeat(60));

    try {
      // Check contract
      const code = await hre.ethers.provider.getCode(tokenAddress);
      if (code === "0x") {
        throw new Error("❌ Contract tidak ditemukan - deploy dulu!");
      }

      const CarbonCreditToken = await hre.ethers.getContractFactory(
        "CarbonCreditToken"
      );
      const token = CarbonCreditToken.attach(tokenAddress);

      // Set oracle if needed
      await ensureOracleSet(token, oracleSigner);

      // Import fetch
      const { default: fetch } = await import("node-fetch");

      console.log("🔍 Step 1: Fetching emission data from API...");

      // Get emission data
      const emissionResponse = await fetch(
        `http://localhost:3002/api/emissions/${companyAddress}/${year}`
      );

      if (!emissionResponse.ok) {
        const errorData = await emissionResponse.json();
        throw new Error(errorData.message || "Failed to fetch emission data");
      }

      const emissionData = await emissionResponse.json();

      if (!emissionData.success) {
        throw new Error(
          emissionData.message || "Invalid emission data response"
        );
      }

      const { company, emission } = emissionData.data;

      console.log("✅ Emission data retrieved:");
      console.log(`   🏢 Company: ${company.name} (${company.type})`);
      console.log(`   📊 Emission Limit: ${emission.limit} tons CO2`);
      console.log(`   📈 Actual Emission: ${emission.actual} tons CO2`);
      console.log(`   ⚖️  Carbon Balance: ${emission.balance} tons CO2`);
      console.log(`   📋 Status: ${emission.status.toUpperCase()}`);

      console.log("\n🔍 Step 2: Processing carbon balance...");

      const carbonBalance = emission.balance;
      const balanceInWei = hre.ethers.parseEther(
        Math.abs(carbonBalance).toString()
      );

      if (carbonBalance > 0) {
        // SURPLUS: Mint CCT tokens
        console.log(`🎉 SURPLUS DETECTED: +${carbonBalance} tons CO2`);
        console.log(`💰 Minting ${carbonBalance} CCT tokens...`);

        // Reset debt if exists
        const currentDebt = await token.getCarbonDebt(companyAddress);
        if (currentDebt < 0) {
          console.log(`🔄 Resetting previous debt...`);
          await token
            .connect(oracleSigner)
            .updateCarbonCredit(companyAddress, Math.abs(Number(currentDebt)));
        }

        // Mint surplus
        const projectId = `emission_${year}_${company.companyId}_surplus`;
        const mintTx = await token
          .connect(oracleSigner)
          .mintCarbonCredit(companyAddress, balanceInWei, projectId);

        console.log("📝 Mint Transaction:", mintTx.hash);
        await mintTx.wait();
        console.log("✅ CCT tokens minted successfully!");
      } else if (carbonBalance < 0) {
        // DEFICIT: Set carbon debt
        console.log(`❌ DEFICIT DETECTED: ${carbonBalance} tons CO2`);
        console.log(`💳 Setting carbon debt: ${Math.abs(carbonBalance)} units`);

        const debtTx = await token
          .connect(oracleSigner)
          .updateCarbonCredit(
            companyAddress,
            hre.ethers.parseEther(carbonBalance.toString())
          );

        console.log("📝 Debt Transaction:", debtTx.hash);
        await debtTx.wait();
        console.log("✅ Carbon debt set successfully!");
      } else {
        // NEUTRAL
        console.log(`⚖️  NEUTRAL: Perfect balance (0 tons CO2)`);
        console.log(`✅ No action needed`);
      }

      // Get updated balances
      const cctBalance = await token.balanceOf(companyAddress);
      const carbonDebt = await token.getCarbonDebt(companyAddress);
      const canTransfer = await token.canTransfer(companyAddress);

      console.log("\n" + "=".repeat(60));
      console.log("🎉 EMISSION UPDATE COMPLETED!");
      console.log("=".repeat(60));
      console.log(`🏢 Company: ${company.name}`);
      console.log(`📅 Year: ${year}`);
      console.log(`📊 Status: ${emission.status.toUpperCase()}`);
      console.log(`📈 Emission: ${emission.actual}/${emission.limit} tons CO2`);

      if (carbonBalance > 0) {
        console.log(`🎉 Action: MINTED ${carbonBalance} CCT tokens`);
      } else if (carbonBalance < 0) {
        console.log(`💳 Action: SET DEBT ${Math.abs(carbonBalance)} units`);
      } else {
        console.log(`⚖️  Action: NO CHANGE (perfect balance)`);
      }

      console.log(`💰 CCT Balance: ${hre.ethers.formatEther(cctBalance)} CCT`);
      console.log(`💳 Carbon Debt: ${carbonDebt.toString()} units`);
      console.log(`🔄 Transfer Enabled: ${canTransfer ? "✅ YES" : "❌ NO"}`);
      console.log("=".repeat(60));
    } catch (error) {
      console.error("❌ Emission update failed:", error.message);
      process.exit(1);
    }
  }

  async function ensureOracleSet(token, oracleSigner) {
    const currentOracle = await token.oracle();
    if (currentOracle.toLowerCase() !== oracleSigner.address.toLowerCase()) {
      console.log("🔧 Setting oracle...");
      await token.setOracle(oracleSigner.address);
      console.log("✅ Oracle set");
    }
  }

  async function handleProjectValidationError(
    validationResult,
    projectId,
    receiverAddress
  ) {
    console.log("❌ Project validation failed");

    switch (validationResult.errorType) {
      case "invalid_wallet":
        console.log("❌ ERROR: WALLET NOT REGISTERED");
        console.log(
          `   Wallet ${receiverAddress} tidak terdaftar dalam sistem`
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
              `      ${idx + 1}. ${proj.id} - ${proj.name} (Used: ${proj.used})`
            );
          });
        }
        throw new Error(`Project ID "${projectId}" tidak ditemukan`);

      case "unauthorized_project":
        console.log("❌ ERROR: PROJECT NOT OWNED BY YOUR COMPANY");
        console.log("   Available projects for your company:");
        if (validationResult.availableProjects) {
          validationResult.availableProjects.forEach((proj, idx) => {
            console.log(
              `      ${idx + 1}. ${proj.id} - ${proj.name} (${
                proj.offsetTon
              } tons)`
            );
          });
        }
        throw new Error(`Project "${projectId}" bukan milik perusahaan Anda.`);

      case "project_used":
        console.log("❌ ERROR: PROJECT ALREADY USED");
        console.log(`   Project "${projectId}" sudah pernah digunakan`);
        console.log("   Available projects for your company:");
        if (validationResult.availableProjects) {
          validationResult.availableProjects.forEach((proj, idx) => {
            console.log(
              `      ${idx + 1}. ${proj.id} - ${proj.name} (${
                proj.offsetTon
              } tons)`
            );
          });
        }
        throw new Error(
          `Project "${projectId}" sudah pernah digunakan sebelumnya`
        );

      default:
        throw new Error(
          validationResult.message || "Project validation failed"
        );
    }
  }

  async function markProjectAsUsed(projectId) {
    try {
      const { default: fetch } = await import("node-fetch");
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
  }
}

main().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
