import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Row } from "../components/Row";
import { WarningCard } from "../components/WarningCard";
import type { PendingRequestDetails } from "../tabs/request";

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
  onLimited?: () => void;
  onConnect?: () => void;
}) {
  const close = onReject ?? (() => window.close());
  const host = request?.hostname ?? origin ?? appName ?? "Unknown site";
  const account = request?.account;
  const canConnect = Boolean(account) && !loading;

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
            detail="Create or restore a Quanta Wallet profile from the extension popup before connecting this site."
          />
        ) : null}

        <Card>
          <Row label="Site" value={host} />
          <Row label="Requested method" value={request?.method ?? "eth_requestAccounts"} />
          <Row label="Network" value={`Qubitor ${request?.chainIdHex ?? ""}`.trim()} />
          <Row label="Account" value={loading ? "Loading..." : shortAddress(account)} last />
        </Card>

        <Card>
          <div className="text-sm font-semibold text-qb-bone">Permissions</div>
          <div className="mt-3 space-y-2 text-xs text-qb-mist">
            <div>View your Quanta Account address.</div>
            <div>Ask for transaction approval later. Every transaction still requires passcode approval.</div>
          </div>
        </Card>

        <div className="space-y-3 pt-2">
          <Button size="block" onClick={onConnect} disabled={!canConnect}>
            Connect
          </Button>
          <Button variant="secondary" size="block" onClick={onLimited} disabled={!canConnect}>
            Connect view-only
          </Button>
          <Button variant="tertiary" size="block" onClick={close}>
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
