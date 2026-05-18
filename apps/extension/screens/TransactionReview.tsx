import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { WarningCard } from "../components/WarningCard";

/** Honest state — opened by the injected provider via
 *  tabs/request.html?type=tx, but the transaction payload (to, value, data,
 *  simulation) is not forwarded to this window in this build. It does NOT
 *  fabricate a transfer. The extension holds its own ML-DSA vault; wiring
 *  dapp transaction requests to it for review + PQ signing is a deferred
 *  follow-up. */
export function TransactionReview({
  onReject,
}: {
  origin?: string;
  onReject?: () => void;
  onApprove?: () => void;
}) {
  const close = onReject ?? (() => window.close());

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      <div className="max-w-md mx-auto p-page py-8 space-y-5">
        <header>
          <h1 className="text-page-title font-bold leading-pageTitle">Review request</h1>
        </header>

        <WarningCard
          severity="info"
          title="Transaction details not wired yet"
          detail="The injected provider opens this window, but the transaction (recipient, value, calldata) isn't forwarded to it in this build. No transfer is shown because none is being faked."
        />

        <Card>
          <div className="text-sm text-text-muted">
            When provider→window plumbing lands, this screen will show the real action, a live
            eth_estimateGas / eth_call simulation, the fee, and the asset movement before you confirm,
            then sign it with this wallet's own ML-DSA key as a Qubitor PQ transaction.
          </div>
        </Card>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" size="block" onClick={close}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
