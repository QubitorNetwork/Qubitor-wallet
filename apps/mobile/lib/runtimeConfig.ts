import { QUBITOR_TESTNET_CHAIN_ID, supportedChainId } from "@qubitor/evm";

const INLINE_PUBLIC_ENV: Record<string, string | undefined> = {
  EXPO_PUBLIC_QUBITOR_ACCOUNT_ADDRESS: process.env.EXPO_PUBLIC_QUBITOR_ACCOUNT_ADDRESS,
  EXPO_PUBLIC_QUBITOR_CHAIN_ID: process.env.EXPO_PUBLIC_QUBITOR_CHAIN_ID,
  EXPO_PUBLIC_QUBITOR_RPC_URL: process.env.EXPO_PUBLIC_QUBITOR_RPC_URL,
  EXPO_PUBLIC_QUBITOR_FAUCET_URL: process.env.EXPO_PUBLIC_QUBITOR_FAUCET_URL,
  EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL: process.env.EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL,
};

export function readPublicEnv(name: string): string | undefined {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return INLINE_PUBLIC_ENV[name] ?? proc?.env?.[name];
}

export function configuredQubitorChainId() {
  return supportedChainId(readPublicEnv("EXPO_PUBLIC_QUBITOR_CHAIN_ID") ?? QUBITOR_TESTNET_CHAIN_ID);
}
