# 👗 ArcWear

ArcWear is an agentic, Web3-native luxury storefront built on Circle's **Arc L1 Blockchain** utilizing **USDC stablecoin** payments. Shoppers can browse, customize, and purchase luxury items either manually or through an **Autonomous AI Shopping Agent** powered by ERC-8183 escrow agreements.

---

## 🌟 Key Features

- 🤖 **Autonomous AI Shopping Agent**: Chat with a natural language agent that can search the catalogue, manage your cart, and execute checkout transactions autonomously once allowance is approved.
- ⚡ **Arc L1 Blockchain Integration**: Complete USDC transactions with sub-second finality, gas verification, and native wallet network switching (MetaMask/Rabby).
- 🔒 **ERC-8183 Trustless Escrow**: Built-in consumer protection. Payments are held in smart contract escrow and released to the merchant only after you confirm delivery.
- 🌓 **Premium Dark/Light Theme**: A stunning UI theme toggle featuring smooth transitions and spring-physics knobs.
- 👔 **Organized Fashion Subdivisions**: Clean storefront organization separating fashion items into **Shirts**, **Trousers**, **Belts**, **Caps**, and **Shoes**—each cleanly grouped into **Men**, **Women**, and **Kids** sections.

---

## 📁 Directory Structure

```
├── api/                          # Vercel Serverless Functions
│   ├── agent-pay.js              # Autonomous AI agent purchase endpoint
│   ├── escrow.js                 # ERC-8183 escrow release & status handlers
│   ├── history.js                # Chat session logs retrieval & save
│   ├── orders.js                 # Orders database syncer
│   └── send-confirmation.js      # Post-purchase email confirmations
├── contracts/                    # Solidity Smart Contracts (Foundry)
│   ├── AgenticCommerce.sol       # Core commerce contract handling trustless escrows
│   ├── MerchantVault.sol         # Vault contract for merchant settlements
│   ├── ArcWearTypes.sol          # Shared data structs & type definitions
│   ├── ArcWearErrors.sol         # Contract-specific revert errors
│   └── ArcWearEvents.sol         # On-chain transaction events
├── test/                         # Foundry Smart Contract Test Suites
│   ├── AgenticCommerce.t.sol     # Coverage for escrows, confirmations & timeouts
│   └── MerchantVault.t.sol       # Coverage for fee cuts, lockups & withdrawals
├── script/                       # Smart Contract deployment scripts
└── src/                          # Frontend Application Code (React + Vite)
    ├── components/               # React modals, checkout flow, drawers & pages
    ├── hooks/                    # Custom React hooks (e.g. useAllowance)
    ├── assets/                   # Local media & branding resources
    ├── catalogue.js              # Centralized catalogue database (Shirts, Trousers...)
    ├── App.jsx                   # Main layout, agent chat, and wallet state controller
    ├── App.css                   # Custom CSS component styling
    ├── index.css                 # Global CSS variables, design tokens & theme toggle override
    └── utils.js                  # Transaction memo packing & Web3 utilities
```

---

## 🛠️ Smart Contract Details

ArcWear runs on a custom **Arc L1 Testnet** architecture using the following specifications:

| Asset / Contract | Contract Address |
| :--- | :--- |
| **USDC Stablecoin** | `0x3600000000000000000000000000000000000000` |
| **Merchant Vault** | `0x627148dF4DE3b44Aa624e7592d3A47485777A6Bb` |
| **Memo Escrow Address** | `0x5294E9927c3306DcBaDb03fe70b92e01cCede505` |

---

## 🚀 Getting Started

### 📋 Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18+) and [Foundry](https://book.getfoundry.sh/getting-started/installation) installed.

### 💻 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/KennyGodman/ARCWEAR.git
   cd ARCWEAR
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install smart contract libraries**:
   ```bash
   forge install
   ```

4. **Environment Variables**:
   Create a `.env` file in the root based on `.env.example`:
   ```env
   GROQ_API_KEY=your_key_here
   RESEND_API_KEY=your_key_here
   ```

### 🏃 Running Locally

To run the Vite dev server locally:
```bash
npm run dev
```
Open **`http://localhost:5173`** (or the port specified in console) in your browser. Ensure your wallet extension (MetaMask/Rabby) is switched to **Arc Testnet** to test blockchain transactions.

### 🧪 Testing Smart Contracts

To run the Solidity unit tests using Foundry:
```bash
forge test
```
To check test coverage:
```bash
forge coverage
```

---

## 📦 Deployment

This project is configured for serverless deployment on **Vercel** with full RPC proxy support.

To build and run production serverless environments locally:
```bash
vercel dev
```
