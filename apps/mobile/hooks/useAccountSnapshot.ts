import { useCallback, useEffect, useMemo, useState } from "react";
import type { Hex, QubitorAccount, SecurityMode } from "@qubitor/core";
import {
  deployQubitorDevPQAccount,
  defaultQubitorFaucetUrl,
  defaultQubitorPQRelayerUrl,
  defaultQubitorRpcUrl,
  formatBalanceWei,
  isQubitorNetwork,
  QUBITOR_TESTNET_CHAIN_ID,
  readAccountSnapshot,
  readQubitorDevPQAccount,
  readQubitorDevPQRotateAuthorization,
  requestQubitorDevnetFaucet,
  sendQubitorDevPQKeyRotation,
  signQubitorPQAccountAuthorization,
  simulateQubitorTransfer,
  supportedChainId,
  type AccountReadSnapshot,
  type QubitorDevPQAccount,
  type QubitorDevPQDeployReceipt,
  type QubitorDevPQRotationReceipt,
  type QubitorDevPQTransferReceipt,
  type QubitorFaucetReceipt,
} from "@qubitor/evm";
import type { ActivityItem, TokenItem } from "@/lib/runtimeTypes";
import {
  generateQubitorDevPQKey,
  getUnlockedWalletProfile,
  getWalletBootStateForAnyChain,
  getWalletPreview,
  rememberQubitorDevPQDeployment,
  requireUnlockedWalletProfile,
  rotateStoredQubitorDevPQKey,
  type QubitorDevPQWalletProfile,
  type QubitorWalletPreview,
  type WalletBootState,
} from "@/lib/pqDevWallet";
import {
  qubitorDevnetPQNativeGasKey,
  sendQubitorDevnetWalletPQTransfer,
} from "@/lib/qbtDevnetWalletFlow";
import { configuredQubitorChainId, readPublicEnv } from "@/lib/runtimeConfig";
import { readWalletActivity, recordWalletActivity, type WalletActivityItem } from "@/lib/walletActivity";
import { getSelectedChainId, setSelectedChainId, type SelectableChainId } from "@/lib/networkPreference";

type SnapshotStatus = "loading" | "live" | "fallback";
type FaucetStatus = "idle" | "requesting" | "success" | "error";
type PQActionStatus = "idle" | "requesting" | "success" | "error";
type RuntimeWalletStatus = WalletBootState["status"];

const PLACEHOLDER_ADDRESS = "0x0000000000000000000000000000000000000000" as Hex;

interface SnapshotState {
  status: SnapshotStatus;
  walletStatus: RuntimeWalletStatus;
  walletPreview?: QubitorWalletPreview;
  faucetStatus: FaucetStatus;
  deployStatus: PQActionStatus;
  pqTxStatus: PQActionStatus;
  pqRotateStatus: PQActionStatus;
  account: QubitorAccount;
  accountReady: boolean;
  activeAddress?: Hex;
  balanceWei?: bigint;
  balanceNative: string;
  balanceLabel: string;
  balanceUsd: string;
  tokens: TokenItem[];
  activity: (WalletActivityItem | ActivityItem)[];
  chainName: string;
  nativeCurrencySymbol: string;
  deploymentLabel: string;
  readinessLabel: string;
  latestBlock?: string;
  rpcUrl?: string;
  pqAccount?: QubitorDevPQAccount;
  pqProfile?: QubitorDevPQWalletProfile;
  pqCurrentPublicKeyCommitment?: Hex;
  error?: string;
  faucetError?: string;
  faucetReceipt?: QubitorFaucetReceipt;
  deployError?: string;
  deployReceipt?: QubitorDevPQDeployReceipt;
  pqTxError?: string;
  pqTxReceipt?: QubitorDevPQTransferReceipt;
  pqRotateError?: string;
  pqRotateReceipt?: QubitorDevPQRotationReceipt;
}

function explicitConfiguredAccountAddress(): Hex | undefined {
  const configured = readPublicEnv("EXPO_PUBLIC_QUBITOR_ACCOUNT_ADDRESS");
  return configured?.startsWith("0x") ? (configured as Hex) : undefined;
}

function configuredChainId() {
  return configuredQubitorChainId();
}

function configuredFaucetUrl() {
  return readPublicEnv("EXPO_PUBLIC_QUBITOR_FAUCET_URL");
}

function configuredPQRelayerUrl() {
  return readPublicEnv("EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL");
}

