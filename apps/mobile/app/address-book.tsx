import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Trash2, ShieldAlert } from "lucide-react-native";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Text";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Row } from "@/components/Row";
import { WarningCard } from "@/components/WarningCard";
import { colors } from "@qubitor/ui-tokens";
import { isValidEvmAddress } from "@qubitor/evm";
import { addContact, detectPoisoning, listContacts, removeContact, type Contact } from "@/lib/addressBook";

/** Real address book — AsyncStorage-backed, with live poisoning detection. */
export default function AddressBook() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | undefined>();

  const reload = useCallback(() => {
    listContacts().then(setContacts);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const trimmed = address.trim();
  const addressValid = trimmed.length === 0 || isValidEvmAddress(trimmed);
  const poisonMatch =
    trimmed.length > 0 && isValidEvmAddress(trimmed) ? detectPoisoning(trimmed, contacts) : undefined;

  const save = async () => {
    setError(undefined);
    try {
      await addContact(label, address);
      setLabel("");
      setAddress("");
      reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save contact.");
    }
  };

  const del = async (id: string) => {
    await removeContact(id);
    reload();
  };

  return (
    <PageContainer>
      <PageHeader title="Address book" showBack />

      <View className="gap-5">
        <Card>
          <Text variant="label" muted className="mb-2">
            Add contact
          </Text>
          <View className="gap-3">
            <Input label="Label" placeholder="e.g. Treasury" value={label} onChangeText={setLabel} />
            <Input
              label="Address"
              placeholder="0x…"
              value={address}
              onChangeText={setAddress}
              autoCapitalize="none"
            />
          </View>
          {!addressValid ? (
            <View className="mt-3">
              <WarningCard severity="warning" title="Invalid address" detail="Enter a valid 0x address." />
            </View>
          ) : null}
          {poisonMatch ? (
            <View className="mt-3">
              <WarningCard
                severity="critical"
                title="Possible address poisoning"
                detail={`This address mimics the start/end of saved contact "${poisonMatch.label}" but is different. Verify every character.`}
              />
            </View>
          ) : null}
          {error ? (
            <View className="mt-3">
              <WarningCard severity="warning" title="Couldn't save" detail={error} />
            </View>
          ) : null}
          <View className="items-center mt-4">
            <Button
              onPress={save}
              disabled={label.trim().length === 0 || !isValidEvmAddress(trimmed)}
            >
              Save contact
            </Button>
          </View>
        </Card>

        <View>
          <Text variant="label" muted className="mb-3">
            Saved ({contacts.length})
          </Text>
          {contacts.length === 0 ? (
            <Card>
              <Text variant="body" muted>
                No saved contacts yet. Added addresses are stored locally on this device only.
              </Text>
            </Card>
          ) : (
            <Card>
              {contacts.map((c, i) => (
                <Row
                  key={c.id}
                  label={c.label}
                  detail={`${c.address.slice(0, 10)}…${c.address.slice(-6)}`}
                  showChevron={false}
                  last={i === contacts.length - 1}
                  trailing={
                    <Pressable onPress={() => del(c.id)} hitSlop={8}>
                      <Trash2 size={18} color={colors.warn} />
                    </Pressable>
                  }
                />
              ))}
            </Card>
          )}
        </View>

        <View className="flex-row items-center gap-2 px-1">
          <ShieldAlert size={14} color={colors.textMuted} />
          <Text variant="caption" muted>
            Poisoning check compares the visible start and end of each address.
          </Text>
        </View>
      </View>
    </PageContainer>
  );
}
