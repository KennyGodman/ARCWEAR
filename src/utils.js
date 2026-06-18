export const fmt = (n) => `${Number(n).toFixed(2)} USDC`;
export const trunc = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
export const disc = (p, op) => Math.round(((op - p) / op) * 100);

// Helper to pad hex values to 32-byte (64 characters) words
const pad32 = (str, direction = "right") => {
  const clean = str.replace("0x", "").toLowerCase();
  return direction === "left" ? clean.padStart(64, "0") : clean.padEnd(64, "0");
};

/**
 * Encodes a USDC transfer wrapped in the Arc Memo contract call.
 * Function signature: memo(address target, bytes data, bytes32 memoId, bytes memoData)
 */
export const encodeMemoUSDC = (recipient, amountUSDC, orderId) => {
  const selector = "c3b2c4f8"; // memo(address,bytes,bytes32,bytes)
  const targetEncoded = pad32("0x3600000000000000000000000000000000000000", "left"); // USDC address
  const dataOffset = pad32("80", "left"); // offset to dynamic USDC data payload

  // Strip hyphens from UUID to make a clean bytes32 memoId
  const cleanUuid = orderId.replace(/-/g, "");
  const memoIdEncoded = pad32(cleanUuid, "right");
  const memoDataOffset = pad32("100", "left"); // offset to dynamic memo payload

  // Inner USDC transfer encoding
  const rawAmt = Math.round(amountUSDC * 1e6);
  const transferSelector = "a9059cbb"; // transfer(address,uint256)
  const innerData = transferSelector + pad32(recipient, "left") + pad32(rawAmt.toString(16), "left");
  
  // Data payload header (length = 68 bytes / 0x44) + padded payload (96 bytes)
  const dataPayload = pad32("44", "left") + innerData.padEnd(192, "0");

  // Memo text payload ("ArcWear Order") -> Length = 13 (0x0d)
  const memoText = "ArcWear Order";
  let memoHex = "";
  for (let i = 0; i < memoText.length; i++) {
    memoHex += memoText.charCodeAt(i).toString(16);
  }
  const memoPayload = pad32((memoText.length).toString(16), "left") + memoHex.padEnd(64, "0");

  return "0x" + selector + targetEncoded + dataOffset + memoIdEncoded + memoDataOffset + dataPayload + memoPayload;
};
