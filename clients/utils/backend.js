"use client";

import { ethers } from "ethers";
import { address, abi } from "./config";

// ===== CONFIGURATION =====
const CONFIG = {
  API_BASE_URL: "http://localhost:3002/api",
  CONTRACT_TIMEOUT: 10000, // 10 seconds
  DEFAULT_TOKEN_INFO: {
    name: "Carbon Credit Token",
    symbol: "CCT",
    decimals: 18,
    totalSupply: "0",
  },
};

// ===== CONTRACT UTILITIES =====
export const useContract = async () => {
  try {
    console.log("🔗 Initializing contract connection...");

    validateContractConfig();
    await validateMetaMask();

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts?.length) {
      throw new Error("No accounts found. Please check your MetaMask connection.");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(address, abi, signer);

    console.log("✅ Contract connection established");
    return { contract, account: accounts, signer, provider };
  } catch (error) {
    console.error("❌ Error in useContract:", error);
    throw error;
  }
};

const validateContractConfig = () => {
  if (!address || address === null) {
    throw new Error("Contract address is null or undefined. Please check your config file.");
  }
  console.log("📍 Contract address:", address);
};

const validateMetaMask = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
  }
};

export const checkContractDeployment = async () => {
  try {
    console.log("🔍 Checking contract deployment...");

    if (!address || address === "0x0000000000000000000000000000000000000000") {
      throw new Error("Invalid contract address");
    }

    if (!window.ethereum) {
      throw new Error("MetaMask is not available");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const code = await provider.getCode(address);

    console.log("📄 Contract bytecode length:", code.length);

    if (code === "0x") {
      return {
        isDeployed: false,
        message: "No contract found at this address",
      };
    }

    return {
      isDeployed: true,
      message: "Contract successfully deployed",
      codeLength: code.length,
    };
  } catch (error) {
    console.error("❌ Error checking contract deployment:", error);
    return {
      isDeployed: false,
      message: error.message,
      error: true,
    };
  }
};

// ===== BALANCE FUNCTIONS =====
export const getCCTBalance = async (userAddress) => {
  try {
    console.log("🔍 Getting CCT balance for:", userAddress);

    const contractCheck = await checkContractDeployment();
    if (!contractCheck.isDeployed) {
      console.warn("⚠️ Contract not deployed, returning default balance");
      return "0";
    }

    if (!userAddress || !ethers.isAddress(userAddress)) {
      console.error("❌ Invalid address format:", userAddress);
      return "0";
    }

    const { contract } = await useContract();

    const balance = await Promise.race([
      contract.balanceOf(userAddress),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Contract call timeout")), CONFIG.CONTRACT_TIMEOUT),
      ),
    ]);

    const formattedBalance = ethers.formatEther(balance);
    console.log("✅ CCT balance:", formattedBalance);

    return formattedBalance;
  } catch (error) {
    console.error("❌ Error getting CCT balance:", error);
    logContractError(error);
    return "0";
  }
};

export const getCarbonDebt = async (userAddress) => {
  try {
    console.log("🔍 Getting carbon debt for:", userAddress);

    const { contract } = await useContract();
    const debtResult = await contract.getCarbonDebt(userAddress);

    console.log("📊 Raw debt result:", debtResult.toString());

    const formattedDebt = formatDebtValue(debtResult.toString());
    console.log("✅ Formatted carbon debt:", formattedDebt);

    return formattedDebt;
  } catch (error) {
    console.error("❌ Error getting carbon debt from contract:", error);

    // Fallback to API
    const apiDebt = await getDebtFromAPI(userAddress);
    return apiDebt || "0.0";
  }
};

const formatDebtValue = (debtValue) => {
  if (debtValue === "0") {
    return "0.0";
  }

  const isNegative = debtValue.startsWith("-");
  if (!isNegative) {
    return "0.0"; // No debt
  }

  const absoluteValue = debtValue.replace("-", "");
  const debtInEther = ethers.formatEther(absoluteValue);
  const debtNumber = parseFloat(debtInEther);

  return debtNumber % 1 === 0 ? debtNumber.toFixed(1) : debtNumber.toString();
};

