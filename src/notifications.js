// Local reminders. Nothing leaves the phone: the app schedules its own
// notifications for the next payments that have a set date.
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { DAY, today, paymentDates, money, t } from "./logic";

const CHANNEL = "reminders";
const HOUR = 9; // 9:00 in the morning, local time
const HORIZON_DAYS = 70; // look this far ahead
const MAX = 60; // iOS keeps at most 64 pending notifications per app

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return !!asked.granted;
}

// Wipes and rebuilds the schedule. Called whenever expenses or settings change,
// and each time the app comes back to the foreground.
export async function syncReminders({ items, mode, lang, currency }) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (mode === "off") return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;

    const offset = mode === "before" ? 1 : 0;
    const now = Date.now();
    const a = today(), b = a + HORIZON_DAYS * DAY;
    const pending = [];
    for (const it of items) {
      // Every-day expenses have no single day to forget, so they never ring.
      if (it.paused || it.flex || !it.cost || (it.unit === "days" && it.n === 1)) continue;
      for (const ts of paymentDates(it, a, b)) {
        const d = new Date(ts); // UTC midnight of the payment's calendar day
        const fire = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - offset, HOUR, 0, 0);
        if (fire.getTime() <= now) continue;
        pending.push({ fire, it });
      }
    }
    pending.sort((x, y) => x.fire - y.fire);
    for (const { fire, it } of pending.slice(0, MAX)) {
      const name = it.name || t(lang, "thisExpense");
      await Notifications.scheduleNotificationAsync({
        content: {
          title: t(lang, offset ? "notifTomorrow" : "notifToday", { n: name }),
          body: money(it.cost) + " " + currency,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fire,
          channelId: CHANNEL,
        },
      });
    }
  } catch (e) {
    // Reminders are a nicety. A failure here must never break the app.
    console.warn("Could not schedule reminders", e);
  }
}
