// diagnostic.ts
import { RESTClient, MnemonicKey } from "@initia/initia.js";

async function run() {
  const lcd = new RESTClient("http://localhost:1317", {
    chainId: "intentos-1"
  });

  const key = new MnemonicKey({
    mnemonic: "shoot clarify poverty fox hammer before cart unaware soul coin maid craft lens dynamic hockey trim spread run blue clown silent test plastic million"
  });

  console.log("Wallet address derived:", key.accAddress);

  try {
    const info = await lcd.auth.accountInfo(key.accAddress);
    console.log("Account info:", info);
  } catch (e: any) {
    if (e.isAxiosError) {
      console.error("Axios Error:");
      console.error("URL:", e.config?.url);
      console.error("Status:", e.response?.status);
      console.error("Data:", e.response?.data);
    } else {
      console.error(e);
    }
  }
}

run();
