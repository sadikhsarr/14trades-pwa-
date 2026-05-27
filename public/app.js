// 14 Trades Alert — PWA App JS
// Live countdown, streak counter, market mood, FOMO card

const SERVER = 'https://14trades-server-production.up.railway.app';
const VAPID_PUBLIC = 'YOUR_VAPID_PUBLIC_KEY';

const WINDOWS = [
  { time: '19:10', prep: '19:05', name: 'NY Close',  asset: 'GOLD' },
  { time: '00:10', prep: '00:05', name: 'Asia Open', asset: 'GOLD' },
  { time: '07:10', prep: '07:05', name: 'London',    asset: 'GOLD' },
  { time: '12:10', prep: '12:05', name: 'NY Midday', asset: 'GOLD' },
];

const ASSET_META = {
  GOLD:   { ico: 'XAU', bg: '#C9A84C15', color: '#C9A84C', border: '#C9A84C20' },
  NASDAQ: { ico: 'NQ',  bg: '#5B8DEF15', color: '#5B8DEF', border: '#5B8DEF20' },
  BTC:    { ico: 'BTC', bg: '#F0921A15', color: '#F0921A', border: '#F0921A20' },
};

let lastState = null;
let streak = parseInt(localStorage.getItem('streak') || '0');
let pnlInterval = null;
let pnlValue = 0;

document.addEventListener('DOMContentLoaded', async () => {
  await registerSW();
  checkInstallPrompt();
  restorePushState();
  startPolling();
  startNextWindowCountdown();
  startMarketMood();
  updateStreak(streak);
});

async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try { const reg = await navigator.serviceWorker.register('/sw.js'); window._swReg = reg; } catch (err) {}
}

async function requestPush() {
  if (!('Notification' in window)) { showToast('Push not supported', 'info'); return; }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') { showToast('Enable notifications in Settings', 'info'); return; }
  try {
    const reg = window._swReg || await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) });
    const token = localStorage.getItem('token');
    await fetch(`${SERVER}/push/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(sub) });
    localStorage.setItem('push_subscribed', '1');
    document.getElementById('notif-btn').classList.add('active');
    showToast('Push notifications enabled ✓', 'buy');
  } catch (err) { showToast('Could not enable push', 'info'); }
}

function restorePushState() {
  if (localStorage.getItem('push_subscribed')) document.getElementById('notif-btn').classList.add('active');
}

function startPolling() { fetchState(); setInterval(fetchState, 5000); }

async function fetchState() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${SERVER}/api/state`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) return;
    const data = await res.json();
    applyState(data); lastState = data;
  } catch {}
}

function applyState({ activeTrade, signals }) {
  updateLiveTrade(activeTrade);
  renderHistory(signals || []);
  checkFOMO(signals || []);
}

const tpPos = { 1: '55%', 2: '75%', 3: '93%' };

function updateLiveTrade(trade) {
  const liveBlock = document.getElementById('live-block');
  const noTrade   = document.getElementById('no-trade');
  const fomoCard  = document.getElementById('fomo-card');
  if (!trade) {
    liveBlock.style.display = 'none';
    noTrade.style.display = 'flex';
    clearInterval(pnlInterval); pnlInterval = null;
    return;
  }
  liveBlock.style.display = 'flex';
  noTrade.style.display = 'none';
  fomoCard.style.display = 'none';
  const isBuy = trade.direction === 'BUY';
  document.getElementById('live-asset').textContent = trade.asset || 'GOLD';
  document.getElementById('live-dir').textContent = trade.direction;
  document.getElementById('live-dir').style.color = isBuy ? 'var(--green)' : 'var(--red)';
  document.getElementById('sl-price').textContent  = formatPrice(trade.sl);
  document.getElementById('tp1-price').textContent = formatPrice(trade.tp1);
  document.getElementById('tp2-price').textContent = formatPrice(trade.tp2);
  document.getElementById('tp3-price').textContent = formatPrice(trade.tp3);
  if (trade.tp1_hit) markTPHit(1);
  if (trade.tp2_hit) markTPHit(2);
  if (trade.tp3_hit) markTPHit(3);
  if (trade.sl_hit)  markSLHit();
  if (trade.status === 'open' && !pnlInterval) {
    pnlValue = 0;
    pnlInterval = setInterval(() => { pnlValue += Math.floor(Math.random() * 6); document.getElementById('pnl-val').textContent = '+$' + pnlValue; }, 2000);
  }
}

