// ========================================================================
// FIREBASE CONFIG
// ========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCl9xOzUawqggpwyZQupGYm67RiWT42b7A",
  authDomain: "lol-messenger-76286.firebaseapp.com",
  projectId: "lol-messenger-76286",
  storageBucket: "lol-messenger-76286.firebasestorage.app",
  messagingSenderId: "573143866457",
  appId: "1:573143866457:web:fb7ed67ea66848e6da2548",
  vapidKey: "BJupW7z5tXhbCnLoTrbJNTrnzYtzJvbBxcRqe5GF5Gl_a1cin_paSM19yWBXq6W5DV_wY3Fl1352IOs5aR8lDFk"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ========================================================================
// CLOUDINARY CONFIG
// ========================================================================
const CLOUDINARY = {
  cloudName: 'kwfqxp7l',
  uploadPreset: 'lol_music',
  apiKey: '837936676864173'
};

// ========================================================================
// HELPERS
// ========================================================================
const $ = (id) => document.getElementById(id);
const now = () => Date.now();
const pad2 = (n) => String(n).padStart(2, "0");
const fmtTime = (ms) => { const d = new Date(ms); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const daysOfWeek = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const defaultAvatar = "data:image/svg+xml;base64," + btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs><rect width="256" height="256" rx="80" fill="url(#g)"/><circle cx="128" cy="104" r="44" fill="rgba(255,255,255,.85)"/><path d="M48 218c18-44 54-66 80-66s62 22 80 66" fill="rgba(255,255,255,.78)"/></svg>`);

function escapeHtml(str) { return (str ?? "").toString().replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }

function getStatusInline(user) {
  if (!user) return '';
  if (user.selectedStatus === 'star' && user.star) {
    return '<span class="status-inline">⭐️</span>';
  } else if (user.selectedStatus && user.customItems && user.customItems.includes(user.selectedStatus)) {
    const item = itemsCache.get(user.selectedStatus);
    if (item) {
      if (item.iconType === 'image') {
        return `<span class="status-inline"><img src="${item.icon}" style="width:18px;height:18px;border-radius:4px;"></span>`;
      } else {
        return `<span class="status-inline">${item.icon}</span>`;
      }
    }
  }
  return '';
}

function getVerifiedBadge(user) {
  if (!user) return '';
  if (user.role === 'creator') {
    return '<span class="verified-badge purple">✓</span>';
  } else if (user.verified === true) {
    return '<span class="verified-badge blue">✓</span>';
  }
  return '';
}

function getGroupVerifiedBadge(groupData) {
  if (!groupData) return '';
  if (groupData.verified === true || groupData.groupVerified === true) {
    return '<span class="verified-badge white">✓</span>';
  }
  return '';
}

function randId(prefix = "u") { return prefix + "_" + Math.random().toString(36).slice(2) + "_" + Math.random().toString(36).slice(2); }

async function sha256Hex(text) {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(hash));
  return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function uploadAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.background = type === 'success' ? '#15803d' : type === 'error' ? '#b91c1c' : '#1e293b';
  toast.textContent = (type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : 'ℹ️ ') + message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function showScreen(id) {
  ["scr-auth","scr-chats","scr-search","scr-chat","scr-profile","scr-about","scr-balance","scr-group-create","scr-group-info","scr-player"].forEach(x => $(x).classList.remove("active"));
  $(id).classList.add("active");
  $("composer").style.display = (id === "scr-chat") ? "flex" : "none";
  if (id !== "scr-chat") closeStickerPanel();
  if (id === "scr-auth") $("bottomNav").classList.add("hidden");
  else $("bottomNav").classList.remove("hidden");
  if (id === "scr-balance") { updateBalanceScreen(); updatePromoStats(); loadShopItems(); updateSellSection(); updateStatusSelect(); }
}

function setMsg(el, text, kind) { el.className = (kind === "ok") ? "ok" : "err"; el.textContent = text; el.classList.remove("hidden"); }
function clearMsg(el) { el.textContent = ""; el.classList.add("hidden"); }

function isOnline(u) {
  if (!u) return false;
  const ls = u.lastSeen || 0;
  const diffSeconds = (now() - ls) / 1000;
  if (diffSeconds < 0) return false;
  return diffSeconds < 30;
}

function getLastSeenText(lastSeen) {
  if (!lastSeen) return '⚫ оффлайн';
  const nowDate = new Date();
  const lastDate = new Date(lastSeen);
  const diffDays = Math.floor((nowDate - lastDate) / (1000 * 60 * 60 * 24));
  const timeStr = fmtTime(lastSeen);
  if (diffDays === 0) return `Был(а) в ${timeStr}`;
  else if (diffDays < 7) return `Был(а) в ${daysOfWeek[lastDate.getDay()]} в ${timeStr}`;
  else return `Был(а) ${lastDate.getDate()}.${lastDate.getMonth()+1} в ${timeStr}`;
}

function onlineText(u) {
  if (!u) return '⚫ оффлайн';
  if (isOnline(u)) return '🟢 онлайн';
  return getLastSeenText(u.lastSeen);
}

// ========================================================================
// SESSION
// ========================================================================
function saveSession(sessionData) {
  if (!sessionData || !sessionData.uid) return;
  localStorage.setItem("lol_session", JSON.stringify({ uid: sessionData.uid, login: sessionData.login, savedAt: Date.now() }));
}

function loadSession() {
  try {
    const saved = localStorage.getItem("lol_session");
    if (!saved) return null;
    const s = JSON.parse(saved);
    if (s && s.uid && s.login) {
      if (s.savedAt && (Date.now() - s.savedAt) > 30 * 24 * 60 * 60 * 1000) { clearSession(); return null; }
      return { uid: s.uid, login: s.login };
    }
    return null;
  } catch (e) { return null; }
}

function clearSession() { localStorage.removeItem("lol_session"); localStorage.removeItem("lol_me"); }
function cacheMe(meData) { if (meData && meData.uid) { localStorage.setItem("lol_me", JSON.stringify({ ...meData, _cachedAt: Date.now() })); } }

// ========================================================================
// STATE
// ========================================================================
let session = null;
let me = null;
let usersCache = new Map();
let itemsCache = new Map();
let overridesCache = new Map();
let selectedSellItems = new Set();
let peer = null;
let currentChatId = null;
let currentChatIsGroup = false;
let currentGroup = null;
let groupPermissions = { canEdit: true, canSend: true };
let unsubChatList = null;
let unsubMsgs = null;
let unsubPeer = null;
let heartbeatTimer = null;
let typingTimer = null;
let typingClearTimer = null;
let isBlocked = false;
let muteTargetId = null;
let muteTimers = new Map();
let selectedMembersForGroup = new Set();
let selectedAddMembers = new Set();
let stickerPanelOpen = false;
let userStickers = [];
let cleanInterval = null;
let unreadCounts = new Map();

// ========================================================================
// PLAYER STATE
// ========================================================================
let playerTracks = [];
let currentTrackId = null;
let audio = new Audio();
let isPlaying = false;
let editTrackId = null;
let tempCoverData = null;

// ========================================================================
// AUTH UI
// ========================================================================
let authMode = "login";

function setAuthMode(mode) {
  authMode = mode;
  const regExtra = $("regExtra");
  if (regExtra) regExtra.classList.toggle("hidden", mode !== "reg");
  const authBtn = $("authBtn");
  if (authBtn) authBtn.textContent = mode === "login" ? "Войти" : "Создать аккаунт";
  clearMsg($("authMsg"));
}

const authBar = document.getElementById('authTabbar'), authPill = document.getElementById('authPill'), authTabs = [...authBar.querySelectorAll('.auth-tab')];
let authHolding = false;

function waterOnAuth() { authBar.classList.add('is-water'); }
function waterOffAuth() { authBar.classList.remove('is-water'); }
function setActiveAuth(i) { authTabs.forEach(t => t.classList.remove('active')); authTabs[i].classList.add('active'); setAuthMode(i === 0 ? "login" : "reg"); }
function indexFromXAuth(x) { const r = authBar.getBoundingClientRect(); const rel = Math.min(Math.max(x - r.left, 0), r.width); return rel < r.width / 2 ? 0 : 1; }
function moveAuth(i) { const br = authBar.getBoundingClientRect(); const tr = authTabs[i].getBoundingClientRect(); authPill.style.setProperty('--x', (tr.left - br.left - 6) + 'px'); }

authBar.addEventListener('pointerdown', e => { authHolding = true; waterOnAuth(); moveAuth(indexFromXAuth(e.clientX)); });
authBar.addEventListener('pointermove', e => { if (!authHolding) return; moveAuth(indexFromXAuth(e.clientX)); });
authBar.addEventListener('pointerup', e => { if (!authHolding) return; authHolding = false; const i = indexFromXAuth(e.clientX); setActiveAuth(i); moveAuth(i); waterOffAuth(); });
authTabs.forEach((t, i) => { t.addEventListener('click', () => { setActiveAuth(i); moveAuth(i); }); });
moveAuth(0);
$("regAvatarPreview").src = defaultAvatar;

function bindAvatarInput(fileEl, imgEl) {
  fileEl.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { imgEl.src = ev.target.result; };
    r.readAsDataURL(f);
  });
}
bindAvatarInput($("regAvatarFile"), $("regAvatarPreview"));
bindAvatarInput($("editAvatarFile"), $("editAvatarPreview"));

// ========================================================================
// MAIN NAVIGATION
// ========================================================================
function setMainTab(tab) {
  const mainTabs = document.querySelectorAll('.main-tab');
  mainTabs.forEach(t => t.classList.remove('active'));
  if (tab === 'chats') { mainTabs[0].classList.add('active'); showScreen('scr-chats'); }
  else if (tab === 'profile') { mainTabs[1].classList.add('active'); showScreen('scr-profile'); }
  updateMainPillPosition(tab);
}

function updateMainPillPosition(tab) {
  const bar = document.getElementById('mainTabbar'), pill = document.getElementById('mainPill'), tabs = document.querySelectorAll('.main-tab');
  const activeIndex = tab === 'chats' ? 0 : 1;
  const barRect = bar.getBoundingClientRect(), tabRect = tabs[activeIndex].getBoundingClientRect();
  pill.style.setProperty('--x', `${tabRect.left - barRect.left - 7}px`);
}

const mainBar = document.getElementById('mainTabbar'), mainPill = document.getElementById('mainPill'), mainTabs = document.querySelectorAll('.main-tab');
let mainHolding = false;

function waterOnMain() { mainBar.classList.add('is-water'); }
function waterOffMain() { mainBar.classList.remove('is-water'); }
function setActiveMain(i) { mainTabs.forEach(t => t.classList.remove('active')); mainTabs[i].classList.add('active'); setMainTab(i === 0 ? 'chats' : 'profile'); }
function indexFromXMain(x) { const r = mainBar.getBoundingClientRect(); const rel = Math.min(Math.max(x - r.left, 0), r.width); return rel < r.width / 2 ? 0 : 1; }
function moveMain(i) { const br = mainBar.getBoundingClientRect(); const tr = mainTabs[i].getBoundingClientRect(); mainPill.style.setProperty('--x', (tr.left - br.left - 7) + 'px'); }

mainBar.addEventListener('pointerdown', e => { mainHolding = true; waterOnMain(); moveMain(indexFromXMain(e.clientX)); });
mainBar.addEventListener('pointermove', e => { if (!mainHolding) return; moveMain(indexFromXMain(e.clientX)); });
mainBar.addEventListener('pointerup', e => { if (!mainHolding) return; mainHolding = false; const i = indexFromXMain(e.clientX); setActiveMain(i); moveMain(i); waterOffMain(); });
mainTabs.forEach((t, i) => { t.addEventListener('click', () => { setActiveMain(i); moveMain(i); }); });
moveMain(0);

document.getElementById('searchButton').addEventListener('click', () => { showScreen('scr-search'); setTimeout(() => { const searchInput = document.getElementById('searchInput'); if (searchInput) searchInput.focus(); }, 100); });

// ========================================================================
// AUTH
// ========================================================================
$("authBtn").addEventListener("click", async () => {
  clearMsg($("authMsg"));
  const login = $("loginLogin").value.trim();
  const pass = $("loginPass").value;
  if (!login || !pass) { return setMsg($("authMsg"), "Заполни логин и пароль.", "err"); }
  try {
    if (authMode === "reg") {
      const nick = $("regNick").value.trim();
      const phone = $("regPhone").value.trim();
      const avatar = $("regAvatarPreview").src || defaultAvatar;
      if (!nick) { return setMsg($("authMsg"), "Нужен никнейм.", "err"); }
      const exists = await findUserByLogin(login);
      if (exists) { return setMsg($("authMsg"), "Такой логин уже занят.", "err"); }
      const uid = randId("u");
      const salt = randId("s");
      const passwordHash = await sha256Hex(`${login}:${pass}:${salt}`);
      await db.collection("users").doc(uid).set({
        login, salt, passwordHash, nick, phone, avatar,
        online: true, lastSeen: now(), typingTo: "", typingAt: 0,
        role: "user", star: false, customItems: [], balance: 100,
        mutedUntil: 0, mutedBy: null, selectedStatus: "",
        agreedToAutoDelete: false, verified: false
      });
      session = { uid, login };
      saveSession(session);
      await afterLogin();
      return;
    }
    const found = await findUserByLogin(login);
    if (!found) { return setMsg($("authMsg"), "Аккаунт не найден.", "err"); }
    const { uid, data } = found;
    const calc = await sha256Hex(`${login}:${pass}:${data.salt}`);
    if (calc !== data.passwordHash) { return setMsg($("authMsg"), "Неверный пароль.", "err"); }
    session = { uid, login };
    saveSession(session);
    await afterLogin();
  } catch (e) { setMsg($("authMsg"), "Ошибка: " + (e?.message || String(e)), "err"); }
});

async function findUserByLogin(login) {
  const snap = await db.collection("users").where("login", "==", login).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { uid: d.id, data: d.data() };
}

async function warmUsersCache() {
  const snap = await db.collection("users").get();
  usersCache.clear();
  snap.forEach(d => usersCache.set(d.id, { uid: d.id, ...d.data() }));
  if (session && usersCache.has(session.uid)) me = usersCache.get(session.uid);
}

async function loadMe() {
  const snap = await db.collection("users").doc(session.uid).get();
  if (!snap.exists) throw new Error("Аккаунт не найден.");
  me = { uid: snap.id, ...snap.data() };
  if (!me.customItems) me.customItems = [];
  if (!me.selectedStatus) me.selectedStatus = "";
  if (me.agreedToAutoDelete === undefined) me.agreedToAutoDelete = false;
  if (me.verified === undefined) me.verified = false;
  usersCache.set(me.uid, me);
}

async function setOnline(flag) {
  if (!session) return;
  try {
    await db.collection("users").doc(session.uid).set({
      online: !!flag,
      lastSeen: now()
    }, { merge: true });
  } catch (e) {}
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => setOnline(true), 20000);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

window.addEventListener("beforeunload", () => setOnline(false));
window.addEventListener("pagehide", () => setOnline(false));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    setOnline(false);
  } else {
    setOnline(true);
  }
});

// ========================================================================
// AFTER LOGIN
// ========================================================================
async function afterLogin() {
  $("bottomNav").classList.remove("hidden");
  await setOnline(true);
  startHeartbeat();
  await warmUsersCache();
  await loadMe();
  await loadContactOverrides();
  cacheMe(me);
  const itemsSnap = await db.collection("items").get();
  itemsCache.clear();
  itemsSnap.forEach(doc => itemsCache.set(doc.id, { id: doc.id, ...doc.data() }));
  renderProfile();
  await updateStatusSelect();
  await loadUserStickers();
  bindChatListRealtime();
  showScreen("scr-chats");
  setMainTab('chats');
  await updateUserOwnedGroupsCount(me.uid);
  startAutoCleanSchedule();
  setTimeout(async () => { await cleanAllUserChats(); }, 3000);
  
  setTimeout(() => {
    if (me) {
      checkPushStatus();
      updatePushUI();
    }
  }, 2000);
  
  if (me.agreedToAutoDelete === undefined || me.agreedToAutoDelete === false) {
    setTimeout(() => {
      showAgreementModal(async () => {
        showToast("✅ Спасибо за принятие правил!", "success");
        const banner = document.getElementById("agreementBanner");
        if (banner) banner.remove();
        bindChatListRealtime();
        await updateUserOwnedGroupsCount(me.uid);
        setTimeout(() => cleanAllUserChats(), 2000);
      });
    }, 500);
  }
}

async function logout() {
  stopAutoCleanSchedule();
  try { await clearMyTyping(); } catch {}
  try { await setOnline(false); } catch {}
  stopHeartbeat();
  if (unsubChatList) { unsubChatList(); unsubChatList = null; }
  if (unsubMsgs) { unsubMsgs(); unsubMsgs = null; }
  if (unsubPeer) { unsubPeer(); unsubPeer = null; }
  session = null;
  me = null;
  peer = null;
  currentChatId = null;
  usersCache.clear();
  clearSession();
  $("bottomNav").classList.add("hidden");
  showScreen("scr-auth");
}

$("btnLogout").addEventListener("click", logout);
$("btnLogout2").addEventListener("click", logout);
$("resetDeviceBtn").addEventListener("click", () => { localStorage.removeItem("lol_session"); location.reload(); });
$("aboutBtn").addEventListener("click", () => { showScreen("scr-about"); });
$("aboutBackBtn").addEventListener("click", () => { showScreen("scr-profile"); });

$("lolPlayerBtn").addEventListener("click", async () => {
  showScreen("scr-player");
  await loadPlayerTracks();
});

$("playerBackBtn").addEventListener("click", () => {
  showScreen("scr-profile");
});

$("addMusicBtn").addEventListener("click", addPlayerTrack);

// ========================================================================
// ВЕРИФИКАЦИЯ
// ========================================================================
async function verifyUser() {
  if (me.role !== 'creator') return;
  if (!peer) return;

  const userDoc = await db.collection("users").doc(peer.uid).get();
  if (!userDoc.exists) return;
  const userData = userDoc.data();

  const isVerified = userData.verified === true;
  const confirmMsg = isVerified ? 
    `Удалить верификацию у пользователя ${peer.nick}?` : 
    `Поставить верификацию пользователю ${peer.nick}?`;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${isVerified ? '❌ Удалить верификацию' : '✅ Поставить верификацию'}</h3>
      <p style="margin:16px 0;">${confirmMsg}</p>
      <div class="modal-buttons">
        <button class="modal-btn cancel" onclick="this.closest('.modal').remove()">❌ Отмена</button>
        <button class="modal-btn confirm" id="confirmVerifyBtn">${isVerified ? '🗑️ Удалить' : '✅ Поставить'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('confirmVerifyBtn').onclick = async () => {
    modal.remove();
    try {
      await db.collection("users").doc(peer.uid).update({ verified: !isVerified });
      showToast(`✅ ${isVerified ? 'Верификация удалена' : 'Верификация поставлена'} пользователю ${peer.nick}`, "success");
      const updatedUser = usersCache.get(peer.uid);
      if (updatedUser) {
        updatedUser.verified = !isVerified;
        usersCache.set(peer.uid, updatedUser);
      }
      if (currentChatId && !currentChatIsGroup) {
        const u = usersCache.get(peer.uid);
        const statusInline = getStatusInline(u);
        const verifiedBadge = getVerifiedBadge(u);
        $("peerNick").innerHTML = `${verifiedBadge} ${escapeHtml(getDisplayNameForUser(peer.uid, u))} ${statusInline}`;
      }
      bindChatListRealtime();
    } catch (e) {
      showToast("❌ Ошибка при верификации: " + e.message, "error");
    }
  };
}

async function verifyGroup() {
  if (me.role !== 'creator') return;
  if (!currentGroup) return;

  const groupData = await db.collection("groups").doc(currentChatId).get();
  if (!groupData.exists) return;
  const isVerified = groupData.data().verified === true;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${isVerified ? '❌ Удалить верификацию группы' : '✅ Верифицировать группу'}</h3>
      <p style="margin:16px 0;">${isVerified ? 'Удалить верификацию у группы ' + currentGroup.name + '?' : 'Поставить верификацию группе ' + currentGroup.name + '?'}</p>
      <div class="modal-buttons">
        <button class="modal-btn cancel" onclick="this.closest('.modal').remove()">❌ Отмена</button>
        <button class="modal-btn confirm" id="confirmGroupVerifyBtn">${isVerified ? '🗑️ Удалить' : '✅ Поставить'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('confirmGroupVerifyBtn').onclick = async () => {
    modal.remove();
    try {
      await db.collection("groups").doc(currentChatId).update({ verified: !isVerified });
      await db.collection("chats").doc(currentChatId).update({ groupVerified: !isVerified });
      showToast(`✅ ${isVerified ? 'Верификация группы удалена' : 'Группа верифицирована'}`, "success");
      currentGroup.verified = !isVerified;
      renderGroupInfo();
      bindChatListRealtime();
    } catch (e) {
      showToast("❌ Ошибка: " + e.message, "error");
    }
  };
}

// ========================================================================
// CONTACT OVERRIDES
// ========================================================================
async function loadContactOverrides() {
  if (!me) return;
  const snapshot = await db.collection("user_overrides").where("userId", "==", me.uid).get();
  overridesCache.clear();
  snapshot.forEach(doc => {
    const data = doc.data();
    overridesCache.set(data.targetUserId, { customNick: data.customNick || null, customAvatar: data.customAvatar || null, originalNick: data.originalNick, originalAvatar: data.originalAvatar });
  });
}

async function saveContactOverride(targetUserId, customNick, customAvatar, originalNick, originalAvatar) {
  if (!me) return;
  const overrideId = `${me.uid}_${targetUserId}`;
  const data = {
    userId: me.uid,
    targetUserId: targetUserId,
    customNick: customNick || null,
    customAvatar: customAvatar || null,
    originalNick: originalNick,
    originalAvatar: originalAvatar,
    updatedAt: now()
  };
  await db.collection("user_overrides").doc(overrideId).set(data, { merge: true });
  overridesCache.set(targetUserId, { customNick: customNick || null, customAvatar: customAvatar || null, originalNick: originalNick, originalAvatar: originalAvatar });
}

async function resetContactOverride(targetUserId) {
  if (!me) return;
  const overrideId = `${me.uid}_${targetUserId}`;
  await db.collection("user_overrides").doc(overrideId).delete();
  overridesCache.delete(targetUserId);
}

function getDisplayNameForUser(userId, userData) {
  const override = overridesCache.get(userId);
  if (override && override.customNick) return override.customNick;
  return userData?.nick || "Кто-то";
}

function getAvatarForUser(userId, userData) {
  const override = overridesCache.get(userId);
  if (override && override.customAvatar) return override.customAvatar;
  return userData?.avatar || defaultAvatar;
}

// ========================================================================
// AGREEMENT
// ========================================================================
async function checkUserAgreement(userId) {
  if (!userId) return false;
  try {
    const userSnap = await db.collection("users").doc(userId).get();
    if (!userSnap.exists) return false;
    const userData = userSnap.data();
    return userData.agreedToAutoDelete === true;
  } catch (e) {
    console.error("Ошибка проверки согласия:", e);
    return false;
  }
}

async function setUserAgreement(userId, agreed) {
  if (!userId) return false;
  try {
    await db.collection("users").doc(userId).update({
      agreedToAutoDelete: agreed,
      agreedAt: agreed ? now() : null
    });
    if (me && me.uid === userId) {
      me.agreedToAutoDelete = agreed;
      if (agreed) me.agreedAt = now();
    }
    return true;
  } catch (e) {
    console.error("Ошибка сохранения согласия:", e);
    return false;
  }
}

function showAgreementModal(onAgreeCallback) {
  const existingModal = document.querySelector('.agreement-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.className = "modal agreement-modal";
  modal.innerHTML = `
    <div class="modal-content" style="max-width:400px;">
      <h3>📜 Новое правило мессенджера</h3>
      <div style="margin:16px 0; padding:12px; background:rgba(0,0,0,0.3); border-radius:16px;">
        <p style="margin:0 0 12px 0; font-weight:bold;">🗑️ Автоудаление сообщений</p>
        <p style="margin:0 0 8px 0; font-size:14px;">Все сообщения, которым больше <strong style="color:#fbbf24;">30 дней</strong>, будут автоматически удаляться из чатов.</p>
        <p style="margin:0 0 8px 0; font-size:14px;">✨ <strong style="color:#22c55e;">Важные сообщения</strong> НЕ УДАЛЯЮТСЯ независимо от возраста.</p>
        <p style="margin:0 0 8px 0; font-size:14px;">🗑️ Обычные сообщения и стикеры удаляются через 30 дней.</p>
        <p style="margin:8px 0 0 0; font-size:13px; color:var(--muted2);">Это сделано для оптимизации работы мессенджера и экономии места.</p>
      </div>
      <div style="margin:16px 0;">
        <label style="display:flex; align-items:center; gap:12px; cursor:pointer;">
          <input type="checkbox" id="agreementCheckbox" style="width:20px; height:20px;">
          <span>Я ознакомлен(а) и согласен(на) с новым правилом</span>
        </label>
      </div>
      <div class="modal-buttons" style="margin-top:16px;">
        <button class="modal-btn cancel" id="cancelAgreeBtn" style="background:rgba(255,255,255,0.1);">❌ Отмена</button>
        <button class="modal-btn confirm" id="agreeBtn" disabled style="background:#fbbf24; color:#1a1a2e;">✅ Принять и продолжить</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const checkbox = document.getElementById("agreementCheckbox");
  const agreeBtn = document.getElementById("agreeBtn");
  const cancelBtn = document.getElementById("cancelAgreeBtn");

  checkbox.addEventListener("change", () => {
    agreeBtn.disabled = !checkbox.checked;
  });

  agreeBtn.onclick = async () => {
    if (!checkbox.checked) {
      alert("Пожалуйста, подтвердите согласие");
      return;
    }
    await setUserAgreement(me.uid, true);
    modal.remove();
    if (onAgreeCallback) onAgreeCallback();
    showToast("✅ Вы приняли новое правило! Общение продолжается.", "success");
    bindChatListRealtime();
    if (currentChatId && !currentChatIsGroup) {
      const peerId = peer?.uid;
      if (peerId) {
        const canSend = await canSendInPrivateChat(peerId);
        if (canSend) {
          const sendBtn = $("sendBtn");
          const msgInput = $("msgInput");
          if (sendBtn) sendBtn.disabled = false;
          if (msgInput) {
            msgInput.disabled = false;
            msgInput.placeholder = "Сообщение";
          }
          const blockMsg = document.querySelector('.chat-block-message');
          if (blockMsg) blockMsg.remove();
          showToast("🔓 Чат разблокирован! Теперь вы можете общаться.", "success");
        }
      }
    }
    setTimeout(() => cleanAllUserChats(), 2000);
  };

  cancelBtn.onclick = () => {
    modal.remove();
    showToast("ℹ️ Вы можете принять правило позже через баннер в чатах или профиль.", "info");
    setTimeout(() => { checkAndShowAgreementBanner(); }, 500);
  };
}

