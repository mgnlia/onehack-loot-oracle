/// Tests for LootOracle contract
#[test_only]
module loot_oracle::loot_oracle_tests {
    use loot_oracle::loot_oracle::{Self, OracleConfig, AdminCap, LootItem};
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::clock;

    const ADMIN: address = @0xA;
    const PLAYER: address = @0xB;

    fun setup_oracle(scenario: &mut Scenario) {
        ts::next_tx(scenario, ADMIN);
        {
            loot_oracle::init_for_testing(ts::ctx(scenario));
        };
    }

    #[test]
    fun test_init_creates_config() {
        let mut scenario = ts::begin(ADMIN);
        setup_oracle(&mut scenario);

        ts::next_tx(&mut scenario, ADMIN);
        {
            let config = ts::take_shared<OracleConfig>(&scenario);
            let (total, legendary) = loot_oracle::get_stats(&config);
            assert!(total == 0, 0);
            assert!(legendary == 0, 1);
            ts::return_shared(config);
        };

        ts::end(scenario);
    }

    #[test]
    fun test_commit_behavior_score() {
        let mut scenario = ts::begin(ADMIN);
        setup_oracle(&mut scenario);

        ts::next_tx(&mut scenario, ADMIN);
        {
            let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
            let clock = clock::create_for_testing(ts::ctx(&mut scenario));

            loot_oracle::commit_behavior_score(
                &admin_cap,
                PLAYER,
                750, // good behavior score
                300_000, // 5 minutes validity
                &clock,
                ts::ctx(&mut scenario),
            );

            clock::destroy_for_testing(clock);
            ts::return_to_sender(&scenario, admin_cap);
        };

        ts::end(scenario);
    }
}
