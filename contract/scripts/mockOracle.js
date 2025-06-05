const hre = require("hardhat");

// ===== CONFIGURATION =====
const CONFIG = {
  CONTRACT_ADDRESS: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  API_BASE_URL: "http://localhost:3002/api",
  DEFAULT_ADDRESSES: {
    RECEIVER: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    PROJECT_ID: "proj1",
    YEAR: "2024",
  },
};

// ===== MAIN FUNCTION =====
async function main() {
  const [oracleSigner] = await hre.ethers.getSigners();

  // Determine mode berdasarkan environment variables
  const mode = process.env.MODE || "project"; // "project" atau "emission"

  console.log("🚀 CARBON ORACLE STARTING...");
  console.log("=".repeat(60));
  console.log("🔧 Mode:", mode.toUpperCase());
  console.log("📍 Contract:", CONFIG.CONTRACT_ADDRESS);
  console.log("⚡ Oracle:", oracleSigner.address);
  console.log("=".repeat(60));

  if (mode === "project") {
    await handleProjectMinting(oracleSigner);
  } else if (mode === "emission") {
    await handleEmissionUpdate(oracleSigner);
  } else {
    console.log("❌ Invalid mode. Use MODE=project or MODE=emission");
    process.exit(1);
  }
}

// ===== PROJECT MINTING FUNCTIONS =====
async function handleProjectMinting(oracleSigner) {
  const receiverAddress =
    process.env.RECEIVER_ADDRESS || CONFIG.DEFAULT_ADDRESSES.RECEIVER;
  const projectId =
    process.env.PROJECT_ID || CONFIG.DEFAULT_ADDRESSES.PROJECT_ID;

  console.log("🚀 PROJECT MINTING MODE");
  console.log("👤 Receiver:", receiverAddress);
  console.log("🆔 Project ID:", projectId);
  console.log("=".repeat(60));

  try {
    // Initialize contract
    const token = await initializeContract();
    await ensureOracleSet(token, oracleSigner);

    // Validate project
    console.log("🔍 Step 1: Validating project ownership and availability...");
    const { project, wallet } = await validateProject(
      projectId,
      receiverAddress
    );

    console.log("✅ Project validation successful");
    console.log(`   Project: ${project.projectName}`);
    console.log(`   Company: ${wallet.name}`);
    console.log(`   Offset: ${project.offsetTon} tons`);

    // Check blockchain usage
    const isUsedInContract = await token.isProjectUsed(projectId);
    if (isUsedInContract) {
      throw new Error(
        `Project "${projectId}" sudah digunakan dalam smart contract`
      );
    }

    // Execute minting
    const offsetAmount = project.offsetTon;
    const amountToMint = hre.ethers.parseEther(offsetAmount.toString());

    console.log(
      `🎯 Step 2: Minting ${offsetAmount} CCT for project ${projectId}...`
    );
    const tx = await token
      .connect(oracleSigner)
      .mintCarbonCredit(receiverAddress, amountToMint, projectId);

    console.log("📝 Transaction hash:", tx.hash);
    await tx.wait();
    console.log("✅ Minting successful!");

    // Mark project as used
    await markProjectAsUsed(projectId);

    // Show results
    await showProjectResults(
      token,
      receiverAddress,
      projectId,
      project,
      wallet,
      offsetAmount,
      tx.hash
    );
  } catch (error) {
    console.error("❌ Project minting failed:", error.message);
    process.exit(1);
  }
}

async function validateProject(projectId, receiverAddress) {
  const { default: fetch } = await import("node-fetch");

  const response = await fetch(`${CONFIG.API_BASE_URL}/validate-project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, userAddress: receiverAddress }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    await handleProjectValidationError(result, projectId, receiverAddress);
    return;
  }

  return result;
}

async function markProjectAsUsed(projectId) {
  try {
    const { default: fetch } = await import("node-fetch");
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/carbon-offset-projects/${projectId}/use`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.ok) {
      console.log("✅ Step 3: Project marked as used in API");
    } else {
      console.log("⚠️ Could not mark project as used in API");
    }
  } catch (error) {
    console.log("⚠️ Error marking project as used in API:", error.message);
  }
}

async function showProjectResults(
  token,
  receiverAddress,
  projectId,
  project,
  wallet,
  offsetAmount,
  txHash
) {
  const balance = await token.balanceOf(receiverAddress);
  const formattedBalance = hre.ethers.formatEther(balance);

  console.log("\n" + "=".repeat(60));
  console.log("🎉 PROJECT MINTING SUCCESS!");
  console.log("=".repeat(60));
  console.log(`✅ Project: ${projectId} (${project.projectName})`);
  console.log(`💰 Minted: ${offsetAmount} CCT`);
  console.log(`💰 Total balance: ${formattedBalance} CCT`);
  console.log(`📝 Transaction: ${txHash}`);
  console.log(`🏢 Company: ${wallet.name}`);
  console.log("=".repeat(60));
}

