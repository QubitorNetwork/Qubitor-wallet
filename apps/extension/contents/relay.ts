import type { PlasmoCSConfig } from "plasmo";

/**
 * ISOLATED-world relay.
 *
 * The injected provider runs in MAIN world and cannot call chrome.* APIs.
 * It postMessages to the page; this relay forwards EIP-1193 requests to the
 * background service worker and posts the eventual response back to the page.
 */

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start",
};

interface ProviderBridgeRequest {
  source?: string;
  kind?: string;
  requestId?: string;
  origin?: string;
  method?: string;
  params?: unknown[];
}

interface ProviderBridgeResponse {
  source?: string;
  requestId?: string;
  result?: unknown;
  error?: { code: number; message: string };
}

const activeRequests = new Map<
  string,
  (response: { result?: unknown; error?: { code: number; message: string } }) => void
>();

function injectMainWorldProvider() {
  const source = `(${function installQuantaProvider() {
    if ((window as unknown as { __quantaWalletProviderInstalled?: boolean }).__quantaWalletProviderInstalled) return;
    (window as unknown as { __quantaWalletProviderInstalled?: boolean }).__quantaWalletProviderInstalled = true;

    const CHAIN_ID_HEX = "0x164ca";
    const NETWORK_VERSION = "91338";
    const listeners: Array<{ event: string; listener: (...args: unknown[]) => void }> = [];
    const providerState = {
      accounts: [] as string[],
      connected: false,
    };

    function nextRequestId(): string {
      const random = Math.random().toString(16).slice(2);
      return `qubitor-${Date.now().toString(16)}-${random}`;
    }

    function normalizeParams(params: unknown): unknown[] {
      if (Array.isArray(params)) return params;
      if (params === undefined) return [];
      return [params];
    }

    function requestThroughRelay(args: { method: string; params?: unknown }): Promise<unknown> {
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

        function onResponse(event: MessageEvent) {
          if (event.source !== window) return;
          const data = event.data as {
            source?: string;
            requestId?: string;
            error?: { code: number; message: string };
            result?: unknown;
          };
          if (!data || data.requestId !== requestId) return;

          if (data.source === "qubitor:provider-status") {
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

          if (data.source !== "qubitor:provider-response") return;
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

    async function request(args: { method: string; params?: unknown }): Promise<unknown> {
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

    function jsonRpcResponse(payload: { id?: string | number | null; jsonrpc?: string }, result: unknown) {
      return {
        id: payload.id,
        jsonrpc: payload.jsonrpc ?? "2.0",
        result,
      };
    }

    function jsonRpcErrorResponse(payload: { id?: string | number | null; jsonrpc?: string }, error: Error & { code?: number }) {
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
      isQuanta: true,
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
        methodOrPayload: string | { id?: string | number | null; jsonrpc?: string; method: string; params?: unknown },
        paramsOrCallback?: unknown[] | Record<string, unknown> | ((error: (Error & { code?: number }) | null, response?: unknown) => void),
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
      sendAsync: (
        payload: { id?: string | number | null; jsonrpc?: string; method: string; params?: unknown },
        callback: (error: (Error & { code?: number }) | null, response?: unknown) => void,
      ) => {
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

    try {
      Object.defineProperty(window, "qubitor", {
        value: provider,
        writable: false,
        configurable: true,
      });
    } catch {
      (window as unknown as { qubitor?: unknown }).qubitor = provider;
    }
    if (!("ethereum" in window)) {
      try {
        Object.defineProperty(window, "ethereum", {
          value: provider,
          writable: false,
          configurable: true,
        });
      } catch {
        (window as unknown as { ethereum?: unknown }).ethereum = provider;
      }
    }
    window.addEventListener("eip6963:requestProvider", announceProvider);
    announceProvider();
    window.setTimeout(() => {
      void request({ method: "eth_accounts" }).catch(() => undefined);
    }, 0);
  }.toString()})();`;

  const script = document.createElement("script");
  script.textContent = source;
  const target = document.documentElement || document.head || document.body;
  if (!target) return;
  target.appendChild(script);
  script.remove();
}

