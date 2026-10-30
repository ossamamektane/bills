// The big number and the twelve months ahead. Tapping a month changes the number.
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useUI } from "../theme";
import { Txt } from "./ui";
import { money, monthsAhead, names, shortMoney } from "../logic";

export default function Summary({ items, currency, selMonth, onSelect }) {
  const { c, d, lang, tr } = useUI();
  const N = names(lang);

  if (!items.length) {
    return (
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        <Txt muted style={styles.label}>{tr("emptyTotalLabel")}</Txt>
        <Total value={money(0)} currency={currency} />
        <Txt muted style={styles.sub}>{tr("emptyTotalSub")}</Txt>
      </View>
    );
  }

  const vals = monthsAhead(items);
  const i = selMonth >= 0 && selMonth < 12 ? selMonth : 0;
  const sel = vals[i];
  const peak = Math.max(0, ...vals.map((v) => v.amt));
  const flat = vals.every((v) => Math.abs(v.amt - vals[0].amt) < 0.005);
  const live = items.filter((it) => !it.paused).length;
  const sub = sel.payments === 0
    ? live ? (i === 0 ? tr("nothingThis") : tr("nothingIn", { m: N.MON[sel.m] })) : tr("allPaused")
    : i === 0 ? tr("payThisMonth") : tr("payIn", { m: N.MON[sel.m] });
  const year = vals.reduce((s, v) => s + v.amt, 0);

  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      <Txt muted style={styles.label}>{N.MON[sel.m] + " " + sel.y}</Txt>
      <Total value={money(sel.amt)} currency={currency} />
      <Txt muted style={styles.sub}>{sub}</Txt>

      <View style={[styles.divider, { backgroundColor: c.hairline }]} />

      <View style={[styles.yearHead, { flexDirection: d.row }]}>
        <Txt style={{ fontSize: 15, fontWeight: "500" }}>{tr("yearHead")}</Txt>
        <Txt muted style={{ fontSize: 13, flexShrink: 1 }}>{flat ? tr("yearFlat") : tr("yearHint")}</Txt>
      </View>

      <View style={[styles.grid, { flexDirection: d.row }]}>
        {vals.map((v, k) => {
          const on = k === i;
          const h = peak > 0 ? Math.max(4, Math.round((v.amt / peak) * 100)) : 4;
          const fg = on ? c.onAccent : c.text;
          return (
            <Pressable
              key={k}
              onPress={() => onSelect(k)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={N.MON[v.m] + ", " + money(v.amt) + " " + currency}
              style={({ pressed }) => [
                styles.cell,
                { backgroundColor: on ? c.accent : c.canvas, borderColor: on ? c.accent : c.line },
                pressed && !on && { backgroundColor: c.press },
              ]}
            >
              <Text numberOfLines={1} style={[styles.mon, { color: on ? c.onAccent : c.muted, textAlign: d.align }]}>{N.MON_S[v.m]}</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.amt, { color: fg, opacity: v.amt === 0 && !on ? 0.45 : 1, textAlign: d.align }]}>
                {shortMoney(v.amt)}
              </Text>
              <View style={[styles.track, { backgroundColor: on ? "rgba(127,127,127,0.45)" : c.surfaceStrong, flexDirection: d.row }]}>
                <View style={{ width: h + "%", backgroundColor: on ? c.onAccent : c.muted, borderRadius: 2 }} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <Txt muted style={[styles.yearSum]}>{tr("yearAll") + " \u00b7 " + money(year) + " " + currency}</Txt>
    </View>
  );
}

function Total({ value, currency }) {
  const { c } = useUI();
  return (
    <View style={styles.totalRow}>
      <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.total, { color: c.text }]}>
        {value}
        <Text style={[styles.cur, { color: c.muted }]}>{"  " + currency}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, paddingTop: 22 },
  label: { fontSize: 14, textAlign: "center" },
  totalRow: { alignItems: "center", marginTop: 2 },
  total: { fontSize: 46, fontWeight: "500", letterSpacing: -1.2, fontVariant: ["tabular-nums"] },
  cur: { fontSize: 18, fontWeight: "400", letterSpacing: 0 },
  sub: { fontSize: 15, textAlign: "center", marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 18 },
  yearHead: { justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 12 },
  grid: { flexWrap: "wrap", justifyContent: "space-between", rowGap: 8 },
  cell: { width: "23.6%", borderRadius: 14, borderWidth: StyleSheet.hairlineWidth * 2, paddingHorizontal: 9, paddingTop: 8, paddingBottom: 9 },
  mon: { fontSize: 12, fontWeight: "500" },
  amt: { fontSize: 16, fontWeight: "600", marginTop: 4, marginBottom: 8, fontVariant: ["tabular-nums"] },
  track: { height: 3, borderRadius: 2, overflow: "hidden" },
  yearSum: { fontSize: 13, textAlign: "center", marginTop: 14 },
});
