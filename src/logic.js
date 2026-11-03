// The maths and wording behind Bills, ported from the website so the app and
// the site always agree on what a month costs and when money leaves.
// Everything here is pure: it takes items / a language and returns values.
import { STR } from "./strings";

export const DAY = 86400000;
const DAYS_PER_YEAR = 365.2425;

export const LANGS = [
  { value: "en", label: "English" },
  { value: "fr", label: "Fran\u00e7ais" },
  { value: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
];
const LOCALES = { en: "en-US", fr: "fr-FR", ar: "ar-MA" };

export const CURRENCIES = ["MAD","USD","EUR","GBP","CHF","CAD","AUD","AED","SAR","QAR","KWD","EGP","TND","DZD","TRY","SEK","NOK","DKK","PLN","CZK","JPY","CNY","KRW","INR","PKR","IDR","SGD","HKD","NZD","ZAR","NGN","KES","BRL","MXN","ARS","CLP","COP"];

const CURRENCY_NAMES = {
  MAD:"Moroccan dirham", USD:"US dollar", EUR:"Euro", GBP:"British pound", CHF:"Swiss franc",
  CAD:"Canadian dollar", AUD:"Australian dollar", AED:"UAE dirham", SAR:"Saudi riyal",
  QAR:"Qatari riyal", KWD:"Kuwaiti dinar", EGP:"Egyptian pound", TND:"Tunisian dinar",
  DZD:"Algerian dinar", TRY:"Turkish lira", SEK:"Swedish krona", NOK:"Norwegian krone",
  DKK:"Danish krone", PLN:"Polish z\u0142oty", CZK:"Czech koruna", JPY:"Japanese yen",
  CNY:"Chinese yuan", KRW:"South Korean won", INR:"Indian rupee", PKR:"Pakistani rupee",
  IDR:"Indonesian rupiah", SGD:"Singapore dollar", HKD:"Hong Kong dollar",
  NZD:"New Zealand dollar", ZAR:"South African rand", NGN:"Nigerian naira",
  KES:"Kenyan shilling", BRL:"Brazilian real", MXN:"Mexican peso", ARS:"Argentine peso",
  CLP:"Chilean peso", COP:"Colombian peso",
};

export const SORTS = ["added", "next", "cost"];
export const THEMES = ["auto", "light", "dark"];
export const REMINDERS = ["off", "same", "before"];

/* ---------------- translation ---------------- */
export function t(lang, key, vars) {
  const row = STR[key];
  let s = row ? row[lang] || row.en : "";
  if (vars) for (const k of Object.keys(vars)) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}

/* ---------------- where in the world the phone is ---------------- */
const CUR_BY_COUNTRY = {}, ZONE_COUNTRY = {}, AR_COUNTRY = {}, FR_COUNTRY = {};
(function () {
  const cur = "MAD:MA USD:US,EC,PA,SV,ZW EUR:FR,DE,ES,IT,NL,BE,AT,IE,PT,GR,FI,LU,MT,CY,SK,SI,EE,LV,LT,HR,MC,AD,SM,VA,ME,XK GBP:GB,IM,JE,GG CHF:CH,LI CAD:CA AUD:AU AED:AE SAR:SA QAR:QA KWD:KW EGP:EG TND:TN DZD:DZ TRY:TR SEK:SE NOK:NO DKK:DK PLN:PL CZK:CZ JPY:JP CNY:CN KRW:KR INR:IN PKR:PK IDR:ID SGD:SG HKD:HK NZD:NZ ZAR:ZA NGN:NG KES:KE BRL:BR MXN:MX ARS:AR CLP:CL COP:CO".split(" ");
  for (const c of cur) { const [code, list] = c.split(":"); for (const cc of list.split(",")) CUR_BY_COUNTRY[cc] = code; }
  const zon = "MA:Africa/Casablanca,Africa/El_Aaiun US:America/New_York,America/Chicago,America/Denver,America/Los_Angeles,America/Phoenix,America/Anchorage,America/Detroit,America/Indiana/Indianapolis,America/Boise,Pacific/Honolulu CA:America/Toronto,America/Vancouver,America/Edmonton,America/Winnipeg,America/Halifax,America/St_Johns,America/Regina GB:Europe/London FR:Europe/Paris DE:Europe/Berlin ES:Europe/Madrid,Atlantic/Canary IT:Europe/Rome NL:Europe/Amsterdam BE:Europe/Brussels AT:Europe/Vienna IE:Europe/Dublin PT:Europe/Lisbon,Atlantic/Azores GR:Europe/Athens FI:Europe/Helsinki LU:Europe/Luxembourg MT:Europe/Malta CY:Asia/Nicosia SK:Europe/Bratislava SI:Europe/Ljubljana EE:Europe/Tallinn LV:Europe/Riga LT:Europe/Vilnius HR:Europe/Zagreb MC:Europe/Monaco ME:Europe/Podgorica CH:Europe/Zurich TR:Europe/Istanbul SE:Europe/Stockholm NO:Europe/Oslo DK:Europe/Copenhagen PL:Europe/Warsaw CZ:Europe/Prague AE:Asia/Dubai SA:Asia/Riyadh QA:Asia/Qatar KW:Asia/Kuwait EG:Africa/Cairo TN:Africa/Tunis DZ:Africa/Algiers JP:Asia/Tokyo CN:Asia/Shanghai,Asia/Chongqing,Asia/Urumqi,Asia/Harbin KR:Asia/Seoul IN:Asia/Kolkata,Asia/Calcutta PK:Asia/Karachi ID:Asia/Jakarta,Asia/Makassar,Asia/Pontianak,Asia/Jayapura SG:Asia/Singapore HK:Asia/Hong_Kong NZ:Pacific/Auckland ZA:Africa/Johannesburg NG:Africa/Lagos KE:Africa/Nairobi BR:America/Sao_Paulo,America/Bahia,America/Fortaleza,America/Recife,America/Manaus,America/Belem MX:America/Mexico_City,America/Tijuana,America/Monterrey,America/Cancun,America/Chihuahua AR:America/Argentina/Buenos_Aires,America/Argentina/Cordoba,America/Argentina/Mendoza CL:America/Santiago,Pacific/Easter CO:America/Bogota".split(" ");
  for (const z of zon) { const [cc, list] = z.split(":"); for (const tz of list.split(",")) ZONE_COUNTRY[tz] = cc; }
  for (const cc of "MA DZ TN EG SA AE QA KW LY IQ JO SY LB YE OM BH SD PS MR".split(" ")) AR_COUNTRY[cc] = 1;
  for (const cc of "FR BE LU MC SN CI ML BF NE TG BJ GA CG CD CM MG GN DJ".split(" ")) FR_COUNTRY[cc] = 1;
})();

// First launch: guess a currency and language from the phone's own settings.
// A real choice made later always wins.
export function guessDefaults({ timeZone, regionCode, languageCodes }) {
  let cc = (timeZone && ZONE_COUNTRY[timeZone]) || "";
  if (!cc && regionCode && CUR_BY_COUNTRY[String(regionCode).toUpperCase()]) cc = String(regionCode).toUpperCase();
  let lang = "";
  for (const code of languageCodes || []) {
    const two = String(code || "").slice(0, 2).toLowerCase();
    if (LANGS.some((l) => l.value === two)) { lang = two; break; }
  }
  if (!lang && cc) lang = AR_COUNTRY[cc] ? "ar" : FR_COUNTRY[cc] ? "fr" : "en";
  return { currency: (cc && CUR_BY_COUNTRY[cc]) || "MAD", lang: lang || "en" };
}

/* ---------------- model ---------------- */
export function uid() { return "e" + Math.random().toString(36).slice(2, 9); }

export function normalize(r) {
  const n = Math.round(Number(r && r.n));
  const unit = r && (r.unit === "weeks" || r.unit === "months" || r.unit === "days") ? r.unit : "";
  let start = r && typeof r.start === "string" && parseISO(r.start) !== null ? r.start : "";
  const flex = !!(r && r.flex);
  if (flex) start = "";
  const nn = isFinite(n) && n > 0 ? n : 1;
  return {
    id: (r && r.id) || uid(),
    name: r && typeof r.name === "string" ? r.name : "",
    cost: r && isFinite(Number(r.cost)) ? Number(r.cost) : 0,
    n: nn,
    unit,
    start,
    flex,
    paused: !!(r && r.paused),
    remind: false,
  };
}

// Reads a backup in the website's format: an array, or { items: [...] }.
export function parseBackup(text) {
  const p = JSON.parse(String(text));
  const arr = Array.isArray(p) ? p : p && p.items;
  if (!Array.isArray(arr)) throw new Error("shape");
  return {
    items: arr.map(normalize),
    currency: p && typeof p.currency === "string" && p.currency ? p.currency : null,
  };
}

/* ---------------- dates ---------------- */
// Today at UTC midnight, using the phone's local calendar day.
export function today() { const n = new Date(); return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()); }
export function parseISO(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
}
export function toISO(ts) {
  const d = new Date(ts);
  return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0") + "-" + String(d.getUTCDate()).padStart(2, "0");
}
export function daysInMonth(year, month) { return new Date(Date.UTC(year, month + 1, 0)).getUTCDate(); }

