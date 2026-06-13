/**
 * @qubitor/evm
 *
 * viem helpers, address formatting, transaction decoding, chain config.
 * Qubitor wallet runtime is Qubitor-network-only; external EVM chains stay
 * out until their account-control path is PQ-native.
 */
import {
  concatHex,
  createPublicClient,
  defineChain,
  encodeAbiParameters,
  encodeFunctionData,
  getAddress,
  formatEther,
  formatUnits,
  http,
  isAddress,
  keccak256,
  numberToHex,
  parseUnits,
  parseAbi,
  stringToHex,
  toRlp,
} from "viem";
import type { Hex } from "@qubitor/core";
import {
  createPQAccount as sdkCreatePQAccount,
  createQubitorClient as sdkCreateQubitorClient,
  defaultQubitorRpcUrl as sdkDefaultQubitorRpcUrl,
  deriveQubitorPQAccountAddress as sdkDeriveQubitorPQAccountAddress,
  getAccountReadiness as sdkGetAccountReadiness,
  getAccountSecurityMode as sdkGetAccountSecurityMode,
  getQbtBalance as sdkGetQbtBalance,
  getSmartAccountDeploymentState as sdkGetSmartAccountDeploymentState,
  generateMLDSA65KeyPair as sdkGenerateMLDSA65KeyPair,
  hashQubitorPQTxV1 as sdkHashQubitorPQTxV1,
  qubitorDevnet as sdkQubitorDevnet,
  qubitorTestnet as sdkQubitorTestnet,
  sendPQTransaction as sdkSendPQTransaction,
  sendRawQubitorPQTxV1 as sdkSendRawQubitorPQTxV1,
  serializeQubitorPQTxV1 as sdkSerializeQubitorPQTxV1,
  signMLDSA65 as sdkSignMLDSA65,
  signPQTransaction as sdkSignPQTransaction,
  signQubitorPQTxV1 as sdkSignQubitorPQTxV1,
  QUBITOR_ACCOUNT_FACTORY as SDK_QUBITOR_ACCOUNT_FACTORY,
  QUBITOR_ACCOUNT_READINESS_REGISTRY as SDK_QUBITOR_ACCOUNT_READINESS_REGISTRY,
  QUBITOR_MLDSA65_PRECOMPILE as SDK_QUBITOR_MLDSA65_PRECOMPILE,
  QUBITOR_SECURITY_MODE_REGISTRY as SDK_QUBITOR_SECURITY_MODE_REGISTRY,
  QUBITOR_TESTNET_EXPLORER_URL as SDK_QUBITOR_TESTNET_EXPLORER_URL,
  QUBITOR_TESTNET_FAUCET_URL as SDK_QUBITOR_TESTNET_FAUCET_URL,
  QUBITOR_TESTNET_RPC_URL as SDK_QUBITOR_TESTNET_RPC_URL,
  ML_DSA_65_PUBLIC_KEY_BYTES,
  ML_DSA_65_SIGNATURE_BYTES,
  QUBITOR_PQ_ACCOUNT_DOMAIN as SDK_QUBITOR_PQ_ACCOUNT_DOMAIN,
  QUBITOR_PQ_TX_CONTEXT as SDK_QUBITOR_PQ_TX_CONTEXT,
  QUBITOR_PQ_TX_TYPE as SDK_QUBITOR_PQ_TX_TYPE,
  QUBITOR_PQ_TX_TYPE_HEX as SDK_QUBITOR_PQ_TX_TYPE_HEX,
  QUBITOR_ZERO_HASH as SDK_QUBITOR_ZERO_HASH,
  type CreatePQAccountOptions,
  type MLDSA65KeyPair,
  type QubitorClient,
  type QubitorNetworkConfig,
  type QubitorPQTxV1SignRequest as SdkQubitorPQTxV1SignRequest,
  type QubitorPQTxV1SignResult as SdkQubitorPQTxV1SignResult,
  type QubitorPQTxV1Signed as SdkQubitorPQTxV1Signed,
  type QubitorPQTxV1Unsigned as SdkQubitorPQTxV1Unsigned,
  type SendPQTransactionRequest,
  type SendPQTransactionResult,
} from "@qubitor/sdk";
import { QUBITOR_ACCOUNT_CREATION_CODE } from "./system-contracts";

export {
  QUBITOR_ACCOUNT_CREATION_CODE,
} from "./system-contracts";

export const QUBITOR_DEVNET_CHAIN_ID = sdkQubitorDevnet.chainId;
export const QUBITOR_TESTNET_CHAIN_ID = sdkQubitorTestnet.chainId;
export const QUBITOR_DEVNET_RPC_URL = sdkQubitorDevnet.rpcUrls[0] ?? "http://127.0.0.1:18545/rpc";
export const QUBITOR_DEVNET_NODE_RPC_URL = sdkQubitorDevnet.rpcUrls[1] ?? "http://127.0.0.1:8545";
export const QUBITOR_DEVNET_FAUCET_URL = sdkQubitorDevnet.faucetUrls[0] ?? "http://127.0.0.1:18546";
export const QUBITOR_DEVNET_PQ_RELAYER_URL = QUBITOR_DEVNET_FAUCET_URL;
export const QUBITOR_TESTNET_RPC_URL = SDK_QUBITOR_TESTNET_RPC_URL;
export const QUBITOR_TESTNET_FAUCET_URL = SDK_QUBITOR_TESTNET_FAUCET_URL;
export const QUBITOR_TESTNET_PQ_RELAYER_URL = SDK_QUBITOR_TESTNET_FAUCET_URL;
export const QUBITOR_TESTNET_EXPLORER_URL = SDK_QUBITOR_TESTNET_EXPLORER_URL;
export const QUBITOR_DEVNET_INDEXER_URL = "http://127.0.0.1:18549";
export const QUBITOR_TESTNET_INDEXER_URL = `${QUBITOR_TESTNET_EXPLORER_URL.replace(/\/$/, "")}/api/indexer`;
export const QUBITOR_ACCOUNT_FACTORY = SDK_QUBITOR_ACCOUNT_FACTORY;
export const QUBITOR_ACCOUNT_READINESS_REGISTRY = SDK_QUBITOR_ACCOUNT_READINESS_REGISTRY;
export const QUBITOR_MLDSA65_PRECOMPILE = SDK_QUBITOR_MLDSA65_PRECOMPILE;
export const QUBITOR_SECURITY_MODE_REGISTRY = SDK_QUBITOR_SECURITY_MODE_REGISTRY;
export const QUBITOR_PQ_TX_TYPE = SDK_QUBITOR_PQ_TX_TYPE;
export const QUBITOR_PQ_TX_TYPE_HEX = SDK_QUBITOR_PQ_TX_TYPE_HEX;
export const QUBITOR_PQ_TX_CONTEXT = SDK_QUBITOR_PQ_TX_CONTEXT;
export const QUBITOR_PQ_ACCOUNT_DOMAIN = SDK_QUBITOR_PQ_ACCOUNT_DOMAIN;
export const QUBITOR_ZERO_HASH = SDK_QUBITOR_ZERO_HASH;

