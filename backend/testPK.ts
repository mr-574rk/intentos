import { RawKey } from "@initia/initia.js";
const pk = "a53bd229ff460488159ed006d1a4ed2fc63d453bc55f2bc11a1fbf185443894b";
const key = new RawKey(Buffer.from(pk, "hex"));
console.log("Relayer address:", key.accAddress);
