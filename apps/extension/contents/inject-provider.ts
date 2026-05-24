import type { PlasmoCSConfig } from "plasmo";

/**
 * EIP-1193 provider bridge.
 *
 * Requests are posted to the isolated relay, forwarded to the background
 * service worker, then resolved after either a read-only response or a user
 * decision in tabs/request.html.
 *
 * eth_sendTransaction is reviewed by the extension and submitted through the
 * Quanta Account PQ transaction path. The extension must not return mock EOA
 * signatures or raw classical transaction hashes.
 */

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start",
  world: "MAIN",
};

interface RequestArgs {
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

interface ProviderBridgeResponse {
  source?: string;
  requestId?: string;
  phase?: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

interface ProviderListener {
  event: string;
  listener: (...args: unknown[]) => void;
}

interface JsonRpcPayload {
  id?: string | number | null;
  jsonrpc?: string;
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

type JsonRpcCallback = (
  error: (Error & { code?: number }) | null,
  response?: {
    id?: string | number | null;
    jsonrpc: string;
    result?: unknown;
    error?: {
      code?: number;
      message: string;
    };
  },
) => void;

const CHAIN_ID_HEX = "0x164ca";
const NETWORK_VERSION = "91338";
const listeners: ProviderListener[] = [];
const providerState = {
  accounts: [] as string[],
  connected: false,
};

function nextRequestId(): string {
  const random = Math.random().toString(16).slice(2);
  return `qubitor-${Date.now().toString(16)}-${random}`;
}

function normalizeParams(params: RequestArgs["params"]): unknown[] {
  if (Array.isArray(params)) return params;
  if (params === undefined) return [];
  return [params];
}

function requestThroughRelay(args: RequestArgs): Promise<unknown> {
  const requestId = nextRequestId();

  return new Promise((resolve, reject) => {
    let relayAcknowledged = false;

    const cleanup = () => {
      window.clearTimeout(relayTimeout);
      window.clearTimeout(requestTimeout);
      window.removeEventListener("message", onResponse);
    };

    const relayTimeout = window.setTimeout(() => {
      if (relayAcknowledged) return;
      cleanup();
      const error = new Error(
        "Quanta Wallet extension relay did not respond. Reload the page after installing or updating the extension.",
      ) as Error & { code?: number };
      error.code = 4900;
      reject(error);
    }, 4_000);

    const requestTimeout = window.setTimeout(() => {
      cleanup();
      const error = new Error(`qubitor provider: ${args.method} timed out`) as Error & { code?: number };
      error.code = 5000;
      reject(error);
    }, 600_000);

    function onResponse(event: MessageEvent<ProviderBridgeResponse>) {
      if (event.source !== window) return;
      const data = event.data;
      if (!data || data.requestId !== requestId) return;

      if (data?.source === "qubitor:provider-status") {
        relayAcknowledged = true;
        window.clearTimeout(relayTimeout);
        if (data.error) {
          cleanup();
          const error = new Error(data.error.message) as Error & { code?: number };
          error.code = data.error.code;
          reject(error);
        }
        return;
      }

      if (data?.source !== "qubitor:provider-response") return;

      cleanup();

      if (data.error) {
        const error = new Error(data.error.message) as Error & { code?: number };
        error.code = data.error.code;
        reject(error);
        return;
      }
      resolve(data.result);
    }

    window.addEventListener("message", onResponse);
    window.postMessage(
      {
        source: "qubitor:provider",
        kind: "request",
        requestId,
        origin: window.location.origin,
        method: args.method,
        params: normalizeParams(args.params),
      },
      "*",
    );
  });
}

function normalizeAccounts(result: unknown): string[] {
  if (!Array.isArray(result)) return [];
  return result.filter((account): account is string => typeof account === "string" && account.startsWith("0x"));
}

function emit(event: string, ...args: unknown[]) {
  for (const entry of [...listeners]) {
    if (entry.event !== event) continue;
    try {
      entry.listener(...args);
    } catch (error) {
      window.setTimeout(() => {
        throw error;
      });
    }
  }
}

function accountsChanged(nextAccounts: string[]): boolean {
  if (providerState.accounts.length !== nextAccounts.length) return true;
  return providerState.accounts.some((account, index) => account.toLowerCase() !== nextAccounts[index]?.toLowerCase());
}

function setAccounts(accounts: string[], announce = true) {
  const nextAccounts = [...accounts];
  const changed = accountsChanged(nextAccounts);
  providerState.accounts = nextAccounts;
  provider.selectedAddress = nextAccounts[0] ?? null;
  provider._state.accounts = nextAccounts;
  provider._state.isUnlocked = true;
  if (nextAccounts.length > 0) {
    const wasConnected = providerState.connected;
    providerState.connected = true;
    provider._state.isConnected = true;
    if (!wasConnected && announce) emit("connect", { chainId: CHAIN_ID_HEX });
  }
  if (changed && announce) emit("accountsChanged", [...nextAccounts]);
}

function setDisconnected(announce = true) {
  const hadAccounts = providerState.accounts.length > 0;
  providerState.accounts = [];
  providerState.connected = false;
  provider.selectedAddress = null;
  provider._state.accounts = [];
  provider._state.isConnected = false;
  if (hadAccounts && announce) emit("accountsChanged", []);
  if (announce) emit("disconnect", { code: 4900, message: "Quanta Wallet disconnected." });
}

async function request(args: RequestArgs): Promise<unknown> {
  const result = await requestThroughRelay(args);
  const method = args.method;

  if (method === "eth_accounts" || method === "eth_requestAccounts") {
    setAccounts(normalizeAccounts(result));
  }
  if (method === "wallet_requestPermissions") {
    try {
      setAccounts(normalizeAccounts(await requestThroughRelay({ method: "eth_accounts" })));
    } catch {
      // Permission approval still succeeded; the next eth_accounts call can hydrate state.
    }
  }
  if (method === "wallet_revokePermissions") {
    setDisconnected();
  }
  if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") {
    provider.chainId = CHAIN_ID_HEX;
    provider.networkVersion = NETWORK_VERSION;
    emit("chainChanged", CHAIN_ID_HEX);
  }

