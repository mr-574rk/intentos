const { MsgSend, Coins, Coin } = require("@initia/initia.js");

const d = new MsgSend("init1foo", "init1bar", new Coins([new Coin("uinit", "10")]));
console.log("MsgSend API:", JSON.stringify(d.toData()));
console.log("MsgSend Proto:", JSON.stringify(d.toProto()));
