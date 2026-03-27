/// Module: dex_adapter
/// Adapter for DEX operations using minitia_std::dex.
///
/// Verified API (from MinitiaStdlib source dex.move:1010):
///   dex::swap_script(
///       account: &signer,
///       pair: Object<Config>,
///       offer_coin: Object<Metadata>,
///       offer_coin_amount: u64,
///       min_return: Option<u64>
///   )
///
/// Verified API (from MinitiaStdlib source dex.move:938):
///   dex::provide_liquidity_script(
///       account: &signer,
///       pair: Object<Config>,
///       coin_a_amount_in: u64,
///       coin_b_amount_in: u64,
///       min_liquidity: Option<u64>
///   )
///
/// Pair addresses must be pre-resolved off-chain and passed as `pair_addr`.
/// Use coin::denom_to_metadata to resolve offer/coin denoms.
///
/// Atomicity: dex::swap_script and dex::provide_liquidity_script abort on
/// any invalid state (EMIN_RETURN, EPOOL_LOCKED, etc.), causing the entire
/// execute_bundle transaction to revert.

module intentos::dex_adapter {
    use std::option;
    use std::signer;
    use std::string::String;

    use minitia_std::dex;
    use minitia_std::dex::Config;
    use minitia_std::coin;
    use minitia_std::object;
    use minitia_std::event;
    use minitia_std::timestamp;

    friend intentos::strategy_executor;

    // -- Events ------------------------------------------------

    #[event]
    /// Emitted on every successful token swap.
    struct DexSwapEvent has drop, store {
        /// Trader address
        trader: address,
        /// Address of the DEX pair (liquidity pool object)
        pair_addr: address,
        /// Offered token denom
        offer_denom: String,
        /// Amount offered in base units
        offer_amount: u64,
        /// Block timestamp in seconds
        executed_at: u64,
    }

    #[event]
    /// Emitted on every successful liquidity provision.
    struct DexLiquidityEvent has drop, store {
        /// Provider address
        provider: address,
        /// Address of the DEX pair
        pair_addr: address,
        /// Token A denom
        coin_a_denom: String,
        /// Token B denom
        coin_b_denom: String,
        /// Amount of coin A provided (each side gets half of `amount`)
        coin_a_amount: u64,
        /// Amount of coin B provided
        coin_b_amount: u64,
        /// Block timestamp in seconds
        executed_at: u64,
    }

    // -- Public Functions --------------------------------------

    /// Swap `amount` of `offer_denom` tokens for `return_denom` tokens
    /// through the given liquidity `pair_addr`.
    ///
    /// `pair_addr` is the object address of the dex::Config pool, resolved
    /// off-chain from initiaConfig.ts and passed through execute_bundle's
    /// `step_pair_addrs` vector.
    ///
    /// Errors (EMIN_RETURN, EPOOL_LOCKED, ECOIN_TYPE) propagate upward,
    /// aborting the entire bundle (atomic execution).
    public(friend) fun swap(
        account: &signer,
        pair_addr: address,
        offer_denom: String,
        amount: u64,
    ) {
        // Resolve pair address to dex::Config object.
        let pair: object::Object<Config> = object::address_to_object<Config>(pair_addr);

        // Resolve offer token denom to fungible asset metadata.
        let offer_metadata = coin::denom_to_metadata(offer_denom);

        // Execute swap via dex::swap_script.
        // This withdraws from the signer's primary store, swaps in the pool,
        // and deposits the return token back into the signer's primary store.
        // min_return is set to none - slippage protection should be added
        // via configuration in production.
        dex::swap_script(account, pair, offer_metadata, amount, option::none());

        // Emit event for agent timeline UI.
        event::emit(DexSwapEvent {
            trader: signer::address_of(account),
            pair_addr,
            offer_denom,
            offer_amount: amount,
            executed_at: timestamp::now_seconds(),
        });
    }

    /// Provide liquidity to a DEX pair pool.
    ///
    /// Splits `amount` equally between coin A and coin B.
    /// In practice the caller should pass pre-calculated amounts;
    /// this equal-split is a safe default for simple strategy bundles.
    ///
    /// `pair_addr` is the object address of the dex::Config pool.
    ///
    /// Errors propagate upward, aborting the entire bundle.
    public(friend) fun provide_liquidity(
        account: &signer,
        pair_addr: address,
        coin_a_denom: String,
        coin_b_denom: String,
        amount: u64,
    ) {
        // Split amount equally between the two pool tokens.
        let half = amount / 2;

        // Resolve pair address to dex::Config object.
        let pair: object::Object<Config> = object::address_to_object<Config>(pair_addr);

        // Provide liquidity using both coins from the signer's primary store.
        // LP tokens are deposited back into the signer's primary store.
        dex::provide_liquidity_script(account, pair, half, half, option::none());

        // Emit event for agent timeline UI.
        event::emit(DexLiquidityEvent {
            provider: signer::address_of(account),
            pair_addr,
            coin_a_denom,
            coin_b_denom,
            coin_a_amount: half,
            coin_b_amount: half,
            executed_at: timestamp::now_seconds(),
        });
    }
}
