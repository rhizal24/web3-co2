const hre = require("hardhat");
const fetch = require("node-fetch");

async function main() {
  const [oracleSigner] = await hre.ethers.getSigners();

  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // Get arguments from command line or use default
  const args = process.argv.slice(2);
  const receiverAddress =
    args[0] || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const projectId = args[1]; // Project ID yang diinput user

  if (!projectId) {
    console.log("❌ Project ID diperlukan!");
    console.log(
      "Usage: node scripts/mockOracle.js <receiverAddress> <projectId>"
    );
    console.log(
      "Example: node scripts/mockOracle.js 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 proj1"
    );
    return;
  }

  const CarbonCreditToken = await hre.ethers.getContractFactory(
    "CarbonCreditToken"
  );
  const token = CarbonCreditToken.attach(tokenAddress);

  try {
    console.log("🔍 Step 1: Getting wallet info...");
    console.log("👤 Receiver address:", receiverAddress);
    console.log("🆔 Project ID:", projectId);

    const walletInfoResponse = await fetch(
      `http://localhost:3002/api/wallet/${receiverAddress.toLowerCase()}`
    );

    if (!walletInfoResponse.ok) {
      throw new Error("Wallet address tidak ditemukan di API mapping");
    }

    const walletInfo = await walletInfoResponse.json();
    console.log("✅ Wallet info:", walletInfo);

    console.log("🔍 Step 2: Validating carbon offset project...");
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

    console.log("🔍 Step 3: Getting emission limit...");
    const emissionLimitResponse = await fetch(
      `http://localhost:3002/api/emission-limits/${walletInfo.type.toLowerCase()}`
    );
    if (!emissionLimitResponse.ok) {
      throw new Error("Jenis perusahaan tidak ditemukan di API batas emisi");
    }
    const emissionLimit = await emissionLimitResponse.json();
    console.log("✅ Emission limit:", emissionLimit);

    console.log("🔍 Step 4: Getting company emissions (current year)...");
    const year = new Date().getFullYear();
    console.log(`📅 Current year: ${year}`);

    const emissionsResponse = await fetch(
      `http://localhost:3002/api/company-emissions?companyId=${walletInfo.companyId}&year=${year}`
    );

    if (!emissionsResponse.ok) {
      console.error(`❌ API Response Status: ${emissionsResponse.status}`);
      throw new Error("Failed to fetch company emissions");
    }

    const emissionsData = await emissionsResponse.json();
    console.log("📊 Emissions data:", emissionsData);

    const companyEmission = emissionsData.find(
      (c) => c.companyId === walletInfo.companyId && c.year === year
    );

    if (!companyEmission) {
      throw new Error(`Data emisi untuk tahun ${year} tidak ditemukan`);
    }

    console.log("✅ Company emission data:", companyEmission);

    console.log("🔍 Step 5: Calculating carbon credit from project...");

    // Hitung kredit karbon berdasarkan project offset saja
    const projectOffsetTon = validProject.offsetTon;
    const emissionTon = companyEmission.emissionTon;
    const emissionLimitValue = emissionLimit.limit;

    // Logika perhitungan kredit karbon
    let carbonCredit = 0;

    if (emissionTon <= emissionLimitValue) {
      // Jika emisi di bawah batas, kredit = project offset + sisa kuota
      const remainingQuota = emissionLimitValue - emissionTon;
      carbonCredit = projectOffsetTon + remainingQuota;
      console.log("✅ Status: Emisi dalam batas");
      console.log(`   📊 Remaining quota: ${remainingQuota} ton`);
      console.log(`   🌱 Project offset: ${projectOffsetTon} ton`);
      console.log(`   💰 Total credit: ${carbonCredit} CCT`);
    } else {
      // Jika emisi di atas batas, kredit = project offset - kelebihan emisi
      const excessEmission = emissionTon - emissionLimitValue;
      carbonCredit = projectOffsetTon - excessEmission;
      console.log("⚠️ Status: Emisi melebihi batas");
      console.log(`   📊 Excess emission: ${excessEmission} ton`);
      console.log(`   🌱 Project offset: ${projectOffsetTon} ton`);
      console.log(`   💰 Net credit: ${carbonCredit} CCT`);
    }

    if (carbonCredit <= 0) {
      console.log(
        "ℹ️ Project offset tidak cukup untuk menghasilkan kredit positif."
      );
      console.log(`💳 Debt akan bertambah: ${Math.abs(carbonCredit)} CCT`);
    }

    console.log("🔄 Step 6: Minting carbon credit tokens...");
    const amountToMint = hre.ethers.parseEther(carbonCredit.toString());

    const tx = await token
      .connect(oracleSigner)
      .updateCarbonCredit(receiverAddress, amountToMint);

    console.log("📝 Transaction hash:", tx.hash);
    await tx.wait();

    console.log("🔄 Step 7: Marking project as used...");
    // TODO: Call API to mark project as used
    await fetch(
      `http://localhost:3002/api/carbon-offset-projects/${projectId}/use`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ used: true }),
      }
    );

    console.log(`✅ Oracle berhasil memproses project ${projectId}`);
    console.log(
      `✅ Carbon credit di-mint: ${carbonCredit} CCT untuk ${receiverAddress}`
    );
    console.log(`✅ Project ${projectId} telah dimarkir sebagai terpakai`);
  } catch (error) {
    console.error("❌ Error dalam mock oracle:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error in mock oracle:", error.message);
    process.exit(1);
  });
