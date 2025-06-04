const hre = require("hardhat");

async function main() {
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const receiverAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const [signer] = await hre.ethers.getSigners();
  const CarbonCreditToken = await hre.ethers.getContractFactory(
    "CarbonCreditToken"
  );
  const token = CarbonCreditToken.attach(tokenAddress);

  console.log("🪙 Minting additional 500 CCT tokens...");

  // Mint 500 more CCT tokens
  const amountToMint = hre.ethers.parseEther("500");

  const tx = await token.updateCarbonCredit(receiverAddress, amountToMint);
  console.log("📝 Transaction hash:", tx.hash);
  await tx.wait();

  console.log("✅ Successfully minted 500 more CCT tokens!");

  // Check new total balance
  const balance = await token.balanceOf(receiverAddress);
  console.log("💰 New total balance:", hre.ethers.formatEther(balance), "CCT");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
