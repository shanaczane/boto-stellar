# prd: stellar yellow belt live poll dapp (v0)

**Project name:** Boto (working name, "vote" in Filipino)
**Author:** Shana Cruzat
**Date:** July 2026
**Target:** Stellar Yellow Belt (Level 2) submission
**Build method:** Agent-directed development with Claude Code
**Prerequisite:** White Belt (Padala) shipped. Reuse patterns from that repo where noted.

---

## 1. Overview

A one-question live poll dApp on Stellar Testnet. Users connect any supported wallet via StellarWalletsKit, cast one vote on a Soroban smart contract, and watch results update in near-real-time as other votes land on-chain.

Two deliverables in one repo:
1. A Soroban contract (Rust) deployed to testnet
2. A Next.js frontend that calls it and streams its events

### Success criteria (maps 1:1 to submission rubric)

| Rubric item | Feature |
|---|---|
| StellarWalletsKit implementation | Wallet picker modal (Freighter, Albedo, xBull, Lobstr) |
| 3+ error types handled | Wallet not found, user rejected, double-vote contract error, insufficient balance for fees |
| Contract deployed on testnet | Poll contract, address in README |
| Contract called from frontend | `vote()` write call + `get_results()` read call |
| Reading and writing contract data | Same as above |
| Event listening + state sync | Poll RPC `getEvents` for vote events, update results live |
| Transaction status visible | Pending/success/fail tracker (reuse Padala TxStatus pattern) |
| 2+ meaningful commits | Commit per phase (will produce 5+) |
| Screenshot: wallet options | WalletsKit modal screenshot |
| Contract address + tx hash in README | Deliverables section below |

---

## 2. Tech stack

**Frontend:**
- Next.js 14+ (App Router), TypeScript, Tailwind CSS, pnpm
- `@creit.tech/stellar-wallets-kit` (wallet abstraction)
- `@stellar/stellar-sdk` (contract calls via rpc.Server, not Horizon)
- Deploy: Vercel

**Contract:**
- Rust + `soroban-sdk` (latest stable)
- `stellar-cli` for build/deploy/bindings
- Network: Testnet. RPC: `https://soroban-testnet.stellar.org`

**Environment note:** Dev machine is Windows 11 ARM64 (Snapdragon X). If `cargo install stellar-cli` or the wasm32 target fails on native Windows ARM, fall back to WSL2 (Ubuntu) for all contract work. Frontend stays on Windows. Claude Code should detect and confirm the toolchain works in Phase 1 before proceeding.

---

## 3. Repo structure

Monorepo, single repo for submission:

```
boto/
  contracts/
    poll/
      src/lib.rs        contract
      src/test.rs       contract unit tests
      Cargo.toml
  app/                  next.js frontend (or root-level if simpler)
    app/
      layout.tsx
      page.tsx
    components/
      WalletBar.tsx     connect via WalletsKit, address, disconnect
      PollCard.tsx      question + options + vote buttons
      ResultsBar.tsx    live-updating horizontal bars with counts + %
      TxStatus.tsx      pending/success/error banner (port from Padala)
      EventFeed.tsx     recent vote events list (nice-to-have, cut if slow)
    lib/
      walletKit.ts      StellarWalletsKit singleton + helpers
      contract.ts       contract client (generated bindings or manual)
      events.ts         getEvents polling logic
    hooks/
      useWallet.ts
      usePollResults.ts
      useVoteEvents.ts
  stellar-yellow-belt-prd.md
  README.md
```

---

## 4. Smart contract spec (`contracts/poll`)

### Question (hardcoded in contract for v0)

"Best racquet sport?" with options: `["badminton", "pickleball", "tennis"]`

Options stored as `Vec<Symbol>` or fixed indices 0-2. Keep it simple: use `u32` option index.

### Storage

- `Votes(u32) -> u64` per-option counters (instance storage)
- `HasVoted(Address) -> bool` one vote per address (persistent storage)

### Functions

