# 🌱 Web3 Carbon Credit Token (CCT) - Setup Guide

Panduan lengkap untuk menjalankan aplikasi Web3 Carbon Credit Token yang terintegrasi dengan blockchain dan carbon offset tracking.

---

## 📋 Prerequisites

Pastikan sistem Anda memiliki tools berikut:

```bash
# Node.js (v18 atau lebih tinggi)
node --version

# npm atau yarn
npm --version

# Git
git --version

# MetaMask browser extension
# Download dari: https://metamask.io/
```
---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd web3-co2
```
### 2. Install Dependencies
```bash
# Install dependencies untuk contract
cd contract
npm install

# Install dependencies untuk client
cd ../clients
npm install
```
---

## 🏗️ Deployment Process

### 3. Start Hardhat Network

Terminal 1:
```bash
cd contract
npm run start
```
atau
```bash
cd contract
npx hardhat node
```
### 4. Deploy Smart Contract
Terminal 2:
```bash
cd contract
npm run deploy
```
atau
```bash
cd contract
npx hardhat run scripts/deploy.js --network localhost
```
### 5. Update Contract Configuration
Copy contract address, lalu update clients/utils/config.js:
``` bash
export const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Paste dari hasil deployment
export const abi = [
  // ... ABI dari artifacts/contracts/CarbonCreditToken.sol/CarbonCreditToken.json
];
```
---

## 🌐 Start Services

### 6. Start API Server

Terminal 3:
```bash
cd contract
npm run api
```
atau
```bash
cd contract/api
node apiServer.js
```
### 7. Start Frontend Application
```bash
cd clients
npm run dev
```
---

## 🦊 Setup MetaMask

### 8. Configure MetaMask

- **Add Network**  
  - Network Name: `Hardhat Local`
  - RPC URL: `http://127.0.0.1:8545`
  - Chain ID: `31337`
  - Currency Symbol: `ETH`

- **Import Test Account**  
  - Copy private key dari Hardhat node
  - Import ke MetaMask

- **Add CCT Token**  
  - Contract Address: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
  - Token Symbol: `CCT`
  - Decimals: `18`

---

## 🧪 Testing the Application

### 9. Test API Endpoints

```bash
curl http://localhost:3002/api/wallet/debug
curl http://localhost:3002/api/wallet/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
curl http://localhost:3002/api/carbon-offset-projects?companyId=comp1&available=true
```
### 10. Test Project Minting
```bash
cd contract
RECEIVER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 PROJECT_ID=proj1 npx hardhat run scripts/mockOracle.js --network localhost
```
### 11. Test Emission Updates
```bash
cd contract
MODE=emission COMPANY_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 YEAR=2024 npx hardhat run scripts/mockOracle.js --network localhost
```
---

## 🖥️ Using the Frontend

### 12. Access Dashboard

- Buka: `http://localhost:3000/dashboard`
- Connect Wallet melalui MetaMask
- Mint Carbon Credits:
  - Masukkan Project ID
  - Klik "Mint Token"
- Transfer Tokens:
  - Masukkan address penerima
  - Masukkan jumlah token
  - Klik "Transfer"

---

## 📊 Available Test Data

### 13. Test Accounts & Projects

**Registered Wallets:**

| Wallet Address                              | Company                   |
| ------------------------------------------- | ------------------------- |
| 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  | PT Green Farm (pangan)     |
| 0x70997970C51812dc3A010C7d01b50e0d17dc79C8  | PT Solar Energy (teknologi)|
| 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC  | PT Auto Motors (otomotif)  |

**Available Projects:**

| Project ID | Project Name                   | CCT  | Company             |
| ---------- | ------------------------------ | ---- | ------------------- |
| proj1      | Reforestasi Hutan Kalimantan    | 50   | PT Green Farm       |
| proj2      | Solar Panel Installation       | 30   | PT Green Farm       |
| proj3      | Wind Farm Project              | 120  | PT Solar Energy     |
| proj4      | Biogas Plant                   | 40   | PT Green Farm       |
| proj5      | Electric Vehicle Fleet         | 200  | PT Auto Motors      |

**Emission Limits:**

| Sector     | Limit (tons CO2) |
| ---------- | ---------------- |
| pangan     | 100              |
| teknologi  | 150              |
| otomotif   | 300              |
| lain       | 200              |

---

## 🔗 Quick Links

- [Frontend Dashboard](http://localhost:3000/dashboard)
- [API Debug](http://localhost:3002/api/wallet/debug)
- [API Docs](http://localhost:3002/api/wallets)
- [Hardhat Console](http://127.0.0.1:8545)


