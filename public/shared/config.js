/**
 * TuComida POS — Shared Configuration
 * =====================================================
 * Single source of truth for all configurable values.
 * DO NOT hardcode these values elsewhere in the codebase.
 * Version: 2.0.0 | Updated: 2026-06-01
 */

const TC_CONFIG = Object.freeze({

  // ── App ──────────────────────────────────────────
  APP_VERSION:    '2.0.0',
  APP_NAME:       'TuComida POS',
  RESTAURANT_NAME:'TuComida',
  SLOGAN:         'fresh & healthy',
  ADDRESS:        'دمياط الجديدة',
  PHONE:          '01102708550',
  WEBSITE:        'tucomida.web.app',
  WA_LINK:        'https://wa.me/201102708550',
  ENV:            'production',

  // ── Session ──────────────────────────────────────
  // Auto-logout after 8 hours of total session
  SESSION_TIMEOUT_MS:    8 * 60 * 60 * 1000,   // 8h
  // Auto-logout after 45 min of inactivity
  INACTIVITY_TIMEOUT_MS: 45 * 60 * 1000,        // 45 min

  // ── Order Limits ─────────────────────────────────
  MAX_POS_ORDER_TOTAL:    100000,  // EGP — enforced by DB rules
  MAX_ONLINE_ORDER_TOTAL:  50000,  // EGP
  MAX_ORDER_ITEMS:            50,
  ORDER_COUNTER_START:      1001,
  ONLINE_ORDER_COUNTER_START:5001,

  // ── Rate Limiting ─────────────────────────────────
  ONLINE_ORDER_RATE_WINDOW_MS: 10 * 60 * 1000, // 10 min window for timestamp check

  // ── UI Timeouts ──────────────────────────────────
  TOAST_DURATION_MS:       2500,
  ALARM_MUTE_DURATION_MS:  60000,  // 1 min mute
  READY_MODAL_AUTO_CLOSE:  12000,  // 12 sec

  // ── Feature Flags ────────────────────────────────
  FEATURES: Object.freeze({
    AUTO_LOGOUT:        true,   // inactivity auto-logout
    ACTIVITY_LOGGING:   true,   // write to /activity_log
    OFFLINE_CACHE:      true,   // keep-synced for critical paths
    APP_CHECK:          true,   // reCAPTCHA v3 key configured ✅
    MFA_ENFORCED:       false,  // needs Firebase Console enable
    CLOUD_FUNCTIONS:    false,  // needs Blaze plan + deploy
    ERROR_MONITORING:   true,   // basic window.onerror logging
  }),

  // ── DB Paths ─────────────────────────────────────
  DB_PATHS: Object.freeze({
    MENU:             'menu',
    ORDERS:           'orders',
    ONLINE_ORDERS:    'online_orders',
    TABLES:           'tables',
    USERS:            'users',
    SETTINGS:         'settings',
    SESSIONS:         'sessions',
    ACTIVITY_LOG:     'activity_log',
    MENU_CHANGES:     'menu_changes',
  }),

  // ── Log Severities ───────────────────────────────
  SEVERITY: Object.freeze({
    INFO:    'INFO',
    WARN:    'WARN',
    ERROR:   'ERROR',
    CRITICAL:'CRITICAL',
  }),

});
