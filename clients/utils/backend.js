"use client";

import { ethers } from "ethers";
import { address, abi } from "./config";

export const useContract = async () => {
  try {
    // Debug: pastikan address tidak null
    console.log("Contract address:", address);
    console.log("Contract ABI:", abi);

    if (!address || address === null) {
      throw new Error("Contract address is null or undefined. Please check your config file.");
    }

    // Check if MetaMask is available
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please check your MetaMask connection.");
    }

    console.log("Connected accounts:", accounts);

    const provider = new ethers.BrowserProvider(window.ethereum);
    console.log("Provider initialized:", provider);

    const signer = await provider.getSigner();
    console.log("Signer obtained:", signer);

    const contract = new ethers.Contract(address, abi, signer);
    console.log("Contract initialized:", contract);

    return { contract, account: accounts, signer, provider };
  } catch (error) {
    console.error("❌ Error in useContract:", error);
    throw error;
  }
};

// Function khusus untuk mendapatkan CCT balance
export const getCCTBalance = async (userAddress) => {
  try {
    console.log("🔍 Getting CCT balance for:", userAddress);

    // Check if contract is deployed first
    const contractCheck = await checkContractDeployment();
    if (!contractCheck.isDeployed) {
      console.warn("⚠️ Contract not deployed, returning default balance");
      return "0";
    }

    const { contract } = await useContract();
    console.log("📋 Contract instance obtained");

    // Validate address format
    if (!userAddress || !ethers.isAddress(userAddress)) {
      console.error("❌ Invalid address format:", userAddress);
      return "0";
    }

    console.log("📞 Calling balanceOf...");

    // Try to call balanceOf with timeout
    const balance = await Promise.race([
      contract.balanceOf(userAddress),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Contract call timeout")), 10000),
      ),
    ]);

    console.log("✅ Raw CCT balance:", balance.toString());

    // Convert dari Wei ke Ether (CCT menggunakan 18 decimals)
    const formattedBalance = ethers.formatEther(balance);
    console.log("✅ Formatted CCT balance:", formattedBalance);

    return formattedBalance;
  } catch (error) {
    console.error("❌ Error getting CCT balance:", error);

    // Provide more specific error info
    if (error.message.includes("BAD_DATA")) {
      console.error(
        "❌ Contract call returned invalid data - contract may not be deployed correctly",
      );
    } else if (error.message.includes("timeout")) {
      console.error("❌ Contract call timed out");
    } else if (error.message.includes("CALL_EXCEPTION")) {
      console.error("❌ Contract call failed - function may not exist");
    }

    return "0";
  }
};

// Function untuk mendapatkan informasi token CCT
export const getCCTInfo = async () => {
  try {
    console.log("🔍 Getting CCT token info...");

    const { contract } = await useContract();
    console.log("📋 Contract instance:", contract);

    // Check if contract is deployed at this address
    const code = await contract.runner.provider.getCode(address);
    console.log("📄 Contract code length:", code.length);

    if (code === "0x") {
      console.error("❌ No contract deployed at address:", address);
      throw new Error(
        `No contract found at address ${address}. Please check if the contract is deployed.`,
      );
    }

    console.log("✅ Contract found, getting token info...");

    // Try to get basic token info with individual try-catch
    let name = "Carbon Credit Token";
    let symbol = "CCT";
    let decimals = 18;
    let totalSupply = "0";

    try {
      name = await contract.name();
      console.log("✅ Token name:", name);
    } catch (error) {
      console.warn("⚠️ Could not get token name:", error.message);
    }

    try {
      symbol = await contract.symbol();
      console.log("✅ Token symbol:", symbol);
    } catch (error) {
      console.warn("⚠️ Could not get token symbol:", error.message);
    }

    try {
      decimals = await contract.decimals();
      console.log("✅ Token decimals:", decimals);
    } catch (error) {
      console.warn("⚠️ Could not get token decimals:", error.message);
    }

    try {
      const supply = await contract.totalSupply();
      totalSupply = ethers.formatEther(supply);
      console.log("✅ Total supply:", totalSupply);
    } catch (error) {
      console.warn("⚠️ Could not get total supply:", error.message);
    }

    const tokenInfo = {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply,
    };

    console.log("✅ CCT Token Info:", tokenInfo);
    return tokenInfo;
  } catch (error) {
    console.error("❌ Error getting CCT info:", error);

    // Return default values if contract call fails
    return {
      name: "Carbon Credit Token",
      symbol: "CCT",
      decimals: 18,
      totalSupply: "0",
    };
  }
};

