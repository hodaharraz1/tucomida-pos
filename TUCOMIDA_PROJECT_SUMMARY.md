# TuComida POS & Website — ملخص المشروع الكامل

> **تاريخ آخر تحديث:** 2026-05-12  
> **الموقع الحي:** https://tucomida-pos.web.app  
> **Firebase Project:** `tucomida-pos`

---

## 📁 هيكل الملفات

```
tocomida web/
├── public/
│   ├── index.html              ← الموقع الرئيسي (Landing Page)
│   ├── order.html              ← صفحة الطلب الأونلاين للعملاء
│   ├── sw.js                   ← Service Worker (v13)
│   ├── manifest.json
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── login/index.html        ← تسجيل الدخول (كل الموظفين)
│   ├── kitchen/index.html      ← شاشة المطبخ (KDS)
│   ├── waiter/index.html       ← شاشة الويتر
│   ├── cashier/index.html      ← شاشة الكاشير
│   ├── owner/index.html        ← داش بورد الأونر
│   ├── shared/
│   │   └── firebase-config.js  ← Firebase initialization مشترك
│   ├── images/
│   │   ├── food/food-01.jpg → food-79.jpg   ← صور الأكل الحقيقية
│   │   ├── logo-brand.jpeg     ← اللوجو الرسمي
│   │   ├── menu-*.jpeg         ← صور كاتيجوريز المنيو
│   │   └── logo-tucomida.jpg
│   └── icons/
├── database.rules.json         ← Firebase Security Rules
├── firebase.json               ← Firebase Hosting Config
└── TUCOMIDA_PROJECT_SUMMARY.md ← هذا الملف
```

---

## 🔐 بيانات الدخول

| الدور | الإيميل | الباسورد | الصفحة |
|-------|---------|----------|--------|
| أونر | `owner@tucomida.com` | `Owner@Tucomida1` | `/owner/` |
| كاشير | `cashier@tucomida.com` | `Cashier@Tucomida1` | `/cashier/` |
| ويتر | `waiter@tucomida.com` | `Waiter@Tucomida1` | `/waiter/` |
| مطبخ | `kitchen@tucomida.com` | `Kitchen@Tucomida1` | `/kitchen/` |

**الكل بيدخل من:** https://tucomida-pos.web.app/login/

---

## ✅ ما اتعمل بالكامل

---

### 1. 🔑 نظام المصادقة (Authentication)

#### المشكلة الأصلية
- الصفحات كانت بتعمل redirect لبعض (kitchen → waiter و waiter → kitchen)
- كل الصفحات كانت بتفتح لوحدها من غير ما تطلب login

#### الحل المُطبَّق
- **Session Management مستقل لكل تاب** باستخدام `sessionStorage` بدل `localStorage`
- كل تاب بيحفظ session خاص بيه في `tc_pos_session`
- الـ login بيستخدم `auth.setPersistence(SESSION)` قبل أي login

#### كيف يشتغل الآن
```
1. افتح /login/ → سجّل دخول كـ kitchen
2. يودّيك تلقائي لـ /kitchen/
3. افتح تاب تاني → /login/ → سجّل دخول كـ waiter
4. يودّيك لـ /waiter/
5. التابين بيشتغلوا مستقلين — مفيش تداخل
```

#### الـ Guard Flag `_listenersUp`
```javascript
// في كل صفحة POS (kitchen, waiter, cashier, owner)
let _listenersUp = false;
auth.onAuthStateChanged(async user => {
  if (!user) {
    if (_listenersUp) { /* redirect to login */ }
    return;
  }
  if (_listenersUp) return; // منع duplicate listeners
  _listenersUp = true;
  currentUser = user;
  listenOrders(); // يُستدعى مرة واحدة فقط
});
```

---

### 2. 🌐 الموقع الرئيسي (index.html)

