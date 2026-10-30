// Saves everything on the phone, in the same shape the website uses, so a
// backup moves between the two without any conversion.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalize, SORTS, THEMES, REMINDERS, LANGS } from "./logic";

export const KEY = "living-expenses.v2";

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    const arr = Array.isArray(p) ? p : p && p.items;
    return {
      items: Array.isArray(arr) ? arr.map(normalize) : [],
      currency: p && typeof p.currency === "string" && p.currency ? p.currency : null,
      sort: p && SORTS.includes(p.sort) ? p.sort : "added",
      lang: p && LANGS.some((l) => l.value === p.lang) ? p.lang : null,
      theme: p && THEMES.includes(p.theme) ? p.theme : "auto",
      reminders: p && REMINDERS.includes(p.reminders) ? p.reminders : "off",
    };
  } catch (e) {
    return null;
  }
}

export async function saveState(s) {
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify({
      version: 2,
      savedAt: new Date().toISOString(),
      currency: s.currency,
      sort: s.sort,
      lang: s.lang,
      theme: s.theme,
      reminders: s.reminders,
      items: s.items,
    })
  );
}

// The export file is exactly what the website writes, so either can import it.
export function backupText(items, currency) {
  return JSON.stringify({ version: 2, currency, items }, null, 2);
}
