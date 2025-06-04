const hre = require("hardhat");

// Use dynamic import for node-fetch (ESM module)
async function importFetch() {
  const { default: fetch } = await import("node-fetch");
  return fetch;
}

async function main() {
  const fetch = await importFetch();
  const [oracleSigner] = await hre.ethers.getSigners();

  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Get arguments from command line or use default
  const args = process.argv.slice(2);
  const receiverAddress =
    args[0] || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const projectId = args[1]; // Project ID yang diinput user

  console.log("🚀 Starting Mock Oracle...");
  console.log("📍 Contract Address:", tokenAddress);
  console.log("👤 Receiver Address:", receiverAddress);
  console.log("🆔 Project ID:", projectId);

  if (!projectId) {
    console.log("❌ Project ID diperlukan!");
    console.log(
      "Usage: npx hardhat run scripts/mockOracle.js --network localhost -- <receiverAddress> <projectId>"
    );
    console.log(
      "Example: npx hardhat run scripts/mockOracle.js --network localhost -- 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 proj1"
    );
    return;
  }

  try {
    console.log("🔍 Step 0: Checking contract deployment...");

    // Check if contract is deployed
    const code = await hre.ethers.provider.getCode(tokenAddress);
    console.log("📄 Contract code length:", code.length);

    if (code === "0x") {
      throw new Error(`❌ Contract not deployed at address ${tokenAddress}`);
    }
    console.log("✅ Contract found at address:", tokenAddress);

    // Get contract instance
    const CarbonCreditToken = await hre.ethers.getContractFactory(
      "CarbonCreditToken"
    );
    const token = CarbonCreditToken.attach(tokenAddress);

    // Check oracle setup
    try {
      const currentOracle = await token.oracle();
      console.log("📋 Current oracle:", currentOracle);
      console.log("🔐 Oracle signer:", oracleSigner.address);

      if (currentOracle.toLowerCase() !== oracleSigner.address.toLowerCase()) {
        console.log("⚠️ Setting oracle address...");
        const setOracleTx = await token
          .connect(oracleSigner)
          .setOracle(oracleSigner.address);
        await setOracleTx.wait();
        console.log("✅ Oracle updated");
      }
    } catch (error) {
      console.warn("⚠️ Could not check/set oracle:", error.message);
    }

    console.log("🔍 Step 1: Testing API connection...");

    // Test API connection first
    try {
      const testResponse = await fetch(
        "http://localhost:3002/api/wallet/debug"
      );
      if (!testResponse.ok) {
        throw new Error(`API Server not responding: ${testResponse.status}`);
      }
      console.log("✅ API Server is running");
    } catch (error) {
      console.error("❌ API Server not accessible:", error.message);
      console.log("💡 Please start API server:");
      console.log("   cd contract/api");
      console.log("   node apiServer.js");
      throw error;
    }

    console.log("🔍 Step 2: Getting wallet info...");

    // Try both original address and lowercase for API call
    let walletInfoResponse = await fetch(
      `http://localhost:3002/api/wallet/${receiverAddress}`
    );

    // If not found, try with lowercase
    if (!walletInfoResponse.ok) {
      console.log("⚠️ Trying with lowercase address...");
      walletInfoResponse = await fetch(
        `http://localhost:3002/api/wallet/${receiverAddress.toLowerCase()}`
      );
    }

    if (!walletInfoResponse.ok) {
      console.error("❌ Wallet address not found in API mapping");
      console.log("🔍 Available wallet addresses:");

      try {
        const debugResponse = await fetch(
          `http://localhost:3002/api/wallet/debug`
        );
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log(debugData);
        }
      } catch (debugError) {
        console.warn("Could not fetch debug info");
      }

      throw new Error("Wallet address tidak ditemukan di API mapping");
    }

    const walletInfo = await walletInfoResponse.json();
    console.log("✅ Wallet info:", walletInfo);

    // Continue with rest of the process...
    console.log("🔍 Step 3: Validating carbon offset project...");
    const offsetResponse = await fetch(
      `http://localhost:3002/api/carbon-offset-projects?projectId=${projectId}&companyId=${walletInfo.companyId}`
    );

    if (!offsetResponse.ok) {
      throw new Error("Project tidak ditemukan atau tidak valid");
    }

    const offsetData = await offsetResponse.json();
    console.log("📊 Project data:", offsetData);

    const validProject = offsetData.find(
      (project) =>
        project.id === projectId &&
        project.companyId === walletInfo.companyId &&
        !project.used
    );

    if (!validProject) {
      console.error("❌ Project validation failed!");
      console.log("🔍 Available projects for this company:");
      offsetData.forEach((project, index) => {
        if (project.companyId === walletInfo.companyId) {
          console.log(
            `   ${index + 1}. ProjectId: ${project.id}, OffsetTon: ${
              project.offsetTon
            }, Used: ${project.used}`
          );
        }
      });
      throw new Error("Project ID tidak valid atau sudah digunakan");
    }

    console.log("✅ Valid project found:", validProject);

    // Simple minting for testing
    console.log("🔄 Step 4: Minting test carbon credits...");
    const amountToMint = hre.ethers.parseEther("10"); // Mint 10 CCT for testing

    const tx = await token
      .connect(oracleSigner)
      .mintCarbonCredit(receiverAddress, amountToMint, projectId);
    console.log("📝 Transaction hash:", tx.hash);
    await tx.wait();
    console.log("✅ 10 CCT minted successfully!");

    // Check balance
    const balance = await token.balanceOf(receiverAddress);
    const formattedBalance = hre.ethers.formatEther(balance);
    console.log("💰 New balance:", formattedBalance, "CCT");

    console.log("\n" + "=".repeat(50));
    console.log("🎉 MOCK ORACLE PROCESSING COMPLETE");
    console.log("=".repeat(50));
    console.log(`✅ Project: ${projectId}`);
    console.log(`👤 Receiver: ${receiverAddress}`);
    console.log(`💰 Minted: 10 CCT`);
    console.log(`📝 Transaction: ${tx.hash}`);
    console.log(`💰 Total balance: ${formattedBalance} CCT`);
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Error dalam mock oracle:", error.message);
    console.log("\n🔧 Troubleshooting checklist:");
    console.log("1. ✓ Hardhat node running: npx hardhat node");
    console.log(
      "2. ✓ Contract deployed: npx hardhat run scripts/deploy.js --network localhost"
    );
    console.log("3. ✓ API server running: node contract/api/apiServer.js");
    console.log(
      "4. ✓ Using correct command: npx hardhat run scripts/mockOracle.js --network localhost -- <address> <projectId>"
    );
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error in mock oracle:", error.message);
    process.exit(1);
  });
