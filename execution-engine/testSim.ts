import { RESTClient, Wallet, RawKey, MsgExecute, bcs } from "@initia/initia.js";
import * as dotenv from "dotenv";
dotenv.config({ path: "../backend/.env" });

async function run() {
  const lcd = new RESTClient(process.env.INITIA_REST || "https://rest.initia.xyz", {
    chainId: process.env.CHAIN_ID || "initiation-2",
  });
  const wallet = new Wallet(lcd, new RawKey(Buffer.from(process.env.RELAYER_PRIVATE_KEY!, "hex")));

  const args = [
    bcs.string().serialize("test").toBase64(),
    bcs.vector(bcs.u8()).serialize([4]).toBase64(),
    bcs.vector(bcs.string()).serialize(["INIT"]).toBase64(),
    bcs.vector(bcs.string()).serialize(["USDC"]).toBase64(),
    bcs.vector(bcs.u64()).serialize([BigInt(1000000)]).toBase64(),
    bcs.vector(bcs.address()).serialize(["0x0000000000000000000000000000000000000000"]).toBase64(),
    bcs.vector(bcs.string()).serialize(["initvaloper1qx6ghyv83caecuxgl77lvlnha9d9y6fntryc8a"]).toBase64(),
    bcs.vector(bcs.address()).serialize(["0x0000000000000000000000000000000000000000"]).toBase64(),
    bcs.u64().serialize(BigInt(5)).toBase64(),
  ];

  const msg = new MsgExecute(
    wallet.key.accAddress,
    process.env.CONTRACT_STRATEGY_EXECUTOR!,
    "strategy_executor",
    "execute_bundle",
    [],
    args
  );

  try {
    const tx = await wallet.createAndSignTx({ msgs: [msg], memo: "test" });
    const res = await lcd.tx.simulate(tx);
    console.log("Simulate OK", res);
  } catch (err: any) {
    if (err.response?.data) console.log("Simulate ERROR_DATA:", JSON.stringify(err.response.data));
    else console.log("Simulate ERROR:", err.message);
  }
}
run();
