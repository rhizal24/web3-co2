const hre = require("hardhat");

async function main() {
  const [oracleSigner] = await hre.ethers.getSigners();

  // UPDATE INI DENGAN ADDRESS HASIL DEPLOY BARU
  const tokenAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
  const receiverAddress =
    process.env.RECEIVER_ADDRESS ||
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const projectId = process.env.PROJECT_ID || "proj1";

  console.log("🚀 Mock Oracle - Dynamic Project Processing");
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

    console.log("🔍 Step 1: Getting wallet info...");
    let walletInfo = null;

    try {
      const walletResponse = await fetch(
        `http://localhost:3002/api/wallet/${receiverAddress}`
      );
      if (walletResponse.ok) {
        walletInfo = await walletResponse.json();
        console.log("✅ Wallet info:", walletInfo);
      } else {
        throw new Error("Wallet not found");
      }
    } catch (error) {
      console.log("❌ Could not get wallet info:", error.message);
      return;
    }

    if (walletInfo && walletInfo.companyId) {
      console.log("🔍 Step 2: Validating project...");

      try {
        // Get projects untuk company ini
        const projectResponse = await fetch(
          `http://localhost:3002/api/carbon-offset-projects?companyId=${walletInfo.companyId}`
        );

        if (projectResponse.ok) {
          const projects = await projectResponse.json();
          console.log("📋 Available projects:", projects.length);

          // Find specific project
          const validProject = projects.find(
            (p) => p.id === projectId && !p.used
          );

          if (!validProject) {
            console.log("❌ Project tidak valid atau sudah digunakan!");
            console.log(
              "🔍 Available projects for company",
              walletInfo.companyId + ":"
            );
            projects.forEach((project, index) => {
              if (project.companyId === walletInfo.companyId) {
                console.log(
                  `   ${index + 1}. ID: ${project.id}, Offset: ${
                    project.offsetTon
                  }T, Used: ${project.used}`
                );
              }
            });
            throw new Error(`Project ${projectId} tidak valid`);
          }

          console.log("✅ Valid project found:", validProject);

          // 🔥 INI YANG DIPERBAIKI - Gunakan offsetTon dari project
          const offsetAmount = validProject.offsetTon; // Ambil nilai sebenarnya
          const amountToMint = hre.ethers.parseEther(offsetAmount.toString());

          console.log(
            `🎯 Minting ${offsetAmount} CCT for project ${projectId}...`
          );
          console.log(`📊 Project details:`);
          console.log(`   - Name: ${validProject.projectName}`);
          console.log(`   - Offset: ${validProject.offsetTon} tons`);
          console.log(`   - Description: ${validProject.description}`);

          // Mint tokens dengan amount yang benar
          const tx = await token
            .connect(oracleSigner)
            .mintCarbonCredit(receiverAddress, amountToMint, projectId);
          console.log("📝 Transaction hash:", tx.hash);
          await tx.wait();
          console.log("✅ Minting successful!");

          // Mark project as used di API (optional)
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
            }
          } catch (markError) {
            console.log("⚠️ Could not mark project as used in API");
          }

          // Check balance
          const balance = await token.balanceOf(receiverAddress);
          const formattedBalance = hre.ethers.formatEther(balance);

          // Check if project is marked as used in contract
          try {
            const isUsed = await token.isProjectUsed(projectId);
            console.log("📊 Project marked as used in contract:", isUsed);
          } catch (error) {
            console.log("⚠️ Could not check project status in contract");
          }

          console.log("\n" + "=".repeat(50));
          console.log("🎉 MOCK ORACLE SUCCESS!");
          console.log("=".repeat(50));
          console.log(`✅ Project: ${projectId} (${validProject.projectName})`);
          console.log(
            `💰 Minted: ${offsetAmount} CCT (based on project offset)`
          );
          console.log(`💰 Total balance: ${formattedBalance} CCT`);
          console.log(`📝 Transaction: ${tx.hash}`);
          console.log(`🏢 Company: ${walletInfo.name}`);
          console.log("=".repeat(50));
        } else {
          throw new Error("Could not fetch projects from API");
        }
      } catch (projectError) {
        console.log("❌ Project validation failed:", projectError.message);
        return;
      }
    } else {
      console.log("❌ No valid wallet info found");
      return;
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

main().catch(console.error);
