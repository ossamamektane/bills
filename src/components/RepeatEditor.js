// "How often?" — the website's schedule sheet, step for step: days / weeks /
// months, every N, then whether it lands on a set date and which one.
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUI } from "../theme";
import { Label, Pill, Segmented, SheetTitle, Txt } from "./ui";
import Calendar from "./Calendar";
import { everyWord, fmtLong, nextDate, parseISO, repeatMain, today, unitPlural } from "../logic";

// The same corrections the website makes on every redraw, applied once per change.
function settle(s) {
  const d = { ...s.draft };
  let { modeBlank } = s;
  const daily = d.unit === "days" && d.n === 1;
  if (!daily) {
    const flexOK = d.n === 1;
    if (!flexOK && d.flex) d.flex = false;
    if (!flexOK) modeBlank = false;
    if (!s.modeTouched && !modeBlank && flexOK && !d.flex && parseISO(d.start) === null) d.flex = true;
  }
  return { ...s, draft: d, modeBlank };
}

export default function RepeatEditor({ initial, onCancel, onDone }) {
  const { c, d, lang, tr } = useUI();
  const [s, setS] = useState(() => {
    const draft = { unit: initial.unit, n: initial.n, start: initial.start, flex: !!initial.flex };
    if (!draft.unit) { draft.unit = "days"; draft.n = 1; draft.start = ""; }
    const memo = { [draft.unit]: { n: draft.n, flex: draft.flex, start: draft.start } };
    return settle({ draft, memo, modeBlank: false, modeTouched: false, calOpen: false });
  });
  const [numText, setNumText] = useState(String(s.draft.n));
  const { draft } = s;
  const update = (fn) => setS((prev) => settle(fn(prev)));

  const pickUnit = (unit) => {
    if (unit === draft.unit) return;
    update((p) => {
      const memo = { ...p.memo, [p.draft.unit]: { n: p.draft.n, flex: p.modeBlank ? false : p.draft.flex, start: p.modeBlank ? "" : p.draft.start } };
      const prior = memo[unit];
      const next = { ...p.draft, unit, n: prior && prior.n ? prior.n : 1 };
      let modeBlank;
      if (prior && (prior.flex || parseISO(prior.start) !== null)) {
        next.flex = prior.flex; next.start = prior.start; modeBlank = false;
      } else {
        next.flex = false; next.start = ""; modeBlank = true;
      }
      setNumText(String(next.n));
      return { ...p, memo, draft: next, modeBlank, modeTouched: true, calOpen: false };
    });
  };

  const setN = (n) => {
    const v = Math.max(1, Math.min(999, Math.round(n) || 1));
    setNumText(String(v));
    if (v === draft.n) return;
    update((p) => ({ ...p, draft: { ...p.draft, n: v, start: "" }, calOpen: false }));
  };

  const pickMode = (key) => {
    if (key === "flex" && draft.n !== 1) return;
    update((p) => {
      const flex = key === "flex";
      const next = { ...p.draft, flex, start: flex ? "" : p.draft.start };
      const memo = flex ? { ...p.memo, [next.unit]: { n: next.n, flex: true, start: "" } } : p.memo;
      return { ...p, draft: next, memo, modeTouched: true, modeBlank: false, calOpen: false };
    });
  };

  const pickDate = (iso) => update((p) => ({
    ...p, draft: { ...p.draft, start: iso }, calOpen: false,
    memo: { ...p.memo, [p.draft.unit]: { n: p.draft.n, flex: false, start: iso } },
  }));

  const daily = draft.unit === "days" && draft.n === 1;
  const flexOK = draft.n === 1;
  const showModes = draft.unit !== "days";
  const hasDate = parseISO(draft.start) !== null;
  const showDate = !daily && !draft.flex && !(s.modeBlank && showModes);
  const startTs = parseISO(draft.start);
  const past = startTs !== null && startTs < today();
  const nd = past ? nextDate(draft) : null;
  const note = daily
    ? tr("dailyNote")
    : draft.flex
      ? tr("noteFlex")
      : hasDate
        ? past ? tr("notePast", { d: nd !== null ? fmtLong(lang, nd) : tr("soonWord") }) : tr("noteFuture")
        : flexOK ? tr("noteNeedDate") : tr("noteNeedStart", { r: repeatMain(lang, draft.n, draft.unit) });
  const ok = !!draft.unit && (draft.flex || daily || hasDate);
  const modeValue = s.modeBlank ? null : draft.flex ? "flex" : "date";

  return (
    <View>
      <SheetTitle>{tr("repeatChoose")}</SheetTitle>
      <Segmented
        value={draft.unit}
        onChange={pickUnit}
        options={[
          { value: "days", label: tr("unitDays") },
          { value: "weeks", label: tr("unitWeeks") },
          { value: "months", label: tr("unitMonths") },
        ]}
      />

      <View style={[styles.every, { flexDirection: d.row }]}>
        <Txt style={styles.everyWord}>{everyWord(lang, draft.unit)}</Txt>
        <View style={[styles.stepper, { backgroundColor: c.surface, flexDirection: d.row }]}>
          <Pressable onPress={() => setN(draft.n - 1)} hitSlop={6} style={styles.stepBtn} accessibilityLabel="−" disabled={draft.n <= 1}>
            <Ionicons name="remove" size={20} color={draft.n <= 1 ? c.muted : c.text} />
          </Pressable>
          <TextInput
            value={numText}
            onChangeText={(v) => {
              const clean = v.replace(/[^0-9]/g, "");
              setNumText(clean);
              const num = parseInt(clean, 10);
              if (num > 0) setN(num);
            }}
            onBlur={() => setNumText(String(draft.n))}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={3}
            selectTextOnFocus
            accessibilityLabel={tr("intervalAria")}
            style={[styles.num, { color: c.text }]}
          />
          <Pressable onPress={() => setN(draft.n + 1)} hitSlop={6} style={styles.stepBtn} accessibilityLabel="+">
            <Ionicons name="add" size={20} color={c.text} />
          </Pressable>
        </View>
        <Txt style={styles.everyWord}>{unitPlural(lang, draft.n, draft.unit)}</Txt>
      </View>

      {!daily ? (
        <View style={{ marginTop: 18 }}>
          <Label>{tr("firstPayment")}</Label>
          {showModes ? (
            <Segmented
              value={modeValue}
              onChange={pickMode}
              options={[
                { value: "flex", label: tr("noFixedDate"), disabled: !flexOK },
                { value: "date", label: tr("modeDate") },
              ]}
            />
          ) : null}
          {showDate ? (
            <>
              <Pressable
                onPress={() => update((p) => ({ ...p, calOpen: !p.calOpen }))}
                style={[styles.dateBtn, { backgroundColor: c.surface, flexDirection: d.row }, showModes && { marginTop: 10 }]}
                accessibilityRole="button"
              >
                <Txt style={{ flex: 1 }} muted={!hasDate}>{hasDate ? fmtLong(lang, startTs) : tr("chooseDate")}</Txt>
                <Ionicons name={s.calOpen ? "chevron-up" : "chevron-down"} size={16} color={c.muted} />
              </Pressable>
              {s.calOpen ? <Calendar value={draft.start} onPick={pickDate} /> : null}
            </>
          ) : null}
        </View>
      ) : null}

      <Txt muted style={styles.note}>{note}</Txt>

      <View style={[styles.actions, { flexDirection: d.row }]}>
        <Pill label={tr("cancelWord")} onPress={onCancel} style={{ flex: 1 }} />
        <Pill
          label={tr("doneWord")}
          kind="solid"
          disabled={!ok}
          style={{ flex: 1 }}
          onPress={() => onDone({ unit: draft.unit, n: Math.max(1, draft.n), flex: !!draft.flex, start: draft.flex ? "" : draft.start })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  every: { alignItems: "center", justifyContent: "center", gap: 12, marginTop: 18 },
  everyWord: { fontSize: 17 },
  stepper: { borderRadius: 14, alignItems: "center", height: 46 },
  stepBtn: { width: 44, height: 46, alignItems: "center", justifyContent: "center" },
  num: { width: 54, textAlign: "center", fontSize: 19, fontWeight: "600", paddingVertical: 0, fontVariant: ["tabular-nums"] },
  dateBtn: { height: 50, borderRadius: 14, alignItems: "center", paddingHorizontal: 16 },
  note: { fontSize: 14, marginTop: 14, lineHeight: 19, textAlign: "center" },
  actions: { gap: 10, marginTop: 20 },
});