// Month and weekday names come from the platform, with English as a fallback.
const EN_MON = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const EN_MON_S = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const EN_DAY_LONG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const EN_DOW = ["S","M","T","W","T","F","S"];
const nameCache = {};
export function names(lang) {
  if (nameCache[lang]) return nameCache[lang];
  const out = { MON: EN_MON.slice(), MON_S: EN_MON_S.slice(), DAY_LONG: EN_DAY_LONG.slice(), DOW: EN_DOW.slice() };
  if (lang !== "en") {
    try {
      const loc = LOCALES[lang] || "en-US";
      const full = new Intl.DateTimeFormat(loc, { month: "long", timeZone: "UTC" });
      const abbr = new Intl.DateTimeFormat(loc, { month: "short", timeZone: "UTC" });
      const longF = new Intl.DateTimeFormat(loc, { weekday: "long", timeZone: "UTC" });
      const narrowF = new Intl.DateTimeFormat(loc, { weekday: "narrow", timeZone: "UTC" });
      const MON = [], MON_S = [], DAY_LONG = [], DOW = [];
      for (let i = 0; i < 12; i++) {
        const d = new Date(Date.UTC(2021, i, 15));
        MON.push(full.format(d));
        MON_S.push(abbr.format(d).replace(".", ""));
      }
      for (let i = 0; i < 7; i++) {
        const d = new Date(Date.UTC(1970, 0, 4 + i)); // a Sunday
        DAY_LONG.push(longF.format(d));
        DOW.push(narrowF.format(d));
      }
      // Some engines answer with digits ("1") when they lack the locale data.
      if (!/^\d+$/.test(MON[0])) Object.assign(out, { MON, MON_S, DAY_LONG, DOW });
    } catch (e) { /* keep English */ }
  }
  nameCache[lang] = out;
  return out;
}

