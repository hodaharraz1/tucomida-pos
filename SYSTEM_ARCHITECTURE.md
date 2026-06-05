# 🏗 System Architecture — TuComida POS v2.0

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CUSTOMER FACING                       │
│  index.html (Landing)    order.html (Online Ordering)   │
└──────────────────────────┬──────────────────────────────┘
                           │ WebSocket (Firebase RTDB)
                           ▼
┌─────────────────────────────────────────────────────────┐
│               Firebase Realtime Database                 │
│  /orders  /online_orders  /menu  /users  /settings      │
│  /tables  /sessions  /activity_log  /menu_changes       │
└──────┬──────────────┬──────────────┬────────────────────┘
       │              │              │
       ▼              ▼              ▼
  kitchen/       cashier/        waiter/
  (KDS)          (Payments)      (Tables)
                      │
                      ▼
                   owner/
                (Dashboard + Reports)
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JS, HTML5, CSS3 |
| Auth | Firebase Authentication (Email/Password) |
| Database | Firebase Realtime Database |
| Hosting | Firebase Hosting |
| Fonts | Google Fonts (Cairo + Inter) |
| Maps | OpenStreetMap (no API key) |
| Charts | Chart.js (owner dashboard) |
| QR Codes | api.qrserver.com |

## Real-Time Flow

```
Customer submits order
  └─→ db.ref('online_orders').push() [unauthenticated]
       └─→ Firebase RTDB broadcasts to all listeners
            ├─→ kitchen: child_added event (~100-300ms)
            ├─→ cashier: child_added event
            └─→ owner:   child_added event
```

## File Structure

```
tocomida web/
├── public/
│   ├── index.html              ← Landing Page
│   ├── order.html              ← Customer Online Ordering
│   ├── offline.html            ← Offline fallback
│   ├── sw.js                   ← Service Worker
│   ├── shared/
│   │   ├── config.js           ← Configuration constants
│   │   └── firebase-config.js  ← Firebase init + utilities
│   ├── login/index.html        ← Authentication
│   ├── kitchen/index.html      ← KDS (Kitchen Display)
│   ├── waiter/index.html       ← Waiter (Tables + Orders)
│   ├── cashier/index.html      ← Cashier (Payments + Reports)
│   └── owner/index.html        ← Owner Dashboard
├── database.rules.json         ← Firebase Security Rules
├── firebase.json               ← Hosting + CSP Headers
├── seed-menu.js                ← Menu restoration script
├── set-passwords.js            ← Password reset script
├── DISASTER_RECOVERY.md        ← DR Procedures
├── PRODUCTION_CHECKLIST.md     ← Go-live checklist
├── SECURITY_CHECKLIST.md       ← Security audit
├── RUNBOOK.md                  ← Operations guide
└── TECHNICAL_ARCHITECTURE_AUDIT.md ← Full audit report
```

## Security Model

- **Authentication:** Firebase Auth (server-side token validation)
- **Authorization:** 2-layer: Frontend (sessionStorage) + DB Rules (auth.uid)
- **Rate Limiting:** Timestamp validation in DB rules (±10 min)
- **Input Sanitization:** sanitizeText() / sanitizePhone() / escapeHtml()
- **CSP:** Strict Content-Security-Policy via Firebase Hosting headers
- **Counters:** Atomic transactions (no race conditions)
