import { initiaExecute } from "./src/initiaExecutor";
import * as dotenv from "dotenv";

dotenv.config({ path: "../backend/.env" });
console.log("Using Executor:", process.env.CONTRACT_STRATEGY_EXECUTOR);

const txs = [
  {
    type: "stake",
    payload: {
      action: "stake",
      from: "INIT",
      amount: "1"
    }
  }
];

initiaExecute(txs as any, "test-bundle-123", "test-session-auth")
  .then(res => console.log("Success:", res))
  .catch(err => {
      console.error("FAIL:", err.message);
      if (err.response?.data) console.error("Data:", JSON.stringify(err.response.data));
  });
