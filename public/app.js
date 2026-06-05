// 14 Trades Alert — PWA App JS v5 — All Premium Features
const SERVER = 'https://14trades-server-production.up.railway.app';
const VAPID_PUBLIC = 'YOUR_VAPID_PUBLIC_KEY';

// ── ACCESS CODE SYSTEM ────────────────────────────────────────────
// Change this code every month — only paying members get the new code
const ACCESS_CODE = 'GOLD14'; // ← CHANGE THIS MONTHLY

const ACCESS_MSGS = {
  en: { title: 'Enter your access code', contact: 'Contact us to subscribe', wrong: 'Invalid code — contact us to subscribe', success: 'Welcome ⚡' },
  fr: { title: 'Entrez votre code d\'accès', contact: 'Contactez-nous pour vous abonner', wrong: 'Code invalide — contactez-nous', success: 'Bienvenue ⚡' }
};

let accessLang = localStorage.getItem('14t_lang') || 'en';

function setLangAccess(lang) {
  accessLang = lang;
  localStorage.setItem('14t_lang', lang);
  const m = ACCESS_MSGS[lang] || ACCESS_MSGS.en;
  const title = document.getElementById('ac-lang-title');
  const contact = document.getElementById('ac-lang-contact');
  if (title) title.textContent = m.title;
  if (contact) contact.textContent = m.contact;
}

function checkCode() {
  const input = document.getElementById('ac-input');
  const error = document.getElementById('ac-error');
  const btn   = document.getElementById('ac-btn');
  const val   = input.value.trim().toUpperCase();
  const m     = ACCESS_MSGS[accessLang] || ACCESS_MSGS.en;

  if (!val) return;

  if (val === ACCESS_CODE) {
    input.classList.add('success');
    input.classList.remove('error');
    error.textContent = '';
    btn.disabled = true;
    // Save access — expires end of current month
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 1);
    expiry.setDate(1);
    expiry.setHours(0,0,0,0);
    localStorage.setItem('14t_access', ACCESS_CODE);
    localStorage.setItem('14t_access_exp', expiry.getTime());
    // Set join date if first time
    if (!localStorage.getItem('14t_join')) {
      localStorage.setItem('14t_join', new Date().toISOString());
    }
    showToastAccess(m.success);
    setTimeout(unlockApp, 800);
  } else {
    input.classList.add('error');
    input.classList.remove('success');
    error.textContent = m.wrong;
    setTimeout(() => input.classList.remove('error'), 600);
  }
}

function showToastAccess(msg) {
  const t = document.getElementById('toast');
  if (t) { t.textContent = msg; t.className = 'toast buy show'; setTimeout(() => t.classList.remove('show'), 2000); }
}

function unlockApp() {
  document.getElementById('access-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
  // Boot the app
  bootApp();
}

// ── Handle prep data from notification click URL ──────────────────
function checkPrepFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const prep   = params.get('prep');
    if (!prep) return;
    const p = JSON.parse(decodeURIComponent(prep));
    if (p.type === 'prep' && p.id !== lastPrepId) {
      lastPrepId = p.id;
      // Small delay to let app load first
      setTimeout(() => showSignalCountdown({
        id: p.id,
        asset: p.asset || 'GOLD',
        direction: p.direction,
        secondsUntilSignal: p.secondsUntilSignal || 60,
      }), 800);
    }
    // Clean URL
    window.history.replaceState({}, '', '/');
  } catch(e) {}
}

function checkAccess() {
  const saved  = localStorage.getItem('14t_access');
  const expRaw = localStorage.getItem('14t_access_exp');
  const expiry = expRaw ? new Date(isNaN(expRaw) ? expRaw : parseInt(expRaw)).getTime() : 0;
  const now    = Date.now();
  if (saved && expiry > now) {
    bootApp();
  } else {
    if (saved) {
      localStorage.removeItem('14t_access');
      localStorage.removeItem('14t_access_exp');
    }
    window.location.href = '/access.html';
  }
}


const WINDOWS = [
  { time:'19:10', asset:'GOLD' },
  { time:'00:10', asset:'GOLD' },
  { time:'07:10', asset:'GOLD' },
  { time:'12:10', asset:'GOLD' },
];

const ASSET_META = {
  GOLD:   { ico:'XAU', bg:'#C9A84C15', color:'#C9A84C', border:'#C9A84C20' },
  NASDAQ: { ico:'NQ',  bg:'#5B8DEF15', color:'#5B8DEF', border:'#5B8DEF20' },
  BTC:    { ico:'BTC', bg:'#F0921A15', color:'#F0921A', border:'#F0921A20' },
};

const MILESTONES = [
  { at:3,  label:'TRADER',       emoji:'⚡' },
  { at:5,  label:'PRO TRADER',   emoji:'🔥' },
  { at:10, label:'ELITE TRADER', emoji:'🏆' },
  { at:20, label:'MASTER',       emoji:'💎' },
];

// Per-signal PnL in $ (Gold 1 lot ≈ $10/pt)
const PNL_PER = { tp1:100, tp2:150, tp3:200, sl:-120 };

let lastState   = null;
let lastTradeId = null;
let lastPrepId  = null;
let countdownTimer = null;

// ── Signal Countdown (shown after prep, before signal) ─────────────

// ── Live price for countdown screen ───────────────────────────────
async function fetchLivePriceForCountdown(asset) {
  try {
    const priceEl = document.getElementById('sco-live-price');
    if (!priceEl) return;
    priceEl.style.display = 'block';

    if (asset === 'BTC') {
      const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
      const d = await r.json();
      priceEl.textContent = '$' + Math.round(d.bitcoin.usd).toLocaleString();

    } else if (asset === 'SILVER') {
      const r = await fetch('https://api.metals.live/v1/spot/silver');
      const d = await r.json();
      const p = d[0]?.price;
      if (p) priceEl.textContent = '$' + parseFloat(p).toFixed(2);

    } else if (asset === 'NAS100' || asset === 'NASDAQ' || asset === 'US30') {
      const r = await fetch(`${SERVER}/api/prices`);
      const d = await r.json();
      const p = asset === 'US30' ? d.us30 : d.nas100;
      if (p) priceEl.textContent = '$' + Math.round(p).toLocaleString();

    } else {
      // Default — Gold
      const r = await fetch('https://api.metals.live/v1/spot/gold');
      const d = await r.json();
      const p = d[0]?.price;
      if (p) priceEl.textContent = '$' + parseFloat(p).toFixed(2);
    }
  } catch(e) {}
}

