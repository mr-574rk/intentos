import { bcs } from "@initia/initia.js";

const strategyId = "421367cd-30ad-4ce2-ab74-28ec5cb103bb";
const backendBcs = bcs.string().serialize(strategyId).toBase64();

const bcsVectorU8 = (str: string) => {
  const b = new TextEncoder().encode(str);
  return Buffer.from(new Uint8Array([b.length, ...b])).toString("base64");
};
const frontendBcs = bcsVectorU8(strategyId);

console.log("Backend: ", backendBcs);
console.log("Frontend:", frontendBcs);
console.log("Match?", backendBcs === frontendBcs);
