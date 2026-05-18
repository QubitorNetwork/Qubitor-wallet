#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  echo "[qubitor-wallet-pq-native] $*" >&2
  exit 1
}

require_file() {
  local file="$1"
  [[ -f "$file" ]] || fail "missing file: ${file#$ROOT_DIR/}"
}

require_contains() {
  local file="$1"
  local pattern="$2"
  grep -Fq -- "$pattern" "$file" || fail "${file#$ROOT_DIR/} must contain: $pattern"
}

reject_contains() {
  local file="$1"
  local pattern="$2"
  if grep -Fq -- "$pattern" "$file"; then
    fail "${file#$ROOT_DIR/} must not contain: $pattern"
  fi
}

PQ_CRYPTO="$ROOT_DIR/packages/pq-crypto/src/index.ts"
PQ_WALLET="$ROOT_DIR/apps/mobile/lib/pqDevWallet.ts"
SECURE_KEY_VAULT="$ROOT_DIR/apps/mobile/lib/secureKeyVault.ts"
PQ_FLOW="$ROOT_DIR/apps/mobile/lib/qbtDevnetWalletFlow.ts"
EVM="$ROOT_DIR/packages/evm/src/index.ts"
EVM_TEST="$ROOT_DIR/packages/evm/src/index.test.ts"
EXTENSION_BG="$ROOT_DIR/apps/extension/background.ts"
EXTENSION_PROVIDER="$ROOT_DIR/apps/extension/contents/inject-provider.ts"
ACCOUNT_CONTRACT="$ROOT_DIR/packages/contracts/src/QubitorAccount.sol"
ACCOUNT_FACTORY="$ROOT_DIR/packages/contracts/src/QubitorAccountFactory.sol"
PACKAGE="$ROOT_DIR/package.json"

for file in "$PQ_CRYPTO" "$PQ_WALLET" "$SECURE_KEY_VAULT" "$PQ_FLOW" "$EVM" "$EVM_TEST" "$EXTENSION_BG" "$EXTENSION_PROVIDER" "$ACCOUNT_CONTRACT" "$ACCOUNT_FACTORY" "$PACKAGE"; do
  require_file "$file"
done

require_contains "$PACKAGE" "\"wallet:pq-native:acceptance\""

require_contains "$PQ_CRYPTO" "ml_dsa65"
require_contains "$PQ_CRYPTO" "QUBITOR_ML_DSA_CONTEXT"
require_contains "$PQ_CRYPTO" "generateMLDSA65KeyPair"
require_contains "$PQ_CRYPTO" "signMLDSA65"
require_contains "$PQ_CRYPTO" "verifyMLDSA65"

require_contains "$SECURE_KEY_VAULT" "SecureStore"
require_contains "$PQ_WALLET" "getKeyVault"
require_contains "$PQ_WALLET" "generateMLDSA65KeyPair"
require_contains "$PQ_WALLET" "deriveMLDSA65PublicKey"
require_contains "$PQ_WALLET" "encryptStringWithPasscode"
require_contains "$PQ_WALLET" "verifyMLDSA65"

require_contains "$PQ_FLOW" "signMLDSA65"
require_contains "$PQ_FLOW" "sendQubitorDevPQTransfer"
require_contains "$PQ_FLOW" "readQubitorDevPQTransferAuthorization"
require_contains "$PQ_FLOW" "QUBITOR_DEVNET_CHAIN_ID"

require_contains "$EVM" "Qubitor wallet runtime is Qubitor-network-only"
require_contains "$EVM" "qubitorDevnet"
require_contains "$EVM" "qubitorTestnet"
require_contains "$EVM" "QubitorPQTxV1"
require_contains "$EVM" "QUBITOR_PQ_TX_TYPE_HEX"
require_contains "$EVM" "QUBITOR_PQ_ACCOUNT_DOMAIN"
require_contains "$EVM" "deriveQubitorPQAccountAddress"
require_contains "$EVM" "signQubitorPQTxV1"
require_contains "$EVM" "sendRawQubitorPQTxV1"
require_contains "$EVM" "qubitor_sendRawPQTransaction"
reject_contains "$EVM" "from \"viem/chains\""
require_contains "$EVM_TEST" "verifyMLDSA65"
require_contains "$EVM_TEST" "QUBITOR_PQ_TX_TYPE_HEX"
require_contains "$EVM_TEST" "mismatched account binding must be rejected"

require_contains "$EXTENSION_BG" "Qubitor is PQ-native only"
require_contains "$EXTENSION_BG" "classical EOA signing and eth_sendTransaction are disabled"
reject_contains "$EXTENSION_BG" "MOCK_SIGNATURE"
reject_contains "$EXTENSION_BG" "MOCK_TX_HASH"
require_contains "$EXTENSION_PROVIDER" "must not return mock EOA signatures"

require_contains "$ACCOUNT_CONTRACT" "executePQ"
require_contains "$ACCOUNT_CONTRACT" "rotatePQKey"
require_contains "$ACCOUNT_CONTRACT" "MLDSA65_PRECOMPILE"
require_contains "$ACCOUNT_CONTRACT" "PQNative"
require_contains "$ACCOUNT_FACTORY" "createAccount"
require_contains "$ACCOUNT_FACTORY" "pqPublicKey"
reject_contains "$ACCOUNT_CONTRACT" "controlKey"
reject_contains "$ACCOUNT_CONTRACT" "onlyControlKey"
reject_contains "$ACCOUNT_CONTRACT" "ECDSA"

if rg -n "privateKeyToAccount|signTransaction|ethers\\.Wallet|new Wallet|secp256k1" \
  "$ROOT_DIR/apps/mobile" "$ROOT_DIR/packages/evm" "$ROOT_DIR/packages/pq-crypto" "$ROOT_DIR/apps/extension" "$ROOT_DIR/packages/contracts/src" >/tmp/qubitor-wallet-eoa-patterns.txt; then
  cat /tmp/qubitor-wallet-eoa-patterns.txt >&2
  fail "wallet runtime must not contain EOA signing primitives"
fi

echo "[qubitor-wallet-pq-native] ok"
