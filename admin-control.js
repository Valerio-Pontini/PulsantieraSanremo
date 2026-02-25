const SESSION_KEY = "pulsantiera_session";
const ADMIN_USERNAME = "pulsantiera_admin";
const ADMIN_CONTROLS_KEY_PREFIX = "pulsantiera_controls_s";
const SERATA_ACCESS_KEY = "pulsantiera_serata_access";
const LIVE_SERATA_HINT_KEY = "pulsantiera_live_serata_hint";
const FIREBASE_CONFIG = window.FIREBASE_CONFIG || null;
const ADMIN_CONTROLS_COLLECTION = "admin_controls";
const ADMIN_SERATA_ACCESS_DOC = "serata_access";
const ADMINS_COLLECTION = "admins";

const PREDICTION_FIELDS = [
  { id: "predPreShowPodium1", label: "Pre-show · Podio #1" },
  { id: "predPreShowPodium2", label: "Pre-show · Podio #2" },
  { id: "predPreShowPodium3", label: "Pre-show · Podio #3" },
  { id: "predPreShowLast", label: "Pre-show · Ultimo" },
  { id: "predPreShowFree1", label: "Pre-show · Libera 1" },
  { id: "predPreShowFree2", label: "Pre-show · Libera 2" },
  { id: "predPreShowFree3", label: "Pre-show · Libera 3" },
  { id: "predPreRankingPodium1", label: "Pre-classifica · Podio #1" },
  { id: "predPreRankingPodium2", label: "Pre-classifica · Podio #2" },
  { id: "predPreRankingPodium3", label: "Pre-classifica · Podio #3" },
  { id: "predPreRankingLast", label: "Pre-classifica · Ultimo" },
  { id: "predPreRankingFree1", label: "Pre-classifica · Libera 1" },
  { id: "predPreRankingFree2", label: "Pre-classifica · Libera 2" },
  { id: "predPreRankingFree3", label: "Pre-classifica · Libera 3" },
  { id: "predFinalePodium1", label: "Finale · Podio #1" },
  { id: "predFinalePodium2", label: "Finale · Podio #2" },
  { id: "predFinalePodium3", label: "Finale · Podio #3" },
  { id: "predFinaleLast", label: "Finale · Ultimo" },
  { id: "predFinaleFree1", label: "Finale · Libera 1" },
  { id: "predFinaleFree2", label: "Finale · Libera 2" },
  { id: "predFinaleFree3", label: "Finale · Libera 3" },
];

const accessDenied = document.querySelector("#accessDenied");
const btnGoLogin = document.querySelector("#btnGoLogin");
const adminAuthForm = document.querySelector("#adminAuthForm");
const adminEmailInput = document.querySelector("#adminEmailInput");
const adminPasswordInput = document.querySelector("#adminPasswordInput");
const controlsPanel = document.querySelector("#controlsPanel");
const serataAccessPanel = document.querySelector("#serataAccessPanel");
const artistControlsPanel = document.querySelector("#artistControlsPanel");
const predictionControlsPanel = document.querySelector("#predictionControlsPanel");
const artistControlsList = document.querySelector("#artistControlsList");
const predictionControlsList = document.querySelector("#predictionControlsList");
const btnArtistsAllOn = document.querySelector("#btnArtistsAllOn");
const btnArtistsAllOff = document.querySelector("#btnArtistsAllOff");
const btnPredAllOn = document.querySelector("#btnPredAllOn");
const btnPredAllOff = document.querySelector("#btnPredAllOff");
const toggleQuick = document.querySelector("#toggleQuick");
const toggleDeep = document.querySelector("#toggleDeep");
const togglePredictions = document.querySelector("#togglePredictions");
const toggleRecap = document.querySelector("#toggleRecap");
const toggleLiveSerataHint = document.querySelector("#toggleLiveSerataHint");
const liveHintSerataSelect = document.querySelector("#liveHintSerataSelect");
const btnSerateAllOn = document.querySelector("#btnSerateAllOn");
const btnSerateAllOff = document.querySelector("#btnSerateAllOff");
const btnSaveControls = document.querySelector("#btnSaveControls");
const btnBackApp = document.querySelector("#btnBackApp");
const panelMeta = document.querySelector("#panelMeta");
const adminStatus = document.querySelector("#adminStatus");
const adminSerataSelect = document.querySelector("#adminSerataSelect");
const btnAdminPrevSerata = document.querySelector("#btnAdminPrevSerata");
const btnAdminNextSerata = document.querySelector("#btnAdminNextSerata");