function showSignalCountdown(prep) {
  const overlay  = document.getElementById('signal-countdown');
  const timeEl   = document.getElementById('sco-time');
  const dirEl    = document.getElementById('sco-dir');
  const dirText  = document.getElementById('sco-dir-text');
  const assetEl  = document.getElementById('sco-asset');
  const levelsEl = document.getElementById('sco-levels');

  const isBuy    = prep.direction === 'BUY';
  const asset    = prep.asset || 'GOLD';

  const pairMap = {
    'GOLD':'XAU/USD', 'BTC':'BTC/USD', 'SILVER':'XAG/USD',
    'NAS100':'NAS100', 'NASDAQ':'NAS100', 'US30':'DOW JONES'
  };
  const pairLabel = pairMap[asset] || asset;
  assetEl.textContent = asset + ' · ' + pairLabel;
  dirEl.className     = 'sco-dir ' + (isBuy ? 'buy' : 'sell');
  dirText.textContent = prep.direction;

  // Levels
  const levels = { GOLD:{sl:12,tp1:10,tp2:15,tp3:20}, BTC:{sl:200,tp1:200,tp2:400,tp3:600} };
  levelsEl.innerHTML = `
    <div class="scol-item"><div class="scol-lbl">TP1</div><div class="scol-val tp">—</div></div>
    <div class="scol-item"><div class="scol-lbl">TP2</div><div class="scol-val tp2">—</div></div>
    <div class="scol-item"><div class="scol-lbl">TP3</div><div class="scol-val tp3">—</div></div>`;

  overlay.style.display = 'flex';
  // Fetch and show live market price
  fetchLivePriceForCountdown(asset);

  // Reset TP rows for fresh trade
  [1,2,3].forEach(n => {
    const row = document.getElementById('tp'+n);
    if (row) row.classList.remove('hit','dimmed');
    const check = document.getElementById('tp'+n+'-price');
  });
  const slRow = document.getElementById('sl-row');
  if (slRow) slRow.classList.remove('hit');
  const lb = document.getElementById('live-block');
  if (lb) lb.classList.remove('sl-hit');

  // Vibrate
  if (navigator.vibrate) navigator.vibrate([100,50,100]);

  // Countdown from 5 minutes (300 seconds)
  let secs = prep.secondsUntilSignal || 60;
  clearInterval(countdownTimer);

  function tick() {
    if (secs <= 0) {
      clearInterval(countdownTimer);
      timeEl.textContent = '00:00';
      // Countdown finished — fetch state immediately to show live trade
      setTimeout(() => {
        lastTradeId = null;
        fetchState();
        dismissCountdown();
      }, 500);
      return;
    }
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const pad = n => String(n).padStart(2,'0');
    timeEl.textContent = `${pad(m)}:${pad(s)}`;
    timeEl.className   = secs <= 15 ? 'sco-time urgent' : 'sco-time';
    // Aggressive urgency messages
    const subEl = document.getElementById('sco-sub');
    if (subEl) {
      if (secs <= 5) subEl.textContent = '🔥 NOW OR NEVER';
      else if (secs <= 10) subEl.textContent = '⚡ ENTER POSITION';
      else if (secs <= 15) subEl.textContent = '🚨 GET READY NOW';
      else subEl.textContent = 'Get ready — signal fires automatically';
    }
    if (secs <= 10 && navigator.vibrate) navigator.vibrate([50,30,50]);
    secs--;
  }
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function dismissCountdown() {
  clearInterval(countdownTimer);
  document.getElementById('signal-countdown').style.display = 'none';
}
let streak      = parseInt(localStorage.getItem('14t_streak') || '0');
let totalPnL    = parseFloat(localStorage.getItem('14t_pnl') || '0');
let todayPnL    = parseFloat(localStorage.getItem('14t_today_pnl') || '0');
let totalSigs   = parseInt(localStorage.getItem('14t_signals') || '0');
let wins        = parseInt(localStorage.getItem('14t_wins') || '0');
let pnlInterval = null;
let pnlValue    = 0;
let joinDate    = localStorage.getItem('14t_join') || new Date().toISOString();

// Save join date on first visit
if (!localStorage.getItem('14t_join')) {
  localStorage.setItem('14t_join', joinDate);
}

document.addEventListener('DOMContentLoaded', async () => {
  // Check access code first
  checkAccess();
});

async function bootApp() {
  await registerSW();
  restorePushState();
  startPolling();
  startNextWindowCountdown();
  startMarketMood();
  updateStreak(streak);
  updateStats();
  updateMemberSince();
  showDailyRecap();
  resetTodayPnLIfNewDay();
  startLivePrices();
  checkOnboarding();
  fetchMemberCount();
  initIdleScreen();
  checkRenewal();
  checkSavedBroadcast();
  updateCleanStats();
  checkPrepFromURL();
}

// Force refresh when app comes back into focus (e.g. after tapping push)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    dismissFlash(); // dismiss any flash immediately
    lastTradeId = null;
    fetchState();
  }
});

// ── Service Worker ─────────────────────────────────────────────────
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try { const reg = await navigator.serviceWorker.register('/sw.js'); window._swReg = reg; } catch(e) {}
}

// ── Push ───────────────────────────────────────────────────────────

// ── Handle push messages directly from service worker ──────────────
navigator.serviceWorker && navigator.serviceWorker.addEventListener('message', event => {
  const { type, payload } = event.data || {};
  // Handle notification tap
  if (type === 'NOTIFICATION_CLICKED') {
    dismissFlash();
    const p = event.data.payload || {};
    if (p.type === 'prep') {
      // Show countdown from notification data
      const prepId = p.id || Date.now().toString();
      if (prepId !== lastPrepId) {
        lastPrepId = prepId;
        showSignalCountdown({
          id: prepId,
          asset: p.asset || 'GOLD',
          direction: p.direction,
          secondsUntilSignal: p.secondsUntilSignal || 60,
        });
      }
    } else {
      lastTradeId = null;
      fetchState();
    }
    return;
  }
  if (type !== 'PUSH_RECEIVED' || !payload) return;

  console.log('[APP] Push received from SW:', payload.type);

  if (payload.type === 'renewal_reminder') {
    showRenewalBanner(payload.daysLeft);
    return;
  }
  if (payload.type === 'broadcast') {
    const msg = payload.message || payload.body || payload.contents || 'New message from 14 Trades';
    showBroadcastMessage(msg);
    return;
  }
  if (payload.type === 'prep') {
    // Show countdown only from fresh push — admin confirmed trade
    const prepId = payload.id || Date.now().toString();
    if (prepId !== lastPrepId) {
      lastPrepId = prepId;
      speakAlert('prep');
      showSignalCountdown({
        id: prepId,
        asset: payload.asset || 'GOLD',
        direction: payload.direction,
        secondsUntilSignal: payload.secondsUntilSignal || 60,
      });
    }
  } else if (payload.type === 'be_hit') {
    showBENotification();
    setTimeout(fetchState, 500);
    return;
  } else if (payload.type === 'signal') {
    // Signal fired — dismiss countdown, fetch fresh state
    dismissCountdown();
    lastTradeId = null;
    setTimeout(fetchState, 500);
  } else if (payload.type === 'tp_hit' || payload.type === 'sl_hit') {
    // TP/SL hit — fetch fresh state
    setTimeout(fetchState, 500);
  }
});