function showAgreementBanner() {
  const existingBanner = document.getElementById("agreementBanner");
  if (existingBanner) existingBanner.remove();

  if (!me || me.agreedToAutoDelete === true) return;

  const topbar = document.querySelector("#scr-chats .topbar");
  if (!topbar) return;

  const banner = document.createElement("div");
  banner.id = "agreementBanner";
  banner.className = "agreement-banner";
  banner.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <span style="font-size:24px;">📜</span>
      <div>
        <div style="font-weight:bold; font-size:15px; color:#1a1a2e;">Соглашение о новом правиле</div>
        <div style="font-size:12px; color:#2d2d44;">Автоудаление сообщений старше 30 дней</div>
      </div>
    </div>
    <button id="viewAgreementBtn" style="background:rgba(0,0,0,0.2); border:none; border-radius:40px; padding:8px 16px; color:white; font-weight:bold; cursor:pointer;">Посмотреть →</button>
  `;

  topbar.insertAdjacentElement('afterend', banner);

  document.getElementById("viewAgreementBtn").onclick = () => {
    showAgreementModal(() => {
      const bannerEl = document.getElementById("agreementBanner");
      if (bannerEl) bannerEl.remove();
      bindChatListRealtime();
    });
  };
}

function checkAndShowAgreementBanner() {
  if (me && me.agreedToAutoDelete !== true) {
    showAgreementBanner();
  }
}

// ========================================================================
// AUTO-DELETE
// ========================================================================
async function cleanOldMessages(chatId, isGroup, groupOwnerId = null) {
  if (!chatId) return;

  if (!isGroup) {
    if (!peer || !peer.uid) {
      try {
        const chatDoc = await db.collection("chats").doc(chatId).get();
        if (chatDoc.exists) {
          const participants = chatDoc.data().participants || [];
          const peerId = participants.find(p => p !== me.uid);
          if (peerId) peer = { uid: peerId, ...usersCache.get(peerId) };
        }
      } catch (e) {}
    }
    if (!peer || !peer.uid) return;
    const myAgree = me.agreedToAutoDelete === true;
    const peerAgree = await checkUserAgreement(peer.uid);
    if (!myAgree || !peerAgree) return;
  } else {
    if (!groupOwnerId) {
      if (currentGroup && currentGroup.ownerId) {
        groupOwnerId = currentGroup.ownerId;
      } else {
        try {
          const groupDoc = await db.collection("groups").doc(chatId).get();
          if (groupDoc.exists) {
            groupOwnerId = groupDoc.data().ownerId;
          } else {
            const chatDoc = await db.collection("chats").doc(chatId).get();
            if (chatDoc.exists && chatDoc.data().ownerId) {
              groupOwnerId = chatDoc.data().ownerId;
            }
          }
        } catch (e) {}
      }
    }
    if (!groupOwnerId) return;
    const ownerAgree = await checkUserAgreement(groupOwnerId);
    if (!ownerAgree) return;
  }

  const thirtyDaysAgo = now() - (30 * 24 * 60 * 60 * 1000);

  try {
    const messagesRef = db.collection("chats").doc(chatId).collection("messages");
    const oldMessages = await messagesRef.where("time", "<", thirtyDaysAgo).get();

    if (oldMessages.empty) return;

    let importantIds = new Set();
    try {
      const importantSnapshot = await db.collection("chats").doc(chatId).collection("important").get();
      importantSnapshot.forEach(doc => importantIds.add(doc.id));
    } catch (e) {}

    const deleteBatch = (messages) => {
      const batch = db.batch();
      messages.forEach(doc => { batch.delete(doc.ref); });
      return batch.commit();
    };

    let currentBatch = [];
    const batchSize = 400;

    for (const doc of oldMessages.docs) {
      const msgId = doc.id;
      if (importantIds.has(msgId)) continue;
      currentBatch.push(doc);
      if (currentBatch.length >= batchSize) {
        await deleteBatch(currentBatch);
        currentBatch = [];
      }
    }

    if (currentBatch.length > 0) {
      await deleteBatch(currentBatch);
    }

    const lastMsgSnapshot = await messagesRef.orderBy("time", "desc").limit(1).get();
    if (!lastMsgSnapshot.empty) {
      const lastMsg = lastMsgSnapshot.docs[0].data();
      let lastText = lastMsg.text || "";
      if (lastMsg.isSticker) lastText = "📷 Стикер";
      if (lastMsg.isDeleted) lastText = "[Удалено]";
      if (lastMsg.type === 'track' || lastMsg.isTrack) lastText = `🎵 ${lastMsg.trackTitle || 'Музыка'}`;

      await db.collection("chats").doc(chatId).update({
        lastText: lastText,
        lastTime: lastMsg.time || now()
      });
    }
  } catch (e) {
    console.error("Ошибка очистки старых сообщений:", e);
  }
}

async function cleanAllUserChats() {
  if (!me) return;
  try {
    const chatsSnapshot = await db.collection("chats").where("participants", "array-contains", me.uid).get();
    for (const chatDoc of chatsSnapshot.docs) {
      const chatId = chatDoc.id;
      const chatData = chatDoc.data();
      const isGroup = chatData.isGroup === true;
      let groupOwnerId = null;
      if (isGroup) {
        if (chatData.ownerId) {
          groupOwnerId = chatData.ownerId;
        } else {
          try {
            const groupDoc = await db.collection("groups").doc(chatId).get();
            if (groupDoc.exists) {
              groupOwnerId = groupDoc.data().ownerId;
            }
          } catch (e) {}
        }
      }
      if (!isGroup) {
        const participants = chatData.participants || [];
        const peerId = participants.find(p => p !== me.uid);
        if (peerId) {
          const peerAgree = await checkUserAgreement(peerId);
          const myAgree = me.agreedToAutoDelete === true;
          if (myAgree && peerAgree) {
            await cleanOldMessages(chatId, false, null);
          }
        }
      } else if (groupOwnerId) {
        const ownerAgree = await checkUserAgreement(groupOwnerId);
        if (ownerAgree) {
          await cleanOldMessages(chatId, true, groupOwnerId);
        }
      }
    }
  } catch (e) {
    console.error("Ошибка глобальной очистки:", e);
  }
}

function startAutoCleanSchedule() {
  if (cleanInterval) clearInterval(cleanInterval);
  cleanInterval = setInterval(async () => {
    if (me && me.uid) {
      await cleanAllUserChats();
    }
  }, 24 * 60 * 60 * 1000);
}

function stopAutoCleanSchedule() {
  if (cleanInterval) {
    clearInterval(cleanInterval);
    cleanInterval = null;
  }
}

async function updateUserOwnedGroupsCount(userId) {
  if (!userId) return;
  try {
    const groupsSnapshot = await db.collection("groups").where("ownerId", "==", userId).get();
    const ownedGroupsCount = groupsSnapshot.size;
    await db.collection("users").doc(userId).update({ ownedGroupsCount: ownedGroupsCount });
    if (me && me.uid === userId) {
      me.ownedGroupsCount = ownedGroupsCount;
    }
  } catch (e) {
    console.error("Ошибка обновления ownedGroupsCount:", e);
  }
}

// ========================================================================
// CHAT LIST
// ========================================================================
async function markChatMessagesAsRead(chatId) {
  if (!me || !chatId) return;
  const messagesRef = db.collection("chats").doc(chatId).collection("messages");
  const unreadSnapshot = await messagesRef.where("readBy", "not-in", [[me.uid]]).get();
  const batch = db.batch();
  unreadSnapshot.forEach(doc => {
    const data = doc.data();
    if (!data.readBy || !data.readBy.includes(me.uid)) {
      batch.update(doc.ref, { readBy: firebase.firestore.FieldValue.arrayUnion(me.uid) });
    }
  });
  await batch.commit();
  unreadCounts.set(chatId, 0);
  bindChatListRealtime();
}

function bindChatListRealtime() {
  if (!me) return;
  if (unsubChatList) { unsubChatList(); unsubChatList = null; }
  unsubChatList = db.collection("chats").where("participants", "array-contains", me.uid).onSnapshot(async (snap) => {
    await warmUsersCache();
    let items = [];
    for (const doc of snap.docs) {
      const c = doc.data();
      if ((c.lastTime || 0) > 0) {
        const messagesSnapshot = await db.collection("chats").doc(doc.id).collection("messages").get();
        let unread = 0;
        messagesSnapshot.forEach(msgDoc => {
          const msgData = msgDoc.data();
          if (msgData.sender !== me.uid && (!msgData.readBy || !msgData.readBy.includes(me.uid))) {
            unread++;
          }
        });
        unreadCounts.set(doc.id, unread);
        items.push({ id: doc.id, ...c, unread: unread });
      }
    }
    items.sort((a, b) => (b.lastTime || 0) - (a.lastTime || 0));
    const box = $("chatList");
    box.innerHTML = "";
    if (items.length === 0) {
      const div = document.createElement("div");
      div.style.padding = "10px 16px";
      div.style.color = "rgba(234,241,255,.55)";
      div.style.fontWeight = "1100";
      div.textContent = "Пока нет чатов. Нажми поиск и напиши кому-нибудь.";
      box.appendChild(div);
      return;
    }
    for (const c of items) {
      let name = "",
        avatar = defaultAvatar,
        userObj = null;
      if (c.isGroup) {
        name = c.groupName || "Группа";
        avatar = c.groupAvatar || defaultAvatar;
        const groupBadge = getGroupVerifiedBadge(c);
        if (groupBadge) {
          name = groupBadge + ' ' + name;
        }
      } else {
        const peerId = (c.participants || []).find(x => x !== me.uid);
        userObj = usersCache.get(peerId) || { nick: "Кто-то", avatar: defaultAvatar };
        name = getDisplayNameForUser(peerId, userObj);
        avatar = getAvatarForUser(peerId, userObj);
        const verifiedBadge = getVerifiedBadge(userObj);
        if (verifiedBadge) {
          name = verifiedBadge + ' ' + name;
        }
      }
      const row = document.createElement("div");
      row.className = "row";
      const statusInline = (!c.isGroup && userObj) ? getStatusInline(userObj) : '';
      const unreadBadge = (c.unread > 0) ? `<div class="unread-badge">${c.unread > 9 ? '9+' : c.unread}</div>` : '';
      
      row.innerHTML = `
        <img class="avatar" src="${escapeHtml(avatar)}" alt="">
        <div class="meta">
          <div class="nameLine">
            <div class="name">${name} ${statusInline}</div>
            <div class="time">${c.lastTime ? fmtTime(c.lastTime) : ""}</div>
          </div>
          <div class="preview">
            <div class="snippet">${escapeHtml(c.lastText || "")}</div>
            ${unreadBadge}
          </div>
        </div>
      `;
      row.addEventListener("click", async () => {
        await markChatMessagesAsRead(c.id);
        await openChat(c.id, c.isGroup);
      });
      box.appendChild(row);
    }
    checkAndShowAgreementBanner();
  }, (err) => {
    $("chatList").innerHTML = `<div class="err" style="margin:10px;">Ошибка чтения чатов: ${escapeHtml(err?.message || String(err))}</div>`;
  });
}

// ========================================================================
// DELETE PRIVATE CHAT
// ========================================================================
async function deletePrivateChat(chatId, peerId) {
  if (!chatId || !peerId) return;
  const confirmDelete = confirm(
    "⚠️ ВНИМАНИЕ!\n\n" +
    "Вы собираетесь удалить этот личный чат.\n\n" +
    "✅ Чат исчезнет из вашего списка И из списка собеседника\n" +
    "✅ ВСЕ сообщения в этом чате будут удалены БЕЗВОЗВРАТНО у ОБОИХ\n" +
    "✅ История переписки будет полностью потеряна\n\n" +
    "Чтобы снова начать общение, найдите пользователя через поиск.\n\n" +
    "Вы уверены?"
  );
  if (!confirmDelete) return;
  try {
    const messagesRef = db.collection("chats").doc(chatId).collection("messages");
    const messages = await messagesRef.get();
    const batch = db.batch();
    messages.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    const importantRef = db.collection("chats").doc(chatId).collection("important");
    const important = await importantRef.get();
    const importantBatch = db.batch();
    important.forEach(doc => importantBatch.delete(doc.ref));
    await importantBatch.commit();
    await db.collection("chats").doc(chatId).delete();
    try {
      await db.collection("user_chats").doc(`${me.uid}_${peerId}`).delete();
      await db.collection("user_chats").doc(`${peerId}_${me.uid}`).delete();
    } catch (e) {}
    showToast("🗑️ Чат удалён у обоих собеседников!", "success");
    showScreen("scr-chats");
    bindChatListRealtime();
  } catch (e) {
    console.error("Ошибка удаления чата:", e);
    showToast("❌ Ошибка при удалении чата", "error");
  }
}

// ========================================================================
// CONTACT EDITOR
// ========================================================================
function showContactEditor(userId, userData) {
  if (currentChatIsGroup) return;
  currentContactEditorUserId = userId;
  currentContactEditorOriginalNick = userData.nick;
  currentContactEditorOriginalAvatar = userData.avatar;
  const override = overridesCache.get(userId);
  $("contactEditorTitle").textContent = `Редактировать: ${escapeHtml(userData.nick)}`;
  $("contactEditorAvatar").src = getAvatarForUser(userId, userData);
  $("contactEditorNick").value = getDisplayNameForUser(userId, userData);
  let statusHtml = '';
  if (userData.selectedStatus === 'star' && userData.star) {
    statusHtml = '<span class="contact-status-inline">⭐️ Звезда</span>';
  } else if (userData.selectedStatus && userData.customItems && userData.customItems.includes(userData.selectedStatus)) {
    const item = itemsCache.get(userData.selectedStatus);
    if (item) {
      if (item.iconType === 'image') {
        statusHtml = `<span class="contact-status-inline"><img src="${item.icon}" style="width:24px;height:24px;border-radius:6px;"> ${item.name || 'Статус'}</span>`;
      } else {
        statusHtml = `<span class="contact-status-inline">${item.icon} ${item.name || 'Статус'}</span>`;
      }
    }
  } else {
    statusHtml = '<span class="contact-status-inline">🚫 Нет статуса</span>';
  }
  $("contactEditorStatus").innerHTML = `<strong>Статус:</strong> ${statusHtml}`;
  $("contactEditorAvatarFile").value = "";
  $("contactEditorModal").classList.remove("hidden");
}

function hideContactEditor() {
  $("contactEditorModal").classList.add("hidden");
  currentContactEditorUserId = null;
}

$("saveContactBtn").onclick = async () => {
  if (!currentContactEditorUserId) return;
  const newNick = $("contactEditorNick").value.trim();
  let newAvatar = null;
  if ($("contactEditorAvatarFile").files && $("contactEditorAvatarFile").files[0]) {
    newAvatar = await uploadAvatar($("contactEditorAvatarFile").files[0]);
  }
  const userData = usersCache.get(currentContactEditorUserId);
  if (newNick && newNick !== userData.nick) {
    await saveContactOverride(currentContactEditorUserId, newNick, newAvatar, currentContactEditorOriginalNick, currentContactEditorOriginalAvatar);
  } else if (newAvatar) {
    await saveContactOverride(currentContactEditorUserId, null, newAvatar, currentContactEditorOriginalNick, currentContactEditorOriginalAvatar);
  }
  await loadContactOverrides();
  hideContactEditor();
  bindChatListRealtime();
  if (peer && peer.uid === currentContactEditorUserId) {
    const updatedUser = usersCache.get(peer.uid);
    $("peerAvatar").src = getAvatarForUser(peer.uid, updatedUser);
    const statusInline = getStatusInline(updatedUser);
    const verifiedBadge = getVerifiedBadge(updatedUser);
    $("peerNick").innerHTML = `${verifiedBadge} ${escapeHtml(getDisplayNameForUser(peer.uid, updatedUser))} ${statusInline}`;
  }
  showToast("✅ Контакт обновлён (только для вас)", "success");
};

$("resetContactBtn").onclick = async () => {
  if (!currentContactEditorUserId) return;
  if (confirm("Вернуть оригинальный никнейм и аватар?")) {
    await resetContactOverride(currentContactEditorUserId);
    await loadContactOverrides();
    hideContactEditor();
    bindChatListRealtime();
    if (peer && peer.uid === currentContactEditorUserId) {
      const updatedUser = usersCache.get(peer.uid);
      $("peerAvatar").src = getAvatarForUser(peer.uid, updatedUser);
      const statusInline = getStatusInline(updatedUser);
      const verifiedBadge = getVerifiedBadge(updatedUser);
      $("peerNick").innerHTML = `${verifiedBadge} ${escapeHtml(getDisplayNameForUser(peer.uid, updatedUser))} ${statusInline}`;
    }
    showToast("🔄 Контакт восстановлен", "success");
  }
};

$("contactEditorAvatar").addEventListener("click", () => {
  $("contactEditorAvatarFile").click();
});

// ========================================================================
// SEARCH
// ========================================================================
let allUsersList = [];
let filteredUsersList = [];
let searchResultsContainer = null;
let isLoadingMore = false;
let currentPage = 0;
const USERS_PER_PAGE = 30;

async function loadAllUsersForSearch() {
  if (allUsersList.length > 0) return allUsersList;
  const snap = await db.collection("users").get();
  allUsersList = [];
  snap.forEach(doc => {
    if (doc.id !== me?.uid) {
      allUsersList.push({ uid: doc.id, ...doc.data() });
    }
  });
  return allUsersList;
}

function filterUsersByQuery(query) {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase();
  return allUsersList.filter(user => {
    const nick = (user.nick || "").toLowerCase();
    const login = (user.login || "").toLowerCase();
    return nick.includes(lowerQuery) || login.includes(lowerQuery);
  });
}

function renderSearchResultsPage() {
  if (!searchResultsContainer) return;
  const start = currentPage * USERS_PER_PAGE;
  const end = start + USERS_PER_PAGE;
  const pageUsers = filteredUsersList.slice(start, end);
  if (pageUsers.length === 0 && currentPage === 0) {
    searchResultsContainer.innerHTML = '<div class="search-empty">👤 Пользователи не найдены</div>';
    return;
  }
  if (currentPage === 0) {
    searchResultsContainer.innerHTML = "";
  }
  for (const user of pageUsers) {
    const resultDiv = document.createElement("div");
    resultDiv.className = "search-result-item";
    const statusHtml = isOnline(user) ? '<span class="statusDot on"></span> онлайн' : `<span class="statusDot"></span> ${getLastSeenText(user.lastSeen)}`;
    const statusInline = getStatusInline(user);
    const verifiedBadge = getVerifiedBadge(user);
    const displayName = user.nick || "Кто-то";
    resultDiv.innerHTML = `
      <img class="search-result-avatar" src="${user.avatar || defaultAvatar}" alt="avatar">
      <div class="search-result-info">
        <div class="search-result-name">
          ${verifiedBadge} ${escapeHtml(displayName)} ${statusInline}
        </div>
        <div class="search-result-status">
          ${statusHtml}
        </div>
      </div>
    `;
    resultDiv.addEventListener("click", async () => {
      let existingChatId = null;
      const chatsSnapshot = await db.collection("chats")
        .where("participants", "array-contains", me.uid)
        .get();
      for (const doc of chatsSnapshot.docs) {
        const chatData = doc.data();
        if (!chatData.isGroup && chatData.participants.includes(user.uid)) {
          existingChatId = doc.id;
          break;
        }
      }
      if (existingChatId) {
        await openChat(existingChatId, false);
      } else {
        const newChatId = randId("chat");
        await db.collection("chats").doc(newChatId).set({
          participants: [me.uid, user.uid],
          lastText: "",
          lastTime: now(),
          isGroup: false
        });
        await openChat(newChatId, false);
      }
    });
    searchResultsContainer.appendChild(resultDiv);
  }
  if (end < filteredUsersList.length) {
    const loadMoreTrigger = document.createElement("div");
    loadMoreTrigger.className = "load-more-trigger";
    loadMoreTrigger.innerHTML = "⬇️ Прокрутите для загрузки ещё...";
    loadMoreTrigger.id = "loadMoreTrigger";
    searchResultsContainer.appendChild(loadMoreTrigger);
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoadingMore && (currentPage + 1) * USERS_PER_PAGE < filteredUsersList.length) {
        isLoadingMore = true;
        currentPage++;
        renderSearchResultsPage();
        isLoadingMore = false;
        const oldTrigger = document.getElementById("loadMoreTrigger");
        if (oldTrigger) oldTrigger.remove();
      }
    }, { threshold: 0.5 });
    if (loadMoreTrigger) observer.observe(loadMoreTrigger);
  }
}

function performSearch() {
  const query = document.getElementById("searchInput").value.trim();
  const searchEmpty = document.getElementById("searchEmpty");
  const sectionTitle = document.getElementById("searchSectionTitle");
  if (!query) {
    if (searchResultsContainer) searchResultsContainer.innerHTML = "";
    if (searchEmpty) {
      searchEmpty.classList.remove("hidden");
      searchEmpty.innerHTML = "👤 Начните вводить никнейм...";
    }
    if (sectionTitle) sectionTitle.textContent = "👥 Пользователи";
    filteredUsersList = [];
    return;
  }
  if (searchEmpty) searchEmpty.classList.add("hidden");
  if (sectionTitle) sectionTitle.textContent = `🔍 Результаты поиска: "${escapeHtml(query)}"`;
  filteredUsersList = filterUsersByQuery(query);
  filteredUsersList.sort((a, b) => {
    const aOnline = isOnline(a) ? 1 : 0;
    const bOnline = isOnline(b) ? 1 : 0;
    if (aOnline !== bOnline) return bOnline - aOnline;
    return (a.nick || "").localeCompare(b.nick || "", "ru");
  });
  currentPage = 0;
  renderSearchResultsPage();
}

function setupSearch() {
  searchResultsContainer = document.getElementById("searchResultsContainer");
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearchBtn");
  const cancelBtn = document.getElementById("cancelSearch");
  if (searchInput) {
    searchInput.addEventListener("input", async () => {
      if (searchInputTimeout) clearTimeout(searchInputTimeout);
      searchInputTimeout = setTimeout(async () => {
        await loadAllUsersForSearch();
        performSearch();
      }, 300);
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (searchResultsContainer) searchResultsContainer.innerHTML = "";
      const searchEmpty = document.getElementById("searchEmpty");
      if (searchEmpty) {
        searchEmpty.classList.remove("hidden");
        searchEmpty.innerHTML = "👤 Начните вводить никнейм...";
      }
      const sectionTitle = document.getElementById("searchSectionTitle");
      if (sectionTitle) sectionTitle.textContent = "👥 Пользователи";
      filteredUsersList = [];
      if (searchInput) searchInput.focus();
    });
  }
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      showScreen("scr-chats");
    });
  }
}

let searchInputTimeout = null;
setTimeout(() => { setupSearch(); }, 1000);

$("openSearch").addEventListener("click", async () => {
  await warmUsersCache();
  await loadAllUsersForSearch();
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.value = "";
    searchInput.focus();
  }
  if (searchResultsContainer) searchResultsContainer.innerHTML = "";
  const searchEmpty = document.getElementById("searchEmpty");
  if (searchEmpty) {
    searchEmpty.classList.remove("hidden");
    searchEmpty.innerHTML = "👤 Начните вводить никнейм...";
  }
  const sectionTitle = document.getElementById("searchSectionTitle");
  if (sectionTitle) sectionTitle.textContent = "👥 Пользователи";
  filteredUsersList = [];
  showScreen("scr-search");
});

// ========================================================================
// OPEN CHAT
// ========================================================================
async function openChat(chatId, isGroup) {
  currentChatId = chatId;
  currentChatIsGroup = isGroup;
  const chatDoc = await db.collection("chats").doc(chatId).get();
  const chatData = chatDoc.data();

  if (chatData.isGroup || isGroup) {
    currentChatIsGroup = true;
    const groupDoc = await db.collection("groups").doc(chatId).get();
    if (groupDoc.exists) { currentGroup = { id: chatId, ...groupDoc.data() }; } 
    else { currentGroup = { id: chatId, name: chatData.groupName || "Группа", avatar: chatData.groupAvatar || defaultAvatar, participants: chatData.participants || [], ownerId: chatData.ownerId || me.uid }; }
    
    let displayName = currentGroup.name || "Группа";
    const groupBadge = getGroupVerifiedBadge(currentGroup);
    if (groupBadge) {
      displayName = groupBadge + ' ' + displayName;
    }
    $("peerAvatar").src = currentGroup.avatar || defaultAvatar;
    $("peerNick").innerHTML = displayName;
    $("peerStatus").textContent = `${currentGroup.participants?.length || 0} участников`;
    const perms = await db.collection("group_permissions").doc(chatId).get();
    groupPermissions = perms.exists ? perms.data() : { canEdit: true, canSend: true };
    const isOwner = currentGroup.ownerId === me.uid;
    $("sendBtn").disabled = !(isOwner || groupPermissions.canSend);
    $("msgInput").disabled = !(isOwner || groupPermissions.canSend);
    if (!$("sendBtn").disabled) $("msgInput").placeholder = "Сообщение";
    else $("msgInput").placeholder = "Отправка сообщений отключена";
    peer = null;
    $("openGroupInfoBtn").onclick = async () => {
      const groupDoc = await db.collection("groups").doc(currentChatId).get();
      currentGroup = { id: currentChatId, ...groupDoc.data() };
      const perms = await db.collection("group_permissions").doc(currentChatId).get();
      groupPermissions = perms.exists ? perms.data() : { canEdit: true, canSend: true };
      renderGroupInfo();
      showScreen("scr-group-info");
    };
  } else {
    const peerId = chatData.participants.find(x => x !== me.uid);
    const u = usersCache.get(peerId);
    peer = u;

    const myAgree = me.agreedToAutoDelete === true;
    const peerAgree = await checkUserAgreement(peer.uid);

    if (myAgree !== peerAgree) {
      setTimeout(() => {
        const whoAgreed = myAgree ? "Вы" : "Собеседник";
        const whoNotAgreed = myAgree ? "собеседник" : "вы";
        const notification = document.createElement("div");
        notification.style.cssText = `
          position: fixed;
          top:70px;
          left:50%;
          transform:translateX(-50%);
          background:linear-gradient(135deg, #fbbf24, #f59e0b);
          color:#1a1a2e;
          padding:12px 20px;
          border-radius:60px;
          font-size:14px;
          font-weight:bold;
          z-index:2000;
          box-shadow:0 4px 15px rgba(0,0,0,0.3);
          animation:slideDown 0.3s ease;
          cursor:pointer;
          max-width:90%;
          text-align:center;
        `;
        notification.innerHTML = `⚠️ ${whoAgreed} приняли новое правило автоудаления, а ${whoNotAgreed} — нет. Чтобы общаться свободно, примите правило. 👆 Нажмите для info`;
        notification.onclick = () => {
          notification.remove();
          if (!myAgree) {
            showAgreementModal(() => { location.reload(); });
          } else {
            showToast("Попросите собеседника принять правило в профиле или баннере", "info");
          }
        };
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 8000);
      }, 500);
    }

    $("peerAvatar").src = getAvatarForUser(peer.uid, u);
    const statusInline = getStatusInline(u);
    const verifiedBadge = getVerifiedBadge(u);
    $("peerNick").innerHTML = `${verifiedBadge} ${escapeHtml(getDisplayNameForUser(peer.uid, u))} ${statusInline}`;
    $("peerStatus").innerHTML = u ? (isOnline(u) ? "🟢 онлайн" : getLastSeenText(u.lastSeen)) : "оффлайн";

    const chatActions = $("chatActions");
    if (chatActions) {
      chatActions.innerHTML = '';
      const deleteChatBtn = document.createElement("button");
      deleteChatBtn.className = "delete-chat-btn";
      deleteChatBtn.innerHTML = "🗑️";
      deleteChatBtn.title = "Удалить чат у обоих собеседников";
      deleteChatBtn.onclick = () => deletePrivateChat(currentChatId, peer.uid);
      chatActions.appendChild(deleteChatBtn);
    }

    const canSend = await canSendInPrivateChat(peer.uid);
    const blockReason = await getChatBlockReason(chatId, false, peer.uid);

    if (!canSend && blockReason) {
      $("sendBtn").disabled = true;
      $("msgInput").disabled = true;
      $("msgInput").placeholder = "Чат заблокирован до принятия правила";

      setTimeout(() => {
        const msgsContainer = $("msgList");
        const existingBlockMsg = document.querySelector('.chat-block-message');
        if (existingBlockMsg) existingBlockMsg.remove();

        const blockDiv = document.createElement("div");
        blockDiv.className = "chat-block-message";
        blockDiv.innerHTML = `<div style="font-size:32px; margin-bottom:8px;">⚠️</div><div style="font-weight:bold; margin-bottom:8px;">${blockReason.includes("принял") ? 'Ваш собеседник принял новое правило!' : 'Новое правило мессенджера'}</div><div style="font-size:13px; margin-bottom:12px;">${blockReason}</div>${!me.agreedToAutoDelete ? '<button id="quickAgreeBtn" style="background:#fbbf24; border:none; border-radius:40px; padding:10px 20px; color:#1a1a2e; font-weight:bold; cursor:pointer;">✅ Принять правило сейчас</button>' : ''}`;
        msgsContainer.appendChild(blockDiv);

        const quickBtn = document.getElementById("quickAgreeBtn");
        if (quickBtn) {
          quickBtn.onclick = () => showAgreementModal(() => {
            blockDiv.remove();
            $("sendBtn").disabled = false;
            $("msgInput").disabled = false;
            $("msgInput").placeholder = "Сообщение";
            showToast("🔓 Чат разблокирован! Теперь вы можете общаться.", "success");
            bindChatListRealtime();
          });
        }
      }, 100);
    } else {
      $("sendBtn").disabled = false;
      $("msgInput").disabled = false;
      $("msgInput").placeholder = "Сообщение";
    }

    $("openGroupInfoBtn").onclick = () => {
      if (peer) {
        showContactEditor(peer.uid, peer);
      }
    };
  }
  await loadMessages();
  showScreen("scr-chat");
  await loadUserStickers();
  
  if (me.role === 'creator' && !currentChatIsGroup) {
    document.getElementById('verifyUserBtn').style.display = 'flex';
  } else {
    document.getElementById('verifyUserBtn').style.display = 'none';
  }
}

async function canSendInPrivateChat(peerId) {
  if (!me || !peerId) return true;
  const myAgreement = me.agreedToAutoDelete === true;
  const peerAgreement = await checkUserAgreement(peerId);
  if (myAgreement && peerAgreement) return true;
  if (!myAgreement && !peerAgreement) return true;
  return false;
}

async function getChatBlockReason(chatId, isGroup, peerId) {
  if (isGroup) return null;
  const myAgreement = me.agreedToAutoDelete === true;
  const peerAgreement = await checkUserAgreement(peerId);
  if (!myAgreement && !peerAgreement) return null;
  if (myAgreement && peerAgreement) return null;
  if (myAgreement && !peerAgreement) {
    return "⚠️ Вы приняли новое правило, а ваш собеседник — нет. Чтобы продолжить общение, попросите его принять соглашение.";
  }
  if (!myAgreement && peerAgreement) {
    return "⚠️ Ваш собеседник принял новое правило, а вы — нет. Чтобы продолжить общение, примите соглашение выше.";
  }
  return null;
}

// ========================================================================
// LOAD MESSAGES
// ========================================================================
function formatMessageDate(timestamp) {
  if (!timestamp) return "Неизвестно";
  const date = new Date(timestamp);
  const nowDate = new Date();
  const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (messageDate.getTime() === today.getTime()) return "Сегодня";
  if (messageDate.getTime() === yesterday.getTime()) return "Вчера";
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function stopMsgWatch() { if (unsubMsgs) { unsubMsgs(); unsubMsgs = null; } }

async function loadMessages() {
  if (unsubMsgs) unsubMsgs();
  const msgRef = db.collection("chats").doc(currentChatId).collection("messages").orderBy("time");
  unsubMsgs = msgRef.onSnapshot(async (ss) => {
    const box = $("msgList");
    box.innerHTML = "";

    let importantIds = new Set();
    try {
      const importantSnapshot = await db.collection("chats").doc(currentChatId).collection("important").get();
      importantSnapshot.forEach(doc => importantIds.add(doc.id));
    } catch (e) {}

    let lastDate = null;
    const messages = [];
    ss.forEach(doc => messages.push({ id: doc.id, data: doc.data() }));
    messages.sort((a, b) => (a.data.time || 0) - (b.data.time || 0));

    for (const { id, data: m } of messages) {
      if (m.deletedFor && m.deletedFor.includes(me.uid)) continue;

      const messageDate = formatMessageDate(m.time);
      if (lastDate !== messageDate) {
        lastDate = messageDate;
        const dateDivider = document.createElement("div");
        dateDivider.className = "date-divider";
        dateDivider.innerHTML = `<span>${messageDate}</span>`;
        box.appendChild(dateDivider);
      }

      const isMe = m.sender === me.uid;
      const wrapper = document.createElement("div");
      wrapper.className = "message-wrapper" + (isMe ? " me" : "");
      wrapper.setAttribute("data-msg-id", id);

      if (importantIds.has(id)) {
        wrapper.style.borderLeft = "3px solid #fbbf24";
        wrapper.style.paddingLeft = "8px";
        wrapper.style.background = "rgba(255,215,0,0.08)";
        wrapper.style.borderRadius = "12px";
      }

      if (m.isSticker && m.sticker && !m.isDeleted) {
        const bubble = document.createElement("div");
        bubble.className = "bubble sticker-bubble" + (isMe ? " me" : "");
        const img = document.createElement("img");
        img.src = m.sticker.url;
        img.alt = "sticker";
        img.onclick = async () => {
          const exists = userStickers.some(s => s.url === m.sticker.url);
          if (exists) {
            showToast("📱 У вас уже есть этот стикер!", "info");
          } else {
            const confirmAdd = confirm("Добавить этот стикер в вашу коллекцию?");
            if (confirmAdd) {
              await saveSticker({ url: m.sticker.url, text: m.sticker.text || "" });
              showToast("✅ Стикер добавлен в коллекцию!", "success");
            }
          }
        };
        bubble.appendChild(img);
        if (m.sticker.text) {
          const textDiv = document.createElement("div");
          textDiv.style.fontSize = "11px";
          textDiv.style.marginTop = "6px";
          textDiv.style.opacity = "0.7";
          textDiv.textContent = m.sticker.text;
          bubble.appendChild(textDiv);
        }
        const footer = document.createElement("div");
        footer.className = "message-footer";
        footer.innerHTML = `<span class="t">${m.time ? fmtTime(m.time) : ""}</span>${isMe ? `<span class="message-status">${m.readBy?.includes(currentChatIsGroup ? "group" : (peer?.uid)) ? "✔✔" : "✔"}</span>` : ""}`;
        bubble.appendChild(footer);
        wrapper.appendChild(bubble);

        bubble.ondblclick = (e) => {
          e.stopPropagation();
          const isOwner = currentGroup?.ownerId === me.uid;
          const messageData = { text: "", sticker: m.sticker, isSticker: true, sender: m.sender, senderName: usersCache.get(m.sender)?.nick || "Кто-то", time: m.time };
          window.showDeleteModal(id, isMe, currentChatIsGroup, isOwner, messageData);
        };
      }
      else if (m.type === 'track' || m.isTrack) {
        const bubble = document.createElement("div");
        bubble.className = "bubble" + (isMe ? " me" : "");
        bubble.style.padding = "8px";
        bubble.style.background = isMe ? 'linear-gradient(135deg, rgba(43,134,255,.98), rgba(168,85,247,.92))' : 'rgba(255,255,255,.07)';

        let isInLibrary = false;
        try {
          const libCheck = await db.collection('user_tracks')
            .where('userId', '==', me.uid)
            .where('originalTrackId', '==', m.trackId || m.id)
            .limit(1)
            .get();
          isInLibrary = !libCheck.empty;
        } catch (e) {}

        bubble.innerHTML = `
          <div class="track-card">
            <div class="track-cover">
              ${m.trackCover ? `<img src="${m.trackCover}">` : '🎵'}
            </div>
            <div class="track-info">
              <div class="track-title">${escapeHtml(m.trackTitle || 'Без названия')}</div>
              <div class="track-artist">${escapeHtml(m.trackArtist || 'Неизвестный')}</div>
            </div>
            <div class="track-actions">
              ${!isMe ? `
                <button class="track-add-btn ${isInLibrary ? 'added' : ''}" onclick="event.stopPropagation(); addTrackToUserLibrary('${m.trackId || m.id}', '${escapeHtml(m.trackTitle || 'Без названия')}', '${escapeHtml(m.trackArtist || 'Неизвестный')}', '${m.trackCover || ''}', '${m.trackUrl}')">
                  ${isInLibrary ? '✅' : '➕'}
                </button>
              ` : ''}
              <button class="track-play-btn" onclick="event.stopPropagation(); playTrackMessage('${m.trackUrl}', this)">▶</button>
            </div>
          </div>
          <div class="message-footer">
            <span class="t">${m.time ? fmtTime(m.time) : ""}</span>
            ${isMe ? `<span class="message-status">${m.readBy?.includes(currentChatIsGroup ? "group" : (peer?.uid)) ? "✔✔" : "✔"}</span>` : ""}
          </div>
        `;
        wrapper.appendChild(bubble);
      }
      else if (!m.isSticker && !m.isDeleted) {
        if (!isMe && currentChatIsGroup) {
          const sender = usersCache.get(m.sender);
          const avatarImg = document.createElement("img");
          avatarImg.className = "message-avatar";
          avatarImg.src = sender?.avatar || defaultAvatar;
          wrapper.appendChild(avatarImg);

          const contentDiv = document.createElement("div");
          contentDiv.className = "message-content";

          const senderSpan = document.createElement("div");
          senderSpan.className = "message-sender";
          const senderStatus = getStatusInline(sender);
          const senderVerified = getVerifiedBadge(sender);
          senderSpan.innerHTML = `${senderVerified} ${escapeHtml(sender?.nick || "Кто-то")} ${senderStatus}`;
          contentDiv.appendChild(senderSpan);

          const bubble = document.createElement("div");
          bubble.className = "bubble";
          bubble.innerHTML = `<div>${escapeHtml(m.text || "")}</div><div class="message-footer"><span class="t">${m.time ? fmtTime(m.time) : ""}</span></div>`;
          contentDiv.appendChild(bubble);
          wrapper.appendChild(contentDiv);

          bubble.ondblclick = (e) => {
            e.stopPropagation();
            const isOwner = currentGroup?.ownerId === me.uid;
            const messageData = { text: m.text, sticker: null, isSticker: false, sender: m.sender, senderName: sender?.nick || "Кто-то", time: m.time };
            window.showDeleteModal(id, isMe, currentChatIsGroup, isOwner, messageData);
          };
        } else {
          const bubble = document.createElement("div");
          bubble.className = "bubble" + (isMe ? " me" : "");
          bubble.innerHTML = `<div>${escapeHtml(m.text || "")}</div><div class="message-footer"><span class="t">${m.time ? fmtTime(m.time) : ""}</span>${isMe ? `<span class="message-status">${m.readBy?.includes(currentChatIsGroup ? "group" : (peer?.uid)) ? "✔✔" : "✔"}</span>` : ""}</div>`;
          wrapper.appendChild(bubble);

          bubble.ondblclick = (e) => {
            e.stopPropagation();
            const isOwner = currentGroup?.ownerId === me.uid;
            const messageData = { text: m.text, sticker: null, isSticker: false, sender: m.sender, senderName: isMe ? me.nick : (usersCache.get(m.sender)?.nick || "Кто-то"), time: m.time };
            window.showDeleteModal(id, isMe, currentChatIsGroup, isOwner, messageData);
          };
        }
      } else {
        const bubble = document.createElement("div");
        bubble.className = "bubble" + (isMe ? " me" : "");
        bubble.innerHTML = `<div><em>${escapeHtml(m.text || "Сообщение удалено")}</em></div><div class="message-footer"><span class="t">${m.time ? fmtTime(m.time) : ""}</span></div>`;
        wrapper.appendChild(bubble);
      }
      box.appendChild(wrapper);
    }
    box.scrollTop = box.scrollHeight;

    await cleanOldMessages(currentChatId, currentChatIsGroup, currentGroup?.ownerId);
  });
}

// ========================================================================
// SEND MESSAGE
// ========================================================================
async function sendMessage() {
  if (currentChatIsGroup) {
    const perms = await db.collection("group_permissions").doc(currentChatId).get();
    const isOwner = currentGroup?.ownerId === me.uid;
    if (!isOwner && !perms.data()?.canSend) { alert("Отправка сообщений отключена в этой группе"); return; }
  } else if (isBlocked) { alert("Вы не можете отправлять сообщения в этом чате"); return; }

  if (!currentChatIsGroup && peer && peer.uid) {
    const canSend = await canSendInPrivateChat(peer.uid);
    if (!canSend) {
      const myAgree = me.agreedToAutoDelete === true;
      const peerAgree = await checkUserAgreement(peer.uid);
      if (myAgree && !peerAgree) {
        showToast("❌ Собеседник ещё не принял новое правило. Попросите его согласиться.", "error");
      } else if (!myAgree && peerAgree) {
        showToast("❌ Вы не приняли новое правило. Нажмите на баннер сверху, чтобы согласиться.", "error");
      } else {
        showToast("❌ Невозможно отправить сообщение. Примите новое правило.", "error");
      }
      return;
    }
  }

  const isMuted = await checkMuteStatus(me.uid);
  if (isMuted) { alert("Вы временно заглушены и не можете отправлять сообщения"); return; }
  const text = $("msgInput").value.trim();
  if (!text || !currentChatId) return;
  $("msgInput").value = "";
  const msgData = { text, sender: me.uid, time: now(), readBy: [me.uid] };
  await db.collection("chats").doc(currentChatId).collection("messages").add(msgData);
  await db.collection("chats").doc(currentChatId).set({ lastText: text, lastTime: now() }, { merge: true });
  await clearMyTyping();
  
  // Отправка пуша собеседнику
// Отправка пуша через OneSignal
if (!currentChatIsGroup && peer && peer.uid) {
  try {
    const userDoc = await db.collection('users').doc(peer.uid).get();
    const userData = userDoc.data();
    const peerPushEnabled = userData.pushEnabled === true;
    
    if (peerPushEnabled) {
      console.log('📨 Отправка пуша через OneSignal');
      
      const response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + process.env.ONESIGNAL_API_KEY
        },
        body: JSON.stringify({
          app_id: 'f55c1b55-b383-4008-8072-8ba4382c6dac',
          include_external_user_ids: [peer.uid],
          headings: { 
            en: me.nick || 'Новое сообщение' 
          },
          contents: { 
            en: text || 'Сообщение' 
          },
          data: {
            chatId: currentChatId,
            senderId: me.uid,
            senderName: me.nick
          }
        })
      });
      
      if (response.ok) {
        console.log('✅ Пуш отправлен через OneSignal');
      } else {
        const errorData = await response.json();
        console.error('❌ Ошибка OneSignal:', errorData);
      }
    }
  } catch (e) {
    console.error('Ошибка отправки пуша:', e);
  }
}
}

$("sendBtn").addEventListener("click", sendMessage);
$("msgInput").addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

function closeChat() { clearMyTyping(); showScreen("scr-chats"); }
$("backToChats").addEventListener("click", closeChat);
$("exitChat").addEventListener("click", closeChat);

// ========================================================================
// TYPING
// ========================================================================
async function setMyTyping() {
  if ((!peer && !currentChatIsGroup) || !session) return;
  if (!currentChatIsGroup && isBlocked) return;
  const isMuted = await checkMuteStatus(me.uid);
  if (isMuted) return;
  try {
    await db.collection("users").doc(me.uid).set({
      typingTo: currentChatIsGroup ? currentChatId : peer?.uid,
      typingAt: now()
    }, { merge: true });
  } catch (e) {}
}

async function clearMyTyping() {
  if (!session || !me) return;
  try {
    await db.collection("users").doc(me.uid).set({
      typingTo: "",
      typingAt: 0
    }, { merge: true });
  } catch (e) {}
}

$("msgInput").addEventListener("input", () => {
  if (!currentChatId) return;
  if (!typingTimer) { typingTimer = setTimeout(async () => { typingTimer = null; await setMyTyping(); }, 150); }
  if (typingClearTimer) clearTimeout(typingClearTimer);
  typingClearTimer = setTimeout(() => clearMyTyping(), 1200);
});

// ========================================================================
// STICKERS
// ========================================================================
async function loadUserStickers() {
  if (!me) return;
  const snap = await db.collection("stickers").where("ownerId", "==", me.uid).get();
  userStickers = [];
  snap.forEach(doc => userStickers.push({ id: doc.id, ...doc.data() }));
  renderStickerPanel();
}

async function saveSticker(stickerData) {
  if (!me) return;
  const stickerId = randId("st");
  await db.collection("stickers").doc(stickerId).set({ ...stickerData, id: stickerId, ownerId: me.uid, createdAt: now() });
  await loadUserStickers();
}

async function deleteSticker(stickerId) {
  if (!confirm("🗑️ Удалить этот стикер навсегда?")) return;
  try {
    await db.collection("stickers").doc(stickerId).delete();
    await loadUserStickers();
    showToast("✅ Стикер удалён", "success");
  } catch (e) { console.error(e); showToast("Ошибка при удалении", "error"); }
}

async function sendSticker(stickerId) {
  if (!currentChatId) return;
  const sticker = userStickers.find(s => s.id === stickerId);
  if (!sticker) return;
  const msgData = {
    text: "",
    sticker: { id: sticker.id, url: sticker.url, text: sticker.text || "" },
    sender: me.uid,
    time: now(),
    readBy: [me.uid],
    isSticker: true
  };
  await db.collection("chats").doc(currentChatId).collection("messages").add(msgData);
  await db.collection("chats").doc(currentChatId).set({ lastText: "📷 Стикер", lastTime: now() }, { merge: true });
  closeStickerPanel();
}

function renderStickerPanel() {
  const container = $("stickerList");
  if (!container) return;
  container.innerHTML = "";
  const addBtn = document.createElement("div");
  addBtn.className = "sticker-item sticker-add-btn";
  addBtn.innerHTML = "+";
  addBtn.onclick = () => createNewSticker();
  container.appendChild(addBtn);
  if (userStickers.length === 0) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "empty-stickers";
    emptyDiv.innerHTML = "😢 У вас пока нет стикеров<br><small>Нажмите на + чтобы создать первый стикер</small>";
    container.appendChild(emptyDiv);
  } else {
    for (const sticker of userStickers) {
      const div = document.createElement("div");
      div.className = "sticker-item";
      div.innerHTML = `<img src="${sticker.url}" alt="sticker"><div style="font-size:10px; margin-top:4px; opacity:0.7;">${escapeHtml(sticker.text || "")}</div><button class="sticker-delete-btn" onclick="event.stopPropagation(); deleteSticker('${sticker.id}')">🗑️</button>`;
      div.onclick = (e) => { if (e.target !== div.querySelector('.sticker-delete-btn')) sendSticker(sticker.id); };
      container.appendChild(div);
    }
  }
}

function toggleStickerPanel() {
  const panel = $("stickerPanel");
  if (stickerPanelOpen) {
    panel.classList.remove("open");
    stickerPanelOpen = false;
  } else {
    loadUserStickers();
    panel.classList.add("open");
    stickerPanelOpen = true;
  }
}

function closeStickerPanel() {
  const panel = $("stickerPanel");
  panel.classList.remove("open");
  stickerPanelOpen = false;
}

async function createNewSticker() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 512, useWebWorker: true };
    try {
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onload = (ev) => openAdvancedStickerEditor(ev.target.result);
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      const reader = new FileReader();
      reader.onload = (ev) => openAdvancedStickerEditor(ev.target.result);
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

// ========================================================================
// ATTACH MENU
// ========================================================================
let attachMenuOpen = false;

document.getElementById('attachBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  toggleAttachMenu();
});

function toggleAttachMenu() {
  const menu = document.getElementById('attachMenu');
  attachMenuOpen = !attachMenuOpen;
  menu.classList.toggle('open', attachMenuOpen);
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.composer') && !e.target.closest('.attach-menu')) {
    document.getElementById('attachMenu').classList.remove('open');
    attachMenuOpen = false;
  }
});

function openStickerPanel() {
  document.getElementById('attachMenu').classList.remove('open');
  attachMenuOpen = false;
  toggleStickerPanel();
}

// ========================================================================
// MUSIC PICKER
// ========================================================================
let userTracksCache = [];

async function openMusicPicker() {
  document.getElementById('attachMenu').classList.remove('open');
  attachMenuOpen = false;

  const modal = document.getElementById('musicPickerModal');
  modal.classList.remove('hidden');

  const container = document.getElementById('musicPickerList');
  container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--muted);">⏳ Загрузка...</div>';

  try {
    const snapshot = await db.collection('user_tracks')
      .where('userId', '==', me.uid)
      .orderBy('addedAt', 'desc')
      .get();

    userTracksCache = [];
    snapshot.forEach(doc => {
      userTracksCache.push({ id: doc.id, ...doc.data() });
    });

    renderMusicPickerList();
  } catch (error) {
    console.error('Ошибка загрузки треков:', error);
    container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--red);">❌ Ошибка загрузки</div>';
  }
}

function closeMusicPicker() {
  document.getElementById('musicPickerModal').classList.add('hidden');
}

function renderMusicPickerList() {
  const container = document.getElementById('musicPickerList');

  if (userTracksCache.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:30px; color:var(--muted);">
        <div style="font-size:48px; margin-bottom:12px;">🎵</div>
        <p>У вас нет треков в библиотеке</p>
        <p style="font-size:13px;">Добавьте музыку через LoL Player</p>
      </div>
    `;
    return;
  }

  container.innerHTML = userTracksCache.map(track => `
    <div class="music-picker-item" onclick="sendTrackMessage('${track.id}')">
      <div class="cover">
        ${track.cover ? `<img src="${track.cover}">` : '🎵'}
      </div>
      <div class="info">
        <div class="title">${escapeHtml(track.title)}</div>
        <div class="artist">${escapeHtml(track.artist)}</div>
      </div>
      <button class="select-btn">Выбрать</button>
    </div>
  `).join('');
}