// ===== EMISSION UPDATE FUNCTIONS =====
async function handleEmissionUpdate(oracleSigner) {
  const companyAddress =
    process.env.COMPANY_ADDRESS || CONFIG.DEFAULT_ADDRESSES.RECEIVER;
  const year = process.env.YEAR || CONFIG.DEFAULT_ADDRESSES.YEAR;

  console.log("🌍 EMISSION UPDATE MODE");
  console.log("📅 Year:", year);
  console.log("🏭 Company Address:", companyAddress);
  console.log("=".repeat(60));

  try {
    // Initialize contract
    const token = await initializeContract();
    await ensureOracleSet(token, oracleSigner);

    // Get emission data
    console.log("🔍 Step 1: Fetching emission data from API...");
    const emissionData = await getEmissionData(companyAddress, year);
    const { company, emission } = emissionData.data;

    displayEmissionInfo(company, emission);

    // Process carbon balance
    console.log("\n🔍 Step 2: Processing carbon balance...");
    await processCarbonBalance(
      token,
      oracleSigner,
      companyAddress,
      emission,
      company,
      year
    );

    // Show final results
    await showEmissionResults(token, companyAddress, company, year, emission);
  } catch (error) {
    console.error("❌ Emission update failed:", error.message);
    process.exit(1);
  }
}

