import { randomBytes } from "node:crypto";
import type { Hex } from "@qubitor/core";
import {
  QUBITOR_DEVNET_CHAIN_ID,
  QUBITOR_ZERO_HASH,
  defaultQubitorFaucetUrl,
  defaultQubitorPQRelayerUrl,
  defaultQubitorRpcUrl,
  generateMLDSA65KeyPair,
  isQubitorNetwork,
  readNativeBalance,
  readQubitorDevPQAccount,
  readQubitorDevPQRotateAuthorization,
  readQubitorDevPQTransferAuthorization,
  requestQubitorDevnetFaucet,
  sendQubitorDevPQKeyRotation,
  sendQubitorDevPQTransfer,
  signQubitorPQAccountAuthorization,
} from "@qubitor/evm";
import { verifyMLDSA65 } from "@qubitor/pq-crypto";

declare const process: {
  env: Record<string, string | undefined>;
  stderr: { write(message: string): void };
  exit(code?: number): never;
};

function env(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}

function bytesToHex(bytes: Uint8Array): Hex {
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertAcceptance(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function waitForAccountReady(args: {
  publicKey: Hex;
  salt: Hex;
  minimumWei: bigint;
  pqRelayerUrl: string;
}) {
  let lastBalance = "unknown";
  for (let attempt = 0; attempt < 30; attempt++) {
    const account = await readQubitorDevPQAccount(
      { publicKey: args.publicKey, salt: args.salt },
      { pqRelayerUrl: args.pqRelayerUrl },
    );
    lastBalance = account.balanceWei;
    if (account.deployed && BigInt(account.balanceWei) >= args.minimumWei) return account;
    await sleep(1000);
  }

  throw new Error(`PQ account was not ready. Last balance: ${lastBalance} wei.`);
}

async function main() {
  const chainId = Number(env("EXPO_PUBLIC_QUBITOR_CHAIN_ID", String(QUBITOR_DEVNET_CHAIN_ID)));
  const rpcUrl = env("EXPO_PUBLIC_QUBITOR_RPC_URL", defaultQubitorRpcUrl(chainId));
  const faucetUrl = env("EXPO_PUBLIC_QUBITOR_FAUCET_URL", defaultQubitorFaucetUrl(chainId));
  const pqRelayerUrl = env("EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL", defaultQubitorPQRelayerUrl(chainId));
  const target = env("QUBITOR_MOBILE_ROTATE_ACCEPTANCE_TARGET", "0x000000000000000000000000000000000000dEaD") as Hex;
  const valueWei = BigInt(env("QUBITOR_MOBILE_ROTATE_ACCEPTANCE_VALUE_WEI", "54321"));
  const salt = bytesToHex(randomBytes(32));

  assertAcceptance(isQubitorNetwork(chainId), "Rotation acceptance requires a supported Qubitor network.");

  const keyA = generateMLDSA65KeyPair(randomBytes(32));
  const keyB = generateMLDSA65KeyPair(randomBytes(32));
  const initialAccount = await readQubitorDevPQAccount({ publicKey: keyA.publicKey, salt }, { pqRelayerUrl });

  await requestQubitorDevnetFaucet(
    initialAccount.accountAddress,
    { faucetUrl },
    { publicKey: keyA.publicKey, salt, deployAccount: true },
  );

  const deployedAccount = await waitForAccountReady({
    publicKey: keyA.publicKey,
    salt,
    minimumWei: valueWei,
    pqRelayerUrl,
  });
  const startTargetBalance = await readNativeBalance(target, { chainId, rpcUrl });

  const rotationAuthorization = await readQubitorDevPQRotateAuthorization(
    { accountAddress: deployedAccount.accountAddress, newPublicKey: keyB.publicKey },
    { chainId, rpcUrl },
  );
  const rotationSignature = signQubitorPQAccountAuthorization(rotationAuthorization.message, keyA.privateKey);
  assertAcceptance(
    verifyMLDSA65(rotationSignature, rotationAuthorization.message, keyA.publicKey),
    "Initial key failed to verify the rotation authorization.",
  );

  const rotationReceipt = await sendQubitorDevPQKeyRotation(
    {
      accountAddress: deployedAccount.accountAddress,
      newPublicKey: keyB.publicKey,
      nonce: rotationAuthorization.nonce,
      signature: rotationSignature,
      publicKey: keyA.publicKey,
      privateKey: keyA.privateKey,
      salt,
    },
    { chainId, rpcUrl, pqRelayerUrl },
  );
  assertAcceptance(rotationReceipt.status === "success", "PQ key rotation did not succeed.");

  const transferAuthorization = await readQubitorDevPQTransferAuthorization(
    { accountAddress: deployedAccount.accountAddress, target, valueWei },
    { chainId, rpcUrl },
  );
  const oldKeySignature = signQubitorPQAccountAuthorization(transferAuthorization.message, keyA.privateKey);
  let oldKeyRejected = false;
  try {
    await sendQubitorDevPQTransfer(
      {
        accountAddress: deployedAccount.accountAddress,
        target,
        valueWei,
        nonce: transferAuthorization.nonce,
        signature: oldKeySignature,
        publicKey: keyA.publicKey,
        privateKey: keyA.privateKey,
        salt,
      },
      { chainId, rpcUrl, pqRelayerUrl },
    );
  } catch {
    oldKeyRejected = true;
  }
  assertAcceptance(oldKeyRejected, "Old key moved funds after rotation.");

  const newKeySignature = signQubitorPQAccountAuthorization(transferAuthorization.message, keyB.privateKey);
  assertAcceptance(
    verifyMLDSA65(newKeySignature, transferAuthorization.message, keyB.publicKey),
    "Replacement key failed to verify the transfer authorization.",
  );
  const transferReceipt = await sendQubitorDevPQTransfer(
    {
      accountAddress: deployedAccount.accountAddress,
      target,
      valueWei,
      nonce: transferAuthorization.nonce,
      signature: newKeySignature,
      publicKey: keyA.publicKey,
      privateKey: keyA.privateKey,
      salt,
    },
    { chainId, rpcUrl, pqRelayerUrl },
  );
  assertAcceptance(transferReceipt.status === "success", "Replacement key transfer did not succeed.");

  const finalAccount = await readQubitorDevPQAccount({ publicKey: keyA.publicKey, salt }, { pqRelayerUrl });
  const endTargetBalance = await readNativeBalance(target, { chainId, rpcUrl });
  const targetDeltaWei = endTargetBalance - startTargetBalance;

  assertAcceptance(finalAccount.nonce === "2", `Expected account nonce 2, got ${finalAccount.nonce}.`);
  assertAcceptance(targetDeltaWei >= valueWei, "Replacement key transfer did not move the requested QBT value.");
  assertAcceptance(QUBITOR_ZERO_HASH !== salt, "Rotation acceptance generated an invalid salt.");

  console.log(`[qubitor-mobile-rotate-acceptance] account ${finalAccount.accountAddress}`);
  console.log(`[qubitor-mobile-rotate-acceptance] rotate tx ${rotationReceipt.transactionHash}`);
  console.log(`[qubitor-mobile-rotate-acceptance] pq transfer tx ${transferReceipt.transactionHash}`);
  console.log(`[qubitor-mobile-rotate-acceptance] nonce ${finalAccount.nonce}`);
  console.log(`[qubitor-mobile-rotate-acceptance] target delta ${targetDeltaWei.toString()} wei`);
  console.log("[qubitor-mobile-rotate-acceptance] ok");
}

main().catch((error) => {
  process.stderr.write(
    `[qubitor-mobile-rotate-acceptance] ${
      error instanceof Error ? error.message : "mobile rotation acceptance failed"
    }\n`,
  );
  process.exit(1);
});
