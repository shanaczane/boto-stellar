#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;

fn setup() -> (Env, ContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    (env, client)
}

#[test]
fn vote_increments_correct_counter() {
    let (env, client) = setup();
    let voter = Address::generate(&env);

    client.vote(&voter, &1);

    assert_eq!(client.get_results(), Vec::from_array(&env, [0, 1, 0]));
}

#[test]
fn second_vote_from_same_address_fails() {
    let (env, client) = setup();
    let voter = Address::generate(&env);

    client.vote(&voter, &0);
    let result = client.try_vote(&voter, &1);

    assert_eq!(result, Err(Ok(Error::AlreadyVoted.into())));
}

#[test]
fn invalid_option_index_fails() {
    let (env, client) = setup();
    let voter = Address::generate(&env);

    let result = client.try_vote(&voter, &3);

    assert_eq!(result, Err(Ok(Error::InvalidOption.into())));
}

#[test]
fn get_results_reflects_multiple_voters() {
    let (env, client) = setup();
    let voter_a = Address::generate(&env);
    let voter_b = Address::generate(&env);
    let voter_c = Address::generate(&env);

    client.vote(&voter_a, &0);
    client.vote(&voter_b, &0);
    client.vote(&voter_c, &2);

    assert_eq!(client.get_results(), Vec::from_array(&env, [2, 0, 1]));
}

#[test]
fn has_voted_reflects_state() {
    let (env, client) = setup();
    let voter = Address::generate(&env);

    assert!(!client.has_voted(&voter));
    client.vote(&voter, &0);
    assert!(client.has_voted(&voter));
}
