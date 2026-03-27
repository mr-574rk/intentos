/// Module: lending_adapter
/// Adapter for lending/borrowing operations.
///
/// ⚠️  STATUS: Guarded no-op pending lending protocol deployment on Initia testnet.
///
/// MinitiaStdlib (source verified 2026-03-26) does NOT include a lending module.
/// This adapter emits a `LendPendingEvent` to record the user's intent on-chain
/// and surface it in the agent timeline UI without reverting the bundle.
///
/// UPGRADE PATH:
/// When an Initia lending protocol (e.g. Init Lend, Aave-fork) is deployed on
/// testnet, replace the event emission below with:
///   lending_protocol::supply(account, metadata, amount);
/// Update the module imports accordingly and remove this notice.
///
/// Atomicity: No state change occurs here, so no abort risk from lending.
/// The bundle continues to execute subsequent steps normally.

module intentos::lending_adapter {
    use std::signer;
    use std::string::String;

    use minitia_std::coin;
    use minitia_std::event;
    use minitia_std::timestamp;

    friend intentos::strategy_executor;

    // ── Errors ────────────────────────────────────────────────

    /// Emitted when a lend action is requested but no lending protocol is available.
    const E_LENDING_NOT_AVAILABLE: u64 = 1;

    // ── Events ────────────────────────────────────────────────

    #[event]
    /// Emitted when a lend action is requested.
    /// Signals that the user explicitly requested lending but the protocol
    /// is not yet available on this chain deployment.
    struct LendPendingEvent has drop, store {
        /// Account that requested the lend
        account: address,
        /// Token denom the user wants to lend
        denom: String,
        /// Amount in base units
        amount: u64,
        /// Block timestamp in seconds
        executed_at: u64,
        /// Human-readable reason for no-op
        reason: vector<u8>,
    }

    // ── Public Functions ──────────────────────────────────────

    /// Record a lending intent on-chain.
    ///
    /// Emits `LendPendingEvent` so the agent timeline reflects the step.
    /// Does NOT perform a real token transfer — no lending protocol is
    /// available in MinitiaStdlib at this time.
    ///
    /// Future: replace with `lending_protocol::supply(account, metadata, amount)`.
    public(friend) fun lend(
        account: &signer,
        denom: String,
        amount: u64,
    ) {
        // Verify the denom is resolvable (validates user input, no transfer).
        // This will abort if an invalid denom is passed, surfacing the error early.
        let _metadata = coin::denom_to_metadata(denom);

        // Emit pending event — no state is changed.
        event::emit(LendPendingEvent {
            account: signer::address_of(account),
            denom,
            amount,
            executed_at: timestamp::now_seconds(),
            reason: b"Lending protocol not yet deployed on Initia testnet. Intent recorded.",
        });
    }
}