async function getEmissionData(companyAddress, year) {
  const { default: fetch } = await import("node-fetch");

  const response = await fetch(
    `${CONFIG.API_BASE_URL}/emissions/${companyAddress}/${year}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch emission data");
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Invalid emission data response");
  }

  return data;
}

function displayEmissionInfo(company, emission) {
  console.log("✅ Emission data retrieved:");
  console.log(`   🏢 Company: ${company.name} (${company.type})`);
  console.log(`   📊 Emission Limit: ${emission.limit} tons CO2`);
  console.log(`   📈 Actual Emission: ${emission.actual} tons CO2`);
  console.log(`   ⚖️  Carbon Balance: ${emission.balance} tons CO2`);
  console.log(`   📋 Status: ${emission.status.toUpperCase()}`);
}

async function processCarbonBalance(
  token,
  oracleSigner,
  companyAddress,
  emission,
  company,
  year
) {
  const carbonBalance = emission.balance;
  const balanceInWei = hre.ethers.parseEther(
    Math.abs(carbonBalance).toString()
  );

  if (carbonBalance > 0) {
    // SURPLUS: Mint CCT tokens
    console.log(`🎉 SURPLUS DETECTED: +${carbonBalance} tons CO2`);
    await processSurplus(
      token,
      oracleSigner,
      companyAddress,
      carbonBalance,
      balanceInWei,
      company,
      year
    );
  } else if (carbonBalance < 0) {
    // DEFICIT: Set carbon debt
    console.log(`❌ DEFICIT DETECTED: ${carbonBalance} tons CO2`);
    await processDeficit(token, oracleSigner, companyAddress, carbonBalance);
  } else {
    // NEUTRAL
    console.log(`⚖️  NEUTRAL: Perfect balance (0 tons CO2)`);
    console.log(`✅ No action needed`);
  }
}

async function processSurplus(
  token,
  oracleSigner,
  companyAddress,
  carbonBalance,
  balanceInWei,
  company,
  year
) {
  console.log(`💰 Minting ${carbonBalance} CCT tokens...`);

  // Reset debt if exists
  const currentDebt = await token.getCarbonDebt(companyAddress);
  if (currentDebt < 0) {
    console.log(`🔄 Resetting previous debt...`);
    await token
      .connect(oracleSigner)
      .updateCarbonCredit(companyAddress, Math.abs(Number(currentDebt)));
  }

  // Mint surplus
  const projectId = `emission_${year}_${company.companyId}_surplus`;
  const mintTx = await token
    .connect(oracleSigner)
    .mintCarbonCredit(companyAddress, balanceInWei, projectId);

  console.log("📝 Mint Transaction:", mintTx.hash);
  await mintTx.wait();
  console.log("✅ CCT tokens minted successfully!");
}

async function processDeficit(
  token,
  oracleSigner,
  companyAddress,
  carbonBalance
) {
  console.log(`💳 Setting carbon debt: ${Math.abs(carbonBalance)} units`);

  const debtTx = await token
    .connect(oracleSigner)
    .updateCarbonCredit(
      companyAddress,
      hre.ethers.parseEther(carbonBalance.toString())
    );

  console.log("📝 Debt Transaction:", debtTx.hash);
  await debtTx.wait();
  console.log("✅ Carbon debt set successfully!");
}

async function showEmissionResults(
  token,
  companyAddress,
  company,
  year,
  emission
) {
  const cctBalance = await token.balanceOf(companyAddress);
  const carbonDebt = await token.getCarbonDebt(companyAddress);
  const canTransfer = await token.canTransfer(companyAddress);
  const carbonBalance = emission.balance;

  console.log("\n" + "=".repeat(60));
  console.log("🎉 EMISSION UPDATE COMPLETED!");
  console.log("=".repeat(60));
  console.log(`🏢 Company: ${company.name}`);
  console.log(`📅 Year: ${year}`);
  console.log(`📊 Status: ${emission.status.toUpperCase()}`);
  console.log(`📈 Emission: ${emission.actual}/${emission.limit} tons CO2`);

  if (carbonBalance > 0) {
    console.log(`🎉 Action: MINTED ${carbonBalance} CCT tokens`);
  } else if (carbonBalance < 0) {
    console.log(`💳 Action: SET DEBT ${Math.abs(carbonBalance)} units`);
  } else {
    console.log(`⚖️  Action: NO CHANGE (perfect balance)`);
  }

  console.log(`💰 CCT Balance: ${hre.ethers.formatEther(cctBalance)} CCT`);
  console.log(`💳 Carbon Debt: ${carbonDebt.toString()} units`);
  console.log(`🔄 Transfer Enabled: ${canTransfer ? "✅ YES" : "❌ NO"}`);
  console.log("=".repeat(60));
}

// ===== UTILITY FUNCTIONS =====
async function initializeContract() {
  // Check contract exists
  const code = await hre.ethers.provider.getCode(CONFIG.CONTRACT_ADDRESS);
  if (code === "0x") {
    throw new Error("❌ Contract tidak ditemukan - deploy dulu!");
  }

  const CarbonCreditToken = await hre.ethers.getContractFactory(
    "CarbonCreditToken"
  );
  return CarbonCreditToken.attach(CONFIG.CONTRACT_ADDRESS);
}

async function ensureOracleSet(token, oracleSigner) {
  const currentOracle = await token.oracle();
  if (currentOracle.toLowerCase() !== oracleSigner.address.toLowerCase()) {
    console.log("🔧 Setting oracle...");
    await token.setOracle(oracleSigner.address);
    console.log("✅ Oracle set");
  }
}

// ===== ERROR HANDLING =====
async function handleProjectValidationError(
  validationResult,
  projectId,
  receiverAddress
) {
  console.log("❌ Project validation failed");

  switch (validationResult.errorType) {
    case "invalid_wallet":
      console.log("❌ ERROR: WALLET NOT REGISTERED");
      console.log(`   Wallet ${receiverAddress} tidak terdaftar dalam sistem`);
      throw new Error(
        `Wallet address ${receiverAddress} tidak terdaftar dalam sistem`
      );

    case "invalid_project":
      console.log("❌ ERROR: PROJECT NOT FOUND");
      console.log(`   Project ID "${projectId}" tidak ditemukan`);
      if (validationResult.availableProjects) {
        console.log("   Available projects for your company:");
        validationResult.availableProjects.forEach((proj, idx) => {
          console.log(
            `      ${idx + 1}. ${proj.id} - ${proj.name} (Used: ${proj.used})`
          );
        });
      }
      throw new Error(`Project ID "${projectId}" tidak ditemukan`);

    case "unauthorized_project":
      console.log("❌ ERROR: PROJECT NOT OWNED BY YOUR COMPANY");
      console.log("   Available projects for your company:");
      if (validationResult.availableProjects) {
        validationResult.availableProjects.forEach((proj, idx) => {
          console.log(
            `      ${idx + 1}. ${proj.id} - ${proj.name} (${
              proj.offsetTon
            } tons)`
          );
        });
      }
      throw new Error(`Project "${projectId}" bukan milik perusahaan Anda.`);

    case "project_used":
      console.log("❌ ERROR: PROJECT ALREADY USED");
      console.log(`   Project "${projectId}" sudah pernah digunakan`);
      console.log("   Available projects for your company:");
      if (validationResult.availableProjects) {
        validationResult.availableProjects.forEach((proj, idx) => {
          console.log(
            `      ${idx + 1}. ${proj.id} - ${proj.name} (${
              proj.offsetTon
            } tons)`
          );
        });
      }
      throw new Error(
        `Project "${projectId}" sudah pernah digunakan sebelumnya`
      );

    default:
      throw new Error(validationResult.message || "Project validation failed");
  }
}

// ===== EXECUTE =====
main().catch((error) => {
  console.error("❌ Fatal error:", error.message);
  process.exit(1);
});