export function fmtShort(lang, ts) { const d = new Date(ts), N = names(lang); return N.MON[d.getUTCMonth()] + " " + d.getUTCDate(); }
export function fmtWhen(lang, ts) { const d = new Date(ts), N = names(lang); return N.DAY_LONG[d.getUTCDay()] + ", " + N.MON[d.getUTCMonth()] + " " + d.getUTCDate(); }
export function fmtLong(lang, ts) { const d = new Date(ts), N = names(lang); return N.MON[d.getUTCMonth()] + " " + d.getUTCDate() + ", " + d.getUTCFullYear(); }

/* ---------------- maths ---------------- */
export function repeatSet(it) { return it.unit === "days" || it.unit === "weeks" || it.unit === "months"; }
export function intervalDays(it) {
  if (!repeatSet(it)) return 0;
  const n = it.n > 0 ? it.n : 0;
  if (n <= 0) return 0;
  if (it.unit === "months") return n * (365.25 / 12);
  if (it.unit === "weeks") return n * 7;
  return n;
}
export function isDaily(it) { return it.unit === "days" && it.n === 1; }

// Dateless expenses land on the calendar's own periods: one per month, week
// (counted by its Monday) or day. Nothing here reads the clock.
export function countCalendarPeriods(it, rangeStart, rangeEnd) {
  if (!repeatSet(it)) return 0;
  const n = Math.max(1, it.n || 1);
  if (rangeEnd < rangeStart) return 0;
  if (it.unit === "months") {
    const s = new Date(rangeStart), e = new Date(rangeEnd);
    const firstM = s.getUTCFullYear() * 12 + s.getUTCMonth();
    const lastM = e.getUTCFullYear() * 12 + e.getUTCMonth();
    let mc = 0;
    for (let mi = firstM; mi <= lastM; mi++) if (((mi % n) + n) % n === 0) mc++;
    return mc;
  }
  if (it.unit === "weeks") {
    const EPOCH_MONDAY = Date.UTC(1970, 0, 5), WEEK = 7 * DAY;
    const idx = Math.ceil((rangeStart - EPOCH_MONDAY) / WEEK);
    let wc = 0;
    for (let tt = EPOCH_MONDAY + idx * WEEK; tt <= rangeEnd; tt += WEEK) {
      const wi = Math.round((tt - EPOCH_MONDAY) / WEEK);
      if (((wi % n) + n) % n === 0) wc++;
    }
    return wc;
  }
  const d0 = Math.ceil(rangeStart / DAY), d1 = Math.floor(rangeEnd / DAY);
  if (d1 < d0) return 0;
  if (n === 1) return d1 - d0 + 1;
  let dc = 0;
  for (let di = d0; di <= d1; di++) if (((di % n) + n) % n === 0) dc++;
  return dc;
}

