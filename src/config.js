export const ARC_CHAIN_ID = "0x4cef52";
export const ARC_CHAIN_CONFIG = {
  chainId: ARC_CHAIN_ID,
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};
export const USDC_ADDRESS   = "0x3600000000000000000000000000000000000000";
export const MERCHANT_ADDR  = "0xd515765a6c9b1c3f9a4df52f5326eea43ee42469";

// Circle Agent Wallet — receives ERC-20 approve() from users (legacy flow),
// then calls transferFrom() server-side to execute autonomous purchases.
export const AGENT_WALLET = "0x51894a584a1e186151b31b23ea3add16fce5ff56";

// Default spending cap for agent approval (in USDC)
export const DEFAULT_AGENT_ALLOWANCE = 500;

// Arc Testnet transaction Memo contract address
export const MEMO_ADDRESS = "0x5294E9927c3306DcBaDb03fe70b92e01cCede505";

// ── ERC-8183 Escrow (AgenticCommerce.sol) ─────────────────────────────────────
// Set this after deploying contracts/AgenticCommerce.sol to Arc Testnet.
// When set, agent checkout uses trustless escrow instead of direct transferFrom.
// Leave empty string "" until deployed.
export const ESCROW_CONTRACT_ADDRESS = import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || "";

// The address set as evaluator in jobs — defaults to the agent wallet.
// Can be a separate backend EOA if preferred.
export const EVALUATOR_ADDRESS = import.meta.env.VITE_EVALUATOR_ADDRESS || AGENT_WALLET;

// The address that users approve for USDC spending.
// When escrow is deployed: approve the ESCROW CONTRACT.
// Otherwise: approve the AGENT WALLET (legacy).
export const APPROVAL_TARGET = ESCROW_CONTRACT_ADDRESS || AGENT_WALLET;

