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
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266": {
    companyId: "comp1",
    type: "pangan",
    name: "PT Green Farm",
  },
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": {
    companyId: "comp2",
    type: "teknologi",
    name: "PT Solar Energy",
  },
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": {
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

// Endpoint 4: Mapping Wallet ke Identitas Perusahaan
app.get("/api/wallet/:address", (req, res) => {
  const address = req.params.address.toLowerCase();
  const data = walletToCompany[address];
  if (!data) {
    return res.status(404).json({ error: "Alamat wallet tidak ditemukan" });
  }
  res.json(data);
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
