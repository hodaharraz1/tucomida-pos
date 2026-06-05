# 🍽 TuComida Restaurant Management System

**Fresh & Healthy** — دمياط الجديدة

نظام إدارة متكامل لمطعم TuComida يشمل: موقع العملاء، تطبيق الويتر، شاشة المطبخ، تطبيق الكاشير، وداشبورد الأونر.

---

## 🏗 هيكل التطبيقات

| التطبيق | المسار | الجهاز |
|---------|--------|--------|
| موقع العملاء | `/` | أي متصفح |
| صفحة الطلب الأونلاين | `/order.html` | موبايل / ويب |
| تسجيل الدخول | `/login/` | مشترك |
| تطبيق الويتر | `/waiter/` | تابلت أندرويد |
| شاشة المطبخ | `/kitchen/` | شاشة ثابتة |
| تطبيق الكاشير | `/cashier/` | كمبيوتر |
| داشبورد الأونر (PWA) | `/owner/` | آيفون |

---

## 🚀 خطوات الإعداد

### 1. إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد باسم **`tucomida-pos`**
3. فعّل هذه الخدمات:
   - **Realtime Database** → ابدأ في **Test Mode** (ثم طبّق الـ Rules)
   - **Authentication** → Email/Password
   - **Hosting**

### 2. تثبيت Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 3. ربط المشروع

```bash
cd "tucomida web"
npm install
firebase use --add   # اختر مشروع tucomida-pos
```

### 4. تحديث Firebase Config

افتح `/public/shared/firebase-config.js` واستبدل القيم بقيم مشروعك من:
**Firebase Console → Project Settings → Your apps → Web app config**

```javascript
const FIREBASE_CONFIG = {
  apiKey: "ACTUAL_API_KEY",
  authDomain: "tucomida-pos.firebaseapp.com",
  databaseURL: "https://tucomida-pos-default-rtdb.firebaseio.com",
  projectId: "tucomida-pos",
  storageBucket: "tucomida-pos.appspot.com",
  messagingSenderId: "ACTUAL_SENDER_ID",
  appId: "ACTUAL_APP_ID"
};
```

### 5. إنشاء المستخدمين

في **Firebase Console → Authentication → Users → Add user**:

| الدور | الإيميل | كلمة المرور |
|-------|---------|-------------|
| Owner | `owner@tucomida.com` | `TuComida@Owner2026` |
| Cashier | `cashier@tucomida.com` | `TuComida@Cashier2026` |
| Waiter | `waiter@tucomida.com` | `TuComida@Waiter2026` |
| Kitchen | `kitchen@tucomida.com` | `TuComida@Kitchen2026` |

### 6. تطبيق Database Rules

في **Firebase Console → Realtime Database → Rules**، انسخ محتوى ملف `database.rules.json`:

```bash
firebase deploy --only database
```

### 7. رفع المنيو (Seed)

```bash
# حمّل Service Account Key من:
# Firebase Console → Project Settings → Service Accounts → Generate new private key
# احفظ الملف باسم serviceAccountKey.json في مجلد المشروع

node seed-menu.js
```

### 8. تشغيل المشروع محلياً

```bash
firebase serve
```

ثم افتح:
- `http://localhost:5000` ← موقع العملاء
- `http://localhost:5000/login/` ← تسجيل الدخول
- `http://localhost:5000/waiter/` ← الويتر
- `http://localhost:5000/kitchen/` ← المطبخ
- `http://localhost:5000/cashier/` ← الكاشير
- `http://localhost:5000/owner/` ← الأونر

### 9. النشر على Firebase Hosting

```bash
firebase deploy
```

سيظهر رابط مثل: `https://tucomida-pos.web.app`

---

## 🖨 إعداد الطابعة Xprinter XP-D200N

الطابعة: **Xprinter XP-D200N** — USB — 80mm — ESC/POS

### الطريقة المستخدمة (window.print + CSS)
النظام يستخدم `window.print()` مع CSS خاص بـ 80mm. لا تحتاج تثبيت أي برنامج إضافي.

**الإعدادات المطلوبة في Windows:**
1. افتح **Devices and Printers**
2. اضبط حجم الورق: **80mm × Continuous**
3. في Chrome: عند الطباعة، اختر الطابعة وألغِ تفعيل **Headers and Footers**
4. اضبط الهوامش على **None**

### للطباعة التلقائية بدون dialog (اختياري — QZ Tray)
1. حمّل [QZ Tray](https://qz.io/download/)
2. ثبّته على الكمبيوتر
3. اربطه بالطابعة من إعداداته

---

## 📱 تحميل PWA على الآيفون (Owner App)

1. افتح Safari على الآيفون
2. اذهب إلى: `https://tucomida-pos.web.app/owner/`
3. اضغط **Share** (زر المشاركة)
4. اختر **Add to Home Screen**
5. اضغط **Add**

التطبيق سيظهر على الشاشة الرئيسية ويعمل كـ Standalone App.

---

## 📱 تحميل Waiter App على التابلت الأندرويد

1. افتح Chrome على التابلت
2. اذهب إلى: `https://tucomida-pos.web.app/waiter/`
3. Chrome سيظهر Banner "Add to Home Screen" — اضغطه
4. أو من قائمة Chrome: **⋮ → Add to Home Screen**

---

## 🎨 Color Palette

```css
--green-dark:  #1B5E20  /* اللون الأساسي لـ TuComida */
--green-mid:   #2E7D32
--green-light: #4CAF50
--cream:       #F5F0E8  /* خلفية الموقع */
--gold:        #C8A96E  /* اللون الذهبي للأونر */
--red-alert:   #D32F2F  /* التنبيهات */
--orange:      #FF6F00  /* الأوردرات الأونلاين */
```

---

## 🔗 الروابط المهمة

- **واتساب:** https://wa.me/201102708550
- **خرائط جوجل:** https://maps.app.goo.gl/jfDnwRRKcxt6Mdac9
- **Facebook:** https://www.facebook.com/share/1cbR8eMWki/
- **Instagram:** https://www.instagram.com/tucomida.eg

---

## ⚠️ ملاحظات مهمة

1. **`serviceAccountKey.json`** — لا ترفعه على GitHub أبداً، أضفه لـ `.gitignore`
2. **Firebase Config** — آمن للوضع في الكود (يُحمى بالـ Rules)
3. **الإلغاء** — الويتر والكاشير يطلبون فقط، الموافقة للأونر حصراً
4. **إنهاء اليوم** — الكاشير أو الأونر يضغط "إنهاء اليوم" أو يتم تلقائياً عند الـ 12 بالليل
5. **المنيو** — التعديل للأونر فقط من `/owner/`

---

## 📁 هيكل الملفات

```
tucomida-system/
├── package.json
├── firebase.json
├── .firebaserc
├── database.rules.json
├── seed-menu.js          ← رفع المنيو لـ Firebase
├── README.md
└── public/
    ├── index.html        ← موقع العملاء
    ├── order.html        ← صفحة الطلب الأونلاين
    ├── manifest.json     ← PWA manifest
    ├── sw.js             ← Service Worker
    ├── shared/
    │   └── firebase-config.js
    ├── login/
    │   └── index.html
    ├── waiter/
    │   └── index.html
    ├── kitchen/
    │   └── index.html
    ├── cashier/
    │   └── index.html
    └── owner/
        ├── index.html
        └── manifest.json
```

---

*TuComida POS System v1.0 — Built with Firebase + Vanilla JS*
