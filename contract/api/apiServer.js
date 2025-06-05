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

// TAMBAHAN BARU: Data penggunaan emisi tahunan per company
const annualEmissions = {
  2023: {
    comp1: { actual: 120, year: 2023, lastUpdated: "2024-01-15" }, // PT Green Farm - Deficit
    comp2: { actual: 130, year: 2023, lastUpdated: "2024-01-15" }, // PT Solar Energy - Surplus
    comp3: { actual: 350, year: 2023, lastUpdated: "2024-01-15" }, // PT Auto Motors - Deficit
  },
  2024: {
    comp1: { actual: 80, year: 2024, lastUpdated: "2024-12-31" }, // PT Green Farm - Surplus
    comp2: { actual: 140, year: 2024, lastUpdated: "2024-12-31" }, // PT Solar Energy - Surplus
    comp3: { actual: 280, year: 2024, lastUpdated: "2024-12-31" }, // PT Auto Motors - Surplus
  },
  2025: {
    comp1: { actual: 95, year: 2025, lastUpdated: "2025-06-05" }, // PT Green Farm - Surplus
    comp2: { actual: 160, year: 2025, lastUpdated: "2025-06-05" }, // PT Solar Energy - Deficit
    comp3: { actual: 320, year: 2025, lastUpdated: "2025-06-05" }, // PT Auto Motors - Deficit
  },
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

// API BARU: Get emission data untuk company dan year tertentu
app.get("/api/emissions/:address/:year", (req, res) => {
  try {
    const { address, year } = req.params;

    console.log(
      `🔍 Looking up emissions for address: ${address}, year: ${year}`
    );

    // Find wallet/company info
    const wallet = walletRegistrations.find(
      (w) => w.address.toLowerCase() === address.toLowerCase()
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "WALLET_NOT_FOUND",
        message: `Wallet address ${address} tidak terdaftar dalam sistem`,
      });
    }

    // Get emission limit berdasarkan company type
    const emissionLimit = emissionLimits[wallet.type];
    if (!emissionLimit) {
      return res.status(404).json({
        success: false,
        error: "EMISSION_LIMIT_NOT_FOUND",
        message: `Emission limit untuk tipe ${wallet.type} tidak ditemukan`,
      });
    }

    // Get actual emission data untuk year tertentu
    const yearData = annualEmissions[year];
    if (!yearData) {
      return res.status(404).json({
        success: false,
        error: "YEAR_DATA_NOT_FOUND",
        message: `Data emisi untuk tahun ${year} tidak tersedia`,
        availableYears: Object.keys(annualEmissions),
      });
    }

    const companyEmission = yearData[wallet.companyId];
    if (!companyEmission) {
      return res.status(404).json({
        success: false,
        error: "COMPANY_EMISSION_NOT_FOUND",
        message: `Data emisi untuk company ${wallet.name} di tahun ${year} tidak tersedia`,
      });
    }

    // Calculate surplus/deficit
    const actualEmission = companyEmission.actual;
    const carbonBalance = emissionLimit - actualEmission; // Positive = surplus, Negative = deficit
    const status = carbonBalance >= 0 ? "surplus" : "deficit";

    const result = {
      success: true,
      data: {
        company: {
          name: wallet.name,
          type: wallet.type,
          companyId: wallet.companyId,
          address: wallet.address,
        },
        emission: {
          year: parseInt(year),
          limit: emissionLimit,
          actual: actualEmission,
          balance: carbonBalance,
          status: status,
          lastUpdated: companyEmission.lastUpdated,
        },
        calculation: {
          formula: "limit - actual = balance",
          example: `${emissionLimit} - ${actualEmission} = ${carbonBalance}`,
          unit: "tons CO2",
        },
      },
    };

    console.log("✅ Emission data found:", result.data);
    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching emission data:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      details: error.message,
    });
  }
});

// API BARU: Get emission summary untuk semua years
app.get("/api/emissions/:address", (req, res) => {
  try {
    const { address } = req.params;

    console.log(`🔍 Looking up all emissions for address: ${address}`);

    const wallet = walletRegistrations.find(
      (w) => w.address.toLowerCase() === address.toLowerCase()
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "WALLET_NOT_FOUND",
        message: `Wallet address ${address} tidak terdaftar dalam sistem`,
      });
    }

    const emissionLimit = emissionLimits[wallet.type];
    const summary = [];

    // Get data untuk semua years
    Object.keys(annualEmissions).forEach((year) => {
      const yearData = annualEmissions[year];
      const companyEmission = yearData[wallet.companyId];

      if (companyEmission) {
        const actualEmission = companyEmission.actual;
        const carbonBalance = emissionLimit - actualEmission;
        const status = carbonBalance >= 0 ? "surplus" : "deficit";

        summary.push({
          year: parseInt(year),
          limit: emissionLimit,
          actual: actualEmission,
          balance: carbonBalance,
          status: status,
          lastUpdated: companyEmission.lastUpdated,
        });
      }
    });

    res.json({
      success: true,
      data: {
        company: {
          name: wallet.name,
          type: wallet.type,
          address: wallet.address,
        },
        emissionHistory: summary,
        totalYears: summary.length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching emission summary:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      details: error.message,
    });
  }
});

// API BARU: Update emission data (simulate oracle update)
app.put("/api/emissions/:address/:year", (req, res) => {
  try {
    const { address, year } = req.params;
    const { actualEmission } = req.body;

    console.log(
      `🔄 Updating emissions for address: ${address}, year: ${year}, actual: ${actualEmission}`
    );

    // Validate input
    if (!actualEmission || isNaN(actualEmission) || actualEmission < 0) {
      return res.status(400).json({
        success: false,
        error: "INVALID_EMISSION_DATA",
        message: "actualEmission harus berupa angka positif",
      });
    }

    const wallet = walletRegistrations.find(
      (w) => w.address.toLowerCase() === address.toLowerCase()
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "WALLET_NOT_FOUND",
        message: `Wallet address ${address} tidak terdaftar dalam sistem`,
      });
    }

    // Ensure year data exists
    if (!annualEmissions[year]) {
      annualEmissions[year] = {};
    }

    // Update emission data
    annualEmissions[year][wallet.companyId] = {
      actual: parseFloat(actualEmission),
      year: parseInt(year),
      lastUpdated: new Date().toISOString(),
    };

    // Calculate new balance
    const emissionLimit = emissionLimits[wallet.type];
    const carbonBalance = emissionLimit - actualEmission;
    const status = carbonBalance >= 0 ? "surplus" : "deficit";

    console.log("✅ Emission data updated successfully");

    res.json({
      success: true,
      message: "Emission data updated successfully",
      data: {
        company: wallet.name,
        year: parseInt(year),
        limit: emissionLimit,
        actual: parseFloat(actualEmission),
        balance: carbonBalance,
        status: status,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error updating emission data:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Internal server error",
      details: error.message,
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 API Server running on http://localhost:${port}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /api/wallet/:address`);
  console.log(`   POST /api/validate-project`);
  console.log(`   GET  /api/carbon-offset-projects`);
  console.log(`   PUT  /api/carbon-offset-projects/:projectId/use`);
  console.log(`   GET  /api/emissions/:address/:year`); // NEW
  console.log(`   GET  /api/emissions/:address`); // NEW
  console.log(`   PUT  /api/emissions/:address/:year`); // NEW
  console.log(`   GET  /api/wallet/debug`);
  console.log(`   GET  /api/wallets`);
});
