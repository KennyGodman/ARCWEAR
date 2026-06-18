export const ARC_CHAIN_ID = "0x4cef52";
export const ARC_CHAIN_CONFIG = {
  chainId: ARC_CHAIN_ID,
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
export const MERCHANT_ADDR = "0x627148dF4DE3b44Aa624e7592d3A47485777A6Bb";

// Circle Agent Wallet — receives ERC-20 approve() from users,
// then calls transferFrom() server-side to execute autonomous purchases.
export const AGENT_WALLET = "0x51894a584a1e186151b31b23ea3add16fce5ff56";

// Default spending cap for agent approval (in USDC)
export const DEFAULT_AGENT_ALLOWANCE = 500;

// Arc Testnet transaction Memo contract address
export const MEMO_ADDRESS = "0x5294E9927c3306DcBaDb03fe70b92e01cCede505";
