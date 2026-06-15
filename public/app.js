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

function setLang(lang) {
  localStorage.setItem('14t_lang', lang);
  // Update active button
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  // Apply translations
  applyLang(lang);
}

function applyLang(lang) {
  const isFr = lang === 'fr';
  // Update scanning text
  const sub = document.getElementById('idle-scan-sub');
  if (sub) sub.textContent = isFr ? 'Analyse en cours · pas de setup' : 'Analyzing structure · no setup';
  // Update session label
  const sess = document.getElementById('mood-session-tag');
  if (sess && sess.textContent) {
    const sessions = {
      en: {'NY Open':'NY Open','London':'London','Asia':'Asia','Closed':'Closed'},
      fr: {'NY Open':'NY Ouvert','London':'Londres','Asia':'Asie','Closed':'Fermé'}
    };
  }
  // Update stats labels
  document.querySelectorAll('.c-st-l').forEach((el, i) => {
    const labels = {
      en: ['Win','Signals','P&L'],
      fr: ['Gain','Signaux','P&L']
    };
    if (labels[lang] && labels[lang][i]) el.textContent = labels[lang][i];
  });
}

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
  const access = document.getElementById('access-screen');
  const main   = document.getElementById('main-app');
  if (access) access.style.display = 'none';
  if (main)   main.style.display   = 'flex';
  bootApp();
}

// ── Handle prep data from notification click URL ──────────────────
function checkPrepFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const prep   = params.get('prep');
    if (!prep) return;
    const p = JSON.parse(decodeURIComponent(prep));
    if (p.type === 'prep') {
      const secs = p.secondsUntilSignal || 60;
      // Show countdown immediately
      // Wait for app to fully boot before showing countdown
      const showCD = () => {
        speakAlert('prep');
        showSignalCountdown({
          id: p.id,
          asset: p.asset || 'GOLD',
          direction: p.direction,
          secondsUntilSignal: secs,
        });
      };
      // Retry until overlay is ready — max 3 attempts
      let attempts = 0;
      const tryShow = () => {
        const overlay = document.getElementById('signal-countdown');
        if (overlay) {
          showCD();
        } else if (attempts < 3) {
          attempts++;
          setTimeout(tryShow, 800);
        }
      };
      setTimeout(tryShow, 400);
    }
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
    const wasTrial = (saved || '').startsWith('TRIAL-');
    localStorage.removeItem('14t_access');
    localStorage.removeItem('14t_access_exp');
    if (wasTrial) {
      window.location.href = '/access.html?expired=trial';
    } else {
      window.location.href = '/access.html';
    }
  }
}

function showLoginOverlay() {
  // Hide phone
  const phone = document.getElementById('main-app');
  if (phone) phone.style.display = 'none';

  // Build login screen
  const overlay = document.createElement('div');
  overlay.id = 'login-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:#1C1C1E;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;z-index:9999;font-family:Inter,sans-serif';
  overlay.innerHTML = `
    <div style="font-family:Space Mono,monospace;font-size:28px;font-weight:700;color:#FFD700;margin-bottom:6px">14⚡</div>
    <div style="font-size:13px;color:#636366;margin-bottom:40px;letter-spacing:.5px">TRADES ALERT</div>
    <div style="width:100%;max-width:320px;display:flex;flex-direction:column;gap:12px">
      <input id="li-email" type="email" placeholder="your@email.com" autocomplete="email"
        style="background:#2C2C2E;border:1px solid #3A3A3C;border-radius:12px;padding:14px 16px;font-size:14px;color:#F5F5F0;outline:none;width:100%;font-family:Inter,sans-serif">
      <input id="li-code" type="text" placeholder="XXXX-XXXX" maxlength="9" autocorrect="off" autocapitalize="characters"
        style="background:#2C2C2E;border:1px solid #3A3A3C;border-radius:12px;padding:14px 16px;font-size:16px;color:#F5F5F0;outline:none;width:100%;font-family:Space Mono,monospace;letter-spacing:3px;text-align:center"
        oninput="this.value=this.value.toUpperCase()">
      <button onclick="submitLogin()"
        style="background:#FFD700;color:#000;border:none;border-radius:12px;padding:16px;font-size:15px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;width:100%;letter-spacing:.5px">
        ACCESS ⚡
      </button>
      <div id="li-error" style="font-size:12px;color:#FF453A;text-align:center;display:none"></div>
    </div>
    <div style="font-size:10px;color:#3A3A3C;margin-top:32px;text-align:center">Contact Sadikh on WhatsApp to get your access code</div>
  `;
  document.body.appendChild(overlay);
}

