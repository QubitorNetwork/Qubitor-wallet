import type { Hex } from "@qubitor/core";
import {
  QUBITOR_DEVNET_CHAIN_ID,
  defaultQubitorFaucetUrl,
  defaultQubitorPQRelayerUrl,
  defaultQubitorRpcUrl,
  deployQubitorDevPQAccount,
  formatBalanceWei,
  generateMLDSA65KeyPair,
  isQubitorNetwork,
  readAccountSnapshot,
  readNativeBalance,
  readQubitorDevPQAccount,
  readQubitorDevPQTransferAuthorization,
  requestQubitorDevnetFaucet,
  sendQubitorDevPQTransfer,
  signQubitorPQAccountAuthorization,
  type AccountReadSnapshot,
  type EvmReadConfig,
  type MLDSA65KeyPair,
  type QubitorDevPQAccount,
  type QubitorDevPQAuthorization,
  type QubitorDevPQDeployReceipt,
  type QubitorDevPQTransferReceipt,
  type QubitorFaucetReceipt,
} from "@qubitor/evm";

export interface QubitorDevnetWalletFlowProfile {
  currentKey: MLDSA65KeyPair;
  deploymentKey?: MLDSA65KeyPair;
  deploymentPublicKey: Hex;
  deploymentSalt?: Hex;
}

export interface QubitorDevnetWalletDisplayState {
  address: Hex;
  chainId: number;
  chainName: string;
  nativeCurrencySymbol: string;
  balanceLabel: string;
  deploymentLabel: "Counterfactual" | "Deployed";
  readinessLabel: string;
  latestBlock: string;
}

export interface QubitorDevnetPQTransferFlowResult {
  pqAccount: QubitorDevPQAccount;
  authorization: QubitorDevPQAuthorization;
  signature: Hex;
  receipt: QubitorDevPQTransferReceipt;
}

export interface QubitorDevnetWalletAcceptanceConfig extends EvmReadConfig {
  target?: Hex;
  valueWei?: string | bigint;
  data?: Hex;
}

export interface QubitorDevnetWalletAcceptanceResult {
  profile: QubitorDevnetWalletFlowProfile;
  accountAddress: Hex;
  initialAccount: QubitorDevPQAccount;
  initialDisplay: QubitorDevnetWalletDisplayState;
  faucetReceipt: QubitorFaucetReceipt;
  deployReceipt: QubitorDevPQDeployReceipt;
  deployedAccount: QubitorDevPQAccount;
  deployedDisplay: QubitorDevnetWalletDisplayState;
  transfer: QubitorDevnetPQTransferFlowResult;
  finalAccount: QubitorDevPQAccount;
  finalDisplay: QubitorDevnetWalletDisplayState;
  targetDeltaWei: bigint;
}

