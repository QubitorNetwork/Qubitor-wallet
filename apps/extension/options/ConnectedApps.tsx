import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { summarizePermissions, type DappConnection, type Permission } from "@qubitor/wallet-policy";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";

interface StoredConnection {
  origin: string;
  hostname: string;
  connectedAt: number;
  lastUsedAt?: number;
  permissions: string[];
  compatibilityMode: boolean;
}

type StoredDappConnection = DappConnection & { origin: string };

function permissionFromStorage(permission: string): Permission | null {
  if (
    permission === "view-account" ||
    permission === "request-signatures" ||
    permission === "send-transactions" ||
    permission === "request-token-allowance" ||
    permission === "switch-chain"
  ) {
    return permission;
  }
  return null;
}

function storedToDapp(connection: StoredConnection): StoredDappConnection {
  return {
    id: connection.origin,
    origin: connection.origin,
    name: connection.hostname,
    domain: connection.hostname,
    verified: true,
    connectedAt: connection.connectedAt,
    lastUsedAt: connection.lastUsedAt,
    permissions: connection.permissions
      .map(permissionFromStorage)
      .filter((permission): permission is Permission => Boolean(permission))
      .map((permission) => ({ permission })),
    compatibilityMode: connection.compatibilityMode,
  };
}

function openRequest(type: "tx" | "sign" | "connect") {
  const url = chrome.runtime.getURL(`tabs/request.html?type=${type}`);
  chrome.windows?.create?.({ url, type: "popup", width: 420, height: 720 });
}

export function ConnectedApps() {
  const [connections, setConnections] = useState<StoredDappConnection[]>([]);

  const loadConnections = () => {
    chrome.runtime.sendMessage({ kind: "qubitor:get-connections" }, (response) => {
      if (!response?.ok) return;
      setConnections(Object.values((response.connections ?? {}) as Record<string, StoredConnection>).map(storedToDapp));
    });
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const disconnect = (origin: string) => {
    chrome.runtime.sendMessage({ kind: "qubitor:disconnect-origin", origin }, () => loadConnections());
  };

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold">Connected apps</h2>
        <p className="text-sm text-text-muted mt-1">Review permissions for every connected dapp.</p>
      </header>

      <div className="space-y-3">
        {connections.length === 0 ? (
          <Card>
            <p className="text-sm text-text-muted">No dapps are connected yet.</p>
          </Card>
        ) : null}
        {connections.map((c) => (
          <Card key={c.id}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-text-muted">{c.domain}</div>
              </div>
              <Badge label={c.verified ? "Verified" : "Unverified"} />
            </div>
            <div className="mt-3 text-sm text-text-muted">
              Permissions: {summarizePermissions(c.permissions)}
            </div>
            {c.compatibilityMode ? (
              <div className="mt-2">
                <Badge label="Compatibility Mode" />
              </div>
            ) : null}
            <div className="mt-4 flex gap-3">
              <Button variant="secondary" onClick={() => openRequest("connect")}>
                Edit <ChevronRight size={14} className="inline" />
              </Button>
              <Button variant="danger" onClick={() => disconnect(c.origin)}>
                Revoke
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