async function submitLogin() {
  const email = document.getElementById('li-email')?.value?.trim();
  const code  = document.getElementById('li-code')?.value?.trim().toUpperCase();
  const errEl = document.getElementById('li-error');
  const btn   = document.querySelector('#login-overlay button');

  if (!email || !code || code.length < 8) {
    if (errEl) { errEl.textContent = 'Please enter your email and access code'; errEl.style.display = 'block'; }
    return;
  }

  if (btn) btn.textContent = 'Checking...';
  if (errEl) errEl.style.display = 'none';

  try {
    const res = await fetch(`${SERVER}/api/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, deviceId: getDeviceId() })
    });
    const d = await res.json();

    if (d.ok || d.success || d.token) {
      // Save access
      localStorage.setItem('14t_access', code);
      localStorage.setItem('14t_email', email);
      const exp = d.expiresAt || d.expires_at || (Date.now() + 30 * 24 * 60 * 60 * 1000);
      localStorage.setItem('14t_access_exp', exp);

      // Hide overlay, show app
      const overlay = document.getElementById('login-overlay');
      if (overlay) overlay.remove();
      const phone = document.getElementById('main-app');
      if (phone) phone.style.display = 'flex';
      bootApp();
    } else {
      if (errEl) { errEl.textContent = d.error || 'Invalid code. Please try again.'; errEl.style.display = 'block'; }
      if (btn) btn.textContent = 'ACCESS ⚡';
    }
  } catch(e) {
    if (errEl) { errEl.textContent = 'Connection error. Please try again.'; errEl.style.display = 'block'; }
    if (btn) btn.textContent = 'ACCESS ⚡';
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
let lastPrepId  = null; // reset each session — never persisted
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
  const asset = (prep.asset || 'GOLD').toUpperCase();
  const pairMap = {
    'GOLD':'XAU/USD', 'BTC':'BTC/USD', 'SILVER':'XAG/USD',
    'NAS100':'NAS100', 'NASDAQ':'NAS100', 'US30':'DOW JONES',
    'US30':'DOW JONES'
  };
  const pairLabel = pairMap[asset] || asset;
  const assetNorm = asset.replace('US 30','US30').replace('NAS 100','NAS100');
  assetEl.textContent = assetNorm + ' · ' + pairLabel;
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
  registerSW(); // don't await — start polling immediately
  restorePushState();
  startPolling(); // starts immediately, no wait
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
  // Always hide window countdown card — members must never see trading windows
  const ccCard = document.getElementById('countdown-card');
  if (ccCard) ccCard.style.display = 'none';
  loadReferralBanner();
  setTimeout(loadReferralBanner, 1000);
  setTimeout(loadReferralBanner, 3000);
  checkExpiryState();

  // Auto-extend from email link ?extend=CODE
  const extCode = new URLSearchParams(location.search).get('extend');
  if (extCode) {
    autoExtendFromEmail(extCode);
  }
  // Try to save player ID in background
  const savedCode = localStorage.getItem('14t_access');
  if (savedCode) setTimeout(() => savePlayerIdToServer(savedCode), 3000);

  // Apply saved language
  const savedLang = localStorage.getItem('14t_lang') || 'fr';
  setLang(savedLang);
  checkURLBroadcast();
  updateCleanStats();
  checkPrepFromURL();
}

// Force refresh when app comes back into focus (e.g. after tapping push)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    dismissFlash();
    lastTradeId = null;
    // Make sure main app is visible
    const mainApp = document.getElementById('main-app');
    const mainEl  = document.getElementById('maintenance-screen');
    if (mainApp && mainApp.style.display === 'none') {
      // Check maintenance before showing
      fetch(SERVER + '/api/state?t=' + Date.now())
        .then(r => r.json())
        .then(d => {
          const isAdmin = localStorage.getItem('14t_admin_preview') === 'sadikh';
          if (!d.maintenance || isAdmin) {
            mainApp.style.display = 'flex';
            if (mainEl) mainEl.style.display = 'none';
          }
          applyState(d);
        })
        .catch(() => {
          if (mainApp) mainApp.style.display = 'flex';
        });
    } else {
      fetchState();
    }
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
      const prepId = p.id || Date.now().toString();
      if (prepId !== lastPrepId) {
        lastPrepId = prepId;
        speakAlert('prep');
        showSignalCountdown({
          id: prepId,
          asset: p.asset || 'GOLD',
          direction: p.direction,
          secondsUntilSignal: p.secondsUntilSignal || 60,
        });
      }
    } else if (p.type === 'broadcast') {
      const msg = p.message || p.body || p.contents || '';
      if (msg) showBroadcastMessage(msg);
    } else if (p.type === 'be_hit') {
      speakAlert('be_hit');
      fetchState();
    } else if (p.type === 'tp_hit') {
      speakAlert('tp_hit');
      fetchState();
    } else if (p.type === 'sl_hit') {
      speakAlert('sl_hit');
      fetchState();
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
  if (!msg) return;

  // Try to show in-app card
  const card  = document.getElementById('bc-card');
  const msgEl = document.getElementById('bc-card-msg');
  const timeEl = document.getElementById('bc-card-time');

  if (card && msgEl) {
    msgEl.textContent = msg;
    card.style.cssText = 'display:block;background:#0D1520;border:1px solid #4A9EFF25;border-radius:14px;padding:12px 14px;position:relative;margin-bottom:4px';
    if (timeEl && ts) timeEl.textContent = getTimeAgo(ts);
  } else {
    // Card element not found — create floating card inside main
    const existing = document.getElementById('bc-float');
    if (existing) existing.remove();
    const float = document.createElement('div');
    float.id = 'bc-float';
    float.style.cssText = 'background:#0D1520;border:1px solid #4A9EFF25;border-radius:14px;padding:12px 14px;margin:8px 16px 0;position:relative';
    float.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="font-size:16px;flex-shrink:0">📢</div>
        <div style="flex:1">
          <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;color:#4A9EFF;text-transform:uppercase;margin-bottom:5px">Message · Sadikh</div>
          <div style="font-size:13px;color:#F0F0F0;line-height:1.6">${msg}</div>
          <div style="font-size:8px;color:#4A9EFF40;margin-top:4px">${ts ? getTimeAgo(ts) : ''}</div>
        </div>
        <div onclick="dismissBroadcast()" style="color:#3A3A3C;font-size:16px;cursor:pointer;padding:2px;flex-shrink:0">✕</div>
      </div>`;
    // Insert at top of main
    const main = document.querySelector('.main') || document.querySelector('.phone') || document.body;
    main.insertBefore(float, main.firstChild);
  }

  // No top banner — card inside app is enough
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


// ── Read broadcast from URL on open ───────────────────────────────
function checkURLBroadcast() {
  try {
    const params = new URLSearchParams(window.location.search);
    const bc = params.get('bc');
    if (bc) {
      const msg = decodeURIComponent(bc);
      showBroadcastMessage(msg);
      // Clean URL
      window.history.replaceState({}, '', '/');
    }
  } catch(e) {}
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





function dismissLastTrade(id) {
  localStorage.setItem('14t_last_trade_dismissed', id);
  const card = document.getElementById('last-trade-result');
  if (card) card.remove();
}

// ── Show last closed trade result ─────────────────────────────────
function showLastTradeResult(trade) {
  const existing = document.getElementById('last-trade-result');
  if (existing) return; // already showing

  const isWin = trade.outcome === 'tp3' || trade.outcome === 'tp2' || trade.outcome === 'tp1';
  const isSL  = trade.outcome === 'sl';
  const color  = isSL ? '#FF453A' : '#30D158';
  const icon   = isSL ? '🔴' : '✅';
  const label  = isSL ? 'Stop Loss Hit' : 'TP' + (trade.outcome?.replace('tp','') || '3') + ' Hit';
  const minsAgo = Math.floor((Date.now() - trade.closedAt) / 60000);

  // Don't show if already dismissed
  const dismissed = localStorage.getItem('14t_last_trade_dismissed');
  if (dismissed === trade.id) return;

  const card = document.createElement('div');
  card.id = 'last-trade-result';
  card.style.cssText = 'background:#1C1C1E;border:1px solid ' + color + '30;border-radius:14px;padding:12px 14px;margin:0';
  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;color:${color};text-transform:uppercase">Last Signal · ${minsAgo} min ago</div>
      <div onclick="dismissLastTrade('${trade.id}')" style="font-size:14px;color:#636366;cursor:pointer;padding:2px 4px">✕</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-size:13px;font-weight:700;color:#F5F5F0">${icon} ${(trade.asset||'GOLD')} ${trade.direction||''}</div>
        <div style="font-size:11px;color:${color};margin-top:3px;font-weight:600">${label}</div>
      </div>
      <div style="font-family:Space Mono,monospace;font-size:20px;font-weight:700;color:${color}">${isSL ? '—' : '✓'}</div>
    </div>`;

  // Insert at top of scanning block
  const scan = document.getElementById('scanning-block');
  if (scan) scan.insertBefore(card, scan.firstChild);

  // Remove after 30 min
  setTimeout(() => { if (card.parentElement) card.remove(); }, 30 * 60 * 1000);
}





// ── Render multiple trades ─────────────────────────────────────────
let renderedTradeIds = [];

function renderAllTrades(trades) {
  const container = document.getElementById('live-trade');
  if (!container) return;

  // Check if trades changed
  const ids = trades.map(t=>t.id).join(',');
  if (ids === renderedTradeIds.join(',') && !trades.some(t => t.tp1_hit||t.tp2_hit||t.tp3_hit||t.sl_hit||t.be_hit)) {
    // Just update TP statuses without full re-render
    trades.forEach(t => updateTradeCard(t));
    return;
  }
  renderedTradeIds = trades.map(t=>t.id);

  if (trades.length === 1) {
    // Single trade — use existing updateLiveTrade
    container.innerHTML = getSigCardHTML(trades[0]);
    checkShowShareBtn(trades[0]);
    return;
  }

  // Multiple trades — stack them
  container.innerHTML = trades.map(t => `
    <div id="trade-${t.id}" style="margin-bottom:8px">${getSigCardHTML(t)}</div>
  `).join('');
}

function getSigCardHTML(trade) {
  const isBuy  = (trade.direction||'').toUpperCase() === 'BUY';
  const color  = isBuy ? '#30D158' : '#FF453A';
  const asset  = (trade.asset||'GOLD').toUpperCase();
  const pairs  = {GOLD:'XAU/USD',SILVER:'XAG/USD',BTC:'BTC/USD',NAS100:'NAS100',US30:'DOW JONES'};
  const icos   = {GOLD:'XAU',SILVER:'XAG',BTC:'BTC',NAS100:'NAS',US30:'US30'};

  const tpRows = [1,2,3].map(n => {
    const hit    = trade['tp'+n+'_hit'];
    const price  = trade['tp'+n+'_price'] || '';
    const target = trade['tp'+n] || '';
    // Show: target price if available, then hit price, then status
    let label;
    if (hit && price) label = price + ' ✓';
    else if (hit) label = '✓ Hit';
    else if (target) label = target;
    else label = n===3&&trade.tp2_hit ? 'Running...' : 'Waiting...';
    return `<div class="lt-tp${hit?' hit':''}" id="tp${n}-${trade.id}">
      <div class="lt-tp-l">TP${n}</div>
      <div class="lt-tp-line"></div>
      <div class="lt-tp-s" id="tp${n}s-${trade.id}">${label}</div>
    </div>`;
  }).join('');

  return `<div class="sig-card ${isBuy?'buy':'sell'}" id="card-${trade.id}">
    <div class="lt-top-row">
      <div class="lt-left">
        <div class="lt-ico ${isBuy?'buy':'sell'}">${icos[asset]||asset}</div>
        <div>
          <div class="lt-asset-lbl">${asset}</div>
          <div class="lt-pair-lbl">${pairs[asset]||asset}</div>
        </div>
      </div>
      <div class="lt-live-badge">
        <div class="lt-live-dot" style="background:${color}"></div>
        <div class="lt-live-txt" style="color:${color}">RUNNING</div>
      </div>
    </div>
    <div class="lt-dir-row">
      <div class="lt-direction" style="color:${color}">${trade.direction||''}</div>
      <div class="lt-dir-arrow" style="color:${color}">${isBuy?'↑':'↓'}</div>
    </div>
    ${trade.entry ? `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#0A0A0A;border-radius:10px;border:1px solid #2A2A2A;margin-bottom:4px">
      <div style="font-size:9px;font-weight:700;color:#636366;letter-spacing:1px;text-transform:uppercase">📍 Entry</div>
      <div style="font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:#FFD700">${trade.entry}</div>
    </div>` : ''}
    <div class="lt-tps">${tpRows}</div>
    <div class="lt-sl-row">
      <div class="lt-sl-left">
        <div class="lt-sl-ico">SL</div>
        <div class="lt-sl-l">Stop Loss</div>
      </div>
      <div class="lt-sl-v" id="sl-${trade.id}">${trade.sl||'--'}</div>
    </div>
    <div class="lt-be-banner" id="be-${trade.id}" style="display:${trade.be_hit?'flex':'none'}">🔒 Break even active</div>
    <div id="share-btn-${trade.id}" style="display:${trade.tp1_hit||trade.tp2_hit||trade.tp3_hit?'block':'none'};margin-top:4px">
      <button onclick="showShareCard('${trade.id}')" style="width:100%;background:linear-gradient(135deg,#FFD70018,#FFD70008);border:1px solid #FFD70030;border-radius:10px;padding:10px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:Inter,sans-serif">
        <span style="font-size:15px">📤</span>
        <span style="font-size:11px;font-weight:700;color:#FFD700;letter-spacing:.5px">Share this result</span>
      </button>
    </div>
  </div>`;
}

function updateTradeCard(trade) {
  [1,2,3].forEach(n => {
    const row = document.getElementById(`tp${n}-${trade.id}`);
    const s   = document.getElementById(`tp${n}s-${trade.id}`);
    if (!row || !s) return;
    const hit   = trade['tp'+n+'_hit'];
    const price = trade['tp'+n+'_price'] || '';
    if (hit) {
      row.classList.add('hit');
      s.textContent = price || '✓ Hit';
    }
  });
  const be = document.getElementById(`be-${trade.id}`);
  if (be) be.style.display = trade.be_hit ? 'flex' : 'none';
  const shareBtn = document.getElementById(`share-btn-${trade.id}`);
  if (shareBtn && (trade.tp1_hit||trade.tp2_hit||trade.tp3_hit)) shareBtn.style.display = 'block';
}

// ── Share Card ─────────────────────────────────────────────────────
function showShareCard() {
  const trade = lastState?.activeTrade;
  if (!trade) return;

  const isBuy  = (trade.direction||'').toUpperCase() === 'BUY';
  const color  = isBuy ? '#30D158' : '#FF453A';
  const asset  = (trade.asset||'GOLD').toUpperCase();
  const pairs  = {GOLD:'XAU / USD',SILVER:'XAG / USD',BTC:'BTC / USD',NAS100:'NAS 100',US30:'DOW JONES'};
  const icos   = {GOLD:'XAU',SILVER:'XAG',BTC:'BTC',NAS100:'NAS',US30:'US30'};

  // Highest TP hit
  const tp = trade.tp3_hit ? 3 : trade.tp2_hit ? 2 : trade.tp1_hit ? 1 : 0;
  const badge = tp === 3 ? 'TP3 HIT 🏆' : tp === 2 ? 'TP2 HIT ✓' : tp === 1 ? 'TP1 HIT ✓' : 'RUNNING';

  // Update card
  const set = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };
  const setStyle = (id, prop, val) => { const el=document.getElementById(id); if(el) el.style[prop]=val; };

  set('sc-result-badge', badge);
  setStyle('sc-result-badge', 'background', color+'20');
  setStyle('sc-result-badge', 'borderColor', color+'40');
  setStyle('sc-result-badge', 'color', color);

  set('sc-ico',   icos[asset] || asset);
  set('sc-asset', asset);
  set('sc-pair',  pairs[asset] || asset);
  set('sc-dir',   trade.direction || '');
  setStyle('sc-dir', 'color', color);

  // TP rows
  const tpsEl = document.getElementById('sc-tps');
  if (tpsEl) {
    tpsEl.innerHTML = [1,2,3].map(n => {
      const hit = trade['tp'+n+'_hit'];
      const c   = hit ? color : '#2A2A2A';
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:8px;background:#0A0A0A;border:1px solid ${c}25">
        <div style="width:16px;height:16px;border-radius:50%;background:${c}20;border:1px solid ${c}40;display:flex;align-items:center;justify-content:center;font-size:8px;color:${c};flex-shrink:0">${hit?'✓':'—'}</div>
        <div style="font-size:10px;font-weight:700;color:${c}">TP${n} ${hit?'Hit':''}</div>
        ${n===3&&hit?'<div style="margin-left:auto;font-size:12px">🏆</div>':''}
      </div>`;
    }).join('');
  }

  // Stats — use real data
  set('sc-wr',   '80%');
  set('sc-sigs', '5');
  set('sc-pnl',  '+$600');

  // Show overlay
  const overlay = document.getElementById('share-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function closeShareCard() {
  const overlay = document.getElementById('share-overlay');
  if (overlay) overlay.style.display = 'none';
}

// Show share button when any TP is hit
function checkShowShareBtn(trade) {
  const wrap = document.getElementById('share-btn-wrap');
  if (!wrap) return;
  const anyHit = trade && (trade.tp1_hit || trade.tp2_hit || trade.tp3_hit);
  wrap.style.display = anyHit ? 'block' : 'none';
}



// ── Auto-extend from email link ────────────────────────────────────
async function autoExtendFromEmail(code) {
  try {
    // Save code to localStorage first
    localStorage.setItem('14t_access', code.toUpperCase());
    const exp = new Date(Date.now() + 7*24*60*60*1000);
    localStorage.setItem('14t_access_exp', exp.getTime());

    // Call extend API
    const deviceId = localStorage.getItem('14t_device_id') || getDeviceId();
    const res = await fetch(SERVER + '/api/extend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase(), deviceId })
    });
    const d = await res.json();

    if (d.ok) {
      // Update expiry
      localStorage.setItem('14t_access_exp', d.expiresAt.toString());
      localStorage.setItem('14t_extended', 'true');
      localStorage.setItem('14t_ext_exp', d.expiresAt.toString());

      // Remove URL param and reload to show app
      const url = new URL(location.href);
      url.searchParams.delete('extend');
      window.history.replaceState({}, '', url);

      // Show success message briefly
      showToastIfExists('✅ 3 jours gratuits activés !');
      // Reload app state
      setTimeout(() => { checkAccess(); fetchState(); }, 500);
    } else if (d.alreadyExtended) {
      // Already extended — just log them in
      const url = new URL(location.href);
      url.searchParams.delete('extend');
      window.history.replaceState({}, '', url);
      checkAccess(); fetchState();
    }
  } catch(e) {
    console.error('[AUTO-EXTEND]', e);
  }
}

