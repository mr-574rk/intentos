/// Module: bank_adapter
/// Adapter for on-chain token transfers using minitia_std::primary_fungible_store.
///
/// Verified API (from MinitiaStdlib source primary_fungible_store.move:291):
///   primary_fungible_store::transfer<T: key>(sender: &signer, metadata: Object<T>, recipient: address, amount: u64)
///
/// Verified API (from MinitiaStdlib source coin.move:387):
///   coin::denom_to_metadata(denom: String): Object<Metadata>
///
/// Atomicity: All errors from the underlying modules propagate upward,
/// causing the entire execute_bundle transaction to abort.

module intentos::bank_adapter {
    use std::signer;
    use std::string::String;

    use minitia_std::primary_fungible_store;
    use minitia_std::coin;
    use minitia_std::event;
    use minitia_std::timestamp;

    friend intentos::strategy_executor;

    // -- Events ------------------------------------------------

    #[event]
    /// Emitted on every successful token transfer, powers the agent timeline UI.
    struct BankTransferEvent has drop, store {
        /// Sender address
        sender: address,
        /// Recipient address
        recipient: address,
        /// Token denom (e.g. "USDC", "move/0x...")
        denom: String,
        /// Amount transferred in base units (6 decimals)
        amount: u64,
        /// Block timestamp in seconds when the transfer completed
        executed_at: u64,
    }

    // -- Public Functions --------------------------------------

    /// Transfer `amount` of `denom` tokens from the signer's primary store
    /// to `recipient`'s primary store.
    ///
    /// Called by StrategyExecutor for both `transfer` and `batch_transfer` actions.
    ///
    /// Errors abort the entire bundle (atomic execution).
    public(friend) fun transfer(
        sender: &signer,
        denom: String,
        recipient: address,
        amount: u64,
    ) {
        // Resolve token denom -> fungible asset metadata object.
        // coin::denom_to_metadata handles both native denoms ("USDC", "INIT")
        // and move-prefixed denoms ("move/0x...").
        let metadata = coin::denom_to_metadata(denom);

        // Execute the transfer using primary fungible store.
        // This creates the recipient's store if it does not yet exist.
        primary_fungible_store::transfer(sender, metadata, recipient, amount);

        // Emit event for the agent timeline UI.
        event::emit(BankTransferEvent {
            sender: signer::address_of(sender),
            recipient,
            denom,
            amount,
            executed_at: timestamp::now_seconds(),
        });
    }
}
