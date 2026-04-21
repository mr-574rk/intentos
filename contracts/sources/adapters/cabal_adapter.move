/// Module: cabal_adapter
/// Adapter for Cabal Vault deposit operations.
///
/// Calls the external Cabal module `deposit_init_for_xinit` followed by
/// `process_xinit_stake` to complete the sxINIT vault deposit.
///
/// Atomicity: Any failure inside the Cabal contract calls will automatically
/// abort the transaction, reverting the entire execute_bundle payload.

module intentos::cabal_adapter {
    use std::signer;
    use minitia_std::event;
    use minitia_std::timestamp;
    
    // Import the Cabal stub we created
    use cabal_addr::cabal;

    friend intentos::strategy_executor;

    // -- Events ------------------------------------------------

    #[event]
    /// Emitted on every successful Cabal deposit.
    struct CabalDepositEvent has drop, store {
        /// Depositor address
        depositor: address,
        /// Amount in base units (INIT) deposited
        amount: u64,
        /// Block timestamp in seconds
        executed_at: u64,
    }

    // -- Public Functions --------------------------------------

    /// Deposits `amount` of INIT into the Cabal sxINIT vault.
    ///
    /// Called by StrategyExecutor for the `cabal_deposit` action.
    ///
    /// Errors propagate upward, aborting the entire bundle (atomic execution).
    public(friend) fun deposit(
        account: &signer,
        amount: u64,
    ) {
        // Step 1: INIT -> xINIT
        cabal::deposit_init_for_xinit(account, amount);
        
        // Step 2: xINIT -> sxINIT
        cabal::process_xinit_stake(account, amount);

        // Emit event for agent timeline UI.
        event::emit(CabalDepositEvent {
            depositor: signer::address_of(account),
            amount,
            executed_at: timestamp::now_seconds(),
        });
    }
}
