import { useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Row } from "../components/Row";
import { WarningCard } from "../components/WarningCard";
import type { PendingRequestDetails } from "../tabs/request";

function payloadPreview(params?: unknown[]) {
  if (!params?.length) return "No payload";
  const encoded = JSON.stringify(params.length === 1 ? params[0] : params);
  return encoded.length > 180 ? `${encoded.slice(0, 180)}...` : encoded;
}

function isQubitorMethod(method?: string) {
  return method === "qubitor_signMessage" || method === "qubitor_signTypedData";
}

export function MessageSigning({
  origin,
  request,
  loading,
  error,
  onReject,
  onApprove,
}: {
  type?: string;
  origin?: string;
  appName?: string;
  request?: PendingRequestDetails | null;
  loading?: boolean;
  error?: string | null;
  onReject?: () => void;
  onApprove?: (passcode: string) => void;
}) {
  const [passcode, setPasscode] = useState("");
  const pqNative = isQubitorMethod(request?.method);

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      <div className="max-w-md mx-auto p-page py-8 space-y-5">
        <header className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-page-title font-bold leading-pageTitle">Sign request</h1>
            <Badge label={pqNative ? "PQ Native" : "Blocked"} color={pqNative ? "positive" : "warning"} />
          </div>
          <p className="text-sm text-qb-mist">
            {pqNative
              ? "Quanta Wallet will return an ML-DSA proof for this Qubitor-native signing request."
              : "Quanta Wallet does not return fake ECDSA signatures. Use qubitor_signMessage or qubitor_signTypedData."}
          </p>
        </header>

        {loading ? <WarningCard severity="info" title="Loading request" detail="Reading the dapp signing payload." /> : null}
        {!pqNative ? (
          <WarningCard
            severity="warning"
            title="EOA signature not supported"
            detail="This compatibility method expects a classical EOA signature. Quanta Wallet signs only PQ-native Qubitor messages."
          />
        ) : (
          <WarningCard
            severity="info"
            title="PQ message proof"
            detail="The response includes address, chain ID, algorithm, public key commitment, key version, message hash, and ML-DSA signature."
          />
        )}
        {error ? <WarningCard severity="critical" title="Request failed" detail={error} /> : null}

        <Card>
          <Row label="Site" value={request?.hostname ?? origin ?? "Unknown"} />
          <Row label="Method" value={request?.method ?? "personal_sign"} />
          <Row label="Network" value={`Qubitor ${request?.chainIdHex ?? ""}`.trim()} last />
        </Card>

        <Card>
          <div className="text-xs font-mono text-qb-mist break-all">{payloadPreview(request?.params)}</div>
        </Card>

        <Card>
          <label className="text-xs font-mono uppercase tracking-[0.22em] text-qb-mist" htmlFor="quanta-passcode">
            Wallet passcode
          </label>
          <input
            id="quanta-passcode"
            type="password"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            className="mt-3 h-12 w-full rounded-md border border-qb-line bg-qb-black px-4 text-qb-bone outline-none focus:border-qb-bone"
            placeholder={pqNative ? "Enter passcode" : "Not available for EOA methods"}
            disabled={!pqNative}
          />
        </Card>

        <div className="space-y-3 pt-2">
          <Button size="block" onClick={() => onApprove?.(passcode)} disabled={!pqNative || passcode.length < 8}>
            Sign PQ message
          </Button>
          <Button variant="secondary" size="block" onClick={onReject}>
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
