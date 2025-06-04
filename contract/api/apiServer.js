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

// Dummy Data: Emisi Aktual Perusahaan dengan Tahun
const companyEmissions = [
  {
    companyId: "comp1",
    companyName: "PT Green Farm",
    type: "pangan",
    emissionTon: 90,
    year: 2025,
    used: false,
  },
  {
    companyId: "comp2",
    companyName: "PT Solar Energy",
    type: "teknologi",
    emissionTon: 160,
    year: 2025,
    used: false,
  },
  {
    companyId: "comp3",
    companyName: "PT Auto Motors",
    type: "otomotif",
    emissionTon: 350,
    year: 2025,
    used: false,
  },
];

// Dummy Data: Wallet ke Identitas Perusahaan
const walletToCompany = {
  // Format address yang benar sesuai MetaMask (dengan mixed case)
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": {
    companyId: "comp1",
    type: "pangan",
    name: "PT Green Farm",
  },
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8": {
    companyId: "comp2",
    type: "teknologi",
    name: "PT Solar Energy",
  },
  "0x3C44CdDdB6a900fa2b585dd299e03d12fa4293BC": {
    companyId: "comp3",
    type: "otomotif",
    name: "PT Auto Motors",
  },
};

// Endpoint 1: Batas Emisi per Jenis Perusahaan
app.get("/api/emission-limits/:type", (req, res) => {
  const type = req.params.type.toLowerCase();
  const limit = emissionLimits[type];
  if (limit === undefined) {
    return res.status(404).json({ error: "Jenis perusahaan tidak ditemukan" });
  }
  res.json({ type, limit });
});

// Endpoint 2: Proyek Penghijauan (Offset karbon)
app.get("/api/carbon-offset-projects", (req, res) => {
  const { companyId, projectId, available } = req.query;
  let filteredProjects = carbonOffsetProjects;

  if (companyId) {
    filteredProjects = filteredProjects.filter(
      (p) => p.companyId === companyId
    );
  }

  if (projectId) {
    filteredProjects = filteredProjects.filter((p) => p.id === projectId);
  }

  if (available === "true") {
    filteredProjects = filteredProjects.filter((p) => !p.used);
  }

  res.json(filteredProjects);
});

// Endpoint 3: Emisi Aktual Perusahaan
app.get("/api/company-emissions", (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const companyId = req.query.companyId;

  const filteredEmissions = companyEmissions.filter(
    (emission) =>
      emission.year === year &&
      !emission.used &&
      emission.companyId === companyId
  );
  res.json(filteredEmissions);
});

// Endpoint 4: Mapping Wallet ke Identitas Perusahaan (Enhanced debugging)
app.get("/api/wallet/:address", (req, res) => {
  const inputAddress = req.params.address;

  console.log(`🔍 Looking for wallet address: ${inputAddress}`);
  console.log(`📝 Input address type: ${typeof inputAddress}`);
  console.log(`📝 Input address length: ${inputAddress.length}`);

  // Cari dengan exact match dulu
  let data = walletToCompany[inputAddress];
  console.log(`🎯 Exact match result:`, data);

  // Jika tidak ditemukan, cari dengan case-insensitive
  if (!data) {
    console.log(`🔄 Trying case-insensitive search...`);
    const lowerInputAddress = inputAddress.toLowerCase();
    console.log(`🔤 Lowercase input: ${lowerInputAddress}`);

    const foundKey = Object.keys(walletToCompany).find((key) => {
      console.log(
        `🔍 Comparing: ${key.toLowerCase()} === ${lowerInputAddress}`
      );
      return key.toLowerCase() === lowerInputAddress;
    });

    if (foundKey) {
      console.log(`✅ Found matching key: ${foundKey}`);
      data = walletToCompany[foundKey];
    }
  }

  if (!data) {
    console.log(`❌ Wallet address not found: ${inputAddress}`);
    console.log(`📋 Available addresses:`, Object.keys(walletToCompany));

    // Enhanced debugging - show exact character comparison
    Object.keys(walletToCompany).forEach((key) => {
      console.log(`🔍 Available: "${key}" (length: ${key.length})`);
      console.log(
        `🔍 Input:     "${inputAddress}" (length: ${inputAddress.length})`
      );
      console.log(`🔍 Match: ${key === inputAddress ? "EXACT" : "NO"}`);
      console.log(
        `🔍 Lower Match: ${
          key.toLowerCase() === inputAddress.toLowerCase()
            ? "CASE-INSENSITIVE"
            : "NO"
        }`
      );
      console.log(`---`);
    });

    return res.status(404).json({
      error: "Alamat wallet tidak ditemukan",
      debug: {
        inputAddress,
        inputLength: inputAddress.length,
        availableAddresses: Object.keys(walletToCompany),
        inputLowercase: inputAddress.toLowerCase(),
      },
    });
  }

  console.log(`✅ Found wallet data for ${inputAddress}:`, data);
  res.json(data);
});

// Debug endpoint untuk melihat available addresses
app.get("/api/wallet/debug", (req, res) => {
  const addresses = Object.keys(walletToCompany).map((address) => ({
    address,
    company: walletToCompany[address].name,
    type: walletToCompany[address].type,
  }));

  res.json({
    message: "Available wallet addresses",
    addresses,
    total: addresses.length,
  });
});

// Endpoint 5: Mark Proyek Sebagai Sudah Digunakan
app.put("/api/carbon-offset-projects/:projectId/use", (req, res) => {
  const { projectId } = req.params;

  const project = carbonOffsetProjects.find((p) => p.id === projectId);

  if (!project) {
    return res.status(404).json({ error: "Project tidak ditemukan" });
  }

  if (project.used) {
    return res.status(400).json({ error: "Project sudah digunakan" });
  }

  project.used = true;
  project.usedAt = new Date().toISOString();

  res.json({
    message: `Project ${projectId} berhasil dimarkir sebagai terpakai`,
    project,
  });
});

// Endpoint 6: Update Emisi Tahunan
app.post("/api/annual-emission-update", (req, res) => {
  const year = req.body.year || new Date().getFullYear();
  const companyId = req.body.companyId;

  const emission = companyEmissions.find(
    (emission) => emission.companyId === companyId && emission.year === year
  );

  if (!emission) {
    return res.status(404).json({
      error: "Emisi untuk perusahaan ini tidak ditemukan untuk tahun tersebut",
    });
  }

  const emissionLimit = emissionLimits[emission.type];

  if (emission.emissionTon > emissionLimit) {
    const debt = emission.emissionTon - emissionLimit;
    res.json({
      success: true,
      message: `${emission.companyName} memiliki utang karbon sebesar ${debt} ton.`,
    });
  } else {
    const credit = emissionLimit - emission.emissionTon;
    res.json({
      success: true,
      message: `${emission.companyName} memiliki karbon kredit sebesar ${credit} ton.`,
    });
  }
});

// Jalankan server
app.listen(port, () => {
  console.log(`API Dummy running at http://localhost:${port}`);
});
