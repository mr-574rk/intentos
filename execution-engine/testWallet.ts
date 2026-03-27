import { RawKey, Wallet, RESTClient } from "@initia/initia.js";
import * as dotenv from "dotenv";
dotenv.config({ path: "../backend/.env" });
const key = new RawKey(Buffer.from(process.env.RELAYER_PRIVATE_KEY!, "hex"));
console.log("Wallet address:", key.accAddress);
