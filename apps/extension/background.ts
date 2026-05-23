/**
 * Background service worker.
 *
 * Hosts the request-modal opener: when a content-script relay forwards a
 * provider event, this opens tabs/request.html?type=... in a popup-shaped
 * window so the user sees the matching modal screen.
 *
 * Qubitor is PQ-native only: eth_sendTransaction requests are reviewed here
 * and submitted as Quanta Account QubitorPQTxV1 executions, never as raw EOA
 * transactions.
 */

import {
  QUBITOR_TESTNET_CHAIN_ID,
  QUBITOR_ZERO_HASH,
  defaultQubitorRpcUrl,
  deriveQubitorPQAccountAddress,
  supportedChainId,
} from "@qubitor/evm";
import { getAddress, isHex, type Hex } from "viem";
import { createExtensionWalletProfile, unlockExtensionWalletProfile } from "./lib/extensionWalletVault";
import { sendExtensionDappTransaction } from "./lib/extensionWalletRuntime";

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
const CHAIN_ID = supportedChainId(env?.PLASMO_PUBLIC_QUBITOR_CHAIN_ID ?? QUBITOR_TESTNET_CHAIN_ID);
const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}`;
const RPC_URL = env?.PLASMO_PUBLIC_QUBITOR_RPC_URL ?? defaultQubitorRpcUrl(CHAIN_ID);
const CONNECTIONS_KEY = "qubitor:connections";
const EXTENSION_WALLET_STORAGE_KEY = "qubitor.extension.pq-wallet.encrypted.v1";

type RequestType = "connect" | "tx" | "sign";
type Decision = "approve" | "limited" | "reject";

interface ProviderRequestMessage {
  kind: "qubitor:provider-request";
  requestId: string;
  origin: string;
  method: string;
  params?: unknown[];
}

interface ResolveRequestMessage {
  kind: "qubitor:resolve-request";
  requestId: string;
  decision: Decision;
  passcode?: string;
}

interface StoredConnection {
  origin: string;
  hostname: string;
  connectedAt: number;
  lastUsedAt?: number;
  permissions: string[];
  compatibilityMode: boolean;
}

interface ExtensionWalletRecordPreview {
  chainId?: number;
  accountAddress?: string;
  deploymentPublicKey?: Hex;
  deploymentSalt?: Hex;
}

interface ExtensionWalletRecord {
  preview?: ExtensionWalletRecordPreview;
}

interface ProviderResponse {
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

interface PendingRequest {
  method: string;
  origin: string;
  params?: unknown[];
  respond: (response: ProviderResponse) => void;
}

interface ParsedTransactionRequest {
  from?: Hex;
  to: Hex;
  valueWei: string;
  data: Hex;
}

interface PendingRequestDetails {
  requestId: string;
  type: RequestType;
  method: string;
  origin: string;
  hostname: string;
  chainId: number;
  chainIdHex: string;
  account?: string;
  connected: boolean;
  permissions: string[];
  params?: unknown[];
  transaction?: ParsedTransactionRequest;
  parseError?: string;
}

const pendingRequests = new Map<string, PendingRequest>();

function hostnameFromOrigin(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return origin;
  }
}

function providerError(code: number, message: string): ProviderResponse {
  return { error: { code, message } };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Qubitor request failed.";
}

function requestTypeForMethod(method: string): RequestType | null {
  if (method === "eth_requestAccounts" || method === "wallet_requestPermissions") return "connect";
  if (method === "eth_sendTransaction") return "tx";
  if (
    method === "eth_sign" ||
    method === "personal_sign" ||
    method === "eth_signTypedData" ||
    method === "eth_signTypedData_v4"
  ) {
    return "sign";
  }
  return null;
}

function isRpcPassthroughMethod(method: string): boolean {
  return [
    "eth_blockNumber",
    "eth_call",
    "eth_estimateGas",
    "eth_feeHistory",
    "eth_gasPrice",
    "eth_getBalance",
    "eth_getBlockByHash",
    "eth_getBlockByNumber",
    "eth_getCode",
    "eth_getLogs",
    "eth_getStorageAt",
    "eth_getTransactionByHash",
    "eth_getTransactionCount",
    "eth_getTransactionReceipt",
  ].includes(method);
}

function getConnections(): Promise<Record<string, StoredConnection>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(CONNECTIONS_KEY, (items) => {
      resolve((items[CONNECTIONS_KEY] as Record<string, StoredConnection> | undefined) ?? {});
    });
  });
}

function getExtensionWalletRecord(): Promise<ExtensionWalletRecord | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(EXTENSION_WALLET_STORAGE_KEY, (items) => {
      resolve(items[EXTENSION_WALLET_STORAGE_KEY] as ExtensionWalletRecord | undefined);
    });
  });
}

async function currentAccountAddress(): Promise<string | undefined> {
  if (env?.PLASMO_PUBLIC_QUBITOR_ACCOUNT_ADDRESS?.startsWith("0x")) {
    return env.PLASMO_PUBLIC_QUBITOR_ACCOUNT_ADDRESS;
  }
  const preview = (await getExtensionWalletRecord())?.preview;
  const previewAddress = preview?.accountAddress;
  if (previewAddress?.startsWith("0x")) return previewAddress;
  if (!preview?.deploymentPublicKey) return undefined;

  try {
    return deriveQubitorPQAccountAddress(preview.deploymentPublicKey, preview.deploymentSalt ?? QUBITOR_ZERO_HASH);
  } catch {
    return undefined;
  }
}

async function getOrCreateAccountAddress(passcode?: string): Promise<string | undefined> {
  const current = await currentAccountAddress();
  if (current) return current;
  if (!passcode) return undefined;
  await createExtensionWalletProfile(passcode);
  return currentAccountAddress();
}

async function connectedAccountResult(origin: string): Promise<string[]> {
  if (!(await hasConnection(origin))) return [];
  const account = await currentAccountAddress();
  return account ? [account] : [];
}

async function readConnection(origin: string): Promise<StoredConnection | undefined> {
  return (await getConnections())[origin];
}

async function setConnection(origin: string, permissions: string[]) {
  const connections = await getConnections();
  const existing = connections[origin];
  connections[origin] = {
    origin,
    hostname: hostnameFromOrigin(origin),
    connectedAt: existing?.connectedAt ?? Date.now(),
    lastUsedAt: Date.now(),
    permissions,
    compatibilityMode: permissions.includes("limited"),
  };
  await chrome.storage.local.set({ [CONNECTIONS_KEY]: connections });
}

async function touchConnection(origin: string): Promise<StoredConnection | undefined> {
  const connections = await getConnections();
  const connection = connections[origin];
  if (!connection) return undefined;
  connections[origin] = { ...connection, lastUsedAt: Date.now() };
  await chrome.storage.local.set({ [CONNECTIONS_KEY]: connections });
  return connections[origin];
}

async function disconnectOrigin(origin: string) {
  const connections = await getConnections();
  delete connections[origin];
  await chrome.storage.local.set({ [CONNECTIONS_KEY]: connections });
}

async function hasConnection(origin: string): Promise<boolean> {
  return Boolean(await touchConnection(origin));
}

async function rpcPassthrough(method: string, params: unknown[] = []): Promise<ProviderResponse> {
  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const payload = (await response.json()) as { result?: unknown; error?: { code?: number; message?: string } };
    if (payload.error) {
      return providerError(payload.error.code ?? -32000, payload.error.message ?? `${method} failed`);
    }
    return { result: payload.result };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "RPC request failed";
    return providerError(4900, `Qubitor RPC unavailable at ${RPC_URL}: ${detail}`);
  }
}

function openRequestWindow(type: RequestType, request: ProviderRequestMessage, respond: (response: ProviderResponse) => void) {
  pendingRequests.set(request.requestId, {
    method: request.method,
    origin: request.origin,
    params: request.params,
    respond,
  });

  const params = new URLSearchParams({
    type,
    requestId: request.requestId,
    origin: request.origin,
    method: request.method,
  });
  const url = chrome.runtime.getURL(`tabs/request.html?${params.toString()}`);

  chrome.windows.create({ url, type: "popup", width: 420, height: 720 }, () => {
    if (chrome.runtime.lastError) {
      pendingRequests.delete(request.requestId);
      respond(providerError(5000, chrome.runtime.lastError.message ?? "Could not open Qubitor review window."));
    }
  });
}

function quantityToBigInt(value: unknown, fallback = 0n): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isFinite(value)) return BigInt(Math.trunc(value));
  if (typeof value !== "string" || value.length === 0) return fallback;
  try {
    return value.startsWith("0x") ? BigInt(value) : BigInt(value);
  } catch {
    throw new Error(`Invalid transaction value: ${value}`);
  }
}

function normalizeData(value: unknown): Hex {
  const data = typeof value === "string" && value.length > 0 ? value : "0x";
  if (!isHex(data)) throw new Error("Transaction calldata must be 0x-prefixed hex.");
  return data as Hex;
}

function parseTransactionRequest(params: unknown[] = []): ParsedTransactionRequest {
  const tx = params[0] as Record<string, unknown> | undefined;
  if (!tx || typeof tx !== "object") throw new Error("Missing eth_sendTransaction payload.");
  if (typeof tx.to !== "string" || !tx.to.startsWith("0x")) {
    throw new Error("Contract deployment transactions are not supported by Quanta Wallet yet.");
  }
  const from = typeof tx.from === "string" && tx.from.startsWith("0x") ? (getAddress(tx.from) as Hex) : undefined;
  const to = getAddress(tx.to) as Hex;
  const valueWei = quantityToBigInt(tx.value).toString();
  const data = normalizeData(tx.data ?? tx.input);
  return { from, to, valueWei, data };
}

async function getPendingRequestDetails(requestId: string): Promise<PendingRequestDetails | undefined> {
  const pending = pendingRequests.get(requestId);
  if (!pending) return undefined;
  const type = requestTypeForMethod(pending.method);
  if (!type) return undefined;
  const account = await currentAccountAddress();
  const connection = await readConnection(pending.origin);
  const details: PendingRequestDetails = {
    requestId,
    type,
    method: pending.method,
    origin: pending.origin,
    hostname: hostnameFromOrigin(pending.origin),
    chainId: CHAIN_ID,
    chainIdHex: CHAIN_ID_HEX,
    account,
    connected: Boolean(connection),
    permissions: connection?.permissions ?? [],
    params: pending.params,
  };
  if (type === "tx") {
    try {
      details.transaction = parseTransactionRequest(pending.params);
    } catch (error) {
      details.parseError = messageOf(error);
    }
  }
  return details;
}

async function handleProviderRequest(message: ProviderRequestMessage, respond: (response: ProviderResponse) => void) {
  switch (message.method) {
    case "eth_chainId":
      respond({ result: CHAIN_ID_HEX });
      return;
    case "net_version":
      respond({ result: String(CHAIN_ID) });
      return;
    case "web3_clientVersion":
      respond({ result: "QubitorWallet/0.0.1" });
      return;
    case "eth_accounts":
      respond({ result: await connectedAccountResult(message.origin) });
      return;
    case "wallet_getPermissions":
      respond({
        result: (await hasConnection(message.origin))
          ? [{ parentCapability: "eth_accounts", caveats: [] }]
          : [],
      });
      return;
    case "wallet_switchEthereumChain": {
      const requested = (message.params?.[0] as { chainId?: string } | undefined)?.chainId;
      if (!requested || requested.toLowerCase() !== CHAIN_ID_HEX.toLowerCase()) {
        respond(providerError(4902, `Quanta Wallet only supports chain ${CHAIN_ID_HEX} in this build.`));
        return;
      }
      respond({ result: null });
      return;
    }
    case "wallet_addEthereumChain": {
      const requested = (message.params?.[0] as { chainId?: string } | undefined)?.chainId;
      if (!requested || requested.toLowerCase() !== CHAIN_ID_HEX.toLowerCase()) {
        respond(providerError(4902, `Unsupported Qubitor chain. Expected ${CHAIN_ID_HEX}.`));
        return;
      }
      respond({ result: null });
      return;
    }
    case "wallet_revokePermissions":
      await disconnectOrigin(message.origin);
      respond({ result: null });
      return;
  }

  if (isRpcPassthroughMethod(message.method)) {
    respond(await rpcPassthrough(message.method, message.params ?? []));
    return;
  }

  const type = requestTypeForMethod(message.method);
  if (type) {
    if (type !== "connect" && !(await hasConnection(message.origin))) {
      respond(providerError(4100, "Connect this site to Quanta Wallet before signing requests."));
      return;
    }
    if (message.method === "eth_requestAccounts" && (await hasConnection(message.origin))) {
      const accounts = await connectedAccountResult(message.origin);
      if (accounts.length === 0) {
        respond(providerError(4100, "Unlock Quanta Wallet before connecting this site."));
        return;
      }
      respond({ result: accounts });
      return;
    }
    openRequestWindow(type, message, respond);
    return;
  }

  respond(providerError(-32601, `Qubitor provider does not support ${message.method} yet.`));
}

async function resolvePendingRequest(message: ResolveRequestMessage): Promise<{ ok: boolean; error?: string }> {
  const pending = pendingRequests.get(message.requestId);
  if (!pending) return { ok: false, error: "Qubitor request expired. Please try again." };

  if (message.decision === "reject") {
    pendingRequests.delete(message.requestId);
    pending.respond(providerError(4001, "User rejected the Qubitor request."));
    return { ok: true };
  }

  try {
    if (pending.method === "eth_requestAccounts") {
      const account = await getOrCreateAccountAddress(message.passcode);
      if (!account) {
        throw new Error("Create or restore Quanta Wallet before connecting this site.");
      }
      await setConnection(
        pending.origin,
        message.decision === "limited" ? ["view-account", "limited"] : ["view-account", "request-signatures"],
      );
      pendingRequests.delete(message.requestId);
      pending.respond({ result: [account] });
      return { ok: true };
    }

    if (pending.method === "wallet_requestPermissions") {
      const account = await getOrCreateAccountAddress(message.passcode);
      if (!account) {
        throw new Error("Create or restore Quanta Wallet before connecting this site.");
      }
      await setConnection(
        pending.origin,
        message.decision === "limited" ? ["view-account", "limited"] : ["view-account", "request-signatures"],
      );
      pendingRequests.delete(message.requestId);
      pending.respond({ result: [{ parentCapability: "eth_accounts", caveats: [] }] });
      return { ok: true };
    }

    if (pending.method === "eth_sendTransaction") {
      if (!(await readConnection(pending.origin))) {
        throw new Error("Connect this site to Quanta Wallet before signing transactions.");
      }
      if (!message.passcode) throw new Error("Enter your Quanta Wallet passcode to sign this transaction.");
      const account = await currentAccountAddress();
      if (!account) throw new Error("Unlock Quanta Wallet before signing transactions.");
      const tx = parseTransactionRequest(pending.params);
      if (tx.from && tx.from.toLowerCase() !== account.toLowerCase()) {
        throw new Error(`This request is from ${tx.from.slice(0, 6)}...${tx.from.slice(-4)}, not your active Quanta Account.`);
      }
      const profile = await unlockExtensionWalletProfile(message.passcode);
      const receipt = await sendExtensionDappTransaction(profile, message.passcode, {
        target: tx.to,
        valueWei: tx.valueWei,
        data: tx.data,
      });
      pendingRequests.delete(message.requestId);
      pending.respond({ result: receipt.transactionHash });
      return { ok: true };
    }

    if (
      pending.method === "eth_sign" ||
      pending.method === "personal_sign" ||
      pending.method === "eth_signTypedData" ||
      pending.method === "eth_signTypedData_v4"
    ) {
      throw new Error(
        "Message signing is not enabled for this compatibility method yet. Quanta Wallet can sign and submit Qubitor transactions through eth_sendTransaction.",
      );
    }

    throw new Error(`Qubitor provider does not support ${pending.method} yet.`);
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("[qubitor] extension installed");
});

function postProviderResponse(
  port: chrome.runtime.Port,
  requestId: string,
  response: ProviderResponse,
  disconnect = true,
) {
  try {
    port.postMessage({
      source: "qubitor:provider-response",
      requestId,
      result: response.result,
      error: response.error,
    });
  } finally {
    if (disconnect) {
      setTimeout(() => {
        try {
          port.disconnect();
        } catch {
          // The content relay may already have closed after receiving the response.
        }
      }, 100);
    }
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "qubitor:provider") return;
  let activeRequestId: string | undefined;
  let responded = false;

  const respondFromPort = (requestId: string) => (response: ProviderResponse) => {
    if (responded) return;
    responded = true;
    pendingRequests.delete(requestId);
    postProviderResponse(port, requestId, response);
  };

  port.onMessage.addListener((message) => {
    if (message?.kind !== "qubitor:provider-request" || !message.requestId) return;
    activeRequestId = message.requestId as string;
    void handleProviderRequest(message as ProviderRequestMessage, respondFromPort(activeRequestId));
  });

  port.onDisconnect.addListener(() => {
    if (!responded && activeRequestId) {
      pendingRequests.delete(activeRequestId);
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "qubitor:ping") {
    sendResponse({ ok: true, build: "shell" });
    return true;
  }
  if (message?.kind === "qubitor:open-request") {
    const type = message.type as "connect" | "tx" | "sign";
    const url = chrome.runtime.getURL(`tabs/request.html?type=${type}`);
    chrome.windows.create({ url, type: "popup", width: 420, height: 720 });
    sendResponse({ ok: true });
    return true;
  }
  if (message?.kind === "qubitor:provider-request") {
    void handleProviderRequest(message as ProviderRequestMessage, sendResponse);
    return true;
  }
  if (message?.kind === "qubitor:resolve-request") {
    void resolvePendingRequest(message as ResolveRequestMessage).then(sendResponse);
    return true;
  }
  if (message?.kind === "qubitor:get-pending-request") {
    void getPendingRequestDetails(message.requestId as string).then((request) => {
      sendResponse({ ok: Boolean(request), request, error: request ? undefined : "Qubitor request expired." });
    });
    return true;
  }
  if (message?.kind === "qubitor:get-connections") {
    void getConnections().then((connections) => sendResponse({ ok: true, connections }));
    return true;
  }
  if (message?.kind === "qubitor:disconnect-origin") {
    void disconnectOrigin(message.origin as string).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }
  return false;
});

export {};
