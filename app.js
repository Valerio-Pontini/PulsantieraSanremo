/* Pulsantiera Sanremo - Vanilla JS, offline-first
   - localStorage persistence
   - Tabs navigation
   - Rapid reactions + events
   - Deep votes
   - Analytics + simple canvas sparkline
   - Predictions board (inizio/fine puntata + finale timeline)
*/

const STORAGE_BASE_KEY = "pulsantiera_v2";
const THEME_STORAGE_KEY = "pulsantiera_theme";
const FIREBASE_CONFIG = window.FIREBASE_CONFIG || null;
const THEME_CATALOG = [
  { id: "base", label: "Base", href: "" },
  { id: "sunset-pop", label: "Sunset Pop", href: "./themes/theme-sunset-pop.css" },
  { id: "mint-arcade", label: "Mint Arcade", href: "./themes/theme-mint-arcade.css" },
  { id: "noir-gold", label: "Noir Gold", href: "./themes/theme-noir-gold.css" },
  { id: "ocean-glass", label: "Ocean Glass", href: "./themes/theme-ocean-glass.css" },
];

const QUICK_REACTIONS = [
  { id: "caos_totale", emoji: "🧨", label: "FUOCHI D'ARTIFICIO", tempMin: 100, tempMax: 100 },
  { id: "picco_assoluto", emoji: "🔥", label: "PICCANTE", tempMin: 90, tempMax: 90 },
  { id: "clima_epico", emoji: "👑", label: "MOMENTO DA TOP 10", tempMin: 80, tempMax: 80 },
  { id: "livello_alto", emoji: "🚀", label: "STO VOLANDO", tempMin: 70, tempMax: 70 },
  { id: "energia_viva", emoji: "💃", label: "MARACAIBO", tempMin: 60, tempMax: 60 },
  { id: "momento_virale", emoji: "📱", label: "VIRALE", tempMin: 50, tempMax: 50 },
  { id: "tensione_vera", emoji: "👀", label: "ALTA TENSIONE", tempMin: 40, tempMax: 40 },
  { id: "atmosfera_intensa", emoji: "🎻", label: "ATMOSFERA INTENSA", tempMin: 30, tempMax: 30 },
  { id: "momento_denso", emoji: "🎭", label: "INTELLETTUALE", tempMin: 20, tempMax: 20 },
  { id: "adrenalina", emoji: "🎢", label: "ADRENALINA PURA", tempMin: 70, tempMax: 90 },
  { id: "roar", emoji: "🦁", label: "ROAR", tempMin: 50, tempMax: 70 },
  { id: "lacrimuccia", emoji: "🥹", label: "LACRIMUCCIA", tempMin: 30, tempMax: 50 },
  { id: "nostalgia", emoji: "😢", label: "NOSTALGICO", tempMin: 20, tempMax: 40 },
  { id: "fase_neutra", emoji: "🤍", label: "NEUTRO", tempMin: 5, tempMax: 5 },
  { id: "follia", emoji: "🎉", label: "FOLLIA", tempMin: -20, tempMax: 20 },
  { id: "trash", emoji: "🦄", label: "TRASH", tempMin: -10, tempMax: 10 },
  { id: "equilibrio_precario", emoji: "🛸", label: "EQUILIBRIO PRECARIO", tempMin: 0, tempMax: 0 },
  { id: "preistoria", emoji: "🦖", label: "PREISTORIA", tempMin: -5, tempMax: -20 },
  { id: "clima_strano", emoji: "🐍", label: "CLIMA STRANO", tempMin: -15, tempMax: -15 },
  { id: "imbarazzo_latente", emoji: "😬", label: "IMBARAZZO LATENTE", tempMin: -30, tempMax: -30 },
  { id: "cringe", emoji: "💀", label: "CRINGE", tempMin: -20, tempMax: -40 },
  { id: "che_paura", emoji: "😱", label: "CHE PAURA", tempMin: -50, tempMax: -70 },
  { id: "falla_tecnica", emoji: "🎧", label: "PROBLEMA TECNICO", tempMin: -45, tempMax: -45 },
  { id: "ritmo_lento", emoji: "🧱", label: "RITMO LENTO", tempMin: -60, tempMax: -60 },
  { id: "noia", emoji: "🥱", label: "LA NOIA", tempMin: -65, tempMax: -80 },
  { id: "energia_bassa", emoji: "😴", label: "ENERGIA BASSA", tempMin: -75, tempMax: -75 },
  { id: "gelo_totale", emoji: "🧊", label: "GELO TOTALE", tempMin: -90, tempMax: -90 },
  { id: "crollo_live", emoji: "📉", label: "CROLLO LIVE", tempMin: -100, tempMax: -100 }
];

const QUICK_BY_ID = Object.fromEntries(QUICK_REACTIONS.map((x) => [x.id, x]));
const ACTION_LABEL = Object.fromEntries(QUICK_REACTIONS.map((x) => [x.id, x.label]));
const EMOJI = Object.fromEntries(QUICK_REACTIONS.map((x) => [x.id, x.emoji]));
const TEMP_DELTA = Object.fromEntries(
  QUICK_REACTIONS.map((x) => [x.id, Math.round((x.tempMin + x.tempMax) / 2)])
);

const LEGACY_TYPES = {
  gaso: { emoji: "🔥", label: "GASO", temp: 45 },
  iconico: { emoji: "👑", label: "ICONICO", temp: 75 },
  trash: { emoji: "🧀", label: "TRASH", temp: -30 },
  nograzie: { emoji: "💀", label: "NO GRAZIE", temp: -65 },
  sonno: { emoji: "😴", label: "SONNO", temp: -55 },
  outfit: { emoji: "👗", label: "OUTFIT", temp: 30 },
  monologo: { emoji: "🎭", label: "MONOLOGO", temp: 20 },
  imprevisto: { emoji: "🚨", label: "IMPREVISTO", temp: 60 },
  gag: { emoji: "😂", label: "GAG", temp: 40 },
  cringe: { emoji: "🧀", label: "CRINGE", temp: -50 },
  polemica: { emoji: "💬", label: "POLEMICA", temp: 25 },
};

const FLAG_EMOJI = {
  outfitTop: "👗",
  stageTop: "🎤",
  winner: "👑",
  relisten: "🔁",
  radiohit: "📻",
};

const FLAG_ALIASES = {
  outfitTop: ["outfitTop", "outfit", "bestOutfit"],
  stageTop: ["stageTop", "stage", "presence", "presenza"],
  winner: ["winner", "canWin", "vincitore", "puoVincere", "can_winner"],
  relisten: ["relisten", "riascolto"],
  radiohit: ["radiohit", "radioHit", "radio", "hitRadio"],
};

Object.entries(LEGACY_TYPES).forEach(([id, cfg]) => {
  if(!EMOJI[id]) EMOJI[id] = cfg.emoji;
  if(!ACTION_LABEL[id]) ACTION_LABEL[id] = cfg.label;
  if(!(id in TEMP_DELTA)) TEMP_DELTA[id] = cfg.temp;
});

const TEMP_COMMENTS = {
  "-100": "🧊 Era glaciale: gelo assoluto, applausi per educazione.",
  "-95": "❄️ Silenzio cosmico, l’aria pesa.",
  "-90": "🥶 Cringe devastante, temperatura in caduta libera.",
  "-85": "🫣 Imbarazzo collettivo, sguardi nel vuoto.",
  "-80": "💤 Sbadigli coordinati in platea.",
  "-75": "🧱 Ballad-mattone che abbassa la pressione.",
  "-70": "🪑 Energia da sala d’attesa.",
  "-65": "📉 Battuta morta all’impatto.",
  "-60": "😶 Microfono acceso, entusiasmo spento.",
  "-55": "🥴 Momento “forse non doveva succedere”.",
  "-50": "🚪 Fuga snack/bagno in massa.",
  "-45": "🫥 Performance che evapora subito.",
  "-40": "🧊 Freddino educato, applauso cortese.",
  "-35": "😬 Stonatura che gela l’atmosfera.",
  "-30": "🤨 Perplessità diffusa ma controllata.",
  "-25": "🧠 Artistico ma distante emotivamente.",
  "-20": "😐 Clima neutro tendente al piatto.",
  "-15": "🪫 Batteria emotiva quasi scarica.",
  "-10": "🌫️ Nebbia emotiva, nessun picco.",
  "-5": "😶‍🌫️ Attesa sospesa, si prepara il terreno.",
  "0": "⚖️ Equilibrio totale, temperatura stabile.",
  "5": "🙂 Applauso sincero ma contenuto.",
  "10": "👀 Interesse acceso, attenzione viva.",
  "15": "📱 Social in movimento, primi commenti.",
  "20": "🎭 Coinvolgimento leggero ma presente.",
  "25": "🎬 Atmosfera elegante, vibe cinematografica.",
  "30": "💬 Entusiasmo moderato, si discute con energia.",
  "35": "🥲 Nostalgia che scalda il cuore.",
  "40": "🎶 Cori timidi che nascono spontanei.",
  "45": "🌈 Buona vibrazione generale, sorrisi diffusi.",
  "50": "🎻 Brividi veri, pelle d’oca condivisa.",
  "55": "💔 Testo che colpisce e resta.",
  "60": "👀 Tensione palpabile, occhi incollati.",
  "65": "🕺 Bop certificato, si balla ovunque.",
  "70": "🎤 Nota potente che vibra nell’aria.",
  "75": "💅 Dominio scenico totale, carisma esplosivo.",
  "80": "👑 Aura da vincitore, energia magnetica.",
  "85": "🤯 Colpo di scena che ribalta tutto.",
  "90": "🔥 Momento iconico, urla e standing ovation.",
  "95": "🚀 Crescendo epico, adrenalina collettiva.",
  "100": "🌋 Eruzione emotiva totale, l’Ariston trema.",
};