async function sendTrackMessage(trackId) {
  const track = userTracksCache.find(t => t.id === trackId);
  if (!track) {
    showToast("❌ Трек не найден", "error");
    return;
  }

  closeMusicPicker();

  if (!currentChatId) {
    showToast("❌ Чат не выбран", "error");
    return;
  }

  const msgData = {
    type: 'track',
    trackId: track.originalTrackId || track.id,
    trackTitle: track.title,
    trackArtist: track.artist,
    trackCover: track.cover || null,
    trackUrl: track.audioUrl,
    text: `🎵 ${track.title} — ${track.artist}`,
    sender: me.uid,
    time: now(),
    readBy: [me.uid],
    isTrack: true
  };

  try {
    await db.collection('chats').doc(currentChatId).collection('messages').add(msgData);
    await db.collection('chats').doc(currentChatId).set({
      lastText: `🎵 ${track.title} — ${track.artist}`,
      lastTime: now()
    }, { merge: true });
    showToast("✅ Трек отправлен!", "success");
  } catch (error) {
    console.error('Ошибка отправки трека:', error);
    showToast("❌ Не удалось отправить трек", "error");
  }
}

// ========================================================================
// TRACK PLAYBACK IN CHAT
// ========================================================================
let chatTrackAudio = null;
let isChatTrackPlaying = false;