const getDebtFromAPI = async (userAddress) => {
  try {
    console.log("🔄 Trying API fallback for debt...");

    const response = await fetch(`${CONFIG.API_BASE_URL}/emissions/${userAddress}/2025`);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.success && data.data.emission.balance < 0) {
      const apiDebt = Math.abs(data.data.emission.balance);
      const formatted = apiDebt % 1 === 0 ? apiDebt.toFixed(1) : apiDebt.toString();

      console.log("✅ Got debt from API fallback:", formatted);
      return formatted;
    }

    return null;
  } catch (error) {
    console.warn("⚠️ API fallback failed:", error);
    return null;
  }
};

// ===== TOKEN INFO FUNCTIONS =====
export const getCCTInfo = async () => {
  try {
    console.log("🔍 Getting CCT token info...");

    const { contract } = await useContract();

    const code = await contract.runner.provider.getCode(address);
    if (code === "0x") {
      throw new Error(`No contract found at address ${address}`);
    }

    const tokenInfo = await getTokenDetails(contract);
    console.log("✅ CCT Token Info:", tokenInfo);

    return tokenInfo;
  } catch (error) {
    console.error("❌ Error getting CCT info:", error);
    return CONFIG.DEFAULT_TOKEN_INFO;
  }
};

const getTokenDetails = async (contract) => {
  const details = { ...CONFIG.DEFAULT_TOKEN_INFO };

  const tokenCalls = [
    { key: "name", call: () => contract.name() },
    { key: "symbol", call: () => contract.symbol() },
    { key: "decimals", call: () => contract.decimals() },
    { key: "totalSupply", call: () => contract.totalSupply() },
  ];

  for (const { key, call } of tokenCalls) {
    try {
      const value = await call();

      if (key === "decimals") {
        details[key] = Number(value);
      } else if (key === "totalSupply") {
        details[key] = ethers.formatEther(value);
      } else {
        details[key] = value;
      }

      console.log(`✅ Token ${key}:`, details[key]);
    } catch (error) {
      console.warn(`⚠️ Could not get token ${key}:`, error.message);
    }
  }

  return details;
};

// ===== PROJECT FUNCTIONS =====
export const loadAvailableProjects = async (userAddress) => {
  try {
    console.log("🔄 Loading available projects for:", userAddress);

    const normalizedAddress = normalizeAddress(userAddress);
    const walletInfo = await getWalletInfo(normalizedAddress);
    const projects = await getCompanyProjects(walletInfo.companyId);

    console.log("📋 Available projects:", projects);

    return { walletInfo, projects };
  } catch (error) {
    console.error("❌ Error loading available projects:", error);
    throw error;
  }
};

const getWalletInfo = async (address) => {
  const urls = [
    `${CONFIG.API_BASE_URL}/wallet/${address}`,
    `${CONFIG.API_BASE_URL}/wallet/${address.toLowerCase()}`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const walletInfo = await response.json();
        console.log("✅ Wallet info:", walletInfo);
        return walletInfo;
      }
    } catch (error) {
      continue;
    }
  }

  throw new Error(`Wallet address not found: ${address}`);
};

const getCompanyProjects = async (companyId) => {
  const response = await fetch(
    `${CONFIG.API_BASE_URL}/carbon-offset-projects?companyId=${companyId}&available=true`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }

  return await response.json();
};

// ===== TRANSFER FUNCTIONS =====
export const transferCCT = async (toAddress, amount) => {
  try {
    console.log("🔄 Starting CCT transfer...");
    console.log("📍 To:", toAddress, "💰 Amount:", amount);

    validateTransferInputs(toAddress, amount);

    const { contract, signer } = await setupTransfer();
    const userAddress = await signer.getAddress();

    await performPreTransferChecks(contract, userAddress, amount);

    const result = await executeTransfer(contract, userAddress, toAddress, amount);

    console.log("🎉 Transfer completed:", result);
    return result;
  } catch (error) {
    console.error("❌ Transfer failed:", error);
    throw new Error(getTransferErrorMessage(error));
  }
};

const validateTransferInputs = (toAddress, amount) => {
  if (!toAddress || !ethers.isAddress(toAddress)) {
    throw new Error("Invalid destination address");
  }

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    throw new Error("Invalid transfer amount");
  }
};

const setupTransfer = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(address, abi, signer);

  return { contract, signer, provider };
};

