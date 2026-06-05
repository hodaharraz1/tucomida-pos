# TuComida — Production Roadmap
> آخر تحديث: 2026-05-15 | الحالة: Phase 1 مكتملة ✅

---

## ✅ Phase 1 — Security & Stability (مكتملة الآن)

| المهمة | الملف | الحالة |
|--------|-------|--------|
| Firebase Security Rules كاملة مع validation | `database.rules.json` | ✅ |
| Security Headers (HSTS, X-Frame, CSP, Referrer) | `firebase.json` | ✅ |
| Service Worker احترافي + offline support | `public/sw.js` | ✅ |
| صفحة Offline fallback | `public/offline.html` | ✅ |
| PWA Manifest محسّن | `public/manifest.json` | ✅ |
| Input Sanitization + XSS Prevention | `shared/firebase-config.js` | ✅ |
| Rate limiting + sanitization في order.html | `public/order.html` | ✅ |
| إصلاح `currentRole` undeclared في cashier | `public/cashier/index.html` | ✅ |
| إصلاح size null/'' comparison في order.html | `public/order.html` | ✅ |

---

## 🔵 Phase 2 — Firebase Functions Backend (أسبوعان)

**المتطلبات:** Firebase Blaze plan (pay-as-you-go)

### لماذا نحتاج Functions؟
- العمليات الحساسة (order creation، payment، reports) يجب أن تكون server-side
- منع manipulation للـ order counters
- Transaction-safe order numbering
- Server-side validation مستقلة عن الـ client

### الـ Functions المطلوب إنشاؤها:

```
functions/
├── src/
│   ├── orders/
│   │   ├── createOnlineOrder.ts   ← atomic order + counter increment
│   │   ├── updateOrderStatus.ts   ← kitchen/cashier status updates
│   │   └── validateOrder.ts       ← server-side validation
│   ├── reports/
│   │   ├── getDailyReport.ts      ← callable: daily sales summary
│   │   └── getWeeklyReport.ts     ← callable: weekly analytics
│   ├── notifications/
│   │   ├── onNewOrder.ts          ← trigger: notify kitchen on new order
│   │   └── sendWhatsApp.ts        ← callable: WA Business API
│   └── admin/
│       ├── createStaffUser.ts     ← owner creates staff accounts
│       └── assignRole.ts          ← set Custom Claims for roles
```

### مثال: createOnlineOrder Function
```typescript
export const createOnlineOrder = functions.https.onCall(async (data, context) => {
  // 1. Validate inputs server-side
  // 2. Atomic transaction: read counter → increment → write order
  // 3. Return order number to client
  const { customerName, customerPhone, items, type } = data;
  return db.runTransaction(async t => {
    const counterRef = db.ref('settings/onlineOrderCounter');
    const snap = await t.get(counterRef);
    const orderNumber = (snap.val() || 5000) + 1;
    t.update(counterRef, orderNumber);
    const orderId = db.ref('online_orders').push().key;
    t.set(db.ref(`online_orders/${orderId}`), { /* ... */ });
    return { orderId, orderNumber };
  });
});
```

### كيفية الترحيل:
1. `firebase init functions` → اختر TypeScript
2. اكتب الـ functions
3. في `order.html` استبدل `db.ref().set()` بـ `firebase.functions().httpsCallable('createOnlineOrder')(data)`
4. احذف الـ `onlineOrderCounter` public write من الـ rules

---

## 🟡 Phase 3 — Next.js + TypeScript Migration (3-4 أسابيع)

### لماذا نحتاج Next.js؟
- Server-Side Rendering للـ SEO (الـ menu يظهر لـ Google)
- TypeScript للـ type safety والـ maintainability
- Component reuse بدل تكرار الكود في 6 ملفات HTML
- Build optimization (tree shaking, code splitting)

### الهيكل المقترح:
```
src/
├── app/                          ← Next.js App Router
│   ├── page.tsx                  ← Landing page (index.html)
│   ├── order/page.tsx            ← Online ordering
│   ├── login/page.tsx            ← Login
│   ├── kitchen/page.tsx          ← KDS (auth-gated)
│   ├── waiter/page.tsx           ← Waiter screen
│   ├── cashier/page.tsx          ← Cashier screen
│   └── owner/page.tsx            ← Owner dashboard
├── components/
│   ├── ui/                       ← Button, Input, Modal, Toast...
│   ├── pos/
│   │   ├── OrderTicket.tsx       ← Kitchen ticket component
│   │   ├── MenuCard.tsx          ← Menu item card
│   │   ├── CartSummary.tsx       ← Cart
│   │   └── OrderStatusBadge.tsx
│   └── layout/
│       ├── TopBar.tsx
│       ├── BottomNav.tsx
│       └── Sidebar.tsx
├── hooks/
│   ├── useOrders.ts              ← Firebase realtime orders hook
│   ├── useMenu.ts                ← Menu data hook
│   ├── useAuth.ts                ← Auth + role guard hook
│   └── useTables.ts
├── services/
│   ├── firebase.ts               ← Firebase initialization
│   ├── ordersService.ts          ← Order CRUD operations
│   ├── menuService.ts            ← Menu operations
│   └── analyticsService.ts
├── store/
│   └── useStore.ts               ← Zustand global state
├── types/
│   ├── order.ts                  ← Order, OrderItem interfaces
│   ├── menu.ts                   ← Category, MenuItem interfaces
│   └── user.ts                   ← User, Role types
└── utils/
    ├── sanitize.ts               ← Input sanitization
    ├── formatters.ts             ← Currency, date, time
    └── validators.ts             ← Form validation
```

