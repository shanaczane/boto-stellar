import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { Networks } from "@creit.tech/stellar-wallets-kit/types";

export { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
export { KitEventType } from "@creit.tech/stellar-wallets-kit/types";

let initialized = false;

// StellarWalletsKit must be initialized in a browser context, not during SSR.
export function initWalletKit() {
  if (initialized || typeof window === "undefined") return;
  StellarWalletsKit.init({
    network: Networks.TESTNET,
    modules: defaultModules(),
  });
  initialized = true;
}
