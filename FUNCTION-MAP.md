# Function map

This map is organized by responsibility rather than mechanically adding a comment to every trivial helper. Read `DESIGN-AND-MAINTENANCE.md` first. These descriptions identify side effects and coupling; they do not certify correctness. `web/index.html` contains all of the following unless another file is named.

## Setup, translation, storage and dates

- `field`, `unzoom`: identify editable controls and undo accidental WebView zoom/sideways displacement. Changing event prevention can affect selection, accessibility and keyboards.
- `ico`, `t`, `esc`: construct inline icons, look up localized strings and escape user text for HTML. Preserve escaping when adding generated markup.
- `get`, `set`, `save`, `snaps`, `pushSnap`: read/write localStorage, save state, and manage local safety snapshots. Within the native app the shim forwards changes; a web-only test does not exercise native disk.
- `getWake`, `setWake`, `wakeRec`, `lastWake`, `wakeList`, `learnWake`, `usualWake`, `wakeAuto`: read/update wake records and history. Changes affect after-waking tasks, automatic day behavior and reminder projections.
- `actList`, `actNote`, `actPts`, `quietGaps`, `nightish`, `sleepFrom`, `stillUp`, `upSince`, `autoWake`: track activity and calculate awake/quiet intervals. `autoWake` is conditional and interacts with user prompts; quiet time is not proof of sleep.
- `repairFuture`, `guardClock`: guard against changed clocks or impossible stored times. Do not remove recovery without migration tests.
- `nat`, `nfGet`, `ndUsed`: native bridge, notification preferences and New Day state. Bridge payloads must match `App.js`.
- `extCut`, `dayInfo`, `today`, `calDay`, `calEnd`, `CUT`, `DE`, `lm`, `ldate`, `dtC`, `ldC`, `recut`, `syncCut`: calendar-day and extended-day calculations. These reassign hourly date/time representations when the day boundary changes; changes can move actual occurrences.
- `iso`, `parse`, `addDays`, `addMonths`, `diff`, `step`, `nextFixed`, `firstOnOrAfter`: local-date arithmetic for recurrence. Monthly dates clamp at month end; fixed repeats are anchored. `nextFixed` estimates the recurrence index and then advances to the next date; test DST and month ends.
- `fmt`, `hm`, `h12`, `ap`, `ft`, `ftH`, `mins`, `nowMin`, `dur`: format and convert times, including device display settings. Stored times stay HH:MM. Do not turn display text into stored state.
- `weekStart`, `period`, `winToday`, `logKey`: flexible goal periods and completion-day lookup. Changes affect quota counts at period boundaries.
- `dt`, `setOcc`, `gridA`, `gridAfter`, `gridLE`: convert hourly task occurrences and calculate fixed hourly grids. A change affects scheduling and reminders.
- `uid`, `dlGet`, `dlSet`, `norm`, `roll`: IDs, the per-day completion ledger, migration/normalization and rolling occurrences forward. Preserve backward compatibility with existing backups.

## Derived model and screen

- `model` and its inner `slot`, `anyDone`, `one`, `ws` functions classify task occurrences, count progress and sort them. Badge and notification planning also consume this model. UI-only changes here can therefore affect reminders.
- `ord`, `every`, `qtxt`, `floats`, `inDays`, `everyN`, `freq`, `describe`, `rel`: produce localized frequency and relative-time text. Do not parse those strings back into the model.
- `descH`, `dsBtn`, `dsFit`, `row`, `sec`, `winRow`, `sec3`, `mini`, `nowCard`: generate task presentation and expandable description controls. Keep escaped task names and notes.
- `windowLeft`, `nextDueLabel`, `dayEnd`, `tabTop`, `tabNow`, `periodLeft`, `left`: time-left and due-date display calculations; distinguish an actual deadline from an illustrative period end.
- `flipKey`, `flipEls`, `flipFirst`, `flipPlay`: animate list changes. Reduced-motion rules should remain effective; animation must not change data.
- `zoneName`, `render`, `paintLeft`, `paintNd`: derive device time-zone note, update the task list and paint wake-state/header information. `render` also invokes model, persistence and notification-plan hooks, so it is not a pure view function. `wakeCheck` is decorative; it does not mark any task done.

## Wake-up, actions and sheets

