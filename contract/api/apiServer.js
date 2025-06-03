const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

app.use(cors());

// Data Batas Emisi per Jenis Perusahaan
const emissionLimits = {
  pangan: 100,
  otomotif: 300,
  teknologi: 150,
  lain: 200,
};

// Data Proyek Penghijauan (Offset karbon) per perusahaan
const carbonOffsetProjects = [
  { companyId: "comp1", companyName: "PT Green Farm", offsetTon: 50 },
  { companyId: "comp2", companyName: "PT Solar Energy", offsetTon: 120 },
];

// Data Emisi Aktual Perusahaan
const companyEmissions = [
  {
    companyId: "comp1",
    companyName: "PT Green Farm",
    type: "pangan",
    emissionTon: 90,
  },
  {
    companyId: "comp2",
    companyName: "PT Solar Energy",
    type: "teknologi",
    emissionTon: 160,
  },
  {
    companyId: "comp3",
    companyName: "PT Auto Motors",
    type: "otomotif",
    emissionTon: 350,
  },
];

// Mapping Wallet ke Identitas Perusahaan
const walletToCompany = {
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": {
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
  res.json(carbonOffsetProjects);
});

// Endpoint 3: Emisi Aktual Perusahaan
app.get("/api/company-emissions", (req, res) => {
  res.json(companyEmissions);
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

// Jalankan server
app.listen(port, () => {
  console.log(`API Dummy running at http://localhost:${port}`);
});
