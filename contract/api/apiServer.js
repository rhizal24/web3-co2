const express = require("express");
const cors = require("cors");
const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// Dummy Data: Batas emisi per jenis perusahaan
const emissionLimits = {
  pangan: 100,
  otomotif: 300,
  teknologi: 150,
  lain: 200,
};

// Dummy Data: Proyek Penghijauan (Offset karbon) per perusahaan
const carbonOffsetProjects = [
  {
    id: "proj1",
    companyId: "comp1",
    companyName: "PT Green Farm",
    projectName: "Reforestasi Hutan Kalimantan",
    offsetTon: 50,
    used: false,
    createdAt: "2025-01-01",
    description: "Penanaman 1000 pohon di Kalimantan",
  },
  {
    id: "proj2",
    companyId: "comp1",
    companyName: "PT Green Farm",
    projectName: "Solar Panel Installation",
    offsetTon: 30,
    used: false,
    createdAt: "2025-02-01",
    description: "Instalasi panel surya 100kW",
  },
  {
    id: "proj3",
    companyId: "comp2",
    companyName: "PT Solar Energy",
    projectName: "Wind Farm Project",
    offsetTon: 120,
    used: false,
    createdAt: "2025-01-15",
    description: "Pembangunan wind farm 50MW",
  },
  {
    id: "proj4",
    companyId: "comp1",
    companyName: "PT Green Farm",
    projectName: "Biogas Plant",
    offsetTon: 40,
    used: false,
    createdAt: "2025-03-01",
    description: "Pembangunan biogas dari limbah organik",
  },
  {
    id: "proj5",
    companyId: "comp3",
    companyName: "PT Auto Motors",
    projectName: "Electric Vehicle Fleet",
    offsetTon: 200,
    used: false,
    createdAt: "2025-02-15",
    description: "Konversi fleet kendaraan ke electric",
  },
];

// Dummy Data: User/Wallet registrations
const walletRegistrations = [
  {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    companyId: "comp1",
    type: "pangan",
    name: "PT Green Farm",
    registeredAt: "2025-01-01",
  },
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    companyId: "comp2",
    type: "teknologi",
    name: "PT Solar Energy",
    registeredAt: "2025-01-02",
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    companyId: "comp3",
    type: "otomotif",
    name: "PT Auto Motors",
    registeredAt: "2025-01-03",
  },
];

// API: Get wallet info by address
app.get("/api/wallet/:address", (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    console.log("🔍 Looking up wallet:", address);

    const wallet = walletRegistrations.find(
      (w) => w.address.toLowerCase() === address
    );

    if (!wallet) {
      console.log("❌ Wallet not found for address:", address);
      return res.status(404).json({
        error: "Wallet address not found",
        message: `Address ${req.params.address} is not registered in the system`,
        availableAddresses: walletRegistrations.map((w) => w.address),
      });
    }

    console.log("✅ Wallet found:", wallet);
    res.json(wallet);
  } catch (error) {
    console.error("❌ Error in wallet lookup:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// API: Validate project untuk specific user
app.post("/api/validate-project", (req, res) => {
  try {
    const { projectId, userAddress } = req.body;

    console.log("🔍 Validating project:", { projectId, userAddress });

    // Get user wallet info
    const wallet = walletRegistrations.find(
      (w) => w.address.toLowerCase() === userAddress.toLowerCase()
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "WALLET_NOT_FOUND",
        message: `Wallet address ${userAddress} tidak terdaftar dalam sistem`,
        errorType: "invalid_wallet",
      });
    }

    // Find project
    const project = carbonOffsetProjects.find((p) => p.id === projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "PROJECT_NOT_FOUND",
        message: `Project ID "${projectId}" tidak ditemukan`,
        errorType: "invalid_project",
        availableProjects: carbonOffsetProjects
          .filter((p) => p.companyId === wallet.companyId)
          .map((p) => ({ id: p.id, name: p.projectName, used: p.used })),
      });
    }

    // Check if project belongs to user's company
    if (project.companyId !== wallet.companyId) {
      const ownerCompany = walletRegistrations.find(
        (w) => w.companyId === project.companyId
      );

      return res.status(403).json({
        success: false,
        error: "PROJECT_NOT_OWNED",
        message: `Project "${projectId}" bukan milik perusahaan Anda`,
        errorType: "unauthorized_project",
        details: {
          projectOwner: project.companyName,
          yourCompany: wallet.name,
          projectId: projectId,
        },
        availableProjects: carbonOffsetProjects
          .filter((p) => p.companyId === wallet.companyId && !p.used)
          .map((p) => ({
            id: p.id,
            name: p.projectName,
            offsetTon: p.offsetTon,
          })),
      });
    }

    // Check if project already used
    if (project.used) {
      return res.status(409).json({
        success: false,
        error: "PROJECT_ALREADY_USED",
        message: `Project "${projectId}" sudah pernah digunakan sebelumnya`,
        errorType: "project_used",
        details: {
          projectId: projectId,
          projectName: project.projectName,
          usedAt: project.usedAt || "Unknown",
        },
        availableProjects: carbonOffsetProjects
          .filter((p) => p.companyId === wallet.companyId && !p.used)
          .map((p) => ({
            id: p.id,
            name: p.projectName,
            offsetTon: p.offsetTon,
          })),
      });
    }

    // Project is valid!
    res.json({
      success: true,
      message: "Project validation successful",
      project: project,
      wallet: wallet,
    });
  } catch (error) {
    console.error("❌ Error validating project:", error);
    res.status(500).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: "Internal server error during validation",
      details: error.message,
    });
  }
});

// API: Mark project as used
app.put("/api/carbon-offset-projects/:projectId/use", (req, res) => {
  try {
    const { projectId } = req.params;
    const project = carbonOffsetProjects.find((p) => p.id === projectId);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    project.used = true;
    project.usedAt = new Date().toISOString();

    console.log("✅ Project marked as used:", projectId);
    res.json({ success: true, project: project });
  } catch (error) {
    console.error("❌ Error marking project as used:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Get carbon offset projects (dengan filter enhanced)
app.get("/api/carbon-offset-projects", (req, res) => {
  try {
    const { companyId, available, projectId } = req.query;

    let filteredProjects = [...carbonOffsetProjects];

    // Filter by company
    if (companyId) {
      filteredProjects = filteredProjects.filter(
        (project) => project.companyId === companyId
      );
    }

    // Filter by availability
    if (available === "true") {
      filteredProjects = filteredProjects.filter((project) => !project.used);
    }

    // Filter by specific project ID
    if (projectId) {
      filteredProjects = filteredProjects.filter(
        (project) => project.id === projectId
      );
    }

    console.log("📋 Returning projects:", filteredProjects.length);
    res.json(filteredProjects);
  } catch (error) {
    console.error("❌ Error fetching projects:", error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint
app.get("/api/wallet/debug", (req, res) => {
  res.json({
    message: "API is working",
    timestamp: new Date().toISOString(),
    registeredWallets: walletRegistrations.length,
    totalProjects: carbonOffsetProjects.length,
  });
});

// API: Get all registered wallets (for debugging)
app.get("/api/wallets", (req, res) => {
  res.json({
    wallets: walletRegistrations,
    count: walletRegistrations.length,
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 API Server running on http://localhost:${port}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /api/wallet/:address`);
  console.log(`   POST /api/validate-project`);
  console.log(`   GET  /api/carbon-offset-projects`);
  console.log(`   PUT  /api/carbon-offset-projects/:projectId/use`);
  console.log(`   GET  /api/wallet/debug`);
  console.log(`   GET  /api/wallets`);
});
