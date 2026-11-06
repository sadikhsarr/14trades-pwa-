/* phone.js: one shared way to ask for a WhatsApp number, used by every signup form.

   Country data comes from Google's libphonenumber (python-phonenumbers 9.0.40,
   generated 2026-10-04). Do not edit the table by hand: regenerate it.
   It checks that a number is PLAUSIBLE for the chosen country (right length,
   trunk "0" removed, country code not doubled). It cannot know whether the
   number really exists or has WhatsApp.

   Result of normalize(): a full international number such as +221771234567,
   which is what wa.me links need. */
(function (global) {
  // [ISO country, dial code, trunk prefix to drop, valid mobile lengths]
  var DATA = [["AC","247","",[5]],["AD","376","",[6,9]],["AE","971","0",[9]],["AF","93","0",[9]],["AG","1","1",[10]],["AI","1","1",[10]],["AL","355","0",[9]],["AM","374","0",[8]],["AO","244","",[9]],["AR","54","0",[10,11]],["AS","1","1",[10]],["AT","43","0",[7,8,9,10,11,12,13]],["AU","61","0",[9]],["AW","297","",[7]],["AX","358","0",[6,7,8,9,10]],["AZ","994","0",[9]],["BA","387","0",[8,9]],["BB","1","1",[10]],["BD","880","0",[10]],["BE","32","0",[9]],["BF","226","",[8]],["BG","359","0",[8,9]],["BH","973","",[8]],["BI","257","",[8]],["BJ","229","",[10]],["BL","590","0",[9]],["BM","1","1",[10]],["BN","673","",[7]],["BO","591","0",[8]],["BQ","599","",[7]],["BR","55","0",[10,11]],["BS","1","1",[10]],["BT","975","",[8]],["BW","267","",[8]],["BY","375","8",[9]],["BZ","501","",[7]],["CA","1","1",[10]],["CC","61","0",[9]],["CD","243","0",[7,9]],["CF","236","",[8]],["CG","242","",[9]],["CH","41","0",[9]],["CI","225","",[10]],["CK","682","",[5]],["CL","56","",[9]],["CM","237","",[9]],["CN","86","0",[11]],["CO","57","0",[10]],["CR","506","",[8]],["CU","53","0",[8]],["CV","238","",[7]],["CW","599","",[7,8]],["CX","61","0",[9]],["CY","357","",[8]],["CZ","420","",[9]],["DE","49","0",[10,11]],["DJ","253","",[8]],["DK","45","",[8]],["DM","1","1",[10]],["DO","1","1",[10]],["DZ","213","0",[9]],["EC","593","0",[9]],["EE","372","",[7,8]],["EG","20","0",[10]],["EH","212","0",[9]],["ER","291","0",[7]],["ES","34","",[9]],["ET","251","0",[9]],["FI","358","0",[6,7,8,9,10]],["FJ","679","",[7]],["FK","500","",[5]],["FM","691","",[7]],["FO","298","",[6]],["FR","33","0",[9]],["GA","241","",[7,8]],["GB","44","0",[10]],["GD","1","1",[10]],["GE","995","0",[9]],["GF","594","0",[9]],["GG","44","0",[10]],["GH","233","0",[9]],["GI","350","",[8]],["GL","299","",[6]],["GM","220","",[7,9]],["GN","224","",[9]],["GP","590","0",[9]],["GQ","240","",[9]],["GR","30","",[10]],["GT","502","",[8]],["GU","1","1",[10]],["GW","245","",[9]],["GY","592","",[7]],["HK","852","",[8]],["HN","504","",[8]],["HR","385","0",[8,9]],["HT","509","",[8]],["HU","36","06",[9]],["ID","62","0",[9,10,11,12]],["IE","353","0",[9]],["IL","972","0",[9]],["IM","44","0",[10]],["IN","91","0",[10]],["IO","246","",[7]],["IQ","964","0",[10]],["IR","98","0",[10]],["IS","354","",[7,9]],["IT","39","",[9,10]],["JE","44","0",[10]],["JM","1","1",[10]],["JO","962","0",[9]],["JP","81","0",[10]],["KE","254","0",[9]],["KG","996","0",[9]],["KH","855","0",[8,9]],["KI","686","0",[8]],["KM","269","",[7]],["KN","1","1",[10]],["KP","850","0",[10]],["KR","82","0",[9,10]],["KW","965","",[8]],["KY","1","1",[10]],["KZ","7","8",[10]],["LA","856","0",[9,10]],["LB","961","0",[7,8]],["LC","1","1",[10]],["LI","423","0",[7,9]],["LK","94","0",[9]],["LR","231","0",[7,9]],["LS","266","",[8]],["LT","370","0",[8]],["LU","352","",[9]],["LV","371","",[8]],["LY","218","0",[9]],["MA","212","0",[9]],["MC","377","0",[8,9]],["MD","373","0",[8]],["ME","382","0",[8]],["MF","590","0",[9]],["MG","261","0",[9]],["MH","692","1",[7]],["MK","389","0",[8]],["ML","223","",[8]],["MM","95","0",[7,8,9,10]],["MN","976","0",[8]],["MO","853","",[8]],["MP","1","1",[10]],["MQ","596","0",[9]],["MR","222","",[8]],["MS","1","1",[10]],["MT","356","",[8]],["MU","230","",[8]],["MV","960","",[7]],["MW","265","0",[9]],["MX","52","",[10]],["MY","60","0",[9,10]],["MZ","258","",[9]],["NA","264","0",[9]],["NC","687","",[6]],["NE","227","",[8]],["NF","672","",[6]],["NG","234","0",[10]],["NI","505","",[8]],["NL","31","0",[9,11]],["NO","47","",[8]],["NP","977","0",[10]],["NR","674","",[7]],["NU","683","",[4,7]],["NZ","64","0",[8,9,10]],["OM","968","",[8]],["PA","507","",[7,8]],["PE","51","0",[9]],["PF","689","",[8]],["PG","675","",[8]],["PH","63","0",[10]],["PK","92","0",[10]],["PL","48","",[9]],["PM","508","0",[6,9]],["PR","1","1",[10]],["PS","970","0",[9]],["PT","351","",[9]],["PW","680","",[7]],["PY","595","0",[9]],["QA","974","",[8]],["RE","262","0",[9]],["RO","40","0",[9]],["RS","381","0",[8,9,10]],["RU","7","8",[10]],["RW","250","0",[9]],["SA","966","0",[9]],["SB","677","",[5,7]],["SC","248","",[7]],["SD","249","0",[9]],["SE","46","0",[9]],["SG","65","",[8]],["SH","290","",[5]],["SI","386","0",[8]],["SJ","47","",[8]],["SK","421","0",[9]],["SL","232","0",[8]],["SM","378","",[8]],["SN","221","",[9]],["SO","252","0",[7,8,9]],["SR","597","",[7]],["SS","211","0",[9]],["ST","239","",[7]],["SV","503","",[8]],["SX","1","1",[10]],["SY","963","0",[9]],["SZ","268","",[8]],["TA","290","",[4]],["TC","1","1",[10]],["TD","235","",[8]],["TG","228","",[8]],["TH","66","0",[9]],["TJ","992","",[9]],["TK","690","",[4,5,6,7]],["TL","670","",[8]],["TM","993","8",[8]],["TN","216","",[8]],["TO","676","",[7]],["TR","90","0",[10]],["TT","1","1",[10]],["TV","688","",[6,7]],["TW","886","0",[9]],["TZ","255","0",[9]],["UA","380","0",[9]],["UG","256","0",[9]],["US","1","1",[10]],["UY","598","0",[8]],["UZ","998","",[9]],["VA","39","",[9,10]],["VC","1","1",[10]],["VE","58","0",[10]],["VG","1","1",[10]],["VI","1","1",[10]],["VN","84","0",[9]],["VU","678","",[7]],["WF","681","",[6]],["WS","685","",[7,10]],["XK","383","0",[8]],["YE","967","0",[9]],["YT","262","0",[9]],["ZA","27","0",[5,6,7,8,9]],["ZM","260","0",[9]],["ZW","263","0",[9]]];
  // Dial codes shared by several countries -> the main one (used for "+..." numbers)
  var MAIN = {"1":"US","61":"AU","358":"FI","590":"GP","599":"CW","212":"MA","44":"GB","39":"IT","7":"RU","47":"NO","262":"RE","290":"SH"};
  // The countries already offered before, shown first in their usual order
  var TOP = ["SN","CI","ML","CM","CG","CD","GN","BF","TG","BJ","NE","MA","DZ","TN","EG","FR","BE","CH","US","GB","AE"];

  var BY_ISO = {}, CODES = {}, BY_DIAL = {};
  for (var i = 0; i < DATA.length; i++) {
    var r = DATA[i];
    BY_ISO[r[0]] = { iso: r[0], dial: r[1], trunk: r[2], lens: r[3] };
    CODES[r[1]] = true;
    (BY_DIAL[r[1]] = BY_DIAL[r[1]] || []).push(r[0]);
  }
  // Countries sharing a dial code (+1, +44, +290...): the main one comes first
  for (var d in MAIN) {
    var arr = BY_DIAL[d];
    arr.splice(arr.indexOf(MAIN[d]), 1);
    arr.unshift(MAIN[d]);
  }

  function has(arr, n) { return arr.indexOf(n) !== -1; }
  function minLen(reg) { return Math.min.apply(null, reg.lens); }
  function maxLen(reg) { return Math.max.apply(null, reg.lens); }

  var NAMES = null;
  function countryName(iso) {
    try {
      if (!NAMES) NAMES = new Intl.DisplayNames(['fr'], { type: 'region' });
      var n = NAMES.of(iso);
      if (n) return n;
    } catch (e) {}
    return iso;
  }

  function flag(iso) {
    var base = 0x1F1E6 - 65, s = '';
    for (var i = 0; i < 2; i++) {
      var cp = base + iso.charCodeAt(i);
      s += String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10), 0xDC00 + ((cp - 0x10000) & 0x3FF));
    }
    return s;
  }

  function describeLengths(lens) {
    var l = lens.slice().sort(function (a, b) { return a - b; });
    if (l.length === 1) return l[0] + ' chiffres';
    var run = true;
    for (var i = 1; i < l.length; i++) if (l[i] !== l[i - 1] + 1) run = false;
    if (run) return 'de ' + l[0] + ' à ' + l[l.length - 1] + ' chiffres';
    return l.slice(0, -1).join(', ') + ' ou ' + l[l.length - 1] + ' chiffres';
  }

  // Calling codes never start with each other (an ITU rule), so the first
  // 1-, 2- or 3-digit start that is a real code is the right one.
  function matchDial(digits) {
    for (var L = 1; L <= 3; L++) {
      var c = digits.slice(0, L);
      if (CODES[c]) return c;
    }
    return null;
  }

  // Many countries write the number with a leading "0" at home (06... in
  // France) that must NOT be in the international number. Others (Côte
  // d'Ivoire, Italy) keep it as part of the number, so only countries whose
  // data says they have a trunk prefix lose it, and only when what is left
  // is a valid length.
  function stripTrunk(reg, n) {
    var t = reg.trunk;
    if (t && n.indexOf(t) === 0 && has(reg.lens, n.length - t.length)) return n.slice(t.length);
    return n;
  }

  function lengthError(reg, n) {
    var why = n < minLen(reg) ? 'Numéro trop court' : (n > maxLen(reg) ? 'Numéro trop long' : 'Numéro incorrect');
    return {
      ok: false, error: 'length', iso: reg.iso, expected: reg.lens,
      message: why + ' pour le pays choisi (' + countryName(reg.iso) + ', +' + reg.dial + ') : ' +
               describeLengths(reg.lens) + " attendus, sans l'indicatif."
    };
  }

  function normalize(iso, typed) {
    var raw = String(typed == null ? '' : typed).trim();
    if (!raw) return { ok: false, error: 'empty', message: 'Entre ton numéro WhatsApp' };
    if (/[^0-9+\s().\-]/.test(raw)) {
      return { ok: false, error: 'chars', message: 'Le numéro ne doit contenir que des chiffres' };
    }
    var digits = raw.replace(/\D/g, '');
    if (!digits) return { ok: false, error: 'empty', message: 'Entre ton numéro WhatsApp' };

    var selected = BY_ISO[iso] || BY_ISO.SN;
    var reg = selected, national = digits, international = false;

    if (raw.charAt(0) === '+') international = true;
    else if (digits.indexOf('00') === 0) { international = true; digits = digits.slice(2); }

    if (international) {
      var dial = matchDial(digits);
      if (!dial) return { ok: false, error: 'dial', message: "Indicatif du pays non reconnu : vérifie le numéro" };
      national = digits.slice(dial.length);
      // The country picked in the list first, then the others sharing this
      // code, until one of them accepts the length.
      var order = BY_DIAL[dial].slice();
      if (selected.dial === dial) { order.splice(order.indexOf(selected.iso), 1); order.unshift(selected.iso); }
      for (var k = 0; k < order.length; k++) {
        var cand = BY_ISO[order[k]], n2 = stripTrunk(cand, national);
        if (has(cand.lens, n2.length)) return { ok: true, e164: '+' + cand.dial + n2, iso: cand.iso };
      }
      var first = BY_ISO[order[0]];
      return lengthError(first, stripTrunk(first, national).length);
    } else if (national.length > maxLen(reg) && national.indexOf(reg.dial) === 0 &&
               national.length - reg.dial.length >= minLen(reg)) {
      // typed the country code in front without a "+", e.g. 221771234567
      national = national.slice(reg.dial.length);
    }

    national = stripTrunk(reg, national);
    if (!has(reg.lens, national.length)) return lengthError(reg, national.length);
    return { ok: true, e164: '+' + reg.dial + national, iso: reg.iso };
  }

  // Fill a <select> with every country: the usual ones first, then all the rest A to Z.
  function fillSelect(sel, defaultIso) {
    function opt(iso) {
      var o = document.createElement('option');
      o.value = iso;
      o.textContent = flag(iso) + ' ' + countryName(iso) + ' (+' + BY_ISO[iso].dial + ')';
      return o;
    }
    sel.innerHTML = '';
    var g1 = document.createElement('optgroup');
    g1.label = 'Les plus courants';
    TOP.forEach(function (iso) { g1.appendChild(opt(iso)); });
    var rest = DATA.map(function (r) { return r[0]; }).filter(function (iso) { return TOP.indexOf(iso) === -1; });
    rest.sort(function (a, b) { return countryName(a).localeCompare(countryName(b), 'fr'); });
    var g2 = document.createElement('optgroup');
    g2.label = 'Tous les autres pays';
    rest.forEach(function (iso) { g2.appendChild(opt(iso)); });
    sel.appendChild(g1);
    sel.appendChild(g2);
    sel.value = BY_ISO[defaultIso] ? defaultIso : 'SN';
  }

  function dialFor(iso) { return '+' + (BY_ISO[iso] || BY_ISO.SN).dial; }
  function lengthsText(iso) { return describeLengths((BY_ISO[iso] || BY_ISO.SN).lens); }

  // One call wires a whole field: fills the country list, keeps the "+221"
  // label and the "9 chiffres" hint in step with the chosen country, and
  // switches the country by itself when someone pastes a full "+33..." number.
  function attach(o) {
    if (!o || !o.select) return;
    fillSelect(o.select, o.defaultIso || 'SN');
    function refresh() {
      if (o.prefix) o.prefix.textContent = dialFor(o.select.value);
      if (o.hint) o.hint.textContent = lengthsText(o.select.value) + ", sans l'indicatif";
    }
    o.select.addEventListener('change', refresh);
    if (o.input) {
      o.input.addEventListener('input', function () {
        var v = o.input.value.replace(/^\s+/, '');
        if (v.charAt(0) === '+' || v.indexOf('00') === 0) {
          var r = normalize(o.select.value, v);
          if (r.ok && r.iso !== o.select.value) { o.select.value = r.iso; refresh(); }
        }
      });
    }
    refresh();
  }

  global.PhoneInput = {
    normalize: normalize, fillSelect: fillSelect, attach: attach, dialFor: dialFor, lengthsText: lengthsText,
    countryName: countryName, count: DATA.length, _data: DATA, _top: TOP
  };
})(typeof window !== 'undefined' ? window : this);
