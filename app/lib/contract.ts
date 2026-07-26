import { Networks, contract } from "@stellar/stellar-sdk";

export const CONTRACT_ID = process.env.NEXT_PUBLIC_POLL_CONTRACT_ID!;
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const OPTION_LABELS = ["badminton", "pickleball", "tennis"] as const;

interface PollContract {
  vote: (
    args: { voter: string; option: number },
    opts?: contract.MethodOptions,
  ) => Promise<contract.AssembledTransaction<null>>;
  get_results: (
    opts?: contract.MethodOptions,
  ) => Promise<contract.AssembledTransaction<bigint[]>>;
  has_voted: (
    args: { voter: string },
    opts?: contract.MethodOptions,
  ) => Promise<contract.AssembledTransaction<boolean>>;
}

export function getPollClient(opts?: {
  publicKey?: string;
  signTransaction?: contract.SignTransaction;
}) {
  return contract.Client.from<PollContract>({
    contractId: CONTRACT_ID,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    ...opts,
  });
}

export async function fetchResults(): Promise<number[]> {
  const client = await getPollClient();
  const tx = await client.get_results();
  return tx.result.map(Number);
}

export async function fetchHasVoted(voter: string): Promise<boolean> {
  const client = await getPollClient();
  const tx = await client.has_voted({ voter });
  return tx.result;
}