export const qubitorDevnetNetwork = sdkQubitorDevnet;
export const qubitorTestnetNetwork = sdkQubitorTestnet;
export const createQubitorClient = sdkCreateQubitorClient;
export const createPQAccount = sdkCreatePQAccount;
export const signPQTransaction = sdkSignPQTransaction;
export const sendPQTransaction = sdkSendPQTransaction;
export const getQbtBalance = sdkGetQbtBalance;
export const getAccountSecurityMode = sdkGetAccountSecurityMode;
export const getAccountReadiness = sdkGetAccountReadiness;
export const getSmartAccountDeploymentState = sdkGetSmartAccountDeploymentState;
export const generateMLDSA65KeyPair = sdkGenerateMLDSA65KeyPair;
export const signMLDSA65 = sdkSignMLDSA65;

export function signQubitorPQAccountAuthorization(message: Hex | Uint8Array, privateKey: Hex | Uint8Array): Hex {
  return sdkSignMLDSA65(message, privateKey, { context: QUBITOR_PQ_ACCOUNT_DOMAIN });
}

export type {
  CreatePQAccountOptions,
  MLDSA65KeyPair,
  QubitorClient,
  QubitorNetworkConfig,
  SendPQTransactionRequest,
  SendPQTransactionResult,
};

function defineViemQubitorChain(config: QubitorNetworkConfig) {
  const rpcUrl = sdkDefaultQubitorRpcUrl(config);
  const explorerUrl = config.blockExplorerUrls[0];
  return defineChain({
    id: config.chainId,
    name: config.name,
    nativeCurrency: config.nativeCurrency,
    rpcUrls: {
      default: { http: [rpcUrl] },
      public: { http: [rpcUrl] },
    },
    blockExplorers: explorerUrl
      ? {
          default: {
            name: "Qubitor Explorer",
            url: explorerUrl,
          },
        }
      : undefined,
    testnet: config.chainId !== 91339,
  });
}

export const qubitorDevnet = defineViemQubitorChain(sdkQubitorDevnet);
export const qubitorTestnet = defineViemQubitorChain(sdkQubitorTestnet);

export const SUPPORTED_CHAINS = {
  qubitorDevnet,
  qubitorTestnet,
} as const;

export type SupportedChainId = (typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS]["id"];

export function chainConfig(chainId: SupportedChainId) {
  const chain = Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId);
  if (!chain) throw new Error(`Unsupported chain ID ${chainId}`);
  return chain;
}

export function qubitorNetworkConfig(chainId: SupportedChainId | number | string = QUBITOR_TESTNET_CHAIN_ID) {
  return supportedChainId(chainId) === QUBITOR_DEVNET_CHAIN_ID ? sdkQubitorDevnet : sdkQubitorTestnet;
}

export function supportedChainId(value?: number | string): SupportedChainId {
  const parsed = typeof value === "string" ? Number(value) : value;
  const fallback = qubitorTestnet.id;
  const chainId = Number.isFinite(parsed) ? parsed : fallback;
  if (Object.values(SUPPORTED_CHAINS).some((c) => c.id === chainId)) return chainId as SupportedChainId;
  return fallback;
}

export function defaultQubitorRpcUrl(chainId: SupportedChainId | number | string = QUBITOR_TESTNET_CHAIN_ID): string {
  return supportedChainId(chainId) === QUBITOR_TESTNET_CHAIN_ID ? QUBITOR_TESTNET_RPC_URL : QUBITOR_DEVNET_RPC_URL;
}

export function defaultQubitorFaucetUrl(chainId: SupportedChainId | number | string = QUBITOR_TESTNET_CHAIN_ID): string {
  return supportedChainId(chainId) === QUBITOR_TESTNET_CHAIN_ID ? QUBITOR_TESTNET_FAUCET_URL : QUBITOR_DEVNET_FAUCET_URL;
}

export function defaultQubitorPQRelayerUrl(chainId: SupportedChainId | number | string = QUBITOR_TESTNET_CHAIN_ID): string {
  return supportedChainId(chainId) === QUBITOR_TESTNET_CHAIN_ID
    ? QUBITOR_TESTNET_PQ_RELAYER_URL
    : QUBITOR_DEVNET_PQ_RELAYER_URL;
}

export function defaultQubitorIndexerUrl(chainId: SupportedChainId | number | string = QUBITOR_TESTNET_CHAIN_ID): string {
  return supportedChainId(chainId) === QUBITOR_TESTNET_CHAIN_ID ? QUBITOR_TESTNET_INDEXER_URL : QUBITOR_DEVNET_INDEXER_URL;
}

export function explorerTxUrl(hash: string, chainId: SupportedChainId | number | string = QUBITOR_TESTNET_CHAIN_ID): string {
  const config = qubitorNetworkConfig(chainId);
  const explorer = config.blockExplorerUrls[0] ?? QUBITOR_TESTNET_EXPLORER_URL;
  return `${explorer.replace(/\/$/, "")}/tx/${hash}`;
}

export function explorerAddressUrl(
  address: string,
  chainId: SupportedChainId | number | string = QUBITOR_TESTNET_CHAIN_ID,
): string {
  const config = qubitorNetworkConfig(chainId);
  const explorer = config.blockExplorerUrls[0] ?? QUBITOR_TESTNET_EXPLORER_URL;
  return `${explorer.replace(/\/$/, "")}/address/${getAddress(address)}`;
}

export function explorerProofUrl(
  path: string,
  chainId: SupportedChainId | number | string = QUBITOR_TESTNET_CHAIN_ID,
): string {
  const config = qubitorNetworkConfig(chainId);
  const explorer = config.blockExplorerUrls[0] ?? QUBITOR_TESTNET_EXPLORER_URL;
  const normalizedPath = path.replace(/^\/+/, "");
  return `${explorer.replace(/\/$/, "")}/${normalizedPath.startsWith("proofs/") ? normalizedPath : `proofs/${normalizedPath}`}`;
}

export function formatAddress(address: Hex, lead = 6, trail = 4): string {
  if (!isAddress(address)) return address;
  const checksum = getAddress(address);
  return `${checksum.slice(0, lead)}...${checksum.slice(-trail)}`;
}

