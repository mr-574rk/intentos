import { bcs } from "@initia/initia.js";

const strategyId = "421367cd-30ad-4ce2-ab74-28ec5cb103bb";
const serialized = bcs.string().serialize(strategyId).toBase64();
console.log("TS bcs.string():", serialized);

