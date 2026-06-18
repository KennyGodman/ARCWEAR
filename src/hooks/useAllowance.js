import { useState, useEffect, useCallback } from "react";
import { USDC_ADDRESS, APPROVAL_TARGET } from "../config";

/**
 * useAllowance — reads USDC allowance granted to the APPROVAL_TARGET (escrow contract or agent wallet).
 *
 * The ERC-20 allowance(owner, spender) is read on-chain via eth_call.
 * When allowance > 0, the agent can trigger autonomous checkout without a wallet popup.
 *
 * @param {string|null} wallet - The connected user wallet address
 * @returns {{ allowance, isApproved, loading, refresh, approveAgent }}
 */
export default function useAllowance(wallet) {
  const [allowance, setAllowance] = useState(0);
  const [loading, setLoading] = useState(false);

  // ── Read allowance from USDC contract ─────────────────────
  const refresh = useCallback(async () => {
    if (!wallet || !window.ethereum) {
      setAllowance(0);
      return;
    }

    setLoading(true);
    try {
      const owner = wallet.toLowerCase().replace("0x", "").padStart(64, "0");
      const spender = APPROVAL_TARGET.toLowerCase().replace("0x", "").padStart(64, "0");

      // allowance(address owner, address spender) → function selector 0xdd62ed3e
      const data = "0xdd62ed3e" + owner + spender;

      const result = await window.ethereum.request({
        method: "eth_call",
        params: [{ to: USDC_ADDRESS, data }, "latest"],
      });

      // USDC has 6 decimals
      const rawAllowance = parseInt(result, 16) / 1e6;
      setAllowance(rawAllowance);
    } catch (err) {
      console.error("[useAllowance] Failed to read allowance:", err);
      setAllowance(0);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  // Auto-refresh on wallet change
  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Approve spender to spend USDC ───────────────────────────
  const approveAgent = useCallback(
    async (amountUSDC) => {
      if (!wallet || !window.ethereum) {
        throw new Error("No wallet connected");
      }

      const amt = Math.round(amountUSDC * 1e6);
      // approve(address spender, uint256 amount) → function selector 0x095ea7b3
      const data =
        "0x095ea7b3" +
        APPROVAL_TARGET.slice(2).toLowerCase().padStart(64, "0") +
        amt.toString(16).padStart(64, "0");

      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet, to: USDC_ADDRESS, data, gas: "0x186A0" }],
      });

      // Wait for confirmation
      for (let i = 0; i < 30; i++) {
        const receipt = await window.ethereum.request({
          method: "eth_getTransactionReceipt",
          params: [hash],
        });
        if (receipt) {
          if (receipt.status !== "0x1") {
            throw new Error("Approval transaction failed on-chain");
          }
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Refresh allowance after approval
      await refresh();
      return hash;
    },
    [wallet, refresh]
  );


  return {
    allowance,
    isApproved: allowance > 0,
    loading,
    refresh,
    approveAgent,
  };
}
