import "../style.css";
import { useEffect, useState } from "react";
import { DappConnection } from "../screens/DappConnection";
import { TransactionReview } from "../screens/TransactionReview";
import { MessageSigning } from "../screens/MessageSigning";

type RequestType = "connect" | "tx" | "sign";
type Decision = "approve" | "limited" | "reject";

interface RequestContext {
  type: RequestType;
  requestId?: string;
  origin?: string;
  method?: string;
}

function hostnameFromOrigin(origin?: string): string | undefined {
  if (!origin) return undefined;
  try {
    return new URL(origin).hostname;
  } catch {
    return origin;
  }
}

/** Plasmo "tab" entry. Loaded at chrome-extension://<id>/tabs/request.html?type=connect|tx|sign.
 *  The provider only opens approval UI for account connection until QubitorPQTxV1
 *  replaces classical transaction and message signing for Qubitor dapp flows. */
export default function Request() {
  const [context, setContext] = useState<RequestContext>({ type: "connect" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get("type") as RequestType | null;
    setContext({
      type: t === "connect" || t === "tx" || t === "sign" ? t : "connect",
      requestId: params.get("requestId") ?? undefined,
      origin: params.get("origin") ?? undefined,
      method: params.get("method") ?? undefined,
    });
  }, []);

  const resolve = (decision: Decision) => {
    if (!context.requestId) {
      window.close();
      return;
    }

    chrome.runtime.sendMessage(
      {
        kind: "qubitor:resolve-request",
        requestId: context.requestId,
        decision,
      },
      () => window.close(),
    );
  };

  const originHost = hostnameFromOrigin(context.origin);

  if (context.type === "tx") return <TransactionReview origin={originHost} onReject={() => resolve("reject")} onApprove={() => resolve("approve")} />;
  if (context.type === "sign") {
    return <MessageSigning origin={originHost} onReject={() => resolve("reject")} onApprove={() => resolve("approve")} />;
  }
  return (
    <DappConnection
      origin={originHost}
      appName={originHost}
      onReject={() => resolve("reject")}
      onLimited={() => resolve("limited")}
      onConnect={() => resolve("approve")}
    />
  );
}