- `askRec`, `askSet`, `awakeList`, `dayLen`, `learnDay`, `missedIn`, `sleptLikely`, `touch`, `joinNames`, `wakeCard`, `wakeLbl`, `showNd`, `wakeIs`, `noSleep`, `wakeAtAbs`, `editWake`: prompt, record, revise or describe wake state. They affect task timing; exercise yesterday/today and midnight cases.
- `lockSync`: lock background scrolling while sheets are open. It is coupled to touch handling, focus, keyboard dismissal and scroll restoration.
- `find`, `snap`, `buzz`, `stamp`: locate tasks, snapshot for undo, send haptics and obtain a current time.
- `advance`, `retime`, `restore`, `skipItem`, `apply`, `slotInfo`, `act`: mutate occurrences, handle completion/undo/skip/later and persist/render feedback. `apply` is a shared mutation point, not merely a visual checkmark.
- `toast`, swipe helpers `stop`/`end`, `canLater`, `openMenu`, `closeMenu`: transient feedback, gestures and task actions. A visible button must continue to offer actions accessible without a swipe.
- `lateQueue`, `openCatch`, `closeCatch`, `paintCatch`, `answer`, `answerAll`, `maybeCatch`: catch-up queue and answers. `maybeCatch` currently returns immediately, so it does not auto-open.
- `openSheet`, `closeSheet`, `N`, `canWake`, `canNoFix`, `startDay`, `startDate`, `validStart`, `formValid`, `paintSave`: edit draft setup, allowed choices, validation, disabled state and sheet lifecycle. Saving must revalidate, not trust appearance alone.
- `drawDuration` renders the trigger; `openDuration`, `durationItem` and `updateDuration` manage the modal and its draft wheel. Values map to 40px rows; update CSS and JS together if row height changes. Set commits the draft; Cancel does not.
- `stepper`, `toggle`, `joinTimes`, `gridPreview`, `summary`, `paintSheet`, `growDesc`: construct editor controls, descriptions and summaries; event delegation survives repaint. `paintSheet` can alter draft values that are invalid for the selected mode.
- `wheelLabels`, `buildWheels`, `setWheels`, `readWheels`, `openPicker`, `tMoment`, `tPaint`, `openTime`, `closeTime`, `pickTime`, `didAt`: canonical time entry and the wake/completion time sheet. They feed the shared custom picker; test it in iPhone WebKit.
- `openLater`, `closeLater`, `pickLater`: move one occurrence while honoring date/time rules. Test both timed and untimed tasks.
- `allTag`, `allSort`, `paintAll`, `list`, `openPrefs`, `closePrefs`, `openAll`, `closeAll`, `fitMenu`, `closeMenus`: list, settings and menu navigation; menus need narrow-screen/RTL tests.
- `applyClock`, `applyTheme`, `applyLang`: update settings, rerender labels and/or notify native shell. Theme and language choice persist.
- `importText`: validates/normalizes user-selected backup data and replaces task/history state; its Undo restores both the task snapshot and previous history. Test malformed, old and valid backups; never add undocumented network upload.

## Notification projection

- `atDay`, `dueOn`, `nList`, `notifPlan` and its inner `add`, `key`, `slotN`, `wakeDay`, `nudge`: build a limited future local-reminder plan from task rules and user preferences. These do not themselves schedule with iOS.
- `badgePlan` and its inner `owed`, `endOf`: calculate future badge counts and badge-only changes. Exercise midnight, overdue items and notification limits before changing.
- `syncPlan`, `sendPlan`, `away`: debounce plans, send them to the native bridge and force a refresh on backgrounding. App suspension makes timing sensitive.
- `paintNf`, `askNf`: display notification permission state and request/route permission. OS authorization and delivery are outside browser control.

## Native files

- `App.js`: `timeZone` obtains a device zone; `Main` owns lifecycle and bridge dispatch. Its `call`, `sendPerm`, `reload`, `handleResponse`, `doExport`, `doImport`, `haptic`, `onMessage` callbacks connect page state to OS APIs. Notification taps are deduplicated via metadata.
- `src/store.js`: `loadStore`, `getStore`, `applyChange`, `flushStore`, `setAway`, `readMeta`, `writeMeta`, `file` implement revisioned storage, batching and recovery. They are not a cloud sync.
- `src/notify.js`: `setupChannel`, `granted`, `describe`, `permState`, `askOrOpenSettings`, `askPermission` handle permissions; `setBadge`/`applyBadge` track the desired badge; `ensureCategory`, `hash`, `idOf`, `atOf`, `applyPlan`, `run`, `schedule`, `sync`, `clearAll` reconcile pending reminders. OS restrictions still apply.
- `src/shim.js`: injected `send`, `queue`, `bump` synchronize localStorage; `safe`, `buildPage`, `jsArg` safely assemble the page and injected arguments. Test escaping and startup ordering before changes.

## Update 18: shared date and time dialog

