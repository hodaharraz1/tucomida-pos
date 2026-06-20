# 📋 توثيق شامل لجلسة المراجعة والإصلاح — TuComida POS

**التاريخ:** 2026-06-15
**النطاق:** مراجعة تقنية شاملة + إصلاح أخطاء + ترجمة + تحسينات أمنية

---

## 🗂️ نظرة عامة على النظام

- **قاعدة البيانات:** Firebase Realtime Database (مش Firestore)
- **الاستضافة:** Firebase Hosting + نسخة على Netlify
- **النوع:** مطعم واحد (single restaurant، مش multi-tenant)
- **التقنية:** HTML ثابت + JavaScript عادي (vanilla JS) — تطبيق PWA
- **الواجهات:** الموقع العام (index/order) + الكاشير + المطبخ + الويتر + الأونر

---

## 1️⃣ صفحة المنيو — `public/order.html`

### المشكلة الأساسية: المنيو مش بيعرض حاجة خالص

**الأخطاء اللي اتصلحت:**

| # | المشكلة | الحل |
|---|---------|------|
| 1 | تعريف مكرر لـ `let menuData` (في السطر 485 و 654) → خطأ في تحليل JS | حذف التعريف الثاني |
| 2 | `db` معرّف في `<script>` block منفصل → مشكلة توقيت (timing) | دمج الـ script blocks في واحد |
| 3 | `window.addEventListener('load', ...)` مش بيشتغل صح | استبداله بنداء مباشر `loadMenu()` |
| 4 | `buildFoodCard` بيستخدم متغيرات غير معرّفة (`safeIid`/`safeName`/`safeNameAr`) | استبدالها بـ `iid` و `name` |
| 5 | `planModal` بيعمل `appendChild` مرتين | حذف الـ appendChild الأول |

### تحويل للتحديث اللحظي (Real-time)

- تحويل من `.once()` (قراءة مرة واحدة) إلى `.on()` (استماع لحظي) للمنيو والباقات
- إضافة متغيرات حالة: `_menuRaw`, `_plansRaw`, `_menuReady`
- إضافة دالة `_rebuildMenu()` بتتنادى من الـ listener بتاع المنيو والباقات
- الـ `_menuReady` flag بيضمن إن المنيو يحمّل الأول قبل إعادة البناء

### إصلاح مزامنة الباقات (الأونر ↔ الموقع)

**المشكلة:** أي تعديل بيعمله الأونر في الباقات مش بيظهر في الموقع.

**السبب:** الموقع كان بيقرأ `itemsEn` لكن الأونر بيكتب `components`. وكمان `nameEn`/`period` مش متخزنين في DB أصلاً.

**الحل:** إضافة خريطة `PLAN_META` في order.html بتطابق `PLAN_DEFS` بتاعة الأونر:

```js
const PLAN_META = {
  'weekly':         { name:'Weekly Plan',          period:'/ week' },
  'monthly':        { name:'Half Monthly Plan',    period:'/ 15 days' },
  'fitness':        { name:'Monthly Plan',         period:'/ month' },
  'tatbela-week':   { name:'Weekly Marinade',      period:'/ week' },
  'tatbela-2weeks': { name:'Half Monthly Marinade',period:'/ 2 weeks' },
  'tatbela-month':  { name:'Monthly Marinade',     period:'/ month' },
};
```

- الموقع دلوقتي بيقرأ `plan.components` (اللي الأونر بيحفظه) مع fallback لـ `itemsEn`/`itemsAr`
- تاب "Monthly Plans" بيظهر بس لو فيه باقة واحدة على الأقل `active !== false`
- `buildCatTabs` بيحافظ على التاب النشط عند إعادة البناء

### الترجمة للإنجليزي

| قبل | بعد |
|-----|-----|
| 🍴 الكل | 🍴 All |
| ابحث في المنيو... | Search menu... |
| احجز واتساب | Book via WhatsApp |

---

## 2️⃣ واجهة الكاشير — `public/cashier/index.html`

| # | المشكلة | الحل |
|---|---------|------|
| 1 | متغيرات CSS غير معرّفة (`--green-mid`, `--green-dark`, `--green`, `--orange`) | إضافتها في `:root` |
| 2 | تنسيق `dayId` غلط في `loadTables`: `replace(/-/g,'')` بينتج `"20260615"` بدل `"2026-06-15"` | استخدام `getDayId()` |
| 3 | `logActivity` بتستخدم `'cashier'` ثابت → بيفشل في Firebase rule لما الأونر يستخدم الكاشير | تغييرها لـ `currentRole\|\|'cashier'` (في `confirmPayment` و `confirmEndDay`) |
| 4 | إضافة مزدوجة في modal الأحجام (auto-add عند الضغط + confirmSizeC) | حذف الـ auto-add من onclick، الإبقاء على confirmSizeC فقط |
| 5 | أخطاء تقريب الأرقام العشرية (floating point) | `Math.round(sub * val) / 100` و `Math.round(Math.max(0, sub - discount) * 100) / 100` |

