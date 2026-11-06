// Routines — the phone app. The screen is the same Routines page as the website (bundled inside,
// works offline); the app adds what a web page can't do: real notifications, haptics, the app badge,
// safe saving, backups through the share sheet, and the Android back button.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, BackHandler, Linking, Platform, StyleSheet, View, useColorScheme } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaProvider, initialWindowMetrics, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as Localization from "expo-localization";
import { File, Paths } from "expo-file-system";

import HTML from "./src/web";
import { buildPage, jsArg } from "./src/shim";
import { applyChange, flushStore, getStore, loadStore, readMeta, setAway, writeMeta } from "./src/store";
import { applyBadge, applyPlan, askOrOpenSettings, askPermission, permState, setBadge, setupChannel } from "./src/notify";

SplashScreen.preventAutoHideAsync().catch(() => {});

const BASE = "https://app.routines.invalid/"; // ".invalid" never exists on the internet: nothing is ever loaded from it

function timeZone() {
  try {
    const c = Localization.getCalendars();
    if (c && c[0] && c[0].timeZone) return c[0].timeZone;
  } catch (e) {}
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch (e) {
    return "";
  }
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const system = useColorScheme();
  const insets = useSafeAreaInsets();
  const web = useRef(null);
  const ready = useRef(false);
  const outbox = useRef([]); // calls waiting for the page to be ready
  const meta = useRef({});
  const tz = useRef(timeZone());
  const asked = useRef(false);
  const lastPlan = useRef(null);

  const [loaded, setLoaded] = useState(false); // saved data read from disk
  const [page, setPage] = useState(0); // bump = rebuild + reload the page
  const [dark, setDark] = useState(system === "dark");
  const [modalOpen, setModalOpen] = useState(false);

  /* ---------- start: read saved data, then show the page ---------- */
  useEffect(() => {
    let done = false;
    const failSafe = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 6000);
    (async () => {
      await loadStore();
      meta.current = await readMeta();
      const th = getStore().data["r.theme"];
      if (th === "dark" || th === "light") setDark(th === "dark");
      await setupChannel();
      if (!done) setLoaded(true);
    })();
    return () => { done = true; clearTimeout(failSafe); };
  }, []);

  // Android draws under the status and navigation bars: tell the page how much room they take.
  const css = Platform.OS === "android"
    ? `:root{--st:${Math.round(insets.top)}px!important;--sb:${Math.round(insets.bottom)}px!important;--sl:${Math.round(insets.left)}px!important;--sr:${Math.round(insets.right)}px!important}`
    : `:root{--st:0px!important;--sb:${Math.round(insets.bottom)}px!important;--sl:0px!important;--sr:0px!important}`; // The WebView reaches the iOS home indicator; reserve that bottom inset in the page.
  const source = useMemo(
    () => (loaded ? { html: buildPage(HTML, getStore(), css), baseUrl: BASE } : null),
    // rebuilt only when the page is (re)loaded on purpose, never while you use it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loaded, page]
  );
  /* ---------- talking to the page ---------- */
  const call = useCallback((js) => {
    const code = `try{${js}}catch(e){}true;`;
    if (ready.current && web.current) web.current.injectJavaScript(code);
    else outbox.current.push(code);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android" || !ready.current) return;
    call(`(function(s){var r=document.documentElement.style;r.setProperty("--st",s.t+"px");r.setProperty("--sb",s.b+"px");r.setProperty("--sl",s.l+"px");r.setProperty("--sr",s.r+"px");})(${jsArg({ t: Math.round(insets.top), b: Math.round(insets.bottom), l: Math.round(insets.left), r: Math.round(insets.right) })})`);
  }, [insets.top, insets.bottom, insets.left, insets.right]);

  // Native rotation can change the home-indicator inset without reloading the
  // WebView. Update the CSS token in place; task data and scroll state remain.
  useEffect(() => {
    if (Platform.OS === "ios" && ready.current) call(`document.documentElement.style.setProperty("--sb",${jsArg(Math.round(insets.bottom) + "px")},"important")`);
  }, [insets.bottom, call]);

  const sendPerm = useCallback(async () => {
    const p = await permState();
    if (p.granted) applyBadge(); // allowed (maybe just now, maybe in Settings): the badge can finally be right
    call(`window.__nat&&__nat.perm(${jsArg(p)})`);
    return p;
  }, [call]);

  const reload = useCallback(() => {
    ready.current = false;
    outbox.current = [];
    flushStore();
    setPage((n) => n + 1);
  }, []);

  /* ---------- notification taps ---------- */
  const handleResponse = useCallback((r) => {
    if (!r || !r.notification) return;
    const req = r.notification.request || {};
    const key = (req.identifier || "") + "|" + (r.actionIdentifier || "") + "|" + (r.notification.date || "");
    if (meta.current.lastResp === key) return; // already handled (e.g. the same tap seen again at next launch)
    meta.current = { ...meta.current, lastResp: key };
    writeMeta(meta.current);
    const data = (req.content && req.content.data) || {};
    const action = r.actionIdentifier === "done" ? "done" : "open";
    call(`window.__nat&&__nat.opened(${jsArg({ ...data, action })})`);
    try { Notifications.clearLastNotificationResponseAsync && Notifications.clearLastNotificationResponseAsync(); } catch (e) {}
  }, [call]);

  useEffect(() => {
    if (!loaded) return; // wait for the saved "already handled" mark
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    Notifications.getLastNotificationResponseAsync().then(handleResponse).catch(() => {});
    return () => sub.remove();
  }, [handleResponse, loaded]);

  /* ---------- the app goes to the background / comes back ---------- */
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        setAway(false);
        const now = timeZone();
        if (now && tz.current && now !== tz.current) { // new time zone: start the page fresh so every clock reads right
          tz.current = now;
          reload();
          return;
        }
        call("window.__nat&&__nat.resume()");
        sendPerm();
      } else if (s === "background" || s === "inactive") {
        setAway(true); // saves now, and saves at once whatever the page still sends
        // the newest reminders + every unsaved change, right now (the phone may suspend the app any moment)
        if (web.current) web.current.injectJavaScript("try{window.__nat&&__nat.away&&__nat.away()}catch(e){}try{window.__flushStore&&__flushStore()}catch(e){}true;");
      }
    });
    return () => sub.remove();
  }, [call, reload, sendPerm]);

  /* ---------- Android back button: close the open sheet first ---------- */
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!ready.current || !web.current) return false;
      web.current.injectJavaScript(
        `try{var h=window.__nat&&__nat.back();window.ReactNativeWebView.postMessage(JSON.stringify({type:"back",handled:!!h}))}catch(e){}true;`
      );
      return true;
    });
    return () => sub.remove();
  }, []);

  /* ---------- backups ---------- */
  const doExport = async (m) => {
    try {
      const name = /^[\w.-]+\.json$/.test(m.name || "") ? m.name : "routines.json";
      const f = new File(Paths.cache, name);
      if (f.exists) f.delete();
      f.create();
      f.write(String(m.text || ""));
      await Sharing.shareAsync(f.uri, { mimeType: "application/json", UTI: "public.json", dialogTitle: name });
    } catch (e) {
      console.warn("Export failed", e);
    }
  };
  const doImport = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ["application/json", "text/plain", "*/*"], copyToCacheDirectory: true });
      if (res.canceled || !res.assets || !res.assets[0]) return;
      const txt = await new File(res.assets[0].uri).text();
      call(`window.__nat&&__nat.importText(${jsArg(txt)})`);
    } catch (e) {
      call(`window.__nat&&__nat.importText("")`);
    }
  };

  const haptic = (k) => {
    try {
      if (k === "success") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      else if (k === "warning") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      else if (k === "error") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      else if (k === "select") Haptics.selectionAsync().catch(() => {});
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (e) {}
  };

  /* ---------- messages from the page ---------- */
  // Protocol boundary: page messages call native persistence, notifications and device features.
  // Keep types and payloads in sync with web/index.html and src/shim.js.
  const onMessage = async (e) => {
    let m;
    try { m = JSON.parse(e.nativeEvent.data); } catch (err) { return; }
    if (!m || typeof m.type !== "string") return;
    switch (m.type) {
      case "store":
        applyChange(m);
        break;
      case "ready": {
        ready.current = true;
        SplashScreen.hideAsync().catch(() => {});
        const q = outbox.current;
        outbox.current = [];
        q.forEach((code) => web.current && web.current.injectJavaScript(code));
        // Insets may have changed during startup before the page reported ready.
        if (Platform.OS === "ios") call(`document.documentElement.style.setProperty("--sb",${jsArg(Math.round(insets.bottom) + "px")},"important")`);
        sendPerm();
        break;
      }
      case "theme":
        setDark(!!m.dark);
        break;
      case "modalState":
        // The web scrim cannot cover the native status-bar safe area.
        setModalOpen(!!m.open);
        break;
      case "haptic":
        haptic(m.k);
        break;
      case "badge": {
        const ok = await setBadge(m.n);
        // iPhone refused: notifications were never allowed on this install (e.g. right after a reinstall,
        // when the icon still shows the old number). Ask once, then the right number goes on.
        if (!ok && !asked.current) {
          const p = await permState();
          if (!p.granted && p.undetermined) {
            asked.current = true;
            await askPermission();
            const p2 = await sendPerm();
            if (p2.granted && lastPlan.current) applyPlan(lastPlan.current);
          }
        }
        break;
      }
      case "plan": {
        lastPlan.current = m;
        applyPlan(m);
        // first time there is something to remind you of: ask once (iPhone shows its own prompt)
        if (!asked.current && m.n > 0) {
          asked.current = true;
          const p = await permState();
          if (!p.granted && p.undetermined) {
            await askPermission();
            const p2 = await sendPerm();
            if (p2.granted) applyPlan(m);
          }
        }
        break;
      }
      case "permCheck":
        sendPerm();
        break;
      case "notifAsk": {
        const r = await askOrOpenSettings(() => Linking.openSettings());
        const p = await sendPerm();
        if (p.granted) applyPlan(m.plan || lastPlan.current || { list: [] });
        call(`window.__nat&&__nat.askDone&&__nat.askDone(${jsArg(Object.assign({}, r, { granted: p.granted }))})`);
        break;
      }
      case "export":
        doExport(m);
        break;
      case "import":
        doImport();
        break;
      case "back":
        if (!m.handled) BackHandler.exitApp();
        break;
      default:
        break;
    }
  };

  // Match the Bills canvas at native safe-area and loading edges.
  const bg = dark ? "#000000" : "#FFFFFF";
  // Reserve iOS safe areas and use the same canvas as the web view.
  return (
    <View style={[styles.root, { backgroundColor: modalOpen && Platform.OS === "ios" ? (dark ? "#000000" : "#adadae") : bg, paddingTop: Platform.OS === "ios" ? insets.top : 0, paddingLeft: Platform.OS === "ios" ? insets.left : 0, paddingRight: Platform.OS === "ios" ? insets.right : 0 }]}>
      <StatusBar style={dark ? "light" : "dark"} />
      {source && (
        <WebView
          key={page}
          ref={web}
          source={source}
          originWhitelist={["*"]}
          onMessage={onMessage}
          onLoadStart={() => { ready.current = false; }}
          onShouldStartLoadWithRequest={(req) => {
            const u = req.url || "";
            if (u.startsWith(BASE) || u.startsWith("about:") || u.startsWith("data:") || u.startsWith("blob:")) return true;
            Linking.openURL(u).catch(() => {});
            return false;
          }}
          onContentProcessDidTerminate={reload}
          onRenderProcessGone={() => { reload(); return true; }}
          javaScriptEnabled
          domStorageEnabled
          style={{ flex: 1, backgroundColor: bg }}
          containerStyle={{ backgroundColor: bg }}
          bounces={false} // Prevent native rubber-banding from exposing mismatched edges.
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          keyboardDisplayRequiresUserAction={false}
          hideKeyboardAccessoryView={false}
          allowsBackForwardNavigationGestures={false}
          allowsLinkPreview={false}
          dataDetectorTypes="none"
          pullToRefreshEnabled={false}
          setSupportMultipleWindows={false}
          setBuiltInZoomControls={false}
          setDisplayZoomControls={false}
          overScrollMode="never"
          textZoom={100}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          allowFileAccess={false}
          cacheEnabled={false}
          webviewDebuggingEnabled={__DEV__}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
