// ==========================================
// TuComida App Configuration
// ==========================================

const TC_CONFIG = {
  RESTAURANT_NAME: 'TuComida',
  SLOGAN: 'fresh & healthy',
  ADDRESS: 'دمياط الجديدة',
  PHONE: '01102708550',
  FEATURES: {
    AUTO_LOGOUT: true,
  },
  INACTIVITY_TIMEOUT_MS: 45 * 60 * 1000, // 45 minutes
};

// ==========================================
// TuComida Firebase Configuration
// ==========================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDXVIFKaiLP4ty0GHOhznN4O6FEbFFhzVo",
  authDomain: "tucomida-pos.firebaseapp.com",
  databaseURL: "https://tucomida-pos-default-rtdb.firebaseio.com",
  projectId: "tucomida-pos",
  storageBucket: "tucomida-pos.firebasestorage.app",
  messagingSenderId: "698661717103",
  appId: "1:698661717103:web:69e9100e49ac2669b9799a"
};


// Initialize Firebase — guard against duplicate initialization
if (!firebase.apps.length) {
  firebase.initializeApp(FIREBASE_CONFIG);
}

const db   = firebase.database();
const auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;


// ==========================================
// Security: Input Sanitization
// ==========================================

/**
 * Strip HTML tags and limit length. Use before saving any user-supplied text.
 * @param {*}      input    - raw input value
 * @param {number} maxLen   - maximum allowed character length
 * @returns {string}
 */
function sanitizeText(input, maxLen) {
  if (input === null || input === undefined) return '';
  const s = String(input)
    .replace(/[<>&"'`]/g, c => ({
      '<':  '&lt;',
      '>':  '&gt;',
      '&':  '&amp;',
      '"':  '&quot;',
      "'":  '&#x27;',
      '`':  '&#x60;'
    })[c])
    .trim();
  return maxLen ? s.substring(0, maxLen) : s;
}

/**
 * Sanitize a phone number.
 * - Converts Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) → Western (0-9)
 * - Strips everything except digits
 * - Returns clean digit-only string (max 15 chars)
 */
function sanitizePhone(input) {
  if (!input) return '';
  return String(input)
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0))
    .replace(/\D/g, '')
    .substring(0, 15);
}

/**
 * Escape HTML for safe innerHTML insertion of untrusted data.
 * Use this when rendering order data from Firebase into the DOM.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;');
}

// ==========================================
// Shared Utilities
// ==========================================

function formatCurrency(amount) {
  return amount.toLocaleString('ar-EG') + ' ج';
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('ar-EG', {
    hour: '2-digit', minute: '2-digit'
  });
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('ar-EG');
}

function getDayId() {
  return new Date().toISOString().split('T')[0];
}

function generateId() {
  return db.ref().push().key;
}

/**
 * Log menu changes (items/categories created/updated/deleted)
 * Only callable by owner — server-side rules enforce this.
 */
function logMenuChange(userId, action, entity, entityId, details = {}) {
  const logRef = db.ref('menu_changes').push();
  return logRef.set({
    userId,
    action,        // 'create_item' | 'update_item' | 'delete_item' | 'toggle_category' etc.
    entity,        // 'item' | 'category'
    entityId,
    timestamp: Date.now(),
    dayId: getDayId(),
    details
  });
}

// Check if user has required role, redirect if not
function requireRole(allowedRoles, redirectTo = '/login/') {
  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = redirectTo;
        return;
      }
      const snap = await db.ref(`users/${user.uid}`).once('value');
      const userData = snap.val();
      if (!userData || !allowedRoles.includes(userData.role)) {
        await auth.signOut();
        window.location.href = redirectTo;
        return;
      }
      resolve({ user, role: userData.role, userData });
    });
  });
}

// Get current session
async function getCurrentSession() {
  const snap = await db.ref('settings/currentSession').once('value');
  return snap.val();
}

// ==========================================
// Structured Logging (Production-grade)
// ==========================================

// Simple activity logger — lightweight
function logActivity(userId, role, action, details = {}) {
  db.ref('activity_log').push({
    userId, role, action,
    timestamp: Date.now(),
    dayId: getDayId(),
    details
  }).catch(() => {});
}

// ==========================================
// Inactivity Auto-Logout
// ==========================================

/**
 * Set up inactivity timer that calls onTimeout after idleMs of no interaction.
 * Returns a cleanup function to stop the timer.
 */