// Function untuk mendapatkan debt (jika ada)
export const getCarbonDebt = async (userAddress) => {
  try {
    const { contract } = await useContract();

    // Cek apakah function getCarbonDebt exist di contract
    if (typeof contract.getCarbonDebt === "function") {
      const debt = await contract.getCarbonDebt(userAddress);
      return ethers.formatEther(debt);
    } else {
      console.log("getCarbonDebt function not available in contract");
      return "0";
    }
  } catch (error) {
    console.error("Error getting carbon debt:", error);
    return "0";
  }
};

// Function to normalize address format
export const normalizeAddress = (address) => {
  if (!address) return null;

  // Remove any whitespace and ensure it starts with 0x
  const cleaned = address.trim();
  if (!cleaned.startsWith("0x")) {
    return `0x${cleaned}`;
  }
  return cleaned;
};

// Enhanced function untuk load available projects dengan better error handling
export const loadAvailableProjects = async (userAddress) => {
  try {
    console.log("🔄 Loading available projects for:", userAddress);

    const normalizedAddress = normalizeAddress(userAddress);
    console.log("📝 Normalized address:", normalizedAddress);

    // Get wallet info first dengan multiple attempts
    let walletResponse;

    // Try exact address first
    walletResponse = await fetch(`http://localhost:3002/api/wallet/${normalizedAddress}`);

    // If failed, try lowercase
    if (!walletResponse.ok) {
      console.log("⚠️ Trying with lowercase address...");
      walletResponse = await fetch(
        `http://localhost:3002/api/wallet/${normalizedAddress.toLowerCase()}`,
      );
    }

    if (!walletResponse.ok) {
      const errorData = await walletResponse.json();
      console.error("❌ Wallet lookup failed:", errorData);
      throw new Error(`Wallet address not found: ${normalizedAddress}`);
    }

    const walletInfo = await walletResponse.json();
    console.log("✅ Wallet info:", walletInfo);

    // Get available projects for this company
    const projectsResponse = await fetch(
      `http://localhost:3002/api/carbon-offset-projects?companyId=${walletInfo.companyId}&available=true`,
    );

    if (!projectsResponse.ok) {
      throw new Error("Failed to fetch projects");
    }

    const projects = await projectsResponse.json();
    console.log("📋 Available projects:", projects);

    return {
      walletInfo,
      projects,
    };
  } catch (error) {
    console.error("❌ Error loading available projects:", error);
    throw error;
  }
};

