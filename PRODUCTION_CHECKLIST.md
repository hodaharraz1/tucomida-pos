# ✅ Production Checklist — TuComida POS v2.0

## Pre-Launch Security
- [x] Firebase Realtime Database Rules deployed and validated
- [x] onlineOrderCounter: validated with max 999999
- [x] online_orders: timestamp rate limiting (±10 min)
- [x] Content-Security-Policy headers configured
- [x] X-Frame-Options: SAMEORIGIN
- [x] HSTS: max-age=31536000
- [x] serviceAccountKey.json in .gitignore
- [x] No secrets in public/ directory
- [ ] App Check site key configured (needs Firebase Console)
- [ ] MFA enabled for owner (needs Firebase Console)

## Authentication
- [x] Firebase Auth Email/Password enabled
- [x] SESSION persistence (clears on browser close)
- [x] Per-tab sessionStorage isolation
- [x] Auto-logout on Firebase session end
- [x] Inactivity timeout (45 min)
- [x] Role check both frontend AND database rules

## Database
- [x] All rules use auth != null checks
- [x] Role-based access per collection
- [x] Field validation in .validate rules
- [x] Indexes on dayId, createdAt, status
- [x] Atomic transactions for all counters
- [x] No global allow read/write: true (except menu read + counter)

## Performance
- [x] Images: Cache-Control public max-age=604800
- [x] HTML: no-cache, no-store
- [x] JS/CSS: no-cache, must-revalidate
- [x] Firebase listeners: _listenersUp guard (no duplicates)
- [x] Listener cleanup on beforeunload

## Backup
- [x] CSV export: Orders, Activity Log, Menu
- [x] Manual backup trigger in Owner Dashboard
- [ ] Scheduled daily backup (needs Blaze + Cloud Functions deploy)

## Monitoring
- [x] window.onerror → /activity_log
- [x] Structured logging with severity
- [x] Connection state indicator on all screens
- [x] Error boundary on Firebase operations

## Operations
- [x] DISASTER_RECOVERY.md documented
- [x] RUNBOOK.md documented
- [x] All passwords set via set-passwords.js
- [x] seed-menu.js for menu restoration
