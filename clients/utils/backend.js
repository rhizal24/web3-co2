"use client";

import { ethers } from "ethers";
import { contractABI, contractAddress } from "@/contracts/config";
export const useContract = async () => {
  const account = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  console.log("Connected accounts:", account);

  const provider = new ethers.BrowserProvider(window.ethereum);
  console.log("Provider initialized:", provider);
  const signer = await provider.getSigner();
  console.log("Signer obtained:", signer);
  const contract = new ethers.Contract(address, abi, signer);
  console.log("Contract initialized1:", contract);

  console.log("useContract - Contract:", contract);
  console.log("useContract - Account:", account);
  return { contract, account };
};