### خطوات الترحيل:
1. `npx create-next-app@latest tucomida --typescript --tailwind --app`
2. نقل Firebase config إلى `src/services/firebase.ts`
3. إنشاء hooks للـ realtime data
4. بناء components من الكود الموجود
5. ترحيل صفحة واحدة في كل مرة (تبدأ بـ `order/page.tsx`)
6. Testing مع Firebase Emulator
7. Deploy على Firebase Hosting + Next.js adapter

---

## 🟢 Phase 4 — Testing Infrastructure (أسبوع)

```
tests/
├── unit/
│   ├── sanitize.test.ts
│   ├── formatters.test.ts
│   └── validators.test.ts
├── integration/
│   ├── orderFlow.test.ts         ← create → kitchen accept → cashier pay
│   └── authFlow.test.ts          ← login → role redirect
└── e2e/
    ├── customerOrder.spec.ts     ← Playwright: customer submits order
    ├── kitchenFlow.spec.ts       ← Playwright: kitchen accepts + bumps
    └── cashierPayment.spec.ts    ← Playwright: cashier pays order
```

```bash
# استخدم Firebase Emulator للـ testing
firebase emulators:start --only auth,database

# Unit tests
npx vitest

# E2E tests
npx playwright test
```

---

## 🔴 Phase 5 — CI/CD Pipeline (3-5 أيام)

### GitHub Actions workflow:
```yaml
# .github/workflows/deploy.yml
name: Deploy TuComida

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint          # ESLint
      - run: npm run type-check    # tsc --noEmit
      - run: npm test              # Vitest

  preview:
    needs: quality
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SA }}
          channelId: pr-${{ github.event.number }}

  deploy:
    needs: quality
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SA }}
          channelId: live
```

---

## 📊 Phase 6 — Analytics & Monitoring (أسبوع)

### Sentry Integration:
```typescript
// src/utils/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Strip PII before sending
    delete event.user?.email;
    return event;
  }
});

export function trackOrderEvent(event: string, data: Record<string, unknown>) {
  Sentry.addBreadcrumb({ category: 'order', message: event, data });
}
```

### Firebase Analytics events:
```typescript
// Track key business events
analytics.logEvent('order_submitted',   { type, total, item_count });
analytics.logEvent('order_viewed',      { screen: 'kitchen' });
analytics.logEvent('payment_completed', { method, total });
analytics.logEvent('menu_item_added',   { item_id, item_name });
```

---

## 🎨 Phase 7 — Advanced Owner Dashboard (أسبوعان)

### المميزات المقترحة للإضافة:
- **Revenue Heatmap** — خريطة حرارية للمبيعات حسب اليوم والساعة
- **Staff Performance** — مقارنة بين الشيفتات والويترات
- **Inventory Tracking** — تتبع الأصناف المتوقف عنها كثيراً
- **Customer Insights** — أكثر عملاء الأونلاين طلباً
- **Export Reports** — تصدير PDF/Excel للتقارير المالية
- **SMS/WA Campaigns** — إرسال عروض للعملاء السابقين
- **Table Reservation** — نظام حجز الطاولات

---

## 📋 Deploy Checklist (الحالي)

```bash
# deploy الـ Security Rules والـ Hosting معاً
cd "tocomida web"
npx firebase-tools deploy --only hosting,database

# hosting فقط
npx firebase-tools deploy --only hosting

# database rules فقط
npx firebase-tools deploy --only database
```

---

## ⚠️ ملاحظات مهمة قبل الـ Deploy

1. **اختبر الـ Security Rules** في Firebase Console → Simulator قبل الـ deploy
2. **ابدأ Firebase Blaze Plan** قبل الـ Functions (مجاني تقريباً للاستخدام المحدود)
3. **احفظ نسخة** من `database.rules.json` الحالية قبل deploy الجديد
4. **تأكد من الصور** — المشروع يحتاج صور كـ WebP لتحسين الأداء
5. **Custom Domain** — ربط `tucomida.com` بدل `tucomida-pos.web.app` يحسن SEO

---

*TuComida POS — Roadmap v2 | 2026-05-15*
