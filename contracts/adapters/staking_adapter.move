/// Module: staking_adapter
/// Adapter for delegating tokens to a validator using minitia_std::cosmos.
///
/// Verified API (from MinitiaStdlib source cosmos.move:241):
///   cosmos::delegate(
///       delegator: &signer,
///       validator: String,         ← bech32 validator address string
///       metadata: Object<Metadata>,
///       amount: u64
///   )
///
/// This emits a Cosmos MsgDelegate stargate message after Move execution,
/// which performs the actual on-chain delegation.
///
/// Atomicity: cosmos::delegate uses stargate_internal with disallow_failure(),
/// meaning any delegation error aborts the transaction.

module intentos::staking_adapter {
    use std::signer;
    use std::string::String;

    use minitia_std::cosmos;
    use minitia_std::coin;
    use minitia_std::event;
    use minitia_std::timestamp;

    friend intentos::strategy_executor;

    // ── Events ────────────────────────────────────────────────

    #[event]
    /// Emitted on every successful staking delegation.
    struct StakeDelegateEvent has drop, store {
        /// Delegator address
        delegator: address,
        /// Validator bech32 address string
        validator: String,
        /// Token denom staked
        denom: String,
        /// Amount delegated in base units
        amount: u64,
        /// Block timestamp in seconds
        executed_at: u64,
    }

    // ── Public Functions ──────────────────────────────────────

    /// Delegate `amount` of `denom` tokens to `validator`.
    ///
    /// `validator` must be a bech32 validator address string,
    ///  e.g. "initvaloper1qyqa2mdel5vmre7uwn7rft7n076qahg46y9zus"
    ///
    /// Called by StrategyExecutor for the `stake` action.
    ///
    /// Errors propagate upward, aborting the entire bundle (atomic execution).
    public(friend) fun stake(
        delegator: &signer,
        denom: String,
        validator: String,
        amount: u64,
    ) {
        // Resolve denom to metadata object.
        let metadata = coin::denom_to_metadata(denom);

        // Emit MsgDelegate via Cosmos stargate.
        // cosmos::delegate internally calls stargate with disallow_failure(),
        // so any staking error aborts this transaction.
        cosmos::delegate(delegator, validator, metadata, amount);

        // Emit event for agent timeline UI.
        event::emit(StakeDelegateEvent {
            delegator: signer::address_of(delegator),
            validator,
            denom,
            amount,
            executed_at: timestamp::now_seconds(),
        });
    }
}