function buildAccount(chainId: number, address: Hex, deployed = false, mode: SecurityMode = "PQ Native"): QubitorAccount {
  return {
    label: "Quanta Account",
    address,
    chainId,
    deployed,
    security: {
      mode,
      recovery: mode === "PQ Native" ? "active" : "missing",
      rotationRecommended: false,
      pqLayerEnabled: mode === "PQ Native" || mode === "PQ Ready" || mode === "Hybrid Protected",
    },
  };
}

function securityModeFromReadiness(snapshot: AccountReadSnapshot): SecurityMode {
  const mode = snapshot.qbt?.readiness?.securityMode ?? snapshot.qbt?.securityMode?.mode;
  if (isQubitorNetwork(snapshot.chainId) && !snapshot.deployed) return "PQ Native";
  if (
    mode === "Smart Account Ready" ||
    mode === "Hybrid Protected" ||
    mode === "PQ Ready" ||
    mode === "PQ Native" ||
    mode === "Legacy" ||
    mode === "Compatibility Mode"
  ) {
    return mode;
  }
  return isQubitorNetwork(snapshot.chainId) ? "PQ Native" : "Compatibility Mode";
}

function tokenForNative(snapshot: AccountReadSnapshot, balanceNative: string): TokenItem[] {
  return [
    {
      symbol: snapshot.nativeCurrencySymbol,
      name: snapshot.chainName,
      balance: balanceNative,
      fiatValue: "Live RPC",
    },
  ];
}

function emptyState(chainId = QUBITOR_TESTNET_CHAIN_ID, preview?: QubitorWalletPreview, error?: string): SnapshotState {
  const address = preview?.accountAddress ?? explicitConfiguredAccountAddress() ?? PLACEHOLDER_ADDRESS;
  return {
    status: error ? "fallback" : "loading",
    walletStatus: preview ? "read-only-ready" : "no-wallet",
    walletPreview: preview,
    faucetStatus: "idle",
    deployStatus: "idle",
    pqTxStatus: "idle",
    pqRotateStatus: "idle",
    account: buildAccount(chainId, address),
    accountReady: Boolean(preview || explicitConfiguredAccountAddress()),
    activeAddress: preview?.accountAddress ?? explicitConfiguredAccountAddress(),
    balanceWei: undefined,
    balanceNative: "0.0000",
    balanceLabel: "— QBT",
    balanceUsd: "— QBT",
    tokens: [],
    activity: [],
    chainName: "Qubitor Testnet",
    nativeCurrencySymbol: "QBT",
    deploymentLabel: preview ? "Counterfactual" : "No wallet",
    readinessLabel: preview ? "PQ Native Pending Deployment" : "No wallet",
    error,
  };
}

function buildLiveState(
  snapshot: AccountReadSnapshot,
  preview?: QubitorWalletPreview,
  pqAccount?: QubitorDevPQAccount,
  pqProfile?: QubitorDevPQWalletProfile,
): SnapshotState {
  const balanceNative = formatBalanceWei(snapshot.balanceWei);
  const securityMode = securityModeFromReadiness(snapshot);
  const pqCurrentPublicKeyCommitment =
    snapshot.qbt?.readiness?.readiness?.pqPublicKeyCommitment ??
    pqProfile?.currentPublicKeyCommitment ??
    preview?.currentPublicKeyCommitment ??
    pqAccount?.publicKeyCommitment;
  const account = buildAccount(snapshot.chainId, snapshot.address, snapshot.deployed, securityMode);

  return {
    status: "live",
    walletStatus: pqProfile ? "unlocked" : preview ? "read-only-ready" : "no-wallet",
    walletPreview: preview,
    faucetStatus: "idle",
    deployStatus: "idle",
    pqTxStatus: "idle",
    pqRotateStatus: "idle",
    account,
    accountReady: true,
    activeAddress: snapshot.address,
    balanceWei: snapshot.balanceWei,
    balanceNative,
    balanceLabel: `${balanceNative} ${snapshot.nativeCurrencySymbol}`,
    balanceUsd: `${balanceNative} ${snapshot.nativeCurrencySymbol}`,
    chainName: snapshot.chainName,
    nativeCurrencySymbol: snapshot.nativeCurrencySymbol,
    deploymentLabel: snapshot.deployed ? "Deployed" : "Counterfactual",
    readinessLabel:
      snapshot.qbt?.readiness?.securityMode ??
      snapshot.qbt?.securityMode?.mode ??
      (snapshot.deployed ? "PQ Native" : "PQ Native Pending Deployment"),
    latestBlock: snapshot.latestBlock.toString(),
    rpcUrl: snapshot.rpcUrl,
    pqAccount,
    pqProfile,
    pqCurrentPublicKeyCommitment,
    activity: [],
    tokens: tokenForNative(snapshot, balanceNative),
  };
}

