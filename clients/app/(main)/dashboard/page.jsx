"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers"; // Tambahkan import ini
import Navbar from "@/components/Navbar";
import TokenInfo from "@/components/TokenInfo";
import DebtInfo from "@/components/DebtInfo";
import Status from "@/components/Status";
import TransferForm from "@/components/TransferForm";
import { useContract, getCCTBalance, getCCTInfo, getCarbonDebt } from "@/utils/backend";

export default function Home() {
  const [walletData, setWalletData] = useState({
    address: "",
    provider: null,
    signer: null,
    isConnected: false,
  });

  // State untuk CCT balance (bukan ETH balance)
  const [tokenBalance, setTokenBalance] = useState("0"); // Ini adalah CCT balance
  const [carbonDebt, setCarbonDebt] = useState("0");
  const [tokenInfo, setTokenInfo] = useState({
    name: "Carbon Credit Token",
    symbol: "CCT",
    decimals: 18,
  });
  const [loading, setLoading] = useState(false);

  const [projectId, setProjectId] = useState("");
  const [transferData, setTransferData] = useState({
    destinationWallet: "",
    numOfTokens: "",
  });

  // Check wallet connection on page load
  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          await handleConnectWallet();
        }
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setLoading(true);

      // Connect to wallet and get contract
      const { contract, account, signer, provider } = await useContract();

      const userAddress = account[0];

      setWalletData({
        address: userAddress,
        provider: provider,
        signer: signer,
        isConnected: true,
      });

      console.log("Wallet connected:", userAddress);

      // Load CCT token info
      const cctInfo = await getCCTInfo();
      setTokenInfo(cctInfo);

      // Load wallet data (CCT balance)
      await loadWalletData(userAddress);

      alert("Wallet connected successfully!");
    } catch (error) {
      console.error("Wallet connection error:", error);
      alert("Failed to connect wallet: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletData = async (userAddress) => {
    try {
      setLoading(true);
      console.log("Loading CCT balance for:", userAddress);

      // Get CCT balance (Carbon Credit Token balance)
      const cctBalance = await getCCTBalance(userAddress);
      console.log("CCT balance:", cctBalance);
      setTokenBalance(cctBalance); // Ini adalah CCT balance

      // Get carbon debt
      const debt = await getCarbonDebt(userAddress);
      console.log("Carbon debt:", debt);
      setCarbonDebt(debt);
    } catch (error) {
      console.error("Error loading wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectIdChange = (newProjectId) => {
    setProjectId(newProjectId);
    console.log("Project ID changed:", newProjectId);
  };

  const handleMintToken = async (projectIdValue) => {
    if (!walletData.isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!projectIdValue) {
      alert("Please enter a project ID!");
      return;
    }

    try {
      setLoading(true);
      console.log("🔄 Processing project:", projectIdValue);
      console.log("👤 User address:", walletData.address);

      // Call Oracle untuk validasi dan mint
      // Untuk sementara kita panggil Oracle script secara manual
      // Di production bisa lewat API endpoint

      alert(`Processing project ${projectIdValue}... Please check console for Oracle execution.`);

      console.log("🔧 Run this command in terminal:");
      console.log(`node scripts/mockOracle.js ${walletData.address} ${projectIdValue}`);

      // Tunggu sebentar lalu reload balance
      setTimeout(async () => {
        await loadWalletData(walletData.address);
      }, 3000);
    } catch (error) {
      console.error("Error processing project:", error);
      alert("Failed to process project: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDestinationWalletChange = (wallet) => {
    setTransferData((prev) => ({
      ...prev,
      destinationWallet: wallet,
    }));
  };

  const handleTokenAmountChange = (amount) => {
    setTransferData((prev) => ({
      ...prev,
      numOfTokens: amount,
    }));
  };

  const handleTransfer = async (transferDetails) => {
    if (!walletData.isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!transferDetails.destinationWallet || !transferDetails.numOfTokens) {
      alert("Please fill in all transfer details!");
      return;
    }

    try {
      setLoading(true);
      const { contract } = await useContract();

      // Convert amount to Wei for CCT transfer
      const amountInWei = ethers.parseEther(transferDetails.numOfTokens);

      const tx = await contract.transfer(transferDetails.destinationWallet, amountInWei);

      console.log("CCT Transfer transaction:", tx.hash);
      await tx.wait();

      alert(
        `Successfully transferred ${transferDetails.numOfTokens} CCT tokens to ${transferDetails.destinationWallet}`,
      );

      // Reload CCT balance
      await loadWalletData(walletData.address);

      // Reset form
      setTransferData({
        destinationWallet: "",
        numOfTokens: "",
      });
    } catch (error) {
      console.error("Error transferring CCT tokens:", error);
      alert("Failed to transfer CCT tokens: " + error.message);
    } finally {
      setLoading(false);
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

        {/* Loading Overlay */}
        {loading && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
            <div className="rounded-lg bg-white p-6">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <p>Loading CCT Balance...</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex w-[80%] flex-col items-center justify-center gap-6">
          <div className="flex w-full items-center justify-center gap-6">
            {/* TokenInfo akan menampilkan CCT balance */}
            <TokenInfo
              token={tokenBalance} // Ini adalah CCT balance
              tokenSymbol={tokenInfo.symbol} // CCT
              tokenName={tokenInfo.name} // Carbon Credit Token
            />
            <DebtInfo token={carbonDebt} />
          </div>
          <div className="w-[74%]">
            <Status
              status={walletData.isConnected ? "Green Contributor" : "Not Connected"}
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
