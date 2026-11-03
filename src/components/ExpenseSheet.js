// Add or edit one expense. The "How often?" step opens inside the same sheet.
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUI } from "../theme";
import { Label, Pill, Sheet, SheetTitle, Txt } from "./ui";
import RepeatEditor from "./RepeatEditor";
import { cadenceReady, fmtLong, normalize, parseISO, repeatMain } from "../logic";

function costText(v) { return v ? String(v) : ""; }
function parseCost(s) {
  const n = Number(String(s).replace(/\s/g, "").replace(",", "."));
  return isFinite(n) && n > 0 ? n : 0;
}

export default function ExpenseSheet({ visible, item, currency, onClose, onSave, onDelete }) {
  const { c, d, lang, tr } = useUI();
  const editing = !!item;
  const [draft, setDraft] = useState(null);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [page, setPage] = useState("form");

  useEffect(() => {
    if (!visible) return;
    const base = item ? normalize(item) : normalize({ n: 1, unit: "", cost: 0, name: "", flex: true });
    setDraft(base);
    setName(base.name);
    setCost(costText(base.cost));
    setPage("form");
  }, [visible, item]);

  if (!draft) return <Sheet visible={false} onClose={onClose} />;

  const set = cadenceReady(draft);
  const okName = name.trim() !== "";
  const okCost = parseCost(cost) > 0;
  const ok = okName && okCost && set;
  const hint = ok ? "" : tr(!okName ? "addNeedName" : !okCost ? "addNeedAmount" : "addNeedRepeat");
  const startTs = parseISO(draft.start);
  const repeatText = set
    ? repeatMain(lang, draft.n, draft.unit) + (startTs !== null ? " \u00b7 " + fmtLong(lang, startTs) : "")
    : tr("setHowOften");

  const commit = () => {
    if (!ok) return;
    onSave(normalize({ ...draft, name: name.trim(), cost: parseCost(cost) }));
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      {page === "repeat" ? (
        <RepeatEditor
          initial={draft}
          onCancel={() => setPage("form")}
          onDone={(r) => { setDraft({ ...draft, ...r }); setPage("form"); }}
        />
      ) : (
        <View>
          <SheetTitle>{tr(editing ? "editTitle" : "addTitle")}</SheetTitle>

          <Label>{tr("addName")}</Label>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={tr("namePlaceholder")}
            placeholderTextColor={c.muted}
            autoFocus={!editing}
            returnKeyType="next"
            accessibilityLabel={tr("nameAria")}
            style={[styles.input, { backgroundColor: c.surface, color: c.text, textAlign: d.align }]}
          />

          <Label style={{ marginTop: 16 }}>{tr("addAmount")}</Label>
          <View style={[styles.input, styles.money, { backgroundColor: c.surface, flexDirection: d.row }]}>
            <TextInput
              value={cost}
              onChangeText={(v) => setCost(v.replace(/[^0-9.,]/g, ""))}
              placeholder="0"
              placeholderTextColor={c.muted}
              keyboardType="decimal-pad"
              accessibilityLabel={tr("costAria")}
              style={{ flex: 1, fontSize: 17, color: c.text, textAlign: d.align, paddingVertical: 0, fontVariant: ["tabular-nums"] }}
            />
            <Txt muted style={{ fontSize: 16 }}>{currency}</Txt>
          </View>

          <Label style={{ marginTop: 16 }}>{tr("addRepeat")}</Label>
          <Pressable
            onPress={() => setPage("repeat")}
            accessibilityRole="button"
            style={({ pressed }) => [styles.input, styles.money, { backgroundColor: c.surface, flexDirection: d.row }, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="repeat" size={18} color={c.muted} />
            <Txt style={{ flex: 1 }} muted={!set} numberOfLines={1}>{repeatText}</Txt>
            <Ionicons name="chevron-down" size={16} color={c.muted} />
          </Pressable>

          <Txt muted style={styles.hint}>{hint || " "}</Txt>

          <View style={[styles.actions, { flexDirection: d.row }]}>
            <Pill label={tr("cancelWord")} onPress={onClose} style={{ flex: 1 }} />
            <Pill label={tr(editing ? "saveWord" : "addConfirm")} kind="solid" disabled={!ok} onPress={commit} style={{ flex: 1 }} />
          </View>

          {editing ? (
            <Pressable onPress={() => onDelete(item)} hitSlop={8} style={styles.delete} accessibilityRole="button">
              <Ionicons name="trash-outline" size={16} color={c.muted} />
              <Txt muted style={{ fontSize: 15 }}>{tr("deleteExpense")}</Txt>
            </Pressable>
          ) : null}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  input: { height: 50, borderRadius: 14, paddingHorizontal: 16, fontSize: 17 },
  money: { alignItems: "center", gap: 10 },
  hint: { fontSize: 14, textAlign: "center", marginTop: 14, minHeight: 19 },
  actions: { gap: 10, marginTop: 14 },
  delete: { flexDirection: "row", alignSelf: "center", alignItems: "center", gap: 6, marginTop: 18, padding: 6 },
});
