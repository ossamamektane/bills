// Appearance, language, currency, reminders and backups — the website's footer
// controls, gathered into one sheet.
import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUI } from "../theme";
import { Group, Label, ListRow, Pill, Segmented, Sheet, SheetTitle, Txt } from "./ui";
import { CURRENCIES, LANGS, curName } from "../logic";

export default function SettingsSheet({
  visible, onClose, theme, setTheme, lang, setLang, currency, setCurrency,
  reminders, setReminders, remindDenied, hasItems, onExport, onImport, onClear,
}) {
  const { c, d, rtl, tr } = useUI();
  const [page, setPage] = useState("main");
  const [armed, setArmed] = useState(false);
  const armT = useRef(null);

  useEffect(() => { if (visible) { setPage("main"); setArmed(false); } }, [visible]);
  useEffect(() => () => clearTimeout(armT.current), []);

  const clear = () => {
    if (!armed) {
      setArmed(true);
      clearTimeout(armT.current);
      armT.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    setArmed(false);
    onClear();
  };

  if (page === "currency") {
    const list = CURRENCIES.includes(currency) ? CURRENCIES : [currency, ...CURRENCIES];
    return (
      <Sheet visible={visible} onClose={onClose}>
        <Pressable onPress={() => setPage("main")} hitSlop={10} style={[styles.back, { flexDirection: d.row }]} accessibilityRole="button">
          <Ionicons name={rtl ? "chevron-forward" : "chevron-back"} size={20} color={c.text} />
          <Txt style={{ fontWeight: "500" }}>{tr("settingsTitle")}</Txt>
        </Pressable>
        <SheetTitle>{tr("currencyLabel")}</SheetTitle>
        <Group>
          {list.map((code, i) => (
            <ListRow
              key={code}
              label={code}
              sub={curName(lang, code)}
              checked={code === currency}
              last={i === list.length - 1}
              onPress={() => { setCurrency(code); setPage("main"); }}
            />
          ))}
        </Group>
      </Sheet>
    );
  }

  return (
    <Sheet visible={visible} onClose={onClose}>
      <SheetTitle>{tr("settingsTitle")}</SheetTitle>

      <Label>{tr("themeLabel")}</Label>
      <Segmented
        value={theme}
        onChange={setTheme}
        options={[
          { value: "auto", label: tr("theme_auto") },
          { value: "light", label: tr("theme_light") },
          { value: "dark", label: tr("theme_dark") },
        ]}
      />

      <Label style={styles.gap}>{tr("langLabel")}</Label>
      <Segmented value={lang} onChange={setLang} options={LANGS} />

      <Label style={styles.gap}>{tr("currencyLabel")}</Label>
      <Group>
        <ListRow label={currency} sub={curName(lang, currency)} onPress={() => setPage("currency")} last />
      </Group>

      <Label style={styles.gap}>{tr("remindersTitle")}</Label>
      <Segmented
        value={reminders}
        onChange={setReminders}
        options={[
          { value: "off", label: tr("remind_off") },
          { value: "same", label: tr("remind_same") },
          { value: "before", label: tr("remind_before") },
        ]}
      />
      <Txt muted style={styles.hint}>{remindDenied ? tr("remindDenied") : tr("remindHint")}</Txt>
      {remindDenied ? (
        <Pill small label={tr("openSettings")} onPress={() => Linking.openSettings()} style={{ alignSelf: "center", marginTop: 8 }} />
      ) : null}

      <Label style={styles.gap}>{tr("dataTitle")}</Label>
      <Group>
        {hasItems ? <ListRow label={tr("exportBtn")} onPress={onExport} /> : null}
        <ListRow label={tr("importBtn")} onPress={onImport} last={!hasItems} />
        {hasItems ? (
          <Pressable
            onPress={clear}
            accessibilityRole="button"
            style={({ pressed }) => [styles.clear, { flexDirection: d.row }, pressed && { backgroundColor: c.press }, armed && { backgroundColor: c.accent }]}
          >
            <Ionicons name="trash-outline" size={17} color={armed ? c.onAccent : c.text} />
            <Txt style={{ flex: 1, color: armed ? c.onAccent : c.text }}>{armed ? tr("tapAgainClear") : tr("clearBtn")}</Txt>
          </Pressable>
        ) : null}
      </Group>
      <Txt muted style={styles.hint}>{tr("exportHint")}</Txt>

      <Pill label={tr("doneWord")} kind="solid" onPress={onClose} style={{ marginTop: 22 }} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: 20 },
  hint: { fontSize: 13, marginTop: 8, lineHeight: 18, textAlign: "center" },
  back: { alignItems: "center", gap: 4, marginBottom: 4 },
  clear: { alignItems: "center", gap: 10, paddingHorizontal: 16, minHeight: 52, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(127,127,127,0.35)" },
});
