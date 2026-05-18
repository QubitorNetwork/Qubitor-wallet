import type { ReactNode } from "react";
import { isDebugMode } from "@qubitor/core";

/** Renders children only when EXPO_PUBLIC_QUBITOR_DEBUG=1. */
export function DebugOnly({ children }: { children: ReactNode }) {
  if (!isDebugMode()) return null;
  return <>{children}</>;
}