// ── Renewal reminder banner ────────────────────────────────────────
function showRenewalBanner(daysLeft) {
  const existing = document.getElementById('renewal-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'renewal-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:800;background:#1A0D00;border-bottom:1px solid #F5A80030;padding:12px 18px;display:flex;align-items:center;gap:10px;animation:slide-down .3s ease';
  banner.innerHTML = `
    <div style="font-size:18px;flex-shrink:0">⚡</div>
    <div style="flex:1">
      <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#F5A800;text-transform:uppercase;margin-bottom:3px">Access expiring in ${daysLeft} day${daysLeft!==1?'s':''}</div>
      <div style="font-size:12px;color:#F0F0F0;line-height:1.4">Renew now to keep receiving signals — contact us on WhatsApp</div>
    </div>
    <div onclick="this.parentElement.remove()" style="color:#555;font-size:18px;cursor:pointer;padding:4px;flex-shrink:0">✕</div>`;
  document.body.insertBefore(banner, document.body.firstChild);
  setTimeout(() => { if (banner.parentElement) banner.remove(); }, 12000);
}

// Check renewal on app open
function checkRenewal() {
  const exp = parseInt(localStorage.getItem('14t_access_exp') || '0');
  const now = Date.now();
  const daysLeft = Math.ceil((exp - now) / (1000*60*60*24));
  if (daysLeft > 0 && daysLeft <= 3) {
    setTimeout(() => showRenewalBanner(daysLeft), 3000);
  }
}

// ── Break Even notification ────────────────────────────────────────
function showBENotification() {
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:800;background:#1A1200;border-bottom:1px solid #F5A80030;padding:12px 18px;display:flex;align-items:center;gap:10px;animation:slide-down .3s ease';
  banner.innerHTML = `
    <div style="font-size:18px;flex-shrink:0">🔒</div>
    <div style="flex:1">
      <div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#F5A800;text-transform:uppercase;margin-bottom:3px">Break Even</div>
      <div style="font-size:12px;color:#F0F0F0;line-height:1.4">SL moved to entry — your trade is now risk free</div>
    </div>
    <div onclick="this.parentElement.remove()" style="color:#555;font-size:18px;cursor:pointer;padding:4px;flex-shrink:0">✕</div>`;
  document.body.insertBefore(banner, document.body.firstChild);
  setTimeout(() => { if (banner.parentElement) banner.remove(); }, 8000);
}

// ── Broadcast message banner ───────────────────────────────────────
function showBroadcastMessage(msg) {
  if (!msg) return;
  // Save to localStorage so it shows on next open
  localStorage.setItem('14t_broadcast', JSON.stringify({ msg, ts: Date.now() }));
  renderBroadcastBanner(msg, Date.now());
}

function renderBroadcastBanner(msg, ts) {
  // Show inside app as card
  const card    = document.getElementById('bc-card');
  const msgEl   = document.getElementById('bc-card-msg');
  const timeEl  = document.getElementById('bc-card-time');

  if (card && msgEl) {
    msgEl.textContent = msg;
    card.style.display = 'block';
    if (timeEl && ts) {
      const ago = getTimeAgo(ts);
      timeEl.textContent = ago;
    }
  }

  // Also show top banner briefly
  const existing = document.getElementById('broadcast-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'broadcast-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:800;background:#0D1520;border-bottom:1px solid #4A9EFF30;padding:10px 18px;display:flex;align-items:center;gap:10px;animation:slide-down .3s ease';
  banner.innerHTML = `
    <div style="font-size:14px;flex-shrink:0">📢</div>
    <div style="flex:1;font-size:11px;color:#F0F0F0;line-height:1.4">${msg}</div>
    <div onclick="this.parentElement.remove()" style="color:#555;font-size:16px;cursor:pointer;padding:4px;flex-shrink:0">✕</div>`;
  const style = document.createElement('style');
  style.textContent = '@keyframes slide-down{0%{transform:translateY(-100%);opacity:0}100%{transform:translateY(0);opacity:1}}';
  document.head.appendChild(style);
  document.body.insertBefore(banner, document.body.firstChild);
  // Auto-dismiss top banner after 6s — card stays
  setTimeout(() => { if (banner.parentElement) banner.remove(); }, 6000);
}

function getTimeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return Math.floor(diff/60) + ' min ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  return Math.floor(diff/86400) + 'd ago';
}

function dismissBroadcast() {
  // Hide top banner
  const banner = document.getElementById('broadcast-banner');
  if (banner) banner.remove();
  // Hide in-app card
  const card = document.getElementById('bc-card');
  if (card) card.style.display = 'none';
  // Mark as dismissed
  const saved = JSON.parse(localStorage.getItem('14t_broadcast') || '{}');
  saved.dismissed = true;
  localStorage.setItem('14t_broadcast', JSON.stringify(saved));
}

function checkSavedBroadcast() {
  try {
    const saved = JSON.parse(localStorage.getItem('14t_broadcast') || '{}');
    if (!saved.msg || saved.dismissed) return;
    // Only show if less than 24 hours old
    const age = Date.now() - (saved.ts || 0);
    if (age < 24 * 60 * 60 * 1000) {
      setTimeout(() => renderBroadcastBanner(saved.msg, saved.ts), 800);
    } else {
      localStorage.removeItem('14t_broadcast');
    }
  } catch(e) {}
}




// ── Update clean stats row ─────────────────────────────────────────
function updateCleanStats() {
  // These pull from existing vars already computed by app
  const wr  = document.getElementById('stat-winrate');
  const sig = document.getElementById('stat-signals');
  const pnl = document.getElementById('pnl-total');
  const cwr  = document.getElementById('c-winrate');
  const csig = document.getElementById('c-signals');
  const cpnl = document.getElementById('c-pnl');
  if (wr  && cwr)  { cwr.textContent  = wr.textContent  || '--%'; }
  if (sig && csig) { csig.textContent = sig.textContent || '0'; }
  if (pnl && cpnl) { cpnl.textContent = pnl.textContent || '+$0'; }
  setTimeout(updateCleanStats, 3000);
}

// ── Black / White Mode Toggle ─────────────────────────────────────
function toggleMode() {
  const body = document.body;
  const icon = document.getElementById('mode-icon');
  const isWhite = body.classList.contains('white-mode');
  if (isWhite) {
    // Switch to BLACK
    body.classList.remove('white-mode');
    localStorage.setItem('14t_mode', 'black');
    if (icon) icon.className = 'ti ti-moon';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#0A0A0A');
  } else {
    // Switch to WHITE
    body.classList.add('white-mode');
    localStorage.setItem('14t_mode', 'white');
    if (icon) icon.className = 'ti ti-sun';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#FFFFFF');
  }
}

// Restore saved mode on load
function initMode() {
  const saved = localStorage.getItem('14t_mode') || 'black';
  const icon = document.getElementById('mode-icon');
  if (saved === 'white') {
    document.body.classList.add('white-mode');
    if (icon) icon.className = 'ti ti-sun';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#FFFFFF');
  } else {
    if (icon) icon.className = 'ti ti-moon';
  }
}
initMode();

// ── Spark line animation ───────────────────────────────────────────
function buildSparkLine() {
  const el = document.getElementById('spark-line');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const bar = document.createElement('div');
    bar.className = 'spark-bar' + (i === 11 ? ' hi' : '');
    bar.style.height = (20 + Math.random() * 80) + '%';
    el.appendChild(bar);
  }
}
function animateSpark() {
  const bars = document.querySelectorAll('.spark-bar');
  bars.forEach(b => {
    b.style.height = (20 + Math.random() * 80) + '%';
    b.style.opacity = Math.random() > 0.7 ? '0.7' : '0.25';
  });
}
buildSparkLine();
setInterval(animateSpark, 2500);

