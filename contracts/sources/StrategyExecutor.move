/// Module: strategy_executor
/// IntentOS strategy dispatcher - Initia Move smart contract.
///
/// Decodes execution bundles forwarded by the IntentOS TypeScript backend,
/// validates the agent session, dispatches each step to a protocol adapter,
/// and emits execution events to power the agent timeline UI.
///
/// ----------------------------------------------------------------
/// ARCHITECTURE
/// ----------------------------------------------------------------
///   StrategyExecutor  ->  dex_adapter      (swap, provide_liquidity)
///                     ->  bank_adapter     (transfer, batch_transfer)
///                     ->  staking_adapter  (stake)
///                     ->  lending_adapter  (lend - no-op pending protocol)
///                     ->  permission_manager::assert_session_valid (security)
///
/// ----------------------------------------------------------------
/// ACTION ENUM (u8 constants - gas-efficient, avoids string comparison)
/// ----------------------------------------------------------------
///   ACTION_SWAP               = 1
///   ACTION_TRANSFER           = 2
///   ACTION_BATCH_TRANSFER     = 3  (same impl as transfer, multiple recipients)
///   ACTION_STAKE              = 4
///   ACTION_PROVIDE_LIQUIDITY  = 5
///   ACTION_LEND               = 6
///
/// TypeScript side (transactionBuilder.ts / initiaExecutor.ts) must encode
/// action type as u8 matching these constants before calling execute_bundle.
///
/// ----------------------------------------------------------------
/// ATOMICITY
/// ----------------------------------------------------------------
/// All adapter calls propagate errors. If ANY step fails, the entire
/// execute_bundle transaction aborts and ALL steps are reverted.
/// This guarantees atomic bundle execution.
///
/// ----------------------------------------------------------------
/// ABI PARAMETERS (extended from stub)
/// ----------------------------------------------------------------
///   bundle_id           vector<u8>          - unique strategy UUID
///   step_actions        vector<u8>          - action enum per step
///   step_from_denoms    vector<vector<u8>>  - offer token denom per step
///   step_to_denoms      vector<vector<u8>>  - return token denom per step
///   step_amounts        vector<u64>         - amount in base units per step
///   step_recipients     vector<address>     - recipient per step (transfer)
///   step_validators     vector<vector<u8>>  - validator bech32 per step (stake)
///   step_pair_addrs     vector<address>     - DEX pair object addr per step (swap/LP)
///   risk_score          u64                 - 110; must be  7 to execute

module intentos::strategy_executor {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use std::error;

    use minitia_std::event;
    use minitia_std::timestamp;

    use intentos::permission_manager;
    use intentos::bank_adapter;
    use intentos::staking_adapter;
    use intentos::dex_adapter;
    use intentos::lending_adapter;

    // -- Action Enum Constants ---------------------------------
    // u8 values - cheaper than string comparison, eliminates typo risk.

    const ACTION_SWAP:              u8 = 1;
    const ACTION_TRANSFER:          u8 = 2;
    const ACTION_BATCH_TRANSFER:    u8 = 3;
    const ACTION_STAKE:             u8 = 4;
    const ACTION_PROVIDE_LIQUIDITY: u8 = 5;
    const ACTION_LEND:              u8 = 6;

    // -- Errors ------------------------------------------------

    const E_NOT_AUTHORIZED:   u64 = 1;
    const E_INVALID_STRATEGY: u64 = 2;
    const E_EXECUTION_FAILED: u64 = 3;
    const E_BUNDLE_TOO_LARGE: u64 = 4;
    const E_UNKNOWN_ACTION:   u64 = 5;
    const E_VECTOR_MISMATCH:  u64 = 6;

    const MAX_BUNDLE_SIZE: u64 = 10;
    const MAX_RISK_SCORE:  u64 = 7;

    // -- Events ------------------------------------------------

