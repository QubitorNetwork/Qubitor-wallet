/**
 * Background service worker.
 *
 * Hosts the request-modal opener: when a content-script relay forwards a
 * provider event, this opens tabs/request.html?type=... in a popup-shaped
 * window so the user sees the matching modal screen.
 *
 * Qubitor is PQ-native only: classical EOA signing and eth_sendTransaction are
 * disabled until dapps use QubitorPQTxV1-compatible submission.
 */

import { QUBITOR_TESTNET_CHAIN_ID, defaultQubitorRpcUrl, supportedChainId } from "@qubitor/evm";

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
  accountAddress?: string;
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
  respond: (response: ProviderResponse) => void;
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
  const previewAddress = (await getExtensionWalletRecord())?.preview?.accountAddress;
  return previewAddress?.startsWith("0x") ? previewAddress : undefined;
}

async function connectedAccountResult(origin: string): Promise<string[]> {
  if (!(await hasConnection(origin))) return [];
  const account = await currentAccountAddress();
  return account ? [account] : [];
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

async function resolvePendingRequest(message: ResolveRequestMessage) {
  const pending = pendingRequests.get(message.requestId);
  if (!pending) return;
  pendingRequests.delete(message.requestId);

  if (message.decision === "reject") {
    pending.respond(providerError(4001, "User rejected the Qubitor request."));
    return;
  }

  if (pending.method === "eth_requestAccounts") {
    const account = await currentAccountAddress();
    if (!account) {
      pending.respond(providerError(4100, "Unlock Quanta Wallet before connecting this site."));
      return;
    }
    await setConnection(
      pending.origin,
      message.decision === "limited" ? ["view-account", "limited"] : ["view-account", "request-signatures"],
    );
    pending.respond({ result: [account] });
    return;
  }

  if (pending.method === "wallet_requestPermissions") {
    await setConnection(
      pending.origin,
      message.decision === "limited" ? ["view-account", "limited"] : ["view-account", "request-signatures"],
    );
    pending.respond({ result: [{ parentCapability: "eth_accounts", caveats: [] }] });
    return;
  }

  if (
    pending.method === "eth_sendTransaction" ||
    pending.method === "eth_sign" ||
    pending.method === "personal_sign" ||
    pending.method === "eth_signTypedData" ||
    pending.method === "eth_signTypedData_v4"
  ) {
    pending.respond(
      providerError(
        4100,
        "Quanta Wallet reviewed the request, but classical EOA signing and eth_sendTransaction are disabled. Use QubitorPQTxV1-compatible dapp flows.",
      ),
    );
    return;
  }

  pending.respond(providerError(-32601, `Qubitor provider does not support ${pending.method} yet.`));
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("[qubitor] extension installed");
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
    void resolvePendingRequest(message as ResolveRequestMessage).then(() => sendResponse({ ok: true }));
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