// ── Next signal countdown ──────────────────────────────────────────
function updateNextSignal() {
  try {
    const ny = new Date().toLocaleTimeString('en-US',{timeZone:'America/New_York',hour12:false,hour:'2-digit',minute:'2-digit'});
    const [h, m] = ny.split(':').map(Number);
    const now = h * 60 + m;
    const wins = [21*60, 0, 6*60];
    let bd = 9999;
    wins.forEach(w => { let d = w - now; if (d <= 0) d += 1440; if (d < bd) bd = d; });
    const h2 = Math.floor(bd / 60), m2 = bd % 60;
    const pad = n => String(n).padStart(2, '0');
    const el = document.getElementById('next-sig-time');
    if (el) el.textContent = pad(h2) + ':' + pad(m2);
  } catch(e) {}
}
updateNextSignal();
setInterval(updateNextSignal, 60000);


// ── IDLE SCREEN ────────────────────────────────────────────────────
function initIdleScreen() {
  // Scan messages
  const msgs = [
    'Analyzing Gold structure · No setup confirmed yet',
    'BTC momentum building · Watching key level',
    'Market structure clear · Waiting for trigger',
    'Liquidity sweep detected · Analyzing reaction',
    'High probability zone · Patience required',
    'Scanning for A+ setup · Quality over speed'
  ];
  let mi = 0;
  setInterval(() => {
    mi = (mi + 1) % msgs.length;
    const el = document.getElementById('idle-scan-sub');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = msgs[mi]; el.style.opacity = '1'; }, 300);
  }, 4000);

  // Intel bars
  const states = [
    {c:72,m:55,conf:40},{c:81,m:71,conf:62},{c:65,m:84,conf:55},
    {c:88,m:79,conf:82},{c:60,m:48,conf:35}
  ];
  let si = 0;
  setInterval(() => {
    si = (si + 1) % states.length;
    const s = states[si];
    const bc = document.getElementById('idle-b-c');
    const vc = document.getElementById('idle-v-c');
    const bm = document.getElementById('idle-b-m');
    const vm = document.getElementById('idle-v-m');
    const bconf = document.getElementById('idle-b-conf');
    const vconf = document.getElementById('idle-v-conf');
    if (bc) { bc.style.width = s.c + '%'; vc.textContent = s.c + '%'; }
    if (bm) { bm.style.width = s.m + '%'; vm.textContent = s.m + '%'; }
    if (bconf) { bconf.style.width = s.conf + '%'; vconf.textContent = s.conf + '%'; }
  }, 5000);

  // Fear & Greed
  loadFearGreed();

  // Member count
  setInterval(() => {
    const el = document.getElementById('idle-mc');
    if (!el) return;
    const count = memberCount || 0;
    el.textContent = count > 0 ? count : '--';
  }, 5000);

  // Streak
  const streak = parseInt(localStorage.getItem('14t_streak') || '0');
  const streakEl = document.getElementById('idle-streak');
  if (streakEl) streakEl.textContent = '🔥 ' + streak;

  // Quotes
  const quotes = [
    'The best traders know when NOT to trade. Patience is the real edge.',
    'Protect capital first. Profit follows discipline, not the other way around.',
    'One quality setup beats ten average ones. We wait for perfection.',
    'The market rewards patience. Every time we wait — we win.',
    'Risk management is not fear. It is professionalism.',
    'Discipline is choosing what you want most over what you want now.'
  ];
  let qi = 0;
  setInterval(() => {
    qi = (qi + 1) % quotes.length;
    const el = document.getElementById('idle-quote');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(() => { el.textContent = quotes[qi]; el.style.opacity = '1'; }, 400);
  }, 6000);

  // Last signal from history
  updateLastSignalCard();
}

function getZone(v) {
  if (v <= 25) return { label: 'Extreme Fear', color: '#FF3B4E' };
  if (v <= 45) return { label: 'Fear', color: '#FF8C42' };
  if (v <= 55) return { label: 'Neutral', color: '#F5A800' };
  if (v <= 75) return { label: 'Greed', color: '#7EC636' };
  return { label: 'Extreme Greed', color: '#00C87A' };
}

async function loadFearGreed() {
  try {
    const r = await fetch('https://api.alternative.me/fng/?limit=30');
    const d = await r.json();
    const data = d.data;
    const now = parseInt(data[0].value);
    const z = getZone(now);

    // Needle
    const needle = document.getElementById('fg-needle');
    if (needle) {
      const deg = (now / 100) * 180 - 90;
      needle.style.transform = `rotate(${deg}deg)`;
      needle.style.transformOrigin = '80px 80px';
    }
    const numEl = document.getElementById('fg-num');
    const lblEl = document.getElementById('fg-lbl');
    if (numEl) { numEl.textContent = now; numEl.style.color = z.color; }
    if (lblEl) { lblEl.textContent = z.label; lblEl.style.color = z.color; }

    // Zones highlight
    document.querySelectorAll('.idle-fgz').forEach((el, i) => {
      const labels = ['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Ext. Greed'];
      if (labels[i] === z.label || (i === 4 && z.label === 'Extreme Greed')) {
        el.classList.add('active');
        el.style.background = z.color + '18';
        el.style.borderColor = z.color;
        el.style.opacity = '1';
      } else {
        el.classList.remove('active');
        el.style.background = 'transparent';
        el.style.opacity = '.3';
      }
    });

    // History
    [[data[1],'fg-yd','fg-yd-lbl'],[data[7],'fg-wk','fg-wk-lbl'],[data[29],'fg-mo','fg-mo-lbl']].forEach(([item,vid,lid])=>{
      if (!item) return;
      const val = parseInt(item.value);
      const iz = getZone(val);
      const vel = document.getElementById(vid);
      const lel = document.getElementById(lid);
      if (vel) { vel.textContent = val; vel.style.color = iz.color; }
      if (lel) { lel.textContent = iz.label; lel.style.color = iz.color; }
    });
  } catch(e) {}
}

function updateLastSignalCard() {
  // Will be called from renderHistory when signals are loaded
}

function showLastSignal(sig) {
  const card = document.getElementById('idle-last-sig');
  if (!card || !sig) return;
  card.style.display = 'flex';
  const main = document.getElementById('ils-main');
  const sub  = document.getElementById('ils-sub');
  const badge = document.getElementById('ils-badge');
  if (main)  main.textContent  = (sig.asset || 'GOLD') + ' ' + (sig.direction || '') + ' · ' + (sig.type === 'tp_hit' ? 'TP Hit ✓' : 'SL Hit');
  if (sub)   sub.textContent   = sig.type === 'tp_hit' ? 'Take profit reached' : 'Stop loss hit';
  if (badge) {
    badge.textContent = sig.type === 'tp_hit' ? '✅ Win' : '🔴 SL';
    badge.style.color = sig.type === 'tp_hit' ? 'var(--green)' : 'var(--red)';
    badge.style.borderColor = sig.type === 'tp_hit' ? '#00C87A20' : '#FF3B4E20';
    badge.style.background = sig.type === 'tp_hit' ? '#00C87A10' : '#FF3B4E10';
  }
}