const performPreTransferChecks = async (contract, userAddress, amount) => {
  console.log("🔍 Performing pre-transfer checks...");

  const senderBalance = await contract.balanceOf(userAddress);
  const senderBalanceFormatted = ethers.formatEther(senderBalance);
  const amountInWei = ethers.parseEther(amount.toString());

  console.log("💰 Sender balance:", senderBalanceFormatted, "CCT");

  if (senderBalance < amountInWei) {
    throw new Error(
      `Insufficient balance. You have ${senderBalanceFormatted} CCT, trying to send ${amount} CCT`,
    );
  }

  // Check transfer eligibility
  try {
    const canTransfer = await contract.canTransfer(userAddress);
    if (!canTransfer) {
      const debt = await contract.getCarbonDebt(userAddress);
      if (debt < 0) {
        throw new Error("Cannot transfer: Outstanding carbon debt");
      } else {
        throw new Error("Cannot transfer: Insufficient balance");
      }
    }
  } catch (error) {
    if (error.message.includes("Outstanding carbon debt")) {
      throw error;
    }
    console.warn("⚠️ Could not check canTransfer, proceeding with basic checks");
  }

  console.log("✅ Pre-transfer checks passed");
};

const executeTransfer = async (contract, fromAddress, toAddress, amount) => {
  const amountInWei = ethers.parseEther(amount.toString());

  console.log("📝 Executing transfer transaction...");
  const tx = await contract.transfer(toAddress, amountInWei);

  console.log("📝 Transaction sent:", tx.hash);
  console.log("⏳ Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("✅ Transaction confirmed");

  // Get updated balances
  const [newSenderBalance, receiverBalance] = await Promise.all([
    contract.balanceOf(fromAddress),
    contract.balanceOf(toAddress),
  ]);

  return {
    success: true,
    transactionHash: tx.hash,
    blockNumber: receipt.blockNumber,
    amount: amount,
    from: fromAddress,
    to: toAddress,
    newSenderBalance: ethers.formatEther(newSenderBalance),
    receiverBalance: ethers.formatEther(receiverBalance),
    gasUsed: receipt.gasUsed.toString(),
  };
};

const getTransferErrorMessage = (error) => {
  const errorMap = {
    "Outstanding carbon debt":
      "Transfer failed: You have outstanding carbon debt. Please settle your debt first.",
    "Insufficient balance": "Transfer failed: Insufficient CCT balance.",
    "Invalid destination": "Transfer failed: Invalid destination address.",
    "user rejected": "Transfer cancelled by user.",
    gas: "Transfer failed: Not enough gas or gas limit exceeded.",
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.message.includes(key)) {
      return message;
    }
  }

  return error.message;
};

// ===== UTILITY FUNCTIONS =====
export const normalizeAddress = (address) => {
  if (!address) return null;

  const cleaned = address.trim();
  return cleaned.startsWith("0x") ? cleaned : `0x${cleaned}`;
};

export const checkTransferEligibility = async (userAddress) => {
  try {
    const { contract } = await useContract();

    const [balance, debt, canTransfer] = await Promise.all([
      contract.balanceOf(userAddress),
      contract.getCarbonDebt(userAddress),
      contract.canTransfer(userAddress),
    ]);

    return {
      canTransfer,
      balance: ethers.formatEther(balance),
      debt: debt.toString(),
      hasDebt: debt < 0,
      hasBalance: balance > 0,
    };
  } catch (error) {
    console.error("Error checking transfer eligibility:", error);
    return {
      canTransfer: false,
      balance: "0",
      debt: "0",
      hasDebt: false,
      hasBalance: false,
    };
  }
};

export const estimateTransferGas = async (toAddress, amount) => {
  try {
    const { contract } = await useContract();
    const amountInWei = ethers.parseEther(amount.toString());

    const [gasEstimate, feeData] = await Promise.all([
      contract.transfer.estimateGas(toAddress, amountInWei),
      new ethers.BrowserProvider(window.ethereum).getFeeData(),
    ]);

    return {
      gasLimit: gasEstimate.toString(),
      gasPrice: feeData.gasPrice?.toString() || "0",
      estimatedCost: ethers.formatEther((gasEstimate * (feeData.gasPrice || 0n)).toString()),
    };
  } catch (error) {
    console.error("Error estimating gas:", error);
    return null;
  }
};

// ===== ERROR HANDLING UTILITIES =====
const logContractError = (error) => {
  const errorMap = {
    BAD_DATA: "Contract call returned invalid data - contract may not be deployed correctly",
    timeout: "Contract call timed out",
    CALL_EXCEPTION: "Contract call failed - function may not exist",
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.message.includes(key)) {
      console.error(`❌ ${message}`);
      return;
    }
  }
};
