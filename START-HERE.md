# Routines — Update 30

This ZIP is a reconstructed Routines project, including the supplied GitHub Actions workflow. It has **not** been compared with the current repository: download a backup before replacing files. Preserve GitHub secrets and Expo/App Store signing settings; they are not included here.

Extract the ZIP and upload its contents to the repository root, including `.github/workflows/main.yml`. Then run the existing **Send to App Store** workflow. Expo build and submission queues, account settings and App Store review still apply.

## What changed

- Uses Bills' white/charcoal palette, system font, rounded controls and Ionicons—including the Bills settings icon. The new monochrome app icon has the same background as Bills but a distinct Routines repeat/check mark.
- Bottom-up sheets with dark backdrops, spring-like CSS transitions, Reduce Motion support and scrollable content. Starting date and time remain nested sheets; the earlier inline repeat editor is restored.
- The centered Add task control stays available while scrolling, with compact content clearance rather than a footer. The Manage tasks list and individual task editing remain available.

This project is still an Expo app with a WebView, not the native React Native UI used by Bills. Its motion is a CSS approximation, not native SwiftUI, Liquid Glass or an exact device rendering. Reminder behavior and sounds are unchanged.

Before release, build and test on actual iPhones: small screens, rotation, keyboard, scrolling, nested sheets, VoiceOver, Reduce Motion, light/dark, languages, task persistence and notifications while locked. Browser tests cannot guarantee iOS performance, accessibility or notification delivery. See `DESIGN-AND-MAINTENANCE.md` for source and testing details.
