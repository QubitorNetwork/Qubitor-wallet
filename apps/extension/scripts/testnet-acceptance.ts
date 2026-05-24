import type { Hex } from "@qubitor/core";
import {
  EXTENSION_WALLET_STORAGE_KEY,
  createExtensionWalletProfile,
  readExtensionActivity,
  unlockExtensionWalletProfile,
  wipeExtensionWallet,
} from "../lib/extensionWalletVault";
import {
  readExtensionWalletSnapshot,
  requestExtensionFaucet,
  sendExtensionQbt,
} from "../lib/extensionWalletRuntime";

declare const process: {
  env: Record<string, string | undefined>;
  stderr: { write(message: string): void };
  exit(code?: number): never;
};

const storage = new Map<string, unknown>();

function installChromeStorageShim() {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      local: {
        get(key: string | string[] | Record<string, unknown> | null, callback: (items: Record<string, unknown>) => void) {
          if (typeof key === "string") {
            callback({ [key]: storage.get(key) });
            return;
          }
          if (Array.isArray(key)) {
            callback(Object.fromEntries(key.map((item) => [item, storage.get(item)])));
            return;
          }
          if (key && typeof key === "object") {
            callback(Object.fromEntries(Object.keys(key).map((item) => [item, storage.get(item) ?? key[item]])));
            return;
          }
          callback(Object.fromEntries(storage.entries()));
        },
        set(items: Record<string, unknown>) {
          for (const [key, value] of Object.entries(items)) storage.set(key, value);
          return Promise.resolve();
        },
        remove(key: string | string[]) {
          for (const item of Array.isArray(key) ? key : [key]) storage.delete(item);
          return Promise.resolve();
        },
      },
    },
  };
}

function env(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertAcceptance(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  assertAcceptance(globalThis.crypto?.getRandomValues, "Web Crypto getRandomValues is unavailable.");
  installChromeStorageShim();

  const passcode = env("QUBITOR_EXTENSION_ACCEPTANCE_PASSCODE", "test-passcode-123");
  const recipient = env("QUBITOR_EXTENSION_ACCEPTANCE_TARGET", "0x000000000000000000000000000000000000dEaD") as Hex;
  const amount = env("QUBITOR_EXTENSION_ACCEPTANCE_AMOUNT_QBT", "0.001");

  let firstProfile = await createExtensionWalletProfile(passcode);
  let { snapshot: firstSnapshot } = await readExtensionWalletSnapshot(firstProfile, passcode);
  storage.set("qubitor:connections", { "https://bridge.example": { origin: "https://bridge.example" } });
  storage.set("qubitor:provider-pending.v1", { stale: { requestId: "stale" } });
  storage.set("qubitor:provider-responses.v1", { stale: { response: { result: [] } } });
  storage.set("qubitor:provider-diagnostics.v1", [{ event: "test" }]);
  await wipeExtensionWallet();
  assertAcceptance(!storage.has(EXTENSION_WALLET_STORAGE_KEY), "Wipe did not remove the encrypted wallet record.");
  assertAcceptance(!storage.has("qubitor:connections"), "Wipe did not remove connected-site approvals.");
  assertAcceptance(!storage.has("qubitor:provider-pending.v1"), "Wipe did not remove pending provider requests.");
  assertAcceptance(!storage.has("qubitor:provider-responses.v1"), "Wipe did not remove provider responses.");
  assertAcceptance(!storage.has("qubitor:provider-diagnostics.v1"), "Wipe did not remove provider diagnostics.");

  let profile = await createExtensionWalletProfile(passcode);
  let { profile: savedProfile, snapshot } = await readExtensionWalletSnapshot(profile, passcode);
  profile = savedProfile;

  assertAcceptance(snapshot.address.startsWith("0x"), "Extension did not derive a 0x Quanta Account address.");
  assertAcceptance(snapshot.chainId === 91338, `Expected Qubitor Testnet chain 91338, got ${snapshot.chainId}.`);
  assertAcceptance(
    snapshot.address.toLowerCase() !== firstSnapshot.address.toLowerCase(),
    "Creating after explicit wipe reused the previous Quanta Account address.",
  );

  const reopenedProfile = await unlockExtensionWalletProfile(passcode);
  const { snapshot: reopenedSnapshot } = await readExtensionWalletSnapshot(reopenedProfile, passcode);
  assertAcceptance(
    reopenedSnapshot.address.toLowerCase() === snapshot.address.toLowerCase(),
    "Unlocking an existing encrypted profile changed the Quanta Account address.",
  );

  const storedRecord = JSON.stringify(storage.get(EXTENSION_WALLET_STORAGE_KEY));
  assertAcceptance(!storedRecord.includes('"privateKey"'), "Encrypted wallet record exposes privateKey in plaintext.");
  assertAcceptance(!storedRecord.includes('"currentKey"'), "Encrypted wallet record exposes currentKey in plaintext.");
  assertAcceptance(!storedRecord.includes('"deploymentKey"'), "Encrypted wallet record exposes deploymentKey in plaintext.");

  const faucetReceipt = await requestExtensionFaucet(profile, passcode);

  for (let attempt = 0; attempt < 30; attempt++) {
    ({ profile: savedProfile, snapshot } = await readExtensionWalletSnapshot(profile, passcode));
    profile = savedProfile;
    if (snapshot.deployed && snapshot.balanceWei > 0n) break;
    await sleep(1000);
  }

  assertAcceptance(snapshot.deployed, "Faucet did not deploy the extension Quanta Account.");
  assertAcceptance(snapshot.balanceWei > 0n, "Faucet did not fund the extension Quanta Account.");

  const sendReceipt = await sendExtensionQbt(profile, passcode, { recipient, amount });
  assertAcceptance(sendReceipt.status === "success", "Extension PQ send did not succeed.");
  assertAcceptance(sendReceipt.transactionHash?.startsWith("0x"), "Extension PQ send did not return a tx hash.");

  const activity = await readExtensionActivity();
  assertAcceptance(activity.some((item) => item.hash === faucetReceipt.hash), "Faucet activity was not recorded.");
  assertAcceptance(activity.some((item) => item.hash === sendReceipt.transactionHash), "Send activity was not recorded.");

  ({ snapshot } = await readExtensionWalletSnapshot(profile, passcode));

  console.log(`[qubitor-extension-acceptance] account ${snapshot.address}`);
  console.log(`[qubitor-extension-acceptance] chain ${snapshot.chainName} (${snapshot.chainId})`);
  console.log(`[qubitor-extension-acceptance] balance ${snapshot.balanceLabel}`);
  console.log(`[qubitor-extension-acceptance] deployment ${snapshot.deploymentLabel} · ${snapshot.readinessLabel}`);
  console.log(`[qubitor-extension-acceptance] faucet tx ${faucetReceipt.hash}`);
  console.log(`[qubitor-extension-acceptance] pq transfer tx ${sendReceipt.transactionHash}`);
  console.log("[qubitor-extension-acceptance] encrypted vault check ok");
  console.log("[qubitor-extension-acceptance] ok");
}

main().catch((error) => {
  process.stderr.write(
    `[qubitor-extension-acceptance] ${
      error instanceof Error ? error.message : "extension acceptance failed"
    }\n`,
  );
  process.exit(1);
});
