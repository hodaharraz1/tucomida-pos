# 🚀 TuComida POS — Commercial Setup Guide
**Version 2.0.0 — 2026-06-01**

---

## ما تم تنفيذه تلقائياً ✅

| Feature | الحالة |
|---------|--------|
| App Check (reCAPTCHA v3) — الكود جاهز | ✅ |
| TOTP MFA (Google Authenticator) — الكود جاهز | ✅ |
| Cloud Functions Backup — الكود جاهز | ✅ |
| Database Security Rules — محدّث | ✅ |
| CSP Security Headers | ✅ |
| Race Condition Fix في orderCounter | ✅ |
| CSV Export (Orders + Log + Menu) | ✅ |
| Manual JSON Backup | ✅ |
| Audit Logging لكل العمليات | ✅ |
| Settings Page للأونر | ✅ |

---

## الخطوات المطلوبة منك في Firebase Console

### STEP 1 — ترقية لـ Firebase Blaze (مطلوب للـ Functions)

```
Firebase Console → Project Settings → Billing → Upgrade to Blaze
```
> ملاحظة: الـ Blaze plan مجاني لأول 2M function invocation شهرياً.

---

### STEP 2 — تفعيل Firebase App Check (reCAPTCHA v3)

```
1. اذهب إلى: https://console.firebase.google.com/project/tucomida-pos/appcheck
2. اضغط على "Web App"
3. اختر "reCAPTCHA v3"
4. اذهب إلى: https://www.google.com/recaptcha/admin/create
5. أنشئ site جديد:
   - Type: reCAPTCHA v3
   - Domains: tucomida-pos.web.app, localhost
6. انسخ Site Key
7. افتح: public/shared/firebase-config.js
8. ابحث عن: APP_CHECK_SITE_KEY = 'REPLACE_WITH_RECAPTCHA_V3_SITE_KEY'
9. ضع Site Key الخاص بك
10. ارفع بـ: firebase deploy --only hosting
11. في Firebase Console → App Check → Enforce (بعد التأكد من الشغل)
```

---

### STEP 3 — تفعيل Firebase Multi-Factor Authentication

```
1. اذهب إلى: https://console.firebase.google.com/project/tucomida-pos/authentication/providers
2. اضغط على "Multi-factor authentication"
3. اختر "TOTP" (Time-based One-Time Password)
4. اضغط Enable
```

**بعدها:**
- افتح الموقع → owner login
- اذهب لـ "الإعدادات" في الـ Bottom Nav
- اضغط "تفعيل التحقق بخطوتين"
- امسح الـ QR بـ Google Authenticator أو Authy
- أدخل الكود → تأكيد

---

### STEP 4 — تفعيل Cloud Functions + Backup

```bash
# 1. تأكد من Blaze plan
# 2. في Terminal:
cd "tocomida web"
firebase deploy --only functions
```

**بعدها:**
- الـ Backup يشتغل تلقائياً كل يوم الساعة 2 صباحاً (Cairo)
- يتم حفظ الـ backup في Firebase Storage: gs://tucomida-pos.appspot.com/backups/

**للـ backup اليدوي من الـ Dashboard:**
- Owner Dashboard → التقارير → زرار "نسخة احتياطية الآن"

---

### STEP 5 — تفعيل Firebase Storage

```
1. Firebase Console → Storage → Get Started
2. اختر "us-central1" أو "europe-west1" (نفس region الـ Functions)
3. الـ Security Rules موجودة في: storage.rules
4. Deploy: firebase deploy --only storage
```

---

## الـ Deploy الكامل (بعد كل الخطوات)

```bash
cd "tocomida web"

# Install functions dependencies
cd functions && npm install && cd ..

# Deploy everything
firebase deploy
```

---

## البيانات الحساسة (لا ترفعها على GitHub)

| الملف | الوضع |
|-------|--------|
| `serviceAccountKey.json` | ✅ في .gitignore |
| `.env` | ✅ في .gitignore |
| `functions/node_modules` | ✅ في .gitignore |

---

## تقييم جاهزية المنتج للبيع — بعد تنفيذ كل الخطوات

| المعيار | قبل | بعد |
|---------|-----|-----|
| Security | 6.5/10 | **9/10** |
| Performance | 7/10 | **7.5/10** |
| Scalability | 4/10 | **4.5/10** (single-tenant) |
| Maintainability | 5/10 | **6/10** |
| Commercial Readiness | 5.5/10 | **8/10** |

---

## بعد كل الخطوات — ما الذي يعمل؟

```
✅ Firebase App Check — يمنع الـ bots من استدعاء Firebase
✅ TOTP MFA — الأونر يحتاج Google Authenticator للدخول
✅ Daily Backup — نسخة احتياطية تلقائية كل يوم 2 ص
✅ Manual Backup — زرار في الـ dashboard للـ backup الفوري
✅ Local JSON Export — fallback لو Functions مش مفعّلة
✅ Weekly Cleanup — يحذف السجلات الأقدم من 90 يوم
✅ New Order Trigger — يسجّل كل طلب جديد من الموقع
✅ CSP Headers — يمنع XSS attacks
✅ Rate Limiting — يمنع spam الطلبات
✅ Atomic Counters — لا تكرار في أرقام الطلبات
✅ CSV Export — تصدير الأوردرات والسجلات والمنيو
✅ Change Password — من داخل الـ dashboard
```

---

*TuComida POS v2.0.0 — جاهز للبيع التجاري لمطعم واحد*
