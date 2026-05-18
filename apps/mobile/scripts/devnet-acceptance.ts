import type { Hex } from "@qubitor/core";
import {
  QUBITOR_DEVNET_CHAIN_ID,
  defaultQubitorFaucetUrl,
  defaultQubitorPQRelayerUrl,
  defaultQubitorRpcUrl,
} from "@qubitor/evm";
import { runQubitorDevnetWalletAcceptance } from "../lib/qbtDevnetWalletFlow";

declare const process: {
  env: Record<string, string | undefined>;
  stderr: { write(message: string): void };
  exit(code?: number): never;
};

function env(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}

async function main() {
  const chainId = Number(env("EXPO_PUBLIC_QUBITOR_CHAIN_ID", String(QUBITOR_DEVNET_CHAIN_ID)));
  const result = await runQubitorDevnetWalletAcceptance({
    chainId,
    rpcUrl: env("EXPO_PUBLIC_QUBITOR_RPC_URL", defaultQubitorRpcUrl(chainId)),
    faucetUrl: env("EXPO_PUBLIC_QUBITOR_FAUCET_URL", defaultQubitorFaucetUrl(chainId)),
    pqRelayerUrl: env("EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL", defaultQubitorPQRelayerUrl(chainId)),
    target: env("QUBITOR_MOBILE_ACCEPTANCE_TARGET", "0x000000000000000000000000000000000000dEaD") as Hex,
    valueWei: env("QUBITOR_MOBILE_ACCEPTANCE_VALUE_WEI", "77777"),
  });

  console.log(`[qubitor-mobile-acceptance] account ${result.accountAddress}`);
  console.log(`[qubitor-mobile-acceptance] chain ${result.finalDisplay.chainName} (${result.finalDisplay.chainId})`);
  console.log(`[qubitor-mobile-acceptance] balance ${result.finalDisplay.balanceLabel}`);
  console.log(
    `[qubitor-mobile-acceptance] deployment ${result.finalDisplay.deploymentLabel} · ${result.finalDisplay.readinessLabel}`,
  );
  console.log(`[qubitor-mobile-acceptance] faucet tx ${result.faucetReceipt.hash}`);
  console.log(
    `[qubitor-mobile-acceptance] deploy tx ${result.deployReceipt.transactionHash ?? "already deployed"}`,
  );
  console.log(`[qubitor-mobile-acceptance] pq transfer tx ${result.transfer.receipt.transactionHash}`);
  console.log(`[qubitor-mobile-acceptance] nonce ${result.finalAccount.nonce}`);
  console.log(`[qubitor-mobile-acceptance] target delta ${result.targetDeltaWei.toString()} wei`);
  console.log("[qubitor-mobile-acceptance] ok");
}

main().catch((error) => {
  process.stderr.write(
    `[qubitor-mobile-acceptance] ${error instanceof Error ? error.message : "mobile acceptance failed"}\n`,
  );
  process.exit(1);
});
