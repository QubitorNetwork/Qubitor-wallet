import { useState } from "react";
import { Platform, View } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { router } from "expo-router";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { WarningCard } from "@/components/WarningCard";
import { isValidEvmAddress } from "@qubitor/evm";

function addressFromPayload(payload: string): string | undefined {
  const trimmed = payload.trim();
  if (isValidEvmAddress(trimmed)) return trimmed;
  const match = trimmed.match(/0x[a-fA-F0-9]{40}/);
  return match && isValidEvmAddress(match[0]) ? match[0] : undefined;
}

export default function ScanRecipient() {
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [scanned, setScanned] = useState(false);

  const chooseAddress = (address: string) => {
    router.replace({ pathname: "/send", params: { recipient: address } });
  };

  const handleScan = ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    const address = addressFromPayload(data);
    if (!address) {
      setError("That QR code did not contain a valid 0x recipient address.");
      return;
    }
    setScanned(true);
    chooseAddress(address);
  };

  const submitManual = () => {
    const address = addressFromPayload(manual);
    if (!address) {
      setError("Enter or paste a valid 0x address.");
      return;
    }
    chooseAddress(address);
  };

  const canUseCamera = Platform.OS !== "web" && permission?.granted;

  return (
    <PageContainer>
      <PageHeader title="Scan recipient" showBack centerTitle />

      <View className="gap-5">
        {canUseCamera ? (
          <View className="overflow-hidden rounded-xl border border-qb-line bg-qb-panel aspect-square">
            <CameraView
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={handleScan}
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <Card>
            <Text variant="body-lg" weight="semibold">
              Camera access
            </Text>
            <Text variant="body" muted className="mt-2">
              {Platform.OS === "web"
                ? "Camera scanning is available in native mobile builds. Paste the recipient address below on desktop or web."
                : permission?.canAskAgain === false
                  ? "Camera permission is blocked in system settings. Paste the recipient address below."
                  : "Grant camera access to scan a recipient QR code."}
            </Text>
            {Platform.OS !== "web" && permission?.canAskAgain !== false ? (
              <View className="mt-4">
                <Button onPress={requestPermission}>Allow camera</Button>
              </View>
            ) : null}
          </Card>
        )}

        {error ? <WarningCard severity="warning" title="Recipient not found" detail={error} /> : null}

        <Card>
          <Input
            label="Paste recipient"
            placeholder="0x..."
            value={manual}
            onChangeText={setManual}
            autoCapitalize="none"
          />
          <View className="mt-4">
            <Button size="block" onPress={submitManual}>
              Use address
            </Button>
          </View>
        </Card>
      </View>
    </PageContainer>
  );
}