// ── Voice alerts ──────────────────────────────────────────────────
const VOICE_PHRASES = {
  en: {
    prep:     'Order filled.',
    signal:   'Signal confirmed. Get ready.',
    tp_hit:   'Take profit hit. Well done.',
    be_hit:   'Move to break even now.',
    sl_hit:   'Stop loss hit. Protect your capital.',
    tp1_hit:  'Take profit one hit.',
    tp2_hit:  'Take profit two hit.',
    tp3_hit:  'Take profit three hit. Trade closed.',
  },
  fr: {
    prep:     'Ordre exécuté.',
    signal:   'Signal confirmé. Préparez-vous.',
    tp_hit:   'Objectif atteint. Bien joué.',
    be_hit:   'Passez au break even maintenant.',
    sl_hit:   'Stop loss touché. Protégez votre capital.',
    tp1_hit:  'Premier objectif atteint.',
    tp2_hit:  'Deuxième objectif atteint.',
    tp3_hit:  'Troisième objectif atteint. Trade terminé.',
  }
};

function speakAlert(type) {
  try {
    if (!window.speechSynthesis) return;
    const lang = localStorage.getItem('14t_lang') || 'fr';
    const text = VOICE_PHRASES[lang]?.[type] || VOICE_PHRASES['en'][type] || type;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate   = 0.95;
    u.pitch  = 1;
    u.volume = 1;
    u.lang   = lang === 'fr' ? 'fr-FR' : 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const v = lang === 'fr'
      ? (voices.find(v => v.name.includes('Google') && v.lang === 'fr-FR')
      || voices.find(v => v.lang === 'fr-FR')
      || voices.find(v => v.lang.startsWith('fr')))
      : (voices.find(v => v.name.includes('Google') && v.lang === 'en-US')
      || voices.find(v => v.lang === 'en-US')
      || voices.find(v => v.lang.startsWith('en')));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch(e) {}
}

// Load voices early
if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

// ── Push via OneSignal SDK ─────────────────────────────────────────
async function requestPush() {
  try {
    // Wait for OneSignal to be ready
    if (typeof window.OneSignal !== 'undefined') {
      await window.OneSignal.showNativePrompt();
      localStorage.setItem('push_subscribed','1');
      document.getElementById('notif-btn').classList.add('active');
      showToast('Notifications enabled ✓','buy');
    } else if (typeof OneSignalDeferred !== 'undefined') {
      OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.Notifications.requestPermission();
        localStorage.setItem('push_subscribed','1');
        document.getElementById('notif-btn').classList.add('active');
        showToast('Notifications enabled ✓','buy');
      });
    } else {
      // Fallback — native browser permission
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        localStorage.setItem('push_subscribed','1');
        document.getElementById('notif-btn').classList.add('active');
        showToast('Notifications enabled ✓','buy');
      } else {
        showToast('Enable in Settings','info');
      }
    }
  } catch(e) {
    // Last fallback
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        localStorage.setItem('push_subscribed','1');
        document.getElementById('notif-btn').classList.add('active');
        showToast('Notifications enabled ✓','buy');
      }
    } catch(e2) { showToast('Enable notifications in phone Settings','info'); }
  }
}
function restorePushState() {
  if (localStorage.getItem('push_subscribed')) document.getElementById('notif-btn').classList.add('active');
}

// ── Polling ────────────────────────────────────────────────────────
function startPolling() { fetchState(); setInterval(fetchState, 3000); }

