import { badgeColorByState, type BadgeColor } from "@qubitor/ui-tokens";

interface Props {
  label: string;
  color?: BadgeColor;
}

const containerClass: Record<BadgeColor, string> = {
  positive: "bg-qb-bone text-qb-black",
  review: "bg-transparent border border-qb-spark text-qb-bone",
  warning: "bg-transparent border border-warn text-warn",
  neutral: "bg-transparent border border-qb-line-strong text-qb-mist",
};

export function Badge({ label, color }: Props) {
  const resolved = color ?? badgeColorByState[label] ?? "neutral";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-pill text-[11px] font-mono uppercase tracking-[0.22em] font-medium ${containerClass[resolved]}`}
    >
      {label}
    </span>
  );
}
