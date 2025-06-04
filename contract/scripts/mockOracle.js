const hre = require("hardhat");
const fetch = require("node-fetch");

async function main() {
  const [oracleSigner] = await hre.ethers.getSigners();

  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Ganti dengan alamat kontrak yang benar
  const receiverAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"; // Alamat wallet perusahaan

  const CarbonCreditToken = await hre.ethers.getContractFactory(
    "CarbonCreditToken"
  );
  const token = CarbonCreditToken.attach(tokenAddress);

  // 1. Ambil data wallet
  const walletInfoResponse = await fetch(
    `http://localhost:3002/api/wallet/${receiverAddress.toLowerCase()}`
  );
  if (!walletInfoResponse.ok) {
    throw new Error("Wallet address tidak ditemukan di API mapping");
  }
  const walletInfo = await walletInfoResponse.json();
  console.log("Wallet info:", walletInfo);

  // 2. Ambil batas emisi perusahaan berdasarkan jenis
  const emissionLimitResponse = await fetch(
    `http://localhost:3002/api/emission-limits/${walletInfo.type.toLowerCase()}`
  );
  if (!emissionLimitResponse.ok) {
    throw new Error("Jenis perusahaan tidak ditemukan di API batas emisi");
  }
  const emissionLimit = await emissionLimitResponse.json();
  console.log("Emission limit:", emissionLimit);

  // 3. Ambil data emisi perusahaan dari API
  const year = new Date().getFullYear();
  const emissionsResponse = await fetch(
    `http://localhost:3002/api/company-emissions?companyId=${walletInfo.companyId}&year=${year}`
  );
  const emissionsData = await emissionsResponse.json();
  const companyEmission = emissionsData.find(
    (c) => c.companyId === walletInfo.companyId && c.year === year
  );
  if (!companyEmission) {
    throw new Error("Data emisi perusahaan tidak ditemukan");
  }
  console.log("Company emission data:", companyEmission);

  // 4. Ambil data offset karbon (proyek penghijauan)
  const offsetResponse = await fetch(
    `http://localhost:3002/api/carbon-offset-projects?companyId=${walletInfo.companyId}`
  );
  const offsetData = await offsetResponse.json();
  const companyOffset = offsetData.find(
    (c) => c.companyId === walletInfo.companyId
  );
  const offsetTon = companyOffset ? companyOffset.offsetTon : 0;
  console.log("Company carbon offset:", offsetTon);

  // 5. Hitung saldo karbon bersih
  const netCarbonBalance = offsetTon - companyEmission.emissionTon;
  const emissionLimitValue = emissionLimit.limit;

  let amountToMintOrDebt = 0;

  if (companyEmission.emissionTon <= emissionLimitValue) {
    amountToMintOrDebt =
      emissionLimitValue - companyEmission.emissionTon + offsetTon;
    console.log("Status: Kredit karbon, amount to mint:", amountToMintOrDebt);
  } else {
    amountToMintOrDebt = offsetTon - companyEmission.emissionTon;
    console.log("Status: Utang karbon, amount (negatif):", amountToMintOrDebt);
  }

  if (amountToMintOrDebt === 0) {
    console.log("Tidak ada perubahan saldo karbon, tidak melakukan transaksi.");
    return;
  }

  // 6. Kirim update ke smart contract
  const tx = await token
    .connect(oracleSigner)
    .updateCarbonCredit(receiverAddress, amountToMintOrDebt);
  await tx.wait();

  console.log(
    `Oracle updateCarbonCredit done for ${receiverAddress} with amount ${amountToMintOrDebt}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in mock oracle:", error);
    process.exit(1);
  });
