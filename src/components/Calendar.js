// Month grid for picking the first payment, Sunday first like the website.
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUI } from "../theme";
import { DAY, names, parseISO, toISO, today } from "../logic";

export default function Calendar({ value, onPick }) {
  const { c, d, lang, rtl, tr } = useUI();
  const selected = parseISO(value);
  const td = today();
  const cursor = new Date(selected !== null ? selected : td);
  const [view, setView] = useState({ y: cursor.getUTCFullYear(), m: cursor.getUTCMonth() });
  const N = names(lang);

  const step = (delta) => setView((v) => {
    let m = v.m + delta, y = v.y;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    return { y, m };
  });

  const first = Date.UTC(view.y, view.m, 1);
  const start = first - new Date(first).getUTCDay() * DAY;
  const weeks = [];
  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let i = 0; i < 7; i++) days.push(start + (w * 7 + i) * DAY);
    weeks.push(days);
  }

  return (
    <View style={[styles.cal, { backgroundColor: c.surface }]}>
      <View style={[styles.head, { flexDirection: d.row }]}>
        <Pressable onPress={() => step(-1)} hitSlop={10} style={styles.nav} accessibilityLabel={tr("prevMonth")}>
          <Ionicons name={rtl ? "chevron-forward" : "chevron-back"} size={20} color={c.text} />
        </Pressable>
        <Text style={[styles.title, { color: c.text }]}>{N.MON[view.m] + " " + view.y}</Text>
        <Pressable onPress={() => step(1)} hitSlop={10} style={styles.nav} accessibilityLabel={tr("nextMonth")}>
          <Ionicons name={rtl ? "chevron-back" : "chevron-forward"} size={20} color={c.text} />
        </Pressable>
      </View>
      <View style={{ flexDirection: d.row }}>
        {N.DOW.map((w, i) => (
          <Text key={i} style={[styles.dow, { color: c.muted }]}>{w}</Text>
        ))}
      </View>
      {weeks.map((days, wi) => (
        <View key={wi} style={{ flexDirection: d.row }}>
          {days.map((ts) => {
            const dt = new Date(ts);
            const out = dt.getUTCMonth() !== view.m;
            const sel = selected !== null && ts === selected;
            const isToday = ts === td;
            return (
              <Pressable key={ts} onPress={() => onPick(toISO(ts))} style={styles.cell} accessibilityRole="button">
                <View style={[styles.day, sel && { backgroundColor: c.accent }, !sel && isToday && { borderWidth: 1.5, borderColor: c.text }]}>
                  <Text style={{ fontSize: 16, color: sel ? c.onAccent : out ? c.muted : c.text, opacity: out && !sel ? 0.5 : 1, fontWeight: isToday || sel ? "600" : "400" }}>
                    {dt.getUTCDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      <Pressable onPress={() => onPick(toISO(td))} hitSlop={8} style={{ alignSelf: "center", marginTop: 6, padding: 6 }}>
        <Text style={{ color: c.text, fontSize: 15, fontWeight: "600" }}>{tr("todayWord")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cal: { borderRadius: 18, padding: 10, marginTop: 10 },
  head: { alignItems: "center", justifyContent: "space-between", marginBottom: 6, paddingHorizontal: 4 },
  nav: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "600" },
  dow: { flex: 1, textAlign: "center", fontSize: 12, fontWeight: "500", paddingVertical: 4 },
  cell: { flex: 1, alignItems: "center", paddingVertical: 2 },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
});
