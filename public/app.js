// 14 Trades Alert — PWA App JS
// Registers SW, subscribes to push, polls server for live state

const SERVER = 'https://your-server.up.railway.app'; // ← your Railway URL
const VAPID_PUBLIC = 'YOUR_VAPID_PUBLIC_KEY';         // ← generated below

// ─── Boot ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await registerSW();
  checkInstallPrompt();
  restoreToken();
  startPolling();
  startCountdown();
});

// ─── Service Worker registration ─────────────────────────────────
async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    console.log('[SW] Registered');
    window._swReg = reg;
  } catch (err) {
    console.error('[SW] Failed:', err);
  }
}

// ─── Push subscription ────────────────────────────────────────────
async function requestPush() {
  if (!('Notification' in window)) {
    showToast('Push not supported on this browser', 'info');
    return;
  }

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') {
    showToast('Enable notifications in Settings', 'info');
    return;
  }

  try {
    const reg  = window._swReg || await navigator.serviceWorker.ready;
    const sub  = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });

    // Send subscription to server
    const token = localStorage.getItem('token');
    await fetch(`${SERVER}/push/subscribe`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(sub),
    });

    localStorage.setItem('push_subscribed', '1');
    document.getElementById('notif-btn').classList.add('active');
    showToast('Push notifications enabled ✓', 'buy');
  } catch (err) {
    console.error('[PUSH]', err);
    showToast('Could not enable push', 'info');
  }
}

function restoreToken() {
  const sub = localStorage.getItem('push_subscribed');
  if (sub) document.getElementById('notif-btn').classList.add('active');
}

// ─── Poll server every 5 seconds ─────────────────────────────────
let lastState = null;

function startPolling() {
  fetchState();
  setInterval(fetchState, 5000);
}