async function fetchState() {
  try {
    const res = await fetch(`${SERVER}/api/state?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) return;
    const data = await res.json();
    applyState(data); lastState = data;
  } catch {}
}

function applyState({ activeTrade, signals, prepSignal }) {
  // PREP signal — show countdown
  // Countdown only fires from push notification — never from polling
  // if (prepSignal && prepSignal.id !== lastPrepId) { ... }

  // NEW signal — show flash + update screen
  if (activeTrade) {
    // Dismiss countdown if trade is now open
    if (activeTrade.status === 'open') {
      dismissCountdown();
    }
    if (activeTrade.id !== lastTradeId) {
      if (lastTradeId !== null && activeTrade.status === 'open') {
        showSignalFlash(activeTrade);
      }
      lastTradeId = activeTrade.id;
    }
    updateLiveTrade(activeTrade);
  } else {
    lastTradeId = null;
    updateLiveTrade(null);
  }

  renderHistory(signals || []);
  // Only check FOMO if no active trade
  if (!activeTrade) checkFOMO(signals || []);
  updateMoodFromSignals(signals || []);
}

// ── FULL SCREEN FLASH ──────────────────────────────────────────────
function showSignalFlash(trade) {
  const flash = document.getElementById('signal-flash');
  const isBuy = trade.direction === 'BUY';
  document.getElementById('sf-asset').textContent = (trade.asset||'GOLD') + ' · XAU/USD';
  document.getElementById('sf-dir').textContent   = trade.direction;
  document.getElementById('sf-ring').textContent  = isBuy ? '↑' : '↓';
  document.getElementById('sf-ring').className    = 'sf-ring ' + (isBuy?'buy-ring':'sell-ring');
  document.getElementById('sf-dir').className     = 'sf-dir ' + (isBuy?'buy':'sell');
  flash.className = 'signal-flash ' + (isBuy?'buy-flash':'sell-flash');
  document.getElementById('sf-levels').innerHTML  = `
    <div class="sfl-item"><div class="sfl-lbl">SL</div><div class="sfl-val sl">${formatPrice(trade.sl)}</div></div>
    <div class="sfl-item"><div class="sfl-lbl">TP1</div><div class="sfl-val tp1">—</div></div>
    <div class="sfl-item"><div class="sfl-lbl">TP2</div><div class="sfl-val tp2">—</div></div>
    <div class="sfl-item"><div class="sfl-lbl">TP3</div><div class="sfl-val tp3">—</div></div>`;
  flash.style.display = 'flex';
  // Vibrate
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  setTimeout(dismissFlash, 8000);
}
function dismissFlash() { document.getElementById('signal-flash').style.display = 'none'; }

// ── Live Trade ─────────────────────────────────────────────────────
const tpPos = { 1:'55%', 2:'75%', 3:'93%' };

function updateLiveTrade(trade) {
  const liveBlock  = document.getElementById('live-block');
  const scanBlock  = document.getElementById('scanning-block');
  const fomoCard   = document.getElementById('fomo-card');
  if (!trade) {
    liveBlock.style.display = 'none';
    scanBlock.style.display = 'flex';
    clearInterval(pnlInterval); pnlInterval = null;
    return;
  }
  liveBlock.style.display = 'flex';
  scanBlock.style.display = 'none';
  fomoCard.style.display  = 'none';
  const isBuy = trade.direction === 'BUY';
  document.getElementById('live-asset').textContent = trade.asset || 'GOLD';
  document.getElementById('live-dir').textContent   = trade.direction;
  document.getElementById('live-dir').style.color   = isBuy ? 'var(--green)' : 'var(--red)';
  document.getElementById('sl-price').textContent   = formatPrice(trade.sl);
  // TP prices hidden — admin hits them manually
  document.getElementById('tp1-price').textContent  = '';
  document.getElementById('tp2-price').textContent  = '';
  document.getElementById('tp3-price').textContent  = '';
  // Only mark TP/SL visually from server state - never from signals array
  if (trade.tp1_hit) markTPHit(1, true);
  if (trade.tp2_hit) markTPHit(2, true);
  if (trade.tp3_hit) markTPHit(3, true);
  if (trade.sl_hit)  markSLHit(true);
  if (trade.status === 'open' && !pnlInterval) {
    pnlValue = 0;
    pnlInterval = setInterval(() => {
      pnlValue += Math.floor(Math.random() * 6);
      document.getElementById('pnl-val').textContent = '+$' + pnlValue;
    }, 2000);
  }
  // Also start P&L if confirmed (countdown running)
  if (trade.status === 'confirmed') {
    document.getElementById('pnl-lbl').textContent = 'pending';
    document.getElementById('pnl-val').textContent = '--';
  }
}

function markTPHit(n, silent=false) {
  const row = document.getElementById('tp' + n);
  if (!row || row.classList.contains('hit')) return;
  row.classList.add('hit');
  document.getElementById('prog-fill').style.width  = tpPos[n];
  document.getElementById('prog-cursor').style.left = tpPos[n];
  if (silent) return; // just mark visually, no PnL/streak update
  // Update streak + PnL
  streak++; localStorage.setItem('14t_streak', streak); updateStreak(streak);
  wins++;   localStorage.setItem('14t_wins', wins);
  const earned = PNL_PER['tp'+n] || 100;
  totalPnL += earned; todayPnL += earned;
  localStorage.setItem('14t_pnl', totalPnL);
  localStorage.setItem('14t_today_pnl', todayPnL);
  localStorage.setItem('14t_today_date', new Date().toDateString());
  animatePnL(totalPnL, todayPnL);
  updateStats();
  if (navigator.vibrate) navigator.vibrate(80);
}

function markSLHit(silent=false) {
  const slRow = document.getElementById('sl-row');
  const lb    = document.getElementById('live-block');
  if (!slRow || slRow.classList.contains('hit')) return;
  slRow.classList.add('hit'); lb.classList.add('sl-hit');
  document.getElementById('prog-fill').style.width  = '6%';
  document.getElementById('prog-cursor').style.left = '6%';
  [1,2,3].forEach(n => { const r=document.getElementById('tp'+n); if(r&&!r.classList.contains('hit'))r.classList.add('dimmed'); });
  clearInterval(pnlInterval); pnlInterval = null;
  document.getElementById('pnl-val').textContent = '-$' + Math.floor(Math.random()*60+20);
  document.getElementById('pnl-val').style.color = 'var(--red)';
  document.getElementById('pnl-lbl').textContent = 'closed';
  if (silent) return; // just mark visually
  // Update PnL + streak
  streak = 0; localStorage.setItem('14t_streak', 0); updateStreak(0);
  totalPnL += PNL_PER.sl; todayPnL += PNL_PER.sl;
  localStorage.setItem('14t_pnl', totalPnL);
  localStorage.setItem('14t_today_pnl', todayPnL);
  animatePnL(totalPnL, todayPnL);
  updateStats();
  if (navigator.vibrate) navigator.vibrate([100,50,100,50,100]);
}

// ── PnL animation ──────────────────────────────────────────────────
function animatePnL(total, today) {
  const totalEl = document.getElementById('pnl-total');
  const todayEl = document.getElementById('pnl-today');
  const prefix  = total >= 0 ? '+$' : '-$';
  totalEl.textContent = prefix + Math.abs(total).toLocaleString();
  totalEl.style.color = total >= 0 ? 'var(--green)' : 'var(--red)';
  const tPrefix = today >= 0 ? '+$' : '-$';
  todayEl.textContent = tPrefix + Math.abs(today).toLocaleString();
  todayEl.style.color = today >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('pnl-sub-lbl').textContent = `Based on 1 lot · ${totalSigs} signals`;
}

// ── Stats ──────────────────────────────────────────────────────────
function updateStats() {
  const winRate = totalSigs > 0 ? Math.round((wins / totalSigs) * 100) : 0;
  document.getElementById('stat-winrate').textContent = winRate + '%';
  document.getElementById('stat-signals').textContent = totalSigs;
  animatePnL(totalPnL, todayPnL);
}

// ── Streak ─────────────────────────────────────────────────────────
function updateStreak(n) {
  const num   = document.getElementById('streak-num');
  const title = document.getElementById('streak-title');
  const sub   = document.getElementById('streak-sub');
  const fill  = document.getElementById('streak-fill');
  const badge = document.getElementById('milestone-badge');
  const card  = document.getElementById('streak-card');

  // Find current milestone
  let currentMs = null;
  let nextMs    = MILESTONES[0];
  MILESTONES.forEach(m => { if (n >= m.at) currentMs = m; });
  MILESTONES.forEach(m => { if (n < m.at && (!nextMs || m.at < nextMs.at)) nextMs = m; });

  num.textContent = n >= 3 ? n + ' 🔥' : n;
  card.classList.toggle('hot', n >= 3);

  if (currentMs) {
    title.textContent = currentMs.emoji + ' ' + currentMs.label;
    badge.textContent = currentMs.label;
    badge.style.display = 'block';
  } else {
    title.textContent = 'Streak';
    badge.style.display = 'none';
  }

  if (nextMs) {
    const progress = Math.min((n / nextMs.at) * 100, 100);
    fill.style.width = progress + '%';
    const remaining = nextMs.at - n;
    sub.textContent  = remaining + ' more signal' + (remaining !== 1 ? 's' : '') + ' to unlock';
    document.getElementById('streak-next').textContent = nextMs.emoji + ' ' + nextMs.label + ' at ' + nextMs.at;
  } else {
    fill.style.width = '100%';
    sub.textContent  = 'Maximum level reached 💎';
    document.getElementById('streak-next').textContent = '';
  }
}

// ── Member since ───────────────────────────────────────────────────
function updateMemberSince() {
  const join  = new Date(joinDate);
  const days  = Math.floor((Date.now() - join) / 86400000);
  const month = join.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  document.getElementById('ms-date').textContent = month;
  document.getElementById('ms-days').textContent = days + 'd';
  document.getElementById('stat-days').textContent = days + 'd';
}

// ── Reset today PnL at midnight ────────────────────────────────────
function resetTodayPnLIfNewDay() {
  const saved = localStorage.getItem('14t_today_date');
  const today = new Date().toDateString();
  if (saved && saved !== today) {
    todayPnL = 0;
    localStorage.setItem('14t_today_pnl', 0);
    localStorage.setItem('14t_today_date', today);
  }
}

// ── Daily recap ────────────────────────────────────────────────────
function showDailyRecap() {
  if (totalSigs === 0) return;
  const winRate = totalSigs > 0 ? Math.round((wins/totalSigs)*100) : 0;
  const recapCard = document.getElementById('recap-card');
  const recapDesc = document.getElementById('recap-desc');
  const pnlPrefix = totalPnL >= 0 ? '+' : '';
  recapDesc.innerHTML = `${totalSigs} signals · Win rate <strong style="color:var(--green)">${winRate}%</strong> · P&L <strong style="color:${totalPnL>=0?'var(--green)':'var(--red)'}">${pnlPrefix}$${Math.abs(totalPnL).toLocaleString()}</strong>`;
  recapCard.style.display = 'flex';
}

// ── Countdown ──────────────────────────────────────────────────────
function startNextWindowCountdown() { updateNextWindow(); setInterval(updateNextWindow, 1000); }

function updateNextWindow() {
  const ny = new Date().toLocaleTimeString('en-US',{timeZone:'America/New_York',hour12:false,hour:'2-digit',minute:'2-digit'});
  const [nH,nM] = ny.split(':').map(Number);
  const nowSecs = nH*3600 + nM*60 + new Date().getSeconds();
  let best=null, bestDiff=Infinity;
  WINDOWS.forEach(w=>{
    const[wH,wM]=w.time.split(':').map(Number);
    let diff=(wH*3600+wM*60)-nowSecs;
    if(diff<=0)diff+=86400;
    if(diff<bestDiff){bestDiff=diff;best={...w,secsUntil:diff};}
  });
  if(!best)return;
  const h=Math.floor(best.secsUntil/3600);
  const m=Math.floor((best.secsUntil%3600)/60);
  const s=best.secsUntil%60;
  const pad=n=>String(n).padStart(2,'0');
  const timeStr = h>0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  const urgent = best.secsUntil < 60;
  const cdEl   = document.getElementById('cc-time');
  const card   = document.getElementById('countdown-card');
  const glow   = document.getElementById('cc-glow');
  const border = document.getElementById('cc-border');
  const ring   = document.getElementById('cc-ring');
  const lbl    = document.getElementById('cc-lbl');
  const sub    = document.getElementById('cc-sub');
  cdEl.textContent = timeStr;
  document.getElementById('nw-asset') && (document.getElementById('nw-asset').textContent = best.asset);
  if(urgent){
    cdEl.className='cc-time urgent';
    sub.className='cc-sub urgent';
    sub.textContent='Get ready now';
    lbl.textContent='⚡ Signal incoming';
    card.classList.add('urgent');
    glow.style.display='block';
    border.style.display='block';
    ring.className='cc-ring urgent';
    card.style.display='flex';
    if(navigator.vibrate && best.secsUntil===30) navigator.vibrate([50,50,50]);
  } else if(best.secsUntil <= 300) {
    // Under 5 minutes — show countdown
    card.style.display='flex';
    cdEl.className='cc-time';
    sub.className='cc-sub';
    sub.textContent='Get ready — signal incoming';
    lbl.textContent='⚡ Signal in';
    card.classList.remove('urgent');
    glow.style.display='none';
    border.style.display='none';
    ring.className='cc-ring';
  } else {
    // More than 5 min away — hide completely
    card.style.display='none';
  }
}


// ── Live Prices in Mood Bar ────────────────────────────────────────
function startLivePrices() { fetchLivePrices(); setInterval(fetchLivePrices, 15000); }

async function fetchLivePrices() {
  // Gold + Silver via metals.live
  try {
    const r = await fetch('https://api.metals.live/v1/spot');
    const d = await r.json();
    d.forEach(item => {
      if (item.gold) {
        const el = document.getElementById('mood-gold-price');
        if (el) el.textContent = '$' + parseFloat(item.gold).toFixed(2);
      }
      if (item.silver) {
        const el = document.getElementById('mood-silver-price');
        if (el) el.textContent = '$' + parseFloat(item.silver).toFixed(2);
      }
    });
  } catch(e) {
    // Fallback individual calls
    try {
      const r = await fetch('https://api.metals.live/v1/spot/gold');
      const d = await r.json();
      const p = d[0]?.price;
      const el = document.getElementById('mood-gold-price');
      if (el && p) el.textContent = '$' + parseFloat(p).toFixed(2);
    } catch(e2) {}
    try {
      const r = await fetch('https://api.metals.live/v1/spot/silver');
      const d = await r.json();
      const p = d[0]?.price;
      const el = document.getElementById('mood-silver-price');
      if (el && p) el.textContent = '$' + parseFloat(p).toFixed(2);
    } catch(e2) {}
  }

  // BTC via CoinGecko
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
    const d = await r.json();
    const el = document.getElementById('mood-btc-price');
    if (el) el.textContent = '$' + Math.round(d.bitcoin.usd).toLocaleString();
  } catch(e) {}

  // NAS100 + US30 via own server proxy (no CORS issues)
  try {
    const r = await fetch(`${SERVER}/api/prices`);
    const d = await r.json();
    const nasEl  = document.getElementById('mood-nas-price');
    const us30El = document.getElementById('mood-us30-price');
    if (nasEl  && d.nas100) nasEl.textContent  = '$' + Math.round(d.nas100).toLocaleString();
    if (us30El && d.us30)   us30El.textContent = '$' + Math.round(d.us30).toLocaleString();
  } catch(e) {}

  // Session + NY time
  try {
    const nyTime = new Date().toLocaleTimeString('en-US',{timeZone:'America/New_York',hour12:false,hour:'2-digit',minute:'2-digit'});
    const nyH = parseInt(nyTime.split(':')[0]);
    let session = 'Closed';
    if (nyH >= 9  && nyH < 17) session = 'NY Open';
    else if (nyH >= 2 && nyH < 8)  session = 'London';
    else if (nyH >= 19 || nyH < 2) session = 'Asia';
    const el  = document.getElementById('mood-session-tag');
    const pel = document.getElementById('mood-session-price');
    if (el)  el.textContent  = session;
    if (pel) pel.textContent = nyTime + ' NY';
    // Update session strip
    const sessLbl = document.getElementById('mood-session-tag');
    const sessTime = document.getElementById('mood-session-price');
    if (sessLbl) sessLbl.textContent = session;
    if (sessTime) sessTime.textContent = nyTime + ' NY';
  } catch(e) {}
}

// ── Market Mood ────────────────────────────────────────────────────
function startMarketMood(){updateMood();setInterval(updateMood,60000);}
function updateMood(){
  const nyHour=parseInt(new Date().toLocaleTimeString('en-US',{timeZone:'America/New_York',hour12:false,hour:'2-digit'}));
  let s,sc;
  if(nyHour>=8&&nyHour<12){s='NY Open';sc='bull';}
  else if(nyHour>=12&&nyHour<14){s='NY Prime';sc='volatile';}
  else if(nyHour>=14&&nyHour<17){s='NY Close';sc='bull';}
  else if(nyHour>=2&&nyHour<8){s='London';sc='bull';}
  else if(nyHour>=19||nyHour<2){s='Asia';sc='neutral';}
  else{s='Off Hours';sc='neutral';}
  setMoodTag('mood-session-tag',s,sc);
}
function updateMoodFromSignals(signals){
  const lg=signals.find(s=>s.asset==='GOLD'&&s.type==='signal');
  const lb=signals.find(s=>s.asset==='BTC'&&s.type==='signal');
  const gm=lg?(lg.direction==='BUY'?{tag:'Bullish',cls:'bull'}:{tag:'Bearish',cls:'bear'}):{tag:'Watching',cls:'neutral'};
  const bm=lb?(lb.direction==='BUY'?{tag:'Bullish',cls:'bull'}:{tag:'Bearish',cls:'bear'}):{tag:'Watching',cls:'neutral'};
  setMoodTag('mood-gold-tag',gm.tag,gm.cls);
  setMoodTag('mood-btc-tag',bm.tag,bm.cls);
}
function setMoodTag(id,text,cls){const el=document.getElementById(id);if(!el)return;el.textContent=text;el.className='mood-tag '+cls;}

// ── FOMO ───────────────────────────────────────────────────────────
function checkFOMO(signals){
  const scanBlock=document.getElementById('scanning-block');
  const fomoCard=document.getElementById('fomo-card');
  const liveBlock=document.getElementById('live-block');
  if(liveBlock.style.display!=='none')return;
  const closed=signals.find(s=>(s.type==='tp_hit'||s.type==='sl_hit')&&(Date.now()-new Date(s.timestamp))<3600000);
  if(closed){
    scanBlock.style.display='none';fomoCard.style.display='flex';
    const isTP=closed.type==='tp_hit';
    document.getElementById('fomo-title').textContent=isTP?`TP${closed.level} Hit — ${closed.asset}`:`SL Hit — ${closed.asset}`;
    document.getElementById('fomo-desc').textContent=isTP?`Don't miss the next one. Keep notifications ON.`:`Stay ready for the next setup.`;
  }else{fomoCard.style.display='none';scanBlock.style.display='flex';}
}

// ── History ────────────────────────────────────────────────────────

// ── ONBOARDING ─────────────────────────────────────────────────────
function checkOnboarding() {
  if (!localStorage.getItem('14t_onboarded')) {
    document.getElementById('onboarding').style.display = 'flex';
  }
}
function dismissOnboarding() {
  localStorage.setItem('14t_onboarded', '1');
  document.getElementById('onboarding').style.display = 'none';
  requestPush(); // prompt notifications right after
}

// ── SHARE APP ──────────────────────────────────────────────────────
function shareApp() {
  const text = '🔥 I trade Gold & BTC signals with 14 Trades Alert — real-time push notifications, live countdown, win rate tracking. Join here: https://14trades-pwa.vercel.app';
  if (navigator.share) {
    navigator.share({ title: '14 Trades Alert', text, url: 'https://14trades-pwa.vercel.app' });
  } else {
    navigator.clipboard?.writeText(text);
    showToast('Link copied ✓', 'buy');
  }
}

// ── MEMBER COUNT ───────────────────────────────────────────────────
async function fetchMemberCount() {
  try {
    const res = await fetch(`${SERVER}/api/members`);
    const d   = await res.json();
    const bar = document.getElementById('member-count-bar');
    const txt = document.getElementById('mc-text');
    if (d.count && d.count > 0) {
      txt.textContent = d.count + ' members trading live';
      bar.style.display = 'flex';
    }
  } catch(e) {}
}

// ── PERFORMANCE CHART ──────────────────────────────────────────────
function renderPerfChart(signals) {
  const card = document.getElementById('perf-card');
  const trades = signals.filter(s => s.type === 'tp_hit' || s.type === 'sl_hit').slice(0, 20).reverse();
  if (trades.length < 2) { card.style.display = 'none'; return; }

  card.style.display = 'block';

  const labels = trades.map((_, i) => '#' + (i + 1));
  const data   = trades.map(t => t.type === 'tp_hit' ? 1 : -1);
  const colors = data.map(v => v > 0 ? '#00C87A' : '#FF3B4E');

  // Running P&L
  let running = 0;
  const pnlData = trades.map(t => {
    running += t.type === 'tp_hit' ? 100 : -120;
    return running;
  });

  const wins = trades.filter(t => t.type === 'tp_hit').length;
  document.getElementById('perf-winrate').textContent = Math.round((wins/trades.length)*100) + '% win rate';

  const ctx = document.getElementById('perf-chart');
  if (ctx._chart) ctx._chart.destroy();

  ctx._chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: pnlData,
        backgroundColor: colors,
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false, grid: { display: false } }
      },
      animation: { duration: 600 }
    }
  });
}

