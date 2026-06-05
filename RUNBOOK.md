# 📖 Operations Runbook — TuComida POS v2.0

## Daily Operations

### Morning Startup
1. Open cashier screen → click "بدء جلسة جديدة" if new day
2. Open kitchen screen → click "🚀 ابدأ شاشة المطبخ" to unlock sound
3. Open waiter screen on tablet
4. Verify connection dot is green on all screens

### End of Day
1. Cashier screen → "🌙 إنهاء اليوم"
2. Review daily report
3. Export CSV if needed: Owner → التقارير → 📥 تصدير CSV

---

## Common Issues & Fixes

### "جاري التحقق..." loading forever
**Cause:** App Check misconfigured or network issue
**Fix:** Hard refresh (Cmd+Shift+R), then login again

### Sound not working in kitchen
**Cause:** Browser audio blocked before user interaction
**Fix:** Click "🚀 ابدأ شاشة المطبخ" button. Check device is not on Silent.

### Orders not appearing in kitchen
**Cause:** Firebase disconnected
**Fix:** Check green/red dot. Refresh page if red for > 30 sec.

### Wrong order numbers (duplicates)
**Cause:** Rare race condition (now fixed with atomic transactions)
**Fix:** Owner → settings → reset orderCounter to max+100

### Map not loading
**Cause:** Browser blocks OpenStreetMap iframe
**Fix:** No action needed — OpenStreetMap loads without API key

---

## Deployment

```bash
cd "tocomida web"

# Full deploy
npx firebase-tools deploy

# Hosting only (fastest)
npx firebase-tools deploy --only hosting

# Database rules only
npx firebase-tools deploy --only database

# Reset menu from seed
node seed-menu.js

# Reset passwords
node set-passwords.js
```

---

## Monitoring

- Activity Log: Owner Dashboard → سجل النشاط
- Errors: Owner Dashboard → النظام (System Health)
- Firebase Console: https://console.firebase.google.com/project/tucomida-pos

---

## Credentials

| Service | URL | Notes |
|---------|-----|-------|
| Firebase Console | console.firebase.google.com/project/tucomida-pos | Admin access |
| Live Site | tucomida-pos.web.app | Public |
| Owner Login | /login/ → owner@tucomida.com | POS Admin |