export function countPayments(it, rangeStart, rangeEnd) {
  const anchor = parseISO(it.start);
  if (it.flex || anchor === null) return countCalendarPeriods(it, rangeStart, rangeEnd);
  if (intervalDays(it) <= 0) return 0;
  if (it.unit === "months") {
    const ad = new Date(anchor), sd = new Date(rangeStart), ed = new Date(rangeEnd);
    const firstIndex = sd.getUTCFullYear() * 12 + sd.getUTCMonth();
    const lastIndex = ed.getUTCFullYear() * 12 + ed.getUTCMonth();
    const anchorIndex = ad.getUTCFullYear() * 12 + ad.getUTCMonth();
    let total = 0;
    for (let mi = firstIndex; mi <= lastIndex; mi++) {
      const delta = mi - anchorIndex;
      if (delta < 0) continue;
      if (((delta % it.n) + it.n) % it.n !== 0) continue;
      const y = Math.floor(mi / 12), m = mi - y * 12;
      const due = Date.UTC(y, m, Math.min(ad.getUTCDate(), daysInMonth(y, m)));
      if (due < anchor) continue;
      if (due >= rangeStart && due <= rangeEnd) total++;
    }
    return total;
  }
  const stepDays = it.unit === "weeks" ? it.n * 7 : it.n;
  const stepMs = Math.max(1, stepDays) * DAY;
  const from = Math.max(rangeStart, anchor);
  if (from > rangeEnd) return 0;
  let first = anchor + Math.ceil((from - anchor) / stepMs) * stepMs;
  if (first < from) first += stepMs;
  return first > rangeEnd ? 0 : Math.floor((rangeEnd - first) / stepMs) + 1;
}

