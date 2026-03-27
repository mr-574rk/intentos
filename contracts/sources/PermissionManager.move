/// Module: permission_manager
/// Manages session-based execution permissions for the IntentOS agent.
/// Integrates with InterwovenKit session keys to allow the executor to run
/// strategy bundles on behalf of users after a single wallet approval.
///
/// Verified APIs used:
///   minitia_std::timestamp::now_seconds()  (timestamp.move:12)
///   minitia_std::event::emit<T>()          (event.move:3)

module intentos::permission_manager {
    use std::signer;
    use std::string::{Self, String};
    use std::error;

    use minitia_std::event;
    use minitia_std::timestamp;

    // -- Errors ------------------------------------------------

    const E_SESSION_NOT_FOUND: u64 = 1;
    const E_SESSION_EXPIRED: u64   = 2;
    const E_NOT_AUTHORIZED: u64    = 3;
    const E_ALREADY_REGISTERED: u64 = 4;
    const E_STRATEGY_MISMATCH: u64 = 5;

    // -- Structs -----------------------------------------------

    struct SessionPermission has key, store {
        /// User who approved the session
        owner: address,
        /// InterwovenKit session key identifier
        session_key: String,
        /// Strategy ID this session is locked to
        strategy_id: String,
        /// Expiry as Unix epoch seconds (from timestamp::now_seconds())
        expires_at: u64,
        /// Revocation flag - set false via revoke_session
        is_active: bool,
    }

    // -- Events ------------------------------------------------

    #[event]
    struct SessionRegisteredEvent has drop, store {
        owner: address,
        strategy_id: String,
        expires_at: u64,
    }

    #[event]
    struct SessionRevokedEvent has drop, store {
        owner: address,
    }

    // -- Public Entry Functions --------------------------------

    /// Register a session permission after user wallet approval.
    /// Called once - the agent uses this session for the full bundle.
    /// Aborts if a session is already registered for this owner.
    public entry fun register_session(
        owner: &signer,
        session_key: vector<u8>,
        strategy_id: vector<u8>,
        expires_at: u64,
    ) acquires SessionPermission {
        let owner_addr = signer::address_of(owner);
        let strategy_id_str = string::utf8(strategy_id);
        let key_str = string::utf8(session_key);

        if (exists<SessionPermission>(owner_addr)) {
            let permission = borrow_global_mut<SessionPermission>(owner_addr);
            permission.session_key = key_str;
            permission.strategy_id = strategy_id_str;
            permission.expires_at = expires_at;
            permission.is_active = true;
        } else {
            let permission = SessionPermission {
                owner: owner_addr,
                session_key: key_str,
                strategy_id: strategy_id_str,
                expires_at,
                is_active: true,
            };
            move_to(owner, permission);
        };

        event::emit(SessionRegisteredEvent {
            owner: owner_addr,
            strategy_id: strategy_id_str,
            expires_at,
        });
    }

    /// Revoke a session permission. User can call this at any time to stop
    /// the agent from executing further bundles.
    public entry fun revoke_session(owner: &signer) acquires SessionPermission {
        let owner_addr = signer::address_of(owner);
        assert!(exists<SessionPermission>(owner_addr), error::not_found(E_SESSION_NOT_FOUND));

        let permission = borrow_global_mut<SessionPermission>(owner_addr);
        permission.is_active = false;

        event::emit(SessionRevokedEvent { owner: owner_addr });
    }

    // -- Internal Validation (called by StrategyExecutor) -----

    /// Assert that a valid, non-expired session exists for `owner_addr`
    /// and that it is locked to the given `strategy_id`.
    ///
    /// Called as the FIRST security check at the top of execute_bundle.
    /// Any failure aborts the entire transaction (atomic execution).
    public fun assert_session_valid(
        owner_addr: address,
        strategy_id: String,
    ) acquires SessionPermission {
        // 1. Session must exist.
        assert!(exists<SessionPermission>(owner_addr), error::not_found(E_SESSION_NOT_FOUND));

        let permission = borrow_global<SessionPermission>(owner_addr);

        // 2. Session must not have been revoked.
        assert!(permission.is_active, error::invalid_state(E_NOT_AUTHORIZED));

        // 3. Session must not have expired (compare block time to stored expiry).
        assert!(
            timestamp::now_seconds() < permission.expires_at,
            error::invalid_state(E_SESSION_EXPIRED)
        );

        // 4. Session must be locked to the strategy being executed.
        assert!(
            permission.strategy_id == strategy_id,
            error::invalid_argument(E_STRATEGY_MISMATCH)
        );
    }

    // -- View Functions ----------------------------------------

    #[view]
    public fun is_session_active(owner: address): bool acquires SessionPermission {
        if (!exists<SessionPermission>(owner)) return false;
        let permission = borrow_global<SessionPermission>(owner);
        permission.is_active && timestamp::now_seconds() < permission.expires_at
    }

    #[view]
    public fun get_session_strategy(owner: address): String acquires SessionPermission {
        assert!(exists<SessionPermission>(owner), error::not_found(E_SESSION_NOT_FOUND));
        let permission = borrow_global<SessionPermission>(owner);
        *&permission.strategy_id
    }

    #[view]
    public fun get_session_expiry(owner: address): u64 acquires SessionPermission {
        assert!(exists<SessionPermission>(owner), error::not_found(E_SESSION_NOT_FOUND));
        borrow_global<SessionPermission>(owner).expires_at
    }
}