#### الأقسام الموجودة
1. **Sticky Nav** — لوجو + روابط + EN/AR toggle + "اطلب الآن"
2. **Hero Section** — صورة أكل حقيقية + headline + CTAs + stats
3. **Features Strip** — 3 مميزات (سعرات، طازج، تتبيلة)
4. **Menu Categories** — 8 كاتيجوري بصور حقيقية
5. **Dynamic Menu** — من Firebase + search bar + category tabs
6. **Gallery** — 12 صورة حقيقية من المطبخ (masonry grid)
7. **About Section** — قصة المطعم منذ 2019
8. **Benefits** — 6 مميزات
9. **Animated Strip** — شريط صور متحرك
10. **Testimonials** — 3 آراء عملاء
11. **FAQ Accordion** — 5 أسئلة
12. **Location** — خريطة Google Maps + بيانات التواصل
13. **Final CTA** — زر اطلب + واتساب
14. **Footer** — روابط + سوشيال ميديا + كوبيرايت
15. **WA Float Button** — زرار واتساب ثابت

#### Language Toggle (AR/EN)
```css
/* الحل الصحيح — استخدام lang-en بدل en */
.en { display: none }                          /* إخفاء EN بالأساس */
body.lang-en .ar { display: none }             /* إخفاء AR في EN mode */
body.lang-en .en { display: block }            /* إظهار EN blocks */
body.lang-en span.en { display: inline }       /* إظهار EN spans */
body.lang-en { direction: ltr }
```

**⚠️ المشكلة اللي اتحلّت:** كنا نضيف class `en` على الـ `body` مباشرةً — بس CSS كان فيه `.en{display:none}` اللي بتطبّق على أي element عنده class `en` بما فيهم الـ `body` نفسه → كل الموقع كان بيختفي! الحل: استخدام `lang-en` كاسم class مختلف.

---

### 3. 🍽️ صفحة الطلب الأونلاين (order.html)

#### المميزات
- عرض المنيو من Firebase (بالـ categories والـ items)
- **Search bar** — ابحث بالاسم عربي أو إنجليزي
- category tabs للتصفية السريعة
- اضافة items للـ cart (مع size picker للـ items المتعددة)
- form بيانات العميل (اسم، موبايل، عنوان)
- اختيار نوع الطلب (دليفري / استلام)
- بيكتب الأوردر على `online_orders` في Firebase
- **اللوجو قابل للنقر** → يرجع للصفحة الرئيسية

#### ربط الأوردر بالمطبخ
```
order.html → writes to Firebase: online_orders/{orderId}
kitchen/index.html → listens to: online_orders (child_added)
owner/index.html → listens to: online_orders (child_added)
cashier/index.html → listens to: online_orders
```

---

### 4. 🍳 شاشة المطبخ (kitchen/index.html)

#### المميزات
- يعرض الأوردرات من `orders` (دايني) و`online_orders` (أونلاين)
- **صندوق الدليفري** — يعرض الاسم، الموبايل، والعنوان للـ delivery orders
- يقدر يقبل الأوردر ويغيّر الحالة (pending → preparing → ready)
- صوت تنبيه لما يجي أوردر جديد
- unlock button للصوت (مطلوب من المتصفح)
- Real-time listener (مش بيتعمل أكتر من مرة بسبب `_listenersUp`)

---

### 5. 🧑‍💼 داش بورد الأونر (owner/index.html)

#### الشاشات المتاحة (bottom nav)
| الشاشة | الوصف |
|--------|-------|
| الرئيسية | إحصائيات اليوم |
| لايف | الأوردرات النشطة في الوقت الحالي |
| إلغاء | طلبات الإلغاء من الويتر |
| تقارير | تقارير المبيعات |
| المنيو | إدارة المنيو |
| السجل | سجل النشاط |

#### ⭐ جديد: شاشة "توفر الأيتمز"
في شاشة المنيو، في تابين:
- **✏️ تعديل المنيو** — إضافة/تعديل/حذف أصناف وكاتيجوريز
- **🟢 توفر الأيتمز** — toggle سريع لكل صنف (متاح/غير متاح)
  - يعرض عدد الأصناف المتاحة والمتوقفة
  - زرار "✅ كل حاجة متاحة" لتفعيل الكل دفعة واحدة
  - التغيير فوري على Firebase → يظهر في order.html تلقائياً

---

### 6. 🔒 Firebase Security Rules

