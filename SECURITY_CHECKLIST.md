# 🔒 Security Checklist — TuComida POS v2.0

## A. Authentication Security

| Check | Status | Notes |
|-------|--------|-------|
| Email/Password Auth only | ✅ | No OAuth (reduces attack surface) |
| SESSION persistence | ✅ | Clears on browser close |
| Auto-logout on inactivity | ✅ | 45 min via setupInactivityTimer() |
| Auto-logout on Firebase session end | ✅ | onAuthStateChanged handler |
| Password complexity | ⚠️ | Enforced manually (set-passwords.js) |
| MFA for owner | ⬜ | Requires Firebase Console enable |

## B. Authorization

| Check | Status | Notes |
|-------|--------|-------|
| Frontend role check | ✅ | initAuth() IIFE in every POS screen |
| Database Rules role check | ✅ | auth.uid cross-referenced with /users |
| Role escalation prevention | ✅ | Only owner can write /users/{uid}/role |
| Cross-tenant isolation | N/A | Single restaurant |

## C. Database Rules

| Collection | Read | Write | Notes |
|------------|------|-------|-------|
| /menu | Public | Owner only | Intentional for landing page |
| /orders | POS staff | POS staff | Full validation |
| /online_orders | Staff | Public create / Staff update | Rate limited by timestamp |
| /users | Self/Owner | Self/Owner | Role escalation prevented |
| /activity_log | Owner | All POS roles | Audit trail |
| /settings/onlineOrderCounter | Public | Public | Validated: 0 < n ≤ 999999 |

## D. HTTP Security Headers

| Header | Value | Status |
|--------|-------|--------|
| Content-Security-Policy | Strict | ✅ |
| X-Frame-Options | SAMEORIGIN | ✅ |
| X-XSS-Protection | 1; mode=block | ✅ |
| X-Content-Type-Options | nosniff | ✅ |
| HSTS | max-age=31536000 | ✅ |
| Referrer-Policy | strict-origin | ✅ |
| Permissions-Policy | Restricted | ✅ |

## E. Input Validation

| Function | Location | Purpose |
|----------|----------|---------|
| sanitizeText() | firebase-config.js | Strip HTML, limit length |
| sanitizePhone() | firebase-config.js | Clean phone numbers |
| escapeHtml() | firebase-config.js | Safe DOM insertion |
| DB .validate rules | database.rules.json | Server-side field validation |

## F. Known Acceptable Risks

1. **Firebase API Key in frontend** — Standard for Firebase Web Apps. Mitigated by Database Rules.
2. **onlineOrderCounter public** — Required for unauthenticated customers. Validated by range rules.
3. **Frontend-only route protection** — Acceptable; DB Rules are the true security layer.
