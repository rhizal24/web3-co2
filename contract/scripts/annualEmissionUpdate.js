const hre = require("hardhat");
const fetch = require("node-fetch");

async function updateAnnualEmissions() {
  console.log("🔄 Starting annual emission difference update...");

  const currentYear = new Date().getFullYear();
  console.log(`📅 Processing for year: ${currentYear}`);

  try {
    // Get all companies
    const walletsResponse = await fetch("http://localhost:3002/api/wallets");
    const wallets = await walletsResponse.json();

    for (const [address, walletInfo] of Object.entries(wallets)) {
      console.log(`\n👤 Processing company: ${walletInfo.name}`);

      // Get emission data for current year
      const emissionResponse = await fetch(
        `http://localhost:3002/api/company-emissions?companyId=${walletInfo.companyId}&year=${currentYear}`
      );

      if (!emissionResponse.ok) {
        console.log(
          `⚠️ No emission data for ${walletInfo.name} in ${currentYear}`
        );
        continue;
      }

      const emissionData = await emissionResponse.json();
      const companyEmission = emissionData.find(
        (e) => e.companyId === walletInfo.companyId
      );

      if (!companyEmission) {
        console.log(`⚠️ No emission found for ${walletInfo.name}`);
        continue;
      }

      // Get emission limit
      const limitResponse = await fetch(
        `http://localhost:3002/api/emission-limits/${walletInfo.type.toLowerCase()}`
      );
      const limitData = await limitResponse.json();

      // Calculate difference
      const emissionDifference = companyEmission.emissionTon - limitData.limit;

      if (emissionDifference > 0) {
        console.log(
          `📊 ${walletInfo.name}: Excess emission ${emissionDifference} ton`
        );
        console.log(`💳 Adding debt: ${emissionDifference} CCT`);

        // Add debt to blockchain
        const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const CarbonCreditToken = await hre.ethers.getContractFactory(
          "CarbonCreditToken"
        );
        const token = CarbonCreditToken.attach(tokenAddress);

        const [oracleSigner] = await hre.ethers.getSigners();
        const debtAmount = hre.ethers.parseEther(emissionDifference.toString());

        // Add negative amount (debt)
        await token
          .connect(oracleSigner)
          .updateCarbonCredit(address, -debtAmount);
        console.log(`✅ Debt added for ${walletInfo.name}`);
      } else {
        console.log(`✅ ${walletInfo.name}: Within emission limit`);
      }
    }

    console.log("\n🎯 Annual emission update completed!");
  } catch (error) {
    console.error("❌ Error in annual update:", error);
  }
}

// Run if called directly
if (require.main === module) {
  updateAnnualEmissions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { updateAnnualEmissions };
