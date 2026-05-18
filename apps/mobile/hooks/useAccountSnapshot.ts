import { useCallback, useEffect, useMemo, useState } from "react";
import type { Hex, QubitorAccount, SecurityMode } from "@qubitor/core";
import {
  formatBalanceWei,
  deployQubitorDevPQAccount,
  defaultQubitorRpcUrl,
  defaultQubitorFaucetUrl,
  defaultQubitorPQRelayerUrl,
  isQubitorNetwork,
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
import {
  MOCK_ACCOUNT,
  MOCK_ACTIVITY,
  MOCK_BALANCE_LABEL,
  MOCK_BALANCE_QBT,
  MOCK_TOKENS,
  type ActivityItem,
  type TokenItem,
} from "@/lib/mockData";
import {
  generateQubitorDevPQKey,
  loadOrCreateQubitorDevPQProfile,
  rememberQubitorDevPQDeployment,
  rotateStoredQubitorDevPQKey,
  type QubitorDevPQWalletProfile,
} from "@/lib/pqDevWallet";
import {
  qubitorDevnetPQNativeGasKey,
  qubitorDevnetPQDeploymentRequest,
  sendQubitorDevnetWalletPQTransfer,
} from "@/lib/qbtDevnetWalletFlow";
import { readWalletActivity, recordWalletActivity, type WalletActivityItem } from "@/lib/walletActivity";
import { getSelectedChainId, setSelectedChainId, type SelectableChainId } from "@/lib/networkPreference";

type SnapshotStatus = "loading" | "live" | "fallback";
type FaucetStatus = "idle" | "requesting" | "success" | "error";
type PQActionStatus = "idle" | "requesting" | "success" | "error";

const INLINE_ENV: Record<string, string | undefined> = {
  EXPO_PUBLIC_QUBITOR_ACCOUNT_ADDRESS: process.env.EXPO_PUBLIC_QUBITOR_ACCOUNT_ADDRESS,
  EXPO_PUBLIC_QUBITOR_CHAIN_ID: process.env.EXPO_PUBLIC_QUBITOR_CHAIN_ID,
  EXPO_PUBLIC_QUBITOR_RPC_URL: process.env.EXPO_PUBLIC_QUBITOR_RPC_URL,
  EXPO_PUBLIC_QUBITOR_FAUCET_URL: process.env.EXPO_PUBLIC_QUBITOR_FAUCET_URL,
  EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL: process.env.EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL,
};

interface SnapshotState {
  status: SnapshotStatus;
  faucetStatus: FaucetStatus;
  deployStatus: PQActionStatus;
  pqTxStatus: PQActionStatus;
  pqRotateStatus: PQActionStatus;
  account: QubitorAccount;
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

function env(name: string): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return INLINE_ENV[name] ?? proc?.env?.[name];
}

function configuredAccountAddress(): Hex {
  const configured = env("EXPO_PUBLIC_QUBITOR_ACCOUNT_ADDRESS");
  return configured?.startsWith("0x") ? (configured as Hex) : MOCK_ACCOUNT.address;
}

function configuredChainId() {
  return supportedChainId(env("EXPO_PUBLIC_QUBITOR_CHAIN_ID") ?? MOCK_ACCOUNT.chainId);
}

function configuredFaucetUrl() {
  return env("EXPO_PUBLIC_QUBITOR_FAUCET_URL");
}

function configuredPQRelayerUrl() {
  return env("EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL");
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
  return isQubitorNetwork(snapshot.chainId) ? "PQ Native" : MOCK_ACCOUNT.security.mode;
}

function buildLiveState(
  snapshot: AccountReadSnapshot,
  pqAccount?: QubitorDevPQAccount,
  pqProfile?: QubitorDevPQWalletProfile,
): SnapshotState {
  const balanceNative = formatBalanceWei(snapshot.balanceWei);
  const securityMode = securityModeFromReadiness(snapshot);
  const nativeSymbol = snapshot.nativeCurrencySymbol;
  const pqCurrentPublicKeyCommitment =
    snapshot.qbt?.readiness?.readiness?.pqPublicKeyCommitment ??
    pqProfile?.currentPublicKeyCommitment ??
    pqAccount?.publicKeyCommitment;
  const account: QubitorAccount = {
    ...MOCK_ACCOUNT,
    address: snapshot.address,
    chainId: snapshot.chainId,
    deployed: snapshot.deployed,
    security: {
      ...MOCK_ACCOUNT.security,
      mode: securityMode,
      pqLayerEnabled: securityMode === "PQ Native" || securityMode === "PQ Ready" || MOCK_ACCOUNT.security.pqLayerEnabled,
      recovery: securityMode === "PQ Native" ? "active" : MOCK_ACCOUNT.security.recovery,
    },
  };

  return {
    status: "live",
    faucetStatus: "idle",
    deployStatus: "idle",
    pqTxStatus: "idle",
    pqRotateStatus: "idle",
    account,
    balanceWei: snapshot.balanceWei,
    balanceNative,
    balanceLabel: `${balanceNative} ${nativeSymbol}`,
    balanceUsd: `${balanceNative} ${nativeSymbol}`,
    chainName: snapshot.chainName,
    nativeCurrencySymbol: nativeSymbol,
    deploymentLabel: snapshot.deployed ? "Deployed" : "Counterfactual",
    readinessLabel: snapshot.qbt?.readiness?.securityMode ?? account.security.mode,
    latestBlock: snapshot.latestBlock.toString(),
    rpcUrl: snapshot.rpcUrl,
    pqAccount,
    pqProfile,
    pqCurrentPublicKeyCommitment,
    activity: [],
    tokens: MOCK_TOKENS.map((token) =>
      token.symbol === "QBT"
        ? {
            ...token,
            symbol: nativeSymbol,
            name: nativeSymbol === "QBT" ? "Qubitor" : token.name,
            balance: balanceNative,
            fiatValue: "Live RPC",
          }
        : token,
    ),
  };
}

function fallbackState(error?: string): SnapshotState {
  return {
    status: error ? "fallback" : "loading",
    faucetStatus: "idle",
    deployStatus: "idle",
    pqTxStatus: "idle",
    pqRotateStatus: "idle",
    account: MOCK_ACCOUNT,
    balanceWei: undefined,
    balanceNative: MOCK_BALANCE_QBT,
    balanceLabel: MOCK_BALANCE_LABEL,
    balanceUsd: MOCK_BALANCE_LABEL,
    tokens: MOCK_TOKENS,
    activity: MOCK_ACTIVITY,
    chainName: "Qubitor Testnet",
    nativeCurrencySymbol: "QBT",
    deploymentLabel: MOCK_ACCOUNT.deployed ? "Deployed" : "Counterfactual",
    readinessLabel: MOCK_ACCOUNT.security.mode,
    error,
  };
}

export function useAccountSnapshot() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<SnapshotState>(() => fallbackState());
  const [chainOverride, setChainOverride] = useState<number | undefined>();

  // Load the user's persisted network choice once.
  useEffect(() => {
    let active = true;
    getSelectedChainId().then((selected) => {
      if (active && selected !== undefined) setChainOverride(selected);
    });
    return () => {
      active = false;
    };
  }, []);

  const config = useMemo(() => {
    const envChainId = configuredChainId();
    // No override → keep the existing env-driven config untouched.
    if (chainOverride === undefined || chainOverride === envChainId) {
      return {
        address: configuredAccountAddress(),
        chainId: envChainId,
        rpcUrl: env("EXPO_PUBLIC_QUBITOR_RPC_URL"),
        faucetUrl: configuredFaucetUrl(),
        pqRelayerUrl: configuredPQRelayerUrl(),
      };
    }
    // Override differs from the env chain → derive every endpoint from the
    // chain's real defaults so the env RPC (bound to the env chain) isn't reused.
    const chainId = supportedChainId(chainOverride);
    return {
      address: configuredAccountAddress(),
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
    async (args: { to: Hex; valueWei: bigint; data?: Hex }) =>
      simulateQubitorTransfer(
        { from: state.account.address, to: args.to, valueWei: args.valueWei, data: args.data },
        { chainId: config.chainId, rpcUrl: config.rpcUrl },
      ),
    [config.chainId, config.rpcUrl, state.account.address],
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
      const pqProfile = await loadOrCreateQubitorDevPQProfile(config.chainId);
      const pqAccount = await readQubitorDevPQAccount(
        qubitorDevnetPQDeploymentRequest(pqProfile),
        { chainId: config.chainId, pqRelayerUrl: config.pqRelayerUrl },
      );
      const faucetReceipt = await requestQubitorDevnetFaucet(
        pqAccount.accountAddress,
        { chainId: config.chainId, faucetUrl: config.faucetUrl },
        { publicKey: pqProfile.deploymentPublicKey, salt: pqAccount.salt, deployAccount: true },
      );
      await rememberQubitorDevPQDeployment({
        chainId: config.chainId,
        accountAddress: pqAccount.accountAddress,
        deploymentPublicKey: pqProfile.deploymentPublicKey,
        deploymentSalt: pqAccount.salt,
        currentPublicKeyCommitment: pqProfile.currentPublicKeyCommitment ?? pqAccount.publicKeyCommitment,
      });
      await recordWalletActivity(
        { chainId: config.chainId, accountAddress: pqAccount.accountAddress },
        {
          type: "receive",
          title: "Faucet funded account",
          detail: `${formatBalanceWei(BigInt(faucetReceipt.amountWei))} QBT`,
          badge: "PQ Native",
          hash: faucetReceipt.hash,
          to: pqAccount.accountAddress,
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
  }, [config.chainId, config.faucetUrl, config.pqRelayerUrl]);

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
      const pqProfile = await loadOrCreateQubitorDevPQProfile(config.chainId);
      const deployReceipt = await deployQubitorDevPQAccount(
        qubitorDevnetPQDeploymentRequest(pqProfile),
        { chainId: config.chainId, faucetUrl: config.faucetUrl, pqRelayerUrl: config.pqRelayerUrl },
      );
      await rememberQubitorDevPQDeployment({
        chainId: config.chainId,
        accountAddress: deployReceipt.accountAddress,
        deploymentPublicKey: pqProfile.deploymentPublicKey,
        deploymentSalt: pqProfile.deploymentSalt,
      });
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
        setState((current) => ({
          ...current,
          pqTxStatus: "error",
          pqTxError: pqError.message,
        }));
        throw pqError;
      }

      setState((current) => ({ ...current, pqTxStatus: "requesting", pqTxError: undefined }));
      try {
        const pqProfile = await loadOrCreateQubitorDevPQProfile(config.chainId);
        const pqAccount = await readQubitorDevPQAccount(
          qubitorDevnetPQDeploymentRequest(pqProfile),
          { chainId: config.chainId, pqRelayerUrl: config.pqRelayerUrl },
        );
        await rememberQubitorDevPQDeployment({
          chainId: config.chainId,
          accountAddress: pqAccount.accountAddress,
          deploymentPublicKey: pqProfile.deploymentPublicKey,
          deploymentSalt: pqAccount.salt,
          currentPublicKeyCommitment: pqProfile.currentPublicKeyCommitment ?? pqAccount.publicKeyCommitment,
        });
        const target = args?.target ?? "0x000000000000000000000000000000000000dEaD";
        const valueWei = args?.valueWei ?? "1000000000000000";
        const data = args?.data ?? "0x";
        const transfer = await sendQubitorDevnetWalletPQTransfer(
          pqProfile,
          { chainId: config.chainId, rpcUrl: config.rpcUrl, faucetUrl: config.faucetUrl, pqRelayerUrl: config.pqRelayerUrl },
          { target, valueWei, data },
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
      setState((current) => ({
        ...current,
        pqRotateStatus: "error",
        pqRotateError: pqError.message,
      }));
      throw pqError;
    }

    setState((current) => ({ ...current, pqRotateStatus: "requesting", pqRotateError: undefined }));
    try {
      const pqProfile = await loadOrCreateQubitorDevPQProfile(config.chainId);
      const pqAccount = await readQubitorDevPQAccount(
        qubitorDevnetPQDeploymentRequest(pqProfile),
        { chainId: config.chainId, pqRelayerUrl: config.pqRelayerUrl },
      );
      await rememberQubitorDevPQDeployment({
        chainId: config.chainId,
        accountAddress: pqAccount.accountAddress,
        deploymentPublicKey: pqProfile.deploymentPublicKey,
        deploymentSalt: pqAccount.salt,
        currentPublicKeyCommitment: pqProfile.currentPublicKeyCommitment ?? pqAccount.publicKeyCommitment,
      });
      if (!pqAccount.deployed) {
        throw new Error("Deploy the Qubitor Account before rotating its PQ key.");
      }

      const nextKey = await generateQubitorDevPQKey();
      const gasKey = qubitorDevnetPQNativeGasKey(pqProfile);
      const authorization = await readQubitorDevPQRotateAuthorization(
        {
          accountAddress: pqAccount.accountAddress,
          newPublicKey: nextKey.publicKey,
        },
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
      let pqProfile = isQubitorNetwork(config.chainId) ? await loadOrCreateQubitorDevPQProfile(config.chainId) : undefined;
      const pqAccount = pqProfile
        ? await readQubitorDevPQAccount(qubitorDevnetPQDeploymentRequest(pqProfile), {
            chainId: config.chainId,
            pqRelayerUrl: config.pqRelayerUrl,
          }).catch(() => undefined)
        : undefined;
      if (pqProfile && pqAccount) {
        pqProfile = await rememberQubitorDevPQDeployment({
          chainId: config.chainId,
          accountAddress: pqAccount.accountAddress,
          deploymentPublicKey: pqProfile.deploymentPublicKey,
          deploymentSalt: pqAccount.salt,
          currentPublicKeyCommitment: pqProfile.currentPublicKeyCommitment ?? pqAccount.publicKeyCommitment,
        });
      }
      const address = pqAccount?.accountAddress ?? pqProfile?.accountAddress ?? config.address;
      const snapshot = await readAccountSnapshot(address, { chainId: config.chainId, rpcUrl: config.rpcUrl });
      const nextState = buildLiveState(snapshot, pqAccount, pqProfile);
      return {
        ...nextState,
        activity: await readWalletActivity({ chainId: config.chainId, accountAddress: address }),
      };
    }

    readLiveState()
      .then((nextState) => {
        if (!cancelled) {
          setState((current) => ({
            ...nextState,
            faucetStatus: current.faucetStatus === "requesting" ? "idle" : current.faucetStatus,
            faucetReceipt: current.faucetReceipt,
            deployStatus: current.deployStatus === "requesting" ? "idle" : current.deployStatus,
            deployReceipt: current.deployReceipt,
            pqTxStatus: current.pqTxStatus === "requesting" ? "idle" : current.pqTxStatus,
            pqTxReceipt: current.pqTxReceipt,
            pqRotateStatus: current.pqRotateStatus === "requesting" ? "idle" : current.pqRotateStatus,
            pqRotateReceipt: current.pqRotateReceipt,
          }));
        }
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "RPC read failed.";
        setState(fallbackState(message));
      });

    return () => {
      cancelled = true;
    };
  }, [config.address, config.chainId, config.pqRelayerUrl, config.rpcUrl, reloadKey]);

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
