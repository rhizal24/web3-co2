"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import TokenInfo from "@/components/TokenInfo";
import DebtInfo from "@/components/DebtInfo";
import Status from "@/components/Status";
import TransferForm from "@/components/TransferForm";
import { connectWallet, getContract } from "@/utils/Wallet";

export default function Home() {
  const [walletData, setWalletData] = useState({
    address: "",
    provider: null,
    signer: null,
    isConnected: false
  });
  const [projectId, setProjectId] = useState("");
  const [transferData, setTransferData] = useState({
    destinationWallet: "",
    numOfTokens: ""
  });
  const [tokenBalance, setTokenBalance] = useState("0");
  const [carbonDebt, setCarbonDebt] = useState("0");

  // Check if wallet is already connected on page load
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        
        if (accounts.length > 0) {
          const walletInfo = await connectWallet();
          setWalletData({
            address: walletInfo.address,
            provider: walletInfo.provider,
            signer: walletInfo.signer,
            isConnected: true
          });
          // Load token balance and debt
          await loadWalletData(walletInfo.signer, walletInfo.address);
        }
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  const handleConnectWallet = async () => {
    try {
      const walletInfo = await connectWallet();
      setWalletData({
        address: walletInfo.address,
        provider: walletInfo.provider,
        signer: walletInfo.signer,
        isConnected: true
      });
      
      // Load token balance and debt
      await loadWalletData(walletInfo.signer, walletInfo.address);
      
      alert("Wallet connected successfully!");
    } catch (error) {
      alert("Failed to connect wallet: " + error.message);
    }
  };

  const loadWalletData = async (signer, address) => {
    try {
      const contract = getContract(signer);
      
      // Get token balance
      const balance = await contract.balanceOf(address);
      setTokenBalance(balance.toString());
      
      // Get carbon debt
      const debt = await contract.getDebt(address);
      setCarbonDebt(debt.toString());
      
    } catch (error) {
      console.error("Error loading wallet data:", error);
    }
  };

  // Function untuk handle perubahan project ID
  const handleProjectIdChange = (newProjectId) => {
    setProjectId(newProjectId);
    console.log("Project ID changed:", newProjectId);
  };

  // Function untuk handle mint token
  const handleMintToken = async (projectIdValue) => {
    if (!walletData.isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      const contract = getContract(walletData.signer);
      
      // Contoh mint 100 tokens (sesuaikan dengan logic contract Anda)
      const tx = await contract.updateCarbonCredit(walletData.address, 100);
      await tx.wait();
      
      alert(`Token minted successfully for project: ${projectIdValue}`);
      
      // Reload wallet data
      await loadWalletData(walletData.signer, walletData.address);
      
    } catch (error) {
      console.error("Error minting token:", error);
      alert("Failed to mint token: " + error.message);
    }
  };

  // Function untuk handle perubahan destination wallet
  const handleDestinationWalletChange = (wallet) => {
    setTransferData(prev => ({
      ...prev,
      destinationWallet: wallet
    }));
  };

  // Function untuk handle perubahan number of tokens
  const handleTokenAmountChange = (amount) => {
    setTransferData(prev => ({
      ...prev,
      numOfTokens: amount
    }));
  };

  // Function untuk handle transfer
  const handleTransfer = async (transferDetails) => {
    if (!walletData.isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      const contract = getContract(walletData.signer);
      
      const tx = await contract.transfer(
        transferDetails.destinationWallet,
        transferDetails.numOfTokens
      );
      await tx.wait();
      
      alert(`Successfully transferred ${transferDetails.numOfTokens} tokens to ${transferDetails.destinationWallet}`);
      
      // Reload wallet data
      await loadWalletData(walletData.signer, walletData.address);
      
    } catch (error) {
      console.error("Error transferring tokens:", error);
      alert("Failed to transfer tokens: " + error.message);
    }
  };

  return (
    <>
      <div className="item-center flex h-screen w-full flex-col items-center gap-6 bg-blue-50/50">
        <div className="w-full">
          <Navbar 
            className={"mt-5"} 
            address={walletData.address}
            isConnected={walletData.isConnected}
            onConnectWallet={handleConnectWallet}
          />
        </div>
        <div className="flex w-[80%] flex-col items-center justify-center gap-6">
          <div className="flex w-full items-center justify-center gap-6">
            <TokenInfo token={tokenBalance} />
            <DebtInfo token={carbonDebt} />
          </div>
          <div className="w-[74%]">
            <Status
              status={"Green Contributor"}
              onProjectIdChange={handleProjectIdChange}
              onMintToken={handleMintToken}
            />
          </div>
          <div className="w-[74%]">
            <TransferForm
              destinationWallet={transferData.destinationWallet}
              numOfTokens={transferData.numOfTokens}
              onDestinationWalletChange={handleDestinationWalletChange}
              onTokenAmountChange={handleTokenAmountChange}
              onTransfer={handleTransfer}
            />
          </div>
        </div>
      </div>
    </>
  );
}