- `syncPickerFields` creates idempotent visible triggers for hidden canonical inputs, including fields recreated during rendering. `cpOpen` copies a draft, `cpDraw` renders calendar or hour/minute controls, and `cpClose` restores focus. Only Set dispatches input/change events; Cancel makes no data change. Date limits are enforced in the calendar and at commit. Keep these IDs and canonical values stable when editing form logic.
- `lateDays` formats overdue days in context in English, French, and Arabic, including Arabic singular and dual.
- `advance` snapshots `laterDate`; `restore` reads it when available so unchecking preserves an earlier postponement. Old snapshots without this key remain supported. Hourly `prev.parent` holds earlier same-day snapshots (maximum 48 links) for successive unchecks; when the latest check is removed, previously unchecked older snapshots are unwound too. Do not use a full-state rollback for ordinary unchecking, because other tasks may have changed since.

## Update 19: task editor
- `validStart()` accepts any valid calendar date; the recurrence anchor remains the chosen date, while `roll()` decides the current occurrence for timed tasks.
- `openPicker()` opens the shared picker directly; `addPickedTime()` commits only after Set. Cancel must not mutate the task draft. `wInput` has no generated trigger because Add time is the trigger.
- `paintSheet()` hides the schedule-mode selector for hourly tasks, retaining scheduled mode. Other repeat units keep their existing flexible eligibility rules.
- `updateEditorCue()` only indicates more editor content; the header stays fixed and fields remain scrollable.

## Update 20: editor visibility and time entry
- `#hint` is inside `#sbody`; validation and Save are in the fixed header. `#sbody` bottom padding and scroll padding keep the final controls reachable.
- `CP.twelve` is true for every clock-time dialog; the dashboard display independently follows `h12()`. `CP.minute` and stored task times remain 24-hour values; test noon, midnight, cancellation, and both display preferences.
- Repeat text has explicit ink colors to avoid iOS touch tint during scroll. The local-time zone label was removed; time calculations still use the phone’s local time zone.

## Time wheel and safe area (Update 21)
`cpOpen` creates a time draft; `cpDraw` builds repeated hour/minute wheels. `wheelRead` maps the centered row to canonical 24-hour minutes, and `wheelPaint` updates visual and accessibility values. Set commits to the hidden input; Cancel discards it. Repeat cycles are recentered after scrolling settles. Keep 44px row height, 220px viewport and 88px padding in sync. `App.js` reserves the iOS top safe area outside the WebView to keep content out of the status bar; Android retains injected insets.

`openDuration`, `durationItem` and `updateDuration` own the separate after-waking duration wheel; `drawDuration` draws its trigger. Its 120px viewport, 40px rows and 40px end spacers work together; preserve these proportions when changing the layout. The maximum is 18:00.

## Sheet and picker alignment (Update 22)
All clock fields use the same 12-hour picker and store 24-hour HH:MM; changing the picker must not change the dashboard clock preference. `.sheet .sbody` needs min-height zero so long lists scroll rather than pushing their headers offscreen. The editor summary centers icon and text together. The grouped title fields draw their focus ring on the rounded parent to avoid clipped corners.

On iOS, the native root reserves top and side safe-area insets; the embedded page receives zero top and side CSS insets so they are not counted twice. Bottom safe-area handling stays in the page. Test landscape on actual devices.

`#saveBtn` lives in the fixed editor header: `paintSave` still controls validation, accessible label and disabled state; the form alone scrolls. `openMenu` opens centered task actions with `mScrim`; `closeMenu` clears the selection. The reference Bills archive informed interaction styling only; its code and business logic were not substituted.

The after-waking field is now a button that opens a duration pop-up. `openDuration` starts a draft; `updateDuration` changes only that draft. Set commits `F.wake` and Cancel leaves it unchanged, so ordinary form scrolling cannot alter it.

(Update 22, superseded by Update 23) `#addBtn` was in a compact fixed bottom toolbar and hidden while sheets were open. Main content reserves bottom space and the toast sits above the action. All tasks has its own bottom `#aAdd`. Maintain logical RTL positioning and safe-area offsets.

The Manage tasks header action combines the existing list icon with a localized text label: keep the label rather than relying on the icon alone.

## Dashboard navigation (Update 23)
`#prefBtn` opens Settings beside the date. `render()` adds the localized `data-act=all` action next to To do whenever tasks exist; the delegated handler opens Manage tasks. It is deliberately absent from Settings. `#addBtn` is fixed at the lower left, hidden while dialogs are locked; dashboard bottom padding allows the final row to scroll past it. Toasts sit above the button. This is an overlay, not a full-width toolbar: test touches, safe areas and RTL on device.

Picker triggers use two equal-sized, vertically centered SVG icons. The chevron mirrors in RTL; avoid reverting it to a font glyph whose baseline can misalign on iOS. `syncPickerFields` and `drawDuration` both build this same icon pattern.

The recurrence `#hint` uses centered inline flow so the repeat icon stays with the first line instead of reserving a separate flex column; the whole sentence may wrap. Its top margin separates it from edit actions. Check long translations and RTL if changing the icon or typography.

