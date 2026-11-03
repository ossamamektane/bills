// Small building blocks shared by every screen.
import { useEffect, useRef, useState } from "react";
import {
  Animated, Dimensions, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUI } from "../theme";

export function Txt({ style, muted, ...props }) {
  const { c, d } = useUI();
  return <Text {...props} style={[{ color: muted ? c.muted : c.text, textAlign: d.align, fontSize: 17, letterSpacing: -0.3 }, style]} />;
}

// Rounded pill button. kind: "solid" (black), "ghost" (outlined) or "plain".
export function Pill({ label, icon, onPress, kind = "ghost", disabled, style, small, accessibilityLabel }) {
  const { c, d } = useUI();
  const solid = kind === "solid";
  const fg = solid ? c.onAccent : c.text;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.pill,
        small && styles.pillSmall,
        { flexDirection: d.row },
        solid && { backgroundColor: c.accent },
        kind === "ghost" && { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: c.line, backgroundColor: c.canvas },
        pressed && !disabled && { opacity: 0.7 },
        disabled && { opacity: 0.35 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={small ? 15 : 17} color={fg} /> : null}
      {label ? <Text style={[styles.pillText, small && { fontSize: 15 }, { color: fg }]} numberOfLines={1}>{label}</Text> : null}
    </Pressable>
  );
}

// A row of equal buttons, one selected. The website's tab strip.
export function Segmented({ options, value, onChange }) {
  const { c, d } = useUI();
  return (
    <View style={[styles.seg, { backgroundColor: c.surface, flexDirection: d.row }]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={o.disabled ? undefined : () => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on, disabled: !!o.disabled }}
            style={[styles.segBtn, on && { backgroundColor: c.sheet, shadowOpacity: 0.12 }, o.disabled && { opacity: 0.35 }]}
          >
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.segText, { color: on ? c.text : c.muted, fontWeight: on ? "600" : "400" }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Bottom sheet: the scrim fades, the card slides up.
export function Sheet({ visible, onClose, children }) {
  const { c } = useUI();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220, mass: 0.9 }).start();
    } else if (mounted) {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;
  const h = Dimensions.get("window").height;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim, opacity: anim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetWrap} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: c.sheet, maxHeight: h - insets.top - 24, paddingBottom: Math.max(insets.bottom, 16) },
              { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [h * 0.6, 0] }) }] },
            ]}
          >
            <View style={[styles.grabber, { backgroundColor: c.hairline }]} />
            <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" bounces={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}>
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function SheetTitle({ children }) {
  return <Txt style={styles.sheetTitle}>{children}</Txt>;
}

export function Label({ children, style }) {
  return <Txt muted style={[styles.label, style]}>{children}</Txt>;
}

// A tappable line inside a sheet: label on one side, value and chevron on the other.
export function ListRow({ label, value, onPress, last, checked, sub }) {
  const { c, d, rtl } = useUI();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.listRow,
        { flexDirection: d.row, borderBottomColor: c.hairline, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
        pressed && { backgroundColor: c.press },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Txt>{label}</Txt>
        {sub ? <Txt muted style={{ fontSize: 13, marginTop: 1 }}>{sub}</Txt> : null}
      </View>
      {value ? <Txt muted style={{ fontSize: 16, marginHorizontal: 6 }}>{value}</Txt> : null}
      {checked !== undefined ? (
        checked ? <Ionicons name="checkmark" size={20} color={c.text} /> : <View style={{ width: 20 }} />
      ) : (
        <Ionicons name={rtl ? "chevron-back" : "chevron-forward"} size={17} color={c.muted} />
      )}
    </Pressable>
  );
}

export function Group({ children, style }) {
  const { c } = useUI();
  return <View style={[styles.group, { backgroundColor: c.surface }, style]}>{children}</View>;
}

// The little message at the bottom, with Undo when there is something to undo.
export function Toast({ toast, onUndo, bottom }) {
  const { c, d, tr } = useUI();
  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (toast) {
      setShown(toast);
      Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => setShown(null));
    }
  }, [toast]);
  if (!shown) return null;
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.toastWrap, { bottom, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}
    >
      <View style={[styles.toast, { backgroundColor: c.toast, flexDirection: d.row }]} accessibilityLiveRegion="polite">
        <Text style={{ color: c.onToast, fontSize: 15, flexShrink: 1 }} numberOfLines={2}>{shown.message}</Text>
        {shown.undo ? (
          <Pressable onPress={onUndo} hitSlop={10} accessibilityRole="button">
            <Text style={{ color: c.onToast, fontSize: 15, fontWeight: "600", marginHorizontal: 4 }}>{tr("undoWord")}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: { height: 44, paddingHorizontal: 18, borderRadius: 999, alignItems: "center", justifyContent: "center", gap: 7 },
  pillSmall: { height: 34, paddingHorizontal: 13, gap: 5 },
  pillText: { fontSize: 17, letterSpacing: -0.3, fontWeight: "500" },
  seg: { borderRadius: 12, padding: 3, gap: 3 },
  segBtn: { flex: 1, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, shadowOpacity: 0 },
  segText: { fontSize: 15, letterSpacing: -0.2 },
  sheetWrap: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 8 },
  grabber: { alignSelf: "center", width: 38, height: 5, borderRadius: 3, marginBottom: 10 },
  sheetTitle: { fontSize: 19, fontWeight: "600", textAlign: "center", marginTop: 4, marginBottom: 18 },
  label: { fontSize: 14, marginBottom: 7, marginTop: 2 },
  listRow: { alignItems: "center", paddingHorizontal: 16, minHeight: 52, paddingVertical: 10 },
  group: { borderRadius: 16, overflow: "hidden" },
  toastWrap: { position: "absolute", left: 16, right: 16, alignItems: "center" },
  toast: { borderRadius: 999, paddingVertical: 12, paddingHorizontal: 20, alignItems: "center", gap: 14, maxWidth: 520, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
});