function randomSeed() {
  const seed = new Uint8Array(32);
  const cryptoSource = globalThis.crypto;
  if (!cryptoSource?.getRandomValues) throw new Error("Web Crypto random source is unavailable.");
  cryptoSource.getRandomValues(seed);
  return seed;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertAcceptance(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function devnetConfig(config: QubitorDevnetWalletAcceptanceConfig = {}) {
  const chainId = config.chainId ?? QUBITOR_DEVNET_CHAIN_ID;
  return {
    chainId,
    rpcUrl: config.rpcUrl ?? defaultQubitorRpcUrl(chainId),
    faucetUrl: config.faucetUrl ?? defaultQubitorFaucetUrl(chainId),
    pqRelayerUrl: config.pqRelayerUrl ?? defaultQubitorPQRelayerUrl(chainId),
  };
}

export function createEphemeralQubitorDevnetWalletProfile(): QubitorDevnetWalletFlowProfile {
  const currentKey = generateMLDSA65KeyPair(randomSeed());
  return {
    currentKey,
    deploymentKey: currentKey,
    deploymentPublicKey: currentKey.publicKey,
  };
}

export function qubitorDevnetPQDeploymentRequest(profile: QubitorDevnetWalletFlowProfile) {
  return {
    publicKey: profile.deploymentPublicKey,
    salt: profile.deploymentSalt,
  };
}

export function qubitorDevnetPQNativeGasKey(profile: QubitorDevnetWalletFlowProfile): MLDSA65KeyPair {
  const gasKey = profile.deploymentKey ?? profile.currentKey;
  if (gasKey.publicKey.toLowerCase() !== profile.deploymentPublicKey.toLowerCase()) {
    throw new Error("Native PQ gas key is unavailable. Restore a wallet backup that includes the deployment key.");
  }
  return gasKey;
}

export function displayStateFromQubitorDevnetSnapshot(
  snapshot: AccountReadSnapshot,
): QubitorDevnetWalletDisplayState {
  const balance = formatBalanceWei(snapshot.balanceWei);
  return {
    address: snapshot.address,
    chainId: snapshot.chainId,
    chainName: snapshot.chainName,
    nativeCurrencySymbol: snapshot.nativeCurrencySymbol,
    balanceLabel: `${balance} ${snapshot.nativeCurrencySymbol}`,
    deploymentLabel: snapshot.deployed ? "Deployed" : "Counterfactual",
    readinessLabel:
      snapshot.qbt?.readiness?.securityMode ??
      snapshot.qbt?.securityMode?.mode ??
      (snapshot.deployed ? "PQ Native" : "PQ Native Pending Deployment"),
    latestBlock: snapshot.latestBlock.toString(),
  };
}

export async function readQubitorDevnetWalletDisplayState(
  address: Hex,
  config: Pick<EvmReadConfig, "chainId" | "rpcUrl"> = {},
) {
  const chainId = config.chainId ?? QUBITOR_DEVNET_CHAIN_ID;
  const snapshot = await readAccountSnapshot(address, {
    chainId,
    rpcUrl: config.rpcUrl ?? defaultQubitorRpcUrl(chainId),
  });
  return displayStateFromQubitorDevnetSnapshot(snapshot);
}

export async function waitForQubitorDevnetPQBalance(
  profile: QubitorDevnetWalletFlowProfile,
  minimumWei: string | bigint,
  config: Pick<EvmReadConfig, "chainId" | "pqRelayerUrl"> = {},
): Promise<QubitorDevPQAccount> {
  const min = BigInt(minimumWei);
  const chainId = config.chainId ?? QUBITOR_DEVNET_CHAIN_ID;
  let lastAccount: QubitorDevPQAccount | undefined;

  for (let attempt = 0; attempt < 30; attempt++) {
    lastAccount = await readQubitorDevPQAccount(qubitorDevnetPQDeploymentRequest(profile), {
      chainId,
      pqRelayerUrl: config.pqRelayerUrl ?? defaultQubitorPQRelayerUrl(chainId),
    });
    if (BigInt(lastAccount.balanceWei) >= min) return lastAccount;
    await sleep(1000);
  }

  throw new Error(
    `QBT balance did not reach ${min.toString()} wei. Last balance: ${lastAccount?.balanceWei ?? "unknown"} wei.`,
  );
}

export async function sendQubitorDevnetWalletPQTransfer(
  profile: QubitorDevnetWalletFlowProfile,
  config: Pick<EvmReadConfig, "chainId" | "rpcUrl" | "faucetUrl" | "pqRelayerUrl"> = {},
  args: { target?: Hex; valueWei?: string | bigint; data?: Hex } = {},
): Promise<QubitorDevnetPQTransferFlowResult> {
  const runtime = devnetConfig(config);
  const target = args.target ?? "0x000000000000000000000000000000000000dEaD";
  const valueWei = args.valueWei ?? "1000000000000000";
  const data = args.data ?? "0x";
  let pqAccount = await readQubitorDevPQAccount(qubitorDevnetPQDeploymentRequest(profile), {
    chainId: runtime.chainId,
    pqRelayerUrl: runtime.pqRelayerUrl,
  });
  const accountAddress = pqAccount.accountAddress;

  if (!pqAccount.deployed) {
    await deployQubitorDevPQAccount(qubitorDevnetPQDeploymentRequest(profile), {
      chainId: runtime.chainId,
      faucetUrl: runtime.faucetUrl,
      pqRelayerUrl: runtime.pqRelayerUrl,
    });
    pqAccount = await readQubitorDevPQAccount(qubitorDevnetPQDeploymentRequest(profile), {
      chainId: runtime.chainId,
      pqRelayerUrl: runtime.pqRelayerUrl,
    });
  }

  if (BigInt(pqAccount.balanceWei) < BigInt(valueWei)) {
    throw new Error(
      `Insufficient QBT balance. Need ${BigInt(valueWei).toString()} wei, have ${pqAccount.balanceWei} wei.`,
    );
  }

  const gasKey = qubitorDevnetPQNativeGasKey(profile);
  const authorization = await readQubitorDevPQTransferAuthorization(
    {
      accountAddress,
      target,
      valueWei,
      data,
    },
    { chainId: runtime.chainId, rpcUrl: runtime.rpcUrl },
  );
  const signature = signQubitorPQAccountAuthorization(authorization.message, profile.currentKey.privateKey);
  const receipt = await sendQubitorDevPQTransfer(
    {
      accountAddress,
      publicKey: gasKey.publicKey,
      privateKey: gasKey.privateKey,
      salt: pqAccount.salt,
      target,
      valueWei,
      data,
      nonce: authorization.nonce,
      signature,
    },
    { chainId: runtime.chainId, rpcUrl: runtime.rpcUrl, pqRelayerUrl: runtime.pqRelayerUrl },
  );

  return {
    pqAccount: { ...pqAccount, deployed: true },
    authorization,
    signature,
    receipt,
  };
}

export async function runQubitorDevnetWalletAcceptance(
  config: QubitorDevnetWalletAcceptanceConfig = {},
): Promise<QubitorDevnetWalletAcceptanceResult> {
  const runtime = devnetConfig(config);
  const valueWei = config.valueWei ?? "77777";
  const target = config.target ?? "0x000000000000000000000000000000000000dEaD";
  const data = config.data ?? "0x";

  assertAcceptance(isQubitorNetwork(runtime.chainId), "Mobile acceptance requires a Qubitor PQ-native network.");

  const profile = createEphemeralQubitorDevnetWalletProfile();
  const initialAccount = await readQubitorDevPQAccount(qubitorDevnetPQDeploymentRequest(profile), {
    chainId: runtime.chainId,
    pqRelayerUrl: runtime.pqRelayerUrl,
  });
  const initialDisplay = await readQubitorDevnetWalletDisplayState(initialAccount.accountAddress, runtime);

  assertAcceptance(
    initialAccount.chainId === runtime.chainId,
    `Wallet connected to chain ID ${initialAccount.chainId}, expected ${runtime.chainId}.`,
  );
  assertAcceptance(initialDisplay.nativeCurrencySymbol === "QBT", "Wallet did not show QBT as the gas coin.");
  assertAcceptance(
    initialDisplay.readinessLabel.includes("PQ Native"),
    `Wallet did not show PQ Native readiness before deployment: ${initialDisplay.readinessLabel}`,
  );

  const deploymentRequest = qubitorDevnetPQDeploymentRequest(profile);
  const faucetReceipt = await requestQubitorDevnetFaucet(
    initialAccount.accountAddress,
    {
      chainId: runtime.chainId,
      faucetUrl: runtime.faucetUrl,
    },
    { publicKey: deploymentRequest.publicKey, salt: initialAccount.salt, deployAccount: true },
  );
  await waitForQubitorDevnetPQBalance(profile, valueWei, {
    chainId: runtime.chainId,
    pqRelayerUrl: runtime.pqRelayerUrl,
  });

  const rawDeployReceipt = await deployQubitorDevPQAccount(deploymentRequest, {
    chainId: runtime.chainId,
    faucetUrl: runtime.faucetUrl,
    pqRelayerUrl: runtime.pqRelayerUrl,
  });
  const deployReceipt: QubitorDevPQDeployReceipt = {
    ...rawDeployReceipt,
    transactionHash: rawDeployReceipt.transactionHash ?? faucetReceipt.deploymentTransactionHash,
    faucetTransactionHash: rawDeployReceipt.faucetTransactionHash ?? faucetReceipt.hash,
    deploymentBlockNumber: rawDeployReceipt.deploymentBlockNumber ?? faucetReceipt.deploymentBlockNumber,
  };
  const deployedAccount = await readQubitorDevPQAccount(qubitorDevnetPQDeploymentRequest(profile), {
    chainId: runtime.chainId,
    pqRelayerUrl: runtime.pqRelayerUrl,
  });
  const deployedDisplay = await readQubitorDevnetWalletDisplayState(deployedAccount.accountAddress, runtime);

  assertAcceptance(deployedAccount.deployed, "Wallet account was not deployed.");
  assertAcceptance(deployedDisplay.deploymentLabel === "Deployed", "Wallet did not show deployed state.");
  assertAcceptance(deployedDisplay.readinessLabel === "PQ Native", "Wallet did not show PQ Native after deployment.");

  const startTargetBalance = await readNativeBalance(target, runtime);
  const transfer = await sendQubitorDevnetWalletPQTransfer(profile, runtime, { target, valueWei, data });
  const finalAccount = await readQubitorDevPQAccount(qubitorDevnetPQDeploymentRequest(profile), {
    chainId: runtime.chainId,
    pqRelayerUrl: runtime.pqRelayerUrl,
  });
  const finalDisplay = await readQubitorDevnetWalletDisplayState(finalAccount.accountAddress, runtime);
  const endTargetBalance = await readNativeBalance(target, runtime);
  const targetDeltaWei = endTargetBalance - startTargetBalance;

  assertAcceptance(transfer.receipt.status === "success", "Wallet PQ transfer did not succeed.");
  assertAcceptance(finalAccount.nonce === "1", `Expected account nonce 1, got ${finalAccount.nonce}.`);
  assertAcceptance(targetDeltaWei >= BigInt(valueWei), "Wallet PQ transfer did not move the requested QBT value.");

  return {
    profile,
    accountAddress: finalAccount.accountAddress,
    initialAccount,
    initialDisplay,
    faucetReceipt,
    deployReceipt,
    deployedAccount,
    deployedDisplay,
    transfer,
    finalAccount,
    finalDisplay,
    targetDeltaWei,
  };
}