function markTPHit(n) {
  const row = document.getElementById('tp' + n);
  if (!row || row.classList.contains('hit')) return;
  row.classList.add('hit');
  document.getElementById('prog-fill').style.width  = tpPos[n];
  document.getElementById('prog-cursor').style.left = tpPos[n];
  streak++;
  localStorage.setItem('streak', streak);
  updateStreak(streak);
}

function markSLHit() {
  const slRow = document.getElementById('sl-row');
  const liveBlock = document.getElementById('live-block');
  if (!slRow || slRow.classList.contains('hit')) return;
  slRow.classList.add('hit');
  liveBlock.classList.add('sl-hit');
  document.getElementById('prog-fill').style.width  = '6%';
  document.getElementById('prog-cursor').style.left = '6%';
  [1,2,3].forEach(n => { const r = document.getElementById('tp'+n); if (r && !r.classList.contains('hit')) r.classList.add('dimmed'); });
  clearInterval(pnlInterval); pnlInterval = null;
  const loss = Math.floor(Math.random() * 60 + 20);
  document.getElementById('pnl-val').textContent = '-$' + loss;
  document.getElementById('pnl-val').style.color = 'var(--red)';
  document.getElementById('pnl-lbl').textContent = 'closed';
  streak = 0; localStorage.setItem('streak', 0); updateStreak(0);
}

function updateStreak(n) {
  const box = document.getElementById('streak-box');
  const num = document.getElementById('streak-num');
  num.textContent = n >= 3 ? n + ' 🔥' : n;
  n >= 3 ? box.classList.add('hot') : box.classList.remove('hot');
}

function startNextWindowCountdown() { updateNextWindow(); setInterval(updateNextWindow, 1000); }

function updateNextWindow() {
  const ny = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit' });
  const [nH, nM] = ny.split(':').map(Number);
  const nowSecs = nH * 3600 + nM * 60 + new Date().getSeconds();
  let best = null, bestDiff = Infinity;
  WINDOWS.forEach(w => {
    const [wH, wM] = w.time.split(':').map(Number);
    let diff = (wH * 3600 + wM * 60) - nowSecs;
    if (diff <= 0) diff += 86400;
    if (diff < bestDiff) { bestDiff = diff; best = { ...w, secsUntil: diff }; }
  });
  if (!best) return;
  const h = Math.floor(best.secsUntil / 3600);
  const m = Math.floor((best.secsUntil % 3600) / 60);
  const s = best.secsUntil % 60;
  const pad = n => String(n).padStart(2, '0');
  document.getElementById('nw-countdown').textContent = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  document.getElementById('nw-window').textContent = 'Signal incoming';
  document.getElementById('nw-asset').textContent = best.asset;
  document.getElementById('nt-sub').textContent = 'Stand by';
  document.getElementById('fomo-next').textContent = 'Next signal coming soon';
  document.getElementById('nw-countdown').style.color = best.secsUntil < 300 ? 'var(--yellow)' : 'var(--white)';
}

function startMarketMood() { updateMood(); setInterval(updateMood, 60000); }