try {
  injectMainWorldProvider();
} catch {
  // The relay still handles requests from the packaged MAIN-world provider.
}

chrome.runtime.onMessage.addListener((message: ProviderBridgeResponse) => {
  if (message?.source !== "qubitor:provider-response" || !message.requestId) return false;
  const settle = activeRequests.get(message.requestId);
  if (!settle) return false;
  settle({ result: message.result, error: message.error });
  return false;
});

window.addEventListener("message", (event: MessageEvent<ProviderBridgeRequest>) => {
  if (event.source !== window) return;
  const data = event.data;
  if (data?.source !== "qubitor:provider") return;
  if (data.kind !== "request" || !data.requestId || !data.method || !data.origin) return;
  const requestId = data.requestId;

  const postStatus = (phase: string, error?: { code: number; message: string }) => {
    window.postMessage(
      {
        source: "qubitor:provider-status",
        requestId,
        phase,
        error,
      },
      "*",
    );
  };

  postStatus("relay-received");

  let port: chrome.runtime.Port;
  try {
    port = chrome.runtime.connect({ name: "qubitor:provider" });
    postStatus("runtime-connected");
  } catch (error) {
    postStatus("runtime-connect-failed", {
      code: 4900,
      message: error instanceof Error ? error.message : "Could not connect to Quanta Wallet extension runtime.",
    });
    return;
  }
  let settled = false;
  let pollId: number | undefined;
  let timeoutId: number | undefined;
  let ensureId: number | undefined;
  let ensureDelayId: number | undefined;

  const settle = (response: { result?: unknown; error?: { code: number; message: string } }) => {
    if (settled) return;
    settled = true;
    activeRequests.delete(requestId);
    if (pollId !== undefined) window.clearInterval(pollId);
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    if (ensureId !== undefined) window.clearInterval(ensureId);
    if (ensureDelayId !== undefined) window.clearTimeout(ensureDelayId);
    try {
      port.disconnect();
    } catch {
      // The background worker may already have closed the port after posting.
    }
    window.postMessage(
      {
        source: "qubitor:provider-response",
        requestId,
        result: response.result,
        error: response.error,
      },
      "*",
    );
  };

  activeRequests.set(requestId, settle);

  const ensureRequestWindow = () => {
    chrome.runtime.sendMessage({ kind: "qubitor:ensure-request-window", requestId }, () => {
      if (chrome.runtime.lastError) {
        // The stored response path still handles normal completion; this nudge
        // is only to prevent bridge UIs from waiting on a hidden/missed popup.
      }
    });
  };

  const pollStoredResponse = () => {
    chrome.runtime.sendMessage(
      { kind: "qubitor:get-provider-response", requestId },
      (response: { ok?: boolean; response?: { result?: unknown; error?: { code: number; message: string } } }) => {
        if (settled || chrome.runtime.lastError || !response?.response) return;
        settle(response.response);
      },
    );
  };

  port.onMessage.addListener((response) => {
    if (response?.source !== "qubitor:provider-response" || response.requestId !== requestId) return;
    settle({ result: response.result, error: response.error });
  });

  port.onDisconnect.addListener(() => {
    if (!settled) pollStoredResponse();
  });

  pollId = window.setInterval(pollStoredResponse, 500);
  ensureDelayId = window.setTimeout(ensureRequestWindow, 900);
  ensureId = window.setInterval(ensureRequestWindow, 5_000);
  timeoutId = window.setTimeout(() => {
    settle({
      error: {
        code: 5000,
        message: "Qubitor extension request timed out before the wallet returned a decision.",
      },
    });
  }, 590_000);

  try {
    port.postMessage({
      kind: "qubitor:provider-request",
      requestId,
      origin: data.origin,
      method: data.method,
      params: data.params ?? [],
    });
    postStatus("request-posted");
  } catch (error) {
    settle({
      error: {
        code: 4900,
        message: error instanceof Error ? error.message : "Could not post request to Quanta Wallet extension runtime.",
      },
    });
  }
});
