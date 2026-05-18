import "./style.css";
import { AppWindow, Code2 } from "lucide-react";
import { WalletShell } from "./components/WalletShell";

/** The popup is the compact standalone Quanta Wallet: it holds its own
 *  encrypted ML-DSA vault (chrome.storage.local), unlocks in memory only, and
 *  signs Qubitor PQ transactions itself. Full management (connected apps,
 *  developer mode) lives on the options page. */
function openOptions(page: string) {
  const url = chrome.runtime.getURL(`options.html?page=${page}`);
  chrome.tabs?.create?.({ url });
}

export default function Popup() {
  return (
    <div className="w-[380px] min-h-[520px] bg-qb-black text-qb-bone font-sans">
      <WalletShell />
      <div className="flex items-center justify-between px-5 py-3 border-t border-qb-line">
        <button
          className="inline-flex items-center gap-1.5 text-xs text-qb-mist hover:text-qb-bone"
          onClick={() => openOptions("connected-apps")}
        >
          <AppWindow size={13} /> Connected apps
        </button>
        <button
          className="inline-flex items-center gap-1.5 text-xs text-qb-mist hover:text-qb-bone"
          onClick={() => openOptions("developer-mode")}
        >
          <Code2 size={13} /> Developer
        </button>
      </div>
    </div>
  );
}
