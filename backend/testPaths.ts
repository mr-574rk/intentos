import { MnemonicKey } from "@initia/initia.js";

const mnemonic = "shoot clarify poverty fox hammer before cart unaware soul coin maid craft lens dynamic hockey trim spread run blue clown silent test plastic million";

[118, 60, 330].forEach(coinType => {
  const key = new MnemonicKey({ mnemonic, coinType });
  console.log(`CoinType ${coinType} -> ${key.accAddress}`);
});