export function requiredFor(it, a, b) {
  if (it.paused) return 0;
  return (it.cost || 0) * countPayments(it, a, b);
}

export function totalForMonth(items, year, month) {
  const a = Date.UTC(year, month, 1), b = Date.UTC(year, month, daysInMonth(year, month));
  let sum = 0;
  for (const it of items) sum += requiredFor(it, a, b);
  return sum;
}

export function paymentsInMonth(items, year, month) {
  const a = Date.UTC(year, month, 1), b = Date.UTC(year, month, daysInMonth(year, month));
  let c = 0;
  for (const it of items) if (!it.paused && countPayments(it, a, b) > 0) c++;
  return c;
}

// The next twelve months, starting with this one.
export function monthsAhead(items) {
  const now = new Date(today());
  const out = [];
  for (let k = 0; k < 12; k++) {
    const mi = now.getUTCMonth() + k;
    const y = now.getUTCFullYear() + Math.floor(mi / 12);
    const m = ((mi % 12) + 12) % 12;
    out.push({ y, m, amt: totalForMonth(items, y, m), payments: paymentsInMonth(items, y, m) });
  }
  return out;
}

export function nextDate(it) {
  if (it.flex || it.paused) return null;
  if (intervalDays(it) <= 0) return null;
  const start = parseISO(it.start);
  if (start === null) return null;
  const td = today();
  if (it.unit === "months") {
    const sd = new Date(start), monthDay = sd.getUTCDate();
    for (let cycle = 0; cycle < 240; cycle++) {
      const base = new Date(Date.UTC(sd.getUTCFullYear(), sd.getUTCMonth() + cycle * it.n, 1));
      const y = base.getUTCFullYear(), m = base.getUTCMonth();
      const due = Date.UTC(y, m, Math.min(monthDay, daysInMonth(y, m)));
      if (due >= start && due >= td) return due;
    }
    return null;
  }
  if (start > td) return start;
  const step = it.unit === "weeks" ? it.n * 7 : it.n;
  const days = Math.round((td - start) / DAY);
  return td + ((step - (days % step)) % step) * DAY;
}

// Real payment days of one dated expense between a and b (inclusive).
export function paymentDates(it, a, b) {
  const out = [];
  if (it.paused || !repeatSet(it) || it.flex) return out;
  const anchor = parseISO(it.start);
  if (anchor === null) return out;
  const n = Math.max(1, it.n || 1);
  if (it.unit === "months") {
    const ad = new Date(anchor), sd = new Date(a), ed = new Date(b);
    const f = sd.getUTCFullYear() * 12 + sd.getUTCMonth();
    const l = ed.getUTCFullYear() * 12 + ed.getUTCMonth();
    const ai = ad.getUTCFullYear() * 12 + ad.getUTCMonth();
    for (let mi = f; mi <= l; mi++) {
      const delta = mi - ai;
      if (delta < 0 || ((delta % n) + n) % n !== 0) continue;
      const y = Math.floor(mi / 12), m = mi - y * 12;
      const due = Date.UTC(y, m, Math.min(ad.getUTCDate(), daysInMonth(y, m)));
      if (due >= anchor && due >= a && due <= b) out.push(due);
    }
    return out;
  }
  const step = (it.unit === "weeks" ? n * 7 : n) * DAY;
  const from = Math.max(a, anchor);
  if (from > b) return out;
  let first = anchor + Math.ceil((from - anchor) / step) * step;
  if (first < from) first += step;
  for (let d = first; d <= b; d += step) out.push(d);
  return out;
}

