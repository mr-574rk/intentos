const { MsgExecute } = require("@initia/initia.js");
const msg = new MsgExecute("addr1", "addr2", "mod", "fun", [], []);
console.log(msg.typeUrl);
console.log(msg.toData());
console.log(msg.packAny());