```json
{
  "menu": { "read": "true (public)", "write": "owner only" },
  "tables": { "read/write": "waiter|cashier|owner" },
  "orders": { "read/write": "waiter|cashier|owner|kitchen" },
  "online_orders": { 
    "read": "cashier|owner|kitchen", 
    "write": "true (public — للعملاء)" 
  },
  "settings/orderCounter": { "write": "كل POS roles" },
  "sessions": { "read/write": "owner|cashier" },
  "activity_log": { "read": "owner", "write": "كل POS roles" },
  "users": { "read/write": "self أو owner" }
}
```

---

### 7. 🔍 SEO تحسينات شاملة

#### Meta Tags
```html
<title>TuComida | مطعم أكل صحي في دمياط الجديدة — Fresh & Healthy</title>
<meta name="description" content="...">
<meta name="geo.region" content="EG-DT">
<meta name="geo.position" content="31.4165;31.8133">
<link rel="canonical" href="https://tucomida-pos.web.app/">
<link rel="alternate" hreflang="ar" href="...">
<link rel="alternate" hreflang="en" href="...">
```

#### Open Graph & Twitter Cards
- `og:type = "website"` (مش restaurant — غير valid)
- `og:image` = صورة أكل حقيقية (مش App icon)
- Twitter card = `summary_large_image`

#### Schema.org (JSON-LD)
```json
{
  "@graph": [
    { "@type": ["Restaurant", "LocalBusiness", "FoodEstablishment"] },
    { "@type": "WebSite" },
    { "@type": "BreadcrumbList" },
    { "@type": "FAQPage" }
  ]
}
```

#### الكلمات المفتاحية المستهدفة
- مطعم أكل صحي دمياط الجديدة
- healthy food new damietta
- وجبات دايت دمياط
- high protein meals egypt
- healthy wraps damietta

---

### 8. ⚡ Service Worker & Caching

#### المشكلة
الـ SW القديم كان يكاش `index.html` → كل تعديل جديد مش بيظهر للمستخدم.

#### الحل النهائي
```javascript
// sw.js v13
// HTML = Network First (دايماً من السيرفر)
// Static Assets = Cache First (صور، icons)

// + في head:
<script>
if('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(r => r.forEach(sw => sw.unregister()));
}
</script>
```

#### Firebase Hosting Headers
```json
{
  "**/*.html": "Cache-Control: no-cache, no-store, must-revalidate",
  "/sw.js": "Cache-Control: no-cache, no-store, must-revalidate"
}
```

---

### 9. 📱 Mobile-First Design

#### Responsive Breakpoints
- `> 1024px` — Desktop (4 columns grid)
- `768px - 1024px` — Tablet (3 columns)
- `< 768px` — Mobile (1-2 columns, single column hero)
- `< 480px` — Small Mobile (bigger buttons, column CTAs)

#### Nav على الموبايل
- اللوجو على اليمين (RTL) / يسار (LTR)
- زرار الهمبرجر + EN button على اليسار
- Slide-down menu عند الفتح

---

### 10. 🐛 المشاكل الجذرية اللي اتحلّت

| المشكلة | السبب | الحل |
|---------|-------|------|
| Kitchen → Waiter redirect | Firebase shared localStorage session | `sessionStorage` + `tc_pos_session` |
| فتح كل التابات لصفحة واحدة | Firebase shared auth state | SESSION persistence per-tab |
| Real-time مش شغّال | Duplicate `onAuthStateChanged` listeners | `_listenersUp` guard flag |
| اللوجو الغلط في الـ nav | نسخ لوجو من مشروع آخر (EDMN) | CSS text logo بألوان البراند |
| EN يعمل blank page | `body.en` class + `.en{display:none}` = body hidden | استخدام `body.lang-en` |
| الموقع مش بيتحمّل | `firebase.auth is not a function` | تعليم `auth` optional في firebase-config.js |
| لازم يمسح history | SW قديم يكاش نسخ قديمة | SW unregister في `<head>` + Network First |

---

## 🚀 خطوات الـ Deploy

```bash
cd "tocomida web"
npx firebase-tools deploy          # deploy كل حاجة
npx firebase-tools deploy --only hosting    # hosting فقط
npx firebase-tools deploy --only database   # rules فقط
```

---

## 📋 Firebase Realtime Database Paths

