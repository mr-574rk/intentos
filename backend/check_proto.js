const { MsgDelegate, Coin, MsgExecute, bcs } = require("@initia/initia.js");

const d = new MsgDelegate("sender", "val", new Coin("uint", "10"));
console.log("Delegate:", JSON.stringify(d.toProto()));

const e = new MsgExecute("sender", "0x1", "dex", "swap_script", [], [bcs.u64().serialize(10n).toBase64()]);
console.log("Execute:", JSON.stringify(e.toProto()));