    #[event]
    /// Emitted once per bundle step after the adapter call succeeds.
    /// Powers the agent timeline UI step-by-step progress.
    struct ExecutionEvent has drop, store {
        /// Strategy bundle UUID
        bundle_id: String,
        /// Executor (relayer) address
        executor: address,
        /// Step index (1-based)
        step_index: u64,
        /// Action enum value
        action: u8,
        /// Token denom acted on
        from_denom: String,
        /// Target denom (for swap/liquidity)
        to_denom: String,
        /// Amount in base units
        amount: u64,
        /// Block timestamp when this step completed
        executed_at: u64,
    }

    #[event]
    /// Emitted once when an entire bundle completes all steps.
    struct BundleCompleteEvent has drop, store {
        bundle_id: String,
        executor: address,
        steps_executed: u64,
        executed_at: u64,
    }

    // -- Public Entry Functions --------------------------------

    /// Execute a full strategy bundle.
    ///
    /// Called by the IntentOS execution engine (initiaExecutor.ts) after user
    /// approval via session key registration.
    ///
    /// -- Security --
    /// Session validation is the FIRST operation. Any session error aborts
    /// the transaction before any funds are touched.
    ///
    /// -- Atomicity --
    /// All adapter calls propagate errors. If step N fails, steps 0..N-1
    /// are also reverted (Move VM transactional semantics). The user's
    /// funds are never partially committed.
    ///
    /// -- ABI note for TypeScript --
    /// step_validators and step_recipients must have the same length as
    /// step_actions. Pad with zero-address (@0x0) and empty string ("")
    /// for steps that don't use them. step_pair_addrs must also match
    /// length; pad with @0x0 for non-DEX steps.
    public entry fun execute_bundle(
        executor: &signer,
        bundle_id: vector<u8>,
        step_actions: vector<u8>,
        step_from_denoms: vector<vector<u8>>,
        step_to_denoms: vector<vector<u8>>,
        step_amounts: vector<u64>,
        step_recipients: vector<address>,
        step_validators: vector<vector<u8>>,
        step_pair_addrs: vector<address>,
        risk_score: u64,
    ) {
        let executor_addr = signer::address_of(executor);
        let bundle_id_str = string::utf8(bundle_id);

        // -- Step 1: Security - validate session FIRST ---------
        // Aborts if session is missing, expired, revoked, or mismatched.
        // No funds are touched before this check passes.
        permission_manager::assert_session_valid(executor_addr, bundle_id_str);

        // -- Step 2: Validate risk score -----------------------
        assert!(risk_score <= MAX_RISK_SCORE, error::invalid_argument(E_INVALID_STRATEGY));

        // -- Step 3: Validate bundle size ----------------------
        let step_count = vector::length(&step_actions);
        assert!(step_count > 0,               error::invalid_argument(E_INVALID_STRATEGY));
        assert!(step_count <= MAX_BUNDLE_SIZE, error::out_of_range(E_BUNDLE_TOO_LARGE));

        // -- Step 4: Validate all vectors match length ---------
        // Prevents index-out-of-bounds panics in the dispatch loop.
        assert!(vector::length(&step_from_denoms)  == step_count, error::invalid_argument(E_VECTOR_MISMATCH));
        assert!(vector::length(&step_to_denoms)    == step_count, error::invalid_argument(E_VECTOR_MISMATCH));
        assert!(vector::length(&step_amounts)      == step_count, error::invalid_argument(E_VECTOR_MISMATCH));
        assert!(vector::length(&step_recipients)   == step_count, error::invalid_argument(E_VECTOR_MISMATCH));
        assert!(vector::length(&step_validators)   == step_count, error::invalid_argument(E_VECTOR_MISMATCH));
        assert!(vector::length(&step_pair_addrs)   == step_count, error::invalid_argument(E_VECTOR_MISMATCH));

        // -- Step 5: Execute each step sequentially ------------
        // Any adapter error aborts the ENTIRE transaction (atomicity).
        let i = 0u64;
        while (i < step_count) {
            let action      = *vector::borrow(&step_actions,      i);
            let from_denom  = string::utf8(*vector::borrow(&step_from_denoms, i));
            let to_denom    = string::utf8(*vector::borrow(&step_to_denoms,   i));
            let amount      = *vector::borrow(&step_amounts,      i);
            let recipient   = *vector::borrow(&step_recipients,   i);
            let validator   = string::utf8(*vector::borrow(&step_validators, i));
            let pair_addr   = *vector::borrow(&step_pair_addrs,   i);

            // -- Dispatch table using u8 action enum -----------
            // u8 comparison is cheaper than string comparison and
            // eliminates string-encoding bugs from the TypeScript side.

            if (action == ACTION_SWAP) {
                // Swap `from_denom` tokens for `to_denom` tokens via DEX.
                // pair_addr must be a valid dex::Config object address.
                dex_adapter::swap(executor, pair_addr, from_denom, amount);

            } else if (action == ACTION_TRANSFER) {
                // Transfer `amount` of `from_denom` to `recipient`.
                bank_adapter::transfer(executor, from_denom, recipient, amount);

            } else if (action == ACTION_BATCH_TRANSFER) {
                // batch_transfer steps are expanded to individual transfer
                // steps by strategyGenerator.ts, so this case is identical
                // to transfer. The enum value is kept separate for clarity
                // and future batch-optimisation via a single Cosmos message.
                bank_adapter::transfer(executor, from_denom, recipient, amount);

            } else if (action == ACTION_STAKE) {
                // Delegate `amount` of `from_denom` to validator.
                // validator is a bech32 string e.g. "initvaloper1..."
                staking_adapter::stake(executor, from_denom, validator, amount);

            } else if (action == ACTION_PROVIDE_LIQUIDITY) {
                // Provide liquidity to the DEX pair at pair_addr.
                // Splits amount equally between from_denom and to_denom.
                dex_adapter::provide_liquidity(executor, pair_addr, from_denom, to_denom, amount);

            } else if (action == ACTION_LEND) {
                // Lend `amount` of `from_denom` to the lending protocol.
                // Currently a no-op pending lending protocol deployment.
                lending_adapter::lend(executor, from_denom, amount);

            } else {
                // Unknown action - abort entire bundle.
                abort error::invalid_argument(E_UNKNOWN_ACTION)
            };

            // Emit per-step event (real emission, not dropped).
            event::emit(ExecutionEvent {
                bundle_id: bundle_id_str,
                executor: executor_addr,
                step_index: i + 1,
                action,
                from_denom,
                to_denom,
                amount,
                executed_at: timestamp::now_seconds(),
            });

            i = i + 1;
        };

        // Emit bundle-complete event.
        event::emit(BundleCompleteEvent {
            bundle_id: bundle_id_str,
            executor: executor_addr,
            steps_executed: step_count,
            executed_at: timestamp::now_seconds(),
        });
    }

