// 14 Trades Alert — Translations
// Add more languages here anytime

const TRANSLATIONS = {
  en: {
    // Header
    app_name: '14 Trades',
    alert: 'ALERT',
    trades: 'TRADES',

    // Stats
    win_rate: 'Win Rate',
    signals: 'Signals',
    member: 'Member',

    // PnL
    total_pnl: 'Total P&L',
    based_on: 'Based on 1 lot',
    today: 'Today',

    // Streak
    streak: 'Streak',
    keep_going: 'Keep going',
    more_signals: 'more signals to unlock',
    max_level: 'Maximum level reached 💎',
    streak_labels: ['TRADER ⚡', 'PRO TRADER 🔥', 'ELITE TRADER 🏆', 'MASTER 💎'],

    // Countdown
    next_signal: 'Next signal',
    signal_incoming: 'Signal incoming',
    get_ready: 'Get ready now',
    incoming_label: '⚡ Signal incoming',

    // Mood
    gold: 'GOLD',
    btc: 'BTC',
    session: 'SESSION',
    watching: 'Watching',
    bullish: 'Bullish',
    bearish: 'Bearish',
    ny_open: 'NY Open',
    ny_prime: 'NY Prime',
    ny_close: 'NY Close',
    london: 'London',
    asia: 'Asia',
    off_hours: 'Off Hours',

    // Recap
    recap_title: "Yesterday's recap",
    win_rate_label: 'Win rate',

    // Scanning
    scanning: 'Scanning markets',
    stand_by: 'Stand by for next setup',

    // Live trade
    live_trade: 'Live trade',
    running: 'running',
    closed: 'closed',
    stop_loss: 'Stop Loss',
    hit: 'Hit',

    // FOMO
    missed: 'You missed this one',
    keep_notif: "Keep notifications ON",
    dont_miss: "Don't miss the next one.",
    stay_ready: 'Stay ready for the next setup.',

    // Member since
    member_since: 'Member since',

    // History
    history: 'History',
    no_history: 'No history yet',
    just_now: 'just now',
    min_ago: 'min ago',
    h_ago: 'h ago',

    // Flash
    signal_confirmed: 'Signal confirmed',
    tap_continue: 'Tap anywhere to continue',

    // Install
    add_home: 'Add to Home Screen',
    best_exp: 'for the best experience',

    // Toast
    notif_enabled: 'Notifications enabled ✓',
    notif_settings: 'Enable in Settings',
  },

  fr: {
    // Header
    app_name: '14 Trades',
    alert: 'ALERTE',
    trades: 'TRADES',

    // Stats
    win_rate: 'Taux Gains',
    signals: 'Signaux',
    member: 'Membre',

    // PnL
    total_pnl: 'P&L Total',
    based_on: 'Base 1 lot',
    today: "Aujourd'hui",

    // Streak
    streak: 'Série',
    keep_going: 'Continuez',
    more_signals: 'signaux de plus pour débloquer',
    max_level: 'Niveau maximum atteint 💎',
    streak_labels: ['TRADER ⚡', 'PRO TRADER 🔥', 'ÉLITE 🏆', 'MAÎTRE 💎'],

    // Countdown
    next_signal: 'Prochain signal',
    signal_incoming: 'Signal en approche',
    get_ready: 'Préparez-vous',
    incoming_label: '⚡ Signal en approche',

    // Mood
    gold: 'OR',
    btc: 'BTC',
    session: 'SESSION',
    watching: 'Neutre',
    bullish: 'Haussier',
    bearish: 'Baissier',
    ny_open: 'Ouv. NY',
    ny_prime: 'NY Prime',
    ny_close: 'Clo. NY',
    london: 'Londres',
    asia: 'Asie',
    off_hours: 'Fermé',

    // Recap
    recap_title: 'Récap hier',
    win_rate_label: 'Gains',

    // Scanning
    scanning: 'Analyse des marchés',
    stand_by: 'En attente du prochain setup',

    // Live trade
    live_trade: 'Trade en cours',
    running: 'en cours',
    closed: 'fermé',
    stop_loss: 'Stop Loss',
    hit: 'Atteint',

    // FOMO
    missed: 'Vous avez manqué ce trade',
    keep_notif: 'Gardez les notifications ON',
    dont_miss: 'Ne manquez pas le prochain.',
    stay_ready: 'Restez prêt pour le prochain setup.',

    // Member since
    member_since: 'Membre depuis',

    // History
    history: 'Historique',
    no_history: 'Aucun historique',
    just_now: "à l'instant",
    min_ago: 'min',
    h_ago: 'h',

    // Flash
    signal_confirmed: 'Signal confirmé',
    tap_continue: 'Appuyez pour continuer',

    // Install
    add_home: "Ajouter à l'écran",
    best_exp: 'pour la meilleure expérience',

    // Toast
    notif_enabled: 'Notifications activées ✓',
    notif_settings: 'Activer dans Réglages',
  }
};

// Current language — saved to localStorage
let currentLang = localStorage.getItem('14t_lang') || 'en';

function t(key) {
  return TRANSLATIONS[currentLang][key] || TRANSLATIONS['en'][key] || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('14t_lang', lang);
  applyTranslations();
}

function applyTranslations() {
  // All elements with data-i18n attribute get translated
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  // Update language toggle UI
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

// Auto-apply on load
document.addEventListener('DOMContentLoaded', applyTranslations);
