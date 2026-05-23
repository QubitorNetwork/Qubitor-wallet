import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Row } from "../components/Row";
import { WarningCard } from "../components/WarningCard";
import type { PendingRequestDetails } from "../tabs/request";
import { useState } from "react";

function shortAddress(address?: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "No wallet";
}

export function DappConnection({
  origin,
  appName,
  request,
  loading,
  error,
  onReject,
  onLimited,
  onConnect,
}: {
  origin?: string;
  appName?: string;
  request?: PendingRequestDetails | null;
  loading?: boolean;
  error?: string | null;
  verified?: boolean;
  onReject?: () => void;
  onLimited?: (passcode?: string) => void;
  onConnect?: (passcode?: string) => void;
}) {
  const [passcode, setPasscode] = useState("");
  const close = onReject ?? (() => window.close());
  const host = request?.hostname ?? origin ?? appName ?? "Unknown site";
  const account = request?.account;
  const isCreating = !account;
  const canConnect = !loading && (Boolean(account) || passcode.length >= 8);
  const passcodeHelper = passcode.length >= 8
    ? "Ready to create your encrypted extension account."
    : `${Math.max(0, 8 - passcode.length)} more character${8 - passcode.length === 1 ? "" : "s"} needed.`;
  const accountValue = loading ? "Loading..." : account ? shortAddress(account) : "Will be created after approval";

  const connect = () => {
    if (!canConnect) return;
    onConnect?.(isCreating ? passcode : undefined);
  };

  const connectLimited = () => {
    if (!canConnect) return;
    onLimited?.(isCreating ? passcode : undefined);
  };

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      <div className="max-w-md mx-auto p-page py-8 space-y-5">
        <header className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-page-title font-bold leading-pageTitle">Connect request</h1>
            <Badge label={request?.connected ? "Connected" : "Review"} color={request?.connected ? "positive" : "neutral"} />
          </div>
          <p className="text-sm text-qb-mist">Allow this site to view your Quanta Account address on Qubitor Testnet.</p>
        </header>

        {error ? <WarningCard severity="warning" title="Request needs attention" detail={error} /> : null}
        {!account && !loading ? (
          <WarningCard
            severity="warning"
            title="No Quanta Account found"
            detail="Enter a new passcode to create this extension's standalone Quanta Account, or restore an existing Recovery Kit from the extension popup."
          />
        ) : null}

        <Card>
          <Row label="Site" value={host} />
          <Row label="Requested method" value={request?.method ?? "eth_requestAccounts"} />
          <Row label="Network" value={`Qubitor ${request?.chainIdHex ?? ""}`.trim()} />
          <Row label="Account" value={accountValue} last />
        </Card>

        <Card>
          <div className="text-sm font-semibold text-qb-bone">Permissions</div>
          <div className="mt-3 space-y-2 text-xs text-qb-mist">
            <div>View your Quanta Account address.</div>
            <div>Ask for transaction approval later. Every transaction still requires passcode approval.</div>
          </div>
        </Card>

        {isCreating ? (
          <Card>
            <label className="text-xs font-mono uppercase tracking-[0.22em] text-qb-mist" htmlFor="quanta-create-passcode">
              New wallet passcode
            </label>
            <input
              id="quanta-create-passcode"
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") connect();
              }}
              className="mt-3 h-12 w-full rounded-md border border-qb-line bg-qb-black px-4 text-qb-bone outline-none focus:border-qb-bone"
              placeholder="At least 8 characters"
              minLength={8}
              autoFocus
            />
            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <span className={passcode.length >= 8 ? "text-qb-bone" : "text-warn"}>{passcodeHelper}</span>
              <span className="font-mono text-qb-mist">{Math.min(passcode.length, 8)}/8</span>
            </div>
            <p className="mt-2 text-xs text-qb-mist">
              The ML-DSA key is encrypted locally in this browser extension. Plaintext keys are not stored.
            </p>
          </Card>
        ) : null}

        <div className="space-y-3 pt-2">
          <Button size="block" onClick={connect} disabled={!canConnect}>
            {isCreating && !canConnect ? "Enter passcode to create" : isCreating ? "Create and connect" : "Connect"}
          </Button>
          <Button
            variant="secondary"
            size="block"
            onClick={connectLimited}
            disabled={!canConnect}
          >
            {isCreating ? "Create view-only" : "Connect view-only"}
          </Button>
          <Button variant="tertiary" size="block" onClick={close}>
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
