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
  params?: unknown[];
}

interface ProviderBridgeResponse {
  source?: string;
  requestId?: string;
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

function nextRequestId(): string {
  const random = Math.random().toString(16).slice(2);
  return `qubitor-${Date.now().toString(16)}-${random}`;
}

function requestThroughRelay(args: RequestArgs): Promise<unknown> {
  const requestId = nextRequestId();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onResponse);
      reject(new Error(`qubitor provider: ${args.method} timed out`));
    }, 600_000);

    function onResponse(event: MessageEvent<ProviderBridgeResponse>) {
      if (event.source !== window) return;
      const data = event.data;
      if (data?.source !== "qubitor:provider-response") return;
      if (data.requestId !== requestId) return;

      window.clearTimeout(timeout);
      window.removeEventListener("message", onResponse);

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
        params: args.params ?? [],
      },
      "*",
    );
  });
}

const listeners: ProviderListener[] = [];

const provider = {
  isQubitor: true,
  request: requestThroughRelay,
  on: (event: string, listener: (...args: unknown[]) => void) => {
    listeners.push({ event, listener });
    return provider;
  },
  removeListener: (event: string, listener: (...args: unknown[]) => void) => {
    const index = listeners.findIndex((entry) => entry.event === event && entry.listener === listener);
    if (index >= 0) listeners.splice(index, 1);
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
}
