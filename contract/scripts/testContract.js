const hre = require("hardhat");

async function main() {
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const testAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  console.log("🔍 Testing contract at:", tokenAddress);

  try {
    // Check if contract exists
    const code = await hre.ethers.provider.getCode(tokenAddress);
    console.log("📄 Contract code length:", code.length);

    if (code === "0x") {
      console.error("❌ No contract found at this address!");
      return;
    }

    // Get contract instance
    const CarbonCreditToken = await hre.ethers.getContractFactory(
      "CarbonCreditToken"
    );
    const token = CarbonCreditToken.attach(tokenAddress);

    // Test basic functions
    console.log("🔍 Testing basic functions...");

    try {
      const name = await token.name();
      console.log("✅ Name:", name);
    } catch (error) {
      console.error("❌ Error getting name:", error.message);
    }

    try {
      const symbol = await token.symbol();
      console.log("✅ Symbol:", symbol);
    } catch (error) {
      console.error("❌ Error getting symbol:", error.message);
    }

    try {
      const balance = await token.balanceOf(testAddress);
      console.log("✅ Balance:", hre.ethers.formatEther(balance));
    } catch (error) {
      console.error("❌ Error getting balance:", error.message);
    }

    try {
      const oracle = await token.oracle();
      console.log("✅ Oracle:", oracle);
    } catch (error) {
      console.error("❌ Error getting oracle:", error.message);
    }

    console.log("✅ Contract test completed");
  } catch (error) {
    console.error("❌ Error testing contract:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
