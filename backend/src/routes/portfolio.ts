import { Router } from "express";
import type { Request, Response } from "express";
import https from "https";

const router = Router();
const LCD_BASE = "rest.testnet.initia.xyz";

const DENOM_META: Record<string, { symbol: string; usdRate: number }> = {
  uinit:  { symbol: "INIT",  usdRate: 0.08 },
  uusdc:  { symbol: "USDC",  usdRate: 1.00 },
  uintos: { symbol: "INIT",  usdRate: 0.08 },
  // IBC USDC on initiation-2
  "ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5": { symbol: "USDC", usdRate: 1.00 },
};

function lcdGet(path: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: LCD_BASE,
      port: 443,
      path,
      method: "GET",
      headers: { "Accept": "application/json" },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c: string) => { data += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({}); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function toDisplay(amount: string | number, decimals = 6) {
  return parseFloat(String(amount)) / 10 ** decimals;
}

/**
 * GET /api/portfolio/:address
 * Returns aggregated wallet + staking + rewards for a given Initia address.
 */
router.get("/:address", async (req: Request, res: Response) => {
  const { address } = req.params;
  if (!address || !address.startsWith("init")) {
    return res.status(400).json({ error: "Invalid Initia address" });
  }

  try {
    // 1. Bank balances
    const bankJson = await lcdGet(`/cosmos/bank/v1beta1/balances/${address}`) as {
      balances?: { denom: string; amount: string }[];
    };
    const bankCoins = bankJson.balances ?? [];

    const wallet = bankCoins
      .filter(c => toDisplay(c.amount) > 0.000001)
      .map(c => {
        const meta = DENOM_META[c.denom] ?? { symbol: c.denom.slice(0, 8).toUpperCase(), usdRate: 0 };
        const balance = toDisplay(c.amount);
        return {
          denom:    c.denom,
          symbol:   meta.symbol,
          balance,
          valueUSD: parseFloat((balance * meta.usdRate).toFixed(4)),
        };
      });

    // 2. Staking delegations
    const stakingJson = await lcdGet(`/cosmos/staking/v1beta1/delegations/${address}`) as {
      delegation_responses?: {
        delegation: { validator_address: string; delegator_address: string };
        balance: { denom: string; amount: string };
      }[];
    };
    const delegations = stakingJson.delegation_responses ?? [];

    const staked = delegations.map(d => {
      const balance = toDisplay(d.balance.amount);
      return {
        validator:    d.delegation.validator_address,
        denom:        d.balance.denom,
        symbol:       "INIT",
        balance,
        valueUSD:     parseFloat((balance * 0.08).toFixed(4)),
      };
    });

    // 3. Staking rewards
    const rewardsJson = await lcdGet(`/cosmos/distribution/v1beta1/delegators/${address}/rewards`) as {
      total?: { denom: string; amount: string }[];
      rewards?: { validator_address: string; reward: { denom: string; amount: string }[] }[];
    };
    const rewardCoins = rewardsJson.total ?? [];

    const rewards = rewardCoins
      .filter(c => toDisplay(c.amount) > 0.000001)
      .map(c => {
        const meta = DENOM_META[c.denom] ?? { symbol: "TOKEN", usdRate: 0 };
        const balance = toDisplay(c.amount);
        return {
          denom:    c.denom,
          symbol:   meta.symbol,
          balance,
          valueUSD: parseFloat((balance * meta.usdRate).toFixed(4)),
        };
      });

    // 4. Total USD
    const totalValueUSD = parseFloat((
      wallet.reduce((s, a) => s + a.valueUSD, 0) +
      staked.reduce((s, a) => s + a.valueUSD, 0) +
      rewards.reduce((s, a) => s + a.valueUSD, 0)
    ).toFixed(2));

    res.json({ wallet, staked, rewards, totalValueUSD });
  } catch (err) {
    console.error("[portfolio] Error fetching portfolio:", err);
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

export default router;
