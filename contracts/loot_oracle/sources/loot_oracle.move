/// LootOracle — AI-powered on-chain loot distribution for OneChain (OneHack 3.0)
///
/// Architecture:
///   1. On-chain randomness (sui::random) seeds a loot roll
///   2. Player behavior score (AI-computed off-chain, committed on-chain) adjusts drop weights
///   3. Loot NFT is minted and transferred to the winner
///
/// Rarity tiers: Common(0) | Uncommon(1) | Rare(2) | Epic(3) | Legendary(4)
module loot_oracle::loot_oracle {
    use sui::random::{Random, new_generator};
    use sui::event;
    use sui::clock::{Clock};
    use std::string::{Self, String};

    // ─── Constants ────────────────────────────────────────────────────────────
    const RARITY_COMMON: u8     = 0;
    const RARITY_UNCOMMON: u8   = 1;
    const RARITY_RARE: u8       = 2;
    const RARITY_EPIC: u8       = 3;
    const RARITY_LEGENDARY: u8  = 4;

    const MAX_BEHAVIOR_SCORE: u64 = 1000;

    // ─── Errors ───────────────────────────────────────────────────────────────
    const EInvalidBehaviorScore: u64 = 1;
    const EInvalidSignature: u64     = 2;

    // ─── Objects ──────────────────────────────────────────────────────────────

    /// Shared oracle config — holds admin cap and global stats
    public struct OracleConfig has key {
        id: UID,
        total_rolls: u64,
        legendary_drops: u64,
        oracle_version: u64,
    }

    /// Admin capability
    public struct AdminCap has key, store { id: UID }

    /// Loot NFT — the actual drop
    public struct LootItem has key, store {
        id: UID,
        name: String,
        rarity: u8,
        item_type: u8,       // 0=weapon,1=armor,2=consumable,3=artifact
        power: u64,
        minted_at: u64,
        behavior_score: u64, // player's AI score at time of drop
        roll_seed: u64,      // on-chain randomness seed (auditable)
    }

    /// Behavior score commitment — oracle submits this before roll
    public struct BehaviorCommitment has key {
        id: UID,
        player: address,
        score: u64,          // 0–1000; higher = better behavior
        committed_at: u64,
        valid_for_ms: u64,   // commitment expires after this window
    }

    // ─── Events ───────────────────────────────────────────────────────────────

    public struct LootRolled has copy, drop {
        player: address,
        rarity: u8,
        item_type: u8,
        power: u64,
        behavior_score: u64,
        roll_seed: u64,
        item_id: ID,
    }

    public struct BehaviorScoreCommitted has copy, drop {
        player: address,
        score: u64,
        committed_at: u64,
    }

    // ─── Init ─────────────────────────────────────────────────────────────────