export function formatBalanceWei(wei: bigint, decimals = 4): string {
  const ether = formatEther(wei);
  const num = Number(ether);
  if (Number.isNaN(num)) return ether;
  return num.toFixed(decimals);
}

export function formatNativeAmountInput(wei: bigint, decimals = 18, maxDecimals = 6): string {
  const value = formatUnits(wei < 0n ? 0n : wei, decimals);
  const [whole = "0", fraction = ""] = value.split(".");
  const trimmedFraction = fraction.slice(0, maxDecimals).replace(/0+$/, "");
  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
}

export function formatTokenAmount(amount: bigint, tokenDecimals: number, displayDecimals = 4): string {
  const value = formatUnits(amount, tokenDecimals);
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toFixed(displayDecimals);
}

export function isValidEvmAddress(value: string): value is Hex {
  return isAddress(value);
}

export function normalizeEvmAddress(value: string): Hex {
  if (!isAddress(value)) throw new Error("Expected a valid 0x EVM address.");
  return getAddress(value) as Hex;
}

export function parseNativeAmountToWei(value: string, decimals = 18): bigint {
  const normalized = value.trim().replace(/,/g, "");
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
    throw new Error("Amount must be a positive decimal number.");
  }
  const wei = parseUnits(normalized, decimals);
  if (wei <= 0n) throw new Error("Amount must be greater than zero.");
  return wei;
}

export interface EvmReadConfig {
  chainId?: SupportedChainId | number | string;
  rpcUrl?: string;
  faucetUrl?: string;
  pqRelayerUrl?: string;
  indexerUrl?: string;
}

export interface QubitorIndexerTransaction {
  hash: Hex;
  blockNumber?: number | string;
  timestamp?: string;
  from?: Hex;
  to?: Hex;
  value?: string;
  status?: "pending" | "success" | "failed" | string;
  gasUsed?: string;
  effectiveGasPrice?: string;
  tags?: string[];
}

export interface QubitorIndexerEvent {
  id?: string;
  type?: string;
  address?: Hex;
  transactionHash?: Hex;
  blockNumber?: number | string;
  timestamp?: string;
  tags?: string[];
  decoded?: Record<string, unknown>;
}

export interface QubitorIndexedAddressActivity {
  address: Hex;
  indexedAt?: string;
  transactions?: QubitorIndexerTransaction[];
  events?: QubitorIndexerEvent[];
}

export interface QubitorSmartAccountDeploymentState {
  address: Hex;
  deployed: boolean;
  code?: Hex;
}

export interface QubitorAccountReadiness {
  address: Hex;
  accountType: string;
  securityMode: string;
  registryMode?: number;
  readiness?: {
    isQubitorAccount: boolean;
    securityMode: number;
    pqPublicKeyCommitment: Hex;
    lastKeyRotation: string;
    updatedAt: string;
  };
  pqRequired: boolean;
  ecdsaControl: boolean;
}

export interface QubitorAccountSecurityMode {
  address: Hex;
  mode: string;
  registryMode?: number;
  claim: string;
}

export interface QubitorFaucetReceipt {
  ok: boolean;
  address: Hex;
  hash: Hex;
  amountWei: string;
  createdAt: string;
  blockNumber?: string;
  signerMode?: "PQ Native";
  rawTransactionType?: "QubitorPQTxV1";
  deploymentTransactionHash?: Hex;
  deploymentBlockNumber?: string;
  deployed?: boolean;
  accountFactory?: Hex;
  explorerUrl?: string;
}

export interface QubitorDevPQAccount {
  ok: boolean;
  chainId: number;
  accountAddress: Hex;
  deployed: boolean;
  nonce: string;
  balanceWei: string;
  balanceQbt: string;
  publicKey: Hex;
  publicKeyCommitment: Hex;
  nativeTransactionNonce?: string;
  smartAccountNonce?: string;
  signerMode?: "PQ Native";
  rawTransactionType?: "QubitorPQTxV1";
  relayerAddress?: Hex;
  relayerBalanceWei?: string;
  latestBlock: string;
  salt: Hex;
}

export interface QubitorDevPQDeployReceipt {
  accountAddress: Hex;
  deployed: boolean;
  transactionHash?: Hex;
  faucetTransactionHash?: Hex;
  deploymentBlockNumber?: string;
}

export interface QubitorDevPQTransferReceipt {
  ok: boolean;
  accountAddress: Hex;
  target: Hex;
  valueWei: string;
  data: Hex;
  nonce: string;
  transactionHash: Hex;
  blockNumber: string;
  status: string;
  deploymentTransactionHash?: Hex;
  signerMode?: "PQ Native";
  rawTransactionType?: "QubitorPQTxV1";
}

export interface QubitorDevPQAuthorization {
  accountAddress: Hex;
  target: Hex;
  valueWei: string;
  data: Hex;
  nonce: string;
  message: Hex;
}

export interface QubitorDevPQRotationAuthorization {
  accountAddress: Hex;
  newPublicKey: Hex;
  nonce: string;
  message: Hex;
}

export interface QubitorDevPQRotationReceipt {
  ok: boolean;
  accountAddress: Hex;
  newPublicKey: Hex;
  newPublicKeyCommitment: Hex;
  nonce: string;
  transactionHash: Hex;
  blockNumber: string;
  status: string;
  deploymentTransactionHash?: Hex;
  signerMode?: "PQ Native";
  rawTransactionType?: "QubitorPQTxV1";
}

export interface QubitorDevPQRawSubmitReceipt {
  ok: boolean;
  network?: string;
  chainId?: number;
  transactionHash: Hex;
  blockNumber?: string;
  status: string;
  signerMode?: "PQ Native";
  rawTransactionType?: "QubitorPQTxV1";
}

export interface AccountReadSnapshot {
  address: Hex;
  chainId: SupportedChainId;
  balanceWei: bigint;
  deployed: boolean;
  latestBlock: bigint;
  chainName: string;
  nativeCurrencySymbol: string;
  code?: Hex;
  rpcUrl?: string;
  qbt?: {
    deployment?: QubitorSmartAccountDeploymentState;
    readiness?: QubitorAccountReadiness;
    securityMode?: QubitorAccountSecurityMode;
  };
}

interface EvmPublicClient {
  getBalance: (args: { address: Hex }) => Promise<bigint>;
  getCode: (args: { address: Hex }) => Promise<Hex | undefined>;
  getBlockNumber: () => Promise<bigint>;
}

const qubitorAccountAbi = parseAbi([
  "function nonce() view returns (uint256)",
  "function executeMessage(uint256 expectedNonce,address target,uint256 value,bytes data) view returns (bytes)",
  "function executePQ(address target,uint256 value,bytes data,uint256 expectedNonce,bytes signature) returns (bytes)",
  "function rotateMessage(uint256 expectedNonce,bytes newPQPublicKey) view returns (bytes)",
  "function rotatePQKey(bytes newPQPublicKey,uint256 expectedNonce,bytes signature)",
]);

