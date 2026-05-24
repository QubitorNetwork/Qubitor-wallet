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
const PENDING_PROVIDER_REQUESTS_KEY = "qubitor:provider-pending.v1";
const PROVIDER_RESPONSES_KEY = "qubitor:provider-responses.v1";
const PROVIDER_DIAGNOSTICS_KEY = "qubitor:provider-diagnostics.v1";
const REQUEST_TTL_MS = 10 * 60 * 1000;

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
  requestId: string;
  method: string;
  origin: string;
  params?: unknown[];
  createdAt: number;
  expiresAt: number;
  respond?: (response: ProviderResponse) => void | Promise<void>;
}

interface StoredProviderResponse {
  response: ProviderResponse;
  createdAt: number;
  expiresAt: number;
}

interface ProviderDiagnostic {
  id: string;
  at: number;
  event: string;
  requestId?: string;
  origin?: string;
  method?: string;
  detail?: string;
  extensionVersion: string;
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

const MAIN_WORLD_PROVIDER_SCRIPT_ID = "contentsInjectProvider";
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

function extensionVersion(): string {
  try {
    return chrome.runtime.getManifest().version;
  } catch {
    return "unknown";
  }
}

async function recordProviderDiagnostic(
  event: string,
  details: Partial<Omit<ProviderDiagnostic, "id" | "at" | "event" | "extensionVersion">> = {},
): Promise<void> {
  try {
    const entry: ProviderDiagnostic = {
      id: `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`,
      at: nowMs(),
      event,
      extensionVersion: extensionVersion(),
      ...details,
    };
    const current = await new Promise<ProviderDiagnostic[]>((resolve) => {
      chrome.storage.local.get(PROVIDER_DIAGNOSTICS_KEY, (items) => {
        resolve((items[PROVIDER_DIAGNOSTICS_KEY] as ProviderDiagnostic[] | undefined) ?? []);
      });
    });
    await chrome.storage.local.set({ [PROVIDER_DIAGNOSTICS_KEY]: [entry, ...current].slice(0, 60) });
  } catch {
    // Diagnostics must never block provider requests.
  }
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

function nowMs() {
  return Date.now();
}

function isExpired(expiresAt?: number): boolean {
  return typeof expiresAt === "number" && expiresAt <= nowMs();
}

async function getPendingProviderRequests(): Promise<Record<string, PendingRequest>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(PENDING_PROVIDER_REQUESTS_KEY, (items) => {
      const raw = (items[PENDING_PROVIDER_REQUESTS_KEY] as Record<string, PendingRequest> | undefined) ?? {};
      const active = Object.fromEntries(Object.entries(raw).filter(([, request]) => !isExpired(request.expiresAt)));
      if (Object.keys(active).length !== Object.keys(raw).length) {
        void chrome.storage.local.set({ [PENDING_PROVIDER_REQUESTS_KEY]: active });
      }
      resolve(active);
    });
  });
}

async function savePendingProviderRequest(request: PendingRequest): Promise<void> {
  const requests = await getPendingProviderRequests();
  const { respond: _respond, ...stored } = request;
  requests[request.requestId] = stored;
  await chrome.storage.local.set({ [PENDING_PROVIDER_REQUESTS_KEY]: requests });
}

async function readPendingProviderRequest(requestId: string): Promise<PendingRequest | undefined> {
  const request = (await getPendingProviderRequests())[requestId];
  if (!request || isExpired(request.expiresAt)) return undefined;
  return request;
}

async function deletePendingProviderRequest(requestId: string): Promise<void> {
  const requests = await getPendingProviderRequests();
  delete requests[requestId];
  await chrome.storage.local.set({ [PENDING_PROVIDER_REQUESTS_KEY]: requests });
}

async function getStoredProviderResponses(): Promise<Record<string, StoredProviderResponse>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(PROVIDER_RESPONSES_KEY, (items) => {
      const raw = (items[PROVIDER_RESPONSES_KEY] as Record<string, StoredProviderResponse> | undefined) ?? {};
      const active = Object.fromEntries(Object.entries(raw).filter(([, entry]) => !isExpired(entry.expiresAt)));
      if (Object.keys(active).length !== Object.keys(raw).length) {
        void chrome.storage.local.set({ [PROVIDER_RESPONSES_KEY]: active });
      }
      resolve(active);
    });
  });
}