function showToastIfExists(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// ── Trial Expiry & Extension System ───────────────────────────────

function checkExpiryState() {
  const code    = localStorage.getItem('14t_access');
  const expRaw  = localStorage.getItem('14t_access_exp');
  const extended = localStorage.getItem('14t_extended') === 'true';
  const mathSeen = localStorage.getItem('14t_math_seen') === 'true';
  if (!code || !expRaw) return;

  const exp  = parseInt(expRaw);
  const now  = Date.now();
  const card = document.getElementById('expiry-card');
  if (!card) return;

  // Trial is a TRIAL code (not paid)
  const isTrial = code.startsWith('TRIAL-');
  if (!isTrial) return; // paid members never see expiry card

  if (now > exp) {
    // Expired
    card.style.display = 'flex';
    const scanEl = document.getElementById('scanning-block');
    if (scanEl) scanEl.style.display = 'none';

    if (extended) {
      // Already extended — check if 3 days are also done
      const extExp = parseInt(localStorage.getItem('14t_ext_exp') || '0');
      if (now > extExp) {
        // Extension also expired — show math card
        showMathCard();
      } else {
        // Extension still active — show countdown
        showExtendedCard(extExp);
      }
    } else {
      // First expiry — offer 3 days
      showExpiryOffer();
    }
  } else {
    // Not expired yet — check if expiring within 24h
    const hoursLeft = (exp - now) / (1000 * 60 * 60);
    if (hoursLeft <= 24 && !extended) {
      // Show warning banner but keep app active
      showExpiryWarning(Math.ceil(hoursLeft));
    }
  }
}

function showExpiryOffer() {
  const offer    = document.getElementById('expiry-offer');
  const extended = document.getElementById('expiry-extended');
  const math     = document.getElementById('expiry-math');
  if (offer)    offer.style.display    = 'block';
  if (extended) extended.style.display = 'none';
  if (math)     math.style.display     = 'none';
}

function showExtendedCard(extExp) {
  const offer    = document.getElementById('expiry-offer');
  const extended = document.getElementById('expiry-extended');
  const math     = document.getElementById('expiry-math');
  if (offer)    offer.style.display    = 'none';
  if (extended) extended.style.display = 'block';
  if (math)     math.style.display     = 'none';

  // Update days count and progress bar
  const daysLeft = Math.max(0, Math.ceil((extExp - Date.now()) / (1000*60*60*24)));
  const pct      = Math.min(100, (daysLeft / 3) * 100);
  const daysEl   = document.getElementById('ext-days-count');
  const barEl    = document.getElementById('ext-progress-bar');
  if (daysEl) daysEl.textContent = daysLeft;
  if (barEl)  barEl.style.width  = pct + '%';

  // Also unlock scanning block during extension
  const scanEl = document.getElementById('scanning-block');
  if (scanEl) scanEl.style.display = 'flex';
  const cardEl = document.getElementById('expiry-card');
  if (cardEl) cardEl.style.display = 'flex';
}

function showMathCard() {
  const offer    = document.getElementById('expiry-offer');
  const extended = document.getElementById('expiry-extended');
  const math     = document.getElementById('expiry-math');
  if (offer)    offer.style.display    = 'none';
  if (extended) extended.style.display = 'none';
  if (math)     math.style.display     = 'block';
  // Lock scanning block
  const scanEl = document.getElementById('scanning-block');
  if (scanEl) scanEl.style.display = 'none';
  localStorage.setItem('14t_math_seen', 'true');
}

function showExpiryWarning(hoursLeft) {
  // Show small banner — don't hide app
  const bc = document.getElementById('bc-card');
  const msg = document.getElementById('bc-card-msg');
  if (bc && msg && bc.style.display === 'none') {
    msg.textContent = `⏰ Ton accès expire dans ${hoursLeft}h — profites-en !`;
    bc.style.display = 'block';
  }
}

async function acceptExtension() {
  const code     = localStorage.getItem('14t_access');
  const deviceId = localStorage.getItem('14t_device_id') || 'unknown';
  if (!code) return;

  const btn = document.querySelector('[onclick="acceptExtension()"]');
  if (btn) { btn.textContent = 'Activation...'; btn.disabled = true; }

  try {
    const res = await fetch(SERVER + '/api/extend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, deviceId })
    });
    const d = await res.json();

    if (d.ok) {
      const extExp = d.expiresAt;
      localStorage.setItem('14t_extended',  'true');
      localStorage.setItem('14t_ext_exp',   extExp.toString());
      localStorage.setItem('14t_access_exp', extExp.toString());
      showExtendedCard(extExp);
    } else if (d.alreadyExtended) {
      // Already extended — just show the extended card
      const extExp = parseInt(localStorage.getItem('14t_ext_exp') || '0');
      showExtendedCard(extExp || Date.now() + 3*24*60*60*1000);
    } else {
      if (btn) { btn.textContent = '✅ Oui, je veux 3 jours gratuits'; btn.disabled = false; }
    }
  } catch(e) {
    if (btn) { btn.textContent = '✅ Oui, je veux 3 jours gratuits'; btn.disabled = false; }
  }
}

