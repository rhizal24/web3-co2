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
  // ===== WALLET STATE =====
  const [walletData, setWalletData] = useState({
    address: "",
    provider: null,
    signer: null,
    isConnected: false,
  });

  // ===== TOKEN & DEBT STATE =====
  const [tokenBalance, setTokenBalance] = useState("0");
  const [carbonDebt, setCarbonDebt] = useState("0");
  const [tokenInfo, setTokenInfo] = useState({
    name: "Carbon Credit Token",
    symbol: "CCT",
    decimals: 18,
  });

  // ===== LOADING STATES =====
  const [walletLoading, setWalletLoading] = useState(false);
  const [mintingLoading, setMintingLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // ===== PROJECT & TRANSFER STATE =====
  const [projectId, setProjectId] = useState("");
  const [availableProjects, setAvailableProjects] = useState([]);
  const [transferData, setTransferData] = useState({
    destinationWallet: "",
    numOfTokens: "",
  });
  const [loadingTimeout, setLoadingTimeout] = useState(null);

  // ===== INITIALIZATION =====
  useEffect(() => {
    checkWalletConnection();
    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, []);

  // ===== STATUS CALCULATION =====
  const calculateCompanyStatus = () => {
    if (!walletData.isConnected) {
      return { status: "Not Connected", color: "gray" };
    }

    const tokenAmount = parseFloat(tokenBalance) || 0;
    const debtAmount = parseFloat(carbonDebt) || 0;

    console.log("🧮 Status calculation:", { tokenAmount, debtAmount });

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
      setWalletLoading(true);

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
        provider: provider,
        signer: signer,
        isConnected: true,
      });

      // Load token info
      try {
        const cctInfo = await getCCTInfo();
        setTokenInfo(cctInfo);
      } catch (error) {
        console.warn("⚠️ Using default token info:", error.message);
      }

      // Load wallet data
      await loadWalletData(userAddress);
      alert("Wallet connected successfully!");
    } catch (error) {
      console.error("❌ Wallet connection error:", error);

      let errorMessage = "Failed to connect wallet: " + error.message;
      if (error.message.includes("User rejected")) {
        errorMessage = "Connection cancelled by user.";
      } else if (error.message.includes("MetaMask")) {
        errorMessage = "Please install MetaMask to connect your wallet.";
      }

      alert(errorMessage);
    } finally {
      setWalletLoading(false);
    }
  };

  const loadWalletData = async (userAddress) => {
    try {
      // Get CCT balance
      try {
        const cctBalance = await getCCTBalance(userAddress);
        setTokenBalance(cctBalance);
      } catch (error) {
        console.warn("⚠️ Could not get CCT balance:", error.message);
        setTokenBalance("0");
      }

      // Get carbon debt
      try {
        const debt = await getCarbonDebt(userAddress);
        setCarbonDebt(debt);
      } catch (error) {
        console.warn("⚠️ Could not get carbon debt:", error.message);
        setCarbonDebt("0");
      }
    } catch (error) {
      console.error("Error loading wallet data:", error);
      setTokenBalance("0");
      setCarbonDebt("0");
    }
  };

  // ===== PROJECT FUNCTIONS =====
  const loadAvailableProjects = async () => {
    if (!walletData.isConnected || !walletData.address) return;

    try {
      setProjectsLoading(true);

      // Get wallet info
      let walletResponse = await fetch(`http://localhost:3002/api/wallet/${walletData.address}`);
      if (!walletResponse.ok) {
        walletResponse = await fetch(
          `http://localhost:3002/api/wallet/${walletData.address.toLowerCase()}`,
        );
      }

      if (!walletResponse.ok) {
        throw new Error(`Wallet address not found: ${walletData.address}`);
      }

      const walletInfo = await walletResponse.json();

      // Get available projects
      const projectsResponse = await fetch(
        `http://localhost:3002/api/carbon-offset-projects?companyId=${walletInfo.companyId}&available=true`,
      );

      if (!projectsResponse.ok) {
        throw new Error("Failed to fetch projects");
      }

      const projects = await projectsResponse.json();
      setAvailableProjects(projects);
    } catch (error) {
      console.error("❌ Error loading projects:", error);
      setAvailableProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Load projects when wallet connected
  useEffect(() => {
    if (walletData.isConnected && walletData.address) {
      const timer = setTimeout(() => {
        loadAvailableProjects();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [walletData.isConnected, walletData.address]);

  const handleProjectIdChange = (newProjectId) => {
    setProjectId(newProjectId);
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
      setMintingLoading(true);

      // Set timeout for long-running requests
      const timeoutId = setTimeout(() => {
        setMintingLoading(false);
        alert("⏱️ Request is taking longer than expected. Please check your balance manually.");
      }, 60000);

      setLoadingTimeout(timeoutId);

      const response = await fetch("/api/mint-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: walletData.address,
          projectId: projectIdValue,
        }),
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
        setLoadingTimeout(null);
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Handle different error types
        let userMessage = "";
        switch (result.errorType) {
          case "invalid_wallet":
            userMessage = `❌ Wallet ${walletData.address} tidak terdaftar dalam sistem.`;
            break;
          case "invalid_project":
            userMessage = `❌ Project "${projectIdValue}" tidak ditemukan.`;
            break;
          case "unauthorized_project":
            userMessage = `❌ Project "${projectIdValue}" bukan milik perusahaan Anda.`;
            break;
          case "project_used":
            userMessage = `❌ Project "${projectIdValue}" sudah pernah digunakan.`;
            break;
          default:
            userMessage = `❌ Gagal memproses project: ${result.message || result.error}`;
        }

        alert(userMessage);
        throw new Error(result.message || result.error);
      }

      // Success message
      const { carbonCredit, transactionHash, projectName } = result.data;

      alert(
        `✅ Project Berhasil Diproses!\n\n` +
          `Project: ${projectIdValue}${projectName ? ` (${projectName})` : ""}\n` +
          `Carbon Credits: +${carbonCredit} CCT\n` +
          `Transaction: ${transactionHash}`,
      );

      // Reload data
      setTimeout(() => {
        loadWalletData(walletData.address);
        loadAvailableProjects();
      }, 3000);

      setProjectId("");
    } catch (error) {
      console.error("❌ Error processing project:", error);
      if (!error.message.includes("❌")) {
        alert(`❌ Gagal memproses project: ${error.message}`);
      }
    } finally {
      setMintingLoading(false);
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    }
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
      setWalletLoading(true);

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
      setWalletLoading(false);
    }
  };

  // ===== RENDER =====
  const companyStatus = calculateCompanyStatus();

  return (
    <div className="item-center flex h-screen w-full flex-col items-center gap-6 bg-blue-50/50">
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
      {walletLoading && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">Connecting Wallet</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Loading wallet data and token information...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {mintingLoading && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">Processing Project</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Validating project and calculating carbon credits...
                </p>
                <p className="mt-2 text-xs text-gray-500">This may take up to 60 seconds</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex w-[80%] flex-col items-center justify-center gap-6">
        {/* Token Info & Debt Info */}
        <div className="flex w-full items-center justify-center gap-6">
          <TokenInfo
            token={tokenBalance}
            tokenSymbol={tokenInfo.symbol}
            tokenName={tokenInfo.name}
          />
          <DebtInfo token={carbonDebt} />
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
            currentBalance={tokenBalance}
          />
        </div>
      </div>
    </div>
  );
}