/* ---------------- money ---------------- */
// Always "1,234.56", like the website, whatever the phone's locale.
export function money(v) {
  const neg = v < 0;
  const fixed = Math.abs(Math.round((v || 0) * 100) / 100).toFixed(2);
  const [int, dec] = fixed.split(".");
  return (neg ? "-" : "") + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + dec;
}
export function moneyTrim(v) { return money(v).replace(/\.00$/, ""); }
export function shortMoney(v) {
  if (!v) return "0";
  const a = Math.abs(v);
  if (a >= 1000000) return (v / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (a >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return Math.round(v).toString();
}

export function curName(lang, c) {
  try {
    const n = new Intl.DisplayNames([LOCALES[lang] || "en-US"], { type: "currency" }).of(c);
    if (n && n !== c) return n;
  } catch (e) { /* not available on every engine */ }
  return CURRENCY_NAMES[c] || "";
}

/* ---------------- sorting ---------------- */
function sortKeyNext(it) {
  if (it.paused) return 4e9;
  if (isDaily(it)) return 0;
  const nd = nextDate(it);
  if (nd === null) {
    const per = (it.unit === "months" ? 30 : it.unit === "weeks" ? 7 : 1) * Math.max(1, it.n || 1);
    return per + 0.5;
  }
  return Math.round((nd - today()) / DAY);
}
export function ordered(items, sortMode) {
  const arr = items.slice();
  if (sortMode === "next") arr.sort((a, b) => sortKeyNext(a) - sortKeyNext(b));
  else if (sortMode === "cost") {
    const now = new Date(today());
    const y = now.getUTCFullYear(), m = now.getUTCMonth();
    const ms = Date.UTC(y, m, 1), me = Date.UTC(y, m, daysInMonth(y, m));
    arr.sort((a, b) => requiredFor(b, ms, me) - requiredFor(a, ms, me));
  }
  return arr;
}

/* ---------------- counting words ---------------- */
function plural(n, word) { return n === 1 ? word : word + "s"; }
export function nItems(lang, n) {
  if (lang === "fr") return n + (n === 1 ? " d\u00e9pense" : " d\u00e9penses");
  if (lang === "ar") {
    if (n === 1) return "\u0645\u0635\u0631\u0648\u0641 \u0648\u0627\u062d\u062f";
    if (n === 2) return "\u0645\u0635\u0631\u0648\u0641\u0627\u0646";
    if (n <= 10) return n + " \u0645\u0635\u0627\u0631\u064a\u0641";
    return n + " \u0645\u0635\u0631\u0648\u0641\u0627\u064b";
  }
  return n + (n === 1 ? " item" : " items");
}
export function nExpenses(lang, n) {
  if (lang === "fr" || lang === "ar") return nItems(lang, n);
  return n + (n === 1 ? " expense" : " expenses");
}
export function nPaused(lang, n) {
  if (lang === "fr") return n + " en pause";
  if (lang === "ar") {
    if (n === 1) return "\u0648\u0627\u062d\u062f \u0645\u0648\u0642\u0648\u0641";
    if (n === 2) return "\u0627\u062b\u0646\u0627\u0646 \u0645\u0648\u0642\u0648\u0641\u0627\u0646";
    return n + " \u0645\u0648\u0642\u0648\u0641\u0629";
  }
  return n + " paused";
}
function nDays(lang, n) {
  if (lang === "fr") return n + " jours";
  if (lang === "ar") {
    if (n === 2) return "\u064a\u0648\u0645\u0627\u0646";
    if (n <= 10) return n + " \u0623\u064a\u0627\u0645";
    return n + " \u064a\u0648\u0645\u0627\u064b";
  }
  return n + " days";
}
export function dueInDays(lang, n) {
  if (lang === "fr") return "Dans " + n + " jours";
  if (lang === "ar") return "\u0628\u0639\u062f " + nDays(lang, n);
  return "In " + n + " days";
}
export function everyWord(lang, unit) {
  if (lang === "fr") return unit === "weeks" ? "Toutes les" : "Tous les";
  if (lang === "ar") return "\u0643\u0644";
  return "Every";
}
export function unitPlural(lang, n, unit) {
  if (lang === "fr") {
    if (unit === "months") return "mois";
    if (unit === "weeks") return n === 1 ? "semaine" : "semaines";
    return n === 1 ? "jour" : "jours";
  }
  if (lang === "ar") {
    if (n === 1) return unit === "months" ? "\u0634\u0647\u0631" : unit === "weeks" ? "\u0623\u0633\u0628\u0648\u0639" : "\u064a\u0648\u0645";
    return unit === "months" ? "\u0623\u0634\u0647\u0631" : unit === "weeks" ? "\u0623\u0633\u0627\u0628\u064a\u0639" : "\u0623\u064a\u0627\u0645";
  }
  return plural(n, unit === "months" ? "month" : unit === "weeks" ? "week" : "day");
}
export function repeatMain(lang, n, unit) {
  if (lang === "fr") {
    if (n === 1) return unit === "months" ? "Chaque mois" : unit === "weeks" ? "Chaque semaine" : "Chaque jour";
    if (unit === "weeks") return "Toutes les " + n + " semaines";
    return "Tous les " + n + (unit === "months" ? " mois" : " jours");
  }
  if (lang === "ar") {
    const k = "\u0643\u0644 ";
    if (n === 1) return k + (unit === "months" ? "\u0634\u0647\u0631" : unit === "weeks" ? "\u0623\u0633\u0628\u0648\u0639" : "\u064a\u0648\u0645");
    if (n === 2) return k + (unit === "months" ? "\u0634\u0647\u0631\u064a\u0646" : unit === "weeks" ? "\u0623\u0633\u0628\u0648\u0639\u064a\u0646" : "\u064a\u0648\u0645\u064a\u0646");
    if (n <= 10) return k + n + " " + (unit === "months" ? "\u0623\u0634\u0647\u0631" : unit === "weeks" ? "\u0623\u0633\u0627\u0628\u064a\u0639" : "\u0623\u064a\u0627\u0645");
    return k + n + " " + (unit === "months" ? "\u0634\u0647\u0631\u0627\u064b" : unit === "weeks" ? "\u0623\u0633\u0628\u0648\u0639\u0627\u064b" : "\u064a\u0648\u0645\u0627\u064b");
  }
  const w = unit === "months" ? "month" : unit === "weeks" ? "week" : "day";
  return n === 1 ? "Every " + w : "Every " + n + " " + plural(n, w);
}
export function repeatLabel(lang, it) {
  return repeatSet(it) ? repeatMain(lang, it.n, it.unit) : t(lang, "repeatChoose");
}

// The "Next payment" column: what to say, and how loudly.
export function dueInfo(lang, it) {
  if (it.paused) return { due: "\u2014", when: "", tone: "quiet" };
  if (isDaily(it)) return { due: t(lang, "dueToday"), when: "", tone: "today" };
  if (it.flex) {
    const fl = it.unit === "weeks" ? t(lang, "dueSomeWeek") : it.unit === "months" ? t(lang, "dueSomeMonth") : t(lang, "noFixedDate");
    return { due: fl, when: "", tone: "quiet" };
  }
  if (!repeatSet(it)) return { due: t(lang, "setHowOften"), when: "", tone: "quiet" };
  const nd = nextDate(it);
  if (nd === null) return { due: t(lang, "noDateYet"), when: "", tone: "quiet" };
  const dl = Math.round((nd - today()) / DAY);
  if (dl <= 0) return { due: t(lang, "dueToday"), when: fmtWhen(lang, nd), tone: "today" };
  if (dl === 1) return { due: t(lang, "dueTomorrow"), when: fmtWhen(lang, nd), tone: "soon" };
  return { due: dueInDays(lang, dl), when: fmtWhen(lang, nd), tone: "" };
}

// Is the cadence complete enough to save?
export function cadenceReady(d) {
  if (!repeatSet(d)) return false;
  if (isDaily(d)) return true;
  if (d.flex) return d.n === 1;
  return parseISO(d.start) !== null;
}
