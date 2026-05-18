import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { WarningCard } from "../components/WarningCard";

/** Honest state — opened by the injected provider via
 *  tabs/request.html?type=connect, but the requesting origin and requested
 *  permissions are not forwarded to this window in this build. It does NOT
 *  fabricate an app, domain, or permission set. */
export function DappConnection({
  onReject,
}: {
  origin?: string;
  appName?: string;
  verified?: boolean;
  onReject?: () => void;
  onLimited?: () => void;
  onConnect?: () => void;
}) {
  const close = onReject ?? (() => window.close());

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      <div className="max-w-md mx-auto p-page py-8 space-y-5">
        <header>
          <h1 className="text-page-title font-bold leading-pageTitle">Connect request</h1>
        </header>

        <WarningCard
          severity="info"
          title="Connection details not wired yet"
          detail="The injected provider opens this window, but the requesting origin and requested permissions aren't forwarded to it in this build. Nothing is shown because no app/permission set is being faked."
        />

        <Card>
          <div className="text-sm text-text-muted">
            When provider→window plumbing lands, this screen will show the real requesting domain, its
            verification status, the requested account/chain, and the exact permission scope before you
            approve. Connections are stored and revocable under Connected apps.
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
