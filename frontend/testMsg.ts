import { MsgExecute } from "@initia/initia.js";
const msg = new MsgExecute("addr1", "addr2", "mod", "fun", [], []);
console.log(msg);
console.log(Object.keys(msg));
console.log(typeof msg.packAny === 'function' ? "Has packAny" : "No packAny");
