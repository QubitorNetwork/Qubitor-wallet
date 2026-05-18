import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: "default" | "block";
}

/** Source: Qubitor Network — bone-filled primary, outlined secondary,
 *  transparent tertiary, crit-outlined danger. Pill, h-12. */
const containerClass: Record<Variant, string> = {
  primary: "bg-qb-bone text-qb-black hover:bg-qb-bone/90",
  secondary: "bg-transparent border border-qb-line-strong text-qb-bone hover:bg-qb-panel",
  tertiary: "bg-transparent text-qb-mist hover:text-qb-bone",
  danger: "bg-transparent border border-crit text-crit hover:bg-crit/10",
};

export function Button({ children, variant = "primary", size = "default", className = "", ...rest }: Props) {
  const widthClass = size === "block" ? "w-full" : "";
  return (
    <button
      className={`h-12 rounded-pill px-8 font-medium transition-colors disabled:opacity-40 ${containerClass[variant]} ${widthClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
