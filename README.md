> **Start with [START-HERE.md](START-HERE.md)** — the no-terminal way. The rest of this file is the manual/terminal way.

# Bills — iPhone & Android app

Your bills website as a native app (Expo + React Native). Same maths, same
three languages, same light/dark look, plus **real reminders** (local
notifications) and a backup format that works on both the app and the website.

```
bills-app/
├── App.js                  Main screen: total, month strip, list, sheets
├── index.js                Entry point
├── app.json                App name, bundle ID, icons, permissions
├── eas.json                Build + App Store submit settings
├── package.json
├── assets/                 Icon, Android icon, splash, notification icon
└── src/
    ├── logic.js            Totals, dates, wording — ported 1:1 from the site
    ├── strings.js          Every line of text in English, French, Arabic
    ├── storage.js          Saves on the phone (same format as the site)
    ├── notifications.js    Schedules the reminders
    ├── theme.js            Light/dark colours, right-to-left for Arabic
    └── components/         Summary, rows, add/edit sheet, "How often?",
                            calendar, settings
```

---

## 1. Run it on your phone (about 10 minutes)

1. Install **Node.js LTS** from nodejs.org.
2. In a terminal, open this folder and run:
   ```
   npm install
   npm run setup
   ```
   `setup` installs the exact versions that match the Expo SDK.
3. Install the **Expo Go** app on your iPhone (App Store) or Android phone.
4. Start the app:
   ```
   npx expo start
   ```
   Scan the QR code with your iPhone camera (Android: scan from Expo Go).
   Changes you make to the code show up on your phone right away.

**If Expo Go says the project's SDK version isn't supported:** Expo Go only
runs one SDK version at a time. Upgrade the project to match it:
```
npx expo install expo@^58.0.0
npx expo install --fix
```

### Bring your website data over
On the website press **Export**, put `bills.json` in Files / iCloud Drive or
AirDrop it to your phone, then in the app go to **Settings → Import**.
It also works the other way round.

---

## 2. Put it on the App Store

You already have the Apple Developer Program, so:

1. **Check the bundle ID** in `app.json`: `com.ossamamektane.bills`.
   You can't change it after your first upload, so change it now if you
   want a different one.
2. Install the build tool and log in (create a free account at expo.dev):
   ```
   npm install -g eas-cli
   eas login
   eas init
   ```
3. **Build for iPhone** in Expo's cloud — no Mac needed:
   ```
   eas build --platform ios --profile production
   ```
   When asked, log in with your Apple Developer account and let EAS create
   the certificates.
4. **Upload to App Store Connect:**
   ```
   eas submit --platform ios --latest
   ```
   If the app doesn't exist in App Store Connect yet, EAS can create it.
5. **Test with TestFlight** (App Store Connect → TestFlight). Install it on
   your iPhone and go through everything once.
6. **Fill in the listing** in App Store Connect:
   - **Screenshots:** take them on your iPhone (light + dark, a few screens).
   - **Description, keywords, support URL:** your GitHub Pages site works.
   - **Privacy Policy URL:** upload `privacy.html` (included) next to your
     site, e.g. `https://ossamamektane.github.io/bills/privacy.html`.
   - **App Privacy:** choose **"Data Not Collected"**. The app makes no network
     requests; everything stays on the phone.
   - **Age rating:** answer "No" to the social media / user-generated content
     questions. The app has none.
   - **Price:** Free (or whatever you want).
7. Press **Submit for Review**. Most reviews finish within 24–48 hours.

**For each update:** change `"version"` in `app.json` (e.g. 1.0.1), then run
`eas build` and `eas submit` again. Build numbers go up automatically.

### Android (optional)
Needs a Google Play developer account ($25 one-time).
```
eas build --platform android --profile production
eas submit --platform android --latest
```

---

## What's different from the website

- **Tap a row to edit it.** On a phone that works better than editing inside
  a table. Delete is inside the edit sheet, with Undo.
- **Settings** (top corner) has Appearance, Language, Currency, Reminders,
  Export/Import and Clear all.
- **Reminders:** Off / On the day / The day before, at 9:00. Only payments
  with a set date ring. Every-day and no-fixed-date expenses don't. They
  update whenever you change something.
- No location lookup over the internet. The first currency and language come
  from the phone's own region and language settings.
