// Everything the app saves lives in two identical files in the app's private folder.
// Writing A then B means one of them is always complete, even if the phone dies mid-save.
import { File, Paths } from "expo-file-system";

const FILES = ["routines-a.json", "routines-b.json"];
let state = { rev: 0, data: {} };
let timer = null;
let dirty = false;
let away = false; // the app is in the background: save every change the moment it arrives

export function setAway(v) {
  away = !!v;
  if (away) flushStore();
}

function file(name) {
  return new File(Paths.document, name);
}

// Load the newest valid revision; a damaged or partial file must not discard its valid sibling.
export async function loadStore() {
  let best = null;
  for (const name of FILES) {
    try {
      const f = file(name);
      if (!f.exists) continue;
      const j = JSON.parse(await f.text());
      if (j && typeof j.rev === "number" && j.data && typeof j.data === "object" && (!best || j.rev > best.rev)) best = j;
    } catch (e) {
      // a half-written or damaged copy: the other one is used
    }
  }
  if (best) state = { rev: best.rev, data: best.data };
  return state;
}

export function getStore() {
  return state;
}

// A batch of changes from the page: { set: {key: value}, del: [key], rev }
export function applyChange(msg) {
  if (!msg) return;
  const set = msg.set && typeof msg.set === "object" ? msg.set : {};
  for (const k of Object.keys(set)) if (typeof set[k] === "string") state.data[k] = set[k];
  if (Array.isArray(msg.del)) for (const k of msg.del) delete state.data[k];
  state.rev = Math.max(state.rev + 1, typeof msg.rev === "number" ? msg.rev : 0);
  dirty = true;
  clearTimeout(timer);
  if (away) flushStore();
  else timer = setTimeout(flushStore, 350);
}

// Keep dirty true after any write failure so a later flush can retry.
export function flushStore() {
  clearTimeout(timer);
  timer = null;
  if (!dirty) return;
  dirty = false;
  const txt = JSON.stringify(state);
  for (const name of FILES) {
    try {
      const f = file(name);
      if (!f.exists) f.create();
      f.write(txt);
    } catch (e) {
      dirty = true; // try again next time
      console.warn("Could not save", name, e);
    }
  }
}

// Small extra file for app-only bits (e.g. which notification tap was already handled).
const META = "routines-meta.json";
export async function readMeta() {
  try {
    const f = file(META);
    if (!f.exists) return {};
    const j = JSON.parse(await f.text());
    return j && typeof j === "object" ? j : {};
  } catch (e) {
    return {};
  }
}
export function writeMeta(obj) {
  try {
    const f = file(META);
    if (!f.exists) f.create();
    f.write(JSON.stringify(obj));
  } catch (e) {
    // not important
  }
}