```
/menu/categories/{catId}     ← كاتيجوريز المنيو
/menu/items/{itemId}         ← أيتمز المنيو
/orders/{orderId}            ← أوردرات الدايني/تيك أواي
/online_orders/{orderId}     ← أوردرات الموقع (العملاء)
/tables/{tableId}            ← حالة الطاولات
/users/{uid}                 ← بيانات الموظفين + الدور
/settings/currentSession     ← الشيفت الحالي
/settings/orderCounter       ← عداد أوردرات الدايني
/settings/onlineOrderCounter ← عداد أوردرات الأونلاين
/activity_log/{logId}        ← سجل النشاط
/sessions/{sessionId}        ← الشيفتات
```

---

## 🔗 كل الروابط

| الصفحة | الرابط |
|--------|--------|
| الموقع الرئيسي | https://tucomida-pos.web.app/ |
| اطلب أونلاين | https://tucomida-pos.web.app/order.html |
| تسجيل الدخول | https://tucomida-pos.web.app/login/ |
| شاشة المطبخ | https://tucomida-pos.web.app/kitchen/ |
| شاشة الويتر | https://tucomida-pos.web.app/waiter/ |
| شاشة الكاشير | https://tucomida-pos.web.app/cashier/ |
| داش بورد الأونر | https://tucomida-pos.web.app/owner/ |
| Firebase Console | https://console.firebase.google.com/project/tucomida-pos |

---

## 🔒 Phase 1 Security Hardening (2026-05-15)

### ما اتعمل

| الملف | التغيير |
|-------|---------|
| `database.rules.json` | إعادة كتابة كاملة: validate على كل node، حماية online_orders من spam، timestamp validation، field length limits، status enums |
| `firebase.json` | Security Headers: HSTS، X-Frame-Options، X-Content-Type-Options، Referrer-Policy، Permissions-Policy، cache strategy للصور والـ JS |
| `public/sw.js` | Service Worker v15: Network First للـ HTML، Cache First للصور، Offline fallback، Background Sync + Push Notifications placeholders |
| `public/offline.html` | صفحة Offline جديدة مع auto-retry عند عودة الاتصال |
| `public/manifest.json` | PWA manifest محسّن: scope، orientation، shortcuts، categories |
| `public/shared/firebase-config.js` | إضافة `sanitizeText()` و `sanitizePhone()` و `escapeHtml()` + SW registration صحيح |
| `public/order.html` | `sanitizeText/sanitizePhone` على كل inputs قبل Firebase، `_submitting` flag لمنع double-submit، preconnect hints |
| `public/cashier/index.html` | إصلاح `currentRole` undeclared variable |

### Bug Fixes (سبقت الـ hardening)
- `cashier/index.html` — `let currentRole = null` مش معلّن (implicit global)
- `order.html` — مقارنة `null === ''` في `changeOrderQty` كانت بتكسر أزرار السلة

---

## ⚠️ ملاحظات مهمة

1. **لو الموقع مش بيفتح على أي متصفح جديد** → افتح في Private/Incognito window أول مرة
2. **كل تاب لازم يعمل login لوحده** — مفيش session مشترك بين التابات (by design)
3. **صفحة kitchen** — لازم تضغط "ابدأ شاشة المطبخ" عشان تفعّل الصوت (browser requirement)
4. **قسم "توفر الأيتمز"** في الأونر — التغييرات فورية وبتظهر على order.html تلقائياً
5. **الـ Service Worker v15** — Network First للـ HTML (دايماً fresh)، Cache First للصور، offline fallback على `/offline.html`
6. **قبل الـ Deploy** — اختبر الـ Security Rules في Firebase Console Simulator أول

---

## 🗺️ الخطوات القادمة

راجع `ROADMAP.md` للـ architectural migration plan:
- **Phase 2**: Firebase Functions Backend (atomic order counters, server-side validation)
- **Phase 3**: Next.js + TypeScript Migration
- **Phase 4**: Testing Infrastructure (Vitest + Playwright)
- **Phase 5**: GitHub Actions CI/CD
- **Phase 6**: Analytics & Sentry Monitoring
- **Phase 7**: Advanced Owner Dashboard

---

*آخر تحديث: 2026-05-15 — TuComida POS System v2*
