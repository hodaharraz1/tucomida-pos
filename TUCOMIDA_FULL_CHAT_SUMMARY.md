# TuComida — ملخص كامل لكل المحادثة

> **Firebase Project:** `tucomida-pos`  
> **الموقع الحي:** https://tucomida-pos.web.app  
> **آخر تحديث:** 2026-05-12

---

## 🔗 روابط سريعة

| الصفحة | الرابط |
|--------|--------|
| الموقع الرئيسي | https://tucomida-pos.web.app/ |
| اطلب أونلاين | https://tucomida-pos.web.app/order.html |
| Login | https://tucomida-pos.web.app/login/ |
| Kitchen | https://tucomida-pos.web.app/kitchen/ |
| Waiter | https://tucomida-pos.web.app/waiter/ |
| Cashier | https://tucomida-pos.web.app/cashier/ |
| Owner | https://tucomida-pos.web.app/owner/ |
| Firebase Console | https://console.firebase.google.com/project/tucomida-pos |

---

## 🔐 بيانات الدخول

| الدور | الإيميل | الباسورد | الصفحة |
|-------|---------|----------|--------|
| أونر | `owner@tucomida.com` | `Owner@Tucomida1` | `/owner/` |
| كاشير | `cashier@tucomida.com` | `Cashier@Tucomida1` | `/cashier/` |
| ويتر | `waiter@tucomida.com` | `Waiter@Tucomida1` | `/waiter/` |
| مطبخ | `kitchen@tucomida.com` | `Kitchen@Tucomida1` | `/kitchen/` |

---

## 📁 هيكل الملفات الكامل

```
tocomida web/
├── public/
│   ├── index.html              ← الموقع الرئيسي (Landing Page)
│   ├── order.html              ← طلب أونلاين للعملاء
│   ├── sw.js                   ← Service Worker v15
│   ├── manifest.json
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── offline.html            ← صفحة offline
│   ├── login/index.html        ← تسجيل الدخول
│   ├── kitchen/index.html      ← شاشة المطبخ KDS
│   ├── waiter/index.html       ← شاشة الويتر
│   ├── cashier/index.html      ← شاشة الكاشير
│   ├── owner/index.html        ← داش بورد الأونر
│   ├── shared/
│   │   └── firebase-config.js  ← Firebase shared config
│   ├── images/
│   │   ├── food/food-01.jpg → food-79.jpg
│   │   ├── logo-brand.jpeg
│   │   ├── logo-tucomida.jpg
│   │   ├── menu-breakfast.jpeg
│   │   ├── menu-main-course.jpeg
│   │   ├── menu-wrap.jpeg
│   │   ├── menu-salad.jpeg
│   │   ├── menu-smoothie.jpeg
│   │   ├── menu-protein.jpeg
│   │   ├── menu-meals.jpeg
│   │   ├── menu-tatbela.jpeg
│   │   ├── menu-dessert.jpeg
│   │   └── menu-rizzo.jpeg
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── database.rules.json
├── firebase.json
├── set-passwords.js            ← سكريبت ضبط الباسوردات
├── seed-menu.js
└── serviceAccountKey.json
```

---

## 🐛 المشاكل اللي اتحلّت (بالترتيب)

---

### المشكلة 1 — الصفحات بتـ redirect لبعض

**الأعراض:** فتح `/kitchen/` بيودي لـ `/waiter/` والعكس.

**السبب الجذري:**
Firebase بيستخدم `localStorage` مشترك بين كل التابات. لما صفحة بتعمل `signOut`، بتأثر على كل التابات الأخرى.

**الحل:**
```javascript
// login/index.html — قبل أي signIn
await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);

// كل صفحة محمية — session مستقل لكل تاب
sessionStorage.setItem('tc_pos_session', JSON.stringify({ uid, role }));
```

**مشكلة ثانوية:** كان `onAuthStateChanged` بيعمل redirect على `null` — اتحل بـ:
```javascript
// في login/index.html
(function checkExistingSession() {
  const s = JSON.parse(sessionStorage.getItem('tc_pos_session') || 'null');
  if (s && s.role) window.location.href = routes[s.role];
})();
```