type QubitorPQNumberish = bigint | number | string;
type RlpHex = Hex | readonly RlpHex[];

export interface QubitorPQAccessListEntry {
  address: Hex;
  storageKeys: readonly Hex[];
}

export interface QubitorPQTxV1Unsigned {
  chainId: SupportedChainId | number | string | bigint;
  nonce: QubitorPQNumberish;
  gasTipCap: QubitorPQNumberish;
  gasFeeCap: QubitorPQNumberish;
  gas: QubitorPQNumberish;
  account?: Hex;
  factorySalt?: Hex;
  to?: Hex;
  value?: QubitorPQNumberish;
  data?: Hex;
  accessList?: readonly QubitorPQAccessListEntry[];
  pqPublicKey: Hex;
  pqContext?: string;
}

export interface QubitorPQTxV1Signed extends QubitorPQTxV1Unsigned {
  pqSignature: Hex;
}

export interface QubitorPQTxV1SignRequest extends QubitorPQTxV1Unsigned {
  pqPrivateKey: Hex;
}

export interface QubitorPQTxV1SignResult {
  signingHash: Hex;
  signature: Hex;
  rawTransaction: Hex;
  transaction: QubitorPQTxV1Signed;
}

export type QubitorPQTxV1SubmitMethod = "qubitor_sendRawPQTransaction" | "eth_sendRawTransaction";

interface NormalizedQubitorPQTxV1 {
  chainId: bigint;
  nonce: bigint;
  gasTipCap: bigint;
  gasFeeCap: bigint;
  gas: bigint;
  account: Hex;
  factorySalt: Hex;
  to: Hex;
  value: bigint;
  data: Hex;
  accessList: readonly QubitorPQAccessListEntry[];
  pqPublicKey: Hex;
  pqContext: string;
  pqSignature?: Hex;
}

function assertHexBytes(value: Hex, label: string, expectedBytes?: number): Hex {
  if (!/^0x[0-9a-fA-F]*$/.test(value)) throw new Error(`${label} must be 0x-prefixed hex`);
  const byteLength = (value.length - 2) / 2;
  if (!Number.isInteger(byteLength)) throw new Error(`${label} must have an even number of hex characters`);
  if (expectedBytes !== undefined && byteLength !== expectedBytes) {
    throw new Error(`${label} must be ${expectedBytes} bytes, got ${byteLength}`);
  }
  return value.toLowerCase() as Hex;
}