// ── DAILY RECAP PUSH (server-side cron) ───────────────────────────
// Handled in server.js — cron at 23:00 NY sends daily recap push

function renderHistory(signals){
  const feed=document.getElementById('hist-feed');
  const items=signals.filter(s=>s.type!=='prep').slice(0,10);
  if(!items.length){feed.innerHTML='<div style="font-size:11px;color:var(--muted);padding:8px 2px">No history yet</div>';return;}
  feed.innerHTML=items.map(sig=>{
    const m=ASSET_META[sig.asset]||{ico:sig.asset,bg:'#1A1A1A',color:'#888',border:'#222'};
    let out='';
    if(sig.type==='tp_hit')out=`<div class="outcome tp">TP${sig.level} HIT</div>`;
    else if(sig.type==='sl_hit')out=`<div class="outcome sl">SL HIT</div>`;
    else if(sig.type==='signal')out=`<div class="outcome open">OPEN</div>`;
    return`<div class="hist-item"><div class="hi-left"><div class="hi-ico" style="background:${m.bg};color:${m.color};border:1px solid ${m.border}">${m.ico}</div><div><div class="hi-asset">${sig.asset||'GOLD'}</div><div class="hi-sub">${formatAgo(sig.timestamp)}</div></div></div><div class="hi-right">${sig.direction?`<div class="hi-dir ${(sig.direction||'').toLowerCase()}">${sig.direction}</div>`:''}${out}</div></div>`;
  }).join('');
}

// ── Install ────────────────────────────────────────────────────────
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();document.getElementById('install-banner').style.display='flex';});
function dismissInstall(){document.getElementById('install-banner').style.display='none';}

// ── Toast ──────────────────────────────────────────────────────────
function showToast(msg,type='info'){const t=document.getElementById('toast');t.textContent=msg;t.className=`toast ${type} show`;setTimeout(()=>t.classList.remove('show'),3000);}

// ── Helpers ────────────────────────────────────────────────────────
function formatPrice(p){if(!p)return'—';return parseFloat(p).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
function formatAgo(iso){const d=Math.floor((Date.now()-new Date(iso))/60000);if(d<1)return'just now';if(d<60)return d+' min ago';if(d<1440)return Math.floor(d/60)+'h ago';return new Date(iso).toLocaleDateString();}
function urlBase64ToUint8Array(b64){const pad='='.repeat((4-b64.length%4)%4);const raw=atob((b64+pad).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));}
