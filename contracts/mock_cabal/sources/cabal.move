// Module: cabal (mock)
// Deployed as part of the IntentOS namespace.
// This is a minimal on-chain shim that satisfies the StrategyExecutor's
// dependency on the Cabal vault interface. For the hackathon demo it simply
// succeeds. In production, swap mock_cabal with the real Cabal contract
// after auditing the Cabal ABI.
module mock_cabal::cabal {
    use std::signer;

    // Convert raw INIT into xINIT by depositing into the Cabal vault.
    // Mock: no-op -- funds stay in the depositor account for the demo.
    public entry fun deposit_init_for_xinit(_account: &signer, _amount: u64) {
        // intentionally empty
    }

    // Stake xINIT into the Cabal sxINIT vault.
    // Mock: no-op -- succeeds immediately for demo.
    public entry fun process_xinit_stake(_account: &signer, _amount: u64) {
        // intentionally empty
    }
}
