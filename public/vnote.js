/* Vidéo ronde de Sadikh (60 s max) — carte « À LA UNE » dans la Communauté et dans la Live Room.
   Aucune lecture automatique : la vidéo ne se charge qu'au toucher (économie de data). Le poster seul est affiché. */
(function () {
  'use strict';
  var SRV = 'https://14trades-server-production.up.railway.app';
  var CSS = '' +
    '.vn-card{margin:0 0 12px;border:1px solid #C9A84C66;border-radius:18px;padding:14px;background:linear-gradient(160deg,#17130a,#0c0c0c 75%);color:#eee;font-family:inherit}' +
    '.vn-k{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10px;font-weight:800;letter-spacing:.14em;color:#C9A84C}' +
    '.vn-k b{background:#C9A84C22;border-radius:8px;padding:1px 7px;font-size:9px;letter-spacing:.08em}' +
    '.vn-row{display:flex;gap:14px;align-items:center;margin-top:12px}' +
    '.vn-rd{position:relative;width:132px;height:132px;flex-shrink:0;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.vn-rd svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);pointer-events:none}' +
    '.vn-face{position:absolute;inset:6px;border-radius:50%;overflow:hidden;background:#1b1a18 center/cover no-repeat}' +
    '.vn-face video{width:100%;height:100%;object-fit:cover;display:block}' +
    '.vn-pl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:30px;color:#fff;text-shadow:0 2px 10px #000;pointer-events:none}' +
    '.vn-du{position:absolute;left:8px;bottom:6px;background:#000a;border-radius:10px;padding:1px 7px;font-size:11px;font-weight:700;pointer-events:none}' +
    '.vn-mu{position:absolute;right:6px;bottom:6px;background:#000a;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px;pointer-events:none}' +
    '.vn-t{font-size:15px;font-weight:700;line-height:1.3}.vn-m{font-size:11px;color:#8a8578;margin-top:4px}' +
    '#tab-community[data-v="opp"] #cm-vn,#tab-community[data-v="ana"] #cm-vn{display:none !important}' +
    '#room[data-tab=signal] #room-vn{display:none !important}#room-vn{padding:0 12px}#room-vn:empty{display:none}';
  var styled = false;
  function css() { if (styled) return; styled = true; var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ago(iso) {
    var m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    return m < 1 ? "à l'instant" : m < 60 ? 'il y a ' + m + ' min' : m < 1440 ? 'il y a ' + Math.round(m / 60) + ' h' : 'il y a ' + Math.round(m / 1440) + ' j';
  }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  var vidKey = '14t_vn_vid';
  function track(ev) {
    try {
      if (typeof window.track === 'function') { window.track(ev); return; }
      var v = null; try { v = localStorage.getItem(vidKey); if (!v) { v = 'vn' + Math.random().toString(36).slice(2, 12); localStorage.setItem(vidKey, v); } } catch (e) {}
      if (!v) v = 'vn' + Math.random().toString(36).slice(2, 12);
      fetch(SRV + '/api/ev', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vid: v, event: ev, src: 'room' }), keepalive: true }).catch(function () {});
    } catch (e) {}
  }
  function build(vn, scope) {
    var fresh = Date.now() - new Date(vn.at).getTime() < 24 * 3600 * 1000, R = 62, C = 2 * Math.PI * R;
    var el = document.createElement('div'); el.className = 'vn-card'; el.setAttribute('data-vn', vn.id);
    el.innerHTML = '<div class="vn-k"><span>📌 À LA UNE · VIDÉO DE SADIKH' + (scope === 'room' ? ' · LIVE ROOM' : '') + '</span>' + (fresh ? '<b>NOUVEAU</b>' : '') + '</div>' +
      '<div class="vn-row"><div class="vn-rd" role="button" aria-label="Regarder la vidéo">' +
      '<svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="' + R + '" fill="none" stroke="#2a2a2a" stroke-width="3"/><circle class="vn-ring" cx="66" cy="66" r="' + R + '" fill="none" stroke="#C9A84C" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '"/></svg>' +
      '<div class="vn-face" style="background-image:url(\'' + esc(vn.poster) + '\')"></div><div class="vn-pl">▶</div><div class="vn-du">' + mmss(vn.duration) + '</div><div class="vn-mu">🔇</div></div>' +
      '<div><div class="vn-t">' + esc(vn.title || 'Message de Sadikh') + '</div><div class="vn-m">' + ago(vn.at) + ' · touche le rond pour regarder</div></div></div>';
    var rd = el.querySelector('.vn-rd'), face = el.querySelector('.vn-face'), pl = el.querySelector('.vn-pl'), du = el.querySelector('.vn-du'), mu = el.querySelector('.vn-mu'), ring = el.querySelector('.vn-ring'), meta = el.querySelector('.vn-m');
    var video = null, started = false;
    function setMute() { if (video) mu.textContent = video.muted ? '🔇' : '🔊'; }
    function start() {
      if (video) { try { video.currentTime = 0; video.muted = true; setMute(); video.play(); } catch (e) {} pl.textContent = ''; return; }
      video = document.createElement('video'); video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', ''); video.muted = true; video.preload = 'auto'; video.src = vn.src;
      video.addEventListener('timeupdate', function () { var d = video.duration || vn.duration || 1, f = Math.min(1, video.currentTime / d); ring.setAttribute('stroke-dashoffset', (C * (1 - f)).toFixed(1)); du.textContent = mmss(d - video.currentTime); });
      video.addEventListener('ended', function () { ring.setAttribute('stroke-dashoffset', '0'); pl.textContent = '↻'; du.textContent = mmss(vn.duration); mu.textContent = '🔇'; track('vn_end_' + scope); });
      video.addEventListener('error', function () { pl.textContent = '▶'; meta.textContent = 'Vidéo indisponible pour le moment. Réessaie plus tard.'; video = null; started = false; });
      face.innerHTML = ''; face.appendChild(video); pl.textContent = ''; setMute();
      var p = video.play(); if (p && p.catch) p.catch(function () { pl.textContent = '▶'; });
      if (!started) { started = true; track('vn_play_' + scope); }
    }
    rd.addEventListener('click', function () {
      if (!video || video.ended) { start(); return; }
      video.muted = !video.muted; setMute();   // 2e toucher : le son
      if (video.paused) { try { video.play(); } catch (e) {} }
    });
    return el;
  }
  // mount(id, { scope: 'comm' | 'room', server, code: fn })
  function mount(id, opt) {
    opt = opt || {}; var box = document.getElementById(id); if (!box) return; css();
    var scope = opt.scope === 'room' ? 'room' : 'comm', srv = opt.server || SRV;
    function load() {
      var code = typeof opt.code === 'function' ? opt.code() : '';
      if (scope === 'room' && !code) return;
      fetch(srv + '/api/vnote/latest?scope=' + scope + '&code=' + encodeURIComponent(code || '') + '&t=' + Date.now(), { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d || !d.ok) return;
          var cur = box.firstChild && box.firstChild.getAttribute && box.firstChild.getAttribute('data-vn');
          if (!d.vn) { if (cur) box.innerHTML = ''; return; }
          if (cur === String(d.vn.id)) return;           // déjà affichée : on ne coupe pas une lecture en cours
          box.innerHTML = ''; box.appendChild(build(d.vn, scope));
        }).catch(function () {});
    }
    load(); setInterval(load, 120000);
  }
  window.VN = { mount: mount };
  document.addEventListener('DOMContentLoaded', function () { if (document.getElementById('cm-vn')) mount('cm-vn', { scope: 'comm' }); });
})();
