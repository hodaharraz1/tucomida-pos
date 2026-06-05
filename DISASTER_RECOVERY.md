# 🚨 Disaster Recovery Plan — TuComida POS
**Version:** 2.0 | **Updated:** 2026-06-01

---

## 1. Firebase Service Outage

**Symptoms:** POS screens show "غير متصل", orders not loading.

**Immediate Actions:**
1. Check Firebase Status: https://status.firebase.google.com
2. All POS screens auto-detect disconnection (red dot indicator)
3. Customers: redirect WhatsApp orders to phone manually
4. Staff: continue manually using paper tickets

**Recovery:**
- Firebase Realtime Database reconnects automatically via SDK
- Pending writes queue and sync on reconnect (Firebase offline cache)
- No data loss expected for < 30 min outages

---

## 2. Database Corruption / Bad Data

**Symptoms:** Wrong order numbers, missing items, UI errors.

**Immediate Actions:**
1. Open Owner Dashboard → Export CSV from Reports screen
2. Note the last successful orderCounter value
3. Contact Firebase support if rules were violated

**Recovery Steps:**
```bash
# 1. Export current state
node -e "const admin=require('firebase-admin'); ..."

# 2. Restore from latest backup (Firebase Storage)
# Owner Dashboard → النظام → آخر Backup

# 3. Reset orderCounter if needed
firebase database:set /settings/orderCounter 1001 --project tucomida-pos
```

---

## 3. Authentication Failure

**Symptoms:** Staff can't log in, "بيانات الدخول غير صحيحة".

**Actions:**
1. Check Firebase Auth: https://console.firebase.google.com/project/tucomida-pos/authentication
2. Reset password via Firebase Console → Users → Reset Password
3. Emergency: `set-passwords.js` script to reset all passwords

```bash
cd "tocomida web"
node set-passwords.js
```

---

## 4. Counter Desync (Wrong Order Numbers)

**Symptoms:** Two orders with same number.

**Fix:**
```bash
# Check current value
firebase database:get /settings/orderCounter --project tucomida-pos

# Reset to safe value (max existing + 100)
firebase database:set /settings/orderCounter 9999 --project tucomida-pos
```

---

## 5. Complete System Recovery Procedure

```
Step 1: Export all data via Owner Dashboard CSV
Step 2: Document last orderCounter value
Step 3: firebase deploy --only database (restore rules)
Step 4: Verify connections from all POS screens
Step 5: Test one order end-to-end
Step 6: Log incident in activity_log
```

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| System Admin | owner@tucomida.com |
| WhatsApp Backup | 01102708550 |
| Firebase Support | https://firebase.google.com/support |
