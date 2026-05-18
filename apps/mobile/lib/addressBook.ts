import AsyncStorage from "@react-native-async-storage/async-storage";
import { isValidEvmAddress, normalizeEvmAddress } from "@qubitor/evm";
import type { Hex } from "@qubitor/core";

const STORAGE_KEY = "quanta.wallet.addressbook.v1";

export interface Contact {
  id: string;
  label: string;
  address: Hex;
  createdAt: number;
}

async function readAll(): Promise<Contact[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Contact[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function listContacts(): Promise<Contact[]> {
  return (await readAll()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addContact(label: string, address: string): Promise<Contact> {
  const trimmedLabel = label.trim();
  const trimmedAddress = address.trim();
  if (!trimmedLabel) throw new Error("Label is required.");
  if (!isValidEvmAddress(trimmedAddress)) throw new Error("Not a valid 0x address.");
  const normalized = normalizeEvmAddress(trimmedAddress);
  const contacts = await readAll();
  if (contacts.some((c) => c.address.toLowerCase() === normalized.toLowerCase())) {
    throw new Error("That address is already saved.");
  }
  const contact: Contact = {
    id: `${Date.now()}-${normalized.slice(2, 8)}`,
    label: trimmedLabel,
    address: normalized,
    createdAt: Date.now(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([contact, ...contacts]));
  return contact;
}

export async function removeContact(id: string): Promise<void> {
  const contacts = await readAll();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contacts.filter((c) => c.id !== id)));
}

/**
 * Real address-poisoning heuristic: an attacker seeds your history with an
 * address that shares the leading/trailing hex you eyeball but differs in the
 * middle. Flags any saved contact whose first `lead`+last `trail` hex match the
 * candidate while the full address differs.
 */
export function detectPoisoning(
  candidate: string,
  contacts: Contact[],
  lead = 6,
  trail = 4,
): Contact | undefined {
  if (!isValidEvmAddress(candidate)) return undefined;
  const c = normalizeEvmAddress(candidate).toLowerCase();
  const head = c.slice(0, lead + 2); // include "0x"
  const tail = c.slice(-trail);
  return contacts.find((existing) => {
    const e = existing.address.toLowerCase();
    if (e === c) return false;
    return e.slice(0, lead + 2) === head && e.slice(-trail) === tail;
  });
}
