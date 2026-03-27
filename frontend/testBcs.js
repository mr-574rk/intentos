const { bcs } = require("@initia/initia.js");

const addr = "init18htm3zd7v2x9w0y2g6c0wet6apyra0krzpeydp";
const uuid = "421367cd-30ad-4ce2-ab74-28ec5cb103bb";
const expiry = 1774350000;

console.log("initia.js addr:", bcs.string().serialize(addr).toBase64());
console.log("initia.js u64:", bcs.u64().serialize(expiry).toBase64());

function bcsString(str) {
  const bytes = new TextEncoder().encode(str);
  const bcsBytes = new Uint8Array(1 + bytes.length);
  bcsBytes[0] = bytes.length;
  bcsBytes.set(bytes, 1);
  return Buffer.from(bcsBytes).toString("base64");
}

function bcsU64(num) {
  const b = new Uint8Array(8);
  const view = new DataView(b.buffer);
  view.setUint32(0, num, true); // true = little endian
  return Buffer.from(b).toString("base64");
}

console.log("native addr:", bcsString(addr));
console.log("native u64:", bcsU64(expiry));