// ── Save OneSignal Player ID ───────────────────────────────────────
async function savePlayerIdToServer(code) {
  try {
    let playerId = null;
    // Try OneSignal SDK v2
    if (window.OneSignal && OneSignal.User) {
      playerId = await OneSignal.User.PushSubscription.id;
    }
    // Try OneSignal SDK v1
    if (!playerId && window.OneSignal) {
      playerId = await new Promise(res => OneSignal.getUserId(id => res(id)));
    }
    if (!playerId) return;
    localStorage.setItem('14t_player_id', playerId);
    // Send to server
    await fetch(SERVER + '/api/save-player-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code || localStorage.getItem('14t_access'), playerId })
    });
    console.log('[PUSH] Player ID saved:', playerId);
  } catch(e) {}
}

// ── Referral System ────────────────────────────────────────────────
async function loadReferralBanner() {
  try {
    const code = localStorage.getItem('14t_access');
    if (!code) return;

    const banner = document.getElementById('referral-banner');
    if (!banner) return;

    // Generate ref code from access code
    const cleaned = code.replace(/[^A-Z0-9]/gi,'').toUpperCase();
    const part = cleaned.substring(0,6) || Math.random().toString(36).substr(2,6).toUpperCase();
    const refCode = 'REF-' + part;
    localStorage.setItem('14t_ref_code', refCode);

    // Always show banner and code immediately
    banner.style.display = 'flex';
    const codeEl = document.getElementById('ref-code-display');
    if (codeEl) {
      codeEl.textContent = refCode;
      codeEl.style.color = '#FFD700';
    }

    // Load stats in background — don't block
    try {
      const res = await fetch(`${SERVER}/api/referral/stats?code=${refCode}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const d = await res.json();
        const count = d.conversions || 0;
        const pct   = Math.min(100, (count % 3) / 3 * 100);
        const fill  = document.getElementById('ref-progress-fill');
        const txt   = document.getElementById('ref-progress-txt');
        if (fill) fill.style.width = pct + '%';
        if (txt)  txt.textContent  = count % 3 === 0 && count > 0 ? '3/3 🎉' : (count % 3) + '/3';
        if (fill && count > 0 && count % 3 === 0) fill.style.background = '#30D158';
      }
    } catch(e) {} // stats fail silently — code still shows

  } catch(e) {}
}

function copyRefCode() {
  const code = getRefCode();
  if (!code) return;
  const link = `https://14trades-pwa.vercel.app/trial.html?ref=${code}`;
  navigator.clipboard.writeText(link).then(() => {
    const btn = document.querySelector('[onclick="copyRefCode()"]');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); }
  });
}

function getRefCode() {
  // Always try to get from access code first for consistency
  const access = localStorage.getItem('14t_access') || '';
  let refCode = localStorage.getItem('14t_ref_code');

  if (access) {
    const cleaned = access.replace(/[^A-Z0-9]/gi,'').toUpperCase();
    const part = cleaned.substring(0,6) || '';
    if (part) {
      refCode = 'REF-' + part;
      localStorage.setItem('14t_ref_code', refCode);
    }
  }

  if (!refCode) {
    refCode = localStorage.getItem('14t_ref_code') || '';
  }

  // Always update display
  const el = document.getElementById('ref-code-display');
  if (el && refCode) {
    el.textContent = refCode;
    el.style.color = '#FFD700';
  }

  return refCode || null;
}

function shareRefCode() {
  const code = getRefCode();
  if (!code) {
    // Try one more time after forcing regeneration
    const access = localStorage.getItem('14t_access') || '';
    if (!access) { return; }
    loadReferralBanner();
    setTimeout(shareRefCode, 500);
    return;
  }
  const link = `https://14trades-pwa.vercel.app/trial.html?ref=${code}`;
  const msg  = encodeURIComponent(`🔥 Je trade avec 14 Trades Alert — les signaux de Sadikh Sarr.

Essaie gratuitement 7 jours avec mon code : *${code}*

👉 ${link}`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}

// ── Performance Panel ──────────────────────────────────────────────
let perfFilter = 'all';
let perfLoaded = false;

function openPerf() {
  const panel = document.getElementById('perf-panel');
  if (panel) panel.classList.add('open');
  if (!perfLoaded) { loadPerfData(); perfLoaded = true; }
}

function closePerf() {
  const panel = document.getElementById('perf-panel');
  if (panel) panel.classList.remove('open');
}

function setPerfFilter(f, btn) {
  perfFilter = f;
  document.querySelectorAll('.pmb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPerf();
}

let perfSignals = [];

async function loadPerfData() {
  try {
    const r = await fetch(SERVER + '/api/state');
    const d = await r.json();
    perfSignals = (d.signals || []).filter(s => s.type && (s.type.includes('tp') || s.type.includes('sl')));
    renderPerf();
  } catch(e) {
    const el = document.getElementById('pp-sigs-list');
    if (el) el.innerHTML = '<div class="perf-loading">Could not load</div>';
  }
}

function renderPerf() {
  const now = Date.now();
  let sigs = perfSignals;
  if (perfFilter === 'month') sigs = sigs.filter(s => now - new Date(s.timestamp) < 30*864e5);
  if (perfFilter === 'week')  sigs = sigs.filter(s => now - new Date(s.timestamp) < 7*864e5);

  const wins   = sigs.filter(s => !s.type.includes('sl')).length;
  const losses = sigs.filter(s => s.type.includes('sl')).length;
  const total  = wins + losses;
  const wr     = total > 0 ? Math.round(wins/total*100) : 0;
  const pnl    = wins*150 - losses*100;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('pp-wr',     total > 0 ? wr+'%' : '--%');
  set('pp-pnl',    total > 0 ? (pnl>=0?'+':'') + '$'+Math.abs(pnl) : '--');
  set('pp-sigs',   total || '--');

  // Streak
  let best=0, cur=0;
  [...sigs].reverse().forEach(s => { if(!s.type.includes('sl')){cur++;best=Math.max(best,cur);}else cur=0; });
  set('pp-streak', best || '--');

  // Ring
  const arc = document.getElementById('pp-arc');
  if (arc) arc.setAttribute('stroke-dashoffset', total>0 ? 138-(138*wr/100) : 138);
  set('pp-wtxt', total>0 ? wr+'%' : '--%');

  const bw = document.getElementById('pp-bw');
  const bl = document.getElementById('pp-bl');
  if (bw) bw.style.width = total>0 ? wr+'%' : '0%';
  if (bl) bl.style.width = total>0 ? (100-wr)+'%' : '0%';
  set('pp-nw', wins); set('pp-nl', losses);

  // Assets
  const colors = {GOLD:'#FFD700',BTC:'#F0921A',SILVER:'#C0C0C0',NAS100:'#4A9EFF',US30:'#BF5AF2'};
  const assets = {};
  sigs.forEach(s => {
    const a = (s.asset||'GOLD').toUpperCase();
    if (!assets[a]) assets[a] = {w:0,l:0};
    s.type.includes('sl') ? assets[a].l++ : assets[a].w++;
  });
  const ae = document.getElementById('pp-assets');
  if (ae) {
    if (!Object.keys(assets).length) { ae.innerHTML = '<div class="perf-loading">No signals yet</div>'; }
    else ae.innerHTML = Object.entries(assets).map(([name,s]) => {
      const r = s.w+s.l>0 ? Math.round(s.w/(s.w+s.l)*100) : 0;
      const c = colors[name] || '#888';
      return `<div class="perf-brow"><div class="perf-bn" style="color:${c}">${name}</div><div class="perf-bt"><div class="perf-bf" style="width:${r}%;background:${c}"></div></div><div class="perf-bp" style="color:${c}">${r}%</div></div>`;
    }).join('');
  }

  // Signal list
  const se = document.getElementById('pp-sigs-list');
  if (se) {
    if (!sigs.length) { se.innerHTML = '<div class="perf-loading">No signals yet</div>'; return; }
    se.innerHTML = [...sigs].reverse().slice(0,20).map(s => {
      const isWin = !s.type.includes('sl');
      const ts = new Date(s.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric'});
      const lbl = isWin ? 'TP'+(s.level||'') + ' ✓' : 'SL Hit';
      return `<div class="perf-si">
        <div class="perf-sd" style="background:${isWin?'#30D158':'#FF453A'}"></div>
        <div style="flex:1"><div class="perf-sa">${(s.asset||'GOLD').toUpperCase()} · ${s.direction||''}</div><div class="perf-sm">${ts}</div></div>
        <div class="perf-sr ${isWin?'win':'loss'}">${lbl}</div>
      </div>`;
    }).join('');
  }
}

// ── Risk Calculator ────────────────────────────────────────────────
let riskCalcOpen = true;

function toggleRiskCalc() {
  riskCalcOpen = !riskCalcOpen;
  const body   = document.getElementById('rk-body');
  const toggle = document.querySelector('.rk-toggle');
  if (body)   body.style.display   = riskCalcOpen ? 'flex' : 'none';
  if (toggle) toggle.className = 'rk-toggle' + (riskCalcOpen ? ' open' : '');
}

function calcRisk() {
  const acct    = parseInt(document.getElementById('rk-acct')?.value || 1000);
  const riskPct = parseInt(document.getElementById('rk-risk')?.value || 1);
  const riskAmt = acct * riskPct / 100;
  const lot     = Math.max(0.01, parseFloat((riskAmt / 1000).toFixed(2)));
  const tp3     = (riskAmt * 3).toFixed(0);

  const acctEl = document.getElementById('rk-acct-val');
  const riskEl = document.getElementById('rk-risk-val');
  const lotEl  = document.getElementById('rk-lot');
  const lossEl = document.getElementById('rk-loss');
  const tp3El  = document.getElementById('rk-tp3');

  if (acctEl) acctEl.textContent = '$' + acct.toLocaleString();
  if (riskEl) riskEl.textContent = riskPct + '%';
  if (lotEl)  lotEl.textContent  = lot.toFixed(2);
  if (lossEl) lossEl.textContent = '-$' + riskAmt.toFixed(0);
  if (tp3El)  tp3El.textContent  = '+$' + tp3;
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
function startPolling() {
  fetchState();
  setInterval(fetchState, 3000);
}

async function fetchState() {
  try {
    const res = await fetch(SERVER + '/api/state?t=' + Date.now(), {
      cache: 'no-store'
    });
    if (!res.ok) return;
    const d = await res.json();
    lastState = d;
    applyState(d);
  } catch(e) {}
}

function applyState(d) {
  // Check maintenance mode first
  const mainEl   = document.getElementById('maintenance-screen');
  const phoneEl  = document.getElementById('main-app');
  const isAdmin  = localStorage.getItem('14t_admin_preview') === 'sadikh';
  const urlParam = new URLSearchParams(window.location.search).get('preview');
  if (urlParam === 'sadikh') localStorage.setItem('14t_admin_preview','sadikh');
  const canPreview = isAdmin || urlParam === 'sadikh';

  if (d.maintenance && !canPreview) {
    if (mainEl)  mainEl.style.display  = 'flex';
    if (phoneEl) phoneEl.style.display = 'none';
    return;
  } else {
    if (mainEl)  mainEl.style.display  = 'none';
    if (phoneEl) phoneEl.style.display = 'flex';
  }

  // ── PREP SIGNAL — show countdown via polling ───────────────────
  const prepSignal = d.prepSignal;
  if (prepSignal && prepSignal.id) {
    const cdEl = document.getElementById('signal-countdown');
    const cdVisible = cdEl && cdEl.style.display !== 'none';
    if (prepSignal.id !== lastPrepId || !cdVisible) {
      lastPrepId = prepSignal.id;
      const liveEl = document.getElementById('live-trade');
      const scanEl = document.getElementById('scanning-block');
      if (liveEl) liveEl.style.display = 'none';
      if (scanEl) scanEl.style.display = 'none';
      showSignalCountdown(prepSignal);
    }
  } else if (!prepSignal) {
    // No prep signal on server — dismiss countdown if showing
    const cdEl = document.getElementById('signal-countdown');
    if (cdEl && cdEl.style.display !== 'none') {
      dismissCountdown();
    }
  }

  const signals     = d.signals || [];
  const broadcast   = d.broadcast;

  // ── Broadcast card — ALWAYS show regardless of trade ─────────────
  const bcCard  = document.getElementById('bc-card');
  const bcMsg   = document.getElementById('bc-card-msg');
  if (broadcast && broadcast.message) {
    const saved = JSON.parse(localStorage.getItem('14t_broadcast') || '{}');
    if (bcCard && bcMsg) {
      bcMsg.textContent = broadcast.message;
      if (saved.msg !== broadcast.message) {
        localStorage.setItem('14t_broadcast', JSON.stringify({msg:broadcast.message,ts:broadcast.ts||Date.now(),dismissed:false}));
        bcCard.style.display = 'block';
      } else if (!saved.dismissed) {
        bcCard.style.display = 'block';
      }
    }
  }

  // ── Multiple trades ───────────────────────────────────────────────
  const trades     = d.activeTrades || (d.activeTrade ? [d.activeTrade] : []);
  const openTrades = trades.filter(t => t.status === 'open' || t.status === 'confirmed');
  const liveEl     = document.getElementById('live-trade');
  const scanEl     = document.getElementById('scanning-block');
  const perfBtn    = document.getElementById('trade-perf-btn');

  if (openTrades.length > 0) {
    dismissCountdown();
    if (liveEl) liveEl.style.display = 'flex';
    if (scanEl) scanEl.style.display = 'none';
    if (perfBtn) perfBtn.style.display = 'block';
    renderAllTrades(openTrades);
  } else {
    if (liveEl) liveEl.style.display = 'none';
    if (scanEl) scanEl.style.display = 'flex';
    if (perfBtn) perfBtn.style.display = 'none';
    updateLiveTrade(null);
  }

  // ── History + mood ───────────────────────────────────────────────
  renderHistory(signals);
  updateMoodFromSignals(signals);
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
  const liveEl = document.getElementById('live-trade');
  const scanEl = document.getElementById('scanning-block');

  if (!trade) {
    if (liveEl) liveEl.style.display = 'none';
    if (scanEl) scanEl.style.display = 'flex';
    return;
  }

  if (liveEl) liveEl.style.display = 'flex';
  if (scanEl) scanEl.style.display = 'none';

  const isBuy  = (trade.direction || '').toUpperCase() === 'BUY';
  const color  = isBuy ? '#30D158' : '#FF453A';
  const asset  = (trade.asset || 'GOLD').toUpperCase();
  const pairs  = {GOLD:'XAU / USD',SILVER:'XAG / USD',BTC:'BTC / USD',NAS100:'NAS 100',US30:'DOW JONES'};
  const pair   = pairs[asset] || asset;
  const icoMap = {GOLD:'XAU',SILVER:'XAG',BTC:'BTC',NAS100:'NAS',US30:'US30'};

  // Style the card
  const card = document.getElementById('sig-card');
  if (card) { card.className = 'sig-card ' + (isBuy ? 'buy' : 'sell'); }

  // Icon
  const ico = document.getElementById('lt-ico');
  if (ico) { ico.textContent = icoMap[asset] || asset; ico.className = 'lt-ico ' + (isBuy ? 'buy' : 'sell'); }

  // Asset + pair
  const a = document.getElementById('lt-asset');
  const p = document.getElementById('lt-pair');
  if (a) a.textContent = asset;
  if (p) p.textContent = pair;

  // Live badge color
  const dot = document.getElementById('lt-live-dot');
  const txt = document.getElementById('lt-live-txt');
  if (dot) dot.style.background = color;
  if (txt) { txt.textContent = 'RUNNING'; txt.style.color = color; }

  // Direction + arrow
  const dir = document.getElementById('lt-direction');
  const arr = document.getElementById('lt-dir-arrow');
  if (dir) { dir.textContent = trade.direction || ''; dir.style.color = color; }
  if (arr) { arr.textContent = isBuy ? '↑' : '↓'; arr.style.color = color; }

  // SL
  const sl = document.getElementById('lt-sl');
  if (sl) sl.textContent = trade.sl || '--';

  // TPs
  [1,2,3].forEach(n => {
    const row = document.getElementById('lt-tp' + n);
    const s   = document.getElementById('lt-tp' + n + '-s');
    if (trade['tp' + n + '_hit']) {
      if (row) { row.className = 'lt-tp ' + (isBuy ? 'hit' : 'sell-hit'); }
      if (s)   s.textContent = '✓ Hit';
    } else {
      if (row) row.className = 'lt-tp';
      if (s)   s.textContent = trade.status === 'confirmed' ? 'Pending...' : 'Waiting...';
    }
  });

  // Share button
  checkShowShareBtn(trade);

  // BE
  const be = document.getElementById('lt-be-banner');
  if (be) { be.style.display = trade.be_hit ? 'flex' : 'none'; }
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
function startNextWindowCountdown() { /* disabled — never show trading windows to members */ }

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
    // Disabled — never show window countdown
    card.style.display='none';
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
  const text = '🔥 I trade Gold & BTC signals with 14 Trades Alert — real-time push notifications, live countdown, win rate tracking. Join here: https://app.14trade.com';
  if (navigator.share) {
    navigator.share({ title: '14 Trades Alert', text, url: 'https://app.14trade.com' });
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