---

### المشكلة 2 — فتح صفحتين في نفس الوقت بيقفل إحداهما

**الأعراض:** فتح المطبخ والويتر معاً في تابين منفصلين → أحدهم بيتقفل.

**السبب الجذري:**
`auth.onAuthStateChanged` بيتستدعى أكتر من مرة → `listenOrders()` بيتشغّل مرتين → تضارب في الـ listeners.

**الحل:**
```javascript
let _listenersUp = false;
auth.onAuthStateChanged(async user => {
  if (!user) {
    if (_listenersUp) { /* redirect only if we were logged in */ }
    return;
  }
  if (_listenersUp) return; // ← المنع الجذري
  _listenersUp = true;
  currentUser = user;
  listenOrders(); // يُستدعى مرة واحدة فقط
});
```

**طُبِّق في:** kitchen, waiter, owner, cashier

---

### المشكلة 3 — الـ routing بيخلط بين الصفحات

**السبب:** Firebase يشارك الـ auth state بين التابات عبر `localStorage` حتى مع SESSION persistence.

**الحل الجذري:** استبدلنا `onAuthStateChanged` للـ routing بـ `sessionStorage` مباشرة:
```javascript
// كل صفحة محمية
(function initAuth() {
  const s = JSON.parse(sessionStorage.getItem('tc_pos_session') || 'null');
  if (!s || !allowedRoles.includes(s.role)) {
    window.location.href = '/login/'; return;
  }
  currentRole = s.role;
  auth.onAuthStateChanged(async user => {
    if (!user) { /* logout */ return; }
    if (_listenersUp) return;
    _listenersUp = true;
    currentUser = user;
    listenOrders();
  });
})();
```

---

### المشكلة 4 — الأوردرات من الموقع مش بتوصل للمطبخ

**السبب:** `firebase-config.js` بيستدعي `firebase.auth()` لكن `firebase-auth-compat.js` مش محمّل في `index.html`.

**الحل:**
```javascript
// shared/firebase-config.js
const auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;
```
وإضافة السكريبت في index.html:
```html
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js" defer></script>
```

---

### المشكلة 5 — الأونر لازم يعمل Refresh عشان يشوف الأوردرات

**السبب:** نفس مشكلة `_listenersUp` — listeners بتتكرر.

**الحل:** تطبيق نفس `_listenersUp` guard في owner/index.html ✅

---

### المشكلة 6 — اللوجو الغلط في الـ nav

**الأعراض:** ظهر لوجو EDMN (مشروع تاني) بدل لوجو TuComida.

**السبب:** نسخ ملف من `/UI Designs/LOGO 1 1.png` اللي كان لمشروع ثاني.

**الحل:** CSS text logo بألوان البراند:
```html
<a href="/" class="site-logo">
  <span class="logo-name">Tuc<span class="logo-o">o</span>mida</span>
  <span class="logo-sub">fresh &amp; healthy</span>
</a>
```
```css
.logo-name { color: #fff; font-size: 22px; font-weight: 900; }
.logo-o    { color: var(--orange-l); }
```

---

### المشكلة 7 — الـ Nav links بتتداخل وبتظهر فوق بعض

**السبب:** `<nav>` جوا `<nav>` → يكسر الـ flex layout. + `.ar{display:block}` بيخلي كل spans block-level.

**الحل:**
- استبدال `<nav class="nav-links">` بـ `<div class="nav-links">`
- استخدام `data-ar`/`data-en` attributes بدل class-based spans
- JS يحدث النصوص مباشرة:

```javascript
const NAV_TRANS = {
  'nl-home': { ar:'الرئيسية', en:'Home' },
  'nl-menu': { ar:'المنيو',   en:'Menu' },
  // ...
};
Object.entries(NAV_TRANS).forEach(([id, t]) => {
  const el = document.getElementById(id);
  if (el) el.textContent = t[lang] || t.ar;
});
```

---

### المشكلة 8 — الإنجليزي مش شغّال (blank page)