async function storeProviderResponse(requestId: string, response: ProviderResponse): Promise<void> {
  const responses = await getStoredProviderResponses();
  responses[requestId] = {
    response,
    createdAt: nowMs(),
    expiresAt: nowMs() + REQUEST_TTL_MS,
  };
  await chrome.storage.local.set({ [PROVIDER_RESPONSES_KEY]: responses });
}

async function readProviderResponse(requestId: string): Promise<StoredProviderResponse | undefined> {
  const response = (await getStoredProviderResponses())[requestId];
  if (!response || isExpired(response.expiresAt)) return undefined;
  return response;
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

async function openRequestWindow(
  type: RequestType,
  request: ProviderRequestMessage,
  respond: (response: ProviderResponse) => void | Promise<void>,
) {
  const createdAt = nowMs();
  const pending: PendingRequest = {
    requestId: request.requestId,
    method: request.method,
    origin: request.origin,
    params: request.params,
    createdAt,
    expiresAt: createdAt + REQUEST_TTL_MS,
    respond,
  };
  pendingRequests.set(request.requestId, pending);
  await savePendingProviderRequest(pending);
  await recordProviderDiagnostic("request:pending", {
    requestId: request.requestId,
    origin: request.origin,
    method: request.method,
  });

  const params = new URLSearchParams({
    type,
    requestId: request.requestId,
    origin: request.origin,
    method: request.method,
  });
  const url = chrome.runtime.getURL(`tabs/request.html?${params.toString()}`);

  const completeOpenFailure = (detail: string) => {
    void completePendingRequest(request.requestId, providerError(5000, detail));
  };

  const openFallbackTab = (reason: string) => {
    void recordProviderDiagnostic("approval:popup-fallback", {
      requestId: request.requestId,
      origin: request.origin,
      method: request.method,
      detail: reason,
    });
    chrome.tabs.create({ url, active: true }, (tab) => {
      if (chrome.runtime.lastError) {
        const detail = chrome.runtime.lastError.message ?? "Could not open Qubitor review tab.";
        void recordProviderDiagnostic("approval:tab-open-failed", {
          requestId: request.requestId,
          origin: request.origin,
          method: request.method,
          detail,
        });
        completeOpenFailure(detail);
        return;
      }
      if (tab?.id === undefined) {
        const detail = "Chrome did not return a Quanta Wallet approval tab.";
        void recordProviderDiagnostic("approval:tab-open-empty", {
          requestId: request.requestId,
          origin: request.origin,
          method: request.method,
          detail,
        });
        completeOpenFailure(detail);
        return;
      }
      void recordProviderDiagnostic("approval:open-tab", {
        requestId: request.requestId,
        origin: request.origin,
        method: request.method,
        detail: `tab:${tab.id}`,
      });
    });
  };

  chrome.windows.create({ url, type: "popup", width: 420, height: 720, focused: true }, (createdWindow) => {
    if (chrome.runtime.lastError) {
      const detail = chrome.runtime.lastError.message ?? "Could not open Qubitor review window.";
      void recordProviderDiagnostic("approval:open-failed", {
        requestId: request.requestId,
        origin: request.origin,
        method: request.method,
        detail,
      });
      openFallbackTab(detail);
      return;
    }
    if (createdWindow?.id === undefined) {
      const detail = "Chrome did not return a Quanta Wallet approval window.";
      void recordProviderDiagnostic("approval:open-empty", {
        requestId: request.requestId,
        origin: request.origin,
        method: request.method,
        detail,
      });
      openFallbackTab(detail);
      return;
    }
    void recordProviderDiagnostic("approval:open", {
      requestId: request.requestId,
      origin: request.origin,
      method: request.method,
      detail: `window:${createdWindow.id}`,
    });
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
  const pending = pendingRequests.get(requestId) ?? (await readPendingProviderRequest(requestId));
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
  void recordProviderDiagnostic("request:received", {
    requestId: message.requestId,
    origin: message.origin,
    method: message.method,
  });

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
    await openRequestWindow(type, message, respond);
    return;
  }

  respond(providerError(-32601, `Qubitor provider does not support ${message.method} yet.`));
}

async function completePendingRequest(requestId: string, response: ProviderResponse): Promise<void> {
  const pending = pendingRequests.get(requestId);
  pendingRequests.delete(requestId);
  await deletePendingProviderRequest(requestId);
  await storeProviderResponse(requestId, response);
  await recordProviderDiagnostic(response.error ? "request:error" : "request:resolved", {
    requestId,
    origin: pending?.origin,
    method: pending?.method,
    detail: response.error ? `${response.error.code}:${response.error.message}` : "ok",
  });
  if (pending?.respond) {
    try {
      await pending.respond(response);
    } catch {
      // The original content-script port may have disconnected. The relay also
      // polls chrome.storage by request id, so the response is still delivered.
    }
  }
}

async function resolvePendingRequest(message: ResolveRequestMessage): Promise<{ ok: boolean; error?: string }> {
  const pending = pendingRequests.get(message.requestId) ?? (await readPendingProviderRequest(message.requestId));
  if (!pending) return { ok: false, error: "Qubitor request expired. Please try again." };

  if (message.decision === "reject") {
    await completePendingRequest(message.requestId, providerError(4001, "User rejected the Qubitor request."));
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
      await completePendingRequest(message.requestId, { result: [account] });
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
      await completePendingRequest(message.requestId, { result: [{ parentCapability: "eth_accounts", caveats: [] }] });
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
      await completePendingRequest(message.requestId, { result: receipt.transactionHash });
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

function refreshMainWorldProviderAfterUpdate(details: chrome.runtime.InstalledDetails): void {
  if (details.reason !== "update") return;
  chrome.scripting.unregisterContentScripts({ ids: [MAIN_WORLD_PROVIDER_SCRIPT_ID] }, () => {
    if (chrome.runtime.lastError) {
      void recordProviderDiagnostic("provider-registration:refresh-skipped", {
        detail: chrome.runtime.lastError.message,
      });
      return;
    }
    void recordProviderDiagnostic("provider-registration:refresh-reload", {
      detail: `updated:${details.previousVersion ?? "unknown"}->${extensionVersion()}`,
    });
    chrome.runtime.reload();
  });
}

chrome.runtime.onInstalled.addListener((details) => {
  void getPendingProviderRequests();
  void getStoredProviderResponses();
  void recordProviderDiagnostic("extension:installed", { detail: details.reason });
  refreshMainWorldProviderAfterUpdate(details);
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

  const respondFromPort = (requestId: string) => async (response: ProviderResponse) => {
    if (responded) return;
    responded = true;
    await storeProviderResponse(requestId, response);
    try {
      postProviderResponse(port, requestId, response);
    } catch {
      // The relay polls the stored response when the live port is gone.
    }
  };

  port.onMessage.addListener((message) => {
    if (message?.kind !== "qubitor:provider-request" || !message.requestId) return;
    activeRequestId = message.requestId as string;
    void handleProviderRequest(message as ProviderRequestMessage, respondFromPort(activeRequestId));
  });

  port.onDisconnect.addListener(() => {
    if (!responded && activeRequestId) {
      const pending = pendingRequests.get(activeRequestId);
      if (pending) {
        pendingRequests.set(activeRequestId, { ...pending, respond: undefined });
      }
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "qubitor:ping") {
    sendResponse({ ok: true, build: "shell", version: extensionVersion() });
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
  if (message?.kind === "qubitor:get-provider-response") {
    void readProviderResponse(message.requestId as string).then((entry) => {
      sendResponse({ ok: Boolean(entry), response: entry?.response });
    });
    return true;
  }
  if (message?.kind === "qubitor:get-provider-diagnostics") {
    chrome.storage.local.get(PROVIDER_DIAGNOSTICS_KEY, (items) => {
      sendResponse({ ok: true, diagnostics: items[PROVIDER_DIAGNOSTICS_KEY] ?? [] });
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