function updateMood() {
  const nyHour = parseInt(new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit' }));
  let session, sessionClass;
  if (nyHour >= 8 && nyHour < 12)       { session = 'NY Open';   sessionClass = 'bull'; }
  else if (nyHour >= 12 && nyHour < 14) { session = 'NY Prime';  sessionClass = 'volatile'; }
  else if (nyHour >= 14 && nyHour < 17) { session = 'NY Close';  sessionClass = 'bull'; }
  else if (nyHour >= 2 && nyHour < 8)   { session = 'London';    sessionClass = 'bull'; }
  else if (nyHour >= 19 || nyHour < 2)  { session = 'Asia';      sessionClass = 'neutral'; }
  else                                   { session = 'Off Hours'; sessionClass = 'neutral'; }
  const signals = lastState?.signals || [];
  const lastGold = signals.find(s => s.asset === 'GOLD' && s.type === 'signal');
  const lastBtc  = signals.find(s => s.asset === 'BTC'  && s.type === 'signal');
  const goldMood = lastGold ? (lastGold.direction === 'BUY' ? { tag: 'Bullish', cls: 'bull' } : { tag: 'Bearish', cls: 'bear' }) : { tag: 'Watching', cls: 'neutral' };
  const btcMood  = lastBtc  ? (lastBtc.direction  === 'BUY' ? { tag: 'Bullish', cls: 'bull' } : { tag: 'Bearish', cls: 'bear' }) : { tag: 'Watching', cls: 'neutral' };
  setMoodTag('mood-gold-tag', goldMood.tag, goldMood.cls);
  setMoodTag('mood-btc-tag',  btcMood.tag,  btcMood.cls);
  setMoodTag('mood-session-tag', session, sessionClass);
}

function setMoodTag(id, text, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'mood-tag ' + cls;
}

function checkFOMO(signals) {
  const noTrade   = document.getElementById('no-trade');
  const fomoCard  = document.getElementById('fomo-card');
  const liveBlock = document.getElementById('live-block');
  if (liveBlock.style.display !== 'none') return;
  const closed = signals.find(s => (s.type === 'tp_hit' || s.type === 'sl_hit') && (Date.now() - new Date(s.timestamp)) < 3600000);
  if (closed) {
    noTrade.style.display  = 'none';
    fomoCard.style.display = 'flex';
    const isTP = closed.type === 'tp_hit';
    document.getElementById('fomo-title').textContent = isTP ? `TP${closed.level} Hit — ${closed.asset} ${closed.direction}` : `SL Hit — ${closed.asset} ${closed.direction}`;
    document.getElementById('fomo-desc').textContent  = isTP ? `${closed.asset} hit Take Profit ${closed.level}. Don't miss the next one.` : `Trade closed at Stop Loss. Stay ready for the next setup.`;
  } else {
    fomoCard.style.display = 'none';
    noTrade.style.display  = 'flex';
  }
}

function renderHistory(signals) {
  const feed = document.getElementById('hist-feed');
  const items = signals.filter(s => s.type !== 'prep').slice(0, 10);
  if (!items.length) { feed.innerHTML = '<div style="font-size:11px;color:var(--muted);padding:8px 2px">No history yet</div>'; return; }
  feed.innerHTML = items.map(sig => {
    const m = ASSET_META[sig.asset] || { ico: sig.asset, bg: '#1A1A1A', color: '#888', border: '#222' };
    let outcome = '';
    if (sig.type === 'tp_hit') outcome = `<div class="outcome tp">TP${sig.level} HIT</div>`;
    else if (sig.type === 'sl_hit') outcome = `<div class="outcome sl">SL HIT</div>`;
    else if (sig.type === 'signal') outcome = `<div class="outcome open">OPEN</div>`;
    return `<div class="hist-item"><div class="hi-left"><div class="hi-ico" style="background:${m.bg};color:${m.color};border:1px solid ${m.border}">${m.ico}</div><div><div class="hi-asset">${sig.asset||'GOLD'}</div><div class="hi-sub">${formatAgo(sig.timestamp)}</div></div></div><div class="hi-right">${sig.direction?`<div class="hi-dir ${(sig.direction||'').toLowerCase()}">${sig.direction}</div>`:''}${outcome}</div></div>`;
  }).join('');
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; document.getElementById('install-banner').style.display = 'flex'; });
function dismissInstall() { document.getElementById('install-banner').style.display = 'none'; }

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function formatPrice(p) { if (!p) return '—'; return parseFloat(p).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function formatAgo(iso) { const diff = Math.floor((Date.now() - new Date(iso)) / 60000); if (diff < 1) return 'just now'; if (diff < 60) return diff + ' min ago'; if (diff < 1440) return Math.floor(diff / 60) + 'h ago'; return new Date(iso).toLocaleDateString(); }
function urlBase64ToUint8Array(base64) { const pad = '='.repeat((4 - base64.length % 4) % 4); const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...raw].map(c => c.charCodeAt(0))); }