function playTrackMessage(audioUrl, btnElement) {
  if (!audioUrl) {
    showToast("❌ Ссылка на трек не найдена", "error");
    return;
  }

  if (chatTrackAudio && chatTrackAudio.src === audioUrl) {
    if (isChatTrackPlaying) {
      chatTrackAudio.pause();
      isChatTrackPlaying = false;
      if (btnElement) btnElement.textContent = '▶';
    } else {
      chatTrackAudio.play();
      isChatTrackPlaying = true;
      if (btnElement) btnElement.textContent = '⏸';
    }
    return;
  }

  if (chatTrackAudio) {
    chatTrackAudio.pause();
    chatTrackAudio = null;
  }

  document.querySelectorAll('.track-play-btn').forEach(btn => btn.textContent = '▶');

  chatTrackAudio = new Audio(audioUrl);
  chatTrackAudio.onended = function() {
    isChatTrackPlaying = false;
    document.querySelectorAll('.track-play-btn').forEach(btn => btn.textContent = '▶');
  };
  chatTrackAudio.onerror = function() {
    showToast("❌ Ошибка воспроизведения", "error");
    isChatTrackPlaying = false;
    document.querySelectorAll('.track-play-btn').forEach(btn => btn.textContent = '▶');
  };

  chatTrackAudio.play();
  isChatTrackPlaying = true;
  if (btnElement) btnElement.textContent = '⏸';
}

