const { ethers } = require("hardhat");

// ===== CONFIGURATION =====
const CONFIG = {
  TOKEN_NAME: "Carbon Credit Token",
  TOKEN_SYMBOL: "CCT",
  NETWORK_NAME: "localhost", // Could be made dynamic
};

// ===== MAIN DEPLOYMENT FUNCTION =====
async function main() {
  console.log("🚀 CARBON CREDIT TOKEN DEPLOYMENT");
  console.log("=".repeat(50));

  try {
    // Initialize deployment
    const deployer = await initializeDeployment();

    // Deploy contract
    const token = await deployContract(deployer);
    const contractAddress = await getContractAddress(token);

    // Setup oracle
    await setupOracle(token, deployer);

    // Verify deployment
    await verifyDeployment(token, contractAddress, deployer);

    // Display results
    displayDeploymentResults(contractAddress, deployer.address);
  } catch (error) {
    handleDeploymentError(error);
  }
}

// ===== DEPLOYMENT FUNCTIONS =====
async function initializeDeployment() {
  console.log("🔧 Initializing deployment...");

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("👤 Deployer Account:", deployer.address);
  console.log("💰 Account Balance:", ethers.formatEther(balance), "ETH");

  // Check if balance is sufficient
  if (balance === 0n) {
    throw new Error("Deployer account has no ETH balance");
  }

  console.log("✅ Account validation passed");
  return deployer;
}

async function deployContract(deployer) {
  console.log("\n📦 Deploying CarbonCreditToken...");
  console.log("📄 Token Name:", CONFIG.TOKEN_NAME);
  console.log("🏷️  Token Symbol:", CONFIG.TOKEN_SYMBOL);

  try {
    const CarbonCreditToken = await ethers.getContractFactory(
      "CarbonCreditToken"
    );

    console.log("⏳ Sending deployment transaction...");
    const token = await CarbonCreditToken.deploy(
      CONFIG.TOKEN_NAME,
      CONFIG.TOKEN_SYMBOL
    );

    console.log("⏳ Waiting for deployment confirmation...");
    await token.waitForDeployment();

    console.log("✅ Contract deployed successfully");
    return token;
  } catch (error) {
    console.error("❌ Contract deployment failed:", error.message);
    throw error;
  }
}

async function getContractAddress(token) {
  // Compatible with different ethers versions
  const address = token.target || token.address || (await token.getAddress());

  if (!address || address === "0x0000000000000000000000000000000000000000") {
    throw new Error("Invalid contract address received");
  }

  console.log("📍 Contract Address:", address);
  return address;
}

async function setupOracle(token, deployer) {
  console.log("\n🔮 Setting up oracle...");
  console.log("🔑 Oracle Address:", deployer.address);

  try {
    const tx = await token.setOracle(deployer.address);
    console.log("📝 Transaction Hash:", tx.hash);

    await tx.wait();
    console.log("✅ Oracle setup completed");

    // Verify oracle was set correctly
    const currentOracle = await token.oracle();
    if (currentOracle.toLowerCase() !== deployer.address.toLowerCase()) {
      throw new Error("Oracle verification failed");
    }

    console.log("✅ Oracle verification passed");
  } catch (error) {
    console.error("❌ Oracle setup failed:", error.message);
    throw error;
  }
}

async function verifyDeployment(token, contractAddress, deployer) {
  console.log("\n🔍 Verifying deployment...");

  try {
    // Check contract code exists
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x") {
      throw new Error("No contract code found at deployment address");
    }

    // Verify contract functions
    const verificationResults = await runContractVerification(token);

    console.log("✅ Deployment verification completed");
    logVerificationResults(verificationResults);
  } catch (error) {
    console.error("❌ Deployment verification failed:", error.message);
    throw error;
  }
}

async function runContractVerification(token) {
  const results = {};

  try {
    results.name = await token.name();
    results.symbol = await token.symbol();
    results.decimals = await token.decimals();
    results.totalSupply = await token.totalSupply();
    results.oracle = await token.oracle();

    return results;
  } catch (error) {
    console.warn(
      "⚠️ Some contract functions may not be accessible:",
      error.message
    );
    return results;
  }
}

function logVerificationResults(results) {
  console.log("📊 Contract Information:");
  console.log(`   📄 Name: ${results.name || "Unknown"}`);
  console.log(`   🏷️  Symbol: ${results.symbol || "Unknown"}`);
  console.log(`   🔢 Decimals: ${results.decimals || "Unknown"}`);
  console.log(
    `   💰 Total Supply: ${
      results.totalSupply ? ethers.formatEther(results.totalSupply) : "Unknown"
    } tokens`
  );
  console.log(`   🔮 Oracle: ${results.oracle || "Unknown"}`);
}

// ===== RESULT DISPLAY =====
function displayDeploymentResults(contractAddress, oracleAddress) {
  console.log("\n" + "=".repeat(50));
  console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
  console.log("=".repeat(50));
  console.log("📋 Deployment Summary:");
  console.log(`   📍 Contract Address: ${contractAddress}`);
  console.log(`   🔑 Oracle Address: ${oracleAddress}`);
  console.log(`   🌐 Network: ${CONFIG.NETWORK_NAME}`);
  console.log(`   📄 Token: ${CONFIG.TOKEN_NAME} (${CONFIG.TOKEN_SYMBOL})`);

  console.log("\n📝 Next Steps:");
  console.log("1. Update your config.js file:");
  console.log(`   export const address = "${contractAddress}";`);
  console.log("2. Start your API server (port 3002)");
  console.log("3. Start your frontend application");
  console.log("4. Test token minting with oracle script");

  console.log("\n🚀 Emision Test Commands:");
  console.log(
    `   MODE=emission COMPANY_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 YEAR=2024 npx hardhat run scripts/mockOracle.js --network localhost`
  );

  console.log("\n" + "=".repeat(50));
}

// ===== ERROR HANDLING =====
function handleDeploymentError(error) {
  console.log("\n" + "=".repeat(50));
  console.error("❌ DEPLOYMENT FAILED!");
  console.log("=".repeat(50));

  // Categorize common errors
  const errorHandlers = {
    "insufficient funds": () => {
      console.error("💰 Error: Insufficient ETH balance");
      console.log("💡 Solution: Add ETH to your deployer account");
    },
    network: () => {
      console.error("🌐 Error: Network connection issue");
      console.log("💡 Solution: Check if Hardhat node is running");
    },
    gas: () => {
      console.error("⛽ Error: Gas estimation failed");
      console.log("💡 Solution: Check contract size or gas limits");
    },
    revert: () => {
      console.error("🔄 Error: Transaction reverted");
      console.log("💡 Solution: Check constructor parameters");
    },
  };

  const errorType = Object.keys(errorHandlers).find((key) =>
    error.message.toLowerCase().includes(key)
  );

  if (errorType) {
    errorHandlers[errorType]();
  } else {
    console.error("❌ Unexpected error:", error.message);
  }

  console.log("\n🔧 Troubleshooting:");
  console.log("1. Ensure Hardhat node is running: npx hardhat node");
  console.log("2. Check if accounts have sufficient ETH");
  console.log("3. Verify contract compilation: npx hardhat compile");
  console.log("4. Check network configuration in hardhat.config.js");

  console.log("\n" + "=".repeat(50));
  process.exit(1);
}

// ===== SCRIPT EXECUTION =====
main()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    // This should not be reached due to error handling in main()
    console.error("❌ Unexpected script error:", error);
    process.exit(1);
  });
