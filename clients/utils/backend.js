"use client";

import { ethers } from "ethers";
// Perbaiki import path - gunakan @ atau path yang benar
import { abi, address } from "@/utils/config";
// ATAU jika file config ada di folder contracts:
// import { abi, address } from "@/contracts/config";

export const useContract = async () => {
  // Debug: pastikan address tidak null
  console.log("Contract address:", address);
  console.log("Contract ABI:", abi);

  if (!address || address === null) {
    throw new Error("Contract address is null or undefined. Please check your config file.");
  }

  const account = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  console.log("Connected accounts:", account);

  const provider = new ethers.BrowserProvider(window.ethereum);
  console.log("Provider initialized:", provider);
  const signer = await provider.getSigner();
  console.log("Signer obtained:", signer);
  const contract = new ethers.Contract(address, abi, signer);
  console.log("Contract initialized:", contract);

  console.log("useContract - Contract:", contract);
  console.log("useContract - Account:", account);
  return { contract, account, signer, provider };
};

// Function khusus untuk mendapatkan CCT balance
export const getCCTBalance = async (userAddress) => {
  try {
    const { contract } = await useContract();
    console.log("Getting CCT balance for:", userAddress);

    // Panggil balanceOf untuk mendapatkan CCT balance
    const balance = await contract.balanceOf(userAddress);
    console.log("Raw CCT balance:", balance.toString());

    // Convert dari Wei ke Ether (CCT menggunakan 18 decimals)
    const formattedBalance = ethers.formatEther(balance);
    console.log("Formatted CCT balance:", formattedBalance);

    return formattedBalance;
  } catch (error) {
    console.error("Error getting CCT balance:", error);
    return "0";
  }
};

// Function untuk mendapatkan informasi token CCT
export const getCCTInfo = async () => {
  try {
    const { contract } = await useContract();

    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    const totalSupply = await contract.totalSupply();

    console.log("CCT Info:", {
      name,
      symbol,
      decimals,
      totalSupply: ethers.formatEther(totalSupply),
    });

    return {
      name,
      symbol,
      decimals,
      totalSupply: ethers.formatEther(totalSupply),
    };
  } catch (error) {
    console.error("Error getting CCT info:", error);
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

    // Cek apakah function getDebt exist
    if (contract.getDebt) {
      const debt = await contract.getDebt(userAddress);
      return ethers.formatEther(debt);
    } else {
      console.log("getDebt function not available");
      return "0";
    }
  } catch (error) {
    console.error("Error getting carbon debt:", error);
    return "0";
  }
};
