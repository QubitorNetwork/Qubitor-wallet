import { useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Row } from "../components/Row";
import { WarningCard } from "../components/WarningCard";
import type { PendingRequestDetails } from "../tabs/request";

function shortAddress(address?: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "-";
}

function formatQbt(valueWei?: string) {
  if (!valueWei) return "0 QBT";
  try {
    const wei = BigInt(valueWei);
    const whole = wei / 10n ** 18n;
    const fraction = wei % 10n ** 18n;
    if (fraction === 0n) return `${whole.toString()} QBT`;
    const fractionText = fraction.toString().padStart(18, "0").slice(0, 6).replace(/0+$/, "");
    return `${whole.toString()}.${fractionText || "0"} QBT`;
  } catch {
    return `${valueWei} wei`;
  }
}

function dataLabel(data?: string) {
  if (!data || data === "0x") return "None";
  return `${data.slice(0, 10)}...${data.slice(-8)}`;
}

export function TransactionReview({
  origin,
  request,
  loading,
  error,
  onReject,
  onApprove,
}: {
  origin?: string;
  request?: PendingRequestDetails | null;
  loading?: boolean;
  error?: string | null;
  onReject?: () => void;
  onApprove?: (passcode: string) => void;
}) {
  const [passcode, setPasscode] = useState("");
  const tx = request?.transaction;
  const hasCalldata = Boolean(tx?.data && tx.data !== "0x");
  const canApprove = Boolean(tx && request?.account && request.connected && passcode.length >= 8 && !request.parseError);

  const warning = useMemo(() => {
    if (request?.parseError) return request.parseError;
    if (!request?.connected) return "Connect this site before approving transactions.";
    if (!request?.account) return "Create or restore a Quanta Wallet profile before approving transactions.";
    if (tx?.from && tx.from.toLowerCase() !== request.account.toLowerCase()) {
      return "The requested from address does not match your active Quanta Account.";
    }
    if (hasCalldata) return "This request includes contract calldata. Only approve if you trust this site and understand the action.";
    return null;
  }, [hasCalldata, request, tx]);

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      <div className="max-w-md mx-auto p-page py-8 space-y-5">
        <header className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-page-title font-bold leading-pageTitle">Review transaction</h1>
            <Badge label="PQ Native" color="positive" />
          </div>
          <p className="text-sm text-qb-mist">
            Quanta Wallet will sign this as a QubitorPQTxV1 smart-account execution, not as an EOA transaction.
          </p>
        </header>

        {loading ? <WarningCard severity="info" title="Loading request" detail="Reading the dapp transaction payload." /> : null}
        {warning ? <WarningCard severity="warning" title="Review carefully" detail={warning} /> : null}
        {error ? <WarningCard severity="critical" title="Could not sign" detail={error} /> : null}

        <Card>
          <Row label="Site" value={request?.hostname ?? origin ?? "Unknown"} />
          <Row label="Method" value={request?.method ?? "eth_sendTransaction"} />
          <Row label="From" value={shortAddress(tx?.from ?? request?.account)} />
          <Row label="To" value={shortAddress(tx?.to)} />
          <Row label="Amount" value={formatQbt(tx?.valueWei)} />
          <Row label="Calldata" value={dataLabel(tx?.data)} />
          <Row label="Network" value={`Qubitor ${request?.chainIdHex ?? ""}`.trim()} last />
        </Card>

        {hasCalldata ? (
          <Card>
            <div className="text-xs font-mono text-qb-mist break-all">{tx?.data}</div>
          </Card>
        ) : null}

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
            placeholder="Enter passcode"
            autoFocus
          />
        </Card>

        <div className="space-y-3 pt-2">
          <Button size="block" onClick={() => onApprove?.(passcode)} disabled={!canApprove}>
            Sign and send
          </Button>
          <Button variant="secondary" size="block" onClick={onReject}>
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
