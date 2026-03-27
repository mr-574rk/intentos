import { MsgExecute, bcs } from "@initia/initia.js";
const msg = new MsgExecute("addr1", "addr2", "mod", "fun", [], []);
console.log(JSON.stringify(msg.toData(), null, 2));