function setupInactivityTimer(idleMs, onTimeout) {
  if (!idleMs || idleMs <= 0) return () => {};
  let timer;
  // Only listen to click & keydown — NOT mousemove/scroll (too frequent)
  const reset = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (typeof onTimeout === 'function') onTimeout();
    }, idleMs);
  };
  const events = ['click','keydown','touchstart'];
  events.forEach(ev => document.addEventListener(ev, reset, { passive: true }));
  reset();
  return function cleanup() {
    clearTimeout(timer);
    events.forEach(ev => document.removeEventListener(ev, reset));
  };
}

// ==========================================
// Listener Cleanup Registry
// ==========================================
// POS screens register Firebase listeners here so they can be cleaned
// up on page unload (prevents memory leaks / zombie listeners).

const _listenerCleanups = [];

function registerCleanup(fn) {
  if (typeof fn === 'function') _listenerCleanups.push(fn);
}

window.addEventListener('beforeunload', () => {
  _listenerCleanups.forEach(fn => { try { fn(); } catch(e) {} });
});

// ==========================================
// Connection State Indicator
// ==========================================

/**
 * Call with element IDs for dot and text to auto-update on DB connection.
 * dotId  = element with class .cdot
 * textId = element with text content
 */
function watchConnection(dotId, textId) {
  db.ref('.info/connected').on('value', snap => {
    const isOnline = snap.val() === true;
    const dot  = document.getElementById(dotId);
    const text = document.getElementById(textId);
    if (dot)  dot.className  = 'cdot' + (isOnline ? ' ok' : '');
    if (text) text.textContent = isOnline ? 'متصل' : 'غير متصل';
  });
}

// Get next order number — atomic transaction (no race condition)
async function getNextOrderNumber() {
  const counterRef = db.ref('settings/orderCounter');
  const result = await counterRef.transaction(current => {
    // If null (first use), start at 1001
    return (current || 1000) + 1;
  });
  if (!result.committed) throw new Error('orderCounter transaction failed');
  return result.snapshot.val();
}

// Get next online order number — atomic transaction
async function getNextOnlineOrderNumber() {
  const counterRef = db.ref('settings/onlineOrderCounter');
  const result = await counterRef.transaction(current => {
    return (current || 5000) + 1;
  });
  if (!result.committed) throw new Error('onlineOrderCounter transaction failed');
  return result.snapshot.val();
}

// ==========================================
// Inventory Auto-Deduction
// ==========================================
/**
 * Deduct inventory items based on order items and their ingredient mappings.
 * Runs silently in the background — errors are suppressed.
 */
async function _deductInventory(orderItems) {
  try {
    if (!orderItems?.length) return;
    const menuSnap = await db.ref('menu/items').once('value');
    const menuItems = menuSnap.val() || {};

    const deductions = {};
    orderItems.forEach(oi => {
      const mi = menuItems[oi.itemId];
      if (!mi?.ingredients) return;
      Object.entries(mi.ingredients).forEach(([invId, qty]) => {
        deductions[invId] = (deductions[invId] || 0) + qty * (oi.quantity || 1);
      });
    });

    for (const [invId, qty] of Object.entries(deductions)) {
      await db.ref(`inventory/${invId}/stock`).transaction(cur => Math.max(0, (cur || 0) - qty));
      db.ref(`inventory/${invId}/updatedAt`).set(Date.now()).catch(() => {});
    }
  } catch(e) { /* silent */ }
}

// ==========================================
// Real-time Presence
// ==========================================

/**
 * Write presence on connect, remove it on disconnect (Firebase onDisconnect).
 * Call once after auth is confirmed, passing the authenticated user + role.
 */
function setupPresence(user, role) {
  if (!user || !role) return;
  const presRef = db.ref(`presence/${user.uid}`);
  const payload = { role, lastSeen: Date.now() };

  db.ref('.info/connected').on('value', snap => {
    if (!snap.val()) return; // offline — Firebase will fire onDisconnect automatically
    // Register cleanup on disconnect BEFORE writing presence
    presRef.onDisconnect().remove().then(() => {
      presRef.set(payload).catch(() => {});
    }).catch(() => {});
  });
}

// ==========================================
// Service Worker Registration
// ==========================================
(function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('[SW] New version available — will activate on next load.');
            }
          });
        });
      })
      .catch(err => console.warn('[SW] Registration failed:', err));
  });
})();