let profile = null;
let unlocked = false;
let artists = [];
let selectedSerata = "1";

const cloud = {
  ready: false,
  auth: null,
  db: null,
  uid: "",
  isAdmin: false,
  authError: "",
};

function setStatus(msg){
  adminStatus.textContent = msg || "";
}

function goLogin(){ window.location.href = "./login.html"; }
function goApp(){ window.location.href = "./index.html"; }
function keyForSerata(serata){ return `${ADMIN_CONTROLS_KEY_PREFIX}${String(serata || "0")}`; }
function artistKey(name){ return String(name || "").trim().toLowerCase(); }
function now(){ return Date.now(); }

function defaultSerataAccess(){
  return { "1": true, "2": true, "3": true, "4": true, "5": true };
}

function defaultControls(){
  return {
    quickEnabled: true,
    deepEnabled: true,
    predictionsEnabled: true,
    recapEnabled: true,
    deepArtists: {},
    predictionFields: {},
    updatedAtMs: 0,
    updatedByUsername: ADMIN_USERNAME,
  };
}

function defaultLiveSerataHint(){
  return { enabled: false, serata: "1" };
}

function normalizeControls(raw){
  const parsed = raw && typeof raw === "object" ? raw : {};
  return {
    ...defaultControls(),
    ...parsed,
    quickEnabled: parsed?.quickEnabled !== false,
    deepEnabled: parsed?.deepEnabled !== false,
    predictionsEnabled: parsed?.predictionsEnabled !== false,
    recapEnabled: parsed?.recapEnabled !== false,
    deepArtists: parsed?.deepArtists && typeof parsed.deepArtists === "object" ? parsed.deepArtists : {},
    predictionFields: parsed?.predictionFields && typeof parsed.predictionFields === "object" ? parsed.predictionFields : {},
    updatedAtMs: Number(parsed?.updatedAtMs || 0),
    updatedByUsername: String(parsed?.updatedByUsername || ADMIN_USERNAME),
  };
}

function loadControlsLocal(serata){
  try{
    const raw = localStorage.getItem(keyForSerata(serata));
    if(!raw) return defaultControls();
    return normalizeControls(JSON.parse(raw));
  } catch {
    return defaultControls();
  }
}

function saveControlsLocal(serata, controls){
  const payload = normalizeControls({
    ...controls,
    updatedAtMs: now(),
    updatedByUsername: ADMIN_USERNAME,
  });
  localStorage.setItem(keyForSerata(serata), JSON.stringify(payload));
  return payload;
}

function loadSerataAccessLocal(){
  try{
    const raw = localStorage.getItem(SERATA_ACCESS_KEY);
    if(!raw) return defaultSerataAccess();
    const parsed = JSON.parse(raw);
    const base = defaultSerataAccess();
    for(const k of Object.keys(base)) base[k] = parsed?.[k] !== false;
    return base;
  } catch {
    return defaultSerataAccess();
  }
}

function saveSerataAccessLocal(access){
  const base = defaultSerataAccess();
  for(const k of Object.keys(base)) base[k] = access?.[k] !== false;
  localStorage.setItem(SERATA_ACCESS_KEY, JSON.stringify(base));
  return base;
}

function clampSerata(value){
  const n = Number(value);
  if(!Number.isFinite(n)) return "1";
  return String(Math.max(1, Math.min(5, Math.round(n))));
}

function loadLiveSerataHintLocal(){
  try{
    const raw = localStorage.getItem(LIVE_SERATA_HINT_KEY);
    if(!raw) return defaultLiveSerataHint();
    const parsed = JSON.parse(raw);
    return {
      enabled: !!parsed?.enabled,
      serata: clampSerata(parsed?.serata || "1"),
    };
  } catch {
    return defaultLiveSerataHint();
  }
}

