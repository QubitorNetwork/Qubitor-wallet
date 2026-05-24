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

  const settle = (response: { result?: unknown; error?: { code: number; message: string } }) => {
    if (settled) return;
    settled = true;
    activeRequests.delete(requestId);
    if (pollId !== undefined) window.clearInterval(pollId);
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
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
