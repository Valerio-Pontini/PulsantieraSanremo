const SESSION_KEY = "pulsantiera_session";
const LAST_PROFILE_KEY = "pulsantiera_last_profile";
const SERATA_ACCESS_KEY = "pulsantiera_serata_access";
const LOGIN_NOTICE_KEY = "pulsantiera_login_notice";
const ADMIN_USERNAME = "pulsantiera_admin";
const FIREBASE_CONFIG = window.FIREBASE_CONFIG || null;

const loginForm = document.querySelector("#loginForm");
const usernameInput = document.querySelector("#usernameInput");
const serataSelect = document.querySelector("#serataSelect");
const authStatus = document.querySelector("#authStatus");
const submitBtn = loginForm.querySelector("button[type='submit']");

function setStatus(msg){
  authStatus.textContent = msg || "";
}

function isValidUsername(v){
  return /^[a-zA-Z0-9_-]{2,24}$/.test(v);
}

function normalizeUsername(v){
  return String(v || "").trim();
}

function isFirebaseReady(){
  return !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && window.firebase);
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

function applySerataAccessOptions(){
  if(!serataSelect) return;
  const access = loadSerataAccess();
  const options = [...serataSelect.querySelectorAll("option")];
  let firstEnabled = "";
  for(const opt of options){
    const s = String(opt.value || "");
    const enabled = access[s] !== false;
    opt.disabled = !enabled;
    if(enabled && !firstEnabled) firstEnabled = s;
  }
  if(!firstEnabled){
    if(!/^[1-5]$/.test(String(serataSelect.value || ""))){
      serataSelect.value = "3";
    }
    submitBtn.disabled = false;
    setStatus("Nessuna serata disponibile: accesso utenti bloccato finché l'admin non riapre almeno una serata.");
    return;
  }
  submitBtn.disabled = false;
  if(!access[String(serataSelect.value || "")]){
    serataSelect.value = firstEnabled;
  }
}

function consumeLoginNotice(){
  try{
    const msg = localStorage.getItem(LOGIN_NOTICE_KEY);
    if(!msg) return;
    localStorage.removeItem(LOGIN_NOTICE_KEY);
    setStatus(String(msg));
  } catch {}
}

async function authenticateAnonymously(){
  if(!isFirebaseReady()) return { uid: "", mode: "local" };
  try{
    if(!window.firebase.apps.length){
      window.firebase.initializeApp(FIREBASE_CONFIG);
    }
    const auth = window.firebase.auth();
    const user = auth.currentUser || (await auth.signInAnonymously()).user;
    return { uid: user?.uid || "", mode: "firebase" };
  } catch (err){
    console.warn("Login Firebase anonimo fallito:", err);
    return { uid: "", mode: "local" };
  }
}

function prefillLastProfile(){
  try{
    const raw = localStorage.getItem(LAST_PROFILE_KEY);
    if(!raw) return;
    const last = JSON.parse(raw);
    if(last.username) usernameInput.value = String(last.username);
    if(last.serata && /^[1-5]$/.test(String(last.serata))) serataSelect.value = String(last.serata);
  } catch {}
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = normalizeUsername(usernameInput.value || "");
  const serata = String(serataSelect.value || "").trim();

  if(!isValidUsername(username)){
    setStatus("Username valido: 2-24 caratteri (lettere, numeri, _ -).");
    return;
  }
  if(!/^[1-5]$/.test(serata)){
    setStatus("Scegli una serata valida (1-5).");
    return;
  }
  const access = loadSerataAccess();
  if(access[serata] === false && username !== ADMIN_USERNAME){
    setStatus(`La serata ${serata} è momentaneamente disabilitata dall'admin.`);
    return;
  }

  submitBtn.disabled = true;
  setStatus("Accesso in corso...");

  const authResult = await authenticateAnonymously();
  const profile = { username, serata, uid: authResult.uid || "", loginAt: Date.now() };
  try{
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    localStorage.setItem(LAST_PROFILE_KEY, JSON.stringify({ username, serata }));
  } catch {}

  if(authResult.mode === "local"){
    setStatus("Firebase non disponibile: modalità locale.");
  }
  window.location.href = "./index.html";
});

prefillLastProfile();
applySerataAccessOptions();
consumeLoginNotice();
if(!authStatus.textContent){
  setStatus("Inserisci username e scegli la serata per iniziare.");
}

window.addEventListener("storage", (ev) => {
  if(ev.key === SERATA_ACCESS_KEY){
    applySerataAccessOptions();
  }
});
