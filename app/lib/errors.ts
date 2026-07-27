import { contract } from "@stellar/stellar-sdk";

const CONTRACT_ERROR_PATTERN = /Error\(Contract, #(\d+)\)/;

const CONTRACT_ERROR_MESSAGES: Record<number, string> = {
  1: "Invalid option selected.",
  2: "This address has already voted.",
};

/**
 * Maps a thrown error from the vote flow to one of the PRD's 5 user-facing
 * error types. Contract panics (AlreadyVoted/InvalidOption) surface as plain
 * simulation-failure errors here since the contract panics rather than
 * returning Result<T, Error>, so we parse the "Error(Contract, #N)" pattern
 * ourselves instead of relying on the SDK's Result<T,E> decoding.
 */
const { Errors } = contract.AssembledTransaction;

export function describeVoteError(err: unknown): string {
  if (err instanceof Errors.UserRejected) {
    return "Transaction cancelled in wallet.";
  }
  if (err instanceof Errors.InternalWalletError) {
    return "Wallet error: something went wrong inside the wallet. Please try again.";
  }
  if (err instanceof Errors.ExternalServiceError) {
    return "Wallet error: the wallet's backend service is unavailable. Please try again.";
  }
  if (err instanceof Errors.InvalidClientRequest) {
    return "Wallet error: invalid request sent to the wallet.";
  }

  const message = err instanceof Error ? err.message : String(err);

  if (/account not found/i.test(message)) {
    return "This wallet has no XLM yet — fund it with Friendbot first.";
  }

  const match = message.match(CONTRACT_ERROR_PATTERN);
  if (match) {
    const code = Number(match[1]);
    return CONTRACT_ERROR_MESSAGES[code] ?? `Contract error #${code}.`;
  }

  return message || "Something went wrong. Please try again.";
}

export function describeConnectError(err: unknown): string {
  const kitError = err as { code?: number; message?: string } | undefined;
  if (kitError?.code === -4) {
    return "Wallet connection cancelled.";
  }
  if (kitError?.code === -1 || kitError?.code === -2) {
    return "No compatible wallet found — install a Stellar wallet extension (e.g. Freighter) and try again.";
  }
  return err instanceof Error ? err.message : "Failed to connect wallet.";
}