The Settings `#clockSwitch` is a binary 24-hour switch. It writes the existing r.clock values (24 when on, 12 when off), and `applyClock` synchronizes its visual state and aria-checked. Picker input remains 12-hour with AM/PM; task display follows this preference. Theme and language retain segmented controls because they have three choices.

Button text and action icons use centered alignment. Switch rows and picker triggers have balanced grid columns so their labels stay horizontally centered while switches and icons remain at the edge. Check long labels, RTL and 320px layouts before changing these columns.

Settings section headings reuse the locally drawn outline icons from `P`; label spans retain their data-t keys for localization. Binary settings use switches; the three-option theme and language settings remain segmented.

## Repeat switch layout (Update 24)
Both hourly and date-based repeat help use `toggle()` and the same `.tgh` typography. Equal side columns keep the text centered; the 12px gaps keep it away from the switch in LTR and RTL. The role and aria-checked state come from the existing draft value; the change is presentational. Test wrapping and interaction at narrow widths before editing.

Update 24 supersedes Update 23 navigation geometry: `#addBtn` is physically bottom-right and `#all` no longer contains an add action. Wake status is normal flow, not sticky. `lockSync()` includes the row menu and sends modalState to the native shell, which matches its iOS safe-area background to the page or dimmed scrim. Native WebView bouncing is disabled. Sheet bounds use viewport percentages on phones. Verify keyboard open/close, nested dialogs, and safe areas on real iOS devices before release.

`#clockHelp` labels the fixed-time control, parallel to the after-waking duration label. `paintSheet` hides it in wake mode; the label does not change time validation or stored values.

The Notes field draws the divider inside `.titleFields`; the focus rule restores its top border while the parent keeps its rounded focus ring. Test both inputs and both themes when changing focus styles.

The floating button has only 76px plus the bottom inset of list clearance, not a footer. A slim, lined custom trash vector follows the rest of the outline icon family; it is not an Apple SF Symbol.

The original icon artwork is `design/app-icon.svg`; generated iOS, Android and splash assets are checked in. `scripts/make-icon.cjs` is an optional regeneration tool requiring `sharp` separately; it is not part of the build. The task-action menu and focus divider have browser regression checks in `scripts/test-interface24.cjs`. Native device layout still needs an iPhone test.

## Update 25 final polish
Settings uses `positionPrefs()` for its anchored popover. `pScrim` is transparent and outside tap closes it; settings controls retain their existing state logic. It scrolls internally on small screens. `checkDoneCollision()` hides the floating create control only while it overlaps the Done heading, with no additional footer padding. `syncVisibleViewport()` adjusts mobile sheet bounds for the visible keyboard viewport. It replaces the older viewport-meta rewrite on input blur. Shared `--type-*` CSS tokens describe caption, secondary, body and heading roles. Verify keyboard open/close, rotations and safe areas on physical iPhone: browser tests do not simulate WKWebView perfectly. Settings no longer displays storage or update footer text.

Modal scrims become visible immediately; non-settings sheets start their slide 40ms later. Dragging disables the transition. The Settings popover intentionally uses a transparent dismissal layer.

`#aList` uses modest internal bottom padding plus `--sb` so the last management card clears the iPhone home indicator. The native iOS shell supplies and updates the bottom safe inset without reloading the page; this is not extra dashboard footer space.
The task-action `.mh` is a centered secondary-weight title with a divider; it is not a tappable menu item.

## Update 26
`#clockHelp` has been removed across all units because the heading and Add time action provide the same information. Weekly and monthly times remain optional. No scheduling logic changes.
`drawDuration()` uses `chooseDuration` for the short unset button label and includes the contextual label in its accessible name.
Update 26 adds a short `pickerArrive` animation and subtle press feedback; the reduced-motion query disables them. It does not change picker selection or scheduling. The Bills app uses React Native views; this app uses a WebView inside a native shell.

## Update 27 icon color roles
Leading icons in `.grow` and `.rmenu .mi` inherit the row color. Destructive and armed states therefore remain red/white automatically. Accent actions use the existing blue; secondary chevrons and informational picker icons stay muted. Wake/status colors are intentional semantic exceptions. This is CSS only; there is no change to task state.

Update 28 supersedes the earlier modal-dimming and editor-sheet notes: `#sheet` is a centered popup, all scrim layers remain transparent but still intercept outside taps, and `lockSync()` no longer dims the native status area. `syncVisibleViewport()` publishes the center and height for keyboard resizing. The editor's old drag-to-dismiss handler is removed because it overwrote the popup's transform. The notes field remains multiline, and Return in the name field only dismisses the keyboard. Verify WKWebView keyboard/viewport behavior on a physical iPhone. AlarmKit and louder custom notifications are not implemented.
