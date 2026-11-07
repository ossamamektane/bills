// Bills — everything you pay on repeat, in one place.
// The main screen: the month's total, the list, and the sheets that edit it.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as Localization from "expo-localization";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as Notifications from "expo-notifications";
import { File, Paths } from "expo-file-system";

import { PALETTES, UI, dirStyles } from "./src/theme";
import { loadState, saveState, backupText } from "./src/storage";
import { ensurePermission, syncReminders } from "./src/notifications";
import { guessDefaults, nExpenses, nItems, nPaused, normalize, ordered, parseBackup, t } from "./src/logic";
import Summary from "./src/components/Summary";
import ExpenseRow from "./src/components/ExpenseRow";
import ExpenseSheet from "./src/components/ExpenseSheet";
import SettingsSheet from "./src/components/SettingsSheet";
import OptionSheet from "./src/components/OptionSheet";
import { Pill, Toast, Txt } from "./src/components/ui";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  return (
    <SafeAreaProvider>
      <Bills />
    </SafeAreaProvider>
  );
}

function Bills() {
  const insets = useSafeAreaInsets();
  const system = useColorScheme();

  const [ready, setReady] = useState(false);
  const [items, setItems] = useState([]);
  const [currency, setCurrency] = useState("MAD");
  const [sort, setSort] = useState("added");
  const [lang, setLang] = useState("en");
  const [theme, setTheme] = useState("auto");
  const [reminders, setRemindersMode] = useState("off");
  const [remindDenied, setRemindDenied] = useState(false);

  const [selMonth, setSelMonth] = useState(0);
  const [editing, setEditing] = useState({ open: false, item: null });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState("savedHere");
  const [, setDayTick] = useState(0); // re-renders when the date changes
  const toastT = useRef(null);
  const statusT = useRef(null);
  const firstSave = useRef(true);

  const dark = theme === "dark" || (theme === "auto" && system === "dark");
  const rtl = lang === "ar";
  const ui = useMemo(
    () => ({ c: PALETTES[dark ? "dark" : "light"], d: dirStyles(rtl), rtl, lang, dark, tr: (k, v) => t(lang, k, v) }),
    [dark, rtl, lang]
  );
  const { c, d, tr } = ui;

  /* ---------- load once ---------- */
  useEffect(() => {
    (async () => {
      const saved = await loadState();
      let guess = { currency: "MAD", lang: "en" };
      try {
        const loc = Localization.getLocales() || [];
        const cal = (Localization.getCalendars && Localization.getCalendars()) || [];
        guess = guessDefaults({
          timeZone: cal[0] && cal[0].timeZone,
          regionCode: loc[0] && loc[0].regionCode,
          languageCodes: loc.map((l) => l.languageCode),
        });
      } catch (e) { /* keep defaults */ }
      if (saved) {
        setItems(saved.items);
        setSort(saved.sort);
        setTheme(saved.theme);
        setRemindersMode(saved.reminders);
      }
      setCurrency((saved && saved.currency) || guess.currency);
      setLang((saved && saved.lang) || guess.lang);
      setReady(true);
    })();
  }, []);

  /* ---------- save on every change ---------- */
  useEffect(() => {
    if (!ready) return;
    saveState({ items, currency, sort, lang, theme, reminders })
      .then(() => {
        if (firstSave.current) { firstSave.current = false; return; }
        setStatus("savedNow");
        clearTimeout(statusT.current);
        statusT.current = setTimeout(() => setStatus("savedHere"), 1600);
      })
      .catch(() => setStatus("notSaving"));
  }, [ready, items, currency, sort, lang, theme, reminders]);

  /* ---------- reminders follow the data ---------- */
  const resync = useCallback(() => {
    if (ready) syncReminders({ items, mode: reminders, lang, currency });
  }, [ready, items, reminders, lang, currency]);
  useEffect(() => {
    const id = setTimeout(resync, 500);
    return () => clearTimeout(id);
  }, [resync]);

  /* ---------- a new day, or back from the background ---------- */
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (s) => {
      if (s !== "active") return;
      setDayTick(Date.now());
      if (reminders !== "off") {
        const p = await Notifications.getPermissionsAsync();
        setRemindDenied(!p.granted);
        resync();
      }
    });
    let timer;
    const arm = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(() => { setDayTick(Date.now()); arm(); }, Math.max(1000, next - now));
    };
    arm();
    return () => { sub.remove(); clearTimeout(timer); };
  }, [reminders, resync]);

  /* ---------- toast + undo ---------- */
  const showToast = (message, before) => {
    clearTimeout(toastT.current);
    setToast({ message, undo: before || null });
    toastT.current = setTimeout(() => setToast(null), before ? 7000 : 3200);
  };
  const undo = () => {
    if (!toast || !toast.undo) return;
    setItems(toast.undo.map(normalize));
    clearTimeout(toastT.current);
    setToast(null);
    showToast(tr("restored"));
  };

  /* ---------- actions ---------- */
  const saveExpense = (it) => {
    setItems((prev) => (prev.some((p) => p.id === it.id) ? prev.map((p) => (p.id === it.id ? it : p)) : [...prev, it]));
    setEditing((e) => ({ ...e, open: false }));
  };
  const deleteExpense = (it) => {
    const before = items;
    setItems(items.filter((p) => p.id !== it.id));
    setEditing((e) => ({ ...e, open: false }));
    showToast(it.name ? tr("removedNamed", { n: it.name }) : tr("removedExpense"), before);
  };
  const toggle = (it) => {
    const before = items;
    const paused = !it.paused;
    setItems(items.map((p) => (p.id === it.id ? { ...p, paused } : p)));
    if (sort !== "added") showToast((paused ? tr("pausedPrefix") : tr("resumedPrefix")) + " " + (it.name || tr("thisExpense")), before);
  };

  const setReminders = async (mode) => {
    setRemindersMode(mode);
    if (mode === "off") { setRemindDenied(false); return; }
    const ok = await ensurePermission();
    setRemindDenied(!ok);
  };

  const doExport = async () => {
    setSettingsOpen(false);
    await wait(350);
    try {
      const file = new File(Paths.cache, "bills.json");
      if (file.exists) file.delete();
      file.create();
      await file.write(backupText(items, currency));
      await Sharing.shareAsync(file.uri, { mimeType: "application/json", UTI: "public.json", dialogTitle: "bills.json" });
    } catch (e) {
      console.warn("Export failed", e);
    }
  };

  const doImport = async () => {
    setSettingsOpen(false);
    await wait(350);
    let parsed;
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ["application/json", "text/plain", "*/*"], copyToCacheDirectory: true });
      if (res.canceled || !res.assets || !res.assets[0]) return;
      parsed = parseBackup(await new File(res.assets[0].uri).text());
    } catch (e) {
      Alert.alert(tr("badFile"));
      return;
    }
    const apply = () => {
      const before = items;
      setItems(parsed.items);
      if (parsed.currency) setCurrency(parsed.currency);
      setSelMonth(0);
      showToast(tr("importedPrefix") + " " + nExpenses(lang, parsed.items.length), before);
    };
    if (!items.length) return apply();
    Alert.alert(tr("importConfirmTitle"), tr("importConfirmBody"), [
      { text: tr("cancelWord"), style: "cancel" },
      { text: tr("replaceWord"), style: "destructive", onPress: apply },
    ]);
  };

  const doClear = () => {
    const before = items;
    const n = items.length;
    setItems([]);
    setSettingsOpen(false);
    setSelMonth(0);
    showToast(tr("clearedPrefix") + " " + nExpenses(lang, n), before);
  };

  if (!ready) return <View style={{ flex: 1, backgroundColor: c.canvas }} />;

  const list = ordered(items, sort);
  const pausedCount = items.filter((i) => i.paused).length;
  const sortOptions = ["added", "next", "cost"].map((v) => ({ value: v, label: tr("sort_" + v) }));
  const openAdd = () => setEditing({ open: true, item: null });

  return (
    <UI.Provider value={ui}>
      <View style={{ flex: 1, backgroundColor: c.canvas }}>
        <StatusBar style={dark ? "light" : "dark"} />
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 6,
            paddingBottom: insets.bottom + (items.length ? 110 : 40),
            paddingLeft: Math.max(insets.left, 18),
            paddingRight: Math.max(insets.right, 18),
          }}
        >
          <View style={styles.column}>
            <View style={{ flexDirection: d.row, justifyContent: "flex-end" }}>
              <Pressable
                onPress={() => setSettingsOpen(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={tr("settingsTitle")}
                style={({ pressed }) => [styles.round, { backgroundColor: c.surface }, pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="options-outline" size={20} color={c.text} />
              </Pressable>
            </View>

            <View style={styles.hero}>
              <Text style={[styles.wordmark, { color: c.text }]}>Bills</Text>
              <Text style={[styles.heroSub, { color: c.muted }]}>{tr("heroSub")}</Text>
            </View>

            <Summary items={items} currency={currency} selMonth={selMonth} onSelect={setSelMonth} />

            <View style={[styles.panel, { borderColor: c.hairline, backgroundColor: c.row }]}>
              <View style={[styles.panelHead, { flexDirection: d.row }]}>
                <Txt style={styles.panelTitle}>{tr("panelTitle")}</Txt>
                {items.length ? (
                  <Txt muted style={{ fontSize: 14 }}>{nItems(lang, items.length) + (pausedCount ? " \u00b7 " + nPaused(lang, pausedCount) : "")}</Txt>
                ) : null}
              </View>
              {items.length >= 2 ? (
                <Pill
                  small
                  icon="swap-vertical"
                  label={tr("sortedBy") + " " + tr("sort_" + sort)}
                  onPress={() => setSortOpen(true)}
                  style={{ alignSelf: d.selfStart, marginHorizontal: 16, marginBottom: 12 }}
                />
              ) : null}
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.hairline }} />

              {items.length ? (
                list.map((it, i) => (
                  <ExpenseRow
                    key={it.id}
                    it={it}
                    last={i === list.length - 1}
                    onPress={() => setEditing({ open: true, item: it })}
                    onToggle={() => toggle(it)}
                  />
                ))
              ) : (
                <View style={styles.empty}>
                  <Txt style={styles.emptyH}>{tr("emptyH")}</Txt>
                  <Txt muted style={styles.emptyP}>{tr("emptyP")}</Txt>
                  <Pill kind="solid" icon="add" label={tr("emptyBtn")} onPress={openAdd} style={{ alignSelf: "center", marginTop: 18 }} />
                  <Pill kind="plain" icon="download-outline" label={tr("importBtn")} onPress={doImport} small style={{ alignSelf: "center", marginTop: 8 }} />
                </View>
              )}
            </View>

            <View style={[styles.status, { flexDirection: d.row }]}>
              <View style={[styles.dot, { backgroundColor: c.muted }]} />
              <Txt muted style={{ fontSize: 13 }}>{tr(status)}</Txt>
            </View>
            <Txt muted style={styles.legal}>{tr("legalApp")}</Txt>
          </View>
        </ScrollView>

        {items.length ? (
          <View pointerEvents="box-none" style={[styles.fabWrap, { bottom: insets.bottom + 14 }]}>
            <Pill kind="solid" icon="add" label={tr("addBtn")} onPress={openAdd} style={styles.fab} />
          </View>
        ) : null}

        <Toast toast={toast} onUndo={undo} bottom={insets.bottom + (items.length ? 76 : 18)} />

        <ExpenseSheet
          visible={editing.open}
          item={editing.item}
          currency={currency}
          onClose={() => setEditing((e) => ({ ...e, open: false }))}
          onSave={saveExpense}
          onDelete={deleteExpense}
        />
        <SettingsSheet
          visible={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          theme={theme} setTheme={setTheme}
          lang={lang} setLang={setLang}
          currency={currency} setCurrency={setCurrency}
          reminders={reminders} setReminders={setReminders} remindDenied={remindDenied}
          hasItems={items.length > 0}
          onExport={doExport} onImport={doImport} onClear={doClear}
        />
        <OptionSheet
          visible={sortOpen}
          title={tr("sortTitle")}
          options={sortOptions}
          value={sort}
          onPick={(v) => { setSort(v); setSortOpen(false); }}
          onClose={() => setSortOpen(false)}
        />
      </View>
    </UI.Provider>
  );
}

const styles = StyleSheet.create({
  column: { width: "100%", maxWidth: 640, alignSelf: "center" },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  hero: { alignItems: "center", marginTop: 4, marginBottom: 24 },
  wordmark: { fontSize: 44, fontWeight: "600", letterSpacing: -0.8 },
  heroSub: { fontSize: 17, textAlign: "center", marginTop: 4, letterSpacing: -0.3, maxWidth: 300 },
  panel: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth * 2, marginTop: 14, overflow: "hidden" },
  panelHead: { justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 8 },
  panelTitle: { fontSize: 21, fontWeight: "600" },
  empty: { paddingVertical: 34, paddingHorizontal: 24 },
  emptyH: { fontSize: 19, fontWeight: "600", textAlign: "center" },
  emptyP: { fontSize: 15, textAlign: "center", marginTop: 6, lineHeight: 21 },
  status: { alignItems: "center", gap: 7, marginTop: 18, justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legal: { fontSize: 13, textAlign: "center", marginTop: 6 },
  fabWrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  fab: { height: 52, paddingHorizontal: 24, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
});
