import { ethers } from "ethers";

// Contract config dari file config.js Anda
const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const CONTRACT_ABI = [
  // ... ABI dari config.js Anda
];

export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed!");
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    // Create provider and signer
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Get network info
    const network = await provider.getNetwork();

    return {
      address: accounts[0],
      provider,
      signer,
      networkId: network.chainId,
    };
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
};

export const getContract = (signer) => {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

export const formatAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