```rust
pub fn vote(env: Env, voter: Address, option: u32)
```
- `voter.require_auth()`
- Panic with a defined error if `option > 2`: `Error::InvalidOption`
- Panic with a defined error if address already voted: `Error::AlreadyVoted`
- Increment counter, mark address as voted
- Publish event: topics `("vote",)`, data `(voter, option)`

```rust
pub fn get_results(env: Env) -> Vec<u64>
```
- Read-only, returns the 3 counters

```rust
pub fn has_voted(env: Env, voter: Address) -> bool
```
- Read-only, lets frontend disable buttons for voters

Use `contracterror` enum so errors surface with codes the frontend can match on.

### Tests (required before deploy)

- vote increments correct counter
- second vote from same address panics with AlreadyVoted
- invalid option index panics with InvalidOption
- get_results returns correct state after multiple voters

Run `cargo test` green before any deploy.

### Build + deploy commands (Claude Code executes, Shan approves)

```bash
stellar contract build
stellar contract deploy --wasm target/wasm32v1-none/release/poll.wasm \
  --source <deployer-identity> --network testnet
```

Deployer identity: create with `stellar keys generate deployer --network testnet --fund`. Never reuse the Freighter wallet's secret; the CLI identity is separate and testnet-only.

Record the deployed contract ID in `.env.local` as `NEXT_PUBLIC_POLL_CONTRACT_ID` and in the README.

### TypeScript bindings

```bash
stellar contract bindings typescript --contract-id <ID> --network testnet --output-dir app/packages/poll-client
```

Use the generated client if it integrates cleanly with the app's build. If binding package setup fights the Next.js/pnpm workspace, fall back to manual contract calls with stellar-sdk `Contract` + `assembleTransaction`. Decide in Phase 3, do not burn more than an hour on bindings issues.

---

## 5. Frontend feature specs

### 5.1 Wallet integration (StellarWalletsKit)

- Singleton kit instance in `lib/walletKit.ts`:
  - network: `WalletNetwork.TESTNET`
  - modules: `allowAllModules()` (gives Freighter, Albedo, xBull, Lobstr and more for free)
- "Connect Wallet" opens the kit's built-in modal (`openModal`). This modal is the required "wallet options" screenshot
- On selection, store `{ address, walletId }` in state; persist `walletId` in memory only (no localStorage per artifact constraints; plain state is fine since this deploys as a normal Next.js app, localStorage IS allowed here, use it for reconnect convenience)
- Disconnect clears state
- Signing: `kit.signTransaction(xdr, { networkPassphrase })` routes to whichever wallet is active

### 5.2 Poll flow

1. On load: call `get_results` (simulation-only read, no signing, free) and `has_voted(address)` once connected
2. Render question + 3 option buttons. Disable all if not connected or already voted, with a hint line explaining why
3. On vote click:
   - Build tx invoking `vote(address, optionIndex)`
   - Simulate → assemble → `kit.signTransaction` → send via rpc server
   - Track through TxStatus states: `pending` (sent, polling `getTransaction`) → `success` or `error`
4. On success: optimistically bump the local count, then let the event poller confirm

### 5.3 Real-time results (events)

- `useVoteEvents`: poll `rpc.Server.getEvents` every 5 seconds, filtered to the contract ID and `vote` topic, using cursor/ledger tracking so events are not double-counted
- On new events: refetch `get_results` (simpler and more correct than incrementing from event data)
- Show a subtle "live" indicator (pulsing dot) and optionally an EventFeed of the last 5 votes (truncated address + option)
- Test the real-time claim: vote from Account 1 in one browser window, watch results update in a second window connected with Account 2

### 5.4 Transaction status

Port `TxStatus` from Padala. Same three states, same stellar.expert testnet link on the hash. Add one state: `simulating` (before wallet popup) so the UI never feels dead.

### 5.5 Error handling (rubric: minimum 3 types)

Handle and display distinctly, with a small error-code-to-message map:

