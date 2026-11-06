// Local notifications only — nothing leaves the phone. The page works out what should ring
// (it knows every task's rules); this file keeps the phone's schedule in sync with that list.
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const CHANNEL = "reminders";
const MAX = 60; // iOS keeps at most 64 waiting notifications per app

// While the app is open it keeps the badge itself, so a reminder never changes it then.
// A badge-only update (kind "badge") shows nothing at all.
Notifications.setNotificationHandler({
  handleNotification: async (n) => {
    const data = (n && n.request && n.request.content && n.request.content.data) || {};
    const show = data.kind !== "badge";
    return { shouldShowBanner: show, shouldShowList: show, shouldPlaySound: show, shouldSetBadge: false };
  },
});

export async function setupChannel() {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 200, 120, 200],
    });
  } catch (e) {}
}

function granted(p) {
  if (!p) return false;
  if (p.granted === true || p.status === "granted") return true;
  const s = p.ios && p.ios.status, E = Notifications.IosAuthorizationStatus || {};
  if (s == null) return false;
  // 2 = allowed, 3 = quiet (provisional), 4 = app clip
  return s === E.AUTHORIZED || s === E.PROVISIONAL || s === E.EPHEMERAL || s === 2 || s === 3 || s === 4;
}

function describe(p) {
  return { granted: granted(p), canAsk: p.canAskAgain !== false && !granted(p), undetermined: p.status === "undetermined" || (p.ios && p.ios.status === 0) };
}

export async function permState() {
  try {
    return describe(await Notifications.getPermissionsAsync());
  } catch (e) {
    return { granted: false, canAsk: false, undetermined: false, err: String((e && e.message) || e) };
  }
}

// You tapped "Turn on notifications": always do something you can see.
// Ask with the iPhone prompt; if iPhone won't ask any more, open Settings for Routines.
export async function askOrOpenSettings(openSettings) {
  const r = {};
  try {
    const before = await Notifications.getPermissionsAsync();
    r.before = String(before.status);
    if (granted(before)) { r.granted = true; return r; }
    await setupChannel();
    const after = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    r.after = String(after.status);
    if (granted(after)) { r.granted = true; return r; }
  } catch (e) {
    r.err = String((e && e.message) || e).slice(0, 160);
  }
  try { await openSettings(); r.settings = true; } catch (e) { r.err = r.err || "settings"; }
  return r;
}

export async function askPermission() {
  try {
    await setupChannel();
    const p = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return granted(p);
  } catch (e) {
    return false;
  }
}

// The app badge. iPhone only lets an app change it once notifications are allowed — and it keeps the
// old number from before a delete/reinstall. So the newest number is remembered and put on again
// whenever it can be: when the page sends it, when you come back to the app, and right after you allow notifications.
let wantBadge = null;
export async function setBadge(n) {
  wantBadge = Math.max(0, n | 0);
  return applyBadge();
}
export async function applyBadge() {
  if (wantBadge === null) return true;
  try {
    const ok = await Notifications.setBadgeCountAsync(wantBadge);
    return ok !== false;
  } catch (e) {
    return false;
  }
}

let catLabel = null;
async function ensureCategory(label) {
  if (!label || label === catLabel) return;
  try {
    await Notifications.setNotificationCategoryAsync("task", [
      { identifier: "done", buttonTitle: label, options: { opensAppToForeground: true } },
    ]);
    catLabel = label;
  } catch (e) {}
}

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// The id says when it rings ("r<seconds>-<hash of what it says>"). The badge number is not part of it:
// when only the number changes, the reminder is replaced in place under the same id — never missing, never twice.
function idOf(n) {
  return "r" + Math.round(n.at / 1000).toString(36) + "-" + hash([n.kind, n.title, n.body, JSON.stringify(n.data || {})].join("|"));
}
function atOf(id) {
  const m = /^r([0-9a-z]+)-/.exec(id || "");
  return m ? parseInt(m[1], 36) * 1000 : null;
}

// Plans arrive often (every change in the list). Only the newest one is applied, one at a time,
// and only the differences are touched.
let latest = null;
let running = false;
const given = new Map(); // id → badge number it was scheduled with