async function fetchState() {
  try {
    const token = localStorage.getItem('token');
    const res   = await fetch(`${SERVER}/api/state`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const data = await res.json();
    applyState(data);
    lastState = data;
  } catch {}
}

// ─── Apply server state to UI ─────────────────────────────────────
function applyState({ activeTrade, signals }) {
  updateLiveTrade(activeTrade);
  renderHistory(signals || []);
}

// ─── Live trade card ──────────────────────────────────────────────
let pnlInterval = null;
let pnlValue    = 0;

function updateLiveTrade(trade) {
  const liveBlock = document.getElementById('live-block');
  const noTrade   = document.getElementById('no-trade');

  if (!trade) {
    liveBlock.style.display = 'none';
    noTrade.style.display   = 'flex';
    clearInterval(pnlInterval);
    return;
  }

  liveBlock.style.display = 'flex';
  noTrade.style.display   = 'none';

  const isBuy = trade.direction === 'BUY';
  document.getElementById('live-asset').textContent = trade.asset;
  document.getElementById('live-dir').textContent   = trade.direction;
  document.getElementById('live-dir').style.color   = isBuy ? 'var(--green)' : 'var(--red)';

  document.getElementById('sl-price').textContent   = formatPrice(trade.sl);
  document.getElementById('tp1-price').textContent  = formatPrice(trade.tp1);
  document.getElementById('tp2-price').textContent  = formatPrice(trade.tp2);
  document.getElementById('tp3-price').textContent  = formatPrice(trade.tp3);

  // TP hits
  if (trade.tp1_hit) markTPHit(1);
  if (trade.tp2_hit) markTPHit(2);
  if (trade.tp3_hit) markTPHit(3);

  // SL hit
  if (trade.sl_hit) markSLHit();

  // Tick PnL if trade open
  if (trade.status === 'open' && !pnlInterval) {
    pnlValue = 0;
    pnlInterval = setInterval(() => {
      pnlValue += Math.floor(Math.random() * 6);
      document.getElementById('pnl-val').textContent = '+$' + pnlValue;
    }, 2000);
  }
}

const tpPos = { 1: '55%', 2: '75%', 3: '93%' };

function markTPHit(n) {
  const row = document.getElementById('tp' + n);
  if (!row || row.classList.contains('hit')) return;
  row.classList.add('hit');
  document.getElementById('prog-fill').style.width  = tpPos[n];
  document.getElementById('prog-cursor').style.left = tpPos[n];
}

function markSLHit() {
  const slRow     = document.getElementById('sl-row');
  const liveBlock = document.getElementById('live-block');
  if (!slRow || slRow.classList.contains('hit')) return;
  slRow.classList.add('hit');
  liveBlock.classList.add('sl-hit');
  document.getElementById('prog-fill').style.width  = '6%';
  document.getElementById('prog-cursor').style.left = '6%';
  [1, 2, 3].forEach(n => {
    const r = document.getElementById('tp' + n);
    if (r && !r.classList.contains('hit')) r.classList.add('dimmed');
  });
  clearInterval(pnlInterval);
  pnlInterval = null;
  const loss = Math.floor(Math.random() * 60 + 20);
  document.getElementById('pnl-val').textContent = '-$' + loss;
  document.getElementById('pnl-val').style.color = 'var(--red)';
  document.getElementById('pnl-lbl').textContent = 'closed';
}

// ─── History feed ─────────────────────────────────────────────────
const ASSET_META = {
  GOLD:   { ico: 'XAU', bg: '#C9A84C15', color: '#C9A84C', border: '#C9A84C20' },
  NASDAQ: { ico: 'NQ',  bg: '#5B8DEF15', color: '#5B8DEF', border: '#5B8DEF20' },
  BTC:    { ico: 'BTC', bg: '#F0921A15', color: '#F0921A', border: '#F0921A20' },
};

function renderHistory(signals) {
  const feed = document.getElementById('hist-feed');
  const items = signals.filter(s => s.type !== 'prep').slice(0, 10);
  if (!items.length) { feed.innerHTML = '<div style="font-size:11px;color:var(--muted);padding:8px 2px">No history yet</div>'; return; }

  feed.innerHTML = items.map(sig => {
    const m = ASSET_META[sig.asset] || { ico: sig.asset, bg: '#1A1A1A', color: '#888', border: '#222' };
    let outcome = '';
    if (sig.type === 'tp_hit') outcome = `<div class="outcome tp">TP${sig.level} HIT</div>`;
    else if (sig.type === 'sl_hit') outcome = `<div class="outcome sl">SL HIT</div>`;
    else if (sig.type === 'signal' && sig.status === 'open') outcome = `<div class="outcome open">OPEN</div>`;

    return `
      <div class="hist-item">
        <div class="hi-left">
          <div class="hi-ico" style="background:${m.bg};color:${m.color};border:1px solid ${m.border}">${m.ico}</div>
          <div>
            <div class="hi-asset">${sig.asset}</div>
            <div class="hi-sub">${formatAgo(sig.timestamp)}</div>
          </div>
        </div>
        <div class="hi-right">
          ${sig.direction ? `<div class="hi-dir ${sig.direction?.toLowerCase()}">${sig.direction}</div>` : ''}
          ${outcome}
        </div>
      </div>`;
  }).join('');
}

// ─── Countdown — driven by server prep event ──────────────────────
let cdInterval  = null;
let cdSecs      = 0;
let cdDirection = null;

function startCountdown() {
  // Listen for prep events via polling
  setInterval(() => {
    if (!lastState?.signals) return;
    const prep = lastState.signals.find(s => s.type === 'prep');
    if (!prep) return;

    const age = (Date.now() - new Date(prep.timestamp)) / 1000;
    if (age > 300) return; // ignore prep older than 5 min

    const remaining = Math.max(0, 300 - Math.floor(age));
    if (remaining > 0 && cdSecs === 0) {
      setCountdown(remaining, prep.direction);
    }
  }, 2000);
}

function setCountdown(secs, direction) {
  cdSecs      = secs;
  cdDirection = direction;
  clearInterval(cdInterval);

  const cdEl   = document.getElementById('countdown');
  const pill   = document.getElementById('dir-pill');
  const dtxt   = document.getElementById('dir-text');
  const sub    = document.getElementById('prep-sub');

  const dir = direction || 'BUY';
  pill.className = 'dir-pill ' + dir.toLowerCase();
  dtxt.textContent = dir;
  cdEl.className = 'countdown ' + dir.toLowerCase();
  sub.textContent = dir === 'BUY' ? 'Prepare to buy' : 'Prepare to sell';

  cdInterval = setInterval(() => {
    if (cdSecs <= 0) { clearInterval(cdInterval); cdSecs = 0; return; }
    cdSecs--;
    const m  = String(Math.floor(cdSecs / 60)).padStart(2, '0');
    const s  = String(cdSecs % 60).padStart(2, '0');
    cdEl.textContent = m + ':' + s;
    if (cdSecs < 60) cdEl.classList.add('urgent');
  }, 1000);
}

// ─── Install prompt (Android Chrome) ─────────────────────────────
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('install-banner').style.display = 'flex';
});

function dismissInstall() {
  document.getElementById('install-banner').style.display = 'none';
}

// ─── Toast helper ─────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── Helpers ──────────────────────────────────────────────────────
function formatPrice(p) {
  if (!p) return '—';
  return parseFloat(p).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)    return 'just now';
  if (diff < 60)   return diff + ' min ago';
  if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
  return new Date(iso).toLocaleDateString();
}

function urlBase64ToUint8Array(base64) {
  const pad = '='.repeat((4 - base64.length % 4) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