1. **Wallet not found / not installed:** WalletsKit module unavailable → message with install link
2. **User rejected signing:** catch from `signTransaction` → "Transaction cancelled in wallet"
3. **Contract error, AlreadyVoted:** parse simulation/tx failure for error code → "This address has already voted"
4. **Contract error, InvalidOption:** should be unreachable from UI, but mapped anyway
5. **Insufficient balance for fees:** unfunded account → "Fund this wallet with Friendbot first" + inline fund button (port from Padala)

That's 5 mapped types, comfortably above the minimum. README should list them explicitly so reviewers can check the box fast.

---

## 6. UI direction

Same visual system as Padala: dark navy, cyan accent, pink secondary, JetBrains Mono for addresses/hashes/contract ID. Single centered column.

Layout top to bottom: WalletBar → PollCard → ResultsBar → TxStatus → EventFeed. Results bars animate width on change (CSS transition) so live updates are visible in screenshots and demos.

---

## 7. Build phases (Claude Code checkpoints)

**Phase 1: toolchain + scaffold**
- Verify/install: Rust, wasm32 target, stellar-cli (WSL2 fallback per section 2)
- Scaffold Next.js app + `contracts/poll` cargo project
- Checkpoint: `stellar --version` works, `pnpm dev` serves, empty contract builds

**Phase 2: contract**
- Write contract + tests, `cargo test` green
- Deploy to testnet, record contract ID
- Smoke test from CLI: `stellar contract invoke ... -- vote` once, then `get_results`
- Checkpoint: CLI invoke shows a counted vote. **Commit: "contract: poll with vote/results/events, deployed to testnet"**

**Phase 3: wallet + reads**
- WalletsKit integration, connect/disconnect, modal working
- `get_results` + `has_voted` reads rendering
- Checkpoint: connect with Freighter through the kit modal, see real counts. **Commit**

**Phase 4: votes + status**
- Vote tx flow end to end with TxStatus
- Error map wired (test rejected-signing and double-vote for real)
- Checkpoint: vote from Account 1 succeeds with hash; second vote from same account shows AlreadyVoted error. **Commit**

**Phase 5: events + polish**
- Event polling + live results, two-window test
- EventFeed if time allows
- Styling pass. **Commit**

**Phase 6: ship**
- README (spec below), screenshots, Vercel deploy
- Final commit, submit repo link

---

## 8. Deliverables

**Repo:** public GitHub repo `boto-stellar` (or similar)

**README.md must contain:**
1. Project description + how the poll works
2. Live demo link (Vercel)
3. **Deployed contract address** (testnet, prominently placed)
4. **Transaction hash of a contract call** with stellar.expert testnet link
5. Screenshots:
   - WalletsKit modal showing wallet options (required)
   - Poll with live results
   - TxStatus success with hash
   - An error state (AlreadyVoted) as a bonus
6. Error types handled (list all 5 explicitly)
7. Setup instructions: prerequisites (Node, pnpm, Rust + stellar-cli for contract dev), env vars, run commands, how to redeploy the contract
8. Architecture note: 3-4 sentences on contract storage design and the event polling approach

---

## 9. Out of scope (v0)

- Multiple polls / poll creation UI (question is hardcoded)
- Vote weighting, token gating
- Mainnet anything
- Websocket/streaming infra (polling is fine)
- Wallet mobile deep links

---

## 10. Known risks

1. **ARM64 toolchain friction.** stellar-cli or wasm builds may fail on native Windows ARM. Mitigation: WSL2 fallback decided in Phase 1, not mid-project
2. **Bindings package vs pnpm workspace friction.** Timeboxed to 1 hour, manual SDK calls as fallback (section 4)
3. **soroban-sdk / stellar-cli version drift.** APIs move fast. Claude Code must check installed versions and current docs patterns (stellar.org/docs) rather than assume from training data. The wasm target name in particular has changed across versions (`wasm32-unknown-unknown` vs `wasm32v1-none`); use whatever the installed CLI's build output actually produces
4. **Event retention.** Testnet RPC only retains events for a limited ledger window. Poller must handle "start from latest ledger" gracefully on load rather than trying to backfill history
5. **Freighter network mismatch** still applies. Keep the network guard from Padala
