"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Navbar from "@/components/Navbar";
import TokenInfo from "@/components/TokenInfo";
import DebtInfo from "@/components/DebtInfo";
import Status from "@/components/Status";
import TransferForm from "@/components/TransferForm";
import { getCCTBalance, getCCTInfo, getCarbonDebt, transferCCT } from "@/utils/backend";

export default function Home() {
  // ===== STATE MANAGEMENT =====
  const [walletData, setWalletData] = useState({
    address: "",
    provider: null,
    signer: null,
    isConnected: false,
  });

  const [tokenData, setTokenData] = useState({
    balance: "0",
    debt: "0",
    info: {
      name: "Carbon Credit Token",
      symbol: "CCT",
      decimals: 18,
    },
  });

  const [loadingStates, setLoadingStates] = useState({
    wallet: false,
    minting: false,
    projects: false,
    timeout: null,
  });

  const [projectData, setProjectData] = useState({
    selectedId: "",
    availableProjects: [],
  });

  const [transferData, setTransferData] = useState({
    destinationWallet: "",
    numOfTokens: "",
  });

  // ===== INITIALIZATION =====
  useEffect(() => {
    checkWalletConnection();
    return () => {
      if (loadingStates.timeout) clearTimeout(loadingStates.timeout);
    };
  }, []);

  useEffect(() => {
    if (walletData.isConnected && walletData.address) {
      const timer = setTimeout(loadAvailableProjects, 1000);
      return () => clearTimeout(timer);
    }
  }, [walletData.isConnected, walletData.address]);

  // ===== STATUS CALCULATION =====
  const calculateCompanyStatus = () => {
    if (!walletData.isConnected) {
      return { status: "Not Connected", color: "gray" };
    }

    const tokenAmount = parseFloat(tokenData.balance) || 0;
    const debtAmount = parseFloat(tokenData.debt) || 0;

    if (tokenAmount > debtAmount) {
      return { status: "Green Contributor", color: "green" };
    } else if (tokenAmount < debtAmount) {
      return { status: "Brown Emitter", color: "brown" };
    } else {
      return { status: "Neutral", color: "gray" };
    }
  };

  // ===== WALLET FUNCTIONS =====
  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
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
      updateLoadingState("wallet", true);

      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
      }

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please check your MetaMask connection.");
      }

      const userAddress = accounts[0];
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setWalletData({
        address: userAddress,
        provider,
        signer,
        isConnected: true,
      });

      await Promise.all([loadTokenInfo(), loadWalletData(userAddress)]);

      alert("Wallet connected successfully!");
    } catch (error) {
      console.error("❌ Wallet connection error:", error);

      const errorMessages = {
        "User rejected": "Connection cancelled by user.",
        MetaMask: "Please install MetaMask to connect your wallet.",
      };

      const errorMessage = Object.keys(errorMessages).find((key) => error.message.includes(key))
        ? errorMessages[Object.keys(errorMessages).find((key) => error.message.includes(key))]
        : `Failed to connect wallet: ${error.message}`;

      alert(errorMessage);
    } finally {
      updateLoadingState("wallet", false);
    }
  };

  const loadTokenInfo = async () => {
    try {
      const cctInfo = await getCCTInfo();
      setTokenData((prev) => ({ ...prev, info: cctInfo }));
    } catch (error) {
      console.warn("⚠️ Using default token info:", error.message);
    }
  };

  const loadWalletData = async (userAddress) => {
    try {
      const [cctBalance, carbonDebt] = await Promise.all([
        getCCTBalance(userAddress).catch(() => "0"),
        getCarbonDebt(userAddress).catch(() => "0"),
      ]);

      setTokenData((prev) => ({
        ...prev,
        balance: cctBalance,
        debt: carbonDebt,
      }));
    } catch (error) {
      console.error("Error loading wallet data:", error);
      setTokenData((prev) => ({
        ...prev,
        balance: "0",
        debt: "0",
      }));
    }
  };

  // ===== PROJECT FUNCTIONS =====
  const loadAvailableProjects = async () => {
    if (!walletData.isConnected || !walletData.address) return;

    try {
      updateLoadingState("projects", true);

      const walletInfo = await fetchWalletInfo(walletData.address);
      const projects = await fetchCompanyProjects(walletInfo.companyId);

      setProjectData((prev) => ({ ...prev, availableProjects: projects }));
    } catch (error) {
      console.error("❌ Error loading projects:", error);
      setProjectData((prev) => ({ ...prev, availableProjects: [] }));
    } finally {
      updateLoadingState("projects", false);
    }
  };

  const fetchWalletInfo = async (address) => {
    const urls = [
      `http://localhost:3002/api/wallet/${address}`,
      `http://localhost:3002/api/wallet/${address.toLowerCase()}`,
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error(`Wallet address not found: ${address}`);
  };

  const fetchCompanyProjects = async (companyId) => {
    const response = await fetch(
      `http://localhost:3002/api/carbon-offset-projects?companyId=${companyId}&available=true`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch projects");
    }

    return await response.json();
  };

  const handleProjectIdChange = (newProjectId) => {
    setProjectData((prev) => ({ ...prev, selectedId: newProjectId }));
  };

  const handleMintToken = async (projectIdValue) => {
    if (!walletData.isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!projectIdValue) {
      alert("Please select a project!");
      return;
    }

    try {
      updateLoadingState("minting", true);

      const timeoutId = setTimeout(() => {
        updateLoadingState("minting", false);
        alert("⏱️ Request is taking longer than expected. Please check your balance manually.");
      }, 60000);

      updateLoadingState("timeout", timeoutId);

      const response = await fetch("/api/mint-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: walletData.address,
          projectId: projectIdValue,
        }),
      });

      clearTimeout(timeoutId);
      updateLoadingState("timeout", null);

      const result = await response.json();

      if (!response.ok || !result.success) {
        handleMintingError(result, projectIdValue);
        return;
      }

      handleMintingSuccess(result, projectIdValue);
    } catch (error) {
      console.error("❌ Error processing project:", error);
      alert(`❌ Gagal memproses project: ${error.message}`);
    } finally {
      updateLoadingState("minting", false);
      if (loadingStates.timeout) {
        clearTimeout(loadingStates.timeout);
        updateLoadingState("timeout", null);
      }
    }
  };

  const handleMintingError = (result, projectIdValue) => {
    const errorMessages = {
      invalid_wallet: `❌ Wallet ${walletData.address} tidak terdaftar dalam sistem.`,
      invalid_project: `❌ Project "${projectIdValue}" tidak ditemukan.`,
      unauthorized_project: `❌ Project "${projectIdValue}" bukan milik perusahaan Anda.`,
      project_used: `❌ Project "${projectIdValue}" sudah pernah digunakan.`,
    };

    const userMessage =
      errorMessages[result.errorType] ||
      `❌ Gagal memproses project: ${result.message || result.error}`;

    alert(userMessage);
  };

  const handleMintingSuccess = (result, projectIdValue) => {
    const { carbonCredit, transactionHash, projectName } = result.data;

    alert(
      `✅ Project Berhasil Diproses!\n\n` +
        `Project: ${projectIdValue}${projectName ? ` (${projectName})` : ""}\n` +
        `Carbon Credits: +${carbonCredit} CCT\n` +
        `Transaction: ${transactionHash}`,
    );

    // Refresh data after successful mint
    setTimeout(() => {
      loadWalletData(walletData.address);
      loadAvailableProjects();
    }, 3000);

    setProjectData((prev) => ({ ...prev, selectedId: "" }));
  };

  // ===== TRANSFER FUNCTIONS =====
  const handleDestinationWalletChange = (wallet) => {
    setTransferData((prev) => ({ ...prev, destinationWallet: wallet }));
  };

  const handleTokenAmountChange = (amount) => {
    setTransferData((prev) => ({ ...prev, numOfTokens: amount }));
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
      updateLoadingState("wallet", true);

      const result = await transferCCT(
        transferDetails.destinationWallet,
        transferDetails.numOfTokens,
      );

      alert(
        `🎉 Transfer Successful!\n\n` +
          `Amount: ${result.amount} CCT\n` +
          `To: ${result.to}\n` +
          `Transaction: ${result.transactionHash}\n` +
          `New balance: ${result.newSenderBalance} CCT`,
      );

      await loadWalletData(walletData.address);
      setTransferData({ destinationWallet: "", numOfTokens: "" });
    } catch (error) {
      console.error("❌ Transfer error:", error);
      alert(`❌ Transfer Failed: ${error.message}`);
    } finally {
      updateLoadingState("wallet", false);
    }
  };

  // ===== UTILITY FUNCTIONS =====
  const updateLoadingState = (key, value) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  // ===== RENDER COMPONENTS =====
  const renderLoadingOverlay = (isLoading, title, description) => {
    if (!isLoading) return null;

    return (
      <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="mx-4 w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{description}</p>
              {title.includes("Processing") && (
                <p className="mt-2 text-xs text-gray-500">This may take up to 60 seconds</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== MAIN RENDER =====
  const companyStatus = calculateCompanyStatus();

  return (
    <div className="flex h-screen w-full flex-col items-center gap-6 bg-blue-50/50">
      {/* Navigation */}
      <div className="w-full">
        <Navbar
          className="mt-5"
          address={walletData.address}
          isConnected={walletData.isConnected}
          onConnectWallet={handleConnectWallet}
        />
      </div>

      {/* Loading Overlays */}
      {renderLoadingOverlay(
        loadingStates.wallet,
        "Connecting Wallet",
        "Loading wallet data and token information...",
      )}

      {renderLoadingOverlay(
        loadingStates.minting,
        "Processing Project",
        "Validating project and calculating carbon credits...",
      )}

      {/* Main Content */}
      <div className="flex w-[80%] flex-col items-center justify-center gap-6">
        {/* Token Info & Debt Info */}
        <div className="flex w-full items-center justify-center gap-6">
          <TokenInfo
            token={tokenData.balance}
            tokenSymbol={tokenData.info.symbol}
            tokenName={tokenData.info.name}
          />
          <DebtInfo token={tokenData.debt} />
        </div>

        {/* Status Component */}
        <div className="w-[74%]">
          <Status
            status={companyStatus.status}
            statusColor={companyStatus.color}
            onProjectIdChange={handleProjectIdChange}
            onMintToken={handleMintToken}
          />
        </div>

        {/* Transfer Form */}
        <div className="w-[74%]">
          <TransferForm
            destinationWallet={transferData.destinationWallet}
            numOfTokens={transferData.numOfTokens}
            onDestinationWalletChange={handleDestinationWalletChange}
            onTokenAmountChange={handleTokenAmountChange}
            onTransfer={handleTransfer}
            currentUserAddress={walletData.address}
            currentBalance={tokenData.balance}
          />
        </div>
      </div>
    </div>
  );
}