    fun init(ctx: &mut TxContext) {
        let config = OracleConfig {
            id: object::new(ctx),
            total_rolls: 0,
            legendary_drops: 0,
            oracle_version: 1,
        };
        transfer::share_object(config);

        let admin_cap = AdminCap { id: object::new(ctx) };
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // ─── Oracle: commit behavior score ────────────────────────────────────────

    /// The off-chain AI oracle submits a player's behavior score on-chain.
    /// Score is computed from: session length, trade frequency, win/loss ratio,
    /// social interactions, anti-cheat signals.
    public entry fun commit_behavior_score(
        _admin: &AdminCap,
        player: address,
        score: u64,
        valid_for_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(score <= MAX_BEHAVIOR_SCORE, EInvalidBehaviorScore);

        let commitment = BehaviorCommitment {
            id: object::new(ctx),
            player,
            score,
            committed_at: sui::clock::timestamp_ms(clock),
            valid_for_ms,
        };

        event::emit(BehaviorScoreCommitted {
            player,
            score,
            committed_at: sui::clock::timestamp_ms(clock),
        });

        // Transfer commitment to player so they can present it for a roll
        transfer::transfer(commitment, player);
    }

    // ─── Core: roll loot ──────────────────────────────────────────────────────

    /// Player presents their behavior commitment and requests a loot roll.
    /// On-chain randomness + behavior score determines rarity and item stats.
    public entry fun roll_loot(
        config: &mut OracleConfig,
        commitment: BehaviorCommitment,
        rand: &Random,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let player = tx_context::sender(ctx);
        let now = sui::clock::timestamp_ms(clock);

        // Validate commitment belongs to caller and is still valid
        assert!(commitment.player == player, EInvalidSignature);
        assert!(
            now <= commitment.committed_at + commitment.valid_for_ms,
            EInvalidSignature
        );

        let behavior_score = commitment.score;

        // Destroy commitment (single-use)
        let BehaviorCommitment { id, player: _, score: _, committed_at: _, valid_for_ms: _ } = commitment;
        object::delete(id);

        // Generate randomness
        let mut gen = new_generator(rand, ctx);
        let raw_roll: u64 = (sui::random::generate_u64(&mut gen) % 10000); // 0–9999
        let roll_seed = raw_roll;

        // AI behavior boost: high score players get +bonus to effective roll
        // Score 0–1000 maps to 0–2000 bonus (up to +20% chance improvement)
        let behavior_bonus = (behavior_score * 2000) / MAX_BEHAVIOR_SCORE;
        let effective_roll = if (raw_roll + behavior_bonus > 9999) {
            9999
        } else {
            raw_roll + behavior_bonus
        };

        // Rarity thresholds (with behavior boost applied):
        // Legendary:  9500–9999 (base 5%  → up to 7% with max score)
        // Epic:       8500–9499 (base 10% → up to 12%)
        // Rare:       6500–8499 (base 20% → up to 22%)
        // Uncommon:   3500–6499 (base 30%)
        // Common:     0–3499    (base 35%)
        let rarity = if (effective_roll >= 9500) {
            RARITY_LEGENDARY
        } else if (effective_roll >= 8500) {
            RARITY_EPIC
        } else if (effective_roll >= 6500) {
            RARITY_RARE
        } else if (effective_roll >= 3500) {
            RARITY_UNCOMMON
        } else {
            RARITY_COMMON
        };

        // Item type from secondary random draw
        let item_type_roll: u8 = (sui::random::generate_u8(&mut gen) % 4);

        // Power scales with rarity + behavior score
        let base_power = match_rarity_base_power(rarity);
        let score_bonus = (behavior_score * base_power) / (MAX_BEHAVIOR_SCORE * 5); // up to +20%
        let power = base_power + score_bonus;

        // Mint loot NFT
        let name = build_item_name(rarity, item_type_roll);
        let loot = LootItem {
            id: object::new(ctx),
            name,
            rarity,
            item_type: item_type_roll,
            power,
            minted_at: now,
            behavior_score,
            roll_seed,
        };

        let item_id = object::id(&loot);

        // Update global stats
        config.total_rolls = config.total_rolls + 1;
        if (rarity == RARITY_LEGENDARY) {
            config.legendary_drops = config.legendary_drops + 1;
        };

        event::emit(LootRolled {
            player,
            rarity,
            item_type: item_type_roll,
            power,
            behavior_score,
            roll_seed,
            item_id,
        });

        transfer::transfer(loot, player);
    }

    // ─── View helpers ─────────────────────────────────────────────────────────

    public fun get_stats(config: &OracleConfig): (u64, u64) {
        (config.total_rolls, config.legendary_drops)
    }

    public fun get_loot_info(item: &LootItem): (String, u8, u8, u64, u64) {
        (item.name, item.rarity, item.item_type, item.power, item.behavior_score)
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    fun match_rarity_base_power(rarity: u8): u64 {
        if (rarity == RARITY_LEGENDARY) { 1000 }
        else if (rarity == RARITY_EPIC) { 500 }
        else if (rarity == RARITY_RARE) { 200 }
        else if (rarity == RARITY_UNCOMMON) { 75 }
        else { 20 }
    }

    fun build_item_name(rarity: u8, item_type: u8): String {
        let rarity_prefix = if (rarity == RARITY_LEGENDARY) { b"Legendary " }
            else if (rarity == RARITY_EPIC) { b"Epic " }
            else if (rarity == RARITY_RARE) { b"Rare " }
            else if (rarity == RARITY_UNCOMMON) { b"Uncommon " }
            else { b"Common " };

        let type_name = if (item_type == 0) { b"Blade" }
            else if (item_type == 1) { b"Shield" }
            else if (item_type == 2) { b"Elixir" }
            else { b"Rune" };

        let mut name = string::utf8(rarity_prefix);
        string::append(&mut name, string::utf8(type_name));
        name
    }

    // ─── Test helpers ─────────────────────────────────────────────────────────
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
