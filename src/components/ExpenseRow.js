// One expense in the list. Tap to edit; the switch pauses or resumes it.
import { Platform, Pressable, StyleSheet, Switch, View } from "react-native";
import { useUI } from "../theme";
import { Txt } from "./ui";
import { dueInfo, money, repeatLabel } from "../logic";

export default function ExpenseRow({ it, onPress, onToggle, last }) {
  const { c, d, lang, tr, dark } = useUI();
  const due = dueInfo(lang, it);
  const fade = it.paused ? { opacity: 0.42 } : null;
  const sub = repeatLabel(lang, it) + (due.when ? " \u00b7 " + due.when : "");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={tr("editTitle")}
      style={({ pressed }) => [
        styles.row,
        { flexDirection: d.row, borderBottomColor: c.hairline, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
        pressed && { backgroundColor: c.press },
      ]}
    >
      <View style={[{ flex: 1, minWidth: 0 }, fade]}>
        <Txt numberOfLines={2} style={styles.name}>{it.name || tr("thisExpense")}</Txt>
        <Txt muted numberOfLines={2} style={styles.sub}>{sub}</Txt>
      </View>
      <View style={[styles.right, { alignItems: d.selfEnd }, fade]}>
        <Txt style={[styles.amt, { textAlign: d.alignEnd }]} numberOfLines={1}>{money(it.cost)}</Txt>
        <Txt
          numberOfLines={1}
          muted={due.tone === "quiet"}
          style={[styles.due, { textAlign: d.alignEnd }, (due.tone === "today" || due.tone === "soon") && { fontWeight: "600" }]}
        >
          {due.due}
        </Txt>
      </View>
      <Switch
        value={!it.paused}
        onValueChange={onToggle}
        accessibilityLabel={it.paused ? tr("resumeAria") : tr("pauseAria")}
        trackColor={{ false: c.surfaceStrong, true: c.accent }}
        thumbColor={Platform.OS === "android" || dark ? (dark && !it.paused ? "#1D1D1F" : "#FFFFFF") : undefined}
        ios_backgroundColor={c.surfaceStrong}
        style={styles.switch}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  name: { fontSize: 17, fontWeight: "500" },
  sub: { fontSize: 13, marginTop: 2 },
  right: { maxWidth: "42%" },
  amt: { fontSize: 17, fontVariant: ["tabular-nums"] },
  due: { fontSize: 13, marginTop: 2 },
  switch: Platform.OS === "ios" ? { transform: [{ scale: 0.85 }] } : null,
});
