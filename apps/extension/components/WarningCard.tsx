import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { WarningSeverity } from "@qubitor/core";

interface Props {
  severity: WarningSeverity;
  title: string;
  detail?: string;
}

const accentClass: Record<WarningSeverity, string> = {
  info: "bg-qb-line-strong",
  review: "bg-warn",
  warning: "bg-warn",
  critical: "bg-crit",
};

const iconClass: Record<WarningSeverity, string> = {
  info: "text-qb-mist",
  review: "text-warn",
  warning: "text-warn",
  critical: "text-crit",
};

/** Source: Qubitor Network — qb-panel surface with a 2px left accent. */
export function WarningCard({ severity, title, detail }: Props) {
  const Icon = severity === "info" ? Info : severity === "critical" ? ShieldAlert : AlertTriangle;
  return (
    <div className="flex rounded-md overflow-hidden bg-qb-panel border border-qb-line">
      <div className={`w-1 ${accentClass[severity]}`} />
      <div className="flex gap-3 p-4 flex-1">
        <Icon size={20} className={`shrink-0 ${iconClass[severity]}`} />
        <div className="flex-1">
          <div className="text-sm font-semibold text-qb-bone">{title}</div>
          {detail ? <div className="text-xs text-qb-mist mt-1">{detail}</div> : null}
        </div>
      </div>
    </div>
  );
}