**السبب الجذري (الأخطر):**

```css
.en { display: none }  /* CSS عام */
```

لما بنضيف class `en` على `body`:
```javascript
document.body.classList.add('en'); // ← body بقى display:none !
```

الـ CSS `.en{display:none}` بتطبّق على أي element عنده class `en` — **بما فيهم الـ body نفسه!** → الموقع كله بيختفي.

**الحل الجذري:**
```css
/* استخدام lang-en بدل en على الـ body */
.en { display: none }
body.lang-en .ar  { display: none }
body.lang-en .en  { display: block }
body.lang-en span.en { display: inline }
body.lang-en { direction: ltr }
```

```javascript
document.body.classList.toggle('lang-en', isEn); // ← lang-en مش en
```

---

### المشكلة 9 — الموقع لازم يمسح الـ History عند كل زيارة

**السبب:** الـ Service Worker القديم (v11/v12) كان بيكاش `index.html` وبيسيرف النسخة القديمة.

**الحل:**
1. إضافة unregister في `<head>`:
```html
<script>
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations()
    .then(r => r.forEach(sw => sw.unregister()));
}
</script>
```

2. تغيير استراتيجية الـ SW:
```javascript
// HTML → Network First (دايماً تاخد من السيرفر)
// Images → Cache First
// JS/CSS → Network Only
```

3. Headers في firebase.json:
```json
{ "source": "**/*.html", 
  "headers": [{"key":"Cache-Control","value":"no-cache, no-store, must-revalidate"}] }
```

---

### المشكلة 10 — Firebase Security Rules غير آمنة

**التحذير:** "any logged-in user can read/write your entire database"

**الحل — Rules محكمة:**
```json
{
  "menu":    { ".read": "true", ".write": "owner only" },
  "tables":  { ".read/.write": "waiter|cashier|owner|kitchen" },
  "orders":  { ".read/.write": "waiter|cashier|owner|kitchen" },
  "online_orders": {
    ".read": "cashier|owner|kitchen",
    "$orderId": { ".write": "true" }
  },
  "settings/orderCounter": { ".write": "all POS roles" },
  "activity_log": { ".read": "owner", ".write": "all POS roles" },
  "users/$uid": { ".read/.write": "self or owner" }
}
```

---

## ✅ المميزات الجديدة اللي اتبنت

---

### 1. 🌐 الموقع الرئيسي (index.html) — Full Redesign

**الأقسام:**
| القسم | التفاصيل |
|-------|----------|
| Sticky Nav | لوجو + 5 روابط + EN/AR + "اطلب الآن" + hamburger |
| Hero | صورة أكل حقيقية + headline عربي/إنجليزي + CTAs + stats |
| Features | 3 cards: سعرات، طازج، تتبيلة |
| Menu Categories | 8 كاتيجوري بصور حقيقية من الـ images folder |
| Dynamic Menu | Firebase data + search bar + category tabs |
| Gallery | 12 صورة masonry grid |
| Animated Strip | شريط صور متحرك auto-scroll |
| About | قصة المطعم + صورة + قائمة مميزات |
| Benefits | 6 cards |
| Testimonials | 3 reviews |
| FAQ | 5 أسئلة accordion |
| Location | Google Maps embed + بيانات تواصل |
| CTA | زرار اطلب + واتساب |
| Footer | SVG social icons (Instagram/Facebook/WhatsApp) |
| WA Float | زرار واتساب ثابت في الأسفل |

**الصور:** نُسخت 79 صورة من `photos tucomia/` وأُعيد تسميتها `food-01.jpg → food-79.jpg`

---

### 2. 🔍 بحث في المنيو (index.html + order.html)

```javascript
function filterMenuSearch(q) {
  const query = q.trim().toLowerCase();
  if (!query) { renderMenuItems(_menuData, _activeCat); return; }
  const results = Object.entries(_menuData.items||{}).filter(([,i]) =>
    (i.name||'').toLowerCase().includes(query) ||
    (i.nameAr||'').toLowerCase().includes(query) ||
    (i.description||'').toLowerCase().includes(query)
  );
  renderResults(results);
}
```

