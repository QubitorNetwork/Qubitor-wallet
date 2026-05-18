import { useCallback, useEffect, useRef, useState } from "react";
import {
  createExtensionWalletProfile,
  exportExtensionRecoveryKit,
  getStoredExtensionWalletPreview,
  readExtensionActivity,
  restoreExtensionWalletProfile,
  unlockExtensionWalletProfile,
  wipeExtensionWallet,
  type ExtensionActivityItem,
  type ExtensionPQWalletProfile,
} from "./extensionWalletVault";
import {
  readExtensionWalletSnapshot,
  requestExtensionFaucet,
  rotateExtensionPQKey,
  sendExtensionQbt,
  type ExtensionWalletSnapshot,
} from "./extensionWalletRuntime";

export type WalletStatus = "loading" | "no-wallet" | "locked" | "unlocked";

export interface ExtensionWalletState {
  status: WalletStatus;
  busy: boolean;
  error: string | null;
  snapshot: ExtensionWalletSnapshot | null;
  activity: ExtensionActivityItem[];
  createWallet: (passcode: string) => Promise<void>;
  unlock: (passcode: string) => Promise<void>;
  restore: (encoded: string, passcode: string) => Promise<void>;
  lock: () => void;
  refresh: () => Promise<void>;
  faucet: () => Promise<void>;
  send: (args: { recipient: string; amount: string }) => Promise<void>;
  rotate: () => Promise<void>;
  exportKit: () => Promise<string>;
  wipe: () => Promise<void>;
  clearError: () => void;
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

/** Standalone-signer state machine for the popup and options surfaces. The
 *  passcode is held only in a ref (memory) for the unlocked session and is
 *  never persisted; locking or closing the surface drops it. */
export function useExtensionWallet(): ExtensionWalletState {
  const [status, setStatus] = useState<WalletStatus>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<ExtensionWalletSnapshot | null>(null);
  const [activity, setActivity] = useState<ExtensionActivityItem[]>([]);

  const profileRef = useRef<ExtensionPQWalletProfile | null>(null);
  const passcodeRef = useRef<string | null>(null);

  useEffect(() => {
    getStoredExtensionWalletPreview()
      .then((preview) => setStatus(preview ? "locked" : "no-wallet"))
      .catch(() => setStatus("no-wallet"));
  }, []);

  const loadAfterUnlock = useCallback(async (profile: ExtensionPQWalletProfile, passcode: string) => {
    profileRef.current = profile;
    passcodeRef.current = passcode;
    const { profile: saved, snapshot: snap } = await readExtensionWalletSnapshot(profile, passcode);
    profileRef.current = saved;
    setSnapshot(snap);
    setActivity(await readExtensionActivity());
    setStatus("unlocked");
  }, []);

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      setBusy(true);
      setError(null);
      try {
        await fn();
      } catch (e) {
        setError(messageOf(e));
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const createWallet = useCallback(
    (passcode: string) =>
      run(async () => {
        const profile = await createExtensionWalletProfile(passcode);
        await loadAfterUnlock(profile, passcode);
      }),
    [run, loadAfterUnlock],
  );

  const unlock = useCallback(
    (passcode: string) =>
      run(async () => {
        const profile = await unlockExtensionWalletProfile(passcode);
        await loadAfterUnlock(profile, passcode);
      }),
    [run, loadAfterUnlock],
  );

  const restore = useCallback(
    (encoded: string, passcode: string) =>
      run(async () => {
        const profile = await restoreExtensionWalletProfile(encoded, passcode);
        await loadAfterUnlock(profile, passcode);
      }),
    [run, loadAfterUnlock],
  );

  const lock = useCallback(() => {
    profileRef.current = null;
    passcodeRef.current = null;
    setSnapshot(null);
    setActivity([]);
    setError(null);
    setStatus("locked");
  }, []);

  const requireSession = () => {
    const profile = profileRef.current;
    const passcode = passcodeRef.current;
    if (!profile || !passcode) throw new Error("Wallet is locked. Unlock to continue.");
    return { profile, passcode };
  };

  const refresh = useCallback(
    () =>
      run(async () => {
        const { profile, passcode } = requireSession();
        const { profile: saved, snapshot: snap } = await readExtensionWalletSnapshot(profile, passcode);
        profileRef.current = saved;
        setSnapshot(snap);
        setActivity(await readExtensionActivity());
      }),
    [run],
  );

  const faucet = useCallback(
    () =>
      run(async () => {
        const { profile, passcode } = requireSession();
        await requestExtensionFaucet(profile, passcode);
        const { profile: saved, snapshot: snap } = await readExtensionWalletSnapshot(profile, passcode);
        profileRef.current = saved;
        setSnapshot(snap);
        setActivity(await readExtensionActivity());
      }),
    [run],
  );

  const send = useCallback(
    (args: { recipient: string; amount: string }) =>
      run(async () => {
        const { profile, passcode } = requireSession();
        await sendExtensionQbt(profile, passcode, args);
        const { profile: saved, snapshot: snap } = await readExtensionWalletSnapshot(profile, passcode);
        profileRef.current = saved;
        setSnapshot(snap);
        setActivity(await readExtensionActivity());
      }),
    [run],
  );

  const rotate = useCallback(
    () =>
      run(async () => {
        const { profile, passcode } = requireSession();
        const { profile: nextProfile } = await rotateExtensionPQKey(profile, passcode);
        const { profile: saved, snapshot: snap } = await readExtensionWalletSnapshot(nextProfile, passcode);
        profileRef.current = saved;
        setSnapshot(snap);
        setActivity(await readExtensionActivity());
      }),
    [run],
  );

  const exportKit = useCallback(async () => {
    requireSession();
    return exportExtensionRecoveryKit();
  }, []);

  const wipe = useCallback(
    () =>
      run(async () => {
        await wipeExtensionWallet();
        profileRef.current = null;
        passcodeRef.current = null;
        setSnapshot(null);
        setActivity([]);
        setStatus("no-wallet");
      }),
    [run],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    status,
    busy,
    error,
    snapshot,
    activity,
    createWallet,
    unlock,
    restore,
    lock,
    refresh,
    faucet,
    send,
    rotate,
    exportKit,
    wipe,
    clearError,
  };
}
