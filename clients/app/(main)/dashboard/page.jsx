"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Navbar from "@/components/Navbar";
import TokenInfo from "@/components/TokenInfo";
import DebtInfo from "@/components/DebtInfo";
import Status from "@/components/Status";
import TransferForm from "@/components/TransferForm";
import {
  useContract,
  getCCTBalance,
  getCCTInfo,
  getCarbonDebt,
  checkContractDeployment, // Tambahkan import ini
} from "@/utils/backend";
import { address } from "@/utils/config"; // Tambahkan import address

export default function Home() {
  const [walletData, setWalletData] = useState({
    address: "",
    provider: null,
    signer: null,
    isConnected: false,
  });

  // State untuk CCT balance (bukan ETH balance)
  const [tokenBalance, setTokenBalance] = useState("0");
  const [carbonDebt, setCarbonDebt] = useState("0");
  const [tokenInfo, setTokenInfo] = useState({
    name: "Carbon Credit Token",
    symbol: "CCT",
    decimals: 18,
  });

  // PISAHKAN LOADING STATES
  const [walletLoading, setWalletLoading] = useState(false); // Untuk wallet connection
  const [mintingLoading, setMintingLoading] = useState(false); // Untuk minting process
  const [projectsLoading, setProjectsLoading] = useState(false); // Untuk loading projects

  const [projectId, setProjectId] = useState("");
  const [transferData, setTransferData] = useState({
    destinationWallet: "",
    numOfTokens: "",
  });

  // State untuk available projects
  const [availableProjects, setAvailableProjects] = useState([]);

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
      setWalletLoading(true);

      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
      }

      console.log("🔄 Connecting to wallet...");

      // Connect to wallet and get account info
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please check your MetaMask connection.");
      }

      const userAddress = accounts[0];
      console.log("✅ Wallet connected:", userAddress);

      // Setup provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setWalletData({
        address: userAddress,
        provider: provider,
        signer: signer,
        isConnected: true,
      });

      // Try to load CCT token info (with fallback)
      try {
        const cctInfo = await getCCTInfo();
        setTokenInfo(cctInfo);
        console.log("✅ Token info loaded:", cctInfo);
      } catch (error) {
        console.warn("⚠️ Using default token info due to error:", error.message);
        setTokenInfo({
          name: "Carbon Credit Token",
          symbol: "CCT",
          decimals: 18,
          totalSupply: "0",
        });
      }

      // Try to load wallet data (CCT balance)
      try {
        await loadWalletData(userAddress);
      } catch (error) {
        console.warn("⚠️ Could not load wallet data:", error.message);
        setTokenBalance("0");
        setCarbonDebt("0");
      }

      alert("Wallet connected successfully!");
    } catch (error) {
      console.error("❌ Wallet connection error:", error);

      let errorMessage = "Failed to connect wallet: " + error.message;

      if (error.message.includes("User rejected")) {
        errorMessage = "Connection cancelled by user.";
      } else if (error.message.includes("MetaMask")) {
        errorMessage = "Please install MetaMask to connect your wallet.";
      } else if (error.message.includes("No accounts found")) {
        errorMessage = "No MetaMask accounts found. Please create an account in MetaMask.";
      }

      alert(errorMessage);
    } finally {
      setWalletLoading(false);
    }
  };

  const loadWalletData = async (userAddress) => {
    try {
      console.log("Loading wallet data for:", userAddress);

      // Try to get CCT balance
      try {
        const cctBalance = await getCCTBalance(userAddress);
        console.log("CCT balance:", cctBalance);
        setTokenBalance(cctBalance);
      } catch (error) {
        console.warn("⚠️ Could not get CCT balance:", error.message);
        setTokenBalance("0");
      }

      // Try to get carbon debt
      try {
        const debt = await getCarbonDebt(userAddress);
        console.log("Carbon debt:", debt);
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

  // Enhanced function untuk load available projects - DENGAN LOADING STATE
  const loadAvailableProjects = async () => {
    if (!walletData.isConnected || !walletData.address) return;

    try {
      setProjectsLoading(true); // Set loading untuk projects
      console.log("🔄 Loading available projects...");
      console.log("👤 User address:", walletData.address);

      // Step 1: Get wallet info first
      let walletResponse = await fetch(`http://localhost:3002/api/wallet/${walletData.address}`);

      // If failed, try with lowercase
      if (!walletResponse.ok) {
        console.log("⚠️ Trying with lowercase address...");
        walletResponse = await fetch(
          `http://localhost:3002/api/wallet/${walletData.address.toLowerCase()}`,
        );
      }

      if (!walletResponse.ok) {
        const errorData = await walletResponse.json();
        console.error("❌ Wallet lookup failed:", errorData);
        throw new Error(`Wallet address not found: ${walletData.address}`);
      }

      const walletInfo = await walletResponse.json();
      console.log("✅ Wallet info:", walletInfo);

      // Step 2: Get available projects for this company
      const projectsResponse = await fetch(
        `http://localhost:3002/api/carbon-offset-projects?companyId=${walletInfo.companyId}&available=true`,
      );

      if (!projectsResponse.ok) {
        throw new Error("Failed to fetch projects");
      }

      const projects = await projectsResponse.json();
      console.log("📋 Available projects:", projects);

      // Update state
      setAvailableProjects(projects);

      // Store wallet info for later use
      setWalletData((prev) => ({
        ...prev,
        companyInfo: walletInfo,
      }));

      console.log("✅ Successfully loaded", projects.length, "projects");
    } catch (error) {
      console.error("❌ Error loading available projects:", error);

      // Show user-friendly error
      if (error.message.includes("Wallet address not found")) {
        console.warn("⚠️ This wallet address is not registered in the system");
        setAvailableProjects([]);
      } else {
        console.error("❌ Unexpected error loading projects");
        setAvailableProjects([]);
      }
    } finally {
      setProjectsLoading(false); // Clear loading state
    }
  };

  // Load projects when wallet is connected - DENGAN DELAY
  useEffect(() => {
    if (walletData.isConnected && walletData.address) {
      // Add small delay to not interfere with main wallet loading
      const timer = setTimeout(() => {
        loadAvailableProjects();
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, [walletData.isConnected, walletData.address]);

  const handleProjectIdChange = (newProjectId) => {
    setProjectId(newProjectId);
    console.log("Project ID changed:", newProjectId);
  };

  const [loadingTimeout, setLoadingTimeout] = useState(null);

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
      setMintingLoading(true); // Gunakan mintingLoading instead of loading

      // Set backup timeout untuk loading state
      const timeoutId = setTimeout(() => {
        console.warn("⚠️ Loading timeout reached, forcing loading to false");
        setMintingLoading(false);
        alert("⏱️ Request is taking longer than expected. Please check the results manually.");
      }, 65000);

      setLoadingTimeout(timeoutId);

      console.log("🔄 Processing project:", projectIdValue);
      console.log("👤 User address:", walletData.address);

      // Call API to mint tokens using Oracle
      console.log("📡 Calling mint API...");

      const response = await fetch("/api/mint-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userAddress: walletData.address,
          projectId: projectIdValue,
        }),
      });

      // Clear timeout since request completed
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }

      console.log("📡 API Response status:", response.status);

      const result = await response.json();
      console.log("📡 API Response data:", result);

      if (!response.ok) {
        console.error("❌ API Error:", result);
        throw new Error(result.details || result.error || "Failed to mint tokens");
      }

      if (!result.success) {
        console.error("❌ Operation failed:", result);
        throw new Error(result.details || result.error || "Operation failed");
      }

      console.log("✅ Mint API response:", result);

      // Show success message with details
      const { carbonCredit, transactionHash, status } = result.data;

      let statusEmoji = "✅";
      let creditInfo = "";

      if (carbonCredit > 0) {
        statusEmoji = "🎉";
        creditInfo = `Carbon Credits Earned: +${carbonCredit} CCT`;
      } else if (carbonCredit < 0) {
        statusEmoji = "⚠️";
        creditInfo = `Carbon Debt: ${Math.abs(carbonCredit)} CCT`;
      } else {
        statusEmoji = "ℹ️";
        creditInfo = `No carbon credits awarded`;
      }

      alert(
        `${statusEmoji} Project ${projectIdValue} processed successfully!\n\n` +
          `${creditInfo}\n` +
          `Status: ${status}\n` +
          `Transaction: ${transactionHash}\n\n` +
          `Your wallet balance will be updated shortly.`,
      );

      // Reload wallet data to get updated balance
      console.log("🔄 Reloading wallet data...");
      setTimeout(() => {
        loadWalletData(walletData.address);
      }, 2000);

      // Reset project ID
      setProjectId("");
    } catch (error) {
      console.error("❌ Error processing project:", error);

      // Clear timeout on error
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }

      // Handle specific error types
      if (
        error.message.includes("Project ID tidak valid") ||
        error.message.includes("invalid_project")
      ) {
        alert(
          `❌ Project ID "${projectIdValue}" tidak valid atau sudah digunakan.\n\nSilakan pilih project yang tersedia dari dropdown.`,
        );
      } else if (error.message.includes("timeout")) {
        alert(
          `⏱️ Request timeout. Proses minting memerlukan waktu lebih lama.\n\nSilakan cek balance Anda dalam beberapa saat.`,
        );
        setTimeout(() => loadWalletData(walletData.address), 5000);
      } else if (
        error.message.includes("Wallet address tidak ditemukan") ||
        error.message.includes("invalid_wallet")
      ) {
        alert(
          `❌ Alamat wallet Anda tidak terdaftar dalam sistem.\n\nSilakan hubungi administrator.`,
        );
      } else if (
        error.message.includes("sudah digunakan") ||
        error.message.includes("project_used")
      ) {
        alert(
          `❌ Project "${projectIdValue}" sudah digunakan sebelumnya.\n\nSilakan pilih project lain.`,
        );
      } else if (error.message.includes("file_not_found") || error.message.includes("not found")) {
        alert(
          `❌ Configuration error: Oracle script not found.\n\nPlease check system configuration.`,
        );
      } else {
        alert(`❌ Failed to process project: ${error.message}`);
      }
    } finally {
      // PENTING: Pastikan loading selalu di-set false
      console.log("🔄 Setting minting loading to false");
      setMintingLoading(false);

      // Clear timeout jika masih ada
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }
    }
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

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
      setWalletLoading(true); // Gunakan walletLoading untuk transfer
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
      setWalletLoading(false);
    }
  };

  // Debug untuk memastikan state tersedia
  useEffect(() => {
    console.log("🐛 Debug states:");
    console.log("- walletLoading:", walletLoading);
    console.log("- mintingLoading:", mintingLoading);
    console.log("- projectsLoading:", projectsLoading);
    console.log("- availableProjects:", availableProjects);
    console.log("- walletData.isConnected:", walletData.isConnected);
  }, [walletLoading, mintingLoading, projectsLoading, availableProjects, walletData.isConnected]);

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

        {/* Wallet Connection Loading Overlay */}
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

        {/* Minting Process Loading Overlay */}
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

        <div className="flex w-[80%] flex-col items-center justify-center gap-6">
          <div className="flex w-full items-center justify-center gap-6">
            {/* TokenInfo akan menampilkan CCT balance */}
            <TokenInfo
              token={tokenBalance}
              tokenSymbol={tokenInfo.symbol}
              tokenName={tokenInfo.name}
            />
            <DebtInfo token={carbonDebt} />
          </div>
          <div className="w-[74%]">
            <Status
              status={walletData.isConnected ? "Green Contributor" : "Not Connected"}
              onProjectIdChange={handleProjectIdChange}
              onMintToken={handleMintToken}
              availableProjects={availableProjects}
              projectsLoading={projectsLoading}
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