function saveLiveSerataHintLocal(input){
  const payload = {
    enabled: !!input?.enabled,
    serata: clampSerata(input?.serata || "1"),
  };
  localStorage.setItem(LIVE_SERATA_HINT_KEY, JSON.stringify(payload));
  return payload;
}

function updateSerataPickerUI(){
  const s = clampSerata(selectedSerata);
  selectedSerata = s;
  if(adminSerataSelect) adminSerataSelect.value = s;
  const sn = Number(s);
  if(btnAdminPrevSerata) btnAdminPrevSerata.disabled = sn <= 1;
  if(btnAdminNextSerata) btnAdminNextSerata.disabled = sn >= 5;
}

function controlsDocRef(serata){
  if(!cloud.ready || !cloud.db) return null;
  return cloud.db.collection(ADMIN_CONTROLS_COLLECTION).doc(`s${String(serata || "0")}`);
}

function serataAccessDocRef(){
  if(!cloud.ready || !cloud.db) return null;
  return cloud.db.collection(ADMIN_CONTROLS_COLLECTION).doc(ADMIN_SERATA_ACCESS_DOC);
}

async function initFirebase(){
  if(!FIREBASE_CONFIG || !FIREBASE_CONFIG.apiKey || typeof window.firebase === "undefined") return false;
  try{
    if(!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
    cloud.auth = window.firebase.auth();
    cloud.db = window.firebase.firestore();
    cloud.ready = true;
    return true;
  } catch (err){
    console.warn("Firebase init admin fallita:", err);
    return false;
  }
}

async function ensureAuthUser(){
  if(!cloud.ready || !cloud.auth) return "";
  const current = cloud.auth.currentUser;
  if(current){ cloud.authError = ""; return current.uid; }
  cloud.authError = "no-auth-user";
  return "";
}

async function signInAdmin(email, password){
  if(!cloud.ready || !cloud.auth) return "";
  try{
    const cred = await cloud.auth.signInWithEmailAndPassword(String(email || "").trim(), String(password || ""));
    const uid = cred?.user?.uid || "";
    cloud.authError = "";
    return uid;
  } catch (err){
    cloud.authError = String(err?.code || err?.message || "auth-failed");
    return "";
  }
}

async function checkAdminRole(){
  if(!cloud.ready || !cloud.db) return false;
  const uid = cloud.uid || await ensureAuthUser();
  cloud.uid = uid || "";
  if(!cloud.uid) return false;
  try{
    const snap = await cloud.db.collection(ADMINS_COLLECTION).doc(cloud.uid).get();
    cloud.isAdmin = !!(snap.exists && snap.data()?.enabled === true);
    return cloud.isAdmin;
  } catch (err){
    console.warn("checkAdminRole fail", err);
    cloud.isAdmin = false;
    return false;
  }
}

async function loadControlsCloud(serata){
  const ref = controlsDocRef(serata);
  if(!ref) return null;
  try{
    const snap = await ref.get();
    if(!snap.exists) return null;
    return normalizeControls(snap.data() || {});
  } catch (err){
    console.warn("loadControlsCloud fail", err);
    return null;
  }
}

async function saveControlsCloud(serata, controls){
  const ref = controlsDocRef(serata);
  if(!ref) return false;
  try{
    const liveHint = loadLiveSerataHintLocal();
    await ref.set({
      ...normalizeControls(controls),
      liveHint: {
        enabled: !!liveHint.enabled,
        serata: clampSerata(liveHint.serata || "1"),
      },
      serata: String(serata),
      updatedAtMs: now(),
      updatedByUsername: ADMIN_USERNAME,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err){
    console.warn("saveControlsCloud fail", err);
    return false;
  }
}

async function loadSerataAccessCloud(){
  const ref = serataAccessDocRef();
  if(!ref) return null;
  try{
    const snap = await ref.get();
    if(!snap.exists) return null;
    const data = snap.data() || {};
    const base = defaultSerataAccess();
    for(const k of Object.keys(base)) base[k] = data?.access?.[k] !== false;
    return base;
  } catch (err){
    console.warn("loadSerataAccessCloud fail", err);
    return null;
  }
}

async function saveSerataAccessCloud(access, liveHintInput = null){
  const ref = serataAccessDocRef();
  if(!ref) return false;
  try{
    const payload = saveSerataAccessLocal(access);
    const liveHint = liveHintInput
      ? saveLiveSerataHintLocal(liveHintInput)
      : loadLiveSerataHintLocal();
    await ref.set({
      access: payload,
      liveHint: {
        enabled: !!liveHint.enabled,
        serata: clampSerata(liveHint.serata || "1"),
      },
      updatedAtMs: now(),
      updatedByUsername: ADMIN_USERNAME,
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (err){
    console.warn("saveSerataAccessCloud fail", err);
    return false;
  }
}

async function loadLiveSerataHintCloud(){
  const ref = serataAccessDocRef();
  if(!ref) return null;
  try{
    const snap = await ref.get();
    if(!snap.exists) return null;
    const src = snap.data()?.liveHint || {};
    return {
      enabled: !!src?.enabled,
      serata: clampSerata(src?.serata || "1"),
    };
  } catch (err){
    console.warn("loadLiveSerataHintCloud fail", err);
    return null;
  }
}

async function loadArtistsForSerata(serata){
  const candidates = [
    `./assets/artists_serata${serata}.json`,
    `./artists_serata${serata}.json`,
    "./assets/artists.json",
    "./artists.json",
  ];
  for(const path of candidates){
    try{
      const res = await fetch(path, { cache: "no-store" });
      if(!res.ok) continue;
      const payload = await res.json();
      const arr = Array.isArray(payload) ? payload : (Array.isArray(payload?.artists) ? payload.artists : []);
      const list = arr
        .map((x) => typeof x === "string" ? x : (x?.name || x?.artist || ""))
        .map((x) => String(x || "").trim())
        .filter(Boolean);
      if(list.length){ artists = [...new Set(list)]; return; }
    } catch {}
  }
  artists = [];
}

function renderArtistControls(controls){
  if(!artistControlsList) return;
  if(artists.length === 0){
    artistControlsList.innerHTML = `<div class="muted small">Nessun artista trovato per la serata corrente.</div>`;
    return;
  }
  artistControlsList.innerHTML = artists.map((name) => {
    const key = artistKey(name);
    const checked = controls.deepArtists?.[key] !== false ? "checked" : "";
    return `
      <label class="item">
        <div class="meta"><div class="title">${name}</div></div>
        <input type="checkbox" data-artist-key="${key}" ${checked} />
      </label>
    `;
  }).join("");
}

function renderPredictionControls(controls){
  if(!predictionControlsList) return;
  predictionControlsList.innerHTML = PREDICTION_FIELDS.map((f) => {
    const checked = controls.predictionFields?.[f.id] !== false ? "checked" : "";
    return `
      <label class="item">
        <div class="meta"><div class="title">${f.label}</div></div>
        <input type="checkbox" data-pred-id="${f.id}" ${checked} />
      </label>
    `;
  }).join("");
}

function collectControlsFromUI(base){
  const deepArtists = { ...(base?.deepArtists || {}) };
  artistControlsList?.querySelectorAll("input[data-artist-key]").forEach((input) => {
    deepArtists[input.dataset.artistKey] = !!input.checked;
  });
  const predictionFields = { ...(base?.predictionFields || {}) };
  predictionControlsList?.querySelectorAll("input[data-pred-id]").forEach((input) => {
    predictionFields[input.dataset.predId] = !!input.checked;
  });
  return normalizeControls({
    ...base,
    quickEnabled: !!toggleQuick.checked,
    deepEnabled: !!toggleDeep.checked,
    predictionsEnabled: !!togglePredictions.checked,
    recapEnabled: !!toggleRecap.checked,
    deepArtists,
    predictionFields,
    updatedAtMs: now(),
    updatedByUsername: ADMIN_USERNAME,
  });
}

async function renderControls(){
  updateSerataPickerUI();
  let c = loadControlsLocal(selectedSerata);
  const fromCloud = await loadControlsCloud(selectedSerata);
  if(fromCloud){
    c = fromCloud;
    saveControlsLocal(selectedSerata, c);
  }

  toggleQuick.checked = c.quickEnabled !== false;
  toggleDeep.checked = c.deepEnabled !== false;
  togglePredictions.checked = c.predictionsEnabled !== false;
  toggleRecap.checked = c.recapEnabled !== false;
  const liveLocal = loadLiveSerataHintLocal();
  const liveCloud = await loadLiveSerataHintCloud();
  const liveFromControls = c?.liveHint && typeof c.liveHint === "object"
    ? { enabled: !!c.liveHint.enabled, serata: clampSerata(c.liveHint.serata || "1") }
    : null;
  const liveHint = liveCloud || liveFromControls || liveLocal;
  saveLiveSerataHintLocal(liveHint);
  if(toggleLiveSerataHint) toggleLiveSerataHint.checked = !!liveHint.enabled;
  if(liveHintSerataSelect) liveHintSerataSelect.value = clampSerata(liveHint.serata);
  panelMeta.textContent = `Utente: ${profile.username} · Modifica Serata ${selectedSerata}`;

  await loadArtistsForSerata(selectedSerata);
  renderArtistControls(c);
  renderPredictionControls(c);

  let access = loadSerataAccessLocal();
  const accessCloud = await loadSerataAccessCloud();
  if(accessCloud){
    access = accessCloud;
    saveSerataAccessLocal(access);
  }
  document.querySelectorAll("input[data-serata-access]").forEach((input) => {
    const s = String(input.getAttribute("data-serata-access") || "");
    input.checked = access[s] !== false;
  });
}

function showDenied(){
  adminAuthForm.style.display = "none";
  controlsPanel.style.display = "none";
  serataAccessPanel.style.display = "none";
  artistControlsPanel.style.display = "none";
  predictionControlsPanel.style.display = "none";
  accessDenied.style.display = "block";
  setStatus("Solo pulsantiera_admin può accedere a questa pagina.");
}

function showPasswordGate(){
  accessDenied.style.display = "none";
  controlsPanel.style.display = "none";
  serataAccessPanel.style.display = "none";
  artistControlsPanel.style.display = "none";
  predictionControlsPanel.style.display = "none";
  adminAuthForm.style.display = "flex";
  setStatus("Accedi con credenziali admin Firebase.");
}

async function showControls(){
  adminAuthForm.style.display = "none";
  accessDenied.style.display = "none";
  controlsPanel.style.display = "block";
  serataAccessPanel.style.display = "block";
  artistControlsPanel.style.display = "block";
  predictionControlsPanel.style.display = "block";

  const ok = await initFirebase();
  if(!ok){
    setStatus("Firebase non disponibile. Accesso admin non verificabile.");
    return;
  }
  const uid = await ensureAuthUser();
  if(!uid){
    setStatus(`Auth Firebase fallita (${cloud.authError || "auth"}).`);
    return;
  }
  cloud.uid = uid;
  if(!cloud.isAdmin){
    const roleOk = await checkAdminRole();
    if(!roleOk){
      unlocked = false;
      showDenied();
      setStatus("UID non abilitato come admin su Firebase.");
      return;
    }
  }

  selectedSerata = clampSerata(selectedSerata || profile?.serata || "1");
  await renderControls();
  if(cloud.ready && cloud.uid) setStatus("Modifica le opzioni e salva (sync cloud attivo).");
}

function loadSessionProfile(){
  try{
    const raw = localStorage.getItem(SESSION_KEY);
    if(!raw) return null;
    const p = JSON.parse(raw);
    const username = String(p?.username || "").trim();
    const serata = String(p?.serata || "").trim();
    if(!/^[a-zA-Z0-9_-]{2,24}$/.test(username)) return null;
    if(!/^[1-5]$/.test(serata)) return null;
    return { username, serata };
  } catch {
    return null;
  }
}

adminAuthForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const ok = await initFirebase();
  if(!ok){
    unlocked = false;
    setStatus("Firebase non disponibile: impossibile fare login admin.");
    return;
  }
  const email = String(adminEmailInput?.value || "").trim();
  const password = String(adminPasswordInput?.value || "");
  if(!email || !password){
    unlocked = false;
    setStatus("Inserisci email e password admin.");
    return;
  }
  const uid = await signInAdmin(email, password);
  if(!uid){
    unlocked = false;
    setStatus(`Login admin fallito (${cloud.authError || "auth"}).`);
    return;
  }
  cloud.uid = uid;
  const isAdmin = await checkAdminRole();
  if(!isAdmin){
    unlocked = false;
    showDenied();
    setStatus("Questo account non è presente in /admins con enabled=true.");
    return;
  }
  unlocked = true;
  await showControls();
});

btnSaveControls?.addEventListener("click", async () => {
  if(!unlocked || !profile) return;

  const serataTarget = clampSerata(selectedSerata);
  const current = loadControlsLocal(serataTarget);
  const next = collectControlsFromUI(current);
  saveControlsLocal(serataTarget, next);

  const access = {};
  document.querySelectorAll("input[data-serata-access]").forEach((input) => {
    access[input.dataset.serataAccess] = !!input.checked;
  });
  saveSerataAccessLocal(access);
  const liveHint = {
    enabled: !!toggleLiveSerataHint?.checked,
    serata: clampSerata(liveHintSerataSelect?.value || selectedSerata),
  };
  saveLiveSerataHintLocal(liveHint);

  let cloudOk = true;
  if(cloud.ready && cloud.uid){
    const [okControls, okAccess] = await Promise.all([
      saveControlsCloud(serataTarget, next),
      saveSerataAccessCloud(access, liveHint),
    ]);
    cloudOk = okControls && okAccess;
  }

  setStatus(cloudOk
    ? `Impostazioni Serata ${serataTarget} salvate (locale + cloud).`
    : `Impostazioni Serata ${serataTarget} salvate in locale; sync cloud non riuscito.`);
});

btnArtistsAllOn?.addEventListener("click", () => {
  artistControlsList?.querySelectorAll("input[data-artist-key]").forEach((input) => { input.checked = true; });
});
btnArtistsAllOff?.addEventListener("click", () => {
  artistControlsList?.querySelectorAll("input[data-artist-key]").forEach((input) => { input.checked = false; });
});
btnPredAllOn?.addEventListener("click", () => {
  predictionControlsList?.querySelectorAll("input[data-pred-id]").forEach((input) => { input.checked = true; });
});
btnPredAllOff?.addEventListener("click", () => {
  predictionControlsList?.querySelectorAll("input[data-pred-id]").forEach((input) => { input.checked = false; });
});
adminSerataSelect?.addEventListener("change", async () => {
  selectedSerata = clampSerata(adminSerataSelect.value || selectedSerata);
  await renderControls();
});
btnAdminPrevSerata?.addEventListener("click", async () => {
  selectedSerata = clampSerata(Number(selectedSerata) - 1);
  await renderControls();
});
btnAdminNextSerata?.addEventListener("click", async () => {
  selectedSerata = clampSerata(Number(selectedSerata) + 1);
  await renderControls();
});
btnSerateAllOn?.addEventListener("click", () => {
  document.querySelectorAll("input[data-serata-access]").forEach((input) => { input.checked = true; });
});
btnSerateAllOff?.addEventListener("click", () => {
  document.querySelectorAll("input[data-serata-access]").forEach((input) => { input.checked = false; });
});

btnGoLogin?.addEventListener("click", goLogin);
btnBackApp?.addEventListener("click", goApp);

function boot(){
  profile = loadSessionProfile();
  if(!profile || profile.username !== ADMIN_USERNAME){
    showDenied();
    return;
  }
  selectedSerata = clampSerata(profile.serata);
  updateSerataPickerUI();
  showPasswordGate();
}

boot();