// ========================================================================
// USER TRACK LIBRARY
// ========================================================================
async function isTrackInUserLibrary(originalTrackId) {
  if (!me) return false;
  try {
    const snapshot = await db.collection('user_tracks')
      .where('userId', '==', me.uid)
      .where('originalTrackId', '==', originalTrackId)
      .limit(1)
      .get();
    return !snapshot.empty;
  } catch (error) {
    console.error('Ошибка проверки:', error);
    return false;
  }
}

async function addTrackToUserLibrary(originalTrackId, title, artist, cover, audioUrl) {
  if (!me) {
    showToast("❌ Войдите в аккаунт", "error");
    return;
  }

  const exists = await isTrackInUserLibrary(originalTrackId);
  if (exists) {
    showToast("✅ Трек уже в вашей библиотеке", "success");
    return;
  }

  try {
    await db.collection('user_tracks').add({
      userId: me.uid,
      originalTrackId: originalTrackId,
      title: title || 'Без названия',
      artist: artist || 'Неизвестный',
      cover: cover || null,
      audioUrl: audioUrl,
      addedAt: firebase.firestore.FieldValue.serverTimestamp(),
      isCustomized: false,
      plays: 0
    });

    showToast("✅ Трек добавлен в вашу библиотеку!", "success");

    const addBtn = document.querySelector(`button[data-track-id="${originalTrackId}"]`);
    if (addBtn) {
      addBtn.textContent = '✅';
      addBtn.className = 'track-add-btn added';
    }
  } catch (error) {
    console.error('Ошибка добавления:', error);
    showToast("❌ Не удалось добавить трек", "error");
  }
}

async function getUserTracksWithCustomizations() {
  if (!me) return [];
  try {
    const snapshot = await db.collection('user_tracks')
      .where('userId', '==', me.uid)
      .orderBy('addedAt', 'desc')
      .get();

    const tracks = [];
    snapshot.forEach(doc => {
      tracks.push({
        id: doc.id,
        ...doc.data(),
        isCustomized: doc.data().isCustomized || false
      });
    });
    return tracks;
  } catch (error) {
    console.error('Ошибка загрузки треков:', error);
    return [];
  }
}