---

### 3. 🟢 شاشة "توفر الأيتمز" في الأونر

**الوصول:** Owner → المنيو → تاب "توفر الأيتمز"

```javascript
// Toggle switch لكل صنف
async function toggleAvailItem(itemId, isAvail) {
  await db.ref(`menu/items/${itemId}`).update({ active: isAvail });
  showToastO(isAvail ? '🟢 متاح دلوقتي' : '🔴 اتشال من المنيو');
}

// تفعيل الكل دفعة واحدة
async function markAllAvailable() {
  const updates = {};
  Object.entries(menuData.items||{}).forEach(([id]) => {
    updates[`menu/items/${id}/active`] = true;
  });
  await db.ref().update(updates);
}
```

---

### 4. 📦 صندوق الدليفري في المطبخ

عند وصول أوردر online من نوع delivery، المطبخ بيعرض:
```javascript
function buildDeliveryBox(o) {
  return `
    <div class="delivery-box">
      <div class="delivery-box-title">🛵 دليفري</div>
      <div>${o.customerName}</div>
      <div>${o.customerPhone}</div>
      <div>${o.customerAddress}</div>
    </div>`;
}
```

---

### 5. 🔍 SEO شامل

**Schema.org:**
```json
{
  "@graph": [
    { "@type": ["Restaurant","LocalBusiness","FoodEstablishment"],
      "name": "TuComida",
      "telephone": "+201102708550",
      "address": { "addressLocality": "دمياط الجديدة" },
      "aggregateRating": { "ratingValue": "4.9" },
      "hasMenu": "https://tucomida-pos.web.app/order.html"
    },
    { "@type": "WebSite" },
    { "@type": "BreadcrumbList" },
    { "@type": "FAQPage", "mainEntity": [ /* 6 أسئلة */ ] }
  ]
}
```

**Meta Tags:**
- `og:type = "website"` (مش restaurant)
- `og:image` = صورة أكل حقيقية
- `hreflang` في `<head>` + sitemap
- `geo.position` + `ICBM`

**robots.txt:**
```
Allow: /
Allow: /order.html
Disallow: /login/
Disallow: /kitchen/
Disallow: /waiter/
Disallow: /cashier/
Disallow: /owner/
```

---

## ⚙️ الكود الأساسي للسيستم

---

### firebase-config.js (المشترك)

```javascript
firebase.initializeApp(FIREBASE_CONFIG);
const db   = firebase.database();
const auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;
```

---

### نظام الـ Session (login/index.html)

```javascript
async function redirectByRole(user) {
  // جيب بيانات المستخدم
  let userData = (await db.ref(`users/${user.uid}`).once('value')).val();
  if (!userData) { /* auto-create بناءً على الإيميل */ }

  // ← الخطوة المهمة
  sessionStorage.setItem('tc_pos_session', JSON.stringify({
    uid: user.uid, role: userData.role
  }));

  window.location.href = routes[userData.role];
}
```

---

### نمط المصادقة في كل صفحة POS

```javascript
(function initAuth() {
  const s = JSON.parse(sessionStorage.getItem('tc_pos_session') || 'null');
  if (!s || !ALLOWED_ROLES.includes(s.role)) {
    window.location.href = '/login/'; return;
  }
  currentRole = s.role;

  let _listenersUp = false;
  auth.onAuthStateChanged(async user => {
    if (!user) {
      if (_listenersUp) {
        sessionStorage.removeItem('tc_pos_session');
        window.location.href = '/login/';
      }
      return;
    }
    if (_listenersUp) return;
    _listenersUp = true;
    currentUser = user;
    startListeners(); // listenOrders(), loadMenu(), إلخ
  });
})();

function doLogout() {
  sessionStorage.removeItem('tc_pos_session');
  auth.signOut().then(() => window.location.href = '/login/');
}
```

---

### نظام اللغة (index.html)

```css
/* المبدأ: استخدام lang-en على body بدل en */
.en                  { display: none }
body.lang-en .ar     { display: none }
body.lang-en .en     { display: block }
body.lang-en span.en { display: inline }
body.lang-en         { direction: ltr; font-family: var(--font-en) }
```