function quantityToBigInt(value: QubitorPQNumberish | undefined, label: string): bigint {
  if (value === undefined) return 0n;
  if (typeof value === "bigint") {
    if (value < 0n) throw new Error(`${label} must be non-negative`);
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a non-negative safe integer`);
    return BigInt(value);
  }
  const trimmed = value.trim();
  if (/^0x[0-9a-fA-F]+$/.test(trimmed)) {
    const parsed = BigInt(trimmed);
    if (parsed < 0n) throw new Error(`${label} must be non-negative`);
    return parsed;
  }
  if (/^[0-9]+$/.test(trimmed)) return BigInt(trimmed);
  throw new Error(`${label} must be a bigint, safe integer, decimal string, or hex quantity`);
}

function assertUint64(value: bigint, label: string) {
  if (value > 0xffffffffffffffffn) throw new Error(`${label} must fit in uint64`);
}

function quantityToRlpHex(value: bigint): Hex {
  return value === 0n ? "0x" : numberToHex(value);
}

function assertAscii(value: string, label: string): string {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 0x7f) throw new Error(`${label} must be ASCII`);
  }
  return value;
}

function normalizeQubitorPQAccessList(
  accessList: readonly QubitorPQAccessListEntry[] = [],
): readonly QubitorPQAccessListEntry[] {
  return accessList.map((entry, index) => ({
    address: getAddress(entry.address) as Hex,
    storageKeys: entry.storageKeys.map((storageKey, storageKeyIndex) =>
      assertHexBytes(storageKey, `accessList[${index}].storageKeys[${storageKeyIndex}]`, 32),
    ),
  }));
}

function serializeQubitorPQAccessList(accessList: readonly QubitorPQAccessListEntry[]): readonly RlpHex[] {
  return accessList.map((entry) => [entry.address, entry.storageKeys] as const);
}

function normalizeQubitorPQTxV1(tx: QubitorPQTxV1Signed): NormalizedQubitorPQTxV1 & { pqSignature: Hex };
function normalizeQubitorPQTxV1(tx: QubitorPQTxV1Unsigned): NormalizedQubitorPQTxV1;
function normalizeQubitorPQTxV1(tx: QubitorPQTxV1Unsigned | QubitorPQTxV1Signed): NormalizedQubitorPQTxV1 {
  const chainId = quantityToBigInt(tx.chainId, "chainId");
  const nonce = quantityToBigInt(tx.nonce, "nonce");
  const gas = quantityToBigInt(tx.gas, "gas");
  assertUint64(nonce, "nonce");
  assertUint64(gas, "gas");

  const factorySalt = assertHexBytes(tx.factorySalt ?? QUBITOR_ZERO_HASH, "factorySalt", 32);
  const pqPublicKey = assertHexBytes(tx.pqPublicKey, "pqPublicKey", ML_DSA_65_PUBLIC_KEY_BYTES);
  const account = deriveQubitorPQAccountAddress(pqPublicKey, factorySalt);
  if (tx.account && getAddress(tx.account) !== account) {
    throw new Error("account must match the QubitorPQTxV1 publicKey/factorySalt binding");
  }

  const normalized: NormalizedQubitorPQTxV1 = {
    chainId,
    nonce,
    gasTipCap: quantityToBigInt(tx.gasTipCap, "gasTipCap"),
    gasFeeCap: quantityToBigInt(tx.gasFeeCap, "gasFeeCap"),
    gas,
    account,
    factorySalt,
    to: tx.to ? (getAddress(tx.to) as Hex) : "0x",
    value: quantityToBigInt(tx.value, "value"),
    data: assertHexBytes(tx.data ?? "0x", "data"),
    accessList: normalizeQubitorPQAccessList(tx.accessList),
    pqPublicKey,
    pqContext: assertAscii(tx.pqContext ?? QUBITOR_PQ_TX_CONTEXT, "pqContext"),
  };

  if ("pqSignature" in tx && tx.pqSignature !== undefined) {
    normalized.pqSignature = assertHexBytes(tx.pqSignature, "pqSignature", ML_DSA_65_SIGNATURE_BYTES);
  }

  return normalized;
}

function qubitorPQContextHex(context: string): Hex {
  return stringToHex(context) as Hex;
}

export function deriveQubitorPQAccountAddress(publicKey: Hex, factorySalt: Hex = QUBITOR_ZERO_HASH): Hex {
  return sdkDeriveQubitorPQAccountAddress(publicKey, factorySalt) as Hex;
}

function qubitorPQTxV1SigningFields(tx: NormalizedQubitorPQTxV1): readonly RlpHex[] {
  return [
    qubitorPQContextHex(QUBITOR_PQ_TX_CONTEXT),
    quantityToRlpHex(tx.chainId),
    quantityToRlpHex(tx.nonce),
    quantityToRlpHex(tx.gasTipCap),
    quantityToRlpHex(tx.gasFeeCap),
    quantityToRlpHex(tx.gas),
    tx.account,
    tx.factorySalt,
    tx.to,
    quantityToRlpHex(tx.value),
    tx.data,
    serializeQubitorPQAccessList(tx.accessList),
    tx.pqPublicKey,
    qubitorPQContextHex(tx.pqContext),
  ];
}

function qubitorPQTxV1EnvelopeFields(tx: NormalizedQubitorPQTxV1 & { pqSignature: Hex }): readonly RlpHex[] {
  return [
    quantityToRlpHex(tx.chainId),
    quantityToRlpHex(tx.nonce),
    quantityToRlpHex(tx.gasTipCap),
    quantityToRlpHex(tx.gasFeeCap),
    quantityToRlpHex(tx.gas),
    tx.account,
    tx.factorySalt,
    tx.to,
    quantityToRlpHex(tx.value),
    tx.data,
    serializeQubitorPQAccessList(tx.accessList),
    tx.pqPublicKey,
    qubitorPQContextHex(tx.pqContext),
    tx.pqSignature,
  ];
}

function hashNormalizedQubitorPQTxV1(tx: NormalizedQubitorPQTxV1): Hex {
  return keccak256(concatHex([QUBITOR_PQ_TX_TYPE_HEX, toRlp(qubitorPQTxV1SigningFields(tx))]));
}

export function hashQubitorPQTxV1(tx: QubitorPQTxV1Unsigned): Hex {
  return sdkHashQubitorPQTxV1(tx as SdkQubitorPQTxV1Unsigned) as Hex;
}

export function serializeQubitorPQTxV1(tx: QubitorPQTxV1Signed): Hex {
  return sdkSerializeQubitorPQTxV1(tx as SdkQubitorPQTxV1Signed) as Hex;
}

export function signQubitorPQTxV1(tx: QubitorPQTxV1SignRequest): QubitorPQTxV1SignResult {
  return sdkSignQubitorPQTxV1(tx as SdkQubitorPQTxV1SignRequest) as unknown as QubitorPQTxV1SignResult;
}

export function createEvmPublicClient(config: EvmReadConfig = {}): EvmPublicClient {
  const chainId = supportedChainId(config.chainId);
  return createPublicClient({
    chain: chainConfig(chainId),
    transport: http(config.rpcUrl ?? defaultQubitorRpcUrl(chainId)),
  }) as unknown as EvmPublicClient;
}

export function isQubitorDevnet(chainId?: number | string): boolean {
  return Number(chainId) === QUBITOR_DEVNET_CHAIN_ID;
}

export function isQubitorNetwork(chainId?: number | string): boolean {
  const parsed = Number(chainId);
  return parsed === QUBITOR_DEVNET_CHAIN_ID || parsed === QUBITOR_TESTNET_CHAIN_ID;
}

function rpcUrlForConfig(config: EvmReadConfig): string | undefined {
  if (config.rpcUrl) return config.rpcUrl;
  const chainId = supportedChainId(config.chainId);
  return chainConfig(chainId).rpcUrls.default.http[0];
}

async function jsonRpc<T>(config: EvmReadConfig, method: string, params: unknown[] = []): Promise<T> {
  const rpcUrl = rpcUrlForConfig(config);
  if (!rpcUrl) throw new Error(`No RPC URL configured for ${method}`);

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const payload = (await response.json()) as { result?: T; error?: { message?: string } };
  if (payload.error) throw new Error(payload.error.message ?? `${method} failed`);
  return payload.result as T;
}

async function optionalJsonRpc<T>(config: EvmReadConfig, method: string, params: unknown[] = []): Promise<T | undefined> {
  try {
    return await jsonRpc<T>(config, method, params);
  } catch {
    return undefined;
  }
}

export async function sendRawQubitorPQTxV1(
  rawTransaction: Hex,
  config: EvmReadConfig = {},
  method: QubitorPQTxV1SubmitMethod = "qubitor_sendRawPQTransaction",
): Promise<Hex> {
  const rpcUrl = rpcUrlForConfig(config);
  if (!rpcUrl) throw new Error(`No RPC URL configured for ${method}`);
  return sdkSendRawQubitorPQTxV1(assertHexBytes(rawTransaction, "rawTransaction"), { rpcUrl }, method) as Promise<Hex>;
}

export async function readNativeBalance(address: Hex, config: EvmReadConfig = {}): Promise<bigint> {
  const client = createEvmPublicClient(config);
  return client.getBalance({ address: getAddress(address) });
}

export interface QubitorSimulationRequest {
  from: Hex;
  to: Hex;
  valueWei: bigint;
  data?: Hex;
}

export interface QubitorSimulationResult {
  /** True when the node accepted the call (eth_call did not revert). */
  willSucceed: boolean;
  /** Decoded revert reason / node error when `willSucceed` is false. */
  revertReason?: string;
  /** Real gas units from eth_estimateGas (undefined if the call reverts). */
  gasEstimate?: bigint;
  /** Real gas price from eth_gasPrice. */
  gasPriceWei?: bigint;
  /** gasEstimate × gasPriceWei. */
  maxFeeWei?: bigint;
  /** valueWei + maxFeeWei — total native leaving `from`. */
  totalOutWei: bigint;
  /** Sender native balance before the transfer (real eth_getBalance). */
  senderBalanceBeforeWei: bigint;
  /** Projected sender balance after value + fee. */
  senderBalanceAfterWei: bigint;
  /** True when projected balance would go negative. */
  insufficientFunds: boolean;
}

function decodeHexQuantity(value: unknown): bigint | undefined {
  if (typeof value !== "string" || !value.startsWith("0x")) return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
}

/**
 * Real pre-flight simulation of a native QBT transfer. Performs:
 *  - eth_getBalance (sender, before)
 *  - eth_estimateGas (real gas units; a revert here is the node's real signal)
 *  - eth_call (catches reverts with the node's reason string)
 *  - eth_gasPrice (real fee math)
 * No mock data — every field comes from the configured RPC.
 */
export async function simulateQubitorTransfer(
  request: QubitorSimulationRequest,
  config: EvmReadConfig = {},
): Promise<QubitorSimulationResult> {
  const from = getAddress(request.from);
  const to = getAddress(request.to);
  const valueHex = `0x${request.valueWei.toString(16)}` as const;
  const callObject: Record<string, string> = { from, to, value: valueHex };
  if (request.data && request.data !== "0x") callObject.data = request.data;

  const senderBalanceBeforeWei = (await optionalJsonRpc<string>(config, "eth_getBalance", [from, "latest"]).then(
    (v) => decodeHexQuantity(v) ?? 0n,
  )) as bigint;

  let willSucceed = true;
  let revertReason: string | undefined;
  let gasEstimate: bigint | undefined;

  try {
    const gasHex = await jsonRpc<string>(config, "eth_estimateGas", [callObject]);
    gasEstimate = decodeHexQuantity(gasHex);
  } catch (error) {
    willSucceed = false;
    revertReason = error instanceof Error ? error.message : "Transaction would revert";
  }

  if (willSucceed) {
    try {
      await jsonRpc<string>(config, "eth_call", [callObject, "latest"]);
    } catch (error) {
      willSucceed = false;
      revertReason = error instanceof Error ? error.message : "Transaction would revert";
    }
  }

  const gasPriceWei = decodeHexQuantity(await optionalJsonRpc<string>(config, "eth_gasPrice", []));
  const maxFeeWei = gasEstimate !== undefined && gasPriceWei !== undefined ? gasEstimate * gasPriceWei : undefined;
  const totalOutWei = request.valueWei + (maxFeeWei ?? 0n);
  const senderBalanceAfterWei = senderBalanceBeforeWei - totalOutWei;

  return {
    willSucceed,
    revertReason,
    gasEstimate,
    gasPriceWei,
    maxFeeWei,
    totalOutWei,
    senderBalanceBeforeWei,
    senderBalanceAfterWei,
    insufficientFunds: senderBalanceAfterWei < 0n,
  };
}

export async function readAccountDeployment(address: Hex, config: EvmReadConfig = {}): Promise<{ deployed: boolean; code?: Hex }> {
  const client = createEvmPublicClient(config);
  const code = await client.getCode({ address: getAddress(address) });
  return { deployed: Boolean(code && code !== "0x"), code };
}

export async function readAccountSnapshot(address: Hex, config: EvmReadConfig = {}): Promise<AccountReadSnapshot> {
  const normalizedAddress = getAddress(address) as Hex;
  const chainId = supportedChainId(config.chainId);
  const client = createEvmPublicClient({ ...config, chainId });
  const [balanceWei, code, latestBlock] = await Promise.all([
    client.getBalance({ address: normalizedAddress }),
    client.getCode({ address: normalizedAddress }),
    client.getBlockNumber(),
  ]);

  const qbtConfig = { ...config, chainId };
  const qbt = isQubitorNetwork(chainId)
    ? {
        deployment: await optionalJsonRpc<QubitorSmartAccountDeploymentState>(
          qbtConfig,
          "qubitor_getSmartAccountDeploymentState",
          [normalizedAddress],
        ),
        readiness: await optionalJsonRpc<QubitorAccountReadiness>(qbtConfig, "qubitor_getAccountReadiness", [
          normalizedAddress,
        ]),
        securityMode: await optionalJsonRpc<QubitorAccountSecurityMode>(
          qbtConfig,
          "qubitor_getAccountSecurityMode",
          [normalizedAddress],
        ),
      }
    : undefined;
  const chain = chainConfig(chainId);

  return {
    address: normalizedAddress,
    chainId,
    balanceWei,
    deployed: qbt?.deployment?.deployed ?? Boolean(code && code !== "0x"),
    latestBlock,
    chainName: chain.name,
    nativeCurrencySymbol: chain.nativeCurrency.symbol,
    code,
    rpcUrl: config.rpcUrl,
    qbt,
  };
}

function indexerUrlForConfig(config: EvmReadConfig): string {
  return (config.indexerUrl ?? defaultQubitorIndexerUrl(config.chainId)).replace(/\/$/, "");
}

async function indexerFetch<T>(path: string, config: EvmReadConfig = {}): Promise<T> {
  const url = `${indexerUrlForConfig(config)}${path.startsWith("/") ? path : `/${path}`}`;
  let response: Response;
  try {
    response = await fetch(url, { headers: { accept: "application/json" } });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "network request failed";
    throw new Error(`Qubitor indexer is unreachable at ${url}. Detail: ${detail}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Qubitor indexer request failed with HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export async function readQubitorAccountActivity(
  address: Hex,
  config: EvmReadConfig = {},
): Promise<QubitorIndexedAddressActivity> {
  const normalizedAddress = getAddress(address) as Hex;
  const activity = await indexerFetch<QubitorIndexedAddressActivity>(
    `/address/${normalizedAddress}`,
    config,
  );
  return {
    address: normalizedAddress,
    indexedAt: activity.indexedAt,
    transactions: activity.transactions ?? [],
    events: activity.events ?? [],
  };
}

export async function requestQubitorDevnetFaucet(
  address: Hex,
  config: Pick<EvmReadConfig, "chainId" | "faucetUrl"> = {},
  account?: { publicKey?: Hex; salt?: Hex; deployAccount?: boolean },
): Promise<QubitorFaucetReceipt> {
  const faucetUrl = config.faucetUrl ?? defaultQubitorFaucetUrl(config.chainId);
  const response = await fetch(`${faucetUrl}/faucet/request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      address: getAddress(address),
      publicKey: account?.publicKey,
      salt: account?.salt,
      deployAccount: account?.deployAccount,
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Faucet request failed";
    throw new Error(message);
  }
  return payload as QubitorFaucetReceipt;
}

function pqRelayerUrl(config: Pick<EvmReadConfig, "chainId" | "pqRelayerUrl"> = {}) {
  return config.pqRelayerUrl ?? defaultQubitorPQRelayerUrl(config.chainId);
}

async function pqRelayerFetch<T>(
  path: string,
  config: Pick<EvmReadConfig, "chainId" | "pqRelayerUrl"> = {},
  body?: unknown,
): Promise<T> {
  const url = `${pqRelayerUrl(config)}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "network request failed";
    throw new Error(`PQ relayer is unreachable at ${url}. Start QubitorNetwork node, deploy contracts, and run pnpm pq-relayer:start. Detail: ${detail}`);
  }
  const payload = await response.json();
  if (!response.ok || (payload && typeof payload === "object" && "ok" in payload && payload.ok === false)) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "PQ relayer request failed";
    throw new Error(message);
  }
  return payload as T;
}

export async function readQubitorDevPQAccount(
  args: { publicKey: Hex; salt?: Hex },
  config: Pick<EvmReadConfig, "chainId" | "pqRelayerUrl"> = {},
): Promise<QubitorDevPQAccount> {
  return pqRelayerFetch<QubitorDevPQAccount>("/pq-dev/account", config, args);
}

export async function deployQubitorDevPQAccount(
  args: { publicKey: Hex; salt?: Hex },
  config: Pick<EvmReadConfig, "chainId" | "pqRelayerUrl" | "faucetUrl"> = {},
): Promise<QubitorDevPQDeployReceipt> {
  const account = await readQubitorDevPQAccount(args, config);
  if (account.deployed) {
    return { accountAddress: account.accountAddress, deployed: true };
  }

  const faucetReceipt = await requestQubitorDevnetFaucet(
    account.accountAddress,
    { chainId: config.chainId, faucetUrl: config.faucetUrl },
    { publicKey: args.publicKey, salt: account.salt, deployAccount: true },
  );
  return {
    accountAddress: account.accountAddress,
    deployed: faucetReceipt.deployed ?? Boolean(faucetReceipt.deploymentTransactionHash),
    transactionHash: faucetReceipt.deploymentTransactionHash,
    faucetTransactionHash: faucetReceipt.hash,
    deploymentBlockNumber: faucetReceipt.deploymentBlockNumber,
  };
}

export async function readQubitorDevPQTransferAuthorization(
  args: { accountAddress: Hex; target: Hex; valueWei: string | bigint; data?: Hex },
  config: Pick<EvmReadConfig, "chainId" | "rpcUrl"> = {},
): Promise<QubitorDevPQAuthorization> {
  const chainId = supportedChainId(config.chainId ?? QUBITOR_DEVNET_CHAIN_ID);
  const client = createPublicClient({
    chain: chainConfig(chainId),
    transport: http(config.rpcUrl ?? defaultQubitorRpcUrl(chainId)),
  });
  const accountAddress = getAddress(args.accountAddress) as Hex;
  const target = getAddress(args.target) as Hex;
  const valueWei = BigInt(args.valueWei);
  const data = args.data ?? "0x";
  const nonce = (await client.readContract({
    address: accountAddress,
    abi: qubitorAccountAbi,
    functionName: "nonce",
  })) as bigint;
  const message = (await client.readContract({
    address: accountAddress,
    abi: qubitorAccountAbi,
    functionName: "executeMessage",
    args: [nonce, target, valueWei, data],
  })) as Hex;

  return {
    accountAddress,
    target,
    valueWei: valueWei.toString(),
    data,
    nonce: nonce.toString(),
    message,
  };
}

export async function submitQubitorDevPQRawTransaction(
  rawTransaction: Hex,
  config: Pick<EvmReadConfig, "chainId" | "pqRelayerUrl"> = {},
): Promise<QubitorDevPQRawSubmitReceipt> {
  return pqRelayerFetch<QubitorDevPQRawSubmitReceipt>("/pq-dev/send-raw", config, {
    rawTransaction: assertHexBytes(rawTransaction, "rawTransaction"),
  });
}

export async function sendQubitorDevPQTransfer(
  args: {
    accountAddress: Hex;
    target: Hex;
    valueWei: string | bigint;
    data?: Hex;
    nonce: string | bigint;
    signature: Hex;
    publicKey: Hex;
    privateKey: Hex;
    salt?: Hex;
    nativeTransactionNonce?: string | bigint;
    gas?: string | bigint;
  },
  config: Pick<EvmReadConfig, "chainId" | "rpcUrl" | "pqRelayerUrl"> = {},
): Promise<QubitorDevPQTransferReceipt> {
  const chainId = supportedChainId(config.chainId ?? QUBITOR_DEVNET_CHAIN_ID);
  const client = createPublicClient({
    chain: chainConfig(chainId),
    transport: http(config.rpcUrl ?? defaultQubitorRpcUrl(chainId)),
  });
  const accountAddress = getAddress(args.accountAddress) as Hex;
  const target = getAddress(args.target) as Hex;
  const valueWei = BigInt(args.valueWei);
  const data = assertHexBytes(args.data ?? "0x", "data");
  const salt = assertHexBytes(args.salt ?? QUBITOR_ZERO_HASH, "factorySalt", 32);
  const callData = encodeFunctionData({
    abi: qubitorAccountAbi,
    functionName: "executePQ",
    args: [target, valueWei, data, BigInt(args.nonce), args.signature],
  });
  const nativeTransactionNonce =
    args.nativeTransactionNonce !== undefined
      ? quantityToBigInt(args.nativeTransactionNonce, "nativeTransactionNonce")
      : await client.getTransactionCount({ address: accountAddress });
  const signed = signQubitorPQTxV1({
    chainId,
    nonce: nativeTransactionNonce,
    gasTipCap: "1000000000",
    gasFeeCap: "2000000000",
    gas: args.gas ?? "1500000",
    account: accountAddress,
    factorySalt: salt,
    to: accountAddress,
    value: 0n,
    data: callData,
    pqPublicKey: args.publicKey,
    pqPrivateKey: args.privateKey,
  });
  const receipt = await submitQubitorDevPQRawTransaction(signed.rawTransaction, config);
  return {
    ok: receipt.ok,
    accountAddress,
    target,
    valueWei: valueWei.toString(),
    data,
    nonce: args.nonce.toString(),
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber ?? "0",
    status: receipt.status,
    signerMode: receipt.signerMode,
    rawTransactionType: receipt.rawTransactionType,
  };
}

export async function readQubitorDevPQRotateAuthorization(
  args: { accountAddress: Hex; newPublicKey: Hex },
  config: Pick<EvmReadConfig, "chainId" | "rpcUrl"> = {},
): Promise<QubitorDevPQRotationAuthorization> {
  const chainId = supportedChainId(config.chainId ?? QUBITOR_DEVNET_CHAIN_ID);
  const client = createPublicClient({
    chain: chainConfig(chainId),
    transport: http(config.rpcUrl ?? defaultQubitorRpcUrl(chainId)),
  });
  const accountAddress = getAddress(args.accountAddress) as Hex;
  const nonce = (await client.readContract({
    address: accountAddress,
    abi: qubitorAccountAbi,
    functionName: "nonce",
  })) as bigint;
  const message = (await client.readContract({
    address: accountAddress,
    abi: qubitorAccountAbi,
    functionName: "rotateMessage",
    args: [nonce, args.newPublicKey],
  })) as Hex;

  return {
    accountAddress,
    newPublicKey: args.newPublicKey,
    nonce: nonce.toString(),
    message,
  };
}

export async function sendQubitorDevPQKeyRotation(
  args: {
    accountAddress: Hex;
    newPublicKey: Hex;
    nonce: string | bigint;
    signature: Hex;
    publicKey: Hex;
    privateKey: Hex;
    salt?: Hex;
    nativeTransactionNonce?: string | bigint;
    gas?: string | bigint;
  },
  config: Pick<EvmReadConfig, "chainId" | "rpcUrl" | "pqRelayerUrl"> = {},
): Promise<QubitorDevPQRotationReceipt> {
  const chainId = supportedChainId(config.chainId ?? QUBITOR_DEVNET_CHAIN_ID);
  const client = createPublicClient({
    chain: chainConfig(chainId),
    transport: http(config.rpcUrl ?? defaultQubitorRpcUrl(chainId)),
  });
  const accountAddress = getAddress(args.accountAddress) as Hex;
  const newPublicKey = assertHexBytes(args.newPublicKey, "newPublicKey", ML_DSA_65_PUBLIC_KEY_BYTES);
  const salt = assertHexBytes(args.salt ?? QUBITOR_ZERO_HASH, "factorySalt", 32);
  const callData = encodeFunctionData({
    abi: qubitorAccountAbi,
    functionName: "rotatePQKey",
    args: [newPublicKey, BigInt(args.nonce), args.signature],
  });
  const nativeTransactionNonce =
    args.nativeTransactionNonce !== undefined
      ? quantityToBigInt(args.nativeTransactionNonce, "nativeTransactionNonce")
      : await client.getTransactionCount({ address: accountAddress });
  const signed = signQubitorPQTxV1({
    chainId,
    nonce: nativeTransactionNonce,
    gasTipCap: "1000000000",
    gasFeeCap: "2000000000",
    gas: args.gas ?? "1500000",
    account: accountAddress,
    factorySalt: salt,
    to: accountAddress,
    value: 0n,
    data: callData,
    pqPublicKey: args.publicKey,
    pqPrivateKey: args.privateKey,
  });
  const receipt = await submitQubitorDevPQRawTransaction(signed.rawTransaction, config);
  return {
    ok: receipt.ok,
    accountAddress,
    newPublicKey,
    newPublicKeyCommitment: keccak256(newPublicKey),
    nonce: args.nonce.toString(),
    transactionHash: receipt.transactionHash,
    blockNumber: receipt.blockNumber ?? "0",
    status: receipt.status,
    signerMode: receipt.signerMode,
    rawTransactionType: receipt.rawTransactionType,
  };
}

export type QubitorPQAccount = QubitorDevPQAccount;
export type QubitorPQDeployReceipt = QubitorDevPQDeployReceipt;
export type QubitorPQTransferReceipt = QubitorDevPQTransferReceipt;
export type QubitorPQAuthorization = QubitorDevPQAuthorization;
export type QubitorPQRotationAuthorization = QubitorDevPQRotationAuthorization;
export type QubitorPQRotationReceipt = QubitorDevPQRotationReceipt;
export type QubitorPQRawSubmitReceipt = QubitorDevPQRawSubmitReceipt;

export const requestQubitorFaucet = requestQubitorDevnetFaucet;
export const readQubitorPQAccount = readQubitorDevPQAccount;
export const deployQubitorPQAccount = deployQubitorDevPQAccount;
export const readQubitorPQTransferAuthorization = readQubitorDevPQTransferAuthorization;
export const submitQubitorPQRawTransaction = submitQubitorDevPQRawTransaction;
export const sendQubitorPQTransfer = sendQubitorDevPQTransfer;
export const readQubitorPQRotateAuthorization = readQubitorDevPQRotateAuthorization;
export const rotateQubitorPQKey = sendQubitorDevPQKeyRotation;

export interface QubitorWalletBackendConfig extends EvmReadConfig {}
type SendQubitorPQTransferArgs = Parameters<typeof sendQubitorPQTransfer>[0];
type RotateQubitorPQKeyArgs = Parameters<typeof rotateQubitorPQKey>[0];

export function createQubitorWalletBackend(config: QubitorWalletBackendConfig = {}) {
  const chainId = supportedChainId(config.chainId);
  const network = qubitorNetworkConfig(chainId);
  const runtime = {
    chainId,
    rpcUrl: config.rpcUrl ?? defaultQubitorRpcUrl(chainId),
    faucetUrl: config.faucetUrl ?? defaultQubitorFaucetUrl(chainId),
    pqRelayerUrl: config.pqRelayerUrl ?? defaultQubitorPQRelayerUrl(chainId),
    indexerUrl: config.indexerUrl ?? defaultQubitorIndexerUrl(chainId),
  };
  const client = sdkCreateQubitorClient({ network, rpcUrl: runtime.rpcUrl });

  return {
    chainId,
    network,
    client,
    rpcUrl: runtime.rpcUrl,
    faucetUrl: runtime.faucetUrl,
    pqRelayerUrl: runtime.pqRelayerUrl,
    indexerUrl: config.indexerUrl ?? defaultQubitorIndexerUrl(chainId),
    explorerTxUrl: (hash: string) => explorerTxUrl(hash, chainId),
    explorerAddressUrl: (address: string) => explorerAddressUrl(address, chainId),
    explorerProofUrl: (path: string) => explorerProofUrl(path, chainId),
    readAccountSnapshot: (address: Hex) => readAccountSnapshot(address, runtime),
    readAccountActivity: (address: Hex) => readQubitorAccountActivity(address, runtime),
    readPQAccount: (args: { publicKey: Hex; salt?: Hex }) => readQubitorPQAccount(args, runtime),
    requestFaucet: (
      address: Hex,
      account?: { publicKey?: Hex; salt?: Hex; deployAccount?: boolean },
    ) => requestQubitorFaucet(address, runtime, account),
    deployPQAccount: (args: { publicKey: Hex; salt?: Hex }) => deployQubitorPQAccount(args, runtime),
    sendPQTransfer: (args: SendQubitorPQTransferArgs) => sendQubitorPQTransfer(args, runtime),
    rotatePQKey: (args: RotateQubitorPQKeyArgs) => rotateQubitorPQKey(args, runtime),
  };
}

/**
 * Qubitor smart-account integration seam.
 * The final submit path is QubitorPQTxV1, not an EOA, ERC-4337 bundler,
 * or EIP-7702 delegation flow.
 */
export interface SmartAccount {
  address: Hex;
  chainId: SupportedChainId;
  deployed: boolean;
}

export async function getSmartAccount(_owner: Hex, _chainId: SupportedChainId): Promise<SmartAccount> {
  throw new Error("getSmartAccount: pending QubitorPQTxV1 node support.");
}
