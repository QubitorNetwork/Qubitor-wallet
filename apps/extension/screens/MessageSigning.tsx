import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { WarningCard } from "../components/WarningCard";

/** Honest state — this modal is opened by the injected provider via
 *  tabs/request.html?type=sign, but the request payload (origin, typed data,
 *  domain) is not yet forwarded from the provider to this window in this
 *  build. So it does NOT fabricate an app, a permit, or a raw payload.
 *  The extension holds its own ML-DSA vault; wiring dapp requests to it for
 *  PQ signing is a deferred follow-up. */
export function MessageSigning({
  onReject,
}: {
  type?: string;
  origin?: string;
  appName?: string;
  onReject?: () => void;
  onApprove?: () => void;
}) {
  const close = onReject ?? (() => window.close());

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      <div className="max-w-md mx-auto p-page py-8 space-y-5">
        <header>
          <h1 className="text-page-title font-bold leading-pageTitle">Sign request</h1>
        </header>

        <WarningCard
          severity="info"
          title="Signature decoding not wired yet"
          detail="The injected provider opens this window, but the message payload (origin, typed data, domain, permit details) isn't forwarded to it in this build. No request is shown because none is being faked."
        />

        <Card>
          <div className="text-sm text-text-muted">
            When provider→window plumbing lands, this screen will show the requesting origin, a decoded
            human-readable summary, permit/allowance warnings, and the raw payload — all from the real
            request. Signing is then PQ-validated by your Quanta Account on Qubitor.
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