const now = () => Date.now();
const fmtTime = (t) => new Date(t).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
const fmtDateTime = (t) => new Date(t).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function uid(){ return Math.random().toString(16).slice(2) + "-" + Math.random().toString(16).slice(2); }
function slug(s){ return String(s || "").toLowerCase().replace(/[^a-z0-9_-]/g, "_"); }
function arr(v){ return Array.isArray(v) ? v : []; }
function num(v, fallback=0){ return Number.isFinite(Number(v)) ? Number(v) : fallback; }
function toFlagBool(v){
  if(v === true || v === 1) return true;
  if(typeof v === "string"){
    const normalized = v.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
  }
  return false;
}
function isTruthyFlagValue(v){
  if(toFlagBool(v)) return true;
  if(v && typeof v === "object"){
    return toFlagBool(v.active) || toFlagBool(v.checked) || toFlagBool(v.selected) || toFlagBool(v.value) || toFlagBool(v.on);
  }
  return false;
}
function normFlagToken(v){
  return String(v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}
function tokensFromRawFlags(rawFlags){
  if(Array.isArray(rawFlags)){
    return rawFlags.map(normFlagToken).filter(Boolean);
  }
  if(typeof rawFlags === "string"){
    const text = rawFlags.trim();
    if(!text) return [];
    if((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))){
      try{
        return tokensFromRawFlags(JSON.parse(text));
      } catch {}
    }
    return text
      .split(/[,\|;\/\s]+/g)
      .map((x) => x.replace(/["'\[\]\{\}]/g, ""))
      .map(normFlagToken)
      .filter(Boolean);
  }
  return [];
}
function normalizeVoteFlags(rawFlags){
  const src = rawFlags && typeof rawFlags === "object" ? rawFlags : {};
  const normSrc = {};
  if(src && typeof src === "object"){
    for(const [k, v] of Object.entries(src)){
      normSrc[normFlagToken(k)] = v;
    }
  }
  const list = tokensFromRawFlags(rawFlags);
  const hasFromList = (alias) => list.includes(normFlagToken(alias));
  const out = {};
  for(const [key, aliases] of Object.entries(FLAG_ALIASES)){
    out[key] = aliases.some((alias) => (
      isTruthyFlagValue(src[alias]) ||
      isTruthyFlagValue(normSrc[normFlagToken(alias)]) ||
      hasFromList(alias)
    ));
  }
  return out;
}
function emptyPredictionBlock(){
  return { podium: ["", "", ""], last: "", free: ["", "", ""], savedAt: 0 };
}
function normalizePredictionBlock(raw){
  const base = emptyPredictionBlock();
  const input = raw && typeof raw === "object" ? raw : {};
  const podium = arr(input.podium).map((x) => String(x || "").trim()).slice(0, 3);
  const free = arr(input.free).map((x) => String(x || "").trim()).slice(0, 3);
  while(podium.length < 3) podium.push("");
  while(free.length < 3) free.push("");
  return {
    podium,
    last: String(input.last || "").trim(),
    free,
    savedAt: num(input.savedAt, 0),
  };
}
function normalizePredictionSnapshot(raw){
  const input = raw && typeof raw === "object" ? raw : null;
  if(!input) return null;
  return {
    id: String(input.id || uid()),
    createdAt: num(input.createdAt, now()),
    ...normalizePredictionBlock(input),
  };
}

function parseRecapWindowMinuteFromTime(time){
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(String(time || "").trim());
  if(!m) return -1;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if(!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return -1;
  let total = hh * 60 + mm;
  if(total < RECAP_CHART_START_MIN) total += 24 * 60;
  if(total < RECAP_CHART_START_MIN || total > RECAP_CHART_END_MIN) return -1;
  return total - RECAP_CHART_START_MIN;
}

function recapWindowMinuteFromTimestamp(ts){
  const d = new Date(num(ts, 0));
  let total = (d.getHours() * 60) + d.getMinutes();
  if(total < RECAP_CHART_START_MIN) total += 24 * 60;
  if(total < RECAP_CHART_START_MIN || total > RECAP_CHART_END_MIN) return -1;
  return total - RECAP_CHART_START_MIN;
}

function recapTimeLabelFromMinute(minuteFromStart){
  const absolute = RECAP_CHART_START_MIN + Math.max(0, Number(minuteFromStart) || 0);
  const minutesDay = absolute % (24 * 60);
  const hh = String(Math.floor(minutesDay / 60)).padStart(2, "0");
  const mm = String(minutesDay % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function normalizeRecapEvents(raw){
  return arr(raw)
    .map((x) => ({
      id: String(x?.id || uid()),
      time: String(x?.time || "").trim(),
      label: String(x?.label || "").trim().slice(0, 80),
    }))
    .map((x) => ({ ...x, minute: parseRecapWindowMinuteFromTime(x.time) }))
    .filter((x) => x.minute >= 0 && x.label)
    .sort((a, b) => a.minute - b.minute || a.label.localeCompare(b.label, "it"))
    .map(({ id, time, label, minute }) => ({ id, time, label, minute }));
}

function recapEventsFileCandidates(serata){
  return [
    `./assets/recap_events_serata${serata}.json`,
    `./recap_events_serata${serata}.json`,
    "./assets/recap_events.json",
    "./recap_events.json",
  ];
}

async function loadRecapEventsForSerata(serata){
  recapStaticEvents = [];
  recapSelectionIndex = -1;
  recapEventsLoadMeta = { source: "", raw: 0, valid: 0 };
  for(const path of recapEventsFileCandidates(serata)){
    try{
      const res = await fetch(path, { cache: "no-store" });
      if(!res.ok) continue;
      const payload = await res.json();
      const source = Array.isArray(payload) ? payload : (Array.isArray(payload?.events) ? payload.events : []);
      recapEventsLoadMeta.raw = source.length;
      recapStaticEvents = normalizeRecapEvents(source);
      recapEventsLoadMeta.valid = recapStaticEvents.length;
      recapEventsLoadMeta.source = path;
      return;
    } catch {}
  }
}

function withTimeout(promise, ms, label){
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const cloud = {
  ready: false,
  auth: null,
  db: null,
  uid: "",
  authError: "",
  username: "",
  serata: "",
  syncTimer: null,
  syncBusy: false,
  pending: false,
  lastSignature: "",
  lastSyncAt: 0,
  lastSyncError: "",
  syncCount: 0,
  syncPromise: null,
};

let state = defaultState();
let tickStarted = false;

function currentScopeKey(){
  if(!cloud.username || !cloud.serata) return "guest";
  return `${slug(cloud.username)}_s${cloud.serata}`;
}

function storageKey(){
  return `${STORAGE_BASE_KEY}_${currentScopeKey()}`;
}

function loadState(){
  try{
    const raw = localStorage.getItem(storageKey());
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch {
    return defaultState();
  }
}

function saveState(opts = {}){
  const { syncCloud = true } = opts;
  saveStateLocal();
  if(syncCloud) queueCloudSync();
}

function saveStateLocal(){
  try{
    localStorage.setItem(storageKey(), JSON.stringify(state));
  } catch (err){
    // Avoid app crashes on storage quota/privacy restrictions.
    console.warn("Impossibile salvare lo stato su localStorage:", err);
  }
}

function cloudStateSnapshot(){
  return cloudStateSnapshotFor(state);
}

function cloudStateSnapshotFor(sourceState){
  // Exclude high-churn telemetry to reduce payload size and write frequency.
  const safe = normalizeState(sourceState);
  const { energyHistory, ...rest } = safe;
  return rest;
}

function cloudSignature(snapshot){
  return JSON.stringify(snapshot);
}

function stateFreshnessTs(sourceState){
  const s = normalizeState(sourceState);
  // IMPORTANT:
  // Do not use session.startedAt as freshness source.
  // In new/empty sessions (e.g. incognito) it is "now" and can wrongly
  // override older but real cloud data.
  let latest = 0;
  for(const a of arr(s.actions)) latest = Math.max(latest, num(a?.t, 0));
  for(const v of arr(s.deepVotes)) latest = Math.max(latest, num(v?.t, 0));
  latest = Math.max(latest, num(s.challenge?.preShow?.savedAt, 0));
  latest = Math.max(latest, num(s.challenge?.preRanking?.savedAt, 0));
  for(const snap of arr(s.challenge?.finaleHistory)){
    latest = Math.max(latest, num(snap?.createdAt, 0), num(snap?.savedAt, 0));
  }
  return latest;
}

function stateHasMeaningfulData(sourceState){
  const s = normalizeState(sourceState);
  const hasActions = arr(s.actions).length > 0;
  const hasDeepVotes = arr(s.deepVotes).length > 0;
  const hasPredictions =
    num(s.challenge?.preShow?.savedAt, 0) > 0 ||
    num(s.challenge?.preRanking?.savedAt, 0) > 0 ||
    arr(s.challenge?.finaleHistory).length > 0;
  return hasActions || hasDeepVotes || hasPredictions;
}

function defaultState(){
  return {
    xp: 0,
    lastActions: [], // for Undo
    actions: [],     // {id, kind: 'react'|'event', type, xp, t}
    deepVotes: [],   // {id, target, note, song, flags, t}
    togglesDraft: { outfitTop:false, stageTop:false, winner:false, relisten:false, radiohit:false },
    boost: { active:false, endsAt:0, lastStartAt:0 },
    session: { startedAt: now() },
    energyHistory: [], // {t, value} sampled
    challenge: {
      preShow: emptyPredictionBlock(),
      preRanking: emptyPredictionBlock(),
      locks: { preShow: false, preRanking: false },
      finaleHistory: [] // [{id, createdAt, podium[3], last, free[3], savedAt}]
    }
  };
}

function normalizeState(raw){
  const base = defaultState();
  const input = raw && typeof raw === "object" ? raw : {};
  const preShow = normalizePredictionBlock(input.challenge?.preShow);
  const preRanking = normalizePredictionBlock(input.challenge?.preRanking);
  const rawLocks = input.challenge?.locks || {};
  return {
    ...base,
    ...input,
    xp: num(input.xp, base.xp),
    lastActions: arr(input.lastActions),
    actions: arr(input.actions),
    deepVotes: arr(input.deepVotes),
    togglesDraft: { ...base.togglesDraft, ...(input.togglesDraft || {}) },
    boost: { ...base.boost, ...(input.boost || {}) },
    session: { ...base.session, ...(input.session || {}) },
    energyHistory: arr(input.energyHistory),
    challenge: {
      ...base.challenge,
      ...(input.challenge || {}),
      preShow,
      preRanking,
      locks: {
        preShow: !!(rawLocks.preShow ?? preShow.savedAt),
        preRanking: !!(rawLocks.preRanking ?? preRanking.savedAt),
      },
      finaleHistory: arr(input.challenge?.finaleHistory)
        .map(normalizePredictionSnapshot)
        .filter(Boolean)
        .slice(0, 120),
    },
  };
}

/* ---------- DOM ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const pick = (...selectors) => {
  for(const s of selectors){
    const el = $(s);
    if(el) return el;
  }
  return null;
};

const userInfo = $("#userInfo");
const serataNavValue = $("#serataNavValue");
const btnPrevSerata = $("#btnPrevSerata");
const btnNextSerata = $("#btnNextSerata");
const themeSelect = $("#themeSelect");
const btnSwitchUser = pick("#btnSwitchUser", "#btnLogout", "#btnEsci", "#btnExit", "#btnSalta");
const quickGrid = pick("#quickGrid", ".quick-grid");
const floatingQuickPad = $("#floatingQuickPad");
const floatingQuickBubble = $("#floatingQuickBubble");
const floatingQuickShortcuts = $("#floatingQuickShortcuts");

const xpValue = $("#xpValue");
const energyFill = $("#energyFill");
const energyGlow = $("#energyGlow");
const tempComment = $("#tempComment");
const timelineEl = $("#timeline");
const toastEl = $("#toast");
const tutorialOverlay = $("#tutorialOverlay");
const tutorialStepCount = $("#tutorialStepCount");
const tutorialTitle = $("#tutorialTitle");
const tutorialBody = $("#tutorialBody");
const tutorialSkip = $("#tutorialSkip");
const tutorialBack = $("#tutorialBack");
const tutorialNext = $("#tutorialNext");
const tutorialDone = $("#tutorialDone");

const boostDot = $("#boostDot");
const boostText = $("#boostText");
const pillBoost = $("#pillBoost");

const btnUndo = $("#btnUndo");
const btnResetAll = $("#btnResetAll");
const btnNewSession = $("#btnNewSession");
const quickNoteInput = $("#quickNoteInput");

const artistSelect = $("#artistSelect");
const artistLoadStatus = $("#artistLoadStatus");
const noteInput = $("#noteInput");
const performanceSlider = $("#performanceSlider");
const performanceVal = $("#performanceVal");
const outfitSlider = $("#outfitSlider");
const outfitVal = $("#outfitVal");
const songSlider = $("#songSlider");
const songVal = $("#songVal");
const relistenSlider = $("#relistenSlider");
const relistenVal = $("#relistenVal");
const btnSaveDeep = $("#btnSaveDeep");
const btnQuickAddFromDeep = $("#btnQuickAddFromDeep");
const deepList = $("#deepList");

const avgSong = $("#avgSong");
const kpiTermometro = $("#kpiTermometro");
const kpiRollercoaster = $("#kpiRollercoaster");
const kpiFuochi = $("#kpiFuochi");
const kpiGhiaccio = $("#kpiGhiaccio");
const kpiEquilibrio = $("#kpiEquilibrio");
const btnChartKpi = $("#btnChartKpi");
const btnChartArtists = $("#btnChartArtists");
const chartPeriodSelect = $("#chartPeriodSelect");
const globalChartPeriodSelect = $("#globalChartPeriodSelect");
const chartLegend = $("#chartLegend");
const chart = $("#chart");
const chartPointInfo = $("#chartPointInfo");
const singerRankings = $("#singerRankings");
const quickEmojiRankings = $("#quickEmojiRankings");
const statsDiaryList = $("#statsDiaryList");
const statsDiaryMeta = $("#statsDiaryMeta");
const btnToggleSingerRankings = $("#btnToggleSingerRankings");
const btnExport = $("#btnExport");
const globalStatus = $("#globalStatus");
const gAvgSong = $("#gAvgSong");
const gKpiTermometro = $("#gKpiTermometro");
const gKpiRollercoaster = $("#gKpiRollercoaster");
const gKpiFuochi = $("#gKpiFuochi");
const gKpiGhiaccio = $("#gKpiGhiaccio");
const gKpiEquilibrio = $("#gKpiEquilibrio");
const globalChartLegend = $("#globalChartLegend");
const globalChart = $("#globalChart");
const globalChartInfo = $("#globalChartInfo");
const btnToggleGlobalArtistRankings = $("#btnToggleGlobalArtistRankings");
const btnExpandGlobalRecentActivities = $("#btnExpandGlobalRecentActivities");
const btnCollapseGlobalRecentActivities = $("#btnCollapseGlobalRecentActivities");
const globalRecentActivities = $("#globalRecentActivities");
const globalArtistRankings = $("#globalArtistRankings");
const globalPredictionSummary = $("#globalPredictionSummary");
const globalPredictionRankings = $("#globalPredictionRankings");
const globalQuickEmojiRankings = $("#globalQuickEmojiRankings");
const btnGlobalRefresh = $("#btnGlobalRefresh");
const globalDebug = $("#globalDebug");

const btnSavePreShow = $("#btnSavePreShow");
const btnSavePreRanking = $("#btnSavePreRanking");
const btnAddFinaleSnapshot = $("#btnAddFinaleSnapshot");
const finaleHistoryList = $("#finaleHistoryList");
const preShowSavedAt = $("#preShowSavedAt");
const preRankingSavedAt = $("#preRankingSavedAt");
const quickControlMsg = $("#quickControlMsg");
const quickDisabledBanner = $("#quickDisabledBanner");
const deepControlMsg = $("#deepControlMsg");
const predControlMsg = $("#predControlMsg");
const recapControlMsg = $("#recapControlMsg");
const recapFilterSelect = $("#recapFilterSelect");
const recapIntervalSelect = $("#recapIntervalSelect");
const recapLegend = $("#recapLegend");
const recapChart = $("#recapChart");
const recapInfo = $("#recapInfo");
const recapGlobalStatus = $("#recapGlobalStatus");
const btnToggleRecapEventLines = $("#btnToggleRecapEventLines");
const recapSelectionMeta = $("#recapSelectionMeta");
const recapSelectionDetails = $("#recapSelectionDetails");
const PREDICTION_SELECT_IDS = [
  "predPreShowPodium1","predPreShowPodium2","predPreShowPodium3","predPreShowLast",
  "predPreRankingPodium1","predPreRankingPodium2","predPreRankingPodium3","predPreRankingLast",
  "predFinalePodium1","predFinalePodium2","predFinalePodium3","predFinaleLast",
];

let statsChartMode = "kpi";
let statsPeriodMin = "all";
let globalStatsPeriodMin = "all";
let chartSelectionIndex = -1;
let chartInteractiveState = { mode: "kpi", points: [], seriesMeta: [] };
let recapSelectionIndex = -1;
let recapInteractiveState = { points: [] };
let recapEventLinesVisible = true;
let singerRankingsExpanded = false;
let globalArtistRankingsExpanded = false;
let globalRecentActivitiesExpanded = false;
let floatingQuickPadOpen = false;
let floatingQuickScrollTimer = null;
const CLOUD_SYNC_DEBOUNCE_MS = 1200;
const ADMIN_CONTROLS_KEY_PREFIX = "pulsantiera_controls_s";
const SERATA_ACCESS_KEY = "pulsantiera_serata_access";
const ADMIN_CONTROLS_COLLECTION = "admin_controls";
const ADMIN_SERATA_ACCESS_DOC = "serata_access";
const LOGIN_NOTICE_KEY = "pulsantiera_login_notice";
const TUTORIAL_SEEN_PREFIX = "pulsantiera_tutorial_seen";
const TUTORIAL_VERSION = "v1";
const PREDICTION_FIELD_IDS = [
  "predPreShowPodium1","predPreShowPodium2","predPreShowPodium3","predPreShowLast",
  "predPreShowFree1","predPreShowFree2","predPreShowFree3",
  "predPreRankingPodium1","predPreRankingPodium2","predPreRankingPodium3","predPreRankingLast",
  "predPreRankingFree1","predPreRankingFree2","predPreRankingFree3",
  "predFinalePodium1","predFinalePodium2","predFinalePodium3","predFinaleLast",
  "predFinaleFree1","predFinaleFree2","predFinaleFree3",
];
const DEFAULT_FEATURE_CONTROLS = {
  quickEnabled: true,
  deepEnabled: true,
  predictionsEnabled: true,
  recapEnabled: true,
  deepArtists: {},
  predictionFields: {},
  updatedAtMs: 0,
  updatedByUsername: "",
};
const RECAP_CHART_START_MIN = 20 * 60 + 45;
const RECAP_CHART_END_MIN = (24 * 60) + (2 * 60 + 45);
const RECAP_CHART_TOTAL_MIN = RECAP_CHART_END_MIN - RECAP_CHART_START_MIN;
const RECAP_CHART_BUCKET_MIN_DEFAULT = 5;
const RECAP_INTERVAL_OPTIONS = [2, 5, 10, 15, 30];
const RECAP_GROUPS = [
  { id: "hot", label: "Gruppo caldo (positive)", matcher: (type) => (TEMP_DELTA[type] ?? 0) >= 30 },
  { id: "neutral", label: "Gruppo neutro", matcher: (type) => {
    const t = TEMP_DELTA[type] ?? 0;
    return t > -30 && t < 30;
  }},
  { id: "cold", label: "Gruppo freddo (negative)", matcher: (type) => (TEMP_DELTA[type] ?? 0) <= -30 },
];
let globalAnalytics = {
  loading: false,
  fetchedAt: 0,
  serata: "",
  users: 0,
  error: "",
  kpi: null,
  points: [],
  artistRankings: null,
  predictionStats: null,
  quickEmojiStats: null,
  snapshots: [],
  debug: {
    serata: "",
    queryStringDocs: 0,
    queryNumberDocs: 0,
    dedupDocs: 0,
    fallbackUsed: false,
    fallbackDocs: 0,
    snapshotsUsed: 0,
    tagDebug: null,
    errorCode: "",
    errorMessage: "",
  },
};
const runtimeDebug = {
  events: [],
  lastError: "",
};
let featureControls = { ...DEFAULT_FEATURE_CONTROLS };
let currentArtistNames = [];
const tutorialState = {
  open: false,
  key: "",
  index: 0,
  steps: [],
};
let chartResizeTimer = null;
let recapFilterValue = "all";
let recapIntervalMin = RECAP_CHART_BUCKET_MIN_DEFAULT;
let recapStaticEvents = [];
let recapEventsLoadMeta = { source: "", raw: 0, valid: 0 };
let staticAnalyticsState = null;
const COLLAPSIBLE_TAB_IDS = ["tab-stats", "tab-global"];
const COLLAPSIBLE_CARDS_STATE_KEY = "pulsantiera_collapsible_cards_v1";

function pushRuntimeDebug(msg){
  const line = `${fmtTime(now())} · ${msg}`;
  runtimeDebug.events.push(line);
  if(runtimeDebug.events.length > 20) runtimeDebug.events.shift();
  console.log("[runtime]", msg);
}

function getResponsiveChartHeight(){
  const vw = window.innerWidth || 1024;
  if(vw <= 420) return 280;
  if(vw <= 760) return 250;
  return 220;
}

function syncCanvasSize(canvasEl){
  if(!canvasEl) return false;
  const parentW = canvasEl.parentElement?.clientWidth || canvasEl.clientWidth || 900;
  const width = Math.max(280, Math.floor(parentW));
  const height = getResponsiveChartHeight();
  if(canvasEl.width === width && canvasEl.height === height) return false;
  canvasEl.width = width;
  canvasEl.height = height;
  return true;
}

function redrawChartsForViewport(){
  const changedStats = syncCanvasSize(chart);
  const changedGlobal = syncCanvasSize(globalChart);
  const statsPanel = $("#tab-stats");
  const globalPanel = $("#tab-global");
  const recapPanel = $("#tab-recap");
  if(changedStats && statsPanel?.classList.contains("active")) drawChart();
  if(changedGlobal && globalPanel?.classList.contains("active")) drawGlobalChart();
  if(recapPanel?.classList.contains("active")) drawRecapChart();
}

function scheduleChartResize(){
  clearTimeout(chartResizeTimer);
  chartResizeTimer = setTimeout(() => {
    redrawChartsForViewport();
  }, 120);
}

window.addEventListener("error", (ev) => {
  const message = String(ev?.message || "Errore JS");
  const where = `${ev?.filename || "app.js"}:${ev?.lineno || 0}:${ev?.colno || 0}`;
  runtimeDebug.lastError = `${message} @ ${where}`;
  pushRuntimeDebug(`ERROR ${runtimeDebug.lastError}`);
  if(globalDebug){
    globalDebug.textContent = `Runtime error: ${runtimeDebug.lastError}\n\n${runtimeDebug.events.join("\n")}`;
  }
});

window.addEventListener("unhandledrejection", (ev) => {
  const reason = String(ev?.reason?.message || ev?.reason || "Promise rejection");
  runtimeDebug.lastError = reason;
  pushRuntimeDebug(`REJECTION ${reason}`);
  if(globalDebug){
    globalDebug.textContent = `Runtime rejection: ${reason}\n\n${runtimeDebug.events.join("\n")}`;
  }
});

window.addEventListener("resize", scheduleChartResize);
window.addEventListener("orientationchange", () => {
  setTimeout(() => redrawChartsForViewport(), 180);
});
window.addEventListener("scroll", () => {
  if(!floatingQuickPad || floatingQuickPad.hidden) return;
  floatingQuickPad.classList.add("is-scrolling");
  clearTimeout(floatingQuickScrollTimer);
  floatingQuickScrollTimer = setTimeout(() => {
    floatingQuickPad.classList.remove("is-scrolling");
  }, 140);
}, { passive: true });

function controlsStorageKey(serata = cloud.serata){
  return `${ADMIN_CONTROLS_KEY_PREFIX}${String(serata || "0")}`;
}

function defaultSerataAccess(){
  return { "1": true, "2": true, "3": true, "4": true, "5": true };
}

function loadSerataAccess(){
  try{
    const raw = localStorage.getItem(SERATA_ACCESS_KEY);
    if(!raw) return defaultSerataAccess();
    const parsed = JSON.parse(raw);
    const base = defaultSerataAccess();
    for(const k of Object.keys(base)){
      base[k] = parsed?.[k] !== false;
    }
    return base;
  } catch {
    return defaultSerataAccess();
  }
}

function isSerataEnabled(serata){
  const access = loadSerataAccess();
  return access[String(serata || "")] !== false;
}

function loadFeatureControls(serata = cloud.serata){
  try{
    const raw = localStorage.getItem(controlsStorageKey(serata));
    if(!raw) return { ...DEFAULT_FEATURE_CONTROLS };
    const parsed = JSON.parse(raw);
    const parsedDeepArtists = parsed?.deepArtists && typeof parsed.deepArtists === "object" ? parsed.deepArtists : {};
    const parsedPredictionFields = parsed?.predictionFields && typeof parsed.predictionFields === "object" ? parsed.predictionFields : {};
    return {
      ...DEFAULT_FEATURE_CONTROLS,
      quickEnabled: parsed?.quickEnabled !== false,
      deepEnabled: parsed?.deepEnabled !== false,
      predictionsEnabled: parsed?.predictionsEnabled !== false,
      recapEnabled: parsed?.recapEnabled !== false,
      deepArtists: { ...parsedDeepArtists },
      predictionFields: { ...parsedPredictionFields },
      updatedAtMs: num(parsed?.updatedAtMs, 0),
      updatedByUsername: String(parsed?.updatedByUsername || ""),
    };
  } catch {
    return { ...DEFAULT_FEATURE_CONTROLS };
  }
}

function artistControlKey(name){
  return targetKey(name);
}

function isArtistVotingEnabled(name){
  const key = artistControlKey(name);
  if(!key) return true;
  return featureControls.deepArtists?.[key] !== false;
}

function isPredictionFieldEnabled(fieldId){
  return featureControls.predictionFields?.[fieldId] !== false;
}

function applyFeatureControlsUI(){
  const quickOn = featureControls.quickEnabled !== false;
  const deepOn = featureControls.deepEnabled !== false;
  const predOn = featureControls.predictionsEnabled !== false;
  const recapOn = featureControls.recapEnabled !== false;
  const suffix = featureControls.updatedByUsername ? ` (admin: ${featureControls.updatedByUsername})` : "";

  if(quickControlMsg) quickControlMsg.textContent = quickOn ? "" : `Votazioni rapide disabilitate`;
  if(quickDisabledBanner) quickDisabledBanner.hidden = quickOn;
  if(deepControlMsg) deepControlMsg.textContent = deepOn ? "" : `Votazioni cantante disabilitate`;
  if(predControlMsg) predControlMsg.textContent = predOn ? "" : `Predizioni disabilitate`;
  if(recapControlMsg) recapControlMsg.textContent = recapOn ? "" : `Resoconto disabilitato`;

  if(quickGrid){
    quickGrid.classList.toggle("section-disabled", !quickOn);
    quickGrid.querySelectorAll("[data-action]").forEach((btn) => {
      btn.disabled = !quickOn;
    });
  }
  if(quickNoteInput) quickNoteInput.disabled = !quickOn;

  const deepInputs = [
    artistSelect, noteInput, performanceSlider, outfitSlider, songSlider, relistenSlider, btnSaveDeep, btnQuickAddFromDeep
  ];
  for(const el of deepInputs){
    if(el) el.disabled = !deepOn;
  }
  $$(".toggle").forEach((t) => { t.disabled = !deepOn; });
  if(artistSelect){
    const selected = String(artistSelect.value || "").trim();
    const selectedAllowed = isArtistVotingEnabled(selected);
    [...artistSelect.options].forEach((opt) => {
      const val = String(opt.value || "").trim();
      if(!val){
        opt.disabled = false;
        return;
      }
      opt.disabled = !isArtistVotingEnabled(val);
    });
    if(selected && !selectedAllowed){
      artistSelect.value = "";
    }
  }

  const anyPredFieldEnabled = PREDICTION_FIELD_IDS.some((id) => isPredictionFieldEnabled(id));
  for(const id of PREDICTION_FIELD_IDS){
    const el = $(`#${id}`);
    if(!el) continue;
    el.disabled = !predOn || !isPredictionFieldEnabled(id);
  }
  if(btnSavePreShow && !state.challenge?.locks?.preShow) btnSavePreShow.disabled = !predOn || !anyPredFieldEnabled;
  if(btnSavePreRanking && !state.challenge?.locks?.preRanking) btnSavePreRanking.disabled = !predOn || !anyPredFieldEnabled;
  if(btnAddFinaleSnapshot) btnAddFinaleSnapshot.disabled = !predOn || !anyPredFieldEnabled;

  if(deepOn && artistSelect){
    const selected = String(artistSelect.value || "").trim();
    if(selected && !isArtistVotingEnabled(selected)){
      if(deepControlMsg){
        deepControlMsg.textContent = `Il cantante selezionato è disabilitato${suffix}`;
      }
    } else if(deepControlMsg && deepControlMsg.textContent.includes("selezionato è disabilitato")){
      deepControlMsg.textContent = "";
    }
  }

  const recapTabBtn = document.querySelector('.tab[data-tab="recap"]');
  const recapPanel = $("#tab-recap");
  if(recapTabBtn){
    recapTabBtn.hidden = !recapOn;
    recapTabBtn.disabled = !recapOn;
    recapTabBtn.setAttribute("aria-hidden", recapOn ? "false" : "true");
  }
  if(recapPanel){
    recapPanel.hidden = !recapOn;
  }
  if(!recapOn && recapPanel?.classList.contains("active")){
    setTab("quick");
  }
  updateFloatingQuickPadVisibility();
}

function refreshFeatureControlsFromStorage(){
  featureControls = loadFeatureControls(cloud.serata);
  if(featureControls.quickEnabled !== false){
    staticAnalyticsState = null;
  }
  applyFeatureControlsUI();
  if($("#tab-recap")?.classList.contains("active")) renderRecapTab();
}

function isStaticClosedMode(){
  return featureControls.quickEnabled === false;
}

function loadCollapsibleCardsState(){
  try{
    const raw = localStorage.getItem(COLLAPSIBLE_CARDS_STATE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCollapsibleCardsState(next){
  try{
    localStorage.setItem(COLLAPSIBLE_CARDS_STATE_KEY, JSON.stringify(next || {}));
  } catch {}
}

function setCardCollapsed(card, btn, body, collapsed){
  const isCollapsed = !!collapsed;
  card.classList.toggle("is-collapsed", isCollapsed);
  btn.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
  btn.textContent = isCollapsed ? "Espandi" : "Comprimi";
  body.hidden = isCollapsed;
}

function initCollapsibleCards(){
  const stateMap = loadCollapsibleCardsState();
  for(const panelId of COLLAPSIBLE_TAB_IDS){
    const panel = document.getElementById(panelId);
    if(!panel) continue;
    const cards = [...panel.querySelectorAll(":scope > .card")];
    cards.forEach((card, idx) => {
      if(card.dataset.collapsibleReady === "1") return;
      const head = card.querySelector(":scope > .card-head");
      if(!head) return;
      const cardId = card.id || `${panelId}-card-${idx + 1}`;
      const bodyId = `${cardId}-body`;
      const body = document.createElement("div");
      body.className = "card-collapsible-body";
      body.id = bodyId;
      while(head.nextSibling){
        body.appendChild(head.nextSibling);
      }
      card.appendChild(body);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "switch-btn card-collapse-toggle";
      btn.setAttribute("aria-controls", bodyId);
      head.appendChild(btn);
      card.classList.add("collapsible-card");
      const collapsed = stateMap?.[cardId] === true;
      setCardCollapsed(card, btn, body, collapsed);
      btn.addEventListener("click", () => {
        const nextCollapsed = !card.classList.contains("is-collapsed");
        setCardCollapsed(card, btn, body, nextCollapsed);
        const nextMap = loadCollapsibleCardsState();
        nextMap[cardId] = nextCollapsed;
        saveCollapsibleCardsState(nextMap);
      });
      card.dataset.collapsibleReady = "1";
    });
  }
}

function getAnalyticsSourceState(){
  if(!isStaticClosedMode()){
    staticAnalyticsState = null;
    return state;
  }
  if(!staticAnalyticsState){
    staticAnalyticsState = normalizeState(state);
  }
  return staticAnalyticsState;
}

function adminControlsDocRef(serata = cloud.serata){
  if(!cloud.ready || !cloud.db) return null;
  return cloud.db.collection(ADMIN_CONTROLS_COLLECTION).doc(`s${String(serata || "0")}`);
}

function adminSerataAccessDocRef(){
  if(!cloud.ready || !cloud.db) return null;
  return cloud.db.collection(ADMIN_CONTROLS_COLLECTION).doc(ADMIN_SERATA_ACCESS_DOC);
}

async function syncAdminConfigFromCloud(serata = cloud.serata){
  if(!cloud.ready || !cloud.db || !serata) return;
  try{
    const [controlsSnap, accessSnap] = await Promise.all([
      adminControlsDocRef(serata)?.get(),
      adminSerataAccessDocRef()?.get(),
    ]);

    if(controlsSnap?.exists){
      const c = controlsSnap.data() || {};
      const payload = {
        ...DEFAULT_FEATURE_CONTROLS,
        quickEnabled: c?.quickEnabled !== false,
        deepEnabled: c?.deepEnabled !== false,
        predictionsEnabled: c?.predictionsEnabled !== false,
        recapEnabled: c?.recapEnabled !== false,
        deepArtists: c?.deepArtists && typeof c.deepArtists === "object" ? c.deepArtists : {},
        predictionFields: c?.predictionFields && typeof c.predictionFields === "object" ? c.predictionFields : {},
        updatedAtMs: num(c?.updatedAtMs, 0),
        updatedByUsername: String(c?.updatedByUsername || ""),
      };
      try{
        localStorage.setItem(controlsStorageKey(serata), JSON.stringify(payload));
      } catch {}
    }

    if(accessSnap?.exists){
      const src = accessSnap.data()?.access || {};
      const base = defaultSerataAccess();
      for(const k of Object.keys(base)){
        base[k] = src?.[k] !== false;
      }
      try{
        localStorage.setItem(SERATA_ACCESS_KEY, JSON.stringify(base));
      } catch {}
    }
  } catch (err){
    console.warn("Sync admin config cloud fallita:", err);
  }
  refreshFeatureControlsFromStorage();
}

window.addEventListener("storage", (ev) => {
  if(!cloud.serata) return;
  if(ev.key === controlsStorageKey(cloud.serata)){
    refreshFeatureControlsFromStorage();
    return;
  }
  if(ev.key === SERATA_ACCESS_KEY && !isSerataEnabled(cloud.serata)){
    try{
      localStorage.removeItem("pulsantiera_session");
      localStorage.setItem(LOGIN_NOTICE_KEY, `La serata ${cloud.serata} è stata disabilitata dall'admin.`);
    } catch {}
    goToLogin();
  }
});

function resolveTempDelta(type){
  const cfg = QUICK_BY_ID[type];
  if(!cfg) return TEMP_DELTA[type] ?? 0;
  if(cfg.tempMin === cfg.tempMax) return cfg.tempMin;
  return Math.round(cfg.tempMin + Math.random() * (cfg.tempMax - cfg.tempMin));
}

function getActionTempDelta(action){
  if(action && Number.isFinite(Number(action.tempDelta))) return Number(action.tempDelta);
  return TEMP_DELTA[action?.type] ?? 0;
}

function quickReactionXp(item){
  return Math.max(6, Math.round((Math.abs((item.tempMin + item.tempMax) / 2) / 10) + 4));
}

function setFloatingQuickPadOpen(open){
  const next = !!open;
  floatingQuickPadOpen = next;
  if(floatingQuickBubble){
    floatingQuickBubble.setAttribute("aria-expanded", next ? "true" : "false");
    floatingQuickBubble.textContent = next ? "✕" : "⚡";
  }
  if(floatingQuickShortcuts){
    floatingQuickShortcuts.hidden = !next;
  }
}

function updateFloatingQuickPadVisibility(){
  if(!floatingQuickPad) return;
  const quickOn = featureControls.quickEnabled !== false;
  const quickTabActive = $("#tab-quick")?.classList.contains("active");
  const visible = quickOn && !quickTabActive;
  floatingQuickPad.hidden = !visible;
  if(!visible) setFloatingQuickPadOpen(false);
}

function renderFloatingQuickPad(){
  if(!floatingQuickShortcuts) return;
  floatingQuickShortcuts.innerHTML = QUICK_REACTIONS.map((item) => `
    <button
      class="floating-quick-btn"
      type="button"
      data-action="react"
      data-type="${item.id}"
      data-xp="${quickReactionXp(item)}"
      title="${escapeHtml(item.label)}"
      aria-label="${escapeHtml(item.label)}"
    >${item.emoji}</button>
  `).join("");
  setFloatingQuickPadOpen(false);
  updateFloatingQuickPadVisibility();
}

function updateRecapEventLinesToggleUI(){
  if(!btnToggleRecapEventLines) return;
  btnToggleRecapEventLines.classList.toggle("active", recapEventLinesVisible);
  btnToggleRecapEventLines.textContent = recapEventLinesVisible ? "Nascondi eventi" : "Mostra eventi";
}

function renderQuickButtons(){
  if(!quickGrid) return;
  quickGrid.innerHTML = QUICK_REACTIONS.map((item) => {
    const xp = quickReactionXp(item);
    return `
      <button class="chip quick-chip" data-action="react" data-type="${item.id}" data-xp="${xp}">
        <span class="left">${item.emoji} ${escapeHtml(item.label)}</span>
      </button>
    `;
  }).join("");
  renderFloatingQuickPad();
}

function setArtistLoadStatus(msg){
  if(artistLoadStatus) artistLoadStatus.textContent = msg || "";
}

function availableArtistNames(){
  if(!artistSelect) return [];
  const names = [...artistSelect.options]
    .map((o) => String(o.value || "").trim())
    .filter(Boolean);
  return [...new Set(names)];
}

function fillPredictionSelect(select, names){
  if(!select) return;
  const current = String(select.value || "").trim();
  const base = ['<option value="">Seleziona cantante...</option>'];
  for(const name of names){
    base.push(`<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`);
  }
  if(current && !names.includes(current)){
    base.push(`<option value="${escapeHtml(current)}">${escapeHtml(current)} (storico)</option>`);
  }
  select.innerHTML = base.join("");
  if(current) select.value = current;
}

function refreshPredictionSelectOptions(){
  const names = availableArtistNames();
  for(const id of PREDICTION_SELECT_IDS){
    fillPredictionSelect($(`#${id}`), names);
  }
}

function artistFileCandidates(serata){
  return [
    `./assets/artists_serata${serata}.json`,
    `./artists_serata${serata}.json`,
    "./assets/artists.json",
    "./artists.json",
  ];
}

async function loadArtistsForSerata(serata){
  if(!artistSelect) return;
  let list = [];
  for(const path of artistFileCandidates(serata)){
    try{
      const res = await fetch(path, { cache: "no-store" });
      if(!res.ok) continue;
      const payload = await res.json();
      const arrPayload = Array.isArray(payload) ? payload : (Array.isArray(payload.artists) ? payload.artists : []);
      list = arrPayload
        .map((item) => typeof item === "string" ? item : (item?.name || item?.artist || ""))
        .map((x) => String(x).trim())
        .filter(Boolean);
      if(list.length > 0){
        
        break;
      }
    } catch {}
  }

  const opts = ['<option value="">Seleziona artista...</option>'];
  for(const name of list){
    opts.push(`<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`);
  }
  artistSelect.innerHTML = opts.join("");
  currentArtistNames = [...list];

  if(list.length === 0){
    setArtistLoadStatus("Nessun JSON trovato per questa serata.");
  }
  refreshPredictionSelectOptions();
  applyFeatureControlsUI();
}

function getCurrentDeepTarget(){
  if(!artistSelect) return "";
  return (artistSelect.value || "").trim();
}

function setDeepTarget(target){
  if(!artistSelect) return;
  const t = String(target || "").trim();
  if(!t){
    artistSelect.value = "";
    return;
  }
  const has = [...artistSelect.options].some((o) => o.value === t);
  if(has){
    artistSelect.value = t;
  } else {
    const dynamic = document.createElement("option");
    dynamic.value = t;
    dynamic.textContent = `${t} (storico)`;
    artistSelect.appendChild(dynamic);
    artistSelect.value = t;
  }
}

function readMetricValues(){
  return {
    performance: Number(performanceSlider?.value || "7"),
    outfit: Number(outfitSlider?.value || "7"),
    song: Number(songSlider?.value || "7"),
    relisten: Number(relistenSlider?.value || "7"),
  };
}

function targetKey(s){
  return String(s || "").trim().toLowerCase();
}

function computeDeepTempDelta(metrics, flags){
  const safeFlags = normalizeVoteFlags(flags);
  const avg = (metrics.performance + metrics.outfit + metrics.song + metrics.relisten) / 4;
  let temp = Math.round(((avg - 5.5) / 4.5) * 100);
  if(safeFlags.winner) temp += 8;
  if(safeFlags.stageTop) temp += 5;
  if(safeFlags.radiohit) temp += 5;
  if(safeFlags.relisten) temp += 4;
  return clamp(temp, -100, 100);
}

/* ---------- Auth + Cloud ---------- */
function getSessionProfile(){
  try{
    const raw = localStorage.getItem("pulsantiera_session");
    if(!raw) return null;
    const profile = JSON.parse(raw);
    const username = (profile.username || "").trim();
    const serata = String(profile.serata || "").trim();
    const uid = String(profile.uid || "").trim();
    if(!/^[a-zA-Z0-9_-]{2,24}$/.test(username)) return null;
    if(!/^[1-5]$/.test(serata)) return null;
    return { username, serata, uid };
  } catch {
    return null;
  }
}

function goToLogin(){
  const target = "./login.html";
  try{
    window.location.replace(target);
  } catch {
    window.location.href = target;
  }
  // Fallback in case replace is blocked by browser state.
  setTimeout(() => {
    if(!window.location.pathname.endsWith("/login.html")){
      window.location.href = target;
    }
  }, 120);
}

function updateUserInfo(){
  if(!userInfo) return;
  if(!cloud.username || !cloud.serata){
    userInfo.textContent = "—";
    if(serataNavValue) serataNavValue.textContent = "—";
    if(btnPrevSerata) btnPrevSerata.disabled = true;
    if(btnNextSerata) btnNextSerata.disabled = true;
    return;
  }
  userInfo.textContent = `${cloud.username} · S${cloud.serata}`;
  if(serataNavValue) serataNavValue.textContent = `S${cloud.serata}`;
  const s = Number(cloud.serata || 0);
  if(btnPrevSerata) btnPrevSerata.disabled = !Number.isFinite(s) || s <= 1;
  if(btnNextSerata) btnNextSerata.disabled = !Number.isFinite(s) || s >= 5;
}

function switchToSerata(targetSerata){
  if(!cloud.username || !cloud.serata) return;
  const target = String(targetSerata || "").trim();
  if(!/^[1-5]$/.test(target)) return;
  if(target === String(cloud.serata)) return;
  if(!isSerataEnabled(target)){
    toast(`Serata ${target} disabilitata dall'admin`);
    return;
  }
  try{
    localStorage.setItem("pulsantiera_session", JSON.stringify({
      username: cloud.username,
      serata: target,
      uid: cloud.uid || "",
      loginAt: now(),
    }));
  } catch {}
  window.location.href = "./index.html";
}

function moveSerata(offset){
  const current = Number(cloud.serata || 0);
  if(!Number.isFinite(current) || current < 1 || current > 5) return;
  const target = clamp(current + Number(offset || 0), 1, 5);
  if(target === current) return;
  switchToSerata(String(target));
}

async function logoutAndRedirect(){
  pushRuntimeDebug("logout click received");
  try{
    if(cloud.ready){
      cloud.pending = true;
      queueCloudSync();
      await withTimeout(flushCloudSync(), 2500, "Cloud flush logout");
      pushRuntimeDebug("cloud flush before logout ok");
    }
  } catch (err){
    pushRuntimeDebug(`cloud flush before logout failed: ${String(err?.code || err?.message || "unknown")}`);
  }
  try{
    localStorage.removeItem("pulsantiera_session");
  } catch {}
  try{
    if(cloud.auth && cloud.auth.currentUser){
      await cloud.auth.signOut();
      pushRuntimeDebug("firebase signOut ok");
    }
  } catch (err){
    pushRuntimeDebug(`firebase signOut failed: ${String(err?.code || err?.message || "unknown")}`);
  }
  goToLogin();
}

function wireSessionActions(){
  if(btnSwitchUser && !btnSwitchUser.dataset.logoutBound){
    btnSwitchUser.dataset.logoutBound = "1";
    btnSwitchUser.addEventListener("click", () => {
      logoutAndRedirect();
    });
  }
  if(btnPrevSerata && !btnPrevSerata.dataset.bound){
    btnPrevSerata.dataset.bound = "1";
    btnPrevSerata.addEventListener("click", () => moveSerata(-1));
  }
  if(btnNextSerata && !btnNextSerata.dataset.bound){
    btnNextSerata.dataset.bound = "1";
    btnNextSerata.addEventListener("click", () => moveSerata(1));
  }
  // Delegated fallback in case the topbar node gets recreated/replaced.
  if(!document.body.dataset.logoutDelegateBound){
    document.body.dataset.logoutDelegateBound = "1";
    document.addEventListener("click", (e) => {
      const prevBtn = e.target.closest("#btnPrevSerata");
      if(prevBtn){
        e.preventDefault();
        moveSerata(-1);
        return;
      }
      const nextBtn = e.target.closest("#btnNextSerata");
      if(nextBtn){
        e.preventDefault();
        moveSerata(1);
        return;
      }
      const t = e.target.closest("#btnSwitchUser, #btnLogout, #btnEsci, #btnExit, #btnSalta");
      if(!t) return;
      e.preventDefault();
      logoutAndRedirect();
    });
  }
}

async function initFirebase(){
  if(!FIREBASE_CONFIG || !FIREBASE_CONFIG.apiKey || typeof window.firebase === "undefined"){
    return false;
  }
  try{
    if(!window.firebase.apps.length){
      window.firebase.initializeApp(FIREBASE_CONFIG);
    }
    cloud.auth = window.firebase.auth();
    cloud.db = window.firebase.firestore();
    cloud.ready = true;
    return true;
  } catch (err){
    console.warn("Firebase init fallita:", err);
    return false;
  }
}

async function ensureAuthUser(preferredUid = ""){
  if(!cloud.ready || !cloud.auth) return "";
  const current = cloud.auth.currentUser;
  if(current){
    cloud.authError = "";
    return current.uid;
  }
  try{
    const cred = await withTimeout(cloud.auth.signInAnonymously(), 7000, "Firebase auth");
    const uid = cred?.user?.uid || "";
    if(preferredUid && uid && preferredUid !== uid){
      console.warn("UID sessione diverso da UID auth attuale; uso UID auth.");
    }
    cloud.authError = "";
    return uid;
  } catch (err){
    console.warn("Auth anonima fallita:", err);
    cloud.authError = String(err?.code || err?.message || "auth-failed");
    return "";
  }
}

function cloudDocRef(){
  if(!cloud.ready || !cloud.db || !cloud.username || !cloud.serata) return null;
  return cloud.db.collection("schede").doc(`${slug(cloud.username)}_s${cloud.serata}`);
}

async function pullCloudState(){
  const ref = cloudDocRef();
  if(!ref) return;
  try{
    const snap = await withTimeout(ref.get(), 6000, "Firestore get");
    if(!snap.exists){
      // First login for this user/serata: create cloud doc immediately.
      cloud.lastSignature = "";
      cloud.pending = true;
      await flushCloudSync();
      return;
    }
    const data = snap.data() || {};
    if(!data.state) return;
    const localState = normalizeState(state);
    const cloudState = normalizeState(data.state);
    const localFresh = stateFreshnessTs(localState);
    const cloudFresh = Math.max(stateFreshnessTs(cloudState), num(data.updatedAtMs, 0));
    const cloudSig = cloudSignature(cloudStateSnapshotFor(cloudState));
    const localHasData = stateHasMeaningfulData(localState);
    const cloudHasData = stateHasMeaningfulData(cloudState);

    // Safety first: never let an empty local state overwrite a non-empty cloud state.
    if(cloudHasData && !localHasData){
      state = cloudState;
      cloud.lastSignature = cloudSig;
      saveStateLocal();
      toast("Scheda cloud caricata ☁️");
      return;
    }

    // If timestamps tie or are unreliable, prefer cloud to avoid destructive merges.
    if(cloudFresh >= localFresh){
      state = cloudState;
      cloud.lastSignature = cloudSig;
      saveStateLocal();
      toast("Scheda cloud caricata ☁️");
      return;
    }

    state = localState;
    cloud.lastSignature = cloudSig;
    queueCloudSync();
    await flushCloudSync();
    toast("Dati locali più recenti: sync cloud in corso ⏳");
  } catch (err){
    console.warn("Caricamento cloud fallito:", err);
  }
}

function queueCloudSync(){
  if(!cloud.ready || !cloud.uid || !cloud.username || !cloud.serata) return;
  cloud.pending = true;
  if(cloud.syncTimer) return;
  cloud.syncTimer = setTimeout(() => {
    cloud.syncTimer = null;
    flushCloudSync();
  }, CLOUD_SYNC_DEBOUNCE_MS);
}

async function flushCloudSync(){
  if(cloud.syncBusy && cloud.syncPromise){
    return cloud.syncPromise;
  }
  if(cloud.syncBusy) return Promise.resolve();
  const ref = cloudDocRef();
  if(!cloud.uid) return Promise.resolve();
  if(!ref) return Promise.resolve();
  cloud.syncBusy = true;
  cloud.syncCount += 1;
  cloud.syncPromise = (async () => {
    const snapshot = cloudStateSnapshot();
    const signature = cloudSignature(snapshot);
    if(signature === cloud.lastSignature){
      cloud.pending = false;
      return;
    }
    await ref.set({
      uid: cloud.uid,
      username: cloud.username,
      serata: cloud.serata,
      state: snapshot,
      updatedAtMs: now(),
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    cloud.lastSignature = signature;
    cloud.pending = false;
    cloud.lastSyncAt = now();
    cloud.lastSyncError = "";
  })().catch((err) => {
    console.warn("Sync cloud fallita:", err);
    cloud.pending = true;
    cloud.lastSyncError = String(err?.code || err?.message || "errore sconosciuto");
  }).finally(() => {
    cloud.syncBusy = false;
    cloud.syncPromise = null;
  });
  return cloud.syncPromise;
}

function setupCloudFlushOnExit(){
  const flushNow = () => {
    if(!cloud.ready) return;
    cloud.pending = true;
    queueCloudSync();
    withTimeout(flushCloudSync(), 1500, "Cloud flush uscita").catch(() => {});
  };
  window.addEventListener("pagehide", flushNow);
  window.addEventListener("beforeunload", flushNow);
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState !== "hidden") return;
    flushNow();
  });
}

/* ---------- Tabs ---------- */
$$(".tab").forEach(btn => {
  btn.addEventListener("click", () => setTab(btn.dataset.tab));
});

function setTab(tab){
  const targetPanel = $("#tab-" + tab);
  if(!targetPanel || targetPanel.hidden){
    tab = "quick";
  }
  $$(".tab").forEach(b => {
    const on = b.dataset.tab === tab;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  $$(".panel").forEach(p => p.classList.remove("active"));
  $("#tab-" + tab).classList.add("active");
  updateFloatingQuickPadVisibility();
  // Refresh analytics view when opened
  if(tab === "stats") renderStats();
  if(tab === "global"){
    renderGlobalStats();
    (async () => {
      if(featureControls.quickEnabled === false) return;
      if(!cloud.uid) return;
      cloud.pending = true;
      await flushCloudSync();
      await fetchGlobalAnalytics(true);
    })();
  }
  if(tab === "challenge") renderChallenge();
  if(tab === "recap"){
    renderRecapTab();
    (async () => {
      if(!cloud.uid) return;
      if(!globalAnalytics.fetchedAt || globalAnalytics.error){
        await fetchGlobalAnalytics(true);
      }
      renderRecapTab();
    })();
  }
}

/* ---------- Toast ---------- */
let toastTimer = null;
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1400);
}

function tutorialStorageKey(profile){
  const username = slug(profile?.username || cloud.username || "guest");
  const serata = String(profile?.serata || cloud.serata || "0");
  return `${TUTORIAL_SEEN_PREFIX}_${TUTORIAL_VERSION}_${username}_s${serata}`;
}

function tutorialSteps(){
  return [
    {
      tab: "quick",
      title: "Benvenuto nella Pulsantiera",
      body: "Usa le tab in alto per navigare. Inizia da Reazioni: un tap registra subito il momento live.",
    },
    {
      tab: "deep",
      title: "Voti Cantanti",
      body: "Seleziona un artista, imposta i punteggi e salva. Ogni voto aggiorna statistiche e classifica.",
    },
    {
      tab: "stats",
      title: "Analitica Personale",
      body: "Qui trovi KPI, grafici e ranking basati sui tuoi voti della serata corrente.",
    },
    {
      tab: "challenge",
      title: "Predizioni",
      body: "Compila pre-show e pre-classifica, poi salva snapshot finale per tracciare come cambia la tua previsione.",
    },
    {
      tab: "global",
      title: "Analitica Globale",
      body: "Confronta i dati medi degli utenti della stessa serata e aggiorna quando serve.",
    },
    {
      tab: "recap",
      title: "Resoconto",
      body: "Rivedi 20:45-02:45 con trend personale vs globale e marker eventi della serata.",
    },
  ];
}

function renderTutorialStep(){
  if(!tutorialState.open || !tutorialOverlay) return;
  const total = tutorialState.steps.length;
  const idx = clamp(tutorialState.index, 0, Math.max(0, total - 1));
  tutorialState.index = idx;
  const step = tutorialState.steps[idx];
  if(step?.tab) setTab(step.tab);
  if(tutorialStepCount) tutorialStepCount.textContent = `Tutorial ${idx + 1}/${total}`;
  if(tutorialTitle) tutorialTitle.textContent = step?.title || "Tutorial";
  if(tutorialBody) tutorialBody.textContent = step?.body || "";
  if(tutorialBack) tutorialBack.disabled = idx === 0;
  const isLast = idx === total - 1;
  if(tutorialSkip) tutorialSkip.hidden = isLast;
  if(tutorialNext) tutorialNext.hidden = isLast;
  if(tutorialDone) tutorialDone.hidden = !isLast;
}

function closeTutorial(markSeen = true){
  if(!tutorialOverlay) return;
  tutorialState.open = false;
  tutorialOverlay.hidden = true;
  document.body.classList.remove("tutorial-open");
  if(markSeen && tutorialState.key){
    try{ localStorage.setItem(tutorialState.key, "1"); } catch {}
  }
}

function startTutorialIfNeeded(profile){
  if(!tutorialOverlay) return;
  const key = tutorialStorageKey(profile);
  tutorialState.key = key;
  let seen = false;
  try{ seen = localStorage.getItem(key) === "1"; } catch {}
  if(seen) return;
  tutorialState.steps = tutorialSteps();
  tutorialState.index = 0;
  tutorialState.open = true;
  tutorialOverlay.hidden = false;
  document.body.classList.add("tutorial-open");
  renderTutorialStep();
}

if(tutorialSkip){
  tutorialSkip.addEventListener("click", () => closeTutorial(true));
}
if(tutorialBack){
  tutorialBack.addEventListener("click", () => {
    tutorialState.index = Math.max(0, tutorialState.index - 1);
    renderTutorialStep();
  });
}
if(tutorialNext){
  tutorialNext.addEventListener("click", () => {
    tutorialState.index = Math.min(tutorialState.steps.length - 1, tutorialState.index + 1);
    renderTutorialStep();
  });
}
if(tutorialDone){
  tutorialDone.addEventListener("click", () => closeTutorial(true));
}
window.addEventListener("keydown", (e) => {
  if(!tutorialState.open) return;
  if(e.key === "Escape") closeTutorial(true);
});

/* ---------- Haptics (where supported) ---------- */
function vibrate(ms=12){
  if(navigator.vibrate) navigator.vibrate(ms);
}

/* ---------- XP / Boost ---------- */
function isBoostActive(){
  return state.boost.active && now() < state.boost.endsAt;
}

function maybeStartBoost(){
  // Simple: if user is active and boost is off, small chance to start it.
  // Also avoid starting too often.
  const t = now();
  if(isBoostActive()) return;
  if(t - (state.boost.lastStartAt || 0) < 3 * 60 * 1000) return; // min 3 min
  // chance grows with recent activity
  const recent = state.actions.filter(a => t - a.t < 60 * 1000).length;
  const chance = clamp(0.05 + recent * 0.03, 0.05, 0.38);
  if(Math.random() < chance){
    state.boost.active = true;
    state.boost.lastStartAt = t;
    state.boost.endsAt = t + 30 * 1000; // 30s
    toast("⚡ BOOST TIME! XP x2 per 30s");
    saveState();
  }
}

function updateBoostUI(){
  if(!boostDot || !boostText || !pillBoost) return;
  const active = isBoostActive();
  if(active){
    boostDot.style.background = "rgba(51,247,163,.95)";
    boostDot.style.boxShadow = "0 0 0 8px rgba(51,247,163,.12)";
    boostText.textContent = "Boost: ON";
    pillBoost.style.borderColor = "rgba(51,247,163,.35)";
  } else {
    // auto turn off if expired
    if(state.boost.active && now() >= state.boost.endsAt){
      state.boost.active = false;
      saveState();
    }
    boostDot.style.background = "rgba(154,166,214,.35)";
    boostDot.style.boxShadow = "0 0 0 0 rgba(0,0,0,0)";
    boostText.textContent = "Boost: OFF";
    pillBoost.style.borderColor = "rgba(31,42,77,.75)";
  }
}

/* ---------- Energy Meter ---------- */
function energyFromAllActions(){
  const actions = state.actions.filter(a => a.kind === "react" || a.kind === "event" || a.kind === "deep");
  if(actions.length === 0) return 0;

  // Weighted sum on the whole session.
  let sum = 0;
  for(const a of actions){
    sum += getActionTempDelta(a);
  }
  // Temperature uses explicit percentage deltas. Average and normalize to [-1..1].
  const avg = sum / actions.length;
  const normalized = clamp(avg / 100, -1, 1);

  return normalized;
}

function updateEnergyUI(){
  const e = energyFromAllActions(); // -1..1
  // Map to 0..1 for bar
  const x = (e + 1) / 2;
  energyFill.style.transform = `scaleX(${clamp(x, 0.02, 1)})`;
  const pct = Math.round(e * 100 / 5) * 5;
  const pctClamped = clamp(pct, -100, 100);
  if(tempComment) tempComment.textContent = TEMP_COMMENTS[String(pctClamped)] || TEMP_COMMENTS["0"];

  // glow on chaos (high absolute & mixed)
  const t = now();
  const recent = state.actions.filter(a => t - a.t <= 20 * 1000);
  const pos = recent.filter(a => getActionTempDelta(a) > 0).length;
  const neg = recent.filter(a => getActionTempDelta(a) < 0).length;
  const mixed = pos > 0 && neg > 0;
  energyGlow.style.opacity = mixed ? "0.55" : "0.18";

  // sample history for sparkline
  sampleEnergy(x);
}

let lastSampleAt = 0;
function sampleEnergy(value01){
  const t = now();
  if(t - lastSampleAt < 2000) return; // sample every 2s
  lastSampleAt = t;
  state.energyHistory.push({ t, v: value01 });
  // keep last 20 minutes max
  const cutoff = t - 20 * 60 * 1000;
  state.energyHistory = state.energyHistory.filter(p => p.t >= cutoff);
  saveState({ syncCloud: false });
}

/* ---------- Actions ---------- */
function addAction(kind, type, baseXp, note = ""){
  if((kind === "react" || kind === "event") && featureControls.quickEnabled === false){
    toast("Votazioni rapide disabilitate");
    return;
  }
  const t = now();
  const boost = isBoostActive();
  const xpGain = boost ? baseXp * 2 : baseXp;
  const tempDelta = resolveTempDelta(type);

  const action = { id: uid(), kind, type, xp: xpGain, baseXp, tempDelta, note: String(note || "").trim(), t };
  state.actions.push(action);
  state.lastActions.push(action.id);
  // Keep undo stack small
  if(state.lastActions.length > 40) state.lastActions.shift();

  state.xp += xpGain;

  // Keep actions reasonable
  if(state.actions.length > 4000) state.actions.shift();

  // Micro fun feedback
  vibrate(12);
  popFx(type, tempDelta);

  // Maybe start boost after action
  maybeStartBoost();

  saveState();
  renderAll();
}

function popFx(type, tempDelta){
  const emoji = EMOJI[type] || "✨";
  const sign = tempDelta >= 0 ? "+" : "";
  toast(`${emoji} ${sign}${tempDelta}% temperatura`);
}

/* ---------- Undo / Reset / Session ---------- */
if(btnUndo){
  btnUndo.addEventListener("click", () => {
    const lastId = state.lastActions.pop();
    if(!lastId){ toast("Niente da annullare"); return; }
    const idx = state.actions.findIndex(a => a.id === lastId);
    if(idx === -1){ toast("Niente da annullare"); return; }
    const a = state.actions[idx];
    state.xp = Math.max(0, state.xp - (a.xp || 0));
    state.actions.splice(idx, 1);
    saveState();
    toast("Undo ✅");
    renderAll();
  });
}

if(btnResetAll){
  btnResetAll.addEventListener("click", () => {
    const ok = confirm("Vuoi cancellare TUTTI i dati locali? (Non si può annullare)");
    if(!ok) return;
    localStorage.removeItem(storageKey());
    state = defaultState();
    saveState();
    toast("Reset completato");
    renderAll();
  });
}

if(btnChartKpi){
  btnChartKpi.addEventListener("click", () => setStatsChartMode("kpi"));
}
if(btnChartArtists){
  btnChartArtists.addEventListener("click", () => setStatsChartMode("artists"));
}
if(chartPeriodSelect){
  chartPeriodSelect.addEventListener("change", () => {
    statsPeriodMin = chartPeriodSelect.value || "all";
    chartSelectionIndex = -1;
    drawChart();
  });
}
if(globalChartPeriodSelect){
  globalChartPeriodSelect.addEventListener("change", () => {
    globalStatsPeriodMin = globalChartPeriodSelect.value || "all";
    drawGlobalChart();
    if(globalChartInfo){
      const periodLabel = globalStatsPeriodMin === "all"
        ? "Tutta serata"
        : `Ultimi ${Number(globalStatsPeriodMin)} min`;
    }
  });
}
if(btnGlobalRefresh){
  btnGlobalRefresh.addEventListener("click", async () => {
    if(featureControls.quickEnabled === false){
      toast("Aggiornamento globale disabilitato: voti rapidi OFF");
      return;
    }
    if(!cloud.uid){
      toast("Globali non disponibili: autenticazione cloud assente");
      return;
    }
    cloud.pending = true;
    await flushCloudSync();
    await fetchGlobalAnalytics(true);
    if($("#tab-recap")?.classList.contains("active")) renderRecapTab();
  });
}
if(recapFilterSelect){
  recapFilterSelect.addEventListener("change", () => {
    recapFilterValue = recapFilterSelect.value || "all";
    recapSelectionIndex = -1;
    drawRecapChart();
  });
}
if(recapIntervalSelect){
  recapIntervalSelect.addEventListener("change", () => {
    const next = Number(recapIntervalSelect.value || RECAP_CHART_BUCKET_MIN_DEFAULT);
    recapIntervalMin = RECAP_INTERVAL_OPTIONS.includes(next) ? next : RECAP_CHART_BUCKET_MIN_DEFAULT;
    recapSelectionIndex = -1;
    drawRecapChart();
  });
}
if(btnToggleRecapEventLines){
  btnToggleRecapEventLines.addEventListener("click", () => {
    recapEventLinesVisible = !recapEventLinesVisible;
    updateRecapEventLinesToggleUI();
    drawRecapChart();
  });
}
if(btnToggleSingerRankings){
  btnToggleSingerRankings.addEventListener("click", () => {
    singerRankingsExpanded = !singerRankingsExpanded;
    renderSingerRankings();
  });
}
if(btnToggleGlobalArtistRankings){
  btnToggleGlobalArtistRankings.addEventListener("click", () => {
    globalArtistRankingsExpanded = !globalArtistRankingsExpanded;
    renderGlobalArtistRankings();
  });
}
if(btnExpandGlobalRecentActivities){
  btnExpandGlobalRecentActivities.addEventListener("click", () => {
    globalRecentActivitiesExpanded = true;
    renderGlobalRecentActivities();
  });
}
if(btnCollapseGlobalRecentActivities){
  btnCollapseGlobalRecentActivities.addEventListener("click", () => {
    globalRecentActivitiesExpanded = false;
    renderGlobalRecentActivities();
  });
}
if(chart){
  chart.addEventListener("click", (e) => {
    const points = chartInteractiveState.points || [];
    if(points.length === 0) return;
    const rect = chart.getBoundingClientRect();
    if(rect.width <= 0) return;
    const scaleX = chart.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    let best = 0;
    let bestDist = Infinity;
    for(let i = 0; i < points.length; i++){
      const d = Math.abs(points[i].x - x);
      if(d < bestDist){
        bestDist = d;
        best = i;
      }
    }
    chartSelectionIndex = best;
    drawChart();
  });
}
if(recapChart){
  recapChart.addEventListener("click", (e) => {
    const points = recapInteractiveState.points || [];
    if(points.length === 0) return;
    const rect = recapChart.getBoundingClientRect();
    if(rect.width <= 0) return;
    // Use CSS pixels for hit-testing; recap chart is rendered in HiDPI with dpr scaling.
    const x = (e.clientX - rect.left);
    let best = 0;
    let bestDist = Infinity;
    for(let i = 0; i < points.length; i++){
      const d = Math.abs(points[i].x - x);
      if(d < bestDist){
        bestDist = d;
        best = i;
      }
    }
    recapSelectionIndex = best;
    drawRecapChart();
  });
}
if(btnNewSession){
  btnNewSession.addEventListener("click", () => {
    // new session resets "energy history" and timeline but keep deep votes and challenge etc.
    state.session.startedAt = now();
    state.actions = [];
    state.lastActions = [];
    state.energyHistory = [];
    state.boost.active = false;
    saveState();
    toast("Nuova sessione avviata");
    renderAll();
  });
}

/* ---------- Rapid buttons wiring ---------- */
if(floatingQuickBubble){
  floatingQuickBubble.addEventListener("click", () => {
    if(featureControls.quickEnabled === false) return;
    const quickTabActive = $("#tab-quick")?.classList.contains("active");
    if(quickTabActive) return;
    setFloatingQuickPadOpen(!floatingQuickPadOpen);
  });
}
document.addEventListener("click", (e) => {
  if(!floatingQuickPad || floatingQuickPad.hidden || !floatingQuickPadOpen) return;
  if(e.target.closest("#floatingQuickPad")) return;
  setFloatingQuickPadOpen(false);
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if(!btn) return;
  if(featureControls.quickEnabled === false){
    toast("Votazioni rapide disabilitate");
    return;
  }
  const action = btn.dataset.action;
  const type = btn.dataset.type;
  const xp = Number(btn.dataset.xp || "0");
  const note = (quickNoteInput?.value || "").trim();
  addAction(action, type, xp, note);
  if(btn.closest("#floatingQuickShortcuts")) setFloatingQuickPadOpen(false);
  if(quickNoteInput) quickNoteInput.value = "";
});

/* ---------- Deep vote ---------- */
function bindSliderValue(slider, valueEl){
  if(!slider || !valueEl) return;
  slider.addEventListener("input", () => {
    valueEl.textContent = slider.value;
  });
}

bindSliderValue(performanceSlider, performanceVal);
bindSliderValue(outfitSlider, outfitVal);
bindSliderValue(songSlider, songVal);
bindSliderValue(relistenSlider, relistenVal);
if(artistSelect){
  artistSelect.addEventListener("change", () => {
    const target = getCurrentDeepTarget();
    if(target && !isArtistVotingEnabled(target)){
      toast("Voto per questo cantante disabilitato");
      artistSelect.value = "";
    }
    applyFeatureControlsUI();
  });
}

$$(".toggle").forEach(t => {
  t.addEventListener("click", () => {
    if(featureControls.deepEnabled === false){
      toast("Votazioni cantante disabilitate");
      return;
    }
    const key = t.dataset.toggle;
    state.togglesDraft[key] = !state.togglesDraft[key];
    t.classList.toggle("active", state.togglesDraft[key]);
    saveState();
  });
});

if(btnSaveDeep){
  btnSaveDeep.addEventListener("click", () => {
    if(featureControls.deepEnabled === false){
      toast("Votazioni cantante disabilitate");
      return;
    }
    const target = getCurrentDeepTarget();
    if(target && !isArtistVotingEnabled(target)){
      toast("Voto per questo cantante disabilitato");
      return;
    }
    if(!target){
      toast("Scrivi almeno un artista/momento");
      vibrate(20);
      return;
    }
    const note = (noteInput?.value || "").trim();
    const metrics = readMetricValues();
    const song = metrics.song;

    const flags = { ...state.togglesDraft };
    const tempDelta = computeDeepTempDelta(metrics, flags);
    const existingIdx = state.deepVotes.findIndex((v) => targetKey(v.target) === targetKey(target));
    const existing = existingIdx >= 0 ? state.deepVotes[existingIdx] : null;
    const vote = { id: existing?.id || uid(), target, note, song, metrics, flags, tempDelta, t: now() };
    if(existingIdx >= 0){
      state.deepVotes.splice(existingIdx, 1);
    }
    state.deepVotes.unshift(vote);
    if(state.deepVotes.length > 200) state.deepVotes.pop();

    // XP from saving deep vote
    const base = 18;
    state.xp += isBoostActive() ? base * 2 : base;
    state.actions.push({
      id: uid(),
      kind:"deep",
      type:"deepVote",
      xp: isBoostActive()? base*2 : base,
      baseXp:base,
      tempDelta,
      t: vote.t
    });

    saveState();
    toast(existing ? "Voto aggiornato ✅" : "Voto salvato ✅");
    vibrate(16);
    // keep target to allow quick repeats but clear note
    if(noteInput) noteInput.value = "";
    // soft reset toggles draft
    state.togglesDraft = { outfitTop:false, stageTop:false, winner:false, relisten:false, radiohit:false };
    $$(".toggle").forEach(x => x.classList.remove("active"));
    renderAll();
  });
}

if(btnQuickAddFromDeep){
  btnQuickAddFromDeep.addEventListener("click", () => {
    if(featureControls.deepEnabled === false){
      toast("Votazioni cantante disabilitate");
      return;
    }
    // quick reaction shortcut based on deep average.
    const m = readMetricValues();
    const avg = (m.performance + m.outfit + m.song + m.relisten) / 4;
    if(avg >= 8.5) addAction("react", "iconic", 10);
    else if(avg >= 7) addAction("react", "bop_assoluto", 8);
    else if(avg >= 5.5) addAction("react", "tweet_subito", 6);
    else addAction("react", "mattone", 6);
  });
}

/* ---------- Duplicate deep vote on click ---------- */
if(deepList){
  deepList.addEventListener("click", (e) => {
    const row = e.target.closest("[data-deepid]");
    if(!row) return;
    const id = row.dataset.deepid;
    const vote = state.deepVotes.find(v => v.id === id);
    if(!vote) return;
    setDeepTarget(vote.target);
    if(noteInput) noteInput.value = vote.note || "";
    const m = vote.metrics || { performance: 7, outfit: 7, song: vote.song || 7, relisten: 7 };
    if(performanceSlider) performanceSlider.value = String(m.performance || 7);
    if(performanceVal) performanceVal.textContent = String(m.performance || 7);
    if(outfitSlider) outfitSlider.value = String(m.outfit || 7);
    if(outfitVal) outfitVal.textContent = String(m.outfit || 7);
    if(songSlider) songSlider.value = String(m.song || vote.song || 7);
    if(songVal) songVal.textContent = String(m.song || vote.song || 7);
    if(relistenSlider) relistenSlider.value = String(m.relisten || 7);
    if(relistenVal) relistenVal.textContent = String(m.relisten || 7);
    state.togglesDraft = normalizeVoteFlags(vote.flags);
    $$(".toggle").forEach(t => {
      const k = t.dataset.toggle;
      t.classList.toggle("active", !!state.togglesDraft[k]);
    });
    toast("Caricato per modifica ✍️");
    setTab("deep");
  });
}

/* ---------- Export ---------- */
if(btnExport){
  btnExport.addEventListener("click", () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulsantiera-export-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Export pronto 📦");
  });
}

/* ---------- Challenge: Predictions ---------- */
function readPredictionBlockFromForm(prefix){
  const podium = [1, 2, 3].map((i) => $(`#pred${prefix}Podium${i}`)?.value?.trim() || "");
  const free = [1, 2, 3].map((i) => $(`#pred${prefix}Free${i}`)?.value?.trim() || "");
  const last = $(`#pred${prefix}Last`)?.value?.trim() || "";
  return normalizePredictionBlock({ podium, free, last, savedAt: now() });
}

function predictionFieldIdsForPrefix(prefix){
  return [
    `pred${prefix}Podium1`,
    `pred${prefix}Podium2`,
    `pred${prefix}Podium3`,
    `pred${prefix}Last`,
    `pred${prefix}Free1`,
    `pred${prefix}Free2`,
    `pred${prefix}Free3`,
  ];
}

function setPredictionFieldValue(fieldId, value){
  const el = $(`#${fieldId}`);
  if(!el) return;
  const v = String(value || "").trim();
  if(el.tagName === "SELECT"){
    if(v && ![...el.options].some((o) => o.value === v)){
      const dynamic = document.createElement("option");
      dynamic.value = v;
      dynamic.textContent = `${v} (storico)`;
      el.appendChild(dynamic);
    }
    el.value = v;
    return;
  }
  el.value = v;
}

function writePredictionBlockToForm(prefix, block){
  const safe = normalizePredictionBlock(block);
  [1, 2, 3].forEach((i) => {
    setPredictionFieldValue(`pred${prefix}Podium${i}`, safe.podium[i - 1] || "");
    setPredictionFieldValue(`pred${prefix}Free${i}`, safe.free[i - 1] || "");
  });
  setPredictionFieldValue(`pred${prefix}Last`, safe.last || "");
}

function setPredictionBlockDisabled(prefix, disabled){
  [1, 2, 3].forEach((i) => {
    const pod = $(`#pred${prefix}Podium${i}`);
    if(pod) pod.disabled = !!disabled;
    const free = $(`#pred${prefix}Free${i}`);
    if(free) free.disabled = !!disabled;
  });
  const last = $(`#pred${prefix}Last`);
  if(last) last.disabled = !!disabled;
}

function prettyPredictionLine(block){
  const p = block.podium.map((x) => x || "—").join(" · ");
  const f = block.free.map((x) => x || "—").join(" · ");
  return `Podio: ${p} | Ultimo: ${block.last || "—"} | Libere: ${f}`;
}

function savePhasePredictions(phaseKey, prefix, label){
  if(featureControls.predictionsEnabled === false){
    toast("Predizioni disabilitate");
    return;
  }
  const anyEnabledForPhase = predictionFieldIdsForPrefix(prefix).some((id) => isPredictionFieldEnabled(id));
  if(!anyEnabledForPhase){
    toast(`Nessun campo ${label} abilitato`);
    return;
  }
  if(!state.challenge.locks) state.challenge.locks = { preShow: false, preRanking: false };
  if(state.challenge?.locks?.[phaseKey]){
    toast(`Predizioni ${label} già bloccate`);
    return;
  }
  const block = readPredictionBlockFromForm(prefix);
  state.challenge[phaseKey] = block;
  state.challenge.locks[phaseKey] = true;
  const baseXp = 8;
  const xpGain = isBoostActive() ? baseXp * 2 : baseXp;
  state.xp += xpGain;
  state.actions.push({ id: uid(), kind: "pred", type: "prediction", xp: xpGain, baseXp, t: block.savedAt });
  saveState();
  toast(`Predizioni ${label} salvate 🎯`);
  renderChallenge();
}

function addFinaleSnapshot(){
  if(featureControls.predictionsEnabled === false){
    toast("Predizioni disabilitate");
    return;
  }
  const anyEnabledFinale = predictionFieldIdsForPrefix("Finale").some((id) => isPredictionFieldEnabled(id));
  if(!anyEnabledFinale){
    toast("Nessun campo finale abilitato");
    return;
  }
  const block = readPredictionBlockFromForm("Finale");
  const snapshot = { id: uid(), createdAt: now(), ...block };
  state.challenge.finaleHistory.unshift(snapshot);
  if(state.challenge.finaleHistory.length > 80) state.challenge.finaleHistory.pop();

  const baseXp = 10;
  const xpGain = isBoostActive() ? baseXp * 2 : baseXp;
  state.xp += xpGain;
  state.actions.push({ id: uid(), kind: "pred", type: "finalePrediction", xp: xpGain, baseXp, t: snapshot.createdAt });

  saveState();
  toast("Snapshot finale salvato 📌");
  renderChallenge();
}

if(btnSavePreShow){
  btnSavePreShow.addEventListener("click", () => savePhasePredictions("preShow", "PreShow", "inizio puntata"));
}
if(btnSavePreRanking){
  btnSavePreRanking.addEventListener("click", () => savePhasePredictions("preRanking", "PreRanking", "fine puntata"));
}
if(btnAddFinaleSnapshot){
  btnAddFinaleSnapshot.addEventListener("click", addFinaleSnapshot);
}

/* ---------- Render UI ---------- */
function renderTop(){
  if(xpValue) xpValue.textContent = String(Math.floor(state.xp));
  updateBoostUI();
  updateUserInfo();
}

function renderTimeline(){
  if(!timelineEl) return;
  const last = state.actions
    .filter(a => a.kind === "react" || a.kind === "event")
    .slice(-12)
    .reverse();

  if(last.length === 0){
    timelineEl.innerHTML = `<div class="muted small">Nessuna azione ancora. Inizia a tappare 😈</div>`;
    return;
  }

  timelineEl.innerHTML = last.map(a => {
    const em = EMOJI[a.type] || "✨";
    const label = ACTION_LABEL[a.type] || a.type;
    const delta = getActionTempDelta(a);
    const deltaSign = delta >= 0 ? "+" : "";
    const boosted = Number(a.xp || 0) > Number(a.baseXp || a.xp || 0);
    const note = a.note ? `<div class="sub muted small">“${escapeHtml(a.note)}”</div>` : "";
    return `
      <div class="titem">
        <div class="tleft">
          <div class="tbadge">${em}</div>
          <div>
            <div class="title">${escapeHtml(label)}</div>
            <div class="sub muted small">Temp ${deltaSign}${delta}% · +${a.xp} XP ${boosted ? "(boost)" : ""}</div>
            ${note}
          </div>
        </div>
        <div class="tright mono">${fmtTime(a.t)}</div>
      </div>
    `;
  }).join("");
}

function renderDeepList(){
  if(!deepList) return;
  if(state.deepVotes.length === 0){
    deepList.innerHTML = `<div class="muted small">Ancora niente voti</div>`;
    return;
  }
  deepList.innerHTML = state.deepVotes.slice(0, 12).map(v => {
    const flags = Object.entries(v.flags || {}).filter(([,val]) => !!val).map(([k]) => k).join(" · ");
    const note = v.note ? ` — “${escapeHtml(v.note)}”` : "";
    const m = v.metrics || { performance: 7, outfit: 7, song: v.song || 7, relisten: 7 };
    const temp = Number.isFinite(Number(v.tempDelta)) ? Number(v.tempDelta) : computeDeepTempDelta(m, v.flags || {});
    const tSign = temp >= 0 ? "+" : "";
    return `
      <div class="item" data-deepid="${v.id}">
        <div class="meta">
          <div class="title">${escapeHtml(v.target)} <span class="mono">(B:${m.song}/10)</span></div>
          <div class="sub">${fmtTime(v.t)}${note}</div>
          <div class="sub muted">E:${m.performance}/10 · O:${m.outfit}/10 · R:${m.relisten}/10 · Temp ${tSign}${temp}%</div>
          <div class="sub muted">${flags || "—"}</div>
        </div>
        <div class="btns">
          <span class="btn-sm">Tocca per caricare</span>
        </div>
      </div>
    `;
  }).join("");
}

function computeKpisForState(sourceState, untilTs = Infinity, fromTs = -Infinity){
  const src = sourceState && typeof sourceState === "object" ? sourceState : {};
  const actions = arr(src.actions)
    .filter((a) => (a.kind === "react" || a.kind === "event" || a.kind === "deep") && a.t <= untilTs && a.t >= fromTs);
  const deltas = actions.map((a) => getActionTempDelta(a));
  const deepVotes = arr(src.deepVotes).filter((v) => v.t <= untilTs && v.t >= fromTs);

  const avgVote = deepVotes.length
    ? deepVotes.reduce((acc, v) => acc + Number(v.song || 0), 0) / deepVotes.length
    : null;

  const termometro = deltas.length
    ? deltas.reduce((acc, v) => acc + v, 0) / deltas.length
    : 0;

  let roller = 0;
  if(deltas.length > 1){
    let jump = 0;
    for(let i = 1; i < deltas.length; i++) jump += Math.abs(deltas[i] - deltas[i - 1]);
    roller = jump / (deltas.length - 1);
  }

  const centralEmojiSet = new Set([
    "🎭",
    "🎻",
    "👀",
    "📱",
    "💃",
    "🚀",
    "🤍",
    "🛸",
  ]);

  let fuochi = 0;
  let ghiaccio = 0;
  let central = 0;
  const festivalVotes = actions.filter((a) => a.kind === "react" || a.kind === "event");
  for(const a of actions){
    const delta = getActionTempDelta(a);
    if(delta >= 85) fuochi += 3;
    else if(delta >= 55) fuochi += 2;
    else if(delta >= 30) fuochi += 1;

    if(delta <= -85) ghiaccio += 3;
    else if(delta <= -55) ghiaccio += 2;
    else if(delta <= -30) ghiaccio += 1;
  }
  for(const a of festivalVotes){
    const emoji = EMOJI[a.type] || "";
    const delta = getActionTempDelta(a);
    if(centralEmojiSet.has(emoji) || (delta > -25 && delta < 50)) central += 1;
  }
  const equilibrio = festivalVotes.length ? (central / festivalVotes.length) * 100 : 0;

  return { avgVote, termometro, roller, fuochi, ghiaccio, equilibrio };
}

function computeKpisAt(untilTs = Infinity, fromTs = -Infinity){
  return computeKpisForState(getAnalyticsSourceState(), untilTs, fromTs);
}

function renderStats(){
  const k = computeKpisAt(Infinity);

  if(avgSong) avgSong.textContent = k.avgVote == null ? "—" : k.avgVote.toFixed(2);
  if(kpiTermometro) kpiTermometro.textContent = `${k.termometro >= 0 ? "+" : ""}${Math.round(k.termometro)}%`;
  if(kpiRollercoaster) kpiRollercoaster.textContent = `${Math.round(k.roller)}%`;
  if(kpiFuochi) kpiFuochi.textContent = String(Math.round(k.fuochi));
  if(kpiGhiaccio) kpiGhiaccio.textContent = String(Math.round(k.ghiaccio));
  if(kpiEquilibrio) kpiEquilibrio.textContent = `${k.equilibrio.toFixed(1)}%`;

  renderSingerRankings();
  renderQuickEmojiRankingsLocal();
  renderStatsDiary();
  drawChart();
}

function setStatsChartMode(mode){
  statsChartMode = mode === "artists" ? "artists" : "kpi";
  chartSelectionIndex = -1;
  if(btnChartKpi){
    const on = statsChartMode === "kpi";
    btnChartKpi.classList.toggle("active", on);
    btnChartKpi.setAttribute("aria-selected", on ? "true" : "false");
  }
  if(btnChartArtists){
    const on = statsChartMode === "artists";
    btnChartArtists.classList.toggle("active", on);
    btnChartArtists.setAttribute("aria-selected", on ? "true" : "false");
  }
  drawChart();
}

function getChartRangeFromMarks(marks){
  if(!marks.length) return null;
  // "Tutta serata" deve rappresentare il periodo reale con votazioni registrate:
  // dal primo evento salvato all'ultimo, anche se ora i voti sono disabilitati.
  const first = marks[0];
  const end = marks[marks.length - 1];
  if(statsPeriodMin === "all") return { start: first, end };
  const minutes = Number(statsPeriodMin);
  if(!Number.isFinite(minutes) || minutes <= 0) return { start: first, end };
  const start = Math.max(first, end - (minutes * 60 * 1000));
  return { start, end };
}

function clearChartInteraction(message){
  chartInteractiveState = { mode: statsChartMode, points: [], seriesMeta: [] };
  chartSelectionIndex = -1;
  if(chart) chart.style.cursor = "default";
  if(chartPointInfo){
    chartPointInfo.textContent = message || "Clicca un punto del grafico per vedere i dettagli.";
  }
}

function formatChartValue(key, value){
  if(value == null || !Number.isFinite(Number(value))) return "—";
  const n = Number(value);
  if(key === "avgVote") return n.toFixed(2);
  if(key === "termometro" || key === "roller" || key === "equilibrio") return `${Math.round(n)}%`;
  if(key === "fuochi" || key === "ghiaccio") return String(Math.round(n));
  return `${n.toFixed(1)}/10`;
}

function setChartInteraction(mode, seriesMeta, points){
  chartInteractiveState = { mode, seriesMeta, points };
  if(chart) chart.style.cursor = points.length > 0 ? "pointer" : "default";
  if(points.length === 0){
    clearChartInteraction("Clicca un punto del grafico per vedere i dettagli.");
    return;
  }
  if(chartSelectionIndex < 0 || chartSelectionIndex >= points.length){
    chartSelectionIndex = points.length - 1;
  }
  const selected = points[chartSelectionIndex];
  if(!selected){
    if(chartPointInfo) chartPointInfo.textContent = "Clicca un punto del grafico per vedere i dettagli.";
    return;
  }
  if(!chartPointInfo) return;
  const head = `${selected.target ? `${escapeHtml(selected.target)} · ` : ""}${fmtTime(selected.t)}`;
  const rows = seriesMeta.map((s) => {
    const v = formatChartValue(s.key, selected.values?.[s.key]);
    return `<span class="chart-point-row"><span class="chart-swatch" style="background:${s.color}"></span>${s.emoji} ${s.label}: <b class="mono">${v}</b></span>`;
  }).join("");
  chartPointInfo.innerHTML = `
    <div class="chart-point-head">${head}</div>
    <div class="chart-point-rows">${rows}</div>
  `;
}

function drawKpiChart(){
  const sourceState = getAnalyticsSourceState();
  const ctx = chart.getContext("2d");
  const w = chart.width, h = chart.height;
  ctx.clearRect(0,0,w,h);
  const seriesMeta = [
    { key: "avgVote", emoji: "🎵", label: "Media voto", color: "rgba(255,211,107,.95)" },
    { key: "termometro", emoji: "🌡️", label: "Termometro Ariston", color: "rgba(88,166,255,.95)" },
    { key: "roller", emoji: "🎢", label: "Montagne Russe Live", color: "rgba(163,107,255,.95)" },
    { key: "fuochi", emoji: "🎆", label: "Contatore Fuochi", color: "rgba(255,123,58,.95)" },
    { key: "ghiaccio", emoji: "🧊", label: "Allarme Ghiaccio", color: "rgba(154,166,214,.95)" },
    { key: "equilibrio", emoji: "⚖️", label: "Equilibrio Festival", color: "rgba(51,247,163,.95)" },
  ];

  if(chartLegend){
    chartLegend.innerHTML = seriesMeta.map((s) => `
      <span class="chart-pill">
        <span class="chart-swatch" style="background:${s.color}"></span>
        ${s.emoji} ${s.label}
      </span>
    `).join("");
  }

  const marks = [
    ...sourceState.actions
      .filter((a) => a.kind === "react" || a.kind === "event" || a.kind === "deep")
      .map((a) => a.t),
    ...sourceState.deepVotes.map((v) => v.t),
  ].sort((a, b) => a - b);

  if(marks.length < 2){
    ctx.fillStyle = "rgba(154,166,214,.75)";
    ctx.font = "14px ui-monospace";
    ctx.fillText("Inserisci valutazioni per vedere l'andamento della serata 👀", 14, 28);
    clearChartInteraction("Inserisci valutazioni per abilitare il dettaglio per punto.");
    return;
  }

  const range = getChartRangeFromMarks(marks);
  if(!range){
    clearChartInteraction("Nessun dato disponibile nel periodo selezionato.");
    return;
  }
  const start = range.start;
  const end = range.end;
  const span = Math.max(1, end - start);
  const bucketCount = clamp(Math.ceil(span / (2 * 60 * 1000)), 12, 48);
  const bucketMs = Math.max(1, Math.ceil(span / bucketCount));
  const checkpoints = Array.from({ length: bucketCount }, (_, i) => start + i * bucketMs);
  const lines = { avgVote: [], termometro: [], roller: [], fuochi: [], ghiaccio: [], equilibrio: [] };
  const pointValues = [];

  const finalKpi = computeKpisForState(sourceState, end);
  const fuochiMax = Math.max(1, finalKpi.fuochi);
  const ghiaccioMax = Math.max(1, finalKpi.ghiaccio);

  let lastAvgVote = 0.5;
  for(const ts of checkpoints){
    const k = computeKpisForState(sourceState, ts, start);
    pointValues.push({ ...k });
    const avgVoteN = k.avgVote == null ? lastAvgVote : clamp(k.avgVote / 10, 0, 1);
    lines.avgVote.push(avgVoteN);
    lines.termometro.push(clamp((k.termometro + 100) / 200, 0, 1));
    lines.roller.push(clamp(k.roller / 100, 0, 1));
    lines.fuochi.push(clamp(k.fuochi / fuochiMax, 0, 1));
    lines.ghiaccio.push(clamp(k.ghiaccio / ghiaccioMax, 0, 1));
    lines.equilibrio.push(clamp(k.equilibrio / 100, 0, 1));
    lastAvgVote = avgVoteN;
  }

  // grid lines
  ctx.strokeStyle = "rgba(31,42,77,.55)";
  ctx.lineWidth = 1;
  for(let i=1;i<=4;i++){
    const y = (h/5)*i;
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
  }

  const xFrom = (i) => (i / Math.max(1, bucketCount - 1)) * (w - 28) + 14;
  const yFrom = (v) => (1 - v) * (h - 36) + 18;
  const chartPoints = checkpoints.map((ts, i) => ({ x: xFrom(i), t: ts, values: pointValues[i] }));

  for(const s of seriesMeta){
    const arr = lines[s.key];
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i=0;i<arr.length;i++){
      const x = xFrom(i);
      const y = yFrom(arr[i]);
      if(i===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    }
    ctx.stroke();

    const last = arr[arr.length - 1];
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(xFrom(arr.length - 1), yFrom(last), 3.4, 0, Math.PI * 2);
    ctx.fill();
  }

  if(chartPoints.length > 0){
    if(chartSelectionIndex < 0 || chartSelectionIndex >= chartPoints.length){
      chartSelectionIndex = chartPoints.length - 1;
    }
    const sel = chartPoints[chartSelectionIndex];
    ctx.strokeStyle = "rgba(231,233,255,.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sel.x, 14);
    ctx.lineTo(sel.x, h - 14);
    ctx.stroke();

    for(const s of seriesMeta){
      const valN = lines[s.key][chartSelectionIndex];
      const y = yFrom(valN);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(sel.x, y, 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sel.x, y, 4.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  setChartInteraction("kpi", seriesMeta, chartPoints);
}

function drawArtistsChart(){
  const sourceState = getAnalyticsSourceState();
  const ctx = chart.getContext("2d");
  const w = chart.width, h = chart.height;
  ctx.clearRect(0,0,w,h);
  const seriesMeta = [
    { key: "performance", emoji: "🎤", label: "Esibizione", color: "rgba(88,166,255,.95)" },
    { key: "outfit", emoji: "👗", label: "Outfit", color: "rgba(255,123,58,.95)" },
    { key: "song", emoji: "🎵", label: "Brano", color: "rgba(255,211,107,.95)" },
    { key: "relisten", emoji: "🔁", label: "Riascolto", color: "rgba(51,247,163,.95)" },
  ];

  if(chartLegend){
    chartLegend.innerHTML = seriesMeta.map((s) => `
      <span class="chart-pill">
        <span class="chart-swatch" style="background:${s.color}"></span>
        ${s.emoji} ${s.label}
      </span>
    `).join("");
  }

  const votesAll = [...sourceState.deepVotes]
    .filter((v) => v && v.target)
    .sort((a, b) => a.t - b.t);
  const marks = votesAll.map((v) => v.t);
  const range = getChartRangeFromMarks(marks);
  if(!range){
    ctx.fillStyle = "rgba(154,166,214,.75)";
    ctx.font = "14px ui-monospace";
    ctx.fillText("Salva almeno 2 valutazioni cantante per vedere il trend 👀", 14, 28);
    clearChartInteraction("Salva almeno 2 voti cantante per abilitare il dettaglio per punto.");
    return;
  }
  const votes = votesAll.filter((v) => v.t >= range.start && v.t <= range.end);
  if(votes.length < 2){
    ctx.fillStyle = "rgba(154,166,214,.75)";
    ctx.font = "14px ui-monospace";
    ctx.fillText("Periodo troppo corto: servono almeno 2 voti cantante 👀", 14, 28);
    clearChartInteraction("Nel periodo selezionato servono almeno 2 voti cantante.");
    return;
  }

  const points = votes.map((v) => {
    const m = v.metrics || { performance: 7, outfit: 7, song: v.song || 7, relisten: 7 };
    return {
      performance: clamp(m.performance / 10, 0, 1),
      outfit: clamp(m.outfit / 10, 0, 1),
      song: clamp(m.song / 10, 0, 1),
      relisten: clamp(m.relisten / 10, 0, 1),
    };
  });

  ctx.strokeStyle = "rgba(31,42,77,.55)";
  ctx.lineWidth = 1;
  for(let i=1;i<=4;i++){
    const y = (h/5)*i;
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
  }

  const xFrom = (i) => (i / Math.max(1, points.length - 1)) * (w - 28) + 14;
  const yFrom = (v) => (1 - v) * (h - 36) + 18;
  const chartPoints = votes.map((v, i) => ({
    x: xFrom(i),
    t: v.t,
    target: v.target || "",
    values: {
      performance: (v.metrics?.performance ?? 7),
      outfit: (v.metrics?.outfit ?? 7),
      song: (v.metrics?.song ?? v.song ?? 7),
      relisten: (v.metrics?.relisten ?? 7),
    }
  }));

  for(const s of seriesMeta){
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i=0;i<points.length;i++){
      const x = xFrom(i);
      const y = yFrom(points[i][s.key]);
      if(i===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    }
    ctx.stroke();

    const last = points[points.length - 1][s.key];
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(xFrom(points.length - 1), yFrom(last), 3.4, 0, Math.PI * 2);
    ctx.fill();
  }

  if(chartPoints.length > 0){
    if(chartSelectionIndex < 0 || chartSelectionIndex >= chartPoints.length){
      chartSelectionIndex = chartPoints.length - 1;
    }
    const sel = chartPoints[chartSelectionIndex];
    ctx.strokeStyle = "rgba(231,233,255,.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sel.x, 14);
    ctx.lineTo(sel.x, h - 14);
    ctx.stroke();

    for(const s of seriesMeta){
      const valN = points[chartSelectionIndex][s.key];
      const y = yFrom(valN);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(sel.x, y, 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sel.x, y, 4.4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  setChartInteraction("artists", seriesMeta, chartPoints);
}

function drawChart(){
  if(!chart) return;
  syncCanvasSize(chart);
  if(statsChartMode === "artists") drawArtistsChart();
  else drawKpiChart();
}

function recapFilterOptions(){
  const groups = RECAP_GROUPS.map((g) => ({ value: `group:${g.id}`, label: g.label }));
  const singles = QUICK_REACTIONS.map((r) => ({ value: `type:${r.id}`, label: `${r.emoji} ${r.label}` }));
  return [
    { value: "all", label: "Tutte le reazioni" },
    ...groups,
    ...singles,
  ];
}

function initRecapFilterSelect(){
  if(!recapFilterSelect) return;
  const opts = recapFilterOptions();
  recapFilterSelect.innerHTML = opts
    .map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`)
    .join("");
  const hasCurrent = opts.some((o) => o.value === recapFilterValue);
  recapFilterSelect.value = hasCurrent ? recapFilterValue : "all";
  recapFilterValue = recapFilterSelect.value || "all";
}

function getRecapBucketMin(){
  const n = Number(recapIntervalMin || RECAP_CHART_BUCKET_MIN_DEFAULT);
  if(!Number.isFinite(n)) return RECAP_CHART_BUCKET_MIN_DEFAULT;
  const clamped = clamp(Math.round(n), 1, RECAP_CHART_TOTAL_MIN);
  return RECAP_INTERVAL_OPTIONS.includes(clamped) ? clamped : RECAP_CHART_BUCKET_MIN_DEFAULT;
}

function getRecapBucketCount(){
  return Math.floor(RECAP_CHART_TOTAL_MIN / getRecapBucketMin()) + 1;
}

function initRecapIntervalSelect(){
  if(!recapIntervalSelect) return;
  recapIntervalSelect.innerHTML = RECAP_INTERVAL_OPTIONS
    .map((n) => `<option value="${n}">${n} min</option>`)
    .join("");
  recapIntervalSelect.value = String(getRecapBucketMin());
}

function isReactionMatchFilter(type, filterValue){
  const f = String(filterValue || "all");
  if(f === "all") return true;
  if(f.startsWith("type:")){
    return type === f.slice(5);
  }
  if(f.startsWith("group:")){
    const gid = f.slice(6);
    const group = RECAP_GROUPS.find((g) => g.id === gid);
    return group ? !!group.matcher(type) : true;
  }
  return true;
}

function buildRecapSeriesForActions(actions, filterValue){
  const bucketMin = getRecapBucketMin();
  const bucketCount = getRecapBucketCount();
  const buckets = Array.from({ length: bucketCount }, () => 0);
  for(const a of arr(actions)){
    if(!(a?.kind === "react" || a?.kind === "event")) continue;
    if(!isReactionMatchFilter(String(a.type || ""), filterValue)) continue;
    const minute = recapWindowMinuteFromTimestamp(a.t);
    if(minute < 0) continue;
    const idx = Math.floor(minute / bucketMin);
    if(idx >= 0 && idx < buckets.length) buckets[idx] += 1;
  }
  return buckets;
}

function buildRecapTypeCountsByBucket(actions, filterValue){
  const bucketMin = getRecapBucketMin();
  const bucketCount = getRecapBucketCount();
  const counts = Array.from({ length: bucketCount }, () => new Map());
  for(const a of arr(actions)){
    if(!(a?.kind === "react" || a?.kind === "event")) continue;
    const type = String(a?.type || "").trim();
    if(!type) continue;
    if(!isReactionMatchFilter(type, filterValue)) continue;
    const minute = recapWindowMinuteFromTimestamp(a.t);
    if(minute < 0) continue;
    const idx = Math.floor(minute / bucketMin);
    if(idx < 0 || idx >= bucketCount) continue;
    const map = counts[idx];
    map.set(type, (map.get(type) || 0) + 1);
  }
  return counts;
}

function recapTopEmojiFromTypeCountMap(map){
  if(!map || map.size === 0) return "";
  let topType = "";
  let topCount = -1;
  for(const [type, count] of map.entries()){
    if(count > topCount){
      topType = type;
      topCount = count;
    }
  }
  return EMOJI[topType] || "";
}

function selectTopRecapBuckets(values, maxCount = 6){
  const minGap = 2;
  const candidates = values
    .map((v, idx) => ({ idx, value: Number(v || 0) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value || a.idx - b.idx);
  const picked = [];
  for(const c of candidates){
    if(picked.length >= maxCount) break;
    const tooClose = picked.some((p) => Math.abs(p.idx - c.idx) < minGap);
    if(tooClose) continue;
    picked.push(c);
  }
  return picked.map((x) => x.idx).sort((a, b) => a - b);
}

function recapSeriesMeta(filterValue){
  let label = "Tutte le reazioni";
  const fromGroup = RECAP_GROUPS.find((g) => `group:${g.id}` === filterValue);
  if(fromGroup) label = fromGroup.label;
  if(String(filterValue || "").startsWith("type:")){
    const id = String(filterValue).slice(5);
    const cfg = QUICK_BY_ID[id];
    if(cfg) label = `${cfg.emoji} ${cfg.label}`;
  }
  return { label };
}

function recapChartWidthForEvents(events, hostWidth){
  const bucketCount = getRecapBucketCount();
  const bucketMin = getRecapBucketMin();
  // Intervalli piccoli => timeline estesa; intervalli grandi => vista compatta.
  const pxPerBucketByInterval = {
    2: 30,
    5: 22,
    10: 14,
    15: 11,
    30: 8,
  };
  const pxPerBucket = pxPerBucketByInterval[bucketMin] || 20;
  const baseMinByInterval = {
    2: 2300,
    5: 1700,
    10: 1200,
    15: 1000,
    30: 860,
  };
  const baseWidth = Math.max(baseMinByInterval[bucketMin] || 1200, Math.round(bucketCount * pxPerBucket));
  let ideal = baseWidth;
  const evs = arr(events)
    .map((e) => ({ ...e, minute: num(e?.minute, -1) }))
    .filter((e) => e.minute >= 0)
    .sort((a, b) => a.minute - b.minute);
  if(evs.length > 0){
    // Densita valutata sul bucket corrente (non sul minuto assoluto), per evitare oversizing costante.
    const counts = Array.from({ length: bucketCount }, () => 0);
    for(const ev of evs){
      const idx = clamp(Math.floor(ev.minute / bucketMin), 0, bucketCount - 1);
      counts[idx] += 1;
    }
    const denseBuckets = counts.filter((n) => n > 1).length;
    const maxPerBucket = Math.max(...counts);
    const addByInterval = bucketMin <= 5
      ? ((denseBuckets * 8) + ((maxPerBucket - 1) * 90))
      : bucketMin <= 10
        ? ((denseBuckets * 5) + ((maxPerBucket - 1) * 60))
        : ((denseBuckets * 3) + ((maxPerBucket - 1) * 32));
    ideal = Math.max(ideal, baseWidth + addByInterval);
  }
  return Math.max(hostWidth, clamp(Math.round(ideal), 760, 4200));
}

function recapBucketRangeLabel(idx){
  const bucketMin = getRecapBucketMin();
  const startMin = clamp(idx * bucketMin, 0, RECAP_CHART_TOTAL_MIN);
  const endMin = clamp(startMin + bucketMin, 0, RECAP_CHART_TOTAL_MIN);
  return `${recapTimeLabelFromMinute(startMin)} - ${recapTimeLabelFromMinute(endMin)}`;
}

function actionsInRecapRange(actions, startMin, endMin){
  const out = [];
  for(const a of arr(actions)){
    if(!(a?.kind === "react" || a?.kind === "event")) continue;
    if(!isReactionMatchFilter(String(a.type || ""), recapFilterValue)) continue;
    const minute = recapWindowMinuteFromTimestamp(a.t);
    if(minute < 0) continue;
    if(minute >= startMin && minute < endMin) out.push(a);
  }
  return out;
}

function summarizeRecapReactions(actions){
  const map = new Map();
  for(const a of arr(actions)){
    const type = String(a?.type || "").trim();
    if(!type) continue;
    map.set(type, (map.get(type) || 0) + 1);
  }
  return [...map.entries()]
    .map(([type, count]) => ({
      type,
      count,
      emoji: EMOJI[type] || "✨",
      label: ACTION_LABEL[type] || type,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "it"))
    .slice(0, 8);
}

function renderRecapSelectionDetails(selectedPoint, events, snapshots){
  if(!recapSelectionDetails || !recapSelectionMeta){
    return;
  }
  if(!selectedPoint){
    recapSelectionMeta.textContent = "Tocca un punto del grafico per vedere eventi e riepilogo reazioni.";
    recapSelectionDetails.innerHTML = `<div class="muted small">Nessun punto selezionato.</div>`;
    return;
  }
  const startMin = selectedPoint.startMin;
  const endMin = selectedPoint.endMin;
  const label = selectedPoint.rangeLabel;
  recapSelectionMeta.textContent = `Fascia ${label}`;

  const eventsInRange = arr(events).filter((ev) => ev.minute >= startMin && ev.minute < endMin);
  const personalActions = actionsInRecapRange(state.actions, startMin, endMin);
  const personalSummary = summarizeRecapReactions(personalActions);

  const globalActions = [];
  for(const snap of arr(snapshots)){
    globalActions.push(...actionsInRecapRange(snap.actions, startMin, endMin));
  }
  const globalSummary = summarizeRecapReactions(globalActions);

  const eventRows = [];
  const sortedEvents = arr(events).slice().sort((a, b) => num(a?.minute, -1) - num(b?.minute, -1));
  const previousEvents = sortedEvents
    .filter((ev) => num(ev?.minute, -1) < startMin)
    .slice(-2);
  if(eventsInRange.length){
    for(const ev of eventsInRange){
      eventRows.push(`<div class="rank-row"><span>${escapeHtml(ev.time)} · ${escapeHtml(ev.label)}</span></div>`);
    }
    if(previousEvents.length){
      const prev = previousEvents[previousEvents.length - 1];
      eventRows.push(`<div class="rank-row"><span>${escapeHtml(prev.time)} · ${escapeHtml(prev.label)}</span></div>`);
    }
  } else {
    const prevRows = previousEvents
      .slice()
      .reverse()
      .map((ev, idx) => `<div class="rank-row"><span>${escapeHtml(ev.time)} · ${escapeHtml(ev.label)}</span></div>`);
    eventRows.push(...prevRows);
  }
  const eventsHtml = eventRows.length
    ? eventRows.join("")
    : `<div class="muted small">Nessun evento precedente disponibile.</div>`;

  const personalHtml = personalSummary.length
    ? personalSummary.map((r) => `<div class="rank-row"><span>${r.emoji} ${escapeHtml(r.label)}</span><span class="mono">${r.count}</span></div>`).join("")
    : `<div class="muted small">Nessuna reazione personale in questa fascia.</div>`;

  const globalHtml = globalSummary.length
    ? globalSummary.map((r) => `<div class="rank-row"><span>${r.emoji} ${escapeHtml(r.label)}</span><span class="mono">${r.count}</span></div>`).join("")
    : `<div class="muted small">Nessuna reazione globale in questa fascia.</div>`;

  recapSelectionDetails.innerHTML = `
    <div class="rank-box">
      <div class="rank-title">Eventi fascia</div>
      ${eventsHtml}
    </div>
    <div class="rank-box">
      <div class="rank-title">Reazioni personali (filtro corrente)</div>
      ${personalHtml}
    </div>
    <div class="rank-box">
      <div class="rank-title">Reazioni globali (filtro corrente)</div>
      ${globalHtml}
    </div>
  `;
}

function drawRecapChart(){
  if(!recapChart) return;
  const ctx = recapChart.getContext("2d");
  const hostW = recapChart.parentElement?.clientWidth || 980;
  const events = recapStaticEvents;
  const bucketMin = getRecapBucketMin();
  const bucketCount = getRecapBucketCount();
  const nextW = recapChartWidthForEvents(events, hostW);
  const cssW = nextW;
  const cssH = 220;
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const pixelW = Math.round(cssW * dpr);
  const pixelH = Math.round(cssH * dpr);
  if(recapChart.width !== pixelW) recapChart.width = pixelW;
  if(recapChart.height !== pixelH) recapChart.height = pixelH;
  // Keep CSS size aligned with backing store size to avoid blurry text/lines.
  recapChart.style.width = `${cssW}px`;
  recapChart.style.height = `${cssH}px`;
  const w = cssW;
  const h = cssH;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const personal = buildRecapSeriesForActions(state.actions, recapFilterValue);
  const personalTypeCountsByBucket = buildRecapTypeCountsByBucket(state.actions, recapFilterValue);
  const snapshots = arr(globalAnalytics.snapshots);
  const globalRaw = Array.from({ length: bucketCount }, () => 0);
  const globalTypeCountsByBucket = Array.from({ length: bucketCount }, () => new Map());
  for(const snap of snapshots){
    const row = buildRecapSeriesForActions(snap.actions, recapFilterValue);
    const typeCounts = buildRecapTypeCountsByBucket(snap.actions, recapFilterValue);
    for(let i = 0; i < globalRaw.length; i++) globalRaw[i] += row[i];
    for(let i = 0; i < typeCounts.length; i++){
      for(const [type, count] of typeCounts[i].entries()){
        const m = globalTypeCountsByBucket[i];
        m.set(type, (m.get(type) || 0) + count);
      }
    }
  }
  const yMax = Math.max(1, ...personal, ...globalRaw);
  const padX = 26;
  const padY = 16;
  const innerW = w - (padX * 2);
  const innerH = h - (padY * 2);
  const xFrom = (i) => padX + (i / Math.max(1, bucketCount - 1)) * innerW;
  const yFrom = (v) => padY + (1 - (v / yMax)) * innerH;
  const eventCountByBucket = Array.from({ length: bucketCount }, () => 0);
  for(const ev of events){
    const idx = clamp(Math.floor(ev.minute / bucketMin), 0, bucketCount - 1);
    eventCountByBucket[idx] += 1;
  }
  const chartPoints = Array.from({ length: bucketCount }, (_, idx) => ({
    x: xFrom(idx),
    idx,
    rangeLabel: recapBucketRangeLabel(idx),
    startMin: clamp(idx * bucketMin, 0, RECAP_CHART_TOTAL_MIN),
    endMin: clamp((idx + 1) * bucketMin, 0, RECAP_CHART_TOTAL_MIN),
    personal: personal[idx] || 0,
    globalTotal: Number(globalRaw[idx] || 0),
    eventsInBucket: eventCountByBucket[idx] || 0,
  }));
  recapInteractiveState = { points: chartPoints };

  ctx.strokeStyle = "rgba(31,42,77,.55)";
  ctx.lineWidth = 1;
  for(let i = 0; i <= 4; i++){
    const y = padY + (innerH / 4) * i;
    ctx.beginPath(); ctx.moveTo(padX, y); ctx.lineTo(w - padX, y); ctx.stroke();
  }

  const hourMarks = [0, 60, 120, 180, 240, 300, 360];
  ctx.fillStyle = "rgba(154,166,214,.85)";
  ctx.font = "12px ui-monospace";
  for(const m of hourMarks){
    const idx = Math.floor(m / bucketMin);
    const x = xFrom(Math.min(bucketCount - 1, idx));
    ctx.strokeStyle = "rgba(31,42,77,.35)";
    ctx.beginPath();
    ctx.moveTo(x, padY);
    ctx.lineTo(x, h - padY);
    ctx.stroke();
    const label = recapTimeLabelFromMinute(m);
    ctx.fillText(label, x - 16, h - 2);
  }

  const series = [
    { key: "personal", color: "rgba(255,211,107,.95)", values: personal, label: "Personale" },
    { key: "global", color: "rgba(88,166,255,.95)", values: globalRaw, label: "Globale (totale)" },
  ];
  for(const s of series){
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for(let i = 0; i < s.values.length; i++){
      const x = xFrom(i);
      const y = yFrom(s.values[i]);
      if(i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const personalEmojiByBucket = personalTypeCountsByBucket.map((m) => recapTopEmojiFromTypeCountMap(m));
  const globalEmojiByBucket = globalTypeCountsByBucket.map((m) => recapTopEmojiFromTypeCountMap(m));
  const personalPeakIdx = selectTopRecapBuckets(personal, 6);
  const globalPeakIdx = selectTopRecapBuckets(globalRaw, 6);

  // Emoji markers only on high-activity fasce, to keep chart readable.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "14px ui-sans-serif";

  for(const idx of personalPeakIdx){
    const emoji = personalEmojiByBucket[idx];
    if(!emoji) continue;
    const x = xFrom(idx);
    const y = yFrom(personal[idx] || 0) - 14;
    ctx.fillStyle = "rgba(7,10,19,.5)";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,235,170,.98)";
    ctx.fillText(emoji, x, y);
  }

  for(const idx of globalPeakIdx){
    const emoji = globalEmojiByBucket[idx];
    if(!emoji) continue;
    const x = xFrom(idx);
    const y = yFrom(globalRaw[idx] || 0) + 14;
    ctx.fillStyle = "rgba(7,10,19,.5)";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(179,222,255,.98)";
    ctx.fillText(emoji, x, y);
  }

  if(chartPoints.length > 0 && recapSelectionIndex >= 0 && recapSelectionIndex < chartPoints.length){
    const sel = chartPoints[recapSelectionIndex];
    ctx.strokeStyle = "rgba(231,233,255,.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sel.x, padY);
    ctx.lineTo(sel.x, h - padY);
    ctx.stroke();

    const py = yFrom(personal[recapSelectionIndex] || 0);
    const gy = yFrom(globalRaw[recapSelectionIndex] || 0);
    ctx.fillStyle = "rgba(255,211,107,.98)";
    ctx.beginPath(); ctx.arc(sel.x, py, 4.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(88,166,255,.98)";
    ctx.beginPath(); ctx.arc(sel.x, gy, 4.8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(sel.x, py, 4.8, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(sel.x, gy, 4.8, 0, Math.PI * 2); ctx.stroke();

  }

  if(recapEventLinesVisible){
    ctx.setLineDash([4, 4]);
    for(let i = 0; i < events.length; i++){
      const ev = events[i];
      const idx = clamp(Math.floor(ev.minute / bucketMin), 0, bucketCount - 1);
      const x = xFrom(idx);
      ctx.strokeStyle = "rgba(163,107,255,.75)";
      ctx.beginPath();
      ctx.moveTo(x, padY);
      ctx.lineTo(x, h - padY);
      ctx.stroke();
      ctx.fillStyle = "rgba(163,107,255,.96)";
      ctx.fillRect(x - 2, padY, 4, 9);
      ctx.beginPath();
      ctx.moveTo(x, h - padY + 1);
      ctx.lineTo(x - 4, h - padY + 8);
      ctx.lineTo(x + 4, h - padY + 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.setLineDash([]);
  }

  const filterMeta = recapSeriesMeta(recapFilterValue);
  if(recapLegend){
    recapLegend.innerHTML = `
      <span class="chart-pill"><span class="chart-swatch" style="background:rgba(255,211,107,.95)"></span>Personale</span>
      <span class="chart-pill"><span class="chart-swatch" style="background:rgba(88,166,255,.95)"></span>Globale</span>
      ${recapEventLinesVisible ? '<span class="chart-pill"><span class="chart-swatch" style="background:rgba(163,107,255,.9)"></span>Eventi</span>' : ""}
      <span class="chart-pill">Filtro: ${escapeHtml(filterMeta.label)}</span>
    `;
  }
  if(recapInfo){
    const personalTot = personal.reduce((acc, v) => acc + v, 0);
    const globalTot = globalRaw.reduce((acc, v) => acc + v, 0);
    if(recapSelectionIndex >= 0 && recapSelectionIndex < chartPoints.length){
      const sel = chartPoints[recapSelectionIndex];
      recapInfo.innerHTML = `
        <div class="chart-point-head">Dettaglio orario ${sel.rangeLabel}</div>
        <div class="chart-point-rows">
          <span class="chart-point-row">Personale: <b class="mono">${sel.personal}</b> reazioni</span>
          <span class="chart-point-row">Globale (totale): <b class="mono">${sel.globalTotal}</b> reazioni</span>
        </div>
      `;
    } else {
      recapInfo.innerHTML = `
        <div class="chart-point-head">Fascia 20:45 - 02:45 · intervallo ${bucketMin} min</div>
        <div class="chart-point-rows">
          <span class="chart-point-row">Personale: <b class="mono">${personalTot}</b> reazioni</span>
          <span class="chart-point-row">Globale: <b class="mono">${globalTot}</b> reazioni (${snapshots.length} utenti)</span>
          <span class="chart-point-row">Eventi: <b class="mono">${events.length}</b></span>
          <span class="chart-point-row">Clicca un punto del grafico per vedere il dettaglio di quel momento.</span>
        </div>
      `;
    }
  }
  const selectedPoint = (recapSelectionIndex >= 0 && recapSelectionIndex < chartPoints.length)
    ? chartPoints[recapSelectionIndex]
    : null;
  renderRecapSelectionDetails(selectedPoint, events, snapshots);
}

function renderRecapTab(){
  updateRecapEventLinesToggleUI();
  if(recapGlobalStatus){
    if(globalAnalytics.loading) recapGlobalStatus.textContent = "Aggiornamento globale…";
    else if(globalAnalytics.error) recapGlobalStatus.textContent = `${globalAnalytics.error}`;
    else if(globalAnalytics.fetchedAt) recapGlobalStatus.textContent = `Utenti globali: ${arr(globalAnalytics.snapshots).length} · ${fmtTime(globalAnalytics.fetchedAt)}`;
    else if(!cloud.uid) recapGlobalStatus.textContent = "Globali non disponibili: autenticazione cloud non riuscita.";
    else recapGlobalStatus.textContent = "In attesa dati globali…";
  }
  drawRecapChart();
}

function globalSeriesMeta(){
  return [
    { key: "avgVote", emoji: "🎵", label: "Media voto", color: "rgba(255,211,107,.95)" },
    { key: "termometro", emoji: "🌡️", label: "Termometro Ariston", color: "rgba(88,166,255,.95)" },
    { key: "roller", emoji: "🎢", label: "Montagne Russe Live", color: "rgba(163,107,255,.95)" },
    { key: "fuochi", emoji: "🎆", label: "Contatore Fuochi", color: "rgba(255,123,58,.95)" },
    { key: "ghiaccio", emoji: "🧊", label: "Allarme Ghiaccio", color: "rgba(154,166,214,.95)" },
    { key: "equilibrio", emoji: "⚖️", label: "Equilibrio Festival", color: "rgba(51,247,163,.95)" },
  ];
}

function avgNums(values){
  if(values.length === 0) return null;
  return values.reduce((acc, n) => acc + n, 0) / values.length;
}

function collectGlobalSnapshotsFromDocs(docs){
  return docs
    .map((doc) => {
      const s = normalizeState(doc.state || {});
      const username = String(doc?.username || "").trim();
      if(username) s.__username = username;
      return s;
    })
    .filter((s) => {
      const hasActions = arr(s.actions).length > 0;
      const hasDeepVotes = arr(s.deepVotes).length > 0;
      const hasPredictions =
        num(s.challenge?.preShow?.savedAt, 0) > 0 ||
        num(s.challenge?.preRanking?.savedAt, 0) > 0 ||
        arr(s.challenge?.finaleHistory).length > 0;
      return hasActions || hasDeepVotes || hasPredictions;
    });
}

function topEntriesFromMap(map, limit, mapper){
  return [...map.entries()]
    .map(([name, data]) => mapper(name, data))
    .sort((a, b) => b.value - a.value || b.count - a.count || a.name.localeCompare(b.name, "it"))
    .slice(0, limit);
}

function flagEmojisFromFlags(flags){
  const out = [];
  const f = normalizeVoteFlags(flags);
  for(const [key, emoji] of Object.entries(FLAG_EMOJI)){
    if(f[key] && typeof emoji === "string" && emoji.trim()) out.push(emoji);
  }
  return out;
}

function resolveVoteFlags(vote){
  if(vote && typeof vote === "object"){
    if(vote.flags != null) return vote.flags;
    if(vote.tags != null) return vote.tags;
    if(vote.tagList != null) return vote.tagList;
    if(vote.badges != null) return vote.badges;
  }
  return {};
}

function voteFlagsSource(vote){
  if(!vote || typeof vote !== "object") return "none";
  if(vote.flags != null) return "flags";
  if(vote.tags != null) return "tags";
  if(vote.tagList != null) return "tagList";
  if(vote.badges != null) return "badges";
  return "none";
}

function activeFlagKeysFromFlags(flags){
  const out = [];
  const f = normalizeVoteFlags(flags);
  for(const key of Object.keys(FLAG_EMOJI)){
    if(f[key]) out.push(key);
  }
  return out;
}

function topFlagsFromCountMap(map, limit = 3){
  if(!map || map.size === 0) return [];
  const order = Object.keys(FLAG_EMOJI);
  const idx = new Map(order.map((k, i) => [k, i]));
  return [...map.entries()]
    .filter(([key, count]) => typeof key === "string" && key.trim() && Number(count) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]) || (idx.get(a[0]) ?? 999) - (idx.get(b[0]) ?? 999))
    .slice(0, limit)
    .map(([key]) => key);
}

function buildGlobalArtistRankings(snapshots){
  const byArtist = new Map();
  let totalVotes = 0;
  const tagDebug = {
    votesSeen: 0,
    votesWithTarget: 0,
    votesWithAnyTag: 0,
    votesWithoutTags: 0,
    sourceCounts: { flags: 0, tags: 0, tagList: 0, badges: 0, none: 0 },
    rawTypeCounts: { object: 0, array: 0, string: 0, other: 0 },
    topTagKeys: [],
    knownFlagTrueCounts: [],
    knownFlagFalseCounts: [],
    unknownFlagKeys: [],
    sampleNoTagTargets: [],
  };
  const tagKeyCounts = new Map();
  const knownTrueCounts = new Map();
  const knownFalseCounts = new Map();
  const unknownKeyCounts = new Map();
  const sampleNoTagTargets = new Set();
  const knownAliasTokens = new Set(
    Object.values(FLAG_ALIASES).flat().map((a) => normFlagToken(a))
  );

  for(const s of snapshots){
    for(const v of arr(s.deepVotes)){
      tagDebug.votesSeen += 1;
      const target = String(v?.target || "").trim();
      if(!target) continue;
      tagDebug.votesWithTarget += 1;
      const source = voteFlagsSource(v);
      tagDebug.sourceCounts[source] = (tagDebug.sourceCounts[source] || 0) + 1;
      const rawFlags = resolveVoteFlags(v);
      const rawType = Array.isArray(rawFlags) ? "array" : typeof rawFlags;
      if(rawType === "object" || rawType === "array" || rawType === "string"){
        tagDebug.rawTypeCounts[rawType] += 1;
      } else {
        tagDebug.rawTypeCounts.other += 1;
      }
      const normalizedFlags = normalizeVoteFlags(rawFlags);
      for(const key of Object.keys(FLAG_EMOJI)){
        if(normalizedFlags[key]) knownTrueCounts.set(key, (knownTrueCounts.get(key) || 0) + 1);
        else knownFalseCounts.set(key, (knownFalseCounts.get(key) || 0) + 1);
      }

      const m = v.metrics || { performance: 7, outfit: 7, song: v.song || 7, relisten: 7 };
      const row = byArtist.get(target) || {
        count: 0,
        sumPerformance: 0,
        sumOutfit: 0,
        sumSong: 0,
        sumRelisten: 0,
        sumOverall: 0,
        tagCounts: new Map(),
      };
      const performance = Number(m.performance || 0);
      const outfit = Number(m.outfit || 0);
      const song = Number(m.song || v.song || 0);
      const relisten = Number(m.relisten || 0);
      const overall = (performance + outfit + song + relisten) / 4;
      row.count += 1;
      row.sumPerformance += performance;
      row.sumOutfit += outfit;
      row.sumSong += song;
      row.sumRelisten += relisten;
      row.sumOverall += overall;
      const activeTagKeys = Object.keys(normalizedFlags).filter((k) => normalizedFlags[k]);
      if(activeTagKeys.length > 0){
        tagDebug.votesWithAnyTag += 1;
      } else {
        tagDebug.votesWithoutTags += 1;
        if(rawFlags && typeof rawFlags === "object" && !Array.isArray(rawFlags)){
          for(const k of Object.keys(rawFlags)){
            const key = String(k || "").trim();
            if(!key) continue;
            if(!knownAliasTokens.has(normFlagToken(key))){
              unknownKeyCounts.set(key, (unknownKeyCounts.get(key) || 0) + 1);
            }
          }
        }
        if(sampleNoTagTargets.size < 8) sampleNoTagTargets.add(target);
      }
      for(const tagKey of activeTagKeys){
        tagKeyCounts.set(tagKey, (tagKeyCounts.get(tagKey) || 0) + 1);
        row.tagCounts.set(tagKey, (row.tagCounts.get(tagKey) || 0) + 1);
      }
      byArtist.set(target, row);
      totalVotes += 1;
    }
  }

  tagDebug.topTagKeys = [...tagKeyCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "it"))
    .slice(0, 8)
    .map(([key, count]) => `${key}:${count}`);
  tagDebug.knownFlagTrueCounts = [...knownTrueCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "it"))
    .map(([key, count]) => `${key}:${count}`);
  tagDebug.knownFlagFalseCounts = [...knownFalseCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "it"))
    .map(([key, count]) => `${key}:${count}`);
  tagDebug.unknownFlagKeys = [...unknownKeyCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "it"))
    .slice(0, 10)
    .map(([key, count]) => `${key}:${count}`);
  tagDebug.sampleNoTagTargets = [...sampleNoTagTargets];

  if(byArtist.size === 0){
    return { totalVotes: 0, totalArtists: 0, topOverall: [], topPerformance: [], topOutfit: [], topSong: [], topRelisten: [], tagDebug };
  }

  const toAvg = (name, data, sumKey) => ({
    name,
    count: data.count,
    value: data.count ? data[sumKey] / data.count : 0,
    topTagEmojis: topFlagsFromCountMap(data.tagCounts, 3)
      .map((k) => FLAG_EMOJI[k])
      .filter((emoji) => typeof emoji === "string" && emoji.trim()),
  });

  return {
    totalVotes,
    totalArtists: byArtist.size,
    topOverall: topEntriesFromMap(byArtist, byArtist.size, (name, data) => toAvg(name, data, "sumOverall")),
    topPerformance: topEntriesFromMap(byArtist, byArtist.size, (name, data) => toAvg(name, data, "sumPerformance")),
    topOutfit: topEntriesFromMap(byArtist, byArtist.size, (name, data) => toAvg(name, data, "sumOutfit")),
    topSong: topEntriesFromMap(byArtist, byArtist.size, (name, data) => toAvg(name, data, "sumSong")),
    topRelisten: topEntriesFromMap(byArtist, byArtist.size, (name, data) => toAvg(name, data, "sumRelisten")),
    tagDebug,
  };
}

function blockHasPrediction(block){
  const b = normalizePredictionBlock(block);
  return b.savedAt > 0 || b.podium.some(Boolean) || b.free.some(Boolean) || !!b.last;
}

function latestFinaleSnapshot(history){
  const snaps = arr(history).map(normalizePredictionSnapshot).filter(Boolean);
  if(snaps.length === 0) return null;
  return snaps.sort((a, b) => b.createdAt - a.createdAt)[0];
}

function buildPhasePredictionTally(blocks){
  const podiumWeighted = new Map();
  const podiumPresence = new Map();
  const lastCounts = new Map();
  let users = 0;

  for(const b of blocks){
    if(!b || !blockHasPrediction(b)) continue;
    users += 1;
    const pod = normalizePredictionBlock(b).podium;
    const weights = [3, 2, 1];
    for(let i = 0; i < pod.length; i++){
      const name = String(pod[i] || "").trim();
      if(!name) continue;
      podiumWeighted.set(name, (podiumWeighted.get(name) || 0) + weights[i]);
      podiumPresence.set(name, (podiumPresence.get(name) || 0) + 1);
    }
    const last = String(normalizePredictionBlock(b).last || "").trim();
    if(last){
      lastCounts.set(last, (lastCounts.get(last) || 0) + 1);
    }
  }

  return {
    users,
    topPodium: topEntriesFromMap(
      podiumWeighted,
      5,
      (name, score) => ({ name, count: podiumPresence.get(name) || 0, value: Number(score || 0) })
    ),
    topLast: topEntriesFromMap(
      lastCounts,
      5,
      (name, count) => ({ name, count: Number(count || 0), value: Number(count || 0) })
    ),
  };
}

function buildGlobalPredictionStats(snapshots){
  const preShowBlocks = snapshots.map((s) => s.challenge?.preShow || null);
  const preRankingBlocks = snapshots.map((s) => s.challenge?.preRanking || null);
  const finaleBlocks = snapshots.map((s) => latestFinaleSnapshot(s.challenge?.finaleHistory || [])).filter(Boolean);

  const preShow = buildPhasePredictionTally(preShowBlocks);
  const preRanking = buildPhasePredictionTally(preRankingBlocks);
  const finale = buildPhasePredictionTally(finaleBlocks);
  const usersWithAny = snapshots.filter((s) => (
    blockHasPrediction(s.challenge?.preShow) ||
    blockHasPrediction(s.challenge?.preRanking) ||
    !!latestFinaleSnapshot(s.challenge?.finaleHistory || [])
  )).length;

  return {
    usersWithAny,
    preShow,
    preRanking,
    finale,
  };
}

function buildQuickEmojiStatsForState(sourceState){
  const s = sourceState && typeof sourceState === "object" ? sourceState : {};
  const map = new Map();
  let total = 0;
  for(const a of arr(s.actions)){
    if(a?.kind !== "react" && a?.kind !== "event") continue;
    const type = String(a?.type || "").trim();
    if(!type) continue;
    map.set(type, (map.get(type) || 0) + 1);
    total += 1;
  }
  const top = [...map.entries()]
    .map(([type, count]) => ({
      type,
      count,
      emoji: EMOJI[type] || "✨",
      label: ACTION_LABEL[type] || type,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "it"))
    .slice(0, 10);
  return { total, top };
}

function buildGlobalQuickEmojiStats(snapshots){
  const map = new Map();
  let total = 0;
  for(const s of snapshots){
    for(const a of arr(s.actions)){
      if(a?.kind !== "react" && a?.kind !== "event") continue;
      const type = String(a?.type || "").trim();
      if(!type) continue;
      map.set(type, (map.get(type) || 0) + 1);
      total += 1;
    }
  }
  const top = [...map.entries()]
    .map(([type, count]) => ({
      type,
      count,
      emoji: EMOJI[type] || "✨",
      label: ACTION_LABEL[type] || type,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "it"))
    .slice(0, 12);
  return { total, top };
}

function buildGlobalAggregate(snapshots){
  if(snapshots.length === 0){
    return { kpi: null, points: [], artistRankings: null, predictionStats: null, quickEmojiStats: null };
  }
  const finalKpis = snapshots.map((s) => computeKpisForState(s));
  const kpi = {
    avgVote: avgNums(finalKpis.map((k) => k.avgVote).filter((v) => v != null)),
    termometro: avgNums(finalKpis.map((k) => k.termometro)) ?? 0,
    roller: avgNums(finalKpis.map((k) => k.roller)) ?? 0,
    fuochi: avgNums(finalKpis.map((k) => k.fuochi)) ?? 0,
    ghiaccio: avgNums(finalKpis.map((k) => k.ghiaccio)) ?? 0,
    equilibrio: avgNums(finalKpis.map((k) => k.equilibrio)) ?? 0,
  };

  const marks = snapshots.flatMap((s) => [
    ...arr(s.actions).filter((a) => a.kind === "react" || a.kind === "event" || a.kind === "deep").map((a) => a.t),
    ...arr(s.deepVotes).map((v) => v.t),
  ]).sort((a, b) => a - b);

  const artistRankings = buildGlobalArtistRankings(snapshots);
  const predictionStats = buildGlobalPredictionStats(snapshots);
  const quickEmojiStats = buildGlobalQuickEmojiStats(snapshots);

  if(marks.length < 2){
    return { kpi, points: [], artistRankings, predictionStats, quickEmojiStats };
  }

  const start = marks[0];
  const end = marks[marks.length - 1];
  const span = Math.max(1, end - start);
  const bucketCount = clamp(Math.ceil(span / (2 * 60 * 1000)), 12, 48);
  const bucketMs = Math.max(1, Math.ceil(span / bucketCount));
  const checkpoints = Array.from({ length: bucketCount }, (_, i) => start + i * bucketMs);

  let markIdx = 0;
  const points = checkpoints.map((ts, idx) => {
    const prevTs = idx === 0 ? (start - 1) : checkpoints[idx - 1];
    let interactionCount = 0;
    while(markIdx < marks.length && marks[markIdx] <= ts){
      if(marks[markIdx] > prevTs) interactionCount += 1;
      markIdx += 1;
    }
    const ks = snapshots
      .filter((s) => arr(s.actions).some((a) => a.t <= ts) || arr(s.deepVotes).some((v) => v.t <= ts))
      .map((s) => computeKpisForState(s, ts));
    if(ks.length === 0){
      return {
        t: ts,
        interactionCount,
        values: { avgVote: null, termometro: 0, roller: 0, fuochi: 0, ghiaccio: 0, equilibrio: 0 },
      };
    }
    return {
      t: ts,
      interactionCount,
      values: {
        avgVote: avgNums(ks.map((k) => k.avgVote).filter((v) => v != null)),
        termometro: avgNums(ks.map((k) => k.termometro)) ?? 0,
        roller: avgNums(ks.map((k) => k.roller)) ?? 0,
        fuochi: avgNums(ks.map((k) => k.fuochi)) ?? 0,
        ghiaccio: avgNums(ks.map((k) => k.ghiaccio)) ?? 0,
        equilibrio: avgNums(ks.map((k) => k.equilibrio)) ?? 0,
      }
    };
  });

  return { kpi, points, artistRankings, predictionStats, quickEmojiStats };
}

function drawGlobalChart(){
  if(!globalChart) return;
  syncCanvasSize(globalChart);
  const ctx = globalChart.getContext("2d");
  const w = globalChart.width, h = globalChart.height;
  ctx.clearRect(0, 0, w, h);
  const seriesMeta = globalSeriesMeta();
  if(globalChartLegend){
    globalChartLegend.innerHTML = seriesMeta.map((s) => `
      <span class="chart-pill">
        <span class="chart-swatch" style="background:${s.color}"></span>
        ${s.emoji} ${s.label}
      </span>
    `).join("");
  }
  const allPoints = globalAnalytics.points || [];
  let points = allPoints;
  if(globalStatsPeriodMin !== "all" && allPoints.length > 0){
    const minutes = Number(globalStatsPeriodMin);
    if(Number.isFinite(minutes) && minutes > 0){
      const end = allPoints[allPoints.length - 1].t;
      const start = end - (minutes * 60 * 1000);
      const filtered = allPoints.filter((p) => p.t >= start);
      if(filtered.length >= 2) points = filtered;
    }
  }
  const firstActiveIdx = (() => {
    for(let i = 0; i < points.length; i++){
      if(Number(points[i]?.interactionCount || 0) > 0) return i;
    }
    return -1;
  })();
  const lastActiveIdx = (() => {
    for(let i = points.length - 1; i >= 0; i--){
      if(Number(points[i]?.interactionCount || 0) > 0) return i;
    }
    return -1;
  })();
  // In "Tutta serata" show only the effective interaction window to avoid flattened tails.
  if(globalStatsPeriodMin === "all" && firstActiveIdx >= 0 && lastActiveIdx >= firstActiveIdx){
    points = points.slice(firstActiveIdx, lastActiveIdx + 1);
  // For shorter periods, keep start window and only trim dead trailing buckets.
  } else if(lastActiveIdx >= 1 && lastActiveIdx < points.length - 1){
    points = points.slice(0, lastActiveIdx + 1);
  }
  if(points.length < 2){
    ctx.fillStyle = "rgba(154,166,214,.75)";
    ctx.font = "14px ui-monospace";
    ctx.fillText("Dati insufficienti nel periodo selezionato 👥", 14, 28);
    return;
  }

  const fuochiMax = Math.max(1, ...points.map((p) => p.values.fuochi || 0));
  const ghiaccioMax = Math.max(1, ...points.map((p) => p.values.ghiaccio || 0));
  let lastAvgVote = 0.5;
  const lines = { avgVote: [], termometro: [], roller: [], fuochi: [], ghiaccio: [], equilibrio: [] };
  for(const p of points){
    const k = p.values;
    const avgVoteN = k.avgVote == null ? lastAvgVote : clamp(k.avgVote / 10, 0, 1);
    lines.avgVote.push(avgVoteN);
    lines.termometro.push(clamp((k.termometro + 100) / 200, 0, 1));
    lines.roller.push(clamp(k.roller / 100, 0, 1));
    lines.fuochi.push(clamp(k.fuochi / fuochiMax, 0, 1));
    lines.ghiaccio.push(clamp(k.ghiaccio / ghiaccioMax, 0, 1));
    lines.equilibrio.push(clamp(k.equilibrio / 100, 0, 1));
    lastAvgVote = avgVoteN;
  }

  ctx.strokeStyle = "rgba(31,42,77,.55)";
  ctx.lineWidth = 1;
  for(let i = 1; i <= 4; i++){
    const y = (h / 5) * i;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  const xFrom = (i) => (i / Math.max(1, points.length - 1)) * (w - 28) + 14;
  const yFrom = (v) => (1 - v) * (h - 36) + 18;
  for(const s of seriesMeta){
    const arr = lines[s.key];
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i = 0; i < arr.length; i++){
      const x = xFrom(i);
      const y = yFrom(arr[i]);
      if(i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const last = arr[arr.length - 1];
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(xFrom(arr.length - 1), yFrom(last), 3.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

async function fetchGlobalAnalytics(force = false){
  if(!cloud.ready || !cloud.db || !cloud.serata) return;
  const currentSerata = String(cloud.serata || "");
  if(!cloud.uid){
    globalAnalytics.loading = false;
    globalAnalytics.error = "Auth cloud non disponibile (utente non autenticato).";
    globalAnalytics.serata = currentSerata;
    globalAnalytics.fetchedAt = now();
    renderGlobalStats();
    return;
  }
  const sameSerataCache = globalAnalytics.serata === currentSerata;
  if(isStaticClosedMode() && globalAnalytics.fetchedAt && sameSerataCache){
    return;
  }
  if(globalAnalytics.loading) return;
  if(!force && globalAnalytics.fetchedAt && sameSerataCache) return;

  globalAnalytics.loading = true;
  globalAnalytics.error = "";
  globalAnalytics.debug = {
    serata: currentSerata,
    queryStringDocs: 0,
    queryNumberDocs: 0,
    dedupDocs: 0,
    fallbackUsed: false,
    fallbackDocs: 0,
    snapshotsUsed: 0,
    tagDebug: null,
    errorCode: "",
    errorMessage: "",
  };
  if(globalStatus) globalStatus.textContent = "Aggiornamento globale in corso…";
  try{
    const serataStr = String(cloud.serata);
    const serataNum = Number(serataStr);
    const [snapStr, snapNum] = await Promise.all([
      withTimeout(
        cloud.db.collection("schede").where("serata", "==", serataStr).get(),
        12000,
        "Firestore global get (string)"
      ),
      Number.isFinite(serataNum)
        ? withTimeout(
          cloud.db.collection("schede").where("serata", "==", serataNum).get(),
          12000,
          "Firestore global get (number)"
        )
        : Promise.resolve({ docs: [] }),
    ]);
    const dedup = new Map();
    for(const d of [...snapStr.docs, ...(snapNum.docs || [])]){
      dedup.set(d.id, d.data() || {});
    }
    globalAnalytics.debug.queryStringDocs = snapStr.docs.length;
    globalAnalytics.debug.queryNumberDocs = (snapNum.docs || []).length;
    globalAnalytics.debug.dedupDocs = dedup.size;
    let docs = [...dedup.values()].filter((d) => d.state);
    if(docs.length === 0){
      globalAnalytics.debug.fallbackUsed = true;
      const fullSnap = await withTimeout(
        cloud.db.collection("schede").get(),
        14000,
        "Firestore global fallback get"
      );
      const all = fullSnap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
      docs = all.filter((d) => {
        const dSerata = String(d.serata ?? "");
        const byField = dSerata === serataStr;
        const byId = String(d.id || "").endsWith(`_s${serataStr}`);
        return d.state && (byField || byId);
      });
      globalAnalytics.debug.fallbackDocs = docs.length;
    }
    const snapshots = collectGlobalSnapshotsFromDocs(docs);
    globalAnalytics.debug.snapshotsUsed = snapshots.length;
    const agg = buildGlobalAggregate(snapshots);
    globalAnalytics.debug.tagDebug = agg.artistRankings?.tagDebug || null;
    pushRuntimeDebug(`Global fetch ok: snapshots=${snapshots.length}, deepVotes=${agg.artistRankings?.totalVotes || 0}, taggedVotes=${agg.artistRankings?.tagDebug?.votesWithAnyTag || 0}`);
    console.log("[global-debug]", {
      serata: cloud.serata,
      snapshots: snapshots.length,
      tagDebug: globalAnalytics.debug.tagDebug,
    });
    globalAnalytics.users = snapshots.length;
    globalAnalytics.kpi = agg.kpi;
    globalAnalytics.points = agg.points;
    globalAnalytics.artistRankings = agg.artistRankings;
    globalAnalytics.predictionStats = agg.predictionStats;
    globalAnalytics.quickEmojiStats = agg.quickEmojiStats;
    globalAnalytics.snapshots = snapshots;
    globalAnalytics.serata = currentSerata;
    globalAnalytics.fetchedAt = now();
  } catch (err){
    console.warn("Caricamento analitica globale fallito:", err);
    const code = String(err?.code || "");
    const msg = String(err?.message || "");
    globalAnalytics.error = code ? `Errore lettura dati globali (${code})` : "Errore lettura dati globali";
    globalAnalytics.snapshots = [];
    globalAnalytics.serata = currentSerata;
    globalAnalytics.debug.errorCode = code;
    globalAnalytics.debug.errorMessage = msg;
    globalAnalytics.fetchedAt = now();
  } finally {
    globalAnalytics.loading = false;
    renderGlobalStats();
  }
}

function renderQuickEmojiRankingsLocal(){
  if(!quickEmojiRankings) return;
  const stats = buildQuickEmojiStatsForState(getAnalyticsSourceState());
  if(!stats.total || arr(stats.top).length === 0){
    quickEmojiRankings.innerHTML = `<div class="muted small">Nessuna reazione rapida registrata finora.</div>`;
    return;
  }
  const rows = stats.top.map((row, idx) => `
    <div class="rank-row">
      <span>${idx + 1}. ${row.emoji} ${escapeHtml(row.label)}</span>
      <span class="mono">${row.count} tap</span>
    </div>
  `).join("");
  quickEmojiRankings.innerHTML = `
    <div class="rank-box">
      <div class="rank-title">Top Emoji Reazioni</div>
      <div class="muted small">${stats.total} tap rapidi totali</div>
      ${rows}
    </div>
  `;
}

function renderStatsDiary(){
  if(!statsDiaryList) return;
  const actions = getAnalyticsSourceState().actions
    .filter((a) => a.kind === "react" || a.kind === "event")
    .slice()
    .sort((a, b) => b.t - a.t);
  if(statsDiaryMeta){
    statsDiaryMeta.textContent = actions.length ? `${actions.length} reazioni` : "Nessuna reazione";
  }
  if(actions.length === 0){
    statsDiaryList.innerHTML = `<div class="muted small">Non hai ancora reazioni nel diario serata.</div>`;
    return;
  }
  const maxRows = 120;
  const rows = actions.slice(0, maxRows).map((a, idx) => {
    const emoji = EMOJI[a.type] || "✨";
    const label = ACTION_LABEL[a.type] || a.type;
    const temp = getActionTempDelta(a);
    const sign = temp >= 0 ? "+" : "";
    const boosted = Number(a.xp || 0) > Number(a.baseXp || a.xp || 0);
    const note = a.note ? `<div class="sub muted small">“${escapeHtml(a.note)}”</div>` : "";
    return `
      <div class="titem">
        <div class="tleft">
          <div class="tbadge">${emoji}</div>
          <div>
            <div class="title">${idx + 1}. ${escapeHtml(label)}</div>
            <div class="sub muted small">Temp ${sign}${temp}% · +${a.xp} XP ${boosted ? "(boost)" : ""}</div>
            ${note}
          </div>
        </div>
        <div class="tright mono">${fmtDateTime(a.t)}</div>
      </div>
    `;
  }).join("");
  const tail = actions.length > maxRows
    ? `<div class="muted small">Mostrate ultime ${maxRows} su ${actions.length} reazioni.</div>`
    : "";
  statsDiaryList.innerHTML = rows + tail;
}

function renderGlobalQuickEmojiRankings(){
  if(!globalQuickEmojiRankings) return;
  const stats = globalAnalytics.quickEmojiStats;
  if(!stats || !stats.total || arr(stats.top).length === 0){
    globalQuickEmojiRankings.innerHTML = `<div class="muted small">Nessuna reazione rapida globale disponibile.</div>`;
    return;
  }
  const rows = stats.top.map((row, idx) => `
    <div class="rank-row">
      <span>${idx + 1}. ${row.emoji} ${escapeHtml(row.label)}</span>
      <span class="mono">${row.count} tap</span>
    </div>
  `).join("");
  globalQuickEmojiRankings.innerHTML = `
    <div class="rank-box">
      <div class="rank-title">Top Emoji Reazioni Globali</div>
      <div class="muted small">${stats.total} reazioni</div>
      ${rows}
    </div>
  `;
}

function renderGlobalRecentActivities(){
  if(!globalRecentActivities) return;
  if(btnExpandGlobalRecentActivities){
    btnExpandGlobalRecentActivities.classList.toggle("active", globalRecentActivitiesExpanded);
    btnExpandGlobalRecentActivities.disabled = globalRecentActivitiesExpanded;
  }
  if(btnCollapseGlobalRecentActivities){
    btnCollapseGlobalRecentActivities.classList.toggle("active", !globalRecentActivitiesExpanded);
    btnCollapseGlobalRecentActivities.disabled = !globalRecentActivitiesExpanded;
  }
  const allInteractions = arr(globalAnalytics.snapshots)
    .flatMap((snap) => arr(snap?.actions).map((a) => ({
      ...a,
      __username: String(snap?.__username || "").trim(),
    })))
    .filter((a) => (a?.kind === "react" || a?.kind === "event") && Number(a?.t) > 0 && String(a?.type || "").trim())
    .sort((a, b) => Number(b.t || 0) - Number(a.t || 0));
  if(allInteractions.length === 0){
    if(btnExpandGlobalRecentActivities) btnExpandGlobalRecentActivities.disabled = true;
    if(btnCollapseGlobalRecentActivities) btnCollapseGlobalRecentActivities.disabled = true;
    globalRecentActivities.innerHTML = `<div class="muted small">Nessuna reazione globale recente disponibile.</div>`;
    return;
  }
  if(btnExpandGlobalRecentActivities) btnExpandGlobalRecentActivities.disabled = globalRecentActivitiesExpanded;
  if(btnCollapseGlobalRecentActivities) btnCollapseGlobalRecentActivities.disabled = !globalRecentActivitiesExpanded;
  const list = globalRecentActivitiesExpanded ? allInteractions : allInteractions.slice(0, 5);
  const rows = list.map((a, idx) => {
    const emoji = EMOJI[a.type] || "✨";
    const label = ACTION_LABEL[a.type] || a.type;
    const note = String(a.note || "").trim();
    const username = String(a.__username || "").trim();
    return `
      <div class="rank-row recent-activity-row">
        <div class="recent-activity-main">
          <div>${emoji} ${escapeHtml(label)}</div>
          ${username ? `<div class="muted small mono">@${escapeHtml(username)}</div>` : ""}
          ${note ? `<div class="muted small">“${escapeHtml(note)}”</div>` : ""}
        </div>
        <span class="mono">${fmtTime(a.t)}</span>
      </div>
    `;
  }).join("");
  const listClass = globalRecentActivitiesExpanded ? "global-recent-list is-expanded" : "global-recent-list";
  globalRecentActivities.innerHTML = `
    <div class="rank-box">
      <div class="rank-title">${globalRecentActivitiesExpanded ? "Tutte le Interazioni Registrate" : "Ultime 5 Reazioni Registrate"}</div>
      <div class="muted small">${globalRecentActivitiesExpanded ? `${allInteractions.length} interazioni · ordine decrescente per timestamp` : "Feed globale · ultimi eventi"}</div>
      <div class="${listClass}">${rows}</div>
    </div>
  `;
}

function renderGlobalArtistRankings(){
  if(!globalArtistRankings) return;
  if(btnToggleGlobalArtistRankings){
    btnToggleGlobalArtistRankings.classList.toggle("active", globalArtistRankingsExpanded);
    btnToggleGlobalArtistRankings.textContent = globalArtistRankingsExpanded ? "Mostra top 5" : "Mostra tutte";
  }
  const data = globalAnalytics.artistRankings;
  if(!data || data.totalArtists === 0){
    if(btnToggleGlobalArtistRankings) btnToggleGlobalArtistRankings.disabled = true;
    globalArtistRankings.innerHTML = `<div class="muted small">Nessuna classifica artista disponibile: servono voti profondi salvati nel cloud.</div>`;
    return;
  }
  if(btnToggleGlobalArtistRankings) btnToggleGlobalArtistRankings.disabled = false;
  const limit = globalArtistRankingsExpanded ? data.totalArtists : 5;

  const blocks = [
    { title: "🏆 Top Generale", key: "topOverall", fmt: (r) => r.value.toFixed(2) },
    { title: "🎤 Top Esibizione", key: "topPerformance", fmt: (r) => `${r.value.toFixed(2)}/10` },
    { title: "👗 Top Outfit", key: "topOutfit", fmt: (r) => `${r.value.toFixed(2)}/10` },
    { title: "🎵 Top Brano", key: "topSong", fmt: (r) => `${r.value.toFixed(2)}/10` },
    { title: "🔁 Top Riascolto", key: "topRelisten", fmt: (r) => `${r.value.toFixed(2)}/10` },
  ];

  globalArtistRankings.innerHTML = blocks.map((b) => {
    const fullList = arr(data[b.key]);
    const list = fullList.slice(0, limit);
    const rows = list.map((row, idx) => `
      <div class="rank-row">
        <span>${idx + 1}. ${escapeHtml(row.name)} <span class="muted small">${arr(row.topTagEmojis).filter((e) => typeof e === "string" && e.trim()).join(" ")}</span></span>
        <span class="mono">${b.fmt(row)} </span>
      </div>
    `).join("");
    const info = globalArtistRankingsExpanded ? `Classifica completa (${fullList.length})` : `Top ${list.length}`;
    return `
      <div class="rank-box">
        <div class="rank-title">${b.title}</div>
        <div class="muted small">${info}</div>
        ${rows || '<div class="muted small">Dati insufficienti</div>'}
      </div>
    `;
  }).join("");
}

function renderPredictionPodiumPhase(title, phaseData, valueLabel){
  const podiumRows = arr(phaseData?.topPodium).map((row, idx) => `
    <div class="rank-row">
      <span>${idx + 1}. ${escapeHtml(row.name)}</span>
      <span class="mono">${Math.round(row.value)} ${valueLabel}</span>
    </div>
  `).join("");
  return `
    <div class="rank-box">
      <div class="rank-title">${title}</div>
      <div class="muted small">Utenti: ${phaseData?.users || 0}</div>
      <div class="rank-row"><span>Top podio</span><span class="muted small">punteggio</span></div>
      ${podiumRows || '<div class="muted small">Nessun dato podio</div>'}
    </div>
  `;
}

function renderPredictionLastPhase(title, phaseData){
  const lastRows = arr(phaseData?.topLast).map((row, idx) => `
    <div class="rank-row">
      <span>${idx + 1}. ${escapeHtml(row.name)}</span>
      <span class="mono">${row.count} scelte</span>
    </div>
  `).join("");
  return `
    <div class="rank-box">
      <div class="rank-title">${title}</div>
      <div class="muted small">Utenti: ${phaseData?.users || 0}</div>
      <div class="rank-row"><span>Top ultimo</span><span class="muted small">scelte</span></div>
      ${lastRows || '<div class="muted small">Nessun dato ultimo</div>'}
    </div>
  `;
}

function renderGlobalPredictionStats(){
  const data = globalAnalytics.predictionStats;
  if(globalPredictionSummary){
    if(!data){
      globalPredictionSummary.innerHTML = "";
    } else {
      globalPredictionSummary.innerHTML = `
        <div class="stat card">
          <div class="stat-title">Utenti con predizioni</div>
          <div class="stat-value mono">${data.usersWithAny}</div>
          <div class="stat-sub muted">👥 almeno una fase compilata</div>
        </div>
        <div class="stat card">
          <div class="stat-title">Inizio Puntata</div>
          <div class="stat-value mono">${data.preShow.users}</div>
          <div class="stat-sub muted">🎬 utenti con pre-show</div>
        </div>
        <div class="stat card">
          <div class="stat-title">Fine Puntata</div>
          <div class="stat-value mono">${data.preRanking.users}</div>
          <div class="stat-sub muted">📊 utenti con pre-classifica</div>
        </div>
        <div class="stat card">
          <div class="stat-title">Snapshot Finale</div>
          <div class="stat-value mono">${data.finale.users}</div>
          <div class="stat-sub muted">🏁 utenti con snapshot finale</div>
        </div>
      `;
    }
  }

  if(!globalPredictionRankings) return;
  if(!data){
    globalPredictionRankings.innerHTML = `<div class="muted small">Nessuna statistica predizioni disponibile.</div>`;
    return;
  }
  globalPredictionRankings.innerHTML = `
    <div class="rank-box">
      <div class="rank-title">📊 Media Classifica (Podio)</div>
      <div class="muted small">Trend collettivo sulle posizioni alte</div>
      <div class="rank-grid">
        ${[
          renderPredictionPodiumPhase("🎬 Pre-show", data.preShow, "pt"),
          renderPredictionPodiumPhase("📊 Pre-classifica", data.preRanking, "pt"),
          renderPredictionPodiumPhase("🏁 Finale", data.finale, "pt"),
        ].join("")}
      </div>
    </div>
    <div class="rank-box">
      <div class="rank-title">📉 Media Top Ultimi</div>
      <div class="muted small">Trend collettivo sui candidati ultimi</div>
      <div class="rank-grid">
        ${[
          renderPredictionLastPhase("🎬 Pre-show", data.preShow),
          renderPredictionLastPhase("📊 Pre-classifica", data.preRanking),
          renderPredictionLastPhase("🏁 Finale", data.finale),
        ].join("")}
      </div>
    </div>
  `;
}

function renderGlobalStats(){
  const globalUpdatesEnabled = featureControls.quickEnabled !== false;
  if(globalDebug){
    const d = globalAnalytics.debug || {};
    const lines = [
      `Serata richiesta: ${d.serata || "-"}`,
      `Cloud ready: ${cloud.ready ? "SI" : "NO"} · UID: ${cloud.uid ? "presente" : "assente"}`,
      `Auth error: ${cloud.authError || "-"}`,
      `Runtime error: ${runtimeDebug.lastError || "-"}`,
      `Sync tentativi: ${cloud.syncCount} · ultimo sync: ${cloud.lastSyncAt ? fmtDateTime(cloud.lastSyncAt) : "-"}`,
      `Ultimo errore sync: ${cloud.lastSyncError || "-"}`,
      `Query serata (string): ${d.queryStringDocs ?? 0} docs`,
      `Query serata (number): ${d.queryNumberDocs ?? 0} docs`,
      `Dedup docs con state: ${d.dedupDocs ?? 0}`,
      `Fallback collection scan: ${d.fallbackUsed ? "SI" : "NO"}`,
      `Fallback docs filtrati: ${d.fallbackDocs ?? 0}`,
      `Snapshot validi usati: ${d.snapshotsUsed ?? 0}`,
      `Ultimo update: ${globalAnalytics.fetchedAt ? fmtDateTime(globalAnalytics.fetchedAt) : "-"}`,
    ];
    if(d.tagDebug){
      lines.push("--- Tag debug (voti cantante globali) ---");
      lines.push(`Deep votes letti: ${d.tagDebug.votesSeen ?? 0}`);
      lines.push(`Deep votes con target: ${d.tagDebug.votesWithTarget ?? 0}`);
      lines.push(`Deep votes con almeno 1 tag: ${d.tagDebug.votesWithAnyTag ?? 0}`);
      lines.push(`Deep votes senza tag riconosciuti: ${d.tagDebug.votesWithoutTags ?? 0}`);
      const sc = d.tagDebug.sourceCounts || {};
      lines.push(`Sorgente tag -> flags:${sc.flags ?? 0}, tags:${sc.tags ?? 0}, tagList:${sc.tagList ?? 0}, badges:${sc.badges ?? 0}, none:${sc.none ?? 0}`);
      const tc = d.tagDebug.rawTypeCounts || {};
      lines.push(`Tipo grezzo tag -> object:${tc.object ?? 0}, array:${tc.array ?? 0}, string:${tc.string ?? 0}, other:${tc.other ?? 0}`);
      lines.push(`Top tag key: ${arr(d.tagDebug.topTagKeys).join(", ") || "-"}`);
      lines.push(`Known tag TRUE count: ${arr(d.tagDebug.knownFlagTrueCounts).join(", ") || "-"}`);
      lines.push(`Known tag FALSE count: ${arr(d.tagDebug.knownFlagFalseCounts).join(", ") || "-"}`);
      lines.push(`Raw flag keys non riconosciute: ${arr(d.tagDebug.unknownFlagKeys).join(", ") || "-"}`);
      lines.push(`Sample artisti senza tag: ${arr(d.tagDebug.sampleNoTagTargets).join(", ") || "-"}`);
    }
    if(d.errorCode || d.errorMessage){
      lines.push(`Errore code: ${d.errorCode || "-"}`);
      lines.push(`Errore msg: ${d.errorMessage || "-"}`);
      if(String(d.errorCode || "").includes("permission-denied")){
        lines.push("Hint: le regole Firestore stanno bloccando la lettura globale della collection `schede`.");
      }
    }
    if(runtimeDebug.events.length){
      lines.push("--- Runtime events ---");
      lines.push(...runtimeDebug.events.slice(-6));
    }
    if(String(cloud.lastSyncError || "").includes("permission-denied")){
      lines.push("WARNING: sync cloud bloccato (permission-denied). I tag locali recenti potrebbero non essere presenti nei dati globali.");
    }
    globalDebug.textContent = lines.join("\n");
  }

  if(globalStatus){
    if(!globalUpdatesEnabled){
      const ts = globalAnalytics.fetchedAt ? ` · dati statici ${fmtTime(globalAnalytics.fetchedAt)}` : "";
      globalStatus.textContent = `Modalità statica (votazioni chiuse)${ts}`;
    } else if(!cloud.ready){
      globalStatus.textContent = "Cloud non disponibile";
    } else if(globalAnalytics.loading){
      globalStatus.textContent = "Aggiornamento globale in corso…";
    } else if(globalAnalytics.error){
      globalStatus.textContent = `${globalAnalytics.error} · ultimo tentativo ${fmtTime(globalAnalytics.fetchedAt || now())}`;
    } else if(globalAnalytics.fetchedAt){
      globalStatus.textContent = `👥 ${globalAnalytics.users} utenti · S${cloud.serata} · aggiornato ${fmtTime(globalAnalytics.fetchedAt)}`;
    } else {
      globalStatus.textContent = "In attesa primo aggiornamento…";
    }
  }

  const k = globalAnalytics.kpi;
  if(!k){
    if(gAvgSong) gAvgSong.textContent = "—";
    if(gKpiTermometro) gKpiTermometro.textContent = "—";
    if(gKpiRollercoaster) gKpiRollercoaster.textContent = "—";
    if(gKpiFuochi) gKpiFuochi.textContent = "—";
    if(gKpiGhiaccio) gKpiGhiaccio.textContent = "—";
    if(gKpiEquilibrio) gKpiEquilibrio.textContent = "—";
    renderGlobalRecentActivities();
    renderGlobalArtistRankings();
    renderGlobalPredictionStats();
    renderGlobalQuickEmojiRankings();
    if(globalChartInfo) globalChartInfo.textContent = "Aggiorna con il pulsante per ricaricare i dati globali.";
    drawGlobalChart();
    // Anche a votazioni chiuse: carica una sola volta i dati per consultazione statica.
    if(cloud.ready && cloud.uid && (
      globalUpdatesEnabled ||
      !globalAnalytics.fetchedAt ||
      globalAnalytics.serata !== String(cloud.serata || "")
    )) fetchGlobalAnalytics(false);
    if(btnGlobalRefresh) btnGlobalRefresh.disabled = !globalUpdatesEnabled;
    return;
  }

  if(gAvgSong) gAvgSong.textContent = k.avgVote == null ? "—" : k.avgVote.toFixed(2);
  if(gKpiTermometro) gKpiTermometro.textContent = `${k.termometro >= 0 ? "+" : ""}${Math.round(k.termometro)}%`;
  if(gKpiRollercoaster) gKpiRollercoaster.textContent = `${Math.round(k.roller)}%`;
  if(gKpiFuochi) gKpiFuochi.textContent = String(Math.round(k.fuochi));
  if(gKpiGhiaccio) gKpiGhiaccio.textContent = String(Math.round(k.ghiaccio));
  if(gKpiEquilibrio) gKpiEquilibrio.textContent = `${k.equilibrio.toFixed(1)}%`;
  renderGlobalRecentActivities();
  renderGlobalArtistRankings();
  renderGlobalPredictionStats();
  renderGlobalQuickEmojiRankings();
  if(globalChartInfo){
    const periodLabel = globalStatsPeriodMin === "all"
      ? "Tutta serata"
      : `Ultimi ${Number(globalStatsPeriodMin)} min`;
    const mode = globalUpdatesEnabled ? "aggiornamento live" : "modalità statica (votazioni chiuse)";

  }
  drawGlobalChart();
  if(btnGlobalRefresh) btnGlobalRefresh.disabled = !globalUpdatesEnabled;
}

function renderSingerRankings(){
  if(!singerRankings) return;
  if(btnToggleSingerRankings){
    btnToggleSingerRankings.classList.toggle("active", singerRankingsExpanded);
    btnToggleSingerRankings.textContent = singerRankingsExpanded ? "Mostra top 5" : "Mostra tutte";
  }
  const votes = getAnalyticsSourceState().deepVotes
    .filter((v) => v && v.target)
    .map((v) => {
      const m = v.metrics || { performance: 7, outfit: 7, song: v.song || 7, relisten: 7 };
      const overall = (m.performance + m.outfit + m.song + m.relisten) / 4;
      return { target: v.target, ...m, overall, tagEmojis: flagEmojisFromFlags(resolveVoteFlags(v)) };
    });

  if(votes.length === 0){
    singerRankings.innerHTML = `<div class="muted small">Nessuna classifica disponibile: salva prima dei voti profondi.</div>`;
    return;
  }

  const limit = singerRankingsExpanded ? votes.length : 5;
  const byMetric = (key) => [...votes].sort((a, b) => b[key] - a[key]).slice(0, limit);
  const blocks = [
    { title: "🏆 Top Generale", key: "overall", fmt: (v) => v.toFixed(2) },
    { title: "🎤 Top Esibizione", key: "performance", fmt: (v) => `${v}/10` },
    { title: "👗 Top Outfit", key: "outfit", fmt: (v) => `${v}/10` },
    { title: "🎵 Top Brano", key: "song", fmt: (v) => `${v}/10` },
    { title: "🔁 Top Riascolto", key: "relisten", fmt: (v) => `${v}/10` },
  ];

  singerRankings.innerHTML = blocks.map((b) => {
    const list = byMetric(b.key);
    const rows = list.map((v, idx) => `
      <div class="rank-row">
        <span>${idx + 1}. ${escapeHtml(v.target)}${v.tagEmojis?.length ? ` ${v.tagEmojis.join(" ")}` : ""}</span>
        <span class="mono">${b.fmt(v[b.key])}</span>
      </div>
    `).join("");
    const info = singerRankingsExpanded ? `Classifica completa (${list.length})` : `Top ${list.length}`;
    return `
      <div class="rank-box">
        <div class="rank-title">${b.title}</div>
        <div class="muted small">${info}</div>
        ${rows}
      </div>
    `;
  }).join("");
}

/* ---------- Challenge render ---------- */
function renderChallenge(){
  refreshPredictionSelectOptions();
  writePredictionBlockToForm("PreShow", state.challenge.preShow);
  writePredictionBlockToForm("PreRanking", state.challenge.preRanking);
  const predEnabled = featureControls.predictionsEnabled !== false;
  const preShowLocked = !!state.challenge?.locks?.preShow;
  const preRankingLocked = !!state.challenge?.locks?.preRanking;
  for(const id of predictionFieldIdsForPrefix("PreShow")){
    const el = $(`#${id}`);
    if(!el) continue;
    el.disabled = preShowLocked || !predEnabled || !isPredictionFieldEnabled(id);
  }
  for(const id of predictionFieldIdsForPrefix("PreRanking")){
    const el = $(`#${id}`);
    if(!el) continue;
    el.disabled = preRankingLocked || !predEnabled || !isPredictionFieldEnabled(id);
  }
  for(const id of predictionFieldIdsForPrefix("Finale")){
    const el = $(`#${id}`);
    if(!el) continue;
    el.disabled = !predEnabled || !isPredictionFieldEnabled(id);
  }
  const preShowEnabled = predictionFieldIdsForPrefix("PreShow").some((id) => isPredictionFieldEnabled(id));
  const preRankingEnabled = predictionFieldIdsForPrefix("PreRanking").some((id) => isPredictionFieldEnabled(id));
  const finaleEnabled = predictionFieldIdsForPrefix("Finale").some((id) => isPredictionFieldEnabled(id));
  if(btnSavePreShow){
    btnSavePreShow.disabled = preShowLocked || !predEnabled || !preShowEnabled;
    btnSavePreShow.textContent = preShowLocked ? "🔒 Predizione Bloccata" : "💾 Salva Inizio Puntata";
  }
  if(btnSavePreRanking){
    btnSavePreRanking.disabled = preRankingLocked || !predEnabled || !preRankingEnabled;
    btnSavePreRanking.textContent = preRankingLocked ? "🔒 Predizione Bloccata" : "💾 Salva Fine Puntata";
  }
  if(btnAddFinaleSnapshot) btnAddFinaleSnapshot.disabled = !predEnabled || !finaleEnabled;

  if(preShowSavedAt){
    preShowSavedAt.textContent = state.challenge.preShow.savedAt
      ? `Bloccata il ${fmtDateTime(state.challenge.preShow.savedAt)}`
      : "Non ancora salvate";
  }
  if(preRankingSavedAt){
    preRankingSavedAt.textContent = state.challenge.preRanking.savedAt
      ? `Bloccata il ${fmtDateTime(state.challenge.preRanking.savedAt)}`
      : "Non ancora salvate";
  }

  const history = arr(state.challenge.finaleHistory);
  if(!finaleHistoryList) return;
  if(history.length === 0){
    finaleHistoryList.innerHTML = `<div class="muted small">Nessuno pronostico finale: salva la tua prima previsione per tracciare l’evoluzione.</div>`;
    return;
  }

  finaleHistoryList.innerHTML = history.map((snap, idx) => `
    <div class="item">
      <div class="meta">
        <div class="title">Versione #${history.length - idx}</div>
        <div class="sub muted small">${fmtDateTime(snap.createdAt)}</div>
        <div class="sub muted small">${escapeHtml(prettyPredictionLine(snap))}</div>
      </div>
      <div class="sub muted small">Immodificabile</div>
    </div>
  `).join("");
}

/* ---------- Global renderAll ---------- */
function renderAll(){
  renderTop();
  updateEnergyUI();
  renderTimeline();
  renderDeepList();
  applyFeatureControlsUI();
  // stats refresh if on stats tab
  if($("#tab-stats").classList.contains("active")) renderStats();
  if($("#tab-global").classList.contains("active")) renderGlobalStats();
  if($("#tab-challenge").classList.contains("active")) renderChallenge();
  if($("#tab-recap").classList.contains("active")) renderRecapTab();
}

/* ---------- Helpers ---------- */
function escapeHtml(str){
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function resolveTheme(themeId){
  return THEME_CATALOG.find((t) => t.id === themeId) || THEME_CATALOG[0];
}

function getSavedThemeId(){
  try{
    return String(localStorage.getItem(THEME_STORAGE_KEY) || "base");
  } catch {
    return "base";
  }
}

function saveThemeId(themeId){
  try{
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch {}
}

function applyTheme(themeId){
  const theme = resolveTheme(themeId);
  const link = document.querySelector("#themeStylesheet");
  if(link){
    link.setAttribute("href", theme.href || "");
  }
  document.body.dataset.theme = theme.id;
  saveThemeId(theme.id);
  if(themeSelect) themeSelect.value = theme.id;
}

function initThemePicker(){
  if(!themeSelect) return;
  themeSelect.innerHTML = THEME_CATALOG
    .map((theme) => `<option value="${escapeHtml(theme.id)}">${escapeHtml(theme.label)}</option>`)
    .join("");
  const initialId = resolveTheme(getSavedThemeId()).id;
  applyTheme(initialId);
  if(!themeSelect.dataset.bound){
    themeSelect.dataset.bound = "1";
    themeSelect.addEventListener("change", () => {
      applyTheme(themeSelect.value);
    });
  }
}

/* ---------- Init toggles draft UI ---------- */
function initTogglesFromState(){
  $$(".toggle").forEach(t => {
    const k = t.dataset.toggle;
    t.classList.toggle("active", !!state.togglesDraft[k]);
  });
}

/* ---------- Loop ---------- */
function tick(){
  updateBoostUI();
  updateEnergyUI();
  // re-render top xp occasionally
  if(xpValue) xpValue.textContent = String(Math.floor(state.xp));
  requestAnimationFrame(() => setTimeout(tick, 400)); // low frequency to save battery
}

/* ---------- Boot ---------- */
async function bootApp(){
  initThemePicker();
  initCollapsibleCards();
  pushRuntimeDebug("bootApp start");
  const profile = getSessionProfile();
  if(!profile){
    pushRuntimeDebug("session profile assente/invalid, redirect login");
    goToLogin();
    return;
  }
  if(!isSerataEnabled(profile.serata)){
    pushRuntimeDebug(`serata ${profile.serata} disabilitata da admin, redirect login`);
    try{
      localStorage.removeItem("pulsantiera_session");
      localStorage.setItem(LOGIN_NOTICE_KEY, `La serata ${profile.serata} è disabilitata dall'admin.`);
    } catch {}
    goToLogin();
    return;
  }

  pushRuntimeDebug(`session ok user=${profile.username} serata=${profile.serata}`);
  pushRuntimeDebug(`DOM quickGrid=${!!quickGrid} artistSelect=${!!artistSelect}`);
  cloud.username = profile.username;
  cloud.serata = profile.serata;
  cloud.uid = profile.uid || "";
  refreshFeatureControlsFromStorage();
  renderQuickButtons();
  initRecapFilterSelect();
  initRecapIntervalSelect();
  applyFeatureControlsUI();
  pushRuntimeDebug("quick buttons rendered");
  updateUserInfo();
  wireSessionActions();
  await loadArtistsForSerata(cloud.serata);
  await loadRecapEventsForSerata(cloud.serata);
  pushRuntimeDebug("artists load completed");

  state = loadState();
  initTogglesFromState();
  setDeepTarget("");
  redrawChartsForViewport();
  renderAll();
  pushRuntimeDebug("initial render completed");

  if(!tickStarted){
    tickStarted = true;
    tick();
  }

  const firebaseOk = await initFirebase();
  if(!firebaseOk){
    pushRuntimeDebug("firebase init failed -> local mode");
    toast("Modalità locale: Firebase non configurato");
    renderGlobalStats();
    return;
  }
  pushRuntimeDebug("firebase init ok");

  const uid = await ensureAuthUser(profile.uid || "");
  if(!uid){
    cloud.uid = "";
    pushRuntimeDebug(`firebase auth failed: ${cloud.authError || "no-uid"}`);
    toast("Modalità locale: auth Firebase non disponibile");
    renderGlobalStats();
    return;
  }
  pushRuntimeDebug(`firebase auth ok uid=${uid}`);
  cloud.uid = uid;
  try{
    localStorage.setItem("pulsantiera_session", JSON.stringify({
      username: cloud.username,
      serata: cloud.serata,
      uid: cloud.uid,
      loginAt: now(),
    }));
  } catch {}

  await syncAdminConfigFromCloud(cloud.serata);
  if(!isSerataEnabled(cloud.serata)){
    try{
      localStorage.removeItem("pulsantiera_session");
      localStorage.setItem(LOGIN_NOTICE_KEY, `La serata ${cloud.serata} è disabilitata dall'admin.`);
    } catch {}
    goToLogin();
    return;
  }

  await pullCloudState();
  pushRuntimeDebug("cloud state pull completed");
  renderAll();
  startTutorialIfNeeded(profile);
  setupCloudFlushOnExit();
  pushRuntimeDebug("bootApp completed");
}

bootApp();
