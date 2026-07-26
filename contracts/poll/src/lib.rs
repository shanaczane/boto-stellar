#![no_std]
use soroban_sdk::{contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, Vec};

const OPTION_COUNT: u32 = 3;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Votes(u32),
    HasVoted(Address),
}

#[contractevent(topics = ["vote"], data_format = "vec")]
pub struct VoteEvent {
    pub voter: Address,
    pub option: u32,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidOption = 1,
    AlreadyVoted = 2,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn vote(env: Env, voter: Address, option: u32) {
        voter.require_auth();

        if option >= OPTION_COUNT {
            env.panic_with_error(Error::InvalidOption);
        }

        let has_voted_key = DataKey::HasVoted(voter.clone());
        if env.storage().persistent().has(&has_voted_key) {
            env.panic_with_error(Error::AlreadyVoted);
        }

        let votes_key = DataKey::Votes(option);
        let count: u64 = env.storage().instance().get(&votes_key).unwrap_or(0);
        env.storage().instance().set(&votes_key, &(count + 1));
        env.storage().persistent().set(&has_voted_key, &true);

        VoteEvent { voter, option }.publish(&env);
    }

    pub fn get_results(env: Env) -> Vec<u64> {
        let mut results = Vec::new(&env);
        for option in 0..OPTION_COUNT {
            let count: u64 = env
                .storage()
                .instance()
                .get(&DataKey::Votes(option))
                .unwrap_or(0);
            results.push_back(count);
        }
        results
    }

    pub fn has_voted(env: Env, voter: Address) -> bool {
        env.storage().persistent().has(&DataKey::HasVoted(voter))
    }
}

mod test;