```javascript
const NAV_TRANS = {
  'nl-home': {ar:'الرئيسية', en:'Home'},
  'nl-menu': {ar:'المنيو',   en:'Menu'},
  /* ... */
};

function setLang(lang) {
  const isEn = lang === 'en';
  document.body.classList.toggle('lang-en', isEn);  // ← lang-en مش en
  document.documentElement.lang = isEn ? 'en' : 'ar';
  document.documentElement.dir  = isEn ? 'ltr' : 'rtl';
  document.getElementById('langBtn').textContent = isEn ? 'AR' : 'EN';
  localStorage.setItem('tc_lang', lang);
  Object.entries(NAV_TRANS).forEach(([id, t]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t[lang] || t.ar;
  });
}
```

---

### Service Worker (sw.js v15)

```
استراتيجية:
  ╔══════════════╦══════════════════╗
  ║ HTML/nav     ║ Network First    ║ ← دايماً من السيرفر
  ║ Images       ║ Cache First      ║ ← سريع + offline
  ║ JS/CSS/other ║ Network Only     ║ ← دايماً أحدث نسخة
  ╚══════════════╩══════════════════╝
```

---

## 🗃️ Firebase Database Paths

```
/menu/
  categories/{catId}   → nameAr, name, active, order
  items/{itemId}       → name, nameAr, categoryId, singlePrice, sizes, active

/orders/{orderId}      → دايني / تيك أواي (من الويتر)
  orderNumber, type, tableId, status, items[], total, createdAt

/online_orders/{orderId} → من الموقع (العملاء)
  orderNumber, type, customerName, customerPhone, customerAddress
  status, items[], total, createdAt

/tables/{tableId}      → number, status (available/occupied)
/users/{uid}           → email, role, createdAt
/settings/
  currentSession       → session ID الحالي
  orderCounter         → عداد أوردرات الدايني
  onlineOrderCounter   → عداد أوردرات الأونلاين
/sessions/{id}         → startedAt, endedAt, startedBy
/activity_log/{id}     → userId, role, action, timestamp
```

---

## 📜 أوامر مهمة

```bash
# Deploy كل حاجة
cd "tocomida web"
npx firebase-tools deploy

# Deploy hosting فقط
npx firebase-tools deploy --only hosting

# Deploy database rules فقط
npx firebase-tools deploy --only database

# ضبط الباسوردات
node set-passwords.js
```

---

## ⚠️ ملاحظات تقنية مهمة

| الملاحظة | التفاصيل |
|----------|---------|
| كل تاب = session منفصل | الويتر والمطبخ لازم يفتحوا في تابات منفصلة ويعملوا login |
| الصوت في المطبخ | لازم تضغط "ابدأ شاشة المطبخ" — مطلوب من المتصفح |
| توفر الأيتمز | التغيير فوري في Firebase ويظهر فوراً في order.html |
| `firebase.auth` في index.html | `auth` ممكن يكون `null` على الصفحة الرئيسية — ده طبيعي |
| Service Worker | بيتم إلغاء تسجيله تلقائياً عند كل زيارة لمنع مشاكل الكاش |
| `lang-en` class | لا تغيّر لـ `en` أبداً — هيكسر الموقع كله |

---

## 🧪 اختبار سريع بعد أي تعديل

```javascript
// في console المتصفح على https://tucomida-pos.web.app/

// 1. اختبار EN toggle
toggleLang();
console.log(document.body.className); // يجب أن يكون "lang-en"
console.log(document.body.offsetHeight); // يجب أن يكون > 0

// 2. اختبار اللوجو
document.querySelector('.site-logo').href; // يجب أن يكون "/"

// 3. اختبار SW
navigator.serviceWorker.controller; // يجب أن يكون null (مسجّل ومش شغّال)

// 4. اختبار Firebase
typeof db; // يجب أن يكون "object"
```

---

*آخر تحديث: 2026-05-12 | TuComida POS System*
