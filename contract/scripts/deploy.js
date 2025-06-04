const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contract with account:", deployer.address);
  console.log(
    "Account balance:",
    (await ethers.provider.getBalance(deployer.address)).toString()
  );

  const CarbonCreditToken = await ethers.getContractFactory(
    "CarbonCreditToken"
  );

  console.log("Deploying CarbonCreditToken...");
  const token = await CarbonCreditToken.deploy("Carbon Credit Token", "CCT");

  console.log("Waiting for deployment...");
  await token.waitForDeployment();

  // Get contract address (compatible with different ethers versions)
  const address = token.target || token.address || (await token.getAddress());

  console.log("CarbonCreditToken deployed to:", address);

  // Set oracle (deployer sebagai oracle untuk testing)
  console.log("Setting oracle...");
  await token.setOracle(deployer.address);
  console.log("Oracle set to deployer:", deployer.address);

  // Save deployment info
  console.log("\n🎉 Deployment successful!");
  console.log("📋 Contract Address:", address);
  console.log("🔑 Oracle Address:", deployer.address);
  console.log("\n📝 Update your config.js with this address:");
  console.log(`export const address = "${address}";`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
