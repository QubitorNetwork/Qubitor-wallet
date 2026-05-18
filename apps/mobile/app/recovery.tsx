import { useEffect, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { KeyRound, Users } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Row } from "@/components/Row";
import { SettingsRow } from "@/components/SettingsRow";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { WarningCard } from "@/components/WarningCard";
import { Input } from "@/components/Input";
import { useAccountSnapshot } from "@/hooks/useAccountSnapshot";
import { shareQubitorDevPQBackup } from "@/lib/externalActions";
import {
  exportQubitorDevPQBackup,
  exportQubitorDevPQEncryptedBackup,
  inspectQubitorDevPQBackup,
  restoreQubitorDevPQBackup,
  type QubitorDevPQWalletBackupPreview,
} from "@/lib/pqDevWallet";
import { recordWalletActivity } from "@/lib/walletActivity";
import { getBackupState, markBackedUp } from "@/lib/backupState";
import { DebugOnly } from "@/components/DebugOnly";

type BackupStatus = "idle" | "exporting" | "exported" | "reviewed" | "restoring" | "restored" | "error";

function shortHash(value?: string) {
  if (!value) return "Not recorded";
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

/** Real recovery — PQ key lifecycle, encrypted backup/restore, and a real
 *  "is the Recovery Kit backed up?" gate. Guardian/multi-device recovery has
 *  no on-chain backend on Qubitor yet, so it is shown honestly as upcoming. */
export default function Recovery() {
  const snapshot = useAccountSnapshot();
  const walletChainId = snapshot.account.chainId;
  const [backupPasscode, setBackupPasscode] = useState("");
  const [restorePayload, setRestorePayload] = useState("");
  const [restorePreview, setRestorePreview] = useState<QubitorDevPQWalletBackupPreview | undefined>();
  const [backupStatus, setBackupStatus] = useState<BackupStatus>("idle");
  const [backupError, setBackupError] = useState<string | undefined>();
  const [lastBackupAt, setLastBackupAt] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    getBackupState(walletChainId).then((s) => {
      if (active) setLastBackupAt(s.lastBackupAt);
    });
    return () => {
      active = false;
    };
  }, [walletChainId, backupStatus]);

  const hasBackup = Boolean(lastBackupAt);
  const pqKeyVersion = snapshot.pqProfile?.keyVersion ?? 1;
  const canRotatePQ =
    snapshot.isQubitorDevnet && snapshot.account.deployed && snapshot.pqRotateStatus !== "requesting";
  const rotatePQ = () => {
    void snapshot.rotatePQKey().catch(() => undefined);
  };

  const exportBackup = () => {
    if (backupPasscode.length < 8) {
      setBackupStatus("error");
      setBackupError("Choose a backup passcode with at least 8 characters.");
      return;
    }
    setBackupStatus("exporting");
    setBackupError(undefined);
    void exportQubitorDevPQEncryptedBackup(backupPasscode, walletChainId)
      .then((payload) => shareQubitorDevPQBackup(payload))
      .then(() => markBackedUp(walletChainId))
      .then(() => {
        setBackupPasscode("");
        setBackupStatus("exported");
      })
      .catch((error) => {
        setBackupStatus("error");
        setBackupError(error instanceof Error ? error.message : "Could not export PQ backup.");
      });
  };
  const exportDebugBackup = () => {
    setBackupStatus("exporting");
    setBackupError(undefined);
    void exportQubitorDevPQBackup(walletChainId)
      .then((payload) => shareQubitorDevPQBackup(payload))
      .then(() => {
        setBackupStatus("exported");
      })
      .catch((error) => {
        setBackupStatus("error");
        setBackupError(error instanceof Error ? error.message : "Could not export PQ backup.");
      });
  };
  const reviewRestoreBackup = () => {
    const encoded = restorePayload.trim();
    if (!encoded) return;
    if (backupPasscode.length < 8) {
      setBackupStatus("error");
      setBackupError("Enter the backup passcode before reviewing this backup.");
      return;
    }
    setBackupStatus("restoring");
    setBackupError(undefined);
    setRestorePreview(undefined);
    void inspectQubitorDevPQBackup(encoded, backupPasscode, walletChainId)
      .then((preview) => {
        setRestorePreview(preview);
        setBackupStatus("reviewed");
      })
      .catch((error) => {
        setBackupStatus("error");
        setBackupError(error instanceof Error ? error.message : "Could not read PQ backup.");
      });
  };
  const confirmRestoreBackup = () => {
    const encoded = restorePayload.trim();
    if (!encoded || !restorePreview) return;
    setBackupStatus("restoring");
    setBackupError(undefined);
    void restoreQubitorDevPQBackup(encoded, backupPasscode, walletChainId)
      .then(async (profile) => {
        await recordWalletActivity(
          { chainId: walletChainId, accountAddress: profile.accountAddress ?? snapshot.account.address },
          {
            type: "security",
            title: "PQ backup restored",
            detail: `ML-DSA key v${profile.keyVersion} restored on this device`,
            badge: "PQ Native",
            security: "Local encrypted backup",
            status: "success",
          },
        );
        setRestorePayload("");
        setRestorePreview(undefined);
        setBackupPasscode("");
        setBackupStatus("restored");
        snapshot.refresh();
      })
      .catch((error) => {
        setBackupStatus("error");
        setBackupError(error instanceof Error ? error.message : "Could not restore PQ backup.");
      });
  };

  return (
    <PageContainer>
      <PageHeader title="Recovery & Rotation" showBack />

      <View className="gap-5">
        <Text variant="body" muted>
          Your Qubitor address stays the same. Recovery protects the ML-DSA key behind it.
        </Text>

        <View className="bg-qb-panel border border-qb-line-strong rounded-xl p-5">
          <View className="flex-row items-center justify-between">
            <Text variant="body" weight="semibold">
              Recovery Kit
            </Text>
            <Badge label={hasBackup ? "Recovery Active" : "Recovery Missing"} />
          </View>
          <Text variant="page-title" weight="bold" className="mt-2">
            {hasBackup ? "Backed up" : "Not backed up"}
          </Text>
          <Text variant="caption" className="mt-1 opacity-80">
            {hasBackup
              ? `Last encrypted backup exported ${new Date(lastBackupAt!).toLocaleString()}.`
              : "Export an encrypted Recovery Kit before moving significant funds. Without it, a lost device means lost account control."}
          </Text>
        </View>

        {!hasBackup ? (
          <WarningCard
            severity="warning"
            title="No Recovery Kit on file"
            detail="Set a backup passcode below and export the encrypted kit. Store it somewhere only you control."
          />
        ) : null}
        {snapshot.isQubitorDevnet && !snapshot.account.deployed ? (
          <WarningCard
            severity="review"
            title="Deploy before rotating"
            detail="The account must exist onchain before it can authorize a PQ key rotation."
          />
        ) : null}
        {snapshot.pqRotateStatus === "success" ? (
          <WarningCard
            severity="info"
            title="PQ key rotated"
            detail={snapshot.pqRotateReceipt?.transactionHash ?? "The new ML-DSA key is now active."}
          />
        ) : null}
        {snapshot.pqRotateStatus === "error" ? (
          <WarningCard
            severity="warning"
            title="PQ key rotation failed"
            detail={snapshot.pqRotateError ?? "The old key remains active."}
          />
        ) : null}
        {backupStatus === "exported" ? (
          <WarningCard
            severity="info"
            title="Recovery Kit exported"
            detail="The encrypted wallet backup JSON was sent to the system share sheet."
          />
        ) : null}
        {backupStatus === "reviewed" && restorePreview ? (
          <WarningCard
            severity="info"
            title="Review backup before restore"
            detail="Confirm the account details below before replacing the on-device PQ profile."
          />
        ) : null}
        {backupStatus === "restored" ? (
          <WarningCard
            severity="info"
            title="Recovery Kit restored"
            detail="The on-device ML-DSA wallet profile was replaced and live state is refreshing."
          />
        ) : null}
        {backupStatus === "error" ? (
          <WarningCard
            severity="warning"
            title="Recovery Kit failed"
            detail={backupError ?? "The backup operation could not be completed."}
          />
        ) : null}

        {snapshot.isQubitorDevnet ? (
          <Card>
            <Text variant="body" weight="semibold">
              PQ key lifecycle
            </Text>
            <View className="mt-3">
              <Row
                label="Account"
                value={snapshot.account.deployed ? "Deployed" : "Counterfactual"}
                showChevron={false}
              />
              <Row label="Key version" value={`v${pqKeyVersion}`} showChevron={false} />
              <Row
                label="Active key"
                value={shortHash(snapshot.pqCurrentPublicKeyCommitment)}
                showChevron={false}
              />
              <Row
                label="Last rotation"
                value={snapshot.pqProfile?.lastRotationAt ? "Recorded" : "Never"}
                showChevron={false}
                last
              />
            </View>
            <View className="mt-4">
              <Button onPress={rotatePQ} disabled={!canRotatePQ}>
                {snapshot.pqRotateStatus === "requesting" ? "Rotating PQ Key" : "Rotate PQ Key"}
              </Button>
            </View>
          </Card>
        ) : null}

        {snapshot.isQubitorDevnet ? (
          <Card>
            <Text variant="body" weight="semibold">
              Backup & restore
            </Text>
            <Text variant="caption" muted className="mt-1">
              Encrypted backup protects the active ML-DSA private key with a passcode before sharing.
            </Text>
            <View className="mt-4">
              <Input
                label="Backup passcode"
                value={backupPasscode}
                onChangeText={(value) => {
                  setBackupPasscode(value);
                  setRestorePreview(undefined);
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="At least 8 characters"
              />
            </View>
            <View className="mt-4 flex-row gap-3">
              <Button
                className="flex-1"
                variant="secondary"
                onPress={exportBackup}
                disabled={backupPasscode.length < 8 || backupStatus === "exporting" || backupStatus === "restoring"}
              >
                {backupStatus === "exporting" ? "Exporting" : "Export Encrypted"}
              </Button>
              <Button
                className="flex-1"
                variant="secondary"
                onPress={restorePreview ? confirmRestoreBackup : reviewRestoreBackup}
                disabled={
                  !restorePayload.trim() ||
                  backupPasscode.length < 8 ||
                  backupStatus === "exporting" ||
                  backupStatus === "restoring"
                }
              >
                {backupStatus === "restoring" ? "Reading" : restorePreview ? "Confirm Restore" : "Review Restore"}
              </Button>
            </View>
            {restorePreview ? (
              <View className="mt-4">
                <Row label="Backup type" value={restorePreview.encrypted ? "Encrypted" : "Plain JSON"} showChevron={false} />
                <Row label="Chain ID" value={String(restorePreview.chainId)} showChevron={false} />
                <Row
                  label="Account"
                  value={restorePreview.accountAddress ? shortHash(restorePreview.accountAddress) : "Counterfactual"}
                  showChevron={false}
                />
                <Row label="Key version" value={`v${restorePreview.keyVersion}`} showChevron={false} last />
              </View>
            ) : null}
            <View className="mt-4">
              <Input
                label="Paste backup JSON"
                value={restorePayload}
                onChangeText={(value) => {
                  setRestorePayload(value);
                  setRestorePreview(undefined);
                }}
                multiline
                textAlignVertical="top"
                autoCapitalize="none"
                autoCorrect={false}
                className="h-32 text-caption"
                placeholder="{ ... }"
              />
            </View>
            <DebugOnly>
              <View className="mt-4 self-start">
                <Button
                  variant="tertiary"
                  onPress={exportDebugBackup}
                  disabled={backupStatus === "exporting" || backupStatus === "restoring"}
                >
                  Export Plain JSON
                </Button>
              </View>
            </DebugOnly>
          </Card>
        ) : null}

        <View>
          <SettingsRow
            Icon={KeyRound}
            iconColor="green"
            label="Key rotation"
            detail={
              snapshot.isQubitorDevnet
                ? `On-device ML-DSA key v${pqKeyVersion}`
                : "Available on Qubitor PQ networks"
            }
            onPress={snapshot.isQubitorDevnet && canRotatePQ ? rotatePQ : undefined}
          />
          <SettingsRow
            Icon={Users}
            iconColor="gray"
            label="Guardian & multi-device recovery"
            detail="Coming soon — no on-chain guardian module yet"
            onPress={() => router.push("/guardians")}
          />
        </View>
      </View>
    </PageContainer>
  );
}
