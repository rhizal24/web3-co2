async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contract with account:", deployer.address);

  const CarbonCreditToken = await ethers.getContractFactory(
    "CarbonCreditToken"
  );
  const token = await CarbonCreditToken.deploy("Carbon Credit Token", "CCT");

  await token.waitForDeployment();

  const address =
    token.address ||
    token.target ||
    (token.getAddress ? await token.getAddress() : null);

  console.log("CarbonCreditToken deployed at:", address);

  await token.setOracle(deployer.address);
  console.log("Oracle set to deployer:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