export function applyPlan(msg) {
  latest = msg;
  if (!running) run();
}

async function run() {
  running = true;
  try {
    while (latest) {
      const msg = latest;
      latest = null;
      await sync(msg);
    }
  } finally {
    running = false;
  }
}

function schedule(id, n, badge) {
  const task = n.kind === "slot" || n.kind === "late";
  const b = badge === null ? {} : { badge };
  return Notifications.scheduleNotificationAsync({
    identifier: id,
    content: n.kind === "badge"
      ? { ...b, data: { kind: "badge" }, interruptionLevel: "passive" } // no title, no sound: only the app badge changes
      : {
          title: String(n.title).slice(0, 120),
          body: String(n.body || "").slice(0, 240),
          sound: "default",
          data: Object.assign({}, n.data || {}, { kind: n.kind }),
          ...b,
          ...(task ? { categoryIdentifier: "task" } : {}),
        },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(n.at),
      channelId: CHANNEL,
    },
  });
}

// Reconcile the desired plan with pending OS requests. Near-due requests are protected.
// Changing the capacity or replacement order can silently lose reminders on iOS.
async function sync(msg) {
  try {
    const p = await Notifications.getPermissionsAsync();
    if (!granted(p)) return;
    await setupChannel();
    await ensureCategory(msg.action);
    const ios = Platform.OS === "ios";
    const now = Date.now(), soon = now + 5000;
    const want = new Map();
    for (const n of Array.isArray(msg.list) ? msg.list : []) {
      if (!n || typeof n.at !== "number" || n.at < soon) continue;
      // a badge-only update is for iPhone (on Android it would be an empty notification)
      if (n.kind === "badge" ? !ios || typeof n.badge !== "number" : !n.title) continue;
      const id = idOf(n);
      if (!want.has(id)) want.set(id, n);
      if (want.size >= MAX) break;
    }
    const have = await Notifications.getAllScheduledNotificationsAsync();
    const byId = new Map(have.map((h) => [h.identifier, h]));
    const removed = new Set();
    // iOS has room for only 64 pending notifications. Make just enough room
    // before adding a replacement plan; otherwise a full old plan can cause
    // new reminders to be rejected and then be removed itself.
    if (ios) {
      const incoming = [...want.keys()].filter((id) => !byId.has(id)).length;
      let need = Math.max(0, have.length + incoming - 64);
      for (const h of have) {
        if (!need) break;
        if (want.has(h.identifier)) continue;
        const at = atOf(h.identifier);
        if (at !== null && at < soon) continue; // leave an imminent reminder alone
        try { await Notifications.cancelScheduledNotificationAsync(h.identifier); removed.add(h.identifier); need--; } catch (e) {}
      }
    }
    // Add what's new and fix badge numbers (soonest first). When capacity
    // permits, old reminders are kept until the new plan is in place.
    for (const [id, n] of want) {
      const badge = ios && typeof n.badge === "number" ? Math.max(0, n.badge | 0) : null;
      const h = byId.get(id);
      if (h) {
        const c = h.content && typeof h.content.badge === "number" ? h.content.badge : null;
        const cur = given.has(id) ? given.get(id) : c;
        if (badge === null || cur === badge) continue;
      }
      try { await schedule(id, n, badge); given.set(id, badge); } catch (e) { console.warn("Could not schedule", e); }
    }
    // 2 · remove what's no longer wanted — except one that is about to ring: it rings as planned
    for (const h of have) {
      if (want.has(h.identifier) || removed.has(h.identifier)) continue;
      const at = atOf(h.identifier);
      if (at !== null && at < soon) continue;
      try { await Notifications.cancelScheduledNotificationAsync(h.identifier); } catch (e) {}
    }
    for (const id of [...given.keys()]) if (!want.has(id)) given.delete(id);
  } catch (e) {
    // Reminders are a help, never a reason to crash.
    console.warn("Reminder sync failed", e);
  }
}

export async function clearAll() {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch (e) {}
}