function deploymentRequestFromPreview(preview: QubitorWalletPreview) {
  return {
    publicKey: preview.deploymentPublicKey,
    salt: preview.deploymentSalt,
  };
}

function mergeActionState(nextState: SnapshotState, current: SnapshotState): SnapshotState {
  return {
    ...nextState,
    faucetStatus: current.faucetStatus === "requesting" ? "idle" : current.faucetStatus,
    faucetReceipt: current.faucetReceipt,
    deployStatus: current.deployStatus === "requesting" ? "idle" : current.deployStatus,
    deployReceipt: current.deployReceipt,
    pqTxStatus: current.pqTxStatus === "requesting" ? "idle" : current.pqTxStatus,
    pqTxReceipt: current.pqTxReceipt,
    pqRotateStatus: current.pqRotateStatus === "requesting" ? "idle" : current.pqRotateStatus,
    pqRotateReceipt: current.pqRotateReceipt,
  };
}

export function useAccountSnapshot() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<SnapshotState>(() => emptyState());
  const [chainOverride, setChainOverride] = useState<number | undefined>();

  useEffect(() => {
    let active = true;
    getSelectedChainId()
      .then(async (selected) => {
        if (!active) return;
        const envChainId = configuredChainId();
        const preferred = selected ?? envChainId;
        const bootState = await getWalletBootStateForAnyChain(preferred);
        if (!active) return;
        if (bootState.status !== "no-wallet" && bootState.status !== "error") {
          if (bootState.chainId !== envChainId) setChainOverride(bootState.chainId);
          else if (selected !== undefined && selected !== envChainId) await setSelectedChainId(envChainId as SelectableChainId);
          return;
        }
        if (selected !== undefined && selected !== envChainId) setChainOverride(selected);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const config = useMemo(() => {
    const envChainId = configuredChainId();
    if (chainOverride === undefined || chainOverride === envChainId) {
      return {
        chainId: envChainId,
        rpcUrl: readPublicEnv("EXPO_PUBLIC_QUBITOR_RPC_URL"),
        faucetUrl: configuredFaucetUrl(),
        pqRelayerUrl: configuredPQRelayerUrl(),
      };
    }
    const chainId = supportedChainId(chainOverride);
    return {
      chainId,
      rpcUrl: defaultQubitorRpcUrl(chainId),
      faucetUrl: defaultQubitorFaucetUrl(chainId),
      pqRelayerUrl: defaultQubitorPQRelayerUrl(chainId),
    };
  }, [chainOverride]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  const setChain = useCallback(async (chainId: number) => {
    const next = supportedChainId(chainId);
    await setSelectedChainId(next as SelectableChainId);
    setChainOverride(next);
    setReloadKey((key) => key + 1);
  }, []);

  const simulateTransfer = useCallback(
    async (args: { to: Hex; valueWei: bigint; data?: Hex }) => {
      if (!state.activeAddress) throw new Error("No Quanta Account is available.");
      return simulateQubitorTransfer(
        { from: state.activeAddress, to: args.to, valueWei: args.valueWei, data: args.data },
        { chainId: config.chainId, rpcUrl: config.rpcUrl },
      );
    },
    [config.chainId, config.rpcUrl, state.activeAddress],
  );

  const requestFaucet = useCallback(async () => {
    if (!isQubitorNetwork(config.chainId)) {
      setState((current) => ({
        ...current,
        faucetStatus: "error",
        faucetError: "Faucet is only available on Qubitor PQ-native networks.",
      }));
      return;
    }

    setState((current) => ({ ...current, faucetStatus: "requesting", faucetError: undefined }));
    try {
      const preview = await getWalletPreview(config.chainId);
      if (!preview) throw new Error("Create or restore a Quanta Account before requesting faucet funds.");
      const faucetReceipt = await requestQubitorDevnetFaucet(
        preview.accountAddress,
        { chainId: config.chainId, faucetUrl: config.faucetUrl },
        { publicKey: preview.deploymentPublicKey, salt: preview.deploymentSalt, deployAccount: true },
      );
      await rememberQubitorDevPQDeployment({
        chainId: config.chainId,
        accountAddress: preview.accountAddress,
        deploymentPublicKey: preview.deploymentPublicKey,
        deploymentSalt: preview.deploymentSalt,
        currentPublicKeyCommitment: preview.currentPublicKeyCommitment,
      }).catch(() => undefined);
      await recordWalletActivity(
        { chainId: config.chainId, accountAddress: preview.accountAddress },
        {
          type: "receive",
          title: "Faucet funded account",
          detail: `${formatBalanceWei(BigInt(faucetReceipt.amountWei))} QBT`,
          badge: "PQ Native",
          hash: faucetReceipt.hash,
          to: preview.accountAddress,
          asset: "QBT",
          amountLabel: `${formatBalanceWei(BigInt(faucetReceipt.amountWei))} QBT`,
          security: faucetReceipt.signerMode ?? "PQ Native",
          status: "success",
        },
      );
      setState((current) => ({ ...current, faucetStatus: "success", faucetReceipt }));
      setReloadKey((key) => key + 1);
    } catch (error) {
      setState((current) => ({
        ...current,
        faucetStatus: "error",
        faucetError: error instanceof Error ? error.message : "Faucet request failed.",
      }));
    }
  }, [config.chainId, config.faucetUrl]);

  const deployPQAccount = useCallback(async () => {
    if (!isQubitorNetwork(config.chainId)) {
      setState((current) => ({
        ...current,
        deployStatus: "error",
        deployError: "PQ account deployment is only available on Qubitor PQ-native networks.",
      }));
      return;
    }

    setState((current) => ({ ...current, deployStatus: "requesting", deployError: undefined }));
    try {
      const preview = await getWalletPreview(config.chainId);
      if (!preview) throw new Error("Create or restore a Quanta Account before deploying.");
      const deployReceipt = await deployQubitorDevPQAccount(deploymentRequestFromPreview(preview), {
        chainId: config.chainId,
        faucetUrl: config.faucetUrl,
        pqRelayerUrl: config.pqRelayerUrl,
      });
      await rememberQubitorDevPQDeployment({
        chainId: config.chainId,
        accountAddress: deployReceipt.accountAddress,
        deploymentPublicKey: preview.deploymentPublicKey,
        deploymentSalt: preview.deploymentSalt,
      }).catch(() => undefined);
      if (deployReceipt.transactionHash) {
        await recordWalletActivity(
          { chainId: config.chainId, accountAddress: deployReceipt.accountAddress },
          {
            type: "security",
            title: "Qubitor Account deployed",
            detail: "Smart account is active onchain",
            badge: "PQ Native",
            hash: deployReceipt.transactionHash,
            security: "Account deployment",
            status: "success",
          },
        );
      }
      setState((current) => ({ ...current, deployStatus: "success", deployReceipt }));
      setReloadKey((key) => key + 1);
    } catch (error) {
      setState((current) => ({
        ...current,
        deployStatus: "error",
        deployError: error instanceof Error ? error.message : "PQ account deployment failed.",
      }));
    }
  }, [config.chainId, config.faucetUrl, config.pqRelayerUrl]);

  const sendPQTransfer = useCallback(
    async (args?: { target?: Hex; valueWei?: string | bigint; data?: Hex }) => {
      if (!isQubitorNetwork(config.chainId)) {
        const pqError = new Error("PQ transfer is only available on Qubitor PQ-native networks.");
        setState((current) => ({ ...current, pqTxStatus: "error", pqTxError: pqError.message }));
        throw pqError;
      }
      if (!args?.target || args.valueWei === undefined) {
        const pqError = new Error("Recipient and amount are required before signing.");
        setState((current) => ({ ...current, pqTxStatus: "error", pqTxError: pqError.message }));
        throw pqError;
      }

      setState((current) => ({ ...current, pqTxStatus: "requesting", pqTxError: undefined }));
      try {
        const pqProfile = requireUnlockedWalletProfile(config.chainId);
        const pqAccount = await readQubitorDevPQAccount(
          {
            publicKey: pqProfile.deploymentPublicKey,
            salt: pqProfile.deploymentSalt,
          },
          { chainId: config.chainId, pqRelayerUrl: config.pqRelayerUrl },
        );
        await rememberQubitorDevPQDeployment({
          chainId: config.chainId,
          accountAddress: pqAccount.accountAddress,
          deploymentPublicKey: pqProfile.deploymentPublicKey,
          deploymentSalt: pqAccount.salt,
          currentPublicKeyCommitment: pqProfile.currentPublicKeyCommitment ?? pqAccount.publicKeyCommitment,
        });
        const transfer = await sendQubitorDevnetWalletPQTransfer(
          pqProfile,
          { chainId: config.chainId, rpcUrl: config.rpcUrl, faucetUrl: config.faucetUrl, pqRelayerUrl: config.pqRelayerUrl },
          { target: args.target, valueWei: args.valueWei, data: args.data ?? "0x" },
        );
        const pqTxReceipt = transfer.receipt;
        await recordWalletActivity(
          { chainId: config.chainId, accountAddress: pqTxReceipt.accountAddress },
          {
            type: "send",
            title: `Sent ${formatBalanceWei(BigInt(pqTxReceipt.valueWei))} QBT`,
            detail: `To ${pqTxReceipt.target.slice(0, 6)}...${pqTxReceipt.target.slice(-4)}`,
            badge: "PQ Native",
            hash: pqTxReceipt.transactionHash,
            from: pqTxReceipt.accountAddress,
            to: pqTxReceipt.target,
            asset: "QBT",
            amountLabel: `${formatBalanceWei(BigInt(pqTxReceipt.valueWei))} QBT`,
            fee: "QBT gas",
            security: pqTxReceipt.signerMode ?? "ML-DSA PQ signature",
            status: pqTxReceipt.status === "success" ? "success" : "failed",
          },
        );
        setState((current) => ({ ...current, pqTxStatus: "success", pqTxReceipt }));
        setReloadKey((key) => key + 1);
        return pqTxReceipt;
      } catch (error) {
        setState((current) => ({
          ...current,
          pqTxStatus: "error",
          pqTxError: error instanceof Error ? error.message : "PQ transfer failed.",
        }));
        throw error;
      }
    },
    [config.chainId, config.faucetUrl, config.pqRelayerUrl, config.rpcUrl],
  );

  const rotatePQKey = useCallback(async () => {
    if (!isQubitorNetwork(config.chainId)) {
      const pqError = new Error("PQ key rotation is only available on Qubitor PQ-native networks.");
      setState((current) => ({ ...current, pqRotateStatus: "error", pqRotateError: pqError.message }));
      throw pqError;
    }

    setState((current) => ({ ...current, pqRotateStatus: "requesting", pqRotateError: undefined }));
    try {
      const pqProfile = requireUnlockedWalletProfile(config.chainId);
      const pqAccount = await readQubitorDevPQAccount(
        {
          publicKey: pqProfile.deploymentPublicKey,
          salt: pqProfile.deploymentSalt,
        },
        { chainId: config.chainId, pqRelayerUrl: config.pqRelayerUrl },
      );
      if (!pqAccount.deployed) throw new Error("Deploy the Qubitor Account before rotating its PQ key.");

      const nextKey = await generateQubitorDevPQKey();
      const gasKey = qubitorDevnetPQNativeGasKey(pqProfile);
      const authorization = await readQubitorDevPQRotateAuthorization(
        { accountAddress: pqAccount.accountAddress, newPublicKey: nextKey.publicKey },
        { chainId: config.chainId, rpcUrl: config.rpcUrl },
      );
      const signature = signQubitorPQAccountAuthorization(authorization.message, pqProfile.currentKey.privateKey);
      const pqRotateReceipt = await sendQubitorDevPQKeyRotation(
        {
          accountAddress: pqAccount.accountAddress,
          newPublicKey: nextKey.publicKey,
          nonce: authorization.nonce,
          signature,
          publicKey: gasKey.publicKey,
          privateKey: gasKey.privateKey,
          salt: pqAccount.salt,
        },
        { chainId: config.chainId, rpcUrl: config.rpcUrl, pqRelayerUrl: config.pqRelayerUrl },
      );
      const nextProfile = await rotateStoredQubitorDevPQKey(nextKey, {
        chainId: config.chainId,
        accountAddress: pqRotateReceipt.accountAddress,
        deploymentPublicKey: pqProfile.deploymentPublicKey,
        deploymentSalt: pqAccount.salt,
        currentPublicKeyCommitment: pqRotateReceipt.newPublicKeyCommitment,
        lastRotationTransactionHash: pqRotateReceipt.transactionHash,
      });
      await recordWalletActivity(
        { chainId: config.chainId, accountAddress: pqRotateReceipt.accountAddress },
        {
          type: "security",
          title: "PQ key rotated",
          detail: `ML-DSA key v${nextProfile.keyVersion} is active`,
          badge: "PQ Native",
          hash: pqRotateReceipt.transactionHash,
          security: pqRotateReceipt.signerMode ?? "ML-DSA PQ rotation",
          status: pqRotateReceipt.status === "success" ? "success" : "failed",
        },
      );
      setState((current) => ({
        ...current,
        pqRotateStatus: "success",
        pqRotateReceipt,
        pqProfile: nextProfile,
        pqCurrentPublicKeyCommitment: pqRotateReceipt.newPublicKeyCommitment,
      }));
      setReloadKey((key) => key + 1);
      return pqRotateReceipt;
    } catch (error) {
      setState((current) => ({
        ...current,
        pqRotateStatus: "error",
        pqRotateError: error instanceof Error ? error.message : "PQ key rotation failed.",
      }));
      throw error;
    }
  }, [config.chainId, config.pqRelayerUrl, config.rpcUrl]);

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, status: "loading", error: undefined }));

    async function readLiveState() {
      const bootState = await getWalletBootStateForAnyChain(config.chainId);
      if (bootState.status === "error") throw new Error(bootState.error);
      if (bootState.status !== "no-wallet" && bootState.chainId !== config.chainId) {
        if (!cancelled) setChainOverride(bootState.chainId);
        throw new Error("Switching to the network that contains your Quanta Account.");
      }
      const preview = "preview" in bootState ? bootState.preview : undefined;
      const configuredAddress = explicitConfiguredAccountAddress();
      const address = preview?.accountAddress ?? configuredAddress;
      if (!address) throw new Error("No Quanta Account profile found. Create or restore a wallet first.");

      const pqProfile = getUnlockedWalletProfile(config.chainId);
      const pqAccount =
        preview && isQubitorNetwork(config.chainId)
          ? await readQubitorDevPQAccount(deploymentRequestFromPreview(preview), {
              chainId: config.chainId,
              pqRelayerUrl: config.pqRelayerUrl,
            }).catch(() => undefined)
          : undefined;
      if (pqProfile && pqAccount) {
        await rememberQubitorDevPQDeployment({
          chainId: config.chainId,
          accountAddress: pqAccount.accountAddress,
          deploymentPublicKey: pqProfile.deploymentPublicKey,
          deploymentSalt: pqAccount.salt,
          currentPublicKeyCommitment: pqProfile.currentPublicKeyCommitment ?? pqAccount.publicKeyCommitment,
        });
      }
      const snapshot = await readAccountSnapshot(address, { chainId: config.chainId, rpcUrl: config.rpcUrl });
      const nextState = buildLiveState(snapshot, preview, pqAccount, pqProfile);
      return {
        ...nextState,
        walletStatus: bootState.status === "read-only-ready" && pqProfile ? "unlocked" : nextState.walletStatus,
        activity: await readWalletActivity({ chainId: config.chainId, accountAddress: address }),
      };
    }

    readLiveState()
      .then((nextState) => {
        if (!cancelled) setState((current) => mergeActionState(nextState, current));
      })
      .catch(async (error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "RPC read failed.";
        const preview = await getWalletPreview(config.chainId).catch(() => undefined);
        setState((current) => ({
          ...emptyState(config.chainId, preview, message),
          faucetStatus: current.faucetStatus,
          deployStatus: current.deployStatus,
          pqTxStatus: current.pqTxStatus,
          pqRotateStatus: current.pqRotateStatus,
          faucetReceipt: current.faucetReceipt,
          deployReceipt: current.deployReceipt,
          pqTxReceipt: current.pqTxReceipt,
          pqRotateReceipt: current.pqRotateReceipt,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [config.chainId, config.pqRelayerUrl, config.rpcUrl, reloadKey]);

  return {
    ...state,
    refresh,
    requestFaucet,
    deployPQAccount,
    sendPQTransfer,
    rotatePQKey,
    simulateTransfer,
    setChain,
    chainId: config.chainId,
    isQubitorDevnet: isQubitorNetwork(config.chainId),
  };
}