  return result;
}

function jsonRpcResponse(payload: JsonRpcPayload, result: unknown) {
  return {
    id: payload.id,
    jsonrpc: payload.jsonrpc ?? "2.0",
    result,
  };
}

function jsonRpcErrorResponse(payload: JsonRpcPayload, error: Error & { code?: number }) {
  return {
    id: payload.id,
    jsonrpc: payload.jsonrpc ?? "2.0",
    error: {
      code: error.code,
      message: error.message,
    },
  };
}

const provider = {
  isQubitor: true,
  chainId: CHAIN_ID_HEX,
  networkVersion: NETWORK_VERSION,
  selectedAddress: null as string | null,
  _state: {
    accounts: [] as string[],
    initialized: true,
    isConnected: false,
    isUnlocked: true,
  },
  request,
  isConnected: () => true,
  enable: () => request({ method: "eth_requestAccounts" }),
  send: (
    methodOrPayload: string | JsonRpcPayload,
    paramsOrCallback?: unknown[] | Record<string, unknown> | JsonRpcCallback,
  ) => {
    if (typeof methodOrPayload === "string") {
      return request({
        method: methodOrPayload,
        params: typeof paramsOrCallback === "function" ? [] : paramsOrCallback,
      });
    }

    const payload = methodOrPayload;
    const callback = typeof paramsOrCallback === "function" ? paramsOrCallback : undefined;
    const promise = request({ method: payload.method, params: payload.params });
    if (!callback) return promise.then((result) => jsonRpcResponse(payload, result));

    promise
      .then((result) => callback(null, jsonRpcResponse(payload, result)))
      .catch((error: Error & { code?: number }) => callback(error, jsonRpcErrorResponse(payload, error)));
    return undefined;
  },
  sendAsync: (payload: JsonRpcPayload, callback: JsonRpcCallback) => {
    request({ method: payload.method, params: payload.params })
      .then((result) => callback(null, jsonRpcResponse(payload, result)))
      .catch((error: Error & { code?: number }) => callback(error, jsonRpcErrorResponse(payload, error)));
  },
  on: (event: string, listener: (...args: unknown[]) => void) => {
    listeners.push({ event, listener });
    return provider;
  },
  addListener: (event: string, listener: (...args: unknown[]) => void) => {
    listeners.push({ event, listener });
    return provider;
  },
  once: (event: string, listener: (...args: unknown[]) => void) => {
    const onceListener = (...args: unknown[]) => {
      provider.removeListener(event, onceListener);
      listener(...args);
    };
    listeners.push({ event, listener: onceListener });
    return provider;
  },
  removeListener: (event: string, listener: (...args: unknown[]) => void) => {
    const index = listeners.findIndex((entry) => entry.event === event && entry.listener === listener);
    if (index >= 0) listeners.splice(index, 1);
    return provider;
  },
  off: (event: string, listener: (...args: unknown[]) => void) => {
    provider.removeListener(event, listener);
    return provider;
  },
  removeAllListeners: (event?: string) => {
    if (!event) {
      listeners.splice(0, listeners.length);
      return provider;
    }
    for (let index = listeners.length - 1; index >= 0; index -= 1) {
      if (listeners[index]?.event === event) listeners.splice(index, 1);
    }
    return provider;
  },
};

if (typeof window !== "undefined") {
  const providerInfo = {
    uuid: "13f84186-d9f0-4a60-bb4f-a65d243c1f91",
    name: "Quanta Wallet",
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='%23050505'/><polygon points='32,8 39,25 56,32 39,39 32,56 25,39 8,32 25,25' fill='%23ededed'/><polygon points='32,14 36,28 50,32 36,36 32,50 28,36 14,32 28,28' fill='%23050505'/></svg>",
    rdns: "org.quanta.wallet",
  };

  function announceProvider() {
    window.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", {
        detail: Object.freeze({ info: providerInfo, provider }),
      }),
    );
  }

  Object.defineProperty(window, "qubitor", {
    value: provider,
    writable: false,
  });
  if (!("ethereum" in window)) {
    Object.defineProperty(window, "ethereum", {
      value: provider,
      writable: false,
    });
  }
  window.addEventListener("eip6963:requestProvider", announceProvider);
  announceProvider();
  window.setTimeout(() => {
    void request({ method: "eth_accounts" }).catch(() => undefined);
  }, 0);
}
