# Data Model

This is the frontend-facing data model needed to support the MVP wallet UX. Exact API shapes can evolve, but product surfaces should preserve these concepts.

## Account

```ts
type Account = {
  id: string;
  label: string;
  address: `0x${string}`;
  accountType: 'qubitor_smart_account' | 'legacy_eoa' | 'team_smart_account';
  chainIds: number[];
  primaryChainId: number;
  securityState: SecurityState;
  recoveryState: RecoveryState;
  createdAt: string;
  updatedAt: string;
};
```

## Smart Account

```ts
type SmartAccount = {
  accountId: string;
  address: `0x${string}`;
  factoryAddress?: `0x${string}`;
  entryPointAddress?: `0x${string}`;
  implementationAddress?: `0x${string}`;
  deploymentStatus: 'counterfactual' | 'deploying' | 'deployed' | 'failed';
  validationMode: ValidationMode;
  validationModules: KeyModule[];
  recoveryModules: RecoveryModule[];
  sessionKeys: SessionKey[];
  moduleUpgradeHistory: ModuleUpgradeEvent[];
};
```

## Security State

```ts
type SecurityState =
  | 'legacy'
  | 'smart_account_ready'
  | 'hybrid_protected'
  | 'pq_ready'
  | 'pq_native';

type ValidationMode =
  | 'legacy_ecdsa'
  | 'smart_account'
  | 'hybrid'
  | 'pq_ready'
  | 'pq_native'
  | 'compatibility';
```

## Key Module

```ts
type KeyModule = {
  id: string;
  accountId: string;
  moduleAddress?: `0x${string}`;
  type:
    | 'legacy_ethereum_key'
    | 'device_key'
    | 'recovery_key'
    | 'guardian_key'
    | 'session_key'
    | 'post_quantum_ready_key'
    | 'hardware_backed_key'
    | 'passkey_assisted_key'
    | 'enterprise_approval_key';
  status: 'active' | 'pending' | 'disabled' | 'rotating' | 'compromised';
  securityState: SecurityState;
  lastChangedAt: string;
  canChangeBy: string[];
};
```

## Recovery Module

```ts
type RecoveryModule = {
  id: string;
  accountId: string;
  method: 'guardian' | 'multi_device' | 'hardware' | 'passkey' | 'team' | 'advanced_policy';
  status: 'not_configured' | 'active' | 'pending' | 'disabled' | 'at_risk';
  strength: 'not_protected' | 'basic' | 'strong' | 'team_protected' | 'enterprise_policy_protected';
  guardians?: Guardian[];
  threshold?: number;
  recoveryDelaySeconds?: number;
  lastTestedAt?: string;
};
```

## Dapp Connection

```ts
type DappConnection = {
  id: string;
  accountId: string;
  appName: string;
  domain: string;
  verified: boolean;
  chainIds: number[];
  permissions: PermissionScope[];
  sessionKeys: string[];
  spendingLimits: SpendingLimit[];
  lastUsedAt?: string;
  riskLevel: WarningLevel;
  securityMode: ValidationMode;
  compatibilityMode: boolean;
};
```

## Session Key

```ts
type SessionKey = {
  id: string;
  accountId: string;
  dappConnectionId?: string;
  publicKey: string;
  chainId: number;
  allowedContracts: `0x${string}`[];
  allowedMethods: string[];
  allowedTokens: `0x${string}`[];
  maxTotalSpend?: string;
  maxPerTransaction?: string;
  spendUsed?: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked' | 'blocked';
};
```

## Asset

```ts
type Asset = {
  id: string;
  chainId: number;
  contractAddress?: `0x${string}`;
  symbol: string;
  name: string;
  decimals?: number;
  balance: string;
  fiatValue?: string;
  assetType: 'native' | 'erc20' | 'erc721' | 'erc1155';
  riskLabel?: 'unknown' | 'spam' | 'bridged' | 'verified';
};
```

## Approval

```ts
type Approval = {
  id: string;
  accountId: string;
  chainId: number;
  tokenAddress: `0x${string}`;
  spenderAddress: `0x${string}`;
  amount: string;
  lastUsedAt?: string;
  riskLevel: WarningLevel;
  revocable: boolean;
};
```

## Transaction

```ts
type Transaction = {
  id: string;
  accountId: string;
  chainId: number;
  from: `0x${string}`;
  to?: `0x${string}`;
  actionSummary: string;
  assetMovements: AssetMovement[];
  feeEstimate?: FeeEstimate;
  simulation: SimulationResult;
  securityMode: ValidationMode;
  validationMethod?: string;
  status: 'draft' | 'awaiting_confirmation' | 'pending' | 'confirmed' | 'failed' | 'rejected';
  hash?: `0x${string}`;
  warnings: Warning[];
};
```

## Signature Request

```ts
type SignatureRequest = {
  id: string;
  accountId: string;
  chainId?: number;
  appName?: string;
  domain?: string;
  type: 'login' | 'permit' | 'order' | 'governance_vote' | 'transaction_authorization' | 'unknown_typed_data' | 'raw_message' | 'high_risk';
  summary: string;
  rawPayload: unknown;
  securityMode: ValidationMode;
  riskLevel: WarningLevel;
  status: 'pending' | 'signed' | 'rejected' | 'blocked';
};
```

## Bridge Route

```ts
type BridgeRoute = {
  id: string;
  sourceChainId: number;
  destinationChainId: number;
  sourceAccount: `0x${string}`;
  destinationAccount: `0x${string}`;
  asset: Asset;
  amount: string;
  routeType: 'legacy_bridge_route' | 'hybrid_protected_route' | 'pq_ready_route' | 'qubitor_native_route';
  fees: FeeEstimate[];
  estimatedDurationSeconds?: number;
  securityStatus: string;
  warnings: Warning[];
};
```

## Readiness Report

```ts
type ReadinessReport = {
  accountId: string;
  label: SecurityState;
  numericScore?: number;
  sections: ReadinessSection[];
  recommendedActions: RecommendedAction[];
  protectedAreas: string[];
  partiallyProtectedAreas: string[];
  legacyAreas: string[];
  externalDependencies: string[];
  generatedAt: string;
};
```

## Notification and Activity

```ts
type Notification = {
  id: string;
  accountId: string;
  level: WarningLevel;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
  createdAt: string;
  readAt?: string;
};

type ActivityEvent = {
  id: string;
  accountId: string;
  type:
    | 'transaction_sent'
    | 'asset_received'
    | 'contract_interaction'
    | 'message_signed'
    | 'dapp_connected'
    | 'dapp_revoked'
    | 'approval_granted'
    | 'approval_revoked'
    | 'session_key_created'
    | 'session_key_revoked'
    | 'key_rotated'
    | 'recovery_changed'
    | 'bridge_started'
    | 'bridge_completed'
    | 'security_warning'
    | 'account_module_changed';
  summary: string;
  chainId?: number;
  appDomain?: string;
  securityMode?: ValidationMode;
  transactionHash?: `0x${string}`;
  rawDetails?: unknown;
  createdAt: string;
};
```

## Shared Types

```ts
type WarningLevel = 'info' | 'caution' | 'warning' | 'critical' | 'blocked_by_policy';

type Warning = {
  id: string;
  level: WarningLevel;
  title: string;
  body: string;
  requiredAction?: string;
};
```

