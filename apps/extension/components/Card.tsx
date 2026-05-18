import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

/** Source: Qubitor Network — qb-panel with qb-line 1px hairline. */
export function Card({ children, className = "" }: Props) {
  return (
    <div className={`bg-qb-panel border border-qb-line rounded-lg p-4 ${className}`}>{children}</div>
  );
}
