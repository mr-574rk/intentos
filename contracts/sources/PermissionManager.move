/// Module: permission_manager
/// Initia Move smart contract - manages session-based execution permissions.
/// Integrates with InterwovenKit session keys to allow the IntentOS agent
/// to execute transaction bundles on behalf of users after a single approval.
///
/// NOTE: Scaffold stub for hackathon submission.

module intentos::permission_manager {
    use std::signer;
    use std::string::{Self, String};

    // -- Errors -----------------------------------------------

    const E_SESSION_NOT_FOUND: u64 = 1;
    const E_SESSION_EXPIRED: u64 = 2;
    const E_NOT_AUTHORIZED: u64 = 3;
    const E_ALREADY_REGISTERED: u64 = 4;

    // -- Structs ----------------------------------------------

    struct SessionPermission has key, store {
        owner: address,
        session_key: String,       // InterwovenKit session key
        strategy_id: String,       // locked to specific strategy
        expires_at: u64,           // epoch seconds
        is_active: bool,
    }

    // -- Public Entry Functions --------------------------------

    /// Register a session permission after user wallet approval.
    /// Called once - the agent uses this session for the full bundle.
    public entry fun register_session(
        owner: &signer,
        session_key: vector<u8>,
        strategy_id: vector<u8>,
        expires_at: u64,
    ) {
        let owner_addr = signer::address_of(owner);

        let permission = SessionPermission {
            owner: owner_addr,
            session_key: string::utf8(session_key),
            strategy_id: string::utf8(strategy_id),
            expires_at,
            is_active: true,
        };

        // Store under the owner's account
        move_to(owner, permission);
    }

    /// Revoke a session permission (user can cancel at any time).
    public entry fun revoke_session(owner: &signer) acquires SessionPermission {
        let owner_addr = signer::address_of(owner);
        assert!(exists<SessionPermission>(owner_addr), E_SESSION_NOT_FOUND);

        let permission = borrow_global_mut<SessionPermission>(owner_addr);
        permission.is_active = false;
    }

    // -- View Functions ----------------------------------------

    #[view]
    public fun is_session_active(owner: address): bool acquires SessionPermission {
        if (!exists<SessionPermission>(owner)) return false;
        let permission = borrow_global<SessionPermission>(owner);
        permission.is_active
    }

    #[view]
    public fun get_session_strategy(owner: address): String acquires SessionPermission {
        assert!(exists<SessionPermission>(owner), E_SESSION_NOT_FOUND);
        let permission = borrow_global<SessionPermission>(owner);
        *&permission.strategy_id
    }
}
