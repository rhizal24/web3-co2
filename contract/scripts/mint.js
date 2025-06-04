async function main() {
  const tokenAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const [oracle] = await ethers.getSigners();

  const CarbonCreditToken = await ethers.getContractFactory(
    "CarbonCreditToken"
  );
  const token = CarbonCreditToken.attach(tokenAddress);

  const tx = await token.connect(oracle).mint(oracle.address, 50);
  await tx.wait();

  console.log(`Minted 50 tokens to oracle address: ${oracle.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
