import { verifyMLDSA65 } from "@qubitor/pq-crypto";
import type { Hex } from "@qubitor/core";
import {
  deriveQubitorPQAccountAddress,
  defaultQubitorFaucetUrl,
  defaultQubitorIndexerUrl,
  defaultQubitorPQRelayerUrl,
  defaultQubitorRpcUrl,
  generateMLDSA65KeyPair,
  hashQubitorPQTxV1,
  qubitorDevnet,
  qubitorTestnet,
  QUBITOR_DEVNET_CHAIN_ID,
  QUBITOR_PQ_TX_CONTEXT,
  QUBITOR_PQ_TX_TYPE_HEX,
  QUBITOR_TESTNET_CHAIN_ID,
  QUBITOR_TESTNET_EXPLORER_URL,
  QUBITOR_TESTNET_FAUCET_URL,
  QUBITOR_TESTNET_INDEXER_URL,
  QUBITOR_TESTNET_PQ_RELAYER_URL,
  QUBITOR_TESTNET_RPC_URL,
  serializeQubitorPQTxV1,
  signQubitorPQTxV1,
  explorerAddressUrl,
  explorerProofUrl,
  submitQubitorDevPQRawTransaction,
} from "./index";

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function expectThrows(fn: () => unknown, message: string) {
  try {
    fn();
  } catch {
    return;
  }
  throw new Error(message);
}

const seed = new Uint8Array(32);
seed.fill(0x51);
const keypair = generateMLDSA65KeyPair(seed);

const unsigned = {
  chainId: QUBITOR_DEVNET_CHAIN_ID,
  nonce: 4n,
  gasTipCap: 1n,
  gasFeeCap: 10n,
  gas: 50_000n,
  factorySalt: "0x0000000000000000000000000000000000000000000000000000000000000042" as Hex,
  to: "0x000000000000000000000000000000000000dEaD" as Hex,
  value: 123n,
  data: "0x010203" as Hex,
  accessList: [
    {
      address: "0x0000000000000000000000000000000000000100" as Hex,
      storageKeys: ["0x0000000000000000000000000000000000000000000000000000000000000001" as Hex],
    },
  ],
  pqPublicKey: keypair.publicKey,
};

const signed = signQubitorPQTxV1({ ...unsigned, pqPrivateKey: keypair.privateKey });
const account = deriveQubitorPQAccountAddress(keypair.publicKey, unsigned.factorySalt);

expect(signed.transaction.account === account, "account must be derived from the public key and salt");
expect(signed.signingHash === hashQubitorPQTxV1(unsigned), "signing hash must match the unsigned tx");
expect(signed.rawTransaction.startsWith(QUBITOR_PQ_TX_TYPE_HEX), "raw tx must use Qubitor typed transaction 0x04");
expect(
  signed.rawTransaction === serializeQubitorPQTxV1(signed.transaction),
  "raw tx must serialize the signed envelope deterministically",
);
expect(
  verifyMLDSA65(signed.signature, signed.signingHash, keypair.publicKey, { context: QUBITOR_PQ_TX_CONTEXT }),
  "signature must verify against the QubitorPQTxV1 hash",
);
expect(
  hashQubitorPQTxV1({ ...unsigned, chainId: 91338 }) !== signed.signingHash,
  "chain ID must be domain separated into the signing hash",
);
expect(defaultQubitorRpcUrl(QUBITOR_TESTNET_CHAIN_ID) === QUBITOR_TESTNET_RPC_URL, "testnet RPC default must be live public RPC");
expect(
  defaultQubitorFaucetUrl(QUBITOR_TESTNET_CHAIN_ID) === QUBITOR_TESTNET_FAUCET_URL,
  "testnet faucet default must share the live public origin",
);
expect(
  defaultQubitorPQRelayerUrl(QUBITOR_TESTNET_CHAIN_ID) === QUBITOR_TESTNET_PQ_RELAYER_URL,
  "testnet PQ relayer default must share the live public origin",
);
{
  const expectedHash = `0x${"12".repeat(32)}` as Hex;
  const originalFetch = globalThis.fetch;
  let rpcSubmitSeen = false;
  let relayerSeen = false;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("/pq-dev/send-raw")) relayerSeen = true;
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};
    if (url === QUBITOR_TESTNET_RPC_URL && body.method === "qubitor_sendRawPQTransaction") {
      rpcSubmitSeen = true;
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, result: expectedHash }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`unexpected fetch ${url}`);
  }) as typeof fetch;
  try {
    const receipt = await submitQubitorDevPQRawTransaction("0x04", { chainId: QUBITOR_TESTNET_CHAIN_ID });
    expect(receipt.transactionHash === expectedHash, "public testnet PQ submit must return RPC transaction hash");
    expect(receipt.status === "pending", "public testnet RPC submit must return pending receipt status");
    expect(rpcSubmitSeen, "public testnet PQ submit must call qubitor_sendRawPQTransaction");
    expect(!relayerSeen, "public testnet PQ submit must not call /pq-dev/send-raw before RPC");
  } finally {
    globalThis.fetch = originalFetch;
  }
}
expect(
  defaultQubitorIndexerUrl(QUBITOR_TESTNET_CHAIN_ID) === QUBITOR_TESTNET_INDEXER_URL,
  "testnet indexer default must route through Explorer Lite",
);
expect(
  qubitorTestnet.blockExplorers?.default.url === QUBITOR_TESTNET_EXPLORER_URL,
  "testnet explorer must point at the public explorer",
);
expect(
  explorerAddressUrl(account, QUBITOR_TESTNET_CHAIN_ID) === `${QUBITOR_TESTNET_EXPLORER_URL}/address/${account}`,
  "address explorer links must use the public explorer",
);
expect(
  explorerProofUrl(`pq-accounts/${account}`, QUBITOR_TESTNET_CHAIN_ID) ===
    `${QUBITOR_TESTNET_EXPLORER_URL}/proofs/pq-accounts/${account}`,
  "proof explorer links must use the public explorer proofs path",
);
expect(
  qubitorDevnet.blockExplorers?.default.url === "http://127.0.0.1:18547",
  "devnet explorer must remain local",
);
expectThrows(
  () => signQubitorPQTxV1({ ...unsigned, pqPublicKey: "0x1234", pqPrivateKey: keypair.privateKey }),
  "invalid ML-DSA public keys must be rejected before serialization",
);
expectThrows(
  () =>
    signQubitorPQTxV1({
      ...unsigned,
      account: "0x1234567890123456789012345678901234567890",
      pqPrivateKey: keypair.privateKey,
    }),
  "mismatched account binding must be rejected before serialization",
);

console.log("[qubitor-evm] QubitorPQTxV1 encoder ok");
