import { Alert, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";

function copyWithDomFallback(text: string): boolean {
  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

export async function copyText(text: string, label = "Text"): Promise<boolean> {
  if (!text) return false;

  try {
    if (Platform.OS === "web") {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      return copyWithDomFallback(text);
    }

    await Clipboard.setStringAsync(text);
    return true;
  } catch (error) {
    const detail = error instanceof Error ? error.message : `${label} could not be copied.`;
    Alert.alert("Copy unavailable", detail);
    return false;
  }
}