    /// Emergency cancel - sets a tombstone to block future execution.
    /// Currently emits a cancellation event. Full storage-based cancel
    /// can be added when cancel state tracking is required.
    public entry fun cancel_strategy(
        executor: &signer,
        _bundle_id: vector<u8>,
    ) {
        // Validate the caller has a session before allowing cancel.
        // This prevents griefing cancellations from unrelated accounts.
        let executor_addr = signer::address_of(executor);
        assert!(
            permission_manager::is_session_active(executor_addr),
            error::permission_denied(E_NOT_AUTHORIZED)
        );

        // Revoke the session, blocking all future bundle execution.
        permission_manager::revoke_session(executor);
    }

    // -- View Functions ----------------------------------------

    #[view]
    public fun max_bundle_size(): u64 { MAX_BUNDLE_SIZE }

    #[view]
    public fun max_risk_score(): u64 { MAX_RISK_SCORE }

    /// Action enum values - query from TypeScript to keep ABI in sync.
    #[view]
    public fun action_swap(): u8              { ACTION_SWAP }
    #[view]
    public fun action_transfer(): u8          { ACTION_TRANSFER }
    #[view]
    public fun action_batch_transfer(): u8    { ACTION_BATCH_TRANSFER }
    #[view]
    public fun action_stake(): u8             { ACTION_STAKE }
    #[view]
    public fun action_provide_liquidity(): u8 { ACTION_PROVIDE_LIQUIDITY }
    #[view]
    public fun action_lend(): u8              { ACTION_LEND }
}
