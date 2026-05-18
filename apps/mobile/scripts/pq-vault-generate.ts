import type { Hex } from "@qubitor/core";
import {
  deployQubitorDevPQAccount,
  defaultQubitorFaucetUrl,
  defaultQubitorPQRelayerUrl,
  QUBITOR_TESTNET_CHAIN_ID,
  readQubitorDevPQAccount,
} from "@qubitor/evm";
import {
  createEphemeralQubitorDevnetWalletProfile,
  qubitorDevnetPQDeploymentRequest,
} from "../lib/qbtDevnetWalletFlow";

declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  stderr: { write(message: string): void };
  exit(code?: number): never;
};

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasArg(name: string): boolean {
  return process.argv.includes(name);
}

function env(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function shouldDeploy(): boolean {
  return hasArg("--deploy") || process.env.QUBITOR_WALLET_DEPLOY_PQ_VAULT === "1";
}

async function main() {
  const expectedChainId = Number(
    argValue("--chain-id") ?? env("EXPO_PUBLIC_QUBITOR_CHAIN_ID", String(QUBITOR_TESTNET_CHAIN_ID)),
  );
  const pqRelayerUrl =
    argValue("--pq-relayer-url") ??
    env("EXPO_PUBLIC_QUBITOR_PQ_RELAYER_URL", defaultQubitorPQRelayerUrl(expectedChainId));
  const faucetUrl =
    argValue("--faucet-url") ?? env("EXPO_PUBLIC_QUBITOR_FAUCET_URL", defaultQubitorFaucetUrl(expectedChainId));
  const deploy = shouldDeploy();
  const profile = createEphemeralQubitorDevnetWalletProfile();
  const request = qubitorDevnetPQDeploymentRequest(profile);
  let account = await readQubitorDevPQAccount(request, { chainId: expectedChainId, pqRelayerUrl });

  if (account.chainId !== expectedChainId) {
    throw new Error(`PQ relayer is on chain ${account.chainId}, expected ${expectedChainId}.`);
  }

  const deployReceipt = deploy
    ? await deployQubitorDevPQAccount(request, { chainId: expectedChainId, faucetUrl, pqRelayerUrl })
    : undefined;
  if (deployReceipt) {
    account = await readQubitorDevPQAccount(request, { chainId: expectedChainId, pqRelayerUrl });
  }

  const accountAddress = (deployReceipt?.accountAddress ?? account.accountAddress) as Hex;
  console.log(
    JSON.stringify(
      {
        format: "quanta.wallet.pq-vault-profile.v1",
        warning:
          "PRIVATE TESTNET WALLET MATERIAL. Store this output securely. The ML-DSA private key controls this Quanta Account.",
        chainId: account.chainId,
        pqRelayerUrl,
        faucetUrl,
        accountAddress,
        deployed: deployReceipt?.deployed ?? account.deployed,
        deploymentTransactionHash: deployReceipt?.transactionHash,
        deploymentPublicKey: profile.deploymentPublicKey,
        currentKey: profile.currentKey,
        salt: account.salt,
        publicKeyCommitment: account.publicKeyCommitment,
        env: {
          QUBITOR_FAUCET_TREASURY_VAULT: accountAddress,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  process.stderr.write(`[qubitor-pq-vault] ${error instanceof Error ? error.message : "vault generation failed"}\n`);
  process.exit(1);
});
