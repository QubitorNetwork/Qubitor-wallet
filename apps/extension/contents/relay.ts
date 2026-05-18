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

window.addEventListener("message", (event: MessageEvent<ProviderBridgeRequest>) => {
  if (event.source !== window) return;
  const data = event.data;
  if (data?.source !== "qubitor:provider") return;
  if (data.kind !== "request" || !data.requestId || !data.method || !data.origin) return;

  chrome.runtime.sendMessage(
    {
      kind: "qubitor:provider-request",
      requestId: data.requestId,
      origin: data.origin,
      method: data.method,
      params: data.params ?? [],
    },
    (response) => {
      if (chrome.runtime.lastError) {
        window.postMessage(
          {
            source: "qubitor:provider-response",
            requestId: data.requestId,
            error: {
              code: 5000,
              message: chrome.runtime.lastError.message ?? "Qubitor extension relay failed.",
            },
          },
          "*",
        );
        return;
      }

      window.postMessage(
        {
          source: "qubitor:provider-response",
          requestId: data.requestId,
          result: response?.result,
          error: response?.error,
        },
        "*",
      );
    },
  );
});