async function updateUserTrack(trackId, updates) {
  if (!me) return;
  try {
    await db.collection('user_tracks').doc(trackId).update({
      ...updates,
      isCustomized: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast("✅ Информация обновлена!", "success");
    return true;
  } catch (error) {
    console.error('Ошибка обновления:', error);
    showToast("❌ Не удалось обновить", "error");
    return false;
  }
}

async function removeTrackFromUserLibrary(trackId) {
  if (!confirm('Удалить этот трек из вашей библиотеки?')) return;
  try {
    await db.collection('user_tracks').doc(trackId).delete();
    showToast("🗑️ Трек удален из библиотеки", "success");
    loadPlayerTracks();
    return true;
  } catch (error) {
    console.error('Ошибка удаления:', error);
    showToast("❌ Не удалось удалить", "error");
    return false;
  }
}

// ========================================================================
// PLAYER FUNCTIONS
// ========================================================================
async function uploadTrackToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY.uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.secure_url) {
      return {
        url: data.secure_url,
        publicId: data.public_id,
        duration: data.duration || 0,
        format: data.format
      };
    } else {
      throw new Error('Upload failed - no secure_url');
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

async function addPlayerTrack() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/flac,audio/x-m4a,audio/mp4,audio/*';
  input.multiple = false;

  input.onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) {
      showToast("⚠️ Файл не выбран", "error");
      return;
    }

    if (!file.type.startsWith('audio/')) {
      showToast("⚠️ Пожалуйста, выберите аудиофайл!", "error");
      return;
    }

    try {
      showToast("⏳ Загрузка на Cloudinary...", "info");

      const result = await uploadTrackToCloudinary(file);

      await db.collection('user_tracks').add({
        userId: me.uid,
        originalTrackId: randId('track'),
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Неизвестный',
        cover: null,
        audioUrl: result.url,
        cloudinaryId: result.publicId,
        duration: result.duration,
        addedAt: firebase.firestore.FieldValue.serverTimestamp(),
        isCustomized: false,
        plays: 0
      });

      showToast(`✅ "${file.name.replace(/\.[^/.]+$/, '')}" загружен!`, "success");
      loadPlayerTracks();
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      showToast("❌ Не удалось загрузить файл: " + error.message, "error");
    }
  };
  input.click();
}

async function loadPlayerTracks() {
  const container = document.getElementById('trackListContainer');
  if (!container) return;
  container.innerHTML = '<div class="player-empty"><div class="spinner" style="display:inline-block; width:30px; height:30px; border:3px solid rgba(255,255,255,0.1); border-radius:50%; border-top-color:#3b82f6; animation:spin 1s ease-in-out infinite;"></div><p style="margin-top:12px;">Загрузка...</p></div>';

  try {
    const tracks = await getUserTracksWithCustomizations();
    playerTracks = tracks;

    if (tracks.length === 0) {
      container.innerHTML = `
        <div class="player-empty">
          <div class="icon">🎵</div>
          <p>Нет треков. Нажмите + чтобы загрузить музыку</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `<div class="player-track-list">${tracks.map((track) => {
      const isActive = track.id === currentTrackId;
      const coverHtml = track.cover ? 
        `<img src="${track.cover}" alt="cover">` : 
        `<span class="no-cover">🎵</span>`;
      return `
        <div class="player-track-item ${isActive ? 'active' : ''}" onclick="playTrack('${track.id}')">
          <div class="track-cover">${coverHtml}</div>
          <div class="track-info">
            <div class="track-title">${escapeHtml(track.title)}</div>
            <div class="track-artist">${escapeHtml(track.artist)}</div>
          </div>
          <div class="track-actions">
            <button class="edit-btn" onclick="event.stopPropagation(); openEditTrack('${track.id}')">✏️</button>
            <button class="delete-btn" onclick="event.stopPropagation(); removeTrackFromUserLibrary('${track.id}')">🗑️</button>
          </div>
        </div>
      `;
    }).join('')}</div>`;
  } catch (error) {
    console.error('Ошибка загрузки треков:', error);
    container.innerHTML = '<div class="player-empty"><div class="icon">⚠️</div><p>Ошибка загрузки</p></div>';
  }
}

// ========================================================================
// PLAYER CONTROLS
// ========================================================================
function playTrack(id) {
  const track = playerTracks.find(t => t.id === id);
  if (!track) {
    showToast("❌ Трек не найден", "error");
    return;
  }

  if (!track.audioUrl) {
    showToast("❌ Не удалось загрузить трек", "error");
    return;
  }

  currentTrackId = id;
  audio.pause();
  audio = new Audio(track.audioUrl);
  audio.playbackRate = parseFloat(document.getElementById('speedSlider').value);
  audio.ontimeupdate = updateTime;
  audio.onended = nextTrack;
  audio.onerror = function(e) {
    console.error('Ошибка воспроизведения:', e);
    showToast("❌ Ошибка воспроизведения", "error");
    isPlaying = false;
    updatePlayerUI();
  };
  audio.onloadedmetadata = function() {
    document.getElementById('timeSlider').max = audio.duration;
    document.getElementById('totalTime').textContent = formatTime(audio.duration);
  };

  audio.play().then(() => {
    isPlaying = true;
    updatePlayerUI();
    updateMediaSession(track);
  }).catch((err) => {
    console.error('Ошибка воспроизведения:', err);
    isPlaying = false;
    updatePlayerUI();
    showToast("❌ Не удалось воспроизвести", "error");
  });

  loadPlayerTracks();
  updatePlayerUI();
}

function togglePlay() {
  if (!currentTrackId) {
    if (playerTracks.length > 0) {
      playTrack(playerTracks[0].id);
    } else {
      showToast("🎵 Нет треков для воспроизведения", "info");
    }
    return;
  }
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    audio.play().then(() => {
      isPlaying = true;
      const track = playerTracks.find(t => t.id === currentTrackId);
      if (track) updateMediaSession(track);
    }).catch(() => {
      showToast("❌ Ошибка воспроизведения", "error");
    });
  }
  updatePlayerUI();
}

function nextTrack() {
  const idx = playerTracks.findIndex(t => t.id === currentTrackId);
  if (idx === -1 || playerTracks.length === 0) return;
  const next = (idx + 1) % playerTracks.length;
  playTrack(playerTracks[next].id);
}

function prevTrack() {
  const idx = playerTracks.findIndex(t => t.id === currentTrackId);
  if (idx === -1 || playerTracks.length === 0) return;
  const prev = (idx - 1 + playerTracks.length) % playerTracks.length;
  playTrack(playerTracks[prev].id);
}

function seekTrack(value) {
  audio.currentTime = value;
  document.getElementById('currentTime').textContent = formatTime(value);
}

function updateTime() {
  const slider = document.getElementById('timeSlider');
  slider.value = audio.currentTime;
  document.getElementById('currentTime').textContent = formatTime(audio.currentTime);
  if (audio.duration) {
    document.getElementById('totalTime').textContent = formatTime(audio.duration);
  }
}

function changeSpeed(val) {
  audio.playbackRate = parseFloat(val);
  document.getElementById('speedValue').textContent = val + 'x';
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function updatePlayerUI() {
  const track = playerTracks.find(t => t.id === currentTrackId);
  const titleEl = document.getElementById('playerTitle');
  const artistEl = document.getElementById('playerArtist');
  const coverEl = document.getElementById('playerCover');
  const playBtn = document.getElementById('playBtn');

  if (track) {
    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;
    coverEl.innerHTML = track.cover ? 
      `<img src="${track.cover}" alt="cover">` : 
      `<span style="color:rgba(255,255,255,0.3);font-size:20px;">🎵</span>`;
  } else {
    titleEl.textContent = 'Нет трека';
    artistEl.textContent = '—';
    coverEl.innerHTML = `<span style="color:rgba(255,255,255,0.3);font-size:20px;">🎵</span>`;
  }
  playBtn.textContent = isPlaying ? '⏸' : '▶';
}

// ========================================================================
// MEDIA SESSION
// ========================================================================
function updateMediaSession(track) {
  if (!track || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: 'LoL Player',
      artwork: track.cover ? [
        { src: track.cover, sizes: '512x512', type: 'image/jpeg' }
      ] : []
    });
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    
    navigator.mediaSession.setActionHandler('play', () => togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime) audio.currentTime = details.seekTime;
    });
  } catch (e) {
    console.log('Media Session не поддерживается');
  }
}

// ========================================================================
// EDIT TRACK
// ========================================================================
function openEditTrack(id) {
  editTrackId = id;
  const track = playerTracks.find(t => t.id === id);
  if (!track) return;
  
  document.getElementById('editTrackTitle').value = track.title;
  document.getElementById('editTrackArtist').value = track.artist;
  tempCoverData = track.cover;
  
  const coverEl = document.getElementById('editTrackCover');
  if (track.cover) {
    coverEl.innerHTML = `<img src="${track.cover}" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    coverEl.innerHTML = '🎵';
  }
  
  document.getElementById('editTrackModal').classList.remove('hidden');
}

function closeEditTrackModal() {
  document.getElementById('editTrackModal').classList.add('hidden');
  editTrackId = null;
  tempCoverData = null;
  document.getElementById('editTrackCoverInput').value = '';
}

function loadEditCover(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    tempCoverData = e.target.result;
    const coverEl = document.getElementById('editTrackCover');
    coverEl.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
  };
  reader.readAsDataURL(file);
}

async function saveTrackEdit() {
  const trackId = editTrackId;
  const title = document.getElementById('editTrackTitle').value.trim() || 'Без названия';
  const artist = document.getElementById('editTrackArtist').value.trim() || 'Неизвестный';
  
  const updates = { title, artist };
  
  if (tempCoverData) {
    try {
      const formData = new FormData();
      formData.append('file', tempCoverData);
      formData.append('upload_preset', CLOUDINARY.uploadPreset);
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/upload`,
        { method: 'POST', body: formData }
      );
      
      const data = await response.json();
      if (data.secure_url) {
        updates.cover = data.secure_url;
      }
    } catch (error) {
      console.error('Ошибка загрузки обложки:', error);
      showToast("❌ Не удалось загрузить обложку", "error");
      return;
    }
  }
  
  const success = await updateUserTrack(trackId, updates);
  if (success) {
    closeEditTrackModal();
    loadPlayerTracks();
  }
}

// ========================================================================
// PROFILE
// ========================================================================
function renderProfile() {
  if (!me) return;
  $("meAvatar").src = me.avatar || defaultAvatar;
  let nickHtml = escapeHtml(me.nick || "Кто-то");
  const statusInline = getStatusInline(me);
  const verifiedBadge = getVerifiedBadge(me);
  nickHtml = verifiedBadge + ' ' + nickHtml + ' ' + statusInline;
  if (me.role === "creator") nickHtml += ' <span style="font-size:20px;">🔨</span>';
  $("meNick").innerHTML = nickHtml;
  $("mePhone").textContent = me.phone || "";
  $("meLogin").textContent = "Логин: " + (me.login || "");
  $("balanceDisplay").textContent = me.balance || 0;
  $("editAvatarPreview").src = me.avatar || defaultAvatar;
  $("editNick").value = me.nick || "";
  $("editPhone").value = me.phone || "";
  const creatorBtn = $("creatorBtn");
  if (me.role === "creator") { creatorBtn.textContent = "🔨 Убрать создателя"; creatorBtn.classList.remove("hidden"); } else { creatorBtn.textContent = "🔨 Стать создателем"; creatorBtn.classList.remove("hidden"); }
  if (me.role === "creator") { $("creatorGiftBtn").style.display = "inline-block"; } else { $("creatorGiftBtn").style.display = "none"; }

  addImportantButtonToProfile();

  const profileCard = document.querySelector("#scr-profile .profileCard");
  if (profileCard) {
    const existingAgreementInfo = document.getElementById("agreementInfo");
    if (existingAgreementInfo) existingAgreementInfo.remove();

    const agreementStatus = me.agreedToAutoDelete === true;
    const isGroupOwner = (me.ownedGroupsCount || 0) > 0;
    const agreementInfo = document.createElement("div");
    agreementInfo.id = "agreementInfo";
    agreementInfo.style.cssText = `margin-top:16px; padding:12px; background:${agreementStatus ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.15)'}; border-radius:16px; font-size:13px;`;

    if (agreementStatus) {
      agreementInfo.innerHTML = `<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;"><span>✅ Правило автоудаления принято</span><span style="font-size:11px; color:var(--muted2);">Сообщения >30 дней удаляются</span></div>${isGroupOwner ? '<div style="font-size:11px; margin-top:6px; color:var(--muted2);">👑 Вы владелец групп — в ваших группах автоочистка ВКЛЮЧЕНА</div>' : ''}`;
    } else {
      agreementInfo.innerHTML = `<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;"><span>⚠️ Правило автоудаления НЕ принято</span><button id="agreeFromProfileBtn" style="background:#fbbf24; border:none; border-radius:40px; padding:6px 12px; color:#1a1a2e; font-weight:bold; cursor:pointer;">Принять</button></div><div style="font-size:11px; margin-top:6px; color:var(--muted2);">${isGroupOwner ? '❗ Вы владелец групп — если примете правило, в ваших группах начнётся автоочистка' : '💡 В личных чатах очистка работает только если собеседник тоже согласится'}</div>`;
    }
    profileCard.appendChild(agreementInfo);

    const agreeBtn = document.getElementById("agreeFromProfileBtn");
    if (agreeBtn) {
      agreeBtn.onclick = () => showAgreementModal(() => {
        agreementInfo.remove();
        renderProfile();
        showToast("✅ Правило принято!", "success");
        const banner = document.getElementById("agreementBanner");
        if (banner) banner.remove();
        bindChatListRealtime();
      });
    }
  }
}

$("saveProfileBtn").addEventListener("click", async () => {
  clearMsg($("profileMsg"));
  const nick = $("editNick").value.trim() || "Кто-то";
  const phone = $("editPhone").value.trim() || "";
  let avatar = $("editAvatarPreview").src;
  const fileInput = $("editAvatarFile");
  if (fileInput.files && fileInput.files[0]) { try { avatar = await uploadAvatar(fileInput.files[0]); } catch (e) { console.error(e); alert("Ошибка при загрузке аватарки"); return; } }
  try {
    await db.collection("users").doc(me.uid).set({ nick, phone, avatar }, { merge: true });
    me.nick = nick;
    me.phone = phone;
    me.avatar = avatar;
    usersCache.set(me.uid, me);
    renderProfile();
    setMsg($("profileMsg"), "Сохранено ✅", "ok");
  } catch (e) { setMsg($("profileMsg"), "Ошибка: " + (e?.message || String(e)), "err"); }
});

// ========================================================================
// CREATOR BUTTON
// ========================================================================
$("creatorBtn").addEventListener("click", async () => {
  if (me.role === "creator") {
    if (confirm("Вы уверены, что хотите убрать права создателя?")) {
      try { await db.collection("users").doc(me.uid).update({ role: "user" });
        me.role = "user";
        renderProfile();
        alert("👤 Права создателя убраны"); } catch (e) { alert("Ошибка: " + e.message); }
    }
  } else {
    const pass = prompt("Введите пароль создателя:");
    if (!pass) return;
    const configDoc = await db.collection("config").doc("creator").get();
    if (!configDoc.exists) {
      alert("Режим создателя не настроен. Свяжитесь с администратором.");
      return;
    }
    const storedHash = configDoc.data().passwordHash;
    const enteredHash = await sha256Hex(pass);
    if (enteredHash === storedHash) {
      await db.collection("users").doc(me.uid).update({ role: "creator" });
      me.role = "creator";
      renderProfile();
      alert("🎉 Теперь вы создатель!");
    } else {
      alert("Неверный пароль!");
    }
  }
});

// ========================================================================
// IMPORTANT MESSAGES
// ========================================================================
window.toggleImportantMessage = async function(messageId, messageData) {
  if (!me || !currentChatId) return false;
  const importantRef = db.collection("chats").doc(currentChatId).collection("important");
  const doc = await importantRef.doc(messageId).get();
  if (doc.exists) {
    await importantRef.doc(messageId).delete();
    showToast("⭐ Сообщение удалено из важных", "info");
    const wrapper = document.querySelector(`.message-wrapper[data-msg-id="${messageId}"]`);
    if (wrapper) {
      wrapper.style.borderLeft = "";
      wrapper.style.paddingLeft = "";
      wrapper.style.background = "";
      wrapper.style.borderRadius = "";
    }
    return false;
  } else {
    let senderName = messageData?.senderName || usersCache.get(messageData?.sender)?.nick || me.nick || "Кто-то";
    await importantRef.doc(messageId).set({
      chatId: currentChatId,
      messageId: messageId,
      text: messageData?.text || (messageData?.isSticker ? "[Стикер]" : "Сообщение"),
      sticker: messageData?.sticker || null,
      isSticker: messageData?.isSticker || false,
      sender: messageData?.sender || me.uid,
      senderName: senderName,
      time: messageData?.time || Date.now(),
      addedBy: me.uid,
      addedByNick: me.nick,
      addedAt: Date.now(),
      protected: true
    });
    showToast("⭐ Сообщение добавлено в важные", "success");
    const wrapper = document.querySelector(`.message-wrapper[data-msg-id="${messageId}"]`);
    if (wrapper) {
      wrapper.style.borderLeft = "3px solid #fbbf24";
      wrapper.style.paddingLeft = "8px";
      wrapper.style.background = "rgba(255,215,0,0.15)";
      wrapper.style.borderRadius = "12px";
    }
    return true;
  }
};

async function getAllImportantMessages() {
  if (!me) return [];
  const chatsSnapshot = await db.collection("chats").where("participants", "array-contains", me.uid).get();
  const allImportant = [];
  for (const chatDoc of chatsSnapshot.docs) {
    const chatId = chatDoc.id;
    const importantSnapshot = await db.collection("chats").doc(chatId).collection("important").get();
    for (const doc of importantSnapshot.docs) {
      const data = doc.data();
      allImportant.push({ ...data, chatId, chatName: chatDoc.data().isGroup ? chatDoc.data().groupName : "Личный чат" });
    }
  }
  allImportant.sort((a, b) => b.addedAt - a.addedAt);
  return allImportant;
}

async function showImportantMessages() {
  if (!me) { showToast("Сначала войдите в аккаунт", "error"); return; }
  const importantMessages = await getAllImportantMessages();
  if (importantMessages.length === 0) { showToast("📭 У вас нет важных сообщений", "info"); return; }

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `<div class="modal-content" style="max-width:500px; max-height:80vh; overflow-y:auto;"><h3>⭐ Важные сообщения <span style="font-size:12px; color:#fbbf24;">(не удаляются)</span></h3><div id="importantMessagesList" style="margin-top:16px;"></div><div class="modal-buttons" style="margin-top:20px;"><button class="modal-btn cancel" onclick="this.closest('.modal').remove()">Закрыть</button></div></div>`;
  document.body.appendChild(modal);

  const container = document.getElementById("importantMessagesList");
  for (const msg of importantMessages) {
    const date = new Date(msg.time).toLocaleString();
    const addedDate = new Date(msg.addedAt).toLocaleString();
    const div = document.createElement("div");
    div.style.cssText = "background:rgba(255,215,0,0.1); border-left:3px solid #fbbf24; border-radius:12px; padding:12px; margin-bottom:12px; cursor:pointer; transition:0.2s;";
    div.onclick = () => { modal.remove();
      openChatAndScrollToMessage(msg.chatId, msg.messageId); };
    div.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"><span style="font-weight:600; color:var(--blue);">📌 ${escapeHtml(msg.chatName)}</span><span style="font-size:11px; color:var(--muted2);">${date}</span></div><div style="font-size:14px; margin-bottom:8px;">${msg.isSticker ? '📷 Стикер' : escapeHtml(msg.text || '')}</div><div style="display:flex; justify-content:space-between; align-items:center;"><span style="font-size:11px; color:var(--muted2);">👤 От: ${escapeHtml(msg.senderName)}</span><span style="font-size:11px; color:var(--muted2);">⭐ Добавил: ${escapeHtml(msg.addedByNick)} (${addedDate})</span></div><div style="display:flex; gap:8px; margin-top:8px;"><button class="delete-important-btn" data-chat="${msg.chatId}" data-id="${msg.messageId}" style="background:rgba(239,68,68,0.2); border:none; border-radius:8px; padding:4px 12px; color:#fecaca; cursor:pointer; font-size:12px;">🗑️ Убрать из важных</button></div>`;
    container.appendChild(div);
  }

  document.querySelectorAll('.delete-important-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const chatId = btn.dataset.chat;
      const messageId = btn.dataset.id;
      await db.collection("chats").doc(chatId).collection("important").doc(messageId).delete();
      btn.closest('div[style*="border-left:3px solid #fbbf24"]')?.remove();
      showToast("⭐ Сообщение удалено из важных", "info");
      if (currentChatId === chatId) {
        const wrapper = document.querySelector(`.message-wrapper[data-msg-id="${messageId}"]`);
        if (wrapper) {
          wrapper.style.borderLeft = "";
          wrapper.style.paddingLeft = "";
          wrapper.style.background = "";
          wrapper.style.borderRadius = "";
        }
      }
      if (container.children.length === 0) container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--muted);">📭 Нет важных сообщений</div>';
    };
  });
}

async function openChatAndScrollToMessage(chatId, messageId) {
  await openChat(chatId, false);
  setTimeout(() => {
    const msgElement = document.querySelector(`.message-wrapper[data-msg-id="${messageId}"]`);
    if (msgElement) {
      msgElement.scrollIntoView({ behavior: "smooth", block: "center" });
      msgElement.style.transition = "0.3s";
      msgElement.style.boxShadow = "0 0 15px rgba(255,215,0,0.5)";
      setTimeout(() => { if (msgElement) msgElement.style.boxShadow = ""; }, 1500);
    }
  }, 500);
}

function addImportantButtonToProfile() {
  const balanceBtn = document.getElementById("balanceBtn");
  if (!balanceBtn || document.getElementById("importantBtn")) return;
  const importantBtn = document.createElement("button");
  importantBtn.id = "importantBtn";
  importantBtn.className = "template-btn";
  importantBtn.style.width = "100%";
  importantBtn.style.borderRadius = "50px";
  importantBtn.style.marginTop = "10px";
  importantBtn.style.background = "rgba(251,191,36,0.15)";
  importantBtn.style.border = "1px solid #fbbf24";
  importantBtn.innerHTML = "⭐ Важные сообщения";
  importantBtn.onclick = showImportantMessages;
  balanceBtn.insertAdjacentElement('afterend', importantBtn);
}

// ========================================================================
// DELETE MESSAGES
// ========================================================================
async function deleteMessageForMe(chatId, messageId) {
  if (!chatId || !messageId) return;
  try {
    await db.collection("chats").doc(chatId).collection("messages").doc(messageId).update({
      deletedFor: firebase.firestore.FieldValue.arrayUnion(me.uid),
      text: "[Удалено]",
      isDeleted: true
    });
  } catch (e) { console.error(e); }
}

async function deleteMessageForEveryone(chatId, messageId) {
  if (!chatId || !messageId) return;
  try {
    await db.collection("chats").doc(chatId).collection("messages").doc(messageId).delete();
  } catch (e) { console.error(e); }
}

window.deleteForMe = async (messageId) => { await deleteMessageForMe(currentChatId, messageId); };
window.deleteForAll = async (messageId) => { if (confirm("⚠️ Удалить это сообщение у ВСЕХ участников? Отменить нельзя!")) { await deleteMessageForEveryone(currentChatId, messageId); } };

window.showDeleteModal = function(messageId, isMyMessage, isGroup, isOwner, messageData = {}) {
  const existing = document.querySelector('.delete-message-modal');
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.className = "delete-message-modal";
  let buttons = `<button class="delete-option for-me" onclick="this.closest('.delete-message-modal').remove(); window.deleteForMe('${messageId}')">🗑️ Удалить у себя</button><button class="delete-option important" onclick="this.closest('.delete-message-modal').remove(); window.toggleImportantMessage('${messageId}', ${JSON.stringify(messageData).replace(/"/g, '&quot;')})">⭐ В важное</button>`;
  if (isMyMessage) {
    buttons += `<button class="delete-option for-all" onclick="this.closest('.delete-message-modal').remove(); window.deleteForAll('${messageId}')">⚠️ Удалить у всех</button>`;
  } else if (isGroup && isOwner) {
    buttons += `<button class="delete-option for-all" onclick="this.closest('.delete-message-modal').remove(); window.deleteForAll('${messageId}')">👑 Удалить у всех (владелец)</button>`;
  }
  modal.innerHTML = buttons;
  document.body.appendChild(modal);
  setTimeout(() => { if (modal && modal.parentNode) modal.remove(); }, 8000);
};

// ========================================================================
// MUTE
// ========================================================================
function showMuteModal(userId) { if (me?.role !== "creator") return;
  muteTargetId = userId;
  $("muteModal").classList.remove("hidden"); }

function hideMuteModal() { $("muteModal").classList.add("hidden");
  muteTargetId = null; }

async function confirmMute() {
  if (!muteTargetId || me?.role !== "creator") { hideMuteModal(); return; }
  const minutes = parseInt($("muteMinutes").value);
  if (isNaN(minutes) || minutes < 1) { alert("Введите корректное количество минут"); return; }
  try {
    const userRef = db.collection("users").doc(muteTargetId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    if (userData.mutedUntil && userData.mutedUntil > now()) {
      await userRef.update({ mutedUntil: 0, mutedBy: null });
      if (muteTimers.has(muteTargetId)) { clearTimeout(muteTimers.get(muteTargetId));
        muteTimers.delete(muteTargetId); }
      alert(`🔊 Мут снят с пользователя`);
    } else {
      const mutedUntil = now() + minutes * 60 * 1000;
      await userRef.update({ mutedUntil: mutedUntil, mutedBy: me.uid });
      const timer = setTimeout(async () => { try { await userRef.update({ mutedUntil: 0, mutedBy: null });
          muteTimers.delete(muteTargetId); } catch (e) {} }, minutes * 60 * 1000);
      muteTimers.set(muteTargetId, timer);
      alert(`🔇 Пользователь заглушен на ${minutes} минут`);
    }
  } catch (e) { console.error(e);
    alert("Ошибка при выполнении операции"); }
  hideMuteModal();
}

async function checkMuteStatus(userId) {
  if (!userId) return false;
  try {
    const userSnap = await db.collection("users").doc(userId).get();
    if (!userSnap.exists) return false;
    const userData = userSnap.data();
    if (userData.mutedUntil && userData.mutedUntil > now()) return true;
    if (userData.mutedUntil && userData.mutedUntil <= now()) { await db.collection("users").doc(userId).update({ mutedUntil: 0, mutedBy: null }); }
    return false;
  } catch (e) { return false; }
}

// ========================================================================
// BALANCE / SHOP
// ========================================================================
async function loadShopItems() {
  const snap = await db.collection("items").get();
  itemsCache.clear();
  snap.forEach(doc => itemsCache.set(doc.id, { id: doc.id, ...doc.data() }));
  const shopGrid = $("shopItems");
  shopGrid.innerHTML = "";
  itemsCache.forEach(item => {
    if (item.isActive === false) return;
    const isExpired = item.limited && item.expiresAt && item.expiresAt < now();
    const canBuy = !isExpired;
    const itemDiv = document.createElement("div");
    itemDiv.className = "shop-item";
    let iconHtml = item.iconType === 'image' ? `<img src="${item.icon}" class="shop-item-badge" style="width:36px; height:36px;">` : `<div class="shop-item-badge">${item.icon}</div>`;
    let actions = "";
    if (me?.role === "creator") { actions = `<div class="shop-item-actions"><button class="creator-action-btn" style="padding:4px 8px;" onclick="editItem('${item.id}')">✏️</button><button class="creator-action-btn" style="padding:4px 8px;" onclick="deleteItem('${item.id}')">🗑️</button></div>`; }
    const priceDisplay = canBuy ? `<div class="shop-item-price">${item.price} 🤣</div>` : `<div class="shop-item-price" style="color:var(--red);">${item.price} 🤣</div>`;
    const buyButton = canBuy ? `<button class="template-btn" onclick="buyItem('${item.id}')" style="padding:8px; width:100%;">Купить</button>` : `<div class="shop-item-expired">⏰ Срок окончен</div>`;
    const nameHtml = item.name ? `<div style="margin-bottom:8px; font-size:14px;">${escapeHtml(item.name)}</div>` : "";
    itemDiv.innerHTML = `${iconHtml}${nameHtml}${priceDisplay}${item.limited && item.expiresAt ? `<div style="font-size:11px;">до ${new Date(item.expiresAt).toLocaleDateString()}</div>` : ''}${buyButton}${actions}`;
    shopGrid.appendChild(itemDiv);
  });
}

async function buyItem(itemId) {
  if (!me) return;
  const item = itemsCache.get(itemId);
  if (!item) return;
  if (item.limited && item.expiresAt && item.expiresAt < now()) { alert("Срок покупки этого статуса истёк"); return; }
  if (me.balance < item.price) { alert(`❌ Недостаточно LOL коинов! Нужно ${item.price}, у вас ${me.balance}`); return; }
  if (itemId === 'star' && me.star) { alert("❌ У вас уже есть звезда!"); return; }
  if (me.customItems && me.customItems.includes(itemId)) { alert("❌ У вас уже есть этот статус!"); return; }
  if (!confirm(`Купить ${item.name || 'статус'} за ${item.price} 🤣?`)) return;
  try {
    await db.runTransaction(async (transaction) => {
      transaction.update(db.collection("users").doc(me.uid), { balance: firebase.firestore.FieldValue.increment(-item.price) });
      if (itemId === 'star') { transaction.update(db.collection("users").doc(me.uid), { star: true }); } else { transaction.update(db.collection("users").doc(me.uid), { customItems: firebase.firestore.FieldValue.arrayUnion(itemId) }); }
    });
    me.balance -= item.price;
    if (itemId === 'star') { me.star = true; } else { if (!me.customItems) me.customItems = [];
      me.customItems.push(itemId); }
    await updateSellSection();
    await updateStatusSelect();
    renderProfile();
    alert("✅ Покупка успешна!");
    updateBalanceScreen();
  } catch (e) { console.error(e);
    alert("Ошибка при покупке"); }
}

$("balanceBtn").addEventListener("click", () => { showScreen("scr-balance");
  updateBalanceScreen(); });
$("balanceBackBtn").addEventListener("click", () => { showScreen("scr-profile"); });

async function updateBalanceScreen() {
  if (!me) return;
  $("balanceAmount").textContent = me.balance || 0;
  if (me.role === "creator") {
    $("addBalanceBtn").style.display = "inline-block";
    $("addItemBtn").style.display = "inline-block";
    $("creatorPromoSection").style.display = "block";
    $("addBalanceBtn").onclick = showAddBalanceModal;
  } else {
    $("addBalanceBtn").style.display = "none";
    $("addItemBtn").style.display = "none";
    $("creatorPromoSection").style.display = "none";
  }
}

async function updateStatusSelect() {
  const itemsSnap = await db.collection("items").get();
  itemsCache.clear();
  itemsSnap.forEach(doc => itemsCache.set(doc.id, { id: doc.id, ...doc.data() }));
  const statusSelect = $("statusSelect");
  while (statusSelect.options.length > 1) { statusSelect.remove(1); }
  if (me.star) { const option = document.createElement("option");
    option.value = "star";
    option.textContent = "⭐️ Звезда";
    if (me.selectedStatus === "star") option.selected = true;
    statusSelect.appendChild(option); }
  if (me.customItems && me.customItems.length > 0) {
    for (const itemId of me.customItems) {
      const item = itemsCache.get(itemId);
      if (item) {
        const option = document.createElement("option");
        option.value = itemId;
        if (item.iconType === 'image') {
          option.style.backgroundImage = `url('${item.icon}')`;
          option.style.backgroundSize = '25px 25px';
          option.style.backgroundRepeat = 'no-repeat';
          option.style.backgroundPosition = '5px center';
          option.style.paddingLeft = '35px';
          option.textContent = item.name || 'Статус';
        } else { option.textContent = `${item.icon} ${item.name || 'Статус'}`; }
        if (me.selectedStatus === itemId) option.selected = true;
        statusSelect.appendChild(option);
      }
    }
  }
}

async function changeStatus() {
  const newStatus = $("statusSelect").value;
  await db.collection("users").doc(me.uid).update({ selectedStatus: newStatus });
  me.selectedStatus = newStatus;
  renderProfile();
}

async function updateSellSection() {
  if (!me) return;
  const sellItemsDiv = $("sellItems");
  sellItemsDiv.innerHTML = "";
  selectedSellItems.clear();
  if (me.star) { addSellItem('star', '⭐️ Звезда', 500, 'emoji', '⭐️'); }
  if (me.customItems && me.customItems.length > 0) {
    for (const itemId of me.customItems) {
      const item = itemsCache.get(itemId);
      if (item) { addSellItem(itemId, item.name || 'Статус', item.price, item.iconType, item.icon); }
    }
  }
  updateSellTotal();
}

function addSellItem(itemId, displayName, price, iconType, iconValue) {
  const sellPrice = Math.floor(price * 0.8);
  const itemDiv = document.createElement("div");
  itemDiv.className = "sell-item";
  let iconHtml = iconType === 'image' ? `<img src="${iconValue}" class="sell-item-icon" style="width:25px; height:25px; border-radius:6px; object-fit:cover;">` : (iconType === 'emoji' ? `<span class="sell-item-emoji" style="font-size:20px; width:25px; text-align:center;">${iconValue}</span>` : `<span class="sell-item-emoji" style="font-size:20px;">⭐️</span>`);
  itemDiv.innerHTML = `<input type="checkbox" id="sell_${itemId}" value="${itemId}" data-price="${sellPrice}" onchange="updateSellSelection(this)"><label for="sell_${itemId}">${iconHtml}<span>${escapeHtml(displayName)} — ${sellPrice} 🤣 (-20%)</span></label>`;
  $("sellItems").appendChild(itemDiv);
}

function updateSellSelection(checkbox) {
  const price = parseInt(checkbox.dataset.price);
  if (checkbox.checked) { selectedSellItems.add({ id: checkbox.value, price: price }); } else { selectedSellItems.forEach(item => { if (item.id === checkbox.value) selectedSellItems.delete(item); }); }
  updateSellTotal();
}

function updateSellTotal() {
  const total = Array.from(selectedSellItems).reduce((sum, item) => sum + item.price, 0);
  const count = selectedSellItems.size;
  $("sellTotal").innerHTML = `Выбрано: ${count} статус${count !== 1 ? 'ов' : ''} на сумму ${total} 🤣`;
  $("sellBtn").disabled = count === 0;
}

async function sellSelected() {
  if (selectedSellItems.size === 0) return;
  const total = Array.from(selectedSellItems).reduce((sum, item) => sum + item.price, 0);
  if (!confirm(`Продать выбранные статусы за ${total} 🤣?`)) return;
  try {
    await db.runTransaction(async (transaction) => {
      transaction.update(db.collection("users").doc(me.uid), { balance: firebase.firestore.FieldValue.increment(total) });
      for (const item of selectedSellItems) {
        if (item.id === 'star') { transaction.update(db.collection("users").doc(me.uid), { star: false }); } else { transaction.update(db.collection("users").doc(me.uid), { customItems: firebase.firestore.FieldValue.arrayRemove(item.id) }); }
      }
    });
    const freshUser = await db.collection("users").doc(me.uid).get();
    me = { uid: me.uid, ...freshUser.data() };
    if (!me.customItems) me.customItems = [];
    if (!me.selectedStatus) me.selectedStatus = "";
    usersCache.set(me.uid, me);
    selectedSellItems.clear();
    alert(`✅ Продано! Получено ${total} 🤣`);
    await updateSellSection();
    await updateBalanceScreen();
    await updateStatusSelect();
    renderProfile();
  } catch (e) { console.error(e);
    alert("Ошибка при продаже"); }
}

// ========================================================================
// PROMOCODES
// ========================================================================
function togglePromoType() {
  const type = document.querySelector('input[name="promoType"]:checked').value;
  if (type === 'date') { $("promoDateField").style.display = "block";
    $("promoCountField").style.display = "none"; } else { $("promoDateField").style.display = "none";
    $("promoCountField").style.display = "block"; }
}

async function activatePromo() {
  const code = $("promoCode").value.trim();
  if (!code) return;
  const promoRef = db.collection("promocodes").doc(code);
  const promoDoc = await promoRef.get();
  if (!promoDoc.exists) { alert("Промокод не найден"); return; }
  const promo = promoDoc.data();
  if (promo.type === 'date') { if (promo.expiresAt < now()) { alert("Срок действия промокода истёк"); return; } } else { if (promo.activationsLeft <= 0) { alert("Промокод больше не активен"); return; } }
  const userPromoRef = db.collection("userPromocodes").doc(`${me.uid}_${code}`);
  const userPromoDoc = await userPromoRef.get();
  if (userPromoDoc.exists) { alert("❌ Вы уже активировали этот промокод"); return; }
  try {
    await db.runTransaction(async (transaction) => {
      if (promo.type !== 'date') { transaction.update(promoRef, { activationsLeft: promo.activationsLeft - 1 }); }
      transaction.set(userPromoRef, { userId: me.uid, promoCode: code, activatedAt: now() });
      transaction.update(db.collection("users").doc(me.uid), { balance: firebase.firestore.FieldValue.increment(promo.amount) });
    });
    me.balance += promo.amount;
    alert(`✅ Промокод активирован! +${promo.amount} LOL`);
    updateBalanceScreen();
    $("promoCode").value = "";
  } catch (e) { console.error(e);
    alert("Ошибка при активации"); }
}

function showCreatePromoModal() { if (me?.role !== "creator") return;
  $("createPromoModal").classList.remove("hidden");
  $("promoCodeInput").value = "";
  $("promoAmount").value = "";
  $("promoDate").value = "";
  $("promoActivations").value = "";
  document.querySelector('input[name="promoType"][value="date"]').checked = true;
  togglePromoType(); }

function hideCreatePromoModal() { $("createPromoModal").classList.add("hidden"); }

async function createPromo() {
  const code = $("promoCodeInput").value.trim();
  const amount = parseInt($("promoAmount").value);
  const type = document.querySelector('input[name="promoType"]:checked').value;
  let promoData = { code, amount, type, createdBy: me.uid, createdAt: now() };
  if (type === 'date') { const date = $("promoDate").value;
    if (!date) { alert("Выберите дату окончания"); return; }
    promoData.expiresAt = new Date(date).getTime();
    promoData.activationsLeft = 999999; } else { const activations = parseInt($("promoActivations").value);
    if (!activations || activations < 1) { alert("Введите количество активаций"); return; }
    promoData.activationsTotal = activations;
    promoData.activationsLeft = activations; }
  if (!code || !amount) { alert("Заполните все поля"); return; }
  try { await db.collection("promocodes").doc(code).set(promoData);
    alert("✅ Промокод создан!");
    hideCreatePromoModal();
    updatePromoStats(); } catch (e) { console.error(e);
    alert("Ошибка при создании"); }
}

async function updatePromoStats() {
  if (!me || me.role !== "creator") return;
  const promosSnapshot = await db.collection("promocodes").get();
  const statsList = $("promoStatsList");
  statsList.innerHTML = "";
  promosSnapshot.forEach(doc => {
    const promo = doc.data();
    const row = document.createElement("div");
    row.className = "promo-stat-row";
    let statusText = promo.type === 'date' ? `до ${new Date(promo.expiresAt).toLocaleDateString()}` : `${promo.activationsLeft}/${promo.activationsTotal}`;
    row.innerHTML = `<span>${promo.code}</span><span>${promo.amount} 🤣</span><span>${promo.type === 'date' ? '📅' : '🔢'}</span><span>${statusText}</span>`;
    statsList.appendChild(row);
  });
}

function showAddBalanceModal() { if (me?.role !== "creator") return;
  $("addBalanceModal").classList.remove("hidden");
  $("addBalanceAmount").value = ""; }

function hideAddBalanceModal() { $("addBalanceModal").classList.add("hidden"); }

async function addBalance() {
  const amount = parseInt($("addBalanceAmount").value);
  if (!amount || amount < 1) return;
  try { await db.collection("users").doc(me.uid).update({ balance: firebase.firestore.FieldValue.increment(amount) });
    me.balance += amount;
    alert(`✅ Баланс пополнен на ${amount} LOL`);
    hideAddBalanceModal();
    updateBalanceScreen(); } catch (e) { console.error(e);
    alert("Ошибка при пополнении"); }
}

// ========================================================================
// GIFT
// ========================================================================
async function loadGiftItems() {
  const giftType = $("giftType");
  while (giftType.options.length > 1) { giftType.remove(1); }
  const itemsSnap = await db.collection("items").where("isActive", "==", true).get();
  itemsSnap.forEach(doc => {
    const item = doc.data();
    const isExpired = item.limited && item.expiresAt && item.expiresAt < now();
    if (!isExpired) {
      const option = document.createElement("option");
      option.value = doc.id;
      const icon = item.iconType === 'image' ? '🖼️' : item.icon;
      const name = item.name || 'Статус';
      option.textContent = `${icon} ${name} (${item.price} 🤣)`;
      giftType.appendChild(option);
    }
  });
}

function showGiftModal() { if (!peer) return;
  loadGiftItems();
  $("giftModal").classList.remove("hidden");
  $("giftCoinsInput").style.display = 'block'; }

function hideGiftModal() { $("giftModal").classList.add("hidden"); }

async function confirmGift() {
  const type = $("giftType").value;
  const coins = type === 'coins' ? parseInt($("giftCoins").value) : 0;
  if (type === 'coins' && (!coins || coins < 1)) { alert("Введите количество коинов"); return; }
  let cost = 0;
  let itemId = null;
  if (type === 'coins') { cost = coins; } else { itemId = type;
    const item = itemsCache.get(itemId);
    if (!item) { alert("Статус не найден"); return; }
    cost = item.price; }
  if (me.balance < cost) { alert("❌ Недостаточно LOL коинов! У вас только " + me.balance); return; }
  const peerSnap = await db.collection("users").doc(peer.uid).get();
  const freshPeer = peerSnap.data();
  if (itemId) { if (itemId === 'star' && freshPeer.star) { alert(`❌ У пользователя ${peer.nick} уже есть звезда!`); return; }
    if (freshPeer.customItems && freshPeer.customItems.includes(itemId)) { alert(`❌ У пользователя ${peer.nick} уже есть этот статус!`); return; } }
  if (!confirm(`Подарить ${type === 'coins' ? coins + ' LOL' : 'статус'} за ${cost} 🤣?`)) return;
  try {
    await db.runTransaction(async (transaction) => {
      transaction.update(db.collection("users").doc(me.uid), { balance: firebase.firestore.FieldValue.increment(-cost) });
      if (type === 'coins') { transaction.update(db.collection("users").doc(peer.uid), { balance: firebase.firestore.FieldValue.increment(coins) }); } else { transaction.update(db.collection("users").doc(peer.uid), { customItems: firebase.firestore.FieldValue.arrayUnion(itemId) }); }
      const giftRef = db.collection("gifts").doc();
      transaction.set(giftRef, { from: me.uid, to: peer.uid, type: type === 'coins' ? 'coins' : 'item', itemId: itemId, amount: cost, time: now() });
    });
    me.balance -= cost;
    alert(`✅ Подарок отправлен!`);
    hideGiftModal();
  } catch (e) { console.error(e);
    alert("Ошибка при отправке подарка"); }
}

function showCreatorGiftModal() { if (!peer || me?.role !== "creator") return;
  $("creatorGiftModal").classList.remove("hidden");
  $("creatorGiftCoins").value = ""; }

function hideCreatorGiftModal() { $("creatorGiftModal").classList.add("hidden"); }

async function confirmCreatorGift() {
  const coins = parseInt($("creatorGiftCoins").value);
  if (!coins || coins < 1) return;
  if (me.balance < coins) { alert("❌ Недостаточно LOL коинов! У вас только " + me.balance); return; }
  if (!confirm(`Отправить ${coins} LOL пользователю ${peer.nick}?`)) return;
  try {
    await db.runTransaction(async (transaction) => {
      transaction.update(db.collection("users").doc(me.uid), { balance: firebase.firestore.FieldValue.increment(-coins) });
      transaction.update(db.collection("users").doc(peer.uid), { balance: firebase.firestore.FieldValue.increment(coins) });
      const giftRef = db.collection("gifts").doc();
      transaction.set(giftRef, { from: me.uid, to: peer.uid, type: 'coins', amount: coins, time: now(), creatorGift: true });
    });
    me.balance -= coins;
    alert(`✅ Отправлено ${coins} LOL`);
    hideCreatorGiftModal();
  } catch (e) { console.error(e);
    alert("Ошибка при отправке"); }
}

// ========================================================================
// ITEMS (Admin)
// ========================================================================
function showAddItemModal() { if (me?.role !== "creator") return;
  $("addItemModal").classList.remove("hidden");
  $("itemEmoji").value = "";
  $("itemName").value = "";
  $("itemPrice").value = "";
  $("itemImage").value = "";
  $("itemExpiryDate").value = "";
  $("itemLimited").checked = false;
  toggleItemLimited();
  toggleItemIconInput(); }

function hideAddItemModal() { $("addItemModal").classList.add("hidden"); }

function toggleItemIconInput() {
  const type = $("itemIconType").value;
  if (type === 'emoji') { $("itemEmojiField").style.display = "block";
    $("itemImageField").style.display = "none"; } else { $("itemEmojiField").style.display = "none";
    $("itemImageField").style.display = "block"; }
}

function toggleItemLimited() { if ($("itemLimited").checked) { $("itemDateField").style.display = "block"; } else { $("itemDateField").style.display = "none"; } }

async function createItem() {
  const type = $("itemIconType").value;
  const name = $("itemName").value.trim() || "";
  const price = parseInt($("itemPrice").value);
  const limited = $("itemLimited").checked;
  let icon = "";
  let iconType = type;
  if (type === 'emoji') { icon = $("itemEmoji").value.trim();
    if (!icon) { alert("Введите эмодзи"); return; } } else { const file = $("itemImage").files[0];
    if (!file) { alert("Выберите изображение"); return; }
    icon = await uploadAvatar(file); }
  if (!price || price < 1) { alert("Введите цену"); return; }
  let expiresAt = null;
  if (limited) { const date = $("itemExpiryDate").value;
    if (!date) { alert("Выберите дату окончания"); return; }
    expiresAt = new Date(date).getTime(); }
  try { const itemRef = db.collection("items").doc();
    await itemRef.set({ iconType, icon, name, price, limited, expiresAt, createdAt: now(), createdBy: me.uid, isActive: true });
    alert("✅ Статус создан!");
    hideAddItemModal();
    loadShopItems(); } catch (e) { console.error(e);
    alert("Ошибка при создании"); }
}

async function editItem(itemId) { if (me?.role !== "creator") return;
  const item = itemsCache.get(itemId);
  if (!item) return;
  $("editItemId").value = itemId;
  $("editName").value = item.name || "";
  $("editPrice").value = item.price;
  $("editLimited").checked = item.limited || false;
  if (item.iconType === 'emoji') { $("editIconType").value = 'emoji';
    $("editEmoji").value = item.icon; } else { $("editIconType").value = 'image'; }
  toggleEditIconInput();
  toggleEditLimited();
  if (item.limited && item.expiresAt) { const date = new Date(item.expiresAt).toISOString().split('T')[0];
    $("editExpiryDate").value = date; }
  $("editItemModal").classList.remove("hidden"); }

function hideEditItemModal() { $("editItemModal").classList.add("hidden"); }

function toggleEditIconInput() {
  const type = $("editIconType").value;
  if (type === 'emoji') { $("editEmojiField").style.display = "block";
    $("editImageField").style.display = "none"; } else { $("editEmojiField").style.display = "none";
    $("editImageField").style.display = "block"; }
}

function toggleEditLimited() { if ($("editLimited").checked) { $("editDateField").style.display = "block"; } else { $("editDateField").style.display = "none"; } }

async function saveItem() {
  const itemId = $("editItemId").value;
  const type = $("editIconType").value;
  const name = $("editName").value.trim() || "";
  const price = parseInt($("editPrice").value);
  const limited = $("editLimited").checked;
  let icon = null;
  if (type === 'emoji') { icon = $("editEmoji").value.trim();
    if (!icon) { alert("Введите эмодзи"); return; } } else { const file = $("editImage").files[0];
    if (file) { icon = await uploadAvatar(file); } }
  if (!price || price < 1) { alert("Введите цену"); return; }
  let expiresAt = null;
  if (limited) { const date = $("editExpiryDate").value;
    if (!date) { alert("Выберите дату окончания"); return; }
    expiresAt = new Date(date).getTime(); }
  const updateData = { name, price, limited, expiresAt };
  if (icon) { updateData.iconType = type;
    updateData.icon = icon; }
  try { await db.collection("items").doc(itemId).update(updateData);
    alert("✅ Статус обновлён!");
    hideEditItemModal();
    loadShopItems(); } catch (e) { console.error(e);
    alert("Ошибка при обновлении"); }
}

async function deleteItem(itemId) { if (me?.role !== "creator") return;
  if (!confirm("Удалить этот статус из магазина?")) return;
  try { await db.collection("items").doc(itemId).update({ isActive: false });
    alert("✅ Статус удалён из магазина");
    loadShopItems(); } catch (e) { console.error(e);
    alert("Ошибка при удалении"); } }

// ========================================================================
// GROUP FUNCTIONS
// ========================================================================
function resetGroupCreation() {
  selectedMembersForGroup.clear();
  $("groupStep1").style.display = "block";
  $("groupStep2").style.display = "none";
  $("groupName").value = "";
  $("groupDesc").value = "";
  $("groupAvatarPreview").src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%232b86ff'/%3E%3Ctext x='50' y='65' font-size='40' text-anchor='middle' fill='white'%3E👥%3C/text%3E%3C/svg%3E";
  if ($("groupMemberSearch")) $("groupMemberSearch").value = "";
  loadChatUsersForGroup();
}

$("createGroupBtn").addEventListener("click", () => { resetGroupCreation();
  showScreen("scr-group-create"); });
$("groupCreateBack").addEventListener("click", () => { showScreen("scr-chats"); });
$("startGroupCreateBtn").addEventListener("click", () => { if (selectedMembersForGroup.size === 0) { alert("Пожалуйста, выберите хотя бы одного участника для группы"); return; }
  $("groupStep1").style.display = "none";
  $("groupStep2").style.display = "block"; });
$("groupNextBtn").addEventListener("click", () => { if (selectedMembersForGroup.size === 0) { alert("Пожалуйста, выберите хотя бы одного участника для группы"); return; }
  $("groupStep1").style.display = "none";
  $("groupStep2").style.display = "block"; });
$("groupStep2Back").addEventListener("click", () => { $("groupStep2").style.display = "none";
  $("groupStep1").style.display = "block"; });

async function loadChatUsersForGroup() {
  const list = $("groupMembersList");
  const usersSnap = await db.collection("users").get();
  const allUsers = [];
  usersSnap.forEach(doc => { if (doc.id !== me.uid) { allUsers.push({ uid: doc.id, ...doc.data() }); } });
  list.innerHTML = `<div class="sectionTitle">Выберите участников (можно найти по никнейму)</div><input type="text" id="groupMemberSearch" class="template-input" placeholder="Поиск по никнейму..." style="margin-bottom:10px;"><div id="groupMembersContainer" style="max-height:400px; overflow-y:auto;"></div><div style="margin-top:10px; color:var(--muted);" id="selectedCountDisplay">Выбрано: 0 участников</div>`;
  const container = document.getElementById("groupMembersContainer");
  const searchInput = document.getElementById("groupMemberSearch");
  const countDisplay = document.getElementById("selectedCountDisplay");
  const updateSelectedCount = () => { const count = selectedMembersForGroup.size;
    countDisplay.textContent = `Выбрано: ${count} участник${count !== 1 ? 'ов' : ''}`;
    const nextBtn = $("groupNextBtn");
    if (nextBtn) { nextBtn.disabled = count === 0;
      nextBtn.style.opacity = count === 0 ? "0.5" : "1";
      nextBtn.style.cursor = count === 0 ? "not-allowed" : "pointer"; } };
  const renderUsers = (searchQuery = "") => {
    container.innerHTML = "";
    const query = searchQuery.toLowerCase();
    const filtered = allUsers.filter(u => !query || (u.nick && u.nick.toLowerCase().includes(query)) || (u.login && u.login.toLowerCase().includes(query)));
    if (filtered.length === 0) { container.innerHTML = '<div class="hint" style="padding:20px; text-align:center;">Пользователи не найдены</div>'; return; }
    for (const u of filtered.slice(0, 50)) {
      const div = document.createElement("div");
      div.className = "member-select-item";
      const checked = selectedMembersForGroup.has(u.uid);
      div.innerHTML = `<input type="checkbox" ${checked ? "checked" : ""} data-uid="${u.uid}"><img class="avatar small" src="${u.avatar || defaultAvatar}"><span>${escapeHtml(u.nick || u.login || "Кто-то")}</span>`;
      div.onclick = (e) => { e.stopPropagation();
        const cb = div.querySelector('input');
        cb.checked = !cb.checked;
        if (cb.checked) selectedMembersForGroup.add(u.uid);
        else selectedMembersForGroup.delete(u.uid);
        updateSelectedCount(); };
      container.appendChild(div);
    }
  };
  searchInput.addEventListener("input", (e) => renderUsers(e.target.value));
  renderUsers();
  updateSelectedCount();
  const nextBtn = $("groupNextBtn");
  nextBtn.style.display = "block";
  nextBtn.disabled = true;
  nextBtn.style.opacity = "0.5";
}

$("groupFinishBtn").addEventListener("click", async () => {
  const name = $("groupName").value.trim();
  if (!name) return alert("Введите название группы");
  const avatar = $("groupAvatarPreview").src;
  const desc = $("groupDesc").value.trim();
  const members = Array.from(selectedMembersForGroup);
  members.push(me.uid);
  const groupId = randId("g");
  await db.collection("groups").doc(groupId).set({ name, avatar, description: desc, ownerId: me.uid, createdAt: now(), participants: members, lastMessage: "", lastTime: 0, isGroup: true, verified: false });
  await db.collection("group_permissions").doc(groupId).set({ canEdit: true, canSend: true });
  for (const m of members) { await db.collection("group_participants").doc(`${groupId}_${m}`).set({ groupId, userId: m, joinedAt: now() }); }
  await db.collection("chats").doc(groupId).set({ participants: members, lastText: "Группа создана", lastTime: now(), isGroup: true, groupName: name, groupAvatar: avatar, ownerId: me.uid, groupVerified: false });
  showScreen("scr-chats");
  selectedMembersForGroup.clear();
  resetGroupCreation();
  await updateUserOwnedGroupsCount(me.uid);
});

$("groupAvatarFile").addEventListener("change", async e => { if (e.target.files[0]) $("groupAvatarPreview").src = await uploadAvatar(e.target.files[0]); });

// ========================================================================
// ДОБАВЛЕНИЕ УЧАСТНИКОВ В ГРУППУ
// ========================================================================
function showAddMemberModal() { 
  selectedAddMembers.clear(); 
  document.getElementById('addMemberModal').classList.remove('hidden'); 
  loadAddMemberList(); 
}

function hideAddMemberModal() { 
  document.getElementById('addMemberModal').classList.add('hidden'); 
  selectedAddMembers.clear(); 
}

async function loadAddMemberList() {
  const container = document.getElementById("addMemberList");
  const searchInput = document.getElementById("addMemberSearch");
  
  if (!container) {
    console.error('Container addMemberList not found');
    return;
  }
  
  const usersSnap = await db.collection("users").get();
  const allUsers = [];
  usersSnap.forEach(doc => { 
    if (doc.id !== me.uid && !currentGroup.participants.includes(doc.id)) { 
      allUsers.push({ uid: doc.id, ...doc.data() }); 
    } 
  });
  
  const renderUsers = (searchQuery = "") => {
    container.innerHTML = "";
    const query = searchQuery.toLowerCase().trim();
    const filtered = allUsers.filter(u => !query || 
      (u.nick && u.nick.toLowerCase().includes(query)) || 
      (u.login && u.login.toLowerCase().includes(query))
    );
    
    if (filtered.length === 0) { 
      container.innerHTML = '<div class="hint" style="padding:20px; text-align:center;">Нет доступных пользователей</div>'; 
      return; 
    }
    
    for (const u of filtered) {
      const div = document.createElement("div");
      div.className = "member-select-item";
      const checked = selectedAddMembers.has(u.uid);
      div.innerHTML = `
        <input type="checkbox" ${checked ? "checked" : ""} data-uid="${u.uid}">
        <img class="avatar small" src="${u.avatar || defaultAvatar}">
        <span>${escapeHtml(u.nick || u.login || "Кто-то")}</span>
        ${getVerifiedBadge(u)}
      `;
      div.onclick = (e) => { 
        e.stopPropagation();
        const cb = div.querySelector('input');
        cb.checked = !cb.checked;
        if (cb.checked) {
          selectedAddMembers.add(u.uid);
        } else {
          selectedAddMembers.delete(u.uid);
        }
        if (cb.checked) {
          div.style.background = 'rgba(43,134,255,0.1)';
        } else {
          div.style.background = '';
        }
      };
      if (checked) {
        div.style.background = 'rgba(43,134,255,0.1)';
      }
      container.appendChild(div);
    }
  };
  
  if (searchInput) {
    searchInput.removeEventListener('input', renderUsers);
    searchInput.addEventListener('input', (e) => renderUsers(e.target.value));
  }
  renderUsers();
}

async function confirmAddMembers() {
  if (selectedAddMembers.size === 0) { 
    alert("Выберите хотя бы одного участника"); 
    return; 
  }
  
  const newMembers = Array.from(selectedAddMembers);
  
  try {
    await db.runTransaction(async (transaction) => {
      transaction.update(db.collection("groups").doc(currentChatId), { 
        participants: firebase.firestore.FieldValue.arrayUnion(...newMembers) 
      });
      transaction.update(db.collection("chats").doc(currentChatId), { 
        participants: firebase.firestore.FieldValue.arrayUnion(...newMembers) 
      });
      for (const uid of newMembers) { 
        transaction.set(db.collection("group_participants").doc(`${currentChatId}_${uid}`), { 
          groupId: currentChatId, 
          userId: uid, 
          joinedAt: now() 
        }); 
      }
    });
    
    if (currentGroup) {
      currentGroup.participants = [...currentGroup.participants, ...newMembers];
    }
    
    alert(`✅ Добавлено ${newMembers.length} участников`);
    hideAddMemberModal();
    renderGroupInfo();
    bindChatListRealtime();
    
  } catch (error) {
    console.error('Ошибка добавления участников:', error);
    alert('❌ Ошибка при добавлении участников: ' + error.message);
  }
}

// ========================================================================
// RENDER GROUP INFO
// ========================================================================
function renderGroupInfo() {
  const container = $("groupInfoContent");
  const isOwner = currentGroup.ownerId === me.uid;
  const canEdit = isOwner || groupPermissions.canEdit;
  const isCreator = me.role === 'creator';
  let displayName = currentGroup.name || "Без названия";
  const groupBadge = getGroupVerifiedBadge(currentGroup);
  if (groupBadge) {
    displayName = groupBadge + ' ' + displayName;
  }
  container.innerHTML = `
    <div class="group-info-avatar" id="groupAvatarClick"><img src="${currentGroup.avatar || defaultAvatar}"></div>
    <div class="group-info-card" id="groupNameClick" style="text-align:center; cursor:${canEdit ? 'pointer' : 'default'}"><h3>${displayName}</h3></div>
    <div class="group-info-card" id="groupDescClick" style="cursor:${canEdit ? 'pointer' : 'default'}"><p>${escapeHtml(currentGroup.description || "Нет описания")}</p></div>
    <div class="group-info-card"><h4>Участники <button class="add-member-btn" id="addMemberBtn" ${isOwner ? '' : 'style="display:none;"'}>+</button></h4><div id="groupMembersInfo"></div></div>
    <div style="display:flex; gap:10px; margin-top:20px; flex-wrap:wrap;">
      ${isCreator ? `<button class="template-btn" id="verifyGroupBtn" style="flex:1; background:${currentGroup.verified ? 'rgba(239,68,68,0.2)' : 'rgba(43,134,255,0.2)'}; border:1px solid ${currentGroup.verified ? '#ef4444' : '#2b86ff'}; color:${currentGroup.verified ? '#ef4444' : '#2b86ff'};">${currentGroup.verified ? '❌ Убрать верификацию' : '✅ Верифицировать группу'}</button>` : ''}
      <button class="template-btn" id="groupLeaveBtn" style="flex:1; background:rgba(239,68,68,.2);">🚪 Выйти из группы</button>
      ${isOwner ? '<button class="template-btn" id="groupDeleteBtn" style="flex:1; background:rgba(239,68,68,.2);">🗑️ Удалить группу</button>' : ''}
    </div>
    ${isOwner ? `<div class="group-info-card" style="margin-top:20px;"><h4>Разрешения</h4>
      <div class="permission-switch"><span>Редактирование группы</span><label class="switch"><input type="checkbox" id="permEdit" ${groupPermissions.canEdit ? 'checked' : ''}><span class="slider"></span></label></div>
      <div class="permission-switch"><span>Отправка сообщений</span><label class="switch"><input type="checkbox" id="permSend" ${groupPermissions.canSend ? 'checked' : ''}><span class="slider"></span></label></div>
    </div>` : ''}
  `;
  renderGroupMembersInfo();
  
  if (canEdit) {
    document.getElementById("groupAvatarClick").onclick = () => { 
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = "image/*";
      inp.onchange = async e => { 
        if (e.target.files[0]) { 
          const a = await uploadAvatar(e.target.files[0]);
          await db.collection("groups").doc(currentChatId).update({ avatar: a });
          await db.collection("chats").doc(currentChatId).update({ groupAvatar: a });
          currentGroup.avatar = a;
          renderGroupInfo(); 
        } 
      };
      inp.click(); 
    };
    document.getElementById("groupNameClick").onclick = () => { 
      const n = prompt("Новое название:", currentGroup.name);
      if (n?.trim()) { 
        db.collection("groups").doc(currentChatId).update({ name: n.trim() });
        db.collection("chats").doc(currentChatId).update({ groupName: n.trim() });
        currentGroup.name = n.trim();
        renderGroupInfo(); 
      } 
    };
    document.getElementById("groupDescClick").onclick = () => { 
      const d = prompt("Новое описание:", currentGroup.description);
      if (d !== null) { 
        db.collection("groups").doc(currentChatId).update({ description: d });
        currentGroup.description = d;
        renderGroupInfo(); 
      } 
    };
  }
  
  if (isOwner) {
    document.getElementById("permEdit").onchange = async e => { 
      await db.collection("group_permissions").doc(currentChatId).set({ canEdit: e.target.checked, canSend: groupPermissions.canSend }, { merge: true });
      groupPermissions.canEdit = e.target.checked; 
    };
    document.getElementById("permSend").onchange = async e => { 
      await db.collection("group_permissions").doc(currentChatId).set({ canEdit: groupPermissions.canEdit, canSend: e.target.checked }, { merge: true });
      groupPermissions.canSend = e.target.checked;
      const isOwnerNow = currentGroup.ownerId === me.uid;
      $("sendBtn").disabled = !(isOwnerNow || e.target.checked);
      $("msgInput").disabled = !(isOwnerNow || e.target.checked); 
    };
    document.getElementById("addMemberBtn").onclick = showAddMemberModal;
  }
  
  $("groupLeaveBtn").onclick = async () => { 
    if (confirm("Выйти из группы?")) { 
      await db.collection("groups").doc(currentChatId).update({ participants: firebase.firestore.FieldValue.arrayRemove(me.uid) });
      await db.collection("group_participants").doc(`${currentChatId}_${me.uid}`).delete();
      await db.collection("chats").doc(currentChatId).update({ participants: firebase.firestore.FieldValue.arrayRemove(me.uid) });
      showScreen("scr-chats"); 
    } 
  };
  
  if (isOwner) { 
    $("groupDeleteBtn").onclick = async () => { 
      if (confirm("Удалить группу навсегда? Это действие нельзя отменить!")) { 
        const parts = currentGroup.participants || [];
        for (const uid of parts) { 
          await db.collection("chats").doc(currentChatId).update({ participants: firebase.firestore.FieldValue.arrayRemove(uid) });
        }
        await db.collection("groups").doc(currentChatId).delete();
        await db.collection("group_permissions").doc(currentChatId).delete();
        await db.collection("chats").doc(currentChatId).delete();
        showScreen("scr-chats"); 
      } 
    }; 
  }
  
  if (isCreator) {
    document.getElementById("verifyGroupBtn").onclick = verifyGroup;
  }
  
  $("groupEditInfoBtn").style.display = canEdit ? "flex" : "none";
}

function renderGroupMembersInfo() {
  const container = document.getElementById("groupMembersInfo");
  if (!container) return;
  container.innerHTML = "";
  const participants = currentGroup.participants || [];
  const isOwner = currentGroup.ownerId === me.uid;
  for (const uid of participants) {
    const user = usersCache.get(uid);
    if (!user) continue;
    const div = document.createElement("div");
    div.className = "group-member-item";
    const verifiedBadge = getVerifiedBadge(user);
    div.innerHTML = `<div class="member-info"><img class="avatar small" src="${user.avatar || defaultAvatar}"><span>${verifiedBadge} ${escapeHtml(user.nick || "Кто-то")}${uid === currentGroup.ownerId ? ' <span class="owner-badge">Владелец</span>' : ''}</span></div>${isOwner && uid !== me.uid ? '<button class="delete-member-btn" data-uid="' + uid + '">Удалить</button>' : ''}`;
    if (isOwner && uid !== me.uid) { 
      div.querySelector(".delete-member-btn").onclick = async (e) => { 
        e.stopPropagation();
        if (confirm(`Удалить ${user.nick} из группы?`)) { 
          await db.collection("groups").doc(currentChatId).update({ participants: firebase.firestore.FieldValue.arrayRemove(uid) });
          await db.collection("group_participants").doc(`${currentChatId}_${uid}`).delete();
          await db.collection("chats").doc(currentChatId).update({ participants: firebase.firestore.FieldValue.arrayRemove(uid) });
          renderGroupInfo(); 
        } 
      }; 
    }
    container.appendChild(div);
  }
}

$("groupInfoBack").addEventListener("click", () => showScreen("scr-chat"));

// ========================================================================
// STICKER EDITOR
// ========================================================================
function openAdvancedStickerEditor(imageDataUrl) {
  const modal = document.createElement("div");
  modal.className = "sticker-editor-modal";
  modal.innerHTML = `
    <div class="editor-header">
      <h3>🎨 Редактор стикера</h3>
      <button class="close-sticker-btn" id="closeEditorBtn">✕</button>
    </div>
    <div class="editor-canvas-container">
      <canvas id="stickerCanvas" class="editor-canvas" width="512" height="512"></canvas>
    </div>
    <div class="editor-tools">
      <button class="tool-btn" data-tool="draw">✏️ Кисть</button>
      <button class="tool-btn" data-tool="erase">🧽 Ластик</button>
      <button class="tool-btn" data-tool="text">📝 Текст</button>
      <input type="color" id="toolColor" class="color-picker" value="#ffffff">
      <input type="number" id="toolSize" class="font-size-input" value="24" min="10" max="80" placeholder="Размер">
      <input type="text" id="toolText" class="editor-text-input" placeholder="Текст">
      <button class="tool-btn" id="addTextBtn">➕ Добавить</button>
      <div class="editor-actions">
        <button class="template-btn" id="cancelEditorBtn">Отмена</button>
        <button class="template-btn confirm" id="saveEditorBtn">✅ Готово</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const canvas = document.getElementById("stickerCanvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
  };
  img.src = imageDataUrl;

  let tool = 'draw', color = '#ffffff', size = 24, isDrawing = false, lastX = 0, lastY = 0;

  const toolBtns = modal.querySelectorAll(".tool-btn[data-tool]");
  const colorPicker = document.getElementById("toolColor");
  const sizeInput = document.getElementById("toolSize");

  toolBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      toolBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      tool = btn.dataset.tool;
    });
  });
  toolBtns[0].classList.add("active");

  colorPicker.addEventListener("change", (e) => { color = e.target.value; });
  sizeInput.addEventListener("change", (e) => { size = parseInt(e.target.value) || 24; });

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: Math.min(Math.max(0, (clientX - rect.left) * scaleX), canvas.width),
      y: Math.min(Math.max(0, (clientY - rect.top) * scaleY), canvas.height)
    };
  }

  function startDraw(e) {
    if (tool === 'text') return;
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x;
    lastY = pos.y;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
  }

  function draw(e) {
    if (!isDrawing || tool === 'text') return;
    const pos = getPos(e);
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (tool === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastX = pos.x;
    lastY = pos.y;
  }

  function endDraw() {
    isDrawing = false;
    ctx.globalCompositeOperation = 'source-over';
  }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);
  canvas.addEventListener('touchstart', startDraw);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', endDraw);

  document.getElementById("addTextBtn").addEventListener("click", () => {
    const text = document.getElementById("toolText").value.trim();
    if (!text) return;
    ctx.font = `${size}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    document.getElementById("toolText").value = "";
  });

  document.getElementById("saveEditorBtn").onclick = async () => {
    const url = canvas.toDataURL();
    await saveSticker({ url, text: "" });
    modal.remove();
    showToast("✅ Стикер создан!", "success");
    loadUserStickers();
  };

  document.getElementById("cancelEditorBtn").onclick = () => modal.remove();
  document.getElementById("closeEditorBtn").onclick = () => modal.remove();
}

// ========================================================================
// PUSH УВЕДОМЛЕНИЯ
// ========================================================================

// Проверка, установлено ли PWA
function isPWAInstalled() {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.navigator.standalone === true) return true;
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
  return false;
}

// Проверка поддержки push
function isPushSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

// Проверка статуса подписки
async function getPushSubscriptionStatus() {
  try {
    if (!isPushSupported() || !me) return false;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch (e) {
    return false;
  }
}

// Обновление UI тумблера
async function updatePushUI() {
  if (!me) return;

  const isPWA = isPWAInstalled();
  const isSubscribed = await getPushSubscriptionStatus();
  const isSupported = isPushSupported();

  const toggle = document.getElementById('pushToggle');
  const badge = document.getElementById('pushStatusBadge');
  const statusText = document.getElementById('pushStatusText');
  const pwaMessage = document.getElementById('pwaInstallMessage');

  if (!toggle) return;

  if (!isPWA && isSupported) {
    if (pwaMessage) pwaMessage.style.display = 'block';
    statusText.textContent = '📱 Установите PWA (Добавить на экран Домой), чтобы включить уведомления';
    badge.textContent = '❌ Недоступно';
    badge.style.background = 'rgba(239,68,68,0.2)';
    badge.style.color = '#ef4444';
    toggle.disabled = true;
    toggle.checked = false;
    return;
  }

  if (pwaMessage) pwaMessage.style.display = 'none';
  toggle.disabled = false;

  if (isSubscribed) {
    toggle.checked = true;
    badge.textContent = '✅ Вкл';
    badge.style.background = 'rgba(34,197,94,0.2)';
    badge.style.color = '#22c55e';
    statusText.textContent = '🔔 Уведомления включены. Пуши будут приходить в фоне.';
  } else {
    toggle.checked = false;
    badge.textContent = 'Выкл';
    badge.style.background = 'rgba(255,255,255,0.1)';
    badge.style.color = 'var(--muted2)';
    statusText.textContent = 'Включите, чтобы получать уведомления о сообщениях';
  }
}

// Подписка на пуши (ИСПРАВЛЕННАЯ ВЕРСИЯ)
async function subscribeToPush() {
  try {
    if (!isPushSupported()) {
      showToast('❌ Браузер не поддерживает уведомления', 'error');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      showToast('❌ Разрешение не получено', 'error');
      return false;
    }

    let registration;
try {
  const swPath = '/Lol-Test/firebase-messaging-sw.js';
  registration = await navigator.serviceWorker.register(swPath, {
    scope: '/Lol-Test/'
  });
  console.log('✅ SW зарегистрирован по пути:', swPath, 'с scope:', '/Lol-Test/');
} catch (swError) {
  console.error('Ошибка регистрации SW:', swError);
  showToast('❌ Ошибка регистрации Service Worker', 'error');
  return false;
}

    await navigator.serviceWorker.ready;

    const vapidKey = firebaseConfig.vapidKey;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey
    });

    console.log('✅ Подписка создана:', subscription);

    // Сохраняем ТОЛЬКО нужные поля из подписки
// Проверяем, есть ли ключи
const keys = subscription.keys || { p256dh: '', auth: '' };

const subscriptionData = {
  endpoint: subscription.endpoint || '',
  expirationTime: subscription.expirationTime || null,
  keys: {
    p256dh: keys.p256dh || '',
    auth: keys.auth || ''
  }
};

await db.collection('users').doc(me.uid).set({
  pushSubscription: subscriptionData,
  pushEnabled: true,
  pushUpdatedAt: now()
}, { merge: true });

    showToast('✅ Уведомления включены!', 'success');
    await updatePushUI();
    return true;

  } catch (error) {
    console.error('Ошибка подписки:', error);
    showToast('❌ Ошибка: ' + error.message, 'error');
    return false;
  }
}

// Отписка от пушей
async function unsubscribeFromPush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
    }

    await db.collection('users').doc(me.uid).set({
      pushSubscription: null,
      pushEnabled: false,
      pushUpdatedAt: now()
    }, { merge: true });

    showToast('🔇 Уведомления отключены', 'info');
    await updatePushUI();
    return true;
  } catch (error) {
    console.error('Ошибка отписки:', error);
    showToast('❌ Ошибка: ' + error.message, 'error');
    return false;
  }
}

// Проверка статуса подписки
async function checkPushStatus() {
  try {
    const isSubscribed = await getPushSubscriptionStatus();
    return isSubscribed;
  } catch (e) {
    return false;
  }
}

// Проверка Service Worker при загрузке
async function checkServiceWorker() {
  try {
    const swPath = '/Lol-Test/firebase-messaging-sw.js';
    const registration = await navigator.serviceWorker.getRegistration(swPath);
    
    if (registration) {
      console.log('✅ SW активен:', registration.active ? 'Активен' : 'Не активен');
      return true;
    } else {
      console.log('⚠️ SW не найден, пробуем зарегистрировать...');
      await navigator.serviceWorker.register(swPath);
      return true;
    }
  } catch (e) {
    console.error('❌ Ошибка проверки SW:', e);
    return false;
  }
}

// Обработчик тумблера
document.addEventListener('DOMContentLoaded', function() {
  const toggle = document.getElementById('pushToggle');
  if (toggle) {
    toggle.addEventListener('change', async function() {
      if (this.checked) {
        await subscribeToPush();
      } else {
        await unsubscribeFromPush();
      }
    });
  }
});

// Вызываем при загрузке
setTimeout(async () => {
  if (me) {
    await checkServiceWorker();
    await checkPushStatus();
    await updatePushUI();
  }
}, 3000);

// Слушаем изменения display-mode
window.matchMedia('(display-mode: standalone)').addEventListener('change', updatePushUI);

// ========================================================================
// INIT
// ========================================================================
(async () => {
  $("composer").style.display = "none";
  const s = loadSession();
  if (s && s.uid) {
    session = s;
    try {
      const userDoc = await db.collection("users").doc(s.uid).get();
      if (userDoc.exists) { await afterLogin(); } else { await logout();
        setAuthMode("login"); }
    } catch (e) { await logout();
      setAuthMode("login");
      setMsg($("authMsg"), "Ошибка восстановления сессии. Войдите заново.", "err"); }
  } else { setAuthMode("login"); }

  // Modal close handlers
  const modals = ['muteModal', 'giftModal', 'creatorGiftModal', 'createPromoModal', 'addItemModal', 'editItemModal', 'addBalanceModal', 'musicPickerModal', 'editTrackModal', 'contactEditorModal', 'addMemberModal'];
  modals.forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.target === el) el.classList.add('hidden');
      });
    }
  });

  document.getElementById('editTrackModal').addEventListener('click', function(e) {
    if (e.target === this) closeEditTrackModal();
  });
})();
