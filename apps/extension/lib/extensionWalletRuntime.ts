import { getAddress, keccak256, type Hex } from "viem";
import {
  deployQubitorDevPQAccount,
  formatBalanceWei,
  generateMLDSA65KeyPair,
  parseNativeAmountToWei,
  readAccountSnapshot,
  readQubitorDevPQRotateAuthorization,
  readQubitorDevPQTransferAuthorization,
  requestQubitorDevnetFaucet,
  sendQubitorDevPQKeyRotation,
  sendQubitorDevPQTransfer,
  signQubitorPQAccountAuthorization,
} from "@qubitor/evm";
import {
  rememberExtensionAccount,
  readExtensionPQAccount,
  recordExtensionActivity,
  saveExtensionWalletProfile,
  type ExtensionPQWalletProfile,
} from "./extensionWalletVault";

export interface ExtensionWalletSnapshot {
  address: Hex;
  chainId: number;
  chainName: string;
  balanceWei: bigint;
  balanceLabel: string;
  deployed: boolean;
  deploymentLabel: "Undeployed" | "Deployed";
  readinessLabel: string;
  latestBlock: string;
  publicKeyCommitment?: Hex;
}

export async function readExtensionWalletSnapshot(
  profile: ExtensionPQWalletProfile,
  passcode: string,
): Promise<{ profile: ExtensionPQWalletProfile; snapshot: ExtensionWalletSnapshot }> {
  const pqAccount = await readExtensionPQAccount(profile);
  const savedProfile = await rememberExtensionAccount(profile, pqAccount, passcode);
  const accountSnapshot = await readAccountSnapshot(pqAccount.accountAddress, { chainId: pqAccount.chainId });
  return {
    profile: savedProfile,
    snapshot: {
      address: pqAccount.accountAddress,
      chainId: pqAccount.chainId,
      chainName: accountSnapshot.chainName,
      balanceWei: accountSnapshot.balanceWei,
      balanceLabel: `${formatBalanceWei(accountSnapshot.balanceWei)} ${accountSnapshot.nativeCurrencySymbol}`,
      deployed: accountSnapshot.deployed,
      deploymentLabel: accountSnapshot.deployed ? "Deployed" : "Undeployed",
      readinessLabel: accountSnapshot.qbt?.readiness?.securityMode ?? (accountSnapshot.deployed ? "PQ Native" : "PQ Native Pending Deployment"),
      latestBlock: accountSnapshot.latestBlock.toString(),
      publicKeyCommitment: savedProfile.currentPublicKeyCommitment ?? pqAccount.publicKeyCommitment,
    },
  };
}

export async function requestExtensionFaucet(profile: ExtensionPQWalletProfile, passcode: string) {
  const pqAccount = await readExtensionPQAccount(profile);
  const receipt = await requestQubitorDevnetFaucet(
    pqAccount.accountAddress,
    { chainId: pqAccount.chainId },
    { publicKey: profile.deploymentPublicKey, salt: pqAccount.salt, deployAccount: true },
  );
  await rememberExtensionAccount(profile, pqAccount, passcode);
  await recordExtensionActivity({
    type: "receive",
    title: "Faucet funded account",
    detail: `${formatBalanceWei(BigInt(receipt.amountWei))} QBT`,
    hash: receipt.hash,
    status: "success",
  });
  return receipt;
}

export async function deployExtensionAccount(profile: ExtensionPQWalletProfile, passcode: string) {
  const receipt = await deployQubitorDevPQAccount(
    { publicKey: profile.deploymentPublicKey, salt: profile.deploymentSalt },
    { chainId: profile.chainId },
  );
  const pqAccount = await readExtensionPQAccount(profile);
  await rememberExtensionAccount(profile, pqAccount, passcode);
  if (receipt.transactionHash) {
    await recordExtensionActivity({
      type: "security",
      title: "Quanta Account deployed",
      detail: "Smart account is active onchain",
      hash: receipt.transactionHash,
      status: "success",
    });
  }
  return receipt;
}

