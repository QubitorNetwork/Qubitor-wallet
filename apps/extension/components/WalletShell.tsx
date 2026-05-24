import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Copy,
  Droplet,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { chainConfig, type SupportedChainId } from "@qubitor/evm";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card } from "./Card";
import { Row } from "./Row";
import { WarningCard } from "./WarningCard";
import { QrCode } from "./QrCode";
import { useExtensionWallet } from "../lib/useExtensionWallet";
import { copyText } from "../lib/clipboard";

const SYSTEM_ADDRESSES = [
  { label: "ML-DSA-65 precompile", value: "0x0000000000000000000000000000000000000100" },
  { label: "SecurityModeRegistry", value: "0x0000000000000000000000000000000000000201" },
  { label: "AccountReadinessRegistry", value: "0x0000000000000000000000000000000000000202" },
  { label: "QubitorAccountFactory", value: "0x0000000000000000000000000000000000000203" },
];

type View = "home" | "send" | "receive" | "activity" | "recovery" | "security" | "bridge";

function shorten(addr?: string): string {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";
}

function explorerBase(chainId?: number): string | null {
  try {
    return chainId ? chainConfig(chainId as SupportedChainId).blockExplorers?.default.url ?? null : null;
  } catch {
    return null;
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-[0.18em] text-qb-mist">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full h-11 rounded-lg bg-qb-panel border border-qb-line px-3 text-sm text-qb-bone placeholder:text-qb-mist focus:border-qb-line-strong outline-none";

function Unlock({
  mode,
  onCreate,
  onUnlock,
  onRestore,
  busy,
}: {
  mode: "no-wallet" | "locked";
  onCreate: (p: string) => void;
  onUnlock: (p: string) => void;
  onRestore: (encoded: string, p: string) => void;
  busy: boolean;
}) {
  const [passcode, setPasscode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [kit, setKit] = useState("");
  const [tab, setTab] = useState<"primary" | "restore">("primary");
  const creating = mode === "no-wallet";

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xl font-semibold text-qb-bone">Quanta Wallet</div>
        <div className="text-sm text-qb-mist mt-1">
          {creating
            ? "Create a Quanta Account — a PQ-native Qubitor smart account with a normal 0x address."
            : "Unlock your Quanta Account. The passcode stays in memory only."}
        </div>
      </div>

      {tab === "primary" ? (
        <div className="space-y-3">
          <Field label="Passcode">
            <input
              className={inputClass}
              type="password"
              autoFocus
              value={passcode}
              placeholder="At least 8 characters"
              onChange={(e) => setPasscode(e.target.value)}
            />
          </Field>
          {creating ? (
            <Field label="Confirm passcode">
              <input
                className={inputClass}
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
          ) : null}
          <Button
            size="block"
            disabled={busy || passcode.length < 8 || (creating && passcode !== confirm)}
            onClick={() => (creating ? onCreate(passcode) : onUnlock(passcode))}
          >
            {busy ? "Working…" : creating ? "Create Quanta Account" : "Unlock"}
          </Button>
          <Button variant="tertiary" size="block" disabled={busy} onClick={() => setTab("restore")}>
            Restore from Recovery Kit
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="Recovery Kit JSON">
            <textarea
              className={`${inputClass} h-28 py-2 font-mono text-xs`}
              value={kit}
              placeholder="Paste the exported Recovery Kit"
              onChange={(e) => setKit(e.target.value)}
            />
          </Field>
          <Field label="Kit passcode">
            <input
              className={inputClass}
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          </Field>
          <Button
            size="block"
            disabled={busy || !kit || passcode.length < 8}
            onClick={() => onRestore(kit, passcode)}
          >
            {busy ? "Restoring…" : "Restore wallet"}
          </Button>
          <Button variant="tertiary" size="block" disabled={busy} onClick={() => setTab("primary")}>
            Back
          </Button>
        </div>
      )}
    </div>
  );
}

export function WalletShell() {
  const w = useExtensionWallet();
  const [view, setView] = useState<View>("home");
  const [copied, setCopied] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [kitText, setKitText] = useState<string | null>(null);

  const explorer = useMemo(() => explorerBase(w.snapshot?.chainId), [w.snapshot?.chainId]);

  const copy = async (text: string) => {
    if (!(await copyText(text))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (w.status === "loading") {
    return <div className="p-6 text-sm text-qb-mist">Loading Quanta Wallet…</div>;
  }

  if (w.status === "no-wallet" || w.status === "locked") {
    return (
      <div className="p-5">
        {w.error ? (
          <div className="mb-4">
            <WarningCard severity="warning" title="Could not continue" detail={w.error} />
          </div>
        ) : null}
        <Unlock
          mode={w.status}
          busy={w.busy}
          onCreate={w.createWallet}
          onUnlock={w.unlock}
          onRestore={w.restore}
        />
      </div>
    );
  }

  const snap = w.snapshot;

  const nav: { view: View; label: string; Icon: typeof ArrowUpRight }[] = [
    { view: "send", label: "Send", Icon: ArrowUpRight },
    { view: "receive", label: "Receive", Icon: ArrowDownLeft },
    { view: "security", label: "Security", Icon: ShieldCheck },
    { view: "recovery", label: "Recovery", Icon: KeyRound },
  ];

  return (
    <div className="p-5 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-base font-semibold text-qb-bone">Quanta Wallet</div>
          <div className="text-xs text-qb-mist">{snap?.chainName ?? "Qubitor Network"}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-qb-mist hover:text-qb-bone disabled:opacity-40"
            title="Refresh"
            disabled={w.busy}
            onClick={() => w.refresh()}
          >
            <RefreshCw size={16} />
          </button>
          <button className="text-qb-mist hover:text-qb-bone text-xs" onClick={() => w.lock()}>
            Lock
          </button>
        </div>
      </header>

      {w.error ? <WarningCard severity="warning" title="Action failed" detail={w.error} /> : null}

      {view === "home" ? (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-[0.18em] text-qb-mist">
                Quanta Account
              </span>
              <Badge label={snap?.readinessLabel ?? "PQ Native"} />
            </div>
            <div className="mt-2 text-2xl font-semibold text-qb-bone">
              {snap?.balanceLabel ?? "0 QBT"}
            </div>
            <button
              className="mt-1 inline-flex items-center gap-1.5 text-sm text-qb-mist hover:text-qb-bone"
              onClick={() => snap && copy(snap.address)}
            >
              {shorten(snap?.address)} <Copy size={13} />
            </button>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-qb-mist">
              <span>Block #{snap?.latestBlock ?? "—"}</span>
              <span>·</span>
              <span>{snap?.deploymentLabel ?? "Undeployed"}</span>
            </div>
          </Card>

          {snap && !snap.deployed ? (
            <WarningCard
              severity="info"
              title="Account not deployed yet"
              detail="The 0x address is reserved. Fund it from the faucet, then a send will deploy it."
            />
          ) : null}

          <div className="grid grid-cols-4 gap-2">
            {nav.map(({ view: v, label, Icon }) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="flex flex-col items-center gap-1.5 rounded-lg bg-qb-panel border border-qb-line py-3 text-qb-bone hover:border-qb-line-strong"
              >
                <Icon size={18} />
                <span className="text-[11px]">{label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" disabled={w.busy} onClick={() => w.faucet()}>
              <span className="inline-flex items-center gap-1.5">
                <Droplet size={14} /> Faucet
              </span>
            </Button>
            <Button variant="secondary" onClick={() => setView("activity")}>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} /> Activity
              </span>
            </Button>
            <Button variant="secondary" onClick={() => setView("bridge")}>
              <span className="inline-flex items-center gap-1.5">
                <Waypoints size={14} /> Bridge
              </span>
            </Button>
          </div>
        </div>
      ) : null}

      {view === "send" ? (
        <div className="space-y-3">
          <ViewTitle title="Send QBT" onBack={() => setView("home")} />
          <Field label="Recipient 0x address">
            <input
              className={inputClass}
              value={recipient}
              placeholder="0x…"
              onChange={(e) => setRecipient(e.target.value)}
            />
          </Field>
          <Field label="Amount (QBT)">
            <input
              className={inputClass}
              value={amount}
              inputMode="decimal"
              placeholder="0.0"
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Row label="From" value={shorten(snap?.address)} />
          <Row label="Network" value={snap?.chainName ?? "Qubitor Network"} last />
          <Button
            size="block"
            disabled={w.busy || !recipient || !amount}
            onClick={async () => {
              await w.send({ recipient, amount });
              setRecipient("");
              setAmount("");
              setView("activity");
            }}
          >
            {w.busy ? "Submitting PQ transaction…" : "Sign & send"}
          </Button>
          <div className="text-xs text-qb-mist">
            Signed locally with your ML-DSA key and submitted as a Qubitor PQ transaction. If the
            account is undeployed it is deployed first.
          </div>
        </div>
      ) : null}

      {view === "receive" ? (
        <div className="space-y-3">
          <ViewTitle title="Receive" onBack={() => setView("home")} />
          <div className="flex justify-center py-2">
            <QrCode value={snap?.address ?? ""} size={196} />
          </div>
          <button
            className="w-full text-center text-sm text-qb-bone break-all"
            onClick={() => snap && copy(snap.address)}
          >
            {snap?.address}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => snap && copy(snap.address)}>
              {copied ? "Copied" : "Copy address"}
            </Button>
            <Button variant="secondary" disabled={w.busy} onClick={() => w.faucet()}>
              Faucet QBT
            </Button>
          </div>
          <WarningCard
            severity="info"
            title="This is your Quanta Account address"
            detail="A normal 0x address on Qubitor Network, controlled by your post-quantum ML-DSA key."
          />
        </div>
      ) : null}

      {view === "activity" ? (
        <div className="space-y-2">
          <ViewTitle title="Activity" onBack={() => setView("home")} />
          {w.activity.length === 0 ? (
            <div className="text-sm text-qb-mist py-6 text-center">No activity yet.</div>
          ) : (
            w.activity.map((a) => (
              <Card key={a.id} className="!p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-qb-bone">{a.title}</span>
                  <Badge
                    label={a.status}
                    color={
                      a.status === "success"
                        ? "positive"
                        : a.status === "failed"
                          ? "warning"
                          : "neutral"
                    }
                  />
                </div>
                <div className="text-xs text-qb-mist mt-1">{a.detail}</div>
                {a.hash && explorer ? (
                  <a
                    className="text-xs text-qb-bone underline mt-1 inline-block"
                    href={`${explorer}/tx/${a.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on explorer
                  </a>
                ) : null}
              </Card>
            ))
          )}
        </div>
      ) : null}

      {view === "security" ? (
        <div className="space-y-2">
          <ViewTitle title="Security" onBack={() => setView("home")} />
          <Card>
            <Row label="Security mode" value={snap?.readinessLabel ?? "PQ Native"} />
            <Row label="Chain ID" value={String(snap?.chainId ?? "—")} />
            <Row label="Network" value={snap?.chainName ?? "Qubitor Network"} />
            <Row label="Deployment" value={snap?.deploymentLabel ?? "Undeployed"} last />
          </Card>
          <div className="text-xs font-mono uppercase tracking-[0.18em] text-qb-mist pt-1">
            Verified system contracts
          </div>
          <Card>
            {SYSTEM_ADDRESSES.map((s, i) => (
              <Row
                key={s.value}
                label={s.label}
                detail={s.value}
                value="✓"
                last={i === SYSTEM_ADDRESSES.length - 1}
              />
            ))}
          </Card>
          <WarningCard
            severity="info"
            title="Post-quantum native"
            detail="Every signing path uses ML-DSA-65. No legacy ECDSA fallback is active on this account."
          />
        </div>
      ) : null}

      {view === "recovery" ? (
        <div className="space-y-3">
          <ViewTitle title="Recovery" onBack={() => setView("home")} />
          <Card>
            <Row label="Key version" value={String(snap?.publicKeyCommitment ? "active" : "—")} />
            <Row
              label="Recovery Kit"
              detail="Passcode-encrypted backup of your ML-DSA profile"
              last
            />
          </Card>
          <Button
            size="block"
            variant="secondary"
            disabled={w.busy}
            onClick={async () => setKitText(await w.exportKit())}
          >
            Export Recovery Kit
          </Button>
          {kitText ? (
            <div className="space-y-2">
              <textarea
                readOnly
                className={`${inputClass} h-28 py-2 font-mono text-[10px]`}
                value={kitText}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => copy(kitText)}>
                  {copied ? "Copied" : "Copy kit"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const blob = new Blob([kitText], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "quanta-recovery-kit.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download
                </Button>
              </div>
            </div>
          ) : null}
          <Button size="block" variant="secondary" disabled={w.busy} onClick={() => w.rotate()}>
            {w.busy ? "Rotating…" : "Rotate PQ key"}
          </Button>
          <WarningCard
            severity="warning"
            title="Rotation keeps your address"
            detail="Only the ML-DSA key behind the account changes. The 0x address stays the same."
          />
          <Button
            size="block"
            variant="danger"
            disabled={w.busy}
            onClick={() => {
              if (
                confirm(
                  "Wipe this wallet and all connected-site approvals from the browser? This cannot be undone without a Recovery Kit.",
                )
              ) {
                w.wipe();
              }
            }}
          >
            Wipe wallet
          </Button>
        </div>
      ) : null}

      {view === "bridge" ? (
        <div className="space-y-3">
          <ViewTitle title="Bridge" onBack={() => setView("home")} />
          <Badge label="Coming soon" color="neutral" />
          <div className="text-sm text-qb-mist">
            A Qubitor↔external bridge is not available yet. This wallet only shows real on-chain
            capability — no routes, fees, amounts, or finalization status are simulated.
          </div>
          <Card>
            <Row label="Bridge service" value="Not available" />
            <Row label="Routes / fees" value="None shown" last />
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function ViewTitle({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-lg font-semibold text-qb-bone">{title}</span>
      <button className="text-xs text-qb-mist hover:text-qb-bone" onClick={onBack}>
        Back
      </button>
    </div>
  );
}