**القيم اللي اتضافت في `:root`:**
```css
--green-mid:#43A047; --green-dark:#1B5E20; --green:#43A047; --orange:#E67B20
```

---

## 3️⃣ واجهة الويتر — `public/waiter/index.html`

| # | المشكلة | الحل |
|---|---------|------|
| 1 | متغيرات CSS غير معرّفة (`--green`, `--glight`, `--green-dark`) | إضافتها في `:root` |

```css
--green:#43A047; --glight:#66BB6A; --green-dark:#1B5E20
```

---

## 4️⃣ واجهة المطبخ — `public/kitchen/index.html`

### مشكلة `isOnline` (boolean → string)

**المشكلة:** القيمة المنطقية (boolean) بتتحوّل لـ string `"true"/"false"` في onclick attribute. والـ string `"false"` قيمته truthy (صح)، فكان بيتعامل مع كل الطلبات كأنها أونلاين.

**الحل في `openPrepModal`:**
```js
acceptingIsOnline = isOnline === true || isOnline === 'true';
```

**الحل في `bumpOrder`:**
```js
isOnline = isOnline === true || isOnline === 'true';
```

---

## 5️⃣ الصفحة الرئيسية — `public/index.html`

### إخفاء/إظهار الباقات لحظياً

**المشكلة:** الـ listener كان بيحدّث السعر بس، مش بيخفي/يظهر الكروت.

**الحل:**
```js
const card = el.closest('.pcard');
if (card) card.style.display = (plan.active === false) ? 'none' : '';
```

---

## 6️⃣ الأمان — تغييرات حرجة 🔒

### `firebase.json` — حذف Content-Security-Policy

- الـ CSP كان بيمنع تحميل Firebase SDK scripts (`apis.google.com`)
- جربنا إضافة الدومين للـ allowlist → فشل
- **القرار:** حذف الـ CSP header بالكامل
- **اتبقى:** `Strict-Transport-Security`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`

### `serviceAccountKey.json` — إزالة من git ⚠️ حرج جداً

- الملف ده هو **Firebase Admin SDK key** — صلاحية كاملة على DB، بيتخطى كل القواعد
- كان متتبّع في git من أول commit (`bb561c7`)
- **الإجراء:** `git rm --cached serviceAccountKey.json` (الملف لسه موجود محلياً، اتشال من التتبع بس)
- **⚠️ مطلوب منك:** تعمل **rotate** للمفتاح من Firebase Console
  > Project Settings → Service Accounts → Generate new key → احذف القديم

### `database.rules.json` — مراجعة (بدون تعديل)

- `online_orders`: بيسمح بكتابة بدون مصادقة مع قيد على الـ timestamp (±10 دقيقة)
- `onlineOrderCounter`: بيسمح بزيادة بمقدار 1 بدون مصادقة
- `menu`: `.read: true` (قراءة عامة — مقصودة)
- `settings/plans`: `.read: true` (قراءة عامة — مقصودة)
- الأونر بس اللي يقدر يكتب حقل `role` (منع تصعيد الصلاحيات)

---

## 7️⃣ نقاش حماية الطلبات الأونلاين من الـ Spam (بدون تنفيذ)

**المشكلة:** الطلبات الأونلاين مفتوحة لأي حد بدون حماية — أي حد يقدر يغرق المطبخ بطلبات وهمية.

**الخيارات اللي اتناقشت:**

| الحل | الوصف | العيب |
|------|-------|-------|
| **Firebase App Check** ⭐ | بيتأكد إن الطلب من التطبيق الحقيقي مش bot. مجاني | محتاج تعديل rules + SDK |
| **Phone OTP** | تأكيد رقم التليفون بـ SMS | خطوة إضافية + تكلفة SMS |
| **reCAPTCHA v3** | score لكل طلب في الخلفية | محتاج Cloud Function (Blaze مدفوع) |
| **Honeypot Field** | حقل مخفي، لو اتملا يتجاهل الطلب | بيوقف الـ bots البدائية بس |
| **Rate Limiting في Rules** | قيد على عدد الطلبات | Firebase Rules مش مصممة لكده |

**التوصية:** App Check + Honeypot معاً (الاتنين مجانيين، ما بيأثروش على العميل).

> ملاحظة: ده نقاش فقط، لسه ما اتنفذش حاجة.

---

## ✅ ملخص الملفات المعدّلة

- `public/order.html` — إصلاح المنيو + real-time + مزامنة الباقات + ترجمة
- `public/cashier/index.html` — CSS vars + dayId + logActivity + double-add + تقريب
- `public/waiter/index.html` — CSS vars
- `public/kitchen/index.html` — isOnline boolean bug
- `public/index.html` — إخفاء/إظهار الباقات لحظياً
- `firebase.json` — حذف CSP
- `serviceAccountKey.json` — إزالة من git tracking

---

## 📌 مهام معلّقة

- [ ] **(أنت)** عمل rotate لمفتاح Firebase Admin SDK من Console
- [ ] (نقاش) تنفيذ حماية الـ spam للطلبات الأونلاين
- [ ] (أولوية منخفضة) مزامنة المنيو الكامل على Netlify
