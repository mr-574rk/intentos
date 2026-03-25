import { Buffer } from "buffer";
import { RESTClient, Wallet, RawKey, MsgExecute, bcs } from "@initia/initia.js";

async function run() {
  try {
    const lcd = new RESTClient("http://localhost:1317", { chainId: "intentos-1" });
    const key = new RawKey(Buffer.from("a53bd229ff460488159ed006d1a4ed2fc63d453bc55f2bc11a1fbf185443894b", "hex"));
    const wallet = new Wallet(lcd, key);

    console.log("Wallet address:", wallet.key.accAddress);

    // Properly BCS-encode Move VM arguments
    const args = [
      bcs.string().serialize("bundle_1").toBase64(),                 // bundle_id: vector<u8>
      bcs.vector(bcs.string()).serialize(["swap"]).toBase64(),        // step_actions: vector<vector<u8>>
      bcs.vector(bcs.string()).serialize(["USDC"]).toBase64(),        // step_from_assets: vector<vector<u8>>
      bcs.vector(bcs.string()).serialize(["INIT"]).toBase64(),        // step_to_assets: vector<vector<u8>>
      bcs.vector(bcs.u64()).serialize([BigInt(1000000)]).toBase64(),  // step_amounts: vector<u64>
      bcs.u64().serialize(BigInt(5)).toBase64(),                      // risk_score: u64
    ];

    const msgs = [
      new MsgExecute(
        wallet.key.accAddress,
        "0x3dd7b889be628c573c8a46b0f7657ae8483ebec3",
        "strategy_executor",
        "execute_bundle",
        [],
        args
      )
    ];

    console.log("Signing...");
    const tx = await wallet.createAndSignTx({ msgs, memo: "IntentOS test" });

    console.log("Broadcasting...");
    const result = await lcd.tx.broadcast(tx);
    console.log("✅ SUCCESS! txhash:", result.txhash);
  } catch (e: any) {
    if (e.isAxiosError) {
      console.log("❌ AXIOS ERROR:");
      console.log(JSON.stringify(e.response?.data, null, 2));
    } else {
      console.error("❌ ERROR:", e.message ?? e);
    }
  }
}
run();
