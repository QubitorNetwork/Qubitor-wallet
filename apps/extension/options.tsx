import "./style.css";
import { useEffect, useState } from "react";
import { Wallet, AppWindow, Code2, type LucideIcon } from "lucide-react";
import { WalletShell } from "./components/WalletShell";
import { ConnectedApps } from "./options/ConnectedApps";
import { DeveloperMode } from "./options/DeveloperMode";

type Page = "wallet" | "connected-apps" | "developer-mode";

const NAV: { page: Page; label: string; Icon: LucideIcon }[] = [
  { page: "wallet", label: "Wallet", Icon: Wallet },
  { page: "connected-apps", label: "Connected apps", Icon: AppWindow },
  { page: "developer-mode", label: "Developer Mode", Icon: Code2 },
];

function readPage(): Page {
  if (typeof window === "undefined") return "wallet";
  const p = new URLSearchParams(window.location.search).get("page");
  if (p === "developer-mode" || p === "connected-apps" || p === "wallet") return p;
  return "wallet";
}

export default function Options() {
  const [page, setPage] = useState<Page>(readPage);

  useEffect(() => {
    const handle = () => setPage(readPage());
    window.addEventListener("popstate", handle);
    return () => window.removeEventListener("popstate", handle);
  }, []);

  const navigate = (next: Page) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", next);
    window.history.pushState({}, "", url);
    setPage(next);
  };

  return (
    <div className="min-h-screen bg-background text-text font-sans flex">
      <aside className="w-60 border-r border-divider p-4 space-y-1 sticky top-0 self-start">
        <div className="px-2 py-3 text-lg font-bold">Quanta</div>
        {NAV.map(({ page: p, label, Icon }) => {
          const active = page === p;
          return (
            <button
              key={p}
              onClick={() => navigate(p)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active ? "bg-surface text-text" : "text-text-muted hover:bg-surface hover:text-text"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </aside>

      <main className="flex-1 max-w-3xl p-8">
        {page === "wallet" ? (
          <div className="max-w-md">
            <WalletShell />
          </div>
        ) : null}
        {page === "connected-apps" ? <ConnectedApps /> : null}
        {page === "developer-mode" ? <DeveloperMode /> : null}
      </main>
    </div>
  );
}
