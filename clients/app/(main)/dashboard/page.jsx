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
  transferCCT,
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

  // Perbaikan untuk handleMintToken function
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
      console.log("🔄 Starting mint process...");
      console.log("📋 Project ID:", projectIdValue);
      console.log("👤 User Address:", walletData.address);

      const timeoutId = setTimeout(() => {
        console.warn("⚠️ Mint process timeout reached");
        setMintingLoading(false);
        alert("⏱️ Request is taking longer than expected. Please check your balance manually.");
      }, 60000);

      setLoadingTimeout(timeoutId);

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

      if (timeoutId) {
        clearTimeout(timeoutId);
        setLoadingTimeout(null);
      }

      console.log("📡 API Response status:", response.status);
      const result = await response.json();
      console.log("📡 API Response data:", result);

      if (!response.ok || !result.success) {
        console.error("❌ API Error:", result);

        // Enhanced error handling berdasarkan errorType
        let userMessage = "";

        switch (result.errorType) {
          case "invalid_wallet":
            userMessage =
              `❌ Wallet Tidak Terdaftar\n\n` +
              `Alamat wallet Anda (${walletData.address}) tidak terdaftar dalam sistem.\n\n` +
              `Silakan hubungi administrator untuk mendaftarkan wallet Anda.`;
            break;

          case "invalid_project":
            userMessage =
              `❌ Project Tidak Ditemukan\n\n` +
              `Project ID "${projectIdValue}" tidak ditemukan dalam sistem.\n\n` +
              `Silakan pilih project yang tersedia dari dropdown.`;

            if (result.availableProjects && result.availableProjects.length > 0) {
              userMessage += `\n\nProject yang tersedia:\n`;
              result.availableProjects.slice(0, 3).forEach((proj, idx) => {
                userMessage += `${idx + 1}. ${proj.id} - ${proj.name}\n`;
              });
            }
            break;

          case "unauthorized_project":
            const details = result.details || {};
            userMessage =
              `❌ Project Bukan Milik Perusahaan Anda\n\n` +
              `Project "${projectIdValue}" adalah milik perusahaan lain".\n\n` +
              `Anda hanya dapat menggunakan project milik perusahaan sendiri.`;

            if (result.availableProjects && result.availableProjects.length > 0) {
              userMessage += `\n\nProject yang tersedia untuk perusahaan Anda:\n`;
              result.availableProjects.slice(0, 3).forEach((proj, idx) => {
                userMessage += `${idx + 1}. ${proj.id} - ${proj.name} (${proj.offsetTon} tons)\n`;
              });
            } else {
              userMessage += `\n\nTidak ada project yang tersedia untuk perusahaan Anda saat ini.`;
            }
            break;

          case "project_used":
            const projectDetails = result.details || {};
            userMessage =
              `❌ Project Sudah Digunakan\n\n` +
              `Project "${projectIdValue}" sudah pernah digunakan sebelumnya.\n\n` +
              `Setiap project hanya dapat digunakan sekali untuk mint carbon credits.`;

            if (result.availableProjects && result.availableProjects.length > 0) {
              userMessage += `\n\nProject lain yang masih tersedia:\n`;
              result.availableProjects.slice(0, 3).forEach((proj, idx) => {
                userMessage += `${idx + 1}. ${proj.id} - ${proj.name} (${proj.offsetTon} tons)\n`;
              });
            } else {
              userMessage += `\n\nTidak ada project lain yang tersedia saat ini.`;
            }
            break;

          case "network_error":
            userMessage =
              `❌ Koneksi Blockchain Gagal\n\n` +
              `Tidak dapat terhubung ke jaringan blockchain.\n\n` +
              `Pastikan:\n` +
              `• Hardhat node sedang berjalan\n` +
              `• MetaMask terhubung ke localhost:8545\n` +
              `• Tidak ada firewall yang memblokir koneksi`;
            break;

          default:
            userMessage =
              `❌ Gagal Memproses Project\n\n` +
              `${result.message || result.error || "Unknown error"}\n\n` +
              `Silakan coba lagi atau hubungi administrator jika masalah berlanjut.`;
        }

        alert(userMessage);
        throw new Error(result.message || result.error);
      }

      console.log("✅ Mint successful:", result);

      // Show success message
      const { carbonCredit, transactionHash, status, projectName } = result.data;

      let statusEmoji = "✅";
      let creditInfo = "";

      if (carbonCredit > 0) {
        statusEmoji = "🎉";
        creditInfo = `Carbon Credits Earned: +${carbonCredit} CCT`;
      } else {
        statusEmoji = "ℹ️";
        creditInfo = `Project processed successfully`;
      }

      alert(
        `${statusEmoji} Project Berhasil Diproses!\n\n` +
          `Project: ${projectIdValue}${projectName ? ` (${projectName})` : ""}\n` +
          `${creditInfo}\n` +
          `Status: ${status}\n` +
          `Transaction: ${transactionHash}\n\n` +
          `Balance wallet Anda akan diperbarui dalam beberapa saat.`,
      );

      // Reload data
      setTimeout(() => {
        loadWalletData(walletData.address);
        loadAvailableProjects();
      }, 3000);

      setProjectId("");
    } catch (error) {
      console.error("❌ Error processing project:", error);

      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        setLoadingTimeout(null);
      }

      // Fallback error message jika belum di-handle di atas
      if (!error.message.includes("❌")) {
        alert(`❌ Gagal memproses project: ${error.message}`);
      }
    } finally {
      console.log("🔄 Setting minting loading to false");
      setMintingLoading(false);

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
      setWalletLoading(true);

      console.log("🔄 Starting CCT transfer...");
      console.log("📍 To:", transferDetails.destinationWallet);
      console.log("💰 Amount:", transferDetails.numOfTokens);

      // Use the new transfer function
      const result = await transferCCT(
        transferDetails.destinationWallet,
        transferDetails.numOfTokens,
      );

      console.log("✅ Transfer result:", result);

      // Show success message with details
      alert(
        `🎉 Transfer Successful!\n\n` +
          `Amount: ${result.amount} CCT\n` +
          `To: ${result.to}\n` +
          `Transaction: ${result.transactionHash}\n` +
          `Your new balance: ${result.newSenderBalance} CCT\n\n` +
          `Gas used: ${result.gasUsed} units`,
      );

      // Reload wallet data to get updated balance
      await loadWalletData(walletData.address);

      // Reset form
      setTransferData({
        destinationWallet: "",
        numOfTokens: "",
      });
    } catch (error) {
      console.error("❌ Transfer error:", error);
      alert(`❌ Transfer Failed: ${error.message}`);
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
              currentUserAddress={walletData.address}
              currentBalance={tokenBalance}
            />
          </div>
        </div>
      </div>
    </>
  );
}
