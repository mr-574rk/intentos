interface CosmosProvider {
  enable(chainId: string): Promise<void>;
  getOfflineSigner(chainId: string): unknown;
  experimentalSuggestChain?: (chainInfo: unknown) => Promise<void>;
  signAmino?: (chainId: string, signer: string, tx: unknown) => Promise<unknown>;
}

interface Window {
  keplr?: CosmosProvider;
  leap?: CosmosProvider;
}