export async function sendExtensionQbt(
  profile: ExtensionPQWalletProfile,
  passcode: string,
  args: { recipient: string; amount: string },
) {
  const target = getAddress(args.recipient) as Hex;
  const valueWei = parseNativeAmountToWei(args.amount);
  return sendExtensionDappTransaction(profile, passcode, { target, valueWei });
}

export async function sendExtensionDappTransaction(
  profile: ExtensionPQWalletProfile,
  passcode: string,
  args: { target: Hex; valueWei: string | bigint; data?: Hex },
) {
  const target = getAddress(args.target) as Hex;
  const valueWei = BigInt(args.valueWei);
  let pqAccount = await readExtensionPQAccount(profile);
  if (!pqAccount.deployed) {
    await deployExtensionAccount(profile, passcode);
    pqAccount = await readExtensionPQAccount(profile);
  }
  const authorization = await readQubitorDevPQTransferAuthorization(
    {
      accountAddress: pqAccount.accountAddress,
      target,
      valueWei,
      data: args.data,
    },
    { chainId: pqAccount.chainId },
  );
  const signature = signQubitorPQAccountAuthorization(authorization.message, profile.currentKey.privateKey);
  const receipt = await sendQubitorDevPQTransfer(
    {
      accountAddress: pqAccount.accountAddress,
      target,
      valueWei,
      data: args.data,
      nonce: authorization.nonce,
      signature,
      publicKey: profile.deploymentKey.publicKey,
      privateKey: profile.deploymentKey.privateKey,
      salt: pqAccount.salt,
    },
    { chainId: pqAccount.chainId },
  );
  await rememberExtensionAccount(profile, pqAccount, passcode);
  await recordExtensionActivity({
    type: "send",
    title: valueWei > 0n ? `Sent ${formatBalanceWei(valueWei)} QBT` : "Submitted dapp transaction",
    detail: `To ${target.slice(0, 6)}...${target.slice(-4)}`,
    hash: receipt.transactionHash,
    status: receipt.status === "success" ? "success" : "failed",
  });
  return receipt;
}

export async function rotateExtensionPQKey(profile: ExtensionPQWalletProfile, passcode: string) {
  const pqAccount = await readExtensionPQAccount(profile);
  if (!pqAccount.deployed) throw new Error("Deploy the Quanta Account before rotating its PQ key.");
  const nextKey = generateMLDSA65KeyPair(globalThis.crypto.getRandomValues(new Uint8Array(32)));
  const authorization = await readQubitorDevPQRotateAuthorization(
    { accountAddress: pqAccount.accountAddress, newPublicKey: nextKey.publicKey },
    { chainId: pqAccount.chainId },
  );
  const signature = signQubitorPQAccountAuthorization(authorization.message, profile.currentKey.privateKey);
  const receipt = await sendQubitorDevPQKeyRotation(
    {
      accountAddress: pqAccount.accountAddress,
      newPublicKey: nextKey.publicKey,
      nonce: authorization.nonce,
      signature,
      publicKey: profile.deploymentKey.publicKey,
      privateKey: profile.deploymentKey.privateKey,
      salt: pqAccount.salt,
    },
    { chainId: pqAccount.chainId },
  );
  const nextProfile: ExtensionPQWalletProfile = {
    ...profile,
    currentKey: nextKey,
    currentPublicKeyCommitment: receipt.newPublicKeyCommitment ?? keccak256(nextKey.publicKey),
    keyVersion: profile.keyVersion + 1,
    lastRotationAt: new Date().toISOString(),
    lastRotationTransactionHash: receipt.transactionHash,
  };
  await saveExtensionWalletProfile(nextProfile, passcode);
  await recordExtensionActivity({
    type: "security",
    title: "PQ key rotated",
    detail: `ML-DSA key v${nextProfile.keyVersion} is active`,
    hash: receipt.transactionHash,
    status: receipt.status === "success" ? "success" : "failed",
  });
  return { receipt, profile: nextProfile };
}