// Function untuk check apakah contract ter-deploy
export const checkContractDeployment = async () => {
  try {
    console.log("🔍 Checking contract deployment...");
    console.log("📍 Contract address:", address);

    if (!address || address === "0x0000000000000000000000000000000000000000") {
      throw new Error("Invalid contract address");
    }

    // Check if MetaMask is available
    if (!window.ethereum) {
      throw new Error("MetaMask is not available");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const code = await provider.getCode(address);

    console.log("📄 Contract bytecode length:", code.length);
    console.log("📄 Contract bytecode preview:", code.substring(0, 50) + "...");

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

// Enhanced transfer function dengan validation
export const transferCCT = async (toAddress, amount) => {
  try {
    console.log("🔄 Starting CCT transfer...");
    console.log("📍 To:", toAddress);
    console.log("💰 Amount:", amount);

    // Validate inputs
    if (!toAddress || !ethers.isAddress(toAddress)) {
      throw new Error("Invalid destination address");
    }

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      throw new Error("Invalid transfer amount");
    }

    // Get provider and signer
    if (!window.ethereum) {
      throw new Error("MetaMask not found");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    console.log("👤 From:", userAddress);

    // Get contract instance
    const contract = new ethers.Contract(address, abi, signer);

    // Pre-transfer checks
    console.log("🔍 Performing pre-transfer checks...");

    // Check sender balance
    const senderBalance = await contract.balanceOf(userAddress);
    const senderBalanceFormatted = ethers.formatEther(senderBalance);
    console.log("💰 Sender balance:", senderBalanceFormatted, "CCT");

    // Check if sender can transfer
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
      console.warn("⚠️ Could not check canTransfer, proceeding with basic checks");
    }

    // Convert amount to Wei
    const amountInWei = ethers.parseEther(amount.toString());

    // Check if sender has enough balance
    if (senderBalance < amountInWei) {
      throw new Error(
        `Insufficient balance. You have ${senderBalanceFormatted} CCT, trying to send ${amount} CCT`,
      );
    }

    // Check specific amount validity
    try {
      const canTransferAmount = await contract.canTransferAmount(userAddress, amountInWei);
      if (!canTransferAmount) {
        throw new Error("Cannot transfer this amount");
      }
    } catch (error) {
      console.warn("⚠️ Could not check canTransferAmount, proceeding");
    }

    console.log("✅ Pre-transfer checks passed");

    // Execute transfer
    console.log("📝 Executing transfer transaction...");
    const tx = await contract.transfer(toAddress, amountInWei);

    console.log("📝 Transaction sent:", tx.hash);
    console.log("⏳ Waiting for confirmation...");

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed:", receipt);

    // Get updated balances
    const newSenderBalance = await contract.balanceOf(userAddress);
    const receiverBalance = await contract.balanceOf(toAddress);

    const result = {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      amount: amount,
      from: userAddress,
      to: toAddress,
      newSenderBalance: ethers.formatEther(newSenderBalance),
      receiverBalance: ethers.formatEther(receiverBalance),
      gasUsed: receipt.gasUsed.toString(),
    };

    console.log("🎉 Transfer completed:", result);
    return result;
  } catch (error) {
    console.error("❌ Transfer failed:", error);

    // Enhanced error handling
    let userFriendlyMessage = error.message;

    if (error.message.includes("Outstanding carbon debt")) {
      userFriendlyMessage =
        "Transfer failed: You have outstanding carbon debt. Please settle your debt first.";
    } else if (error.message.includes("Insufficient balance")) {
      userFriendlyMessage = "Transfer failed: Insufficient CCT balance.";
    } else if (error.message.includes("Invalid destination")) {
      userFriendlyMessage = "Transfer failed: Invalid destination address.";
    } else if (error.message.includes("user rejected")) {
      userFriendlyMessage = "Transfer cancelled by user.";
    } else if (error.message.includes("gas")) {
      userFriendlyMessage = "Transfer failed: Not enough gas or gas limit exceeded.";
    }

    throw new Error(userFriendlyMessage);
  }
};

// Function untuk cek apakah user bisa transfer
export const checkTransferEligibility = async (userAddress) => {
  try {
    const { contract } = await useContract();

    const balance = await contract.balanceOf(userAddress);
    const debt = await contract.getCarbonDebt(userAddress);
    const canTransfer = await contract.canTransfer(userAddress);

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

// Function untuk estimate gas untuk transfer
export const estimateTransferGas = async (toAddress, amount) => {
  try {
    const { contract } = await useContract();
    const amountInWei = ethers.parseEther(amount.toString());

    const gasEstimate = await contract.transfer.estimateGas(toAddress, amountInWei);
    const provider = new ethers.BrowserProvider(window.ethereum);
    const gasPrice = await provider.getFeeData();

    return {
      gasLimit: gasEstimate.toString(),
      gasPrice: gasPrice.gasPrice?.toString() || "0",
      estimatedCost: ethers.formatEther((gasEstimate * (gasPrice.gasPrice || 0n)).toString()),
    };
  } catch (error) {
    console.error("Error estimating gas:", error);
    return null;
  }
};
