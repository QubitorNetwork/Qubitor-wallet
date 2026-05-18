import { Card } from "../components/Card";
import { Row } from "../components/Row";
import { WarningCard } from "../components/WarningCard";

const SYSTEM_ADDRESSES = [
  { label: "ML-DSA-65 precompile", value: "0x0000000000000000000000000000000000000100" },
  { label: "SecurityModeRegistry", value: "0x0000000000000000000000000000000000000201" },
  { label: "AccountReadinessRegistry", value: "0x0000000000000000000000000000000000000202" },
  { label: "QubitorAccountFactory", value: "0x0000000000000000000000000000000000000203" },
];

/** Honest state — the extension is now a standalone signer with its own
 *  encrypted ML-DSA vault. Live, account-specific values (address, deployment,
 *  security mode, balance, latest block) are shown in the Wallet tab once
 *  unlocked; this page lists only the fixed Qubitor system contracts. No
 *  fabricated per-account data. */
export function DeveloperMode() {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold">Developer Mode</h2>
        <p className="text-sm text-text-muted mt-1">Qubitor Network system contracts.</p>
      </header>

      <WarningCard
        severity="info"
        title="Live account values are in the Wallet tab"
        detail="Unlock the wallet (Wallet → Security) to see the live account address, deployment state, security mode, balance, and latest block from real RPC reads. This page lists only the fixed system contracts."
      />

      <Card>
        {SYSTEM_ADDRESSES.map((s, i) => (
          <Row
            key={s.value}
            label={s.label}
            detail={s.value}
            last={i === SYSTEM_ADDRESSES.length - 1}
          />
        ))}
      </Card>
    </div>
  );
}
