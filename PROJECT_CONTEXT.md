# TuComida POS — Project Context & Session Log

This file is a complete handover document for the `tucomida-pos` project, written so any AI
tool/agent can pick up work on it without prior context. It covers the architecture, data
model, known issues, and a detailed log of everything done in the most recent working session.

---

## 1. What this project is

A single-restaurant Point-of-Sale (POS) + online ordering system for **TuComida**, a healthy-food
restaurant in New Damietta, Egypt. It is a vanilla JS Progressive Web App (no frontend framework)
backed by **Firebase Realtime Database** (RTDB) and **Firebase Hosting**, with Firebase Cloud
Functions for backend logic (`functions/` directory).

Live URL: `https://tucomida-pos.web.app`

### Apps / entry points (all under `public/`)
| Path | Audience | Purpose |
|---|---|---|
| `public/owner/index.html` | Owner (full access) | Orders, menu management, reports, expenses, inventory, activity log, tables |
| `public/cashier/index.html` | Cashier | New orders, active orders, reports, end-of-day |
| `public/waiter/index.html` | Waiter | Take orders at tables |
| `public/kitchen/index.html` | Kitchen | Live ticket display, sound/visual alerts on new/edited orders |
| `public/order.html` | Public customers (unauthenticated) | Online menu browsing + ordering (delivery/pickup), confirms via WhatsApp |
| `public/shared/firebase-config.js` | Shared helper script | Loaded by owner/cashier/waiter/kitchen (NOT by `order.html`, which has its own inline Firebase v10-compat init) |

Each app is a **single large HTML file** with inline `<style>` and `<script>` — there is no build
step, no bundler, no component framework. Edits are made directly in these files.

---

## 2. Tech stack

- **Frontend**: Vanilla HTML/CSS/JS, RTL Arabic UI for staff apps (owner/cashier/waiter/kitchen),
  bilingual-but-mostly-English UI for the customer-facing `order.html` (`dir="rtl"` but English copy).
- **Backend**: Firebase Realtime Database (NoSQL JSON tree), Firebase Auth (email/password,
  role stored in `users/{uid}/role`), Firebase Cloud Functions (`functions/`), Firebase Hosting.
- **No npm build** for the `public/` folder — it's deployed as static files directly.
- **CI/CD**: GitHub Actions, `.github/workflows/firebase-deploy.yml` — triggers on push to `main`,
  runs `firebase deploy --only hosting,database --token ... --project tucomida-pos`.
  (As of this session, `database` was added to that deploy target — previously only `hosting` was
  deployed automatically, meaning rule changes needed manual `firebase deploy --only database`.)
- **Security rules**: `database.rules.json` at repo root, deployed via the same CI step.
- **Repo**: `hodaharraz1/tucomida-pos` on GitHub. Work in this session happened on branch
  `claude/jolly-ritchie-1ye8yi`, which is merged into `main` after every change (see workflow note below).

---

## 3. Firebase Realtime Database — data model

Root-level keys (each is its own top-level node with its own security rules in `database.rules.json`):

### `menu`
```
menu/
  categories/
    {catId}/  { name, nameAr?, active: bool, order: number }
  items/
    {itemId}/ {
      name,              // intended to be ENGLISH display name
      nameAr,            // Arabic name — see KNOWN ISSUE #1 below
      categoryId,
      active: bool,
      description?,      // ingredients/description text, shown on order.html food cards
      singlePrice?,       // flat price (mutually exclusive with `sizes`)
      sizes?: {            // size-based pricing
        M: { price, calories?, protein? },
        L: { price, calories?, protein? }
      },
      isNew?: bool,        // shows a "New"/"جديد" badge
      isPlan?: bool,       // renders via buildPlanCard instead of buildFoodCard on order.html
      period?: string,     // e.g. "/week" for plan-style items
      createdAt, updatedAt
    }
```
- `.read: true` (public) — anyone can read the menu, including unauthenticated website visitors.
- `.write`: only `auth != null` AND `users/{uid}/role` matches `owner|cashier|waiter`.
- This means **the public website can read the menu but cannot write it** — only staff apps
  (after login) can edit items/categories, via the Owner panel's menu editor UI.

### `itemSales` (added this session)
```
itemSales/
  {itemId}: <number>   // running counter, incremented by `recordItemSales()` on every order placed
```
- `.read: true` (public).
- `.write`: `auth == null` (unauthenticated, for the public website) OR staff role
  `owner|cashier|waiter`.
- **Currently NOT used for the "Best Sellers" tab** (see section 5 — the tab was switched to a
  hardcoded curated list instead), but the counter is still being incremented on every order across
  all four ordering surfaces (owner/cashier/waiter/order.html), so the data is being collected for
  potential future use (e.g. a real data-driven best-sellers feature, or reporting).

### `orders` (dine-in / takeaway — placed via owner/cashier/waiter)
```
orders/{orderId}/ {
  orderNumber, type: "dine-in"|"takeaway",
  tableId?, tableNumber?,
  status: "pending"|"preparing"|"ready"|"completed"|"cancelled",
  items: [ { itemId, name, size?, price, quantity, notes } ],
  subtotal, discount, discountType?, discountVal?, total, paymentMethod,
  createdAt, createdBy (uid), createdByRole, updatedAt,
  cancelRequested, cancelRequestedBy, cancelRequestedAt, cancelApproved, cancelApprovedBy,
  dayId,       // see KNOWN ISSUE #2 below — UTC-based, NOT local-midnight-based
  sessionId,
  notes?       // order-level notes (owner can add these)
}
```
- `.read`/`.write`: staff roles only (`waiter|cashier|owner|kitchen`, kitchen is read+status-write only in practice).
- Indexed on `dayId, createdAt, status, sessionId`.

### `online_orders` (delivery/pickup — placed via `order.html`, unauthenticated)
- Similar shape to `orders` but includes `customerName`, `customerPhone`, `customerAddress`, `type: "delivery"|"pickup"`.
- Security rules allow **unauthenticated create** (status must be `pending`, timestamp must be
  within ±10 min of server time, total capped at 50,000 EGP, phone/name length-validated) but only
  staff (`cashier|owner|kitchen`) can modify/read existing ones.
- **Important nuance**: as currently implemented, `order.html`'s `submitOnlineOrder()` does NOT
  actually write to `online_orders` in the database — it builds a WhatsApp deep-link message and
  opens `wa.me/...`, relying on the customer to send it manually via WhatsApp. (This was observed
  directly in the code during this session; it may be worth flagging to the project owner if they
  believe online orders are being persisted to Firebase automatically — they are not, currently.)

### `tables`
`{ number, status: "available"|"occupied" }` — staff roles only.

### `sessions`
Day/session tracking for cashier sessions — owner/cashier only.

### `settings`
- `settings/orderCounter`, `settings/onlineOrderCounter` — sequential order numbering (the latter
  has a special rule allowing anonymous increment-by-exactly-1 writes, to support unauthenticated
  order numbering from the website).
- `settings/currentDayId`, `settings/currentSession` — staff-readable.
- `settings/plans` — **public read** (so the website can show plan prices without login), staff write.

### `activity_log`
Append-only audit log of staff actions (`new_order`, menu changes via `menu_changes`, etc.) — owner-read-only, staff-write.

### `users/{uid}`
`{ email, role: "owner"|"cashier"|"waiter"|"kitchen" }` — self-read/write, owner can manage all;
role field itself can only be changed by an existing owner (prevents privilege escalation).

### `expenses`, `inventory`, `presence`
Owner-only / role-gated nodes for expense tracking, stock levels, and online/offline presence pings.

---

## 4. Known issues / data-quality problems

### ISSUE #1 (CONFIRMED, UNFIXED as of this document): Arabic text in the English `name` field
**37 menu items** across 4 active, publicly-visible categories have their `name` field filled with
**Arabic text** instead of an English translation (the `nameAr` field duplicates the same Arabic
text). Since `order.html`'s card renderer uses `item.name || item.nameAr`, these items render in
Arabic on the otherwise-English customer ordering website — confirmed visually via a user screenshot
of the "PROTEIN" category tab.

Affected categories: **TATBELA CHICKEN** (10 items), **TATBELA MEAT** (9 items), **PROTEIN**
(11 items), **SIDE DISH** (7 items).

**Why this wasn't fixed via direct DB write**: `menu` write access requires an authenticated
Firebase session with role `owner|cashier|waiter` (see rules above). The assistant working in this
session only had unauthenticated REST read access to the public `menu` node (since `.read: true`),
and explicitly does **not** have — and was not given — owner login credentials. The user was asked
to either (a) manually re-enter the translated names via the Owner panel's menu editor, or
(b) share an owner email/password so the assistant could sign in via the Firebase Auth REST API
(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<API_KEY>`) and then
PATCH the `menu/items/{id}/name` fields directly via the RTDB REST API
(`https://<db>.firebaseio.com/menu/items/{id}/name.json?auth=<ID_TOKEN>`). At the time this document
was written, **no credentials had been provided yet**, so the data fix is still pending.

**Ready-to-use translation table** (Arabic name → researched English translation → price → item ID),
for whoever performs the actual edit:

**TATBELA CHICKEN**
| Item ID | Current (Arabic) | New English name | Price (EGP) |
|---|---|---|---|
| `-Ou30E8oMKgXHhgkdlKc` | صدور دجاج اسبيتيال | Espetada Chicken Breast | 175 |
| `-Ou30EBgzF6yIt-g7NG-` | صدور دجاج تندوري | Tandoori Chicken Breast | 175 |
| `-Ou30EEnuD7xMB9AGK-q` | صدور دجاج بالتم يم | Thyme Chicken Breast | 175 |
| `-Ou30EHhhwUvBP-rjmEn` | صدور دجاج بالريحان | Basil Chicken Breast | 180 |
| `-Ou30EKKlABooMeB4762` | صدور دجاج زبده وزعتر كيتو | Keto Butter & Zaatar Chicken Breast | 180 |
| `-Ou30EMvSTzD0gqoZvrA` | صدور بالثوم والعسل | Garlic & Honey Chicken Breast | 175 |
| `-Ou30EPmGh-mXL4vxl6W` | فاهيتا الدجاج | Chicken Fajita | 175 |
| `-Ou30ESWVPoP4zS2Bdn2` | كفتة دجاج تركي | Turkish Chicken Kofta | 175 |
| `-Ou30EV7SVYggamGuZ3y` | برجر دجاج | Chicken Burger | 175 |
| `-Ou30EXhsCTLVy-sDSnC` | شيش طاووق | Shish Tawook | 175 |

**TATBELA MEAT**
| Item ID | Current (Arabic) | New English name | Price (EGP) |
|---|---|---|---|
| `-Ou30E_R-UVdcTXHyad_` | كفته حاتي | Hati Kofta | 230 |
| `-Ou30Ec2nsoGsViA2eVw` | برجر لحم | Beef Burger | 230 |
| `-Ou30EefoJs0KvA7Q77U` | برجر لحم محشي كيتو | Keto Stuffed Beef Burger | 240 |
| `-Ou30EhWsSSRlOkMWFZL` | ميت بولز | Meatballs | 225 |
| `-Ou30Ek7bvR7lJxMoHnl` | سويدش ميت بولز كيتو | Keto Swedish Meatballs | 225 |
| `-Ou30EmhmKgG5hIz1_KN` | تاكو بيف | Beef Taco | 200 |
| `-Ou30EpYiVVDWpejbEc5` | دجاج للشوي | Grilled Whole Chicken | 240 |
| `-Ou30Etlyx-IE898gmsW` | أوراك للشوي | Grilled Chicken Thighs | 160 |
| `-Ou30EwTQkCthP7igkWR` | كوردن بلو | Cordon Bleu | 180 |

**PROTEIN**
| Item ID | Current (Arabic) | New English name | Price (EGP) |
|---|---|---|---|
| `-Ou30EzJIOFc8jqMsDrs` | صدور فيليه مشويه | Grilled Chicken Fillet | 120 |
| `-Ou30F0uklJF13rSPTnK` | صدور ليمون ديل | Lemon Dill Chicken Breast | 135 |
| `-Ou30F3UKsXdqtIjSniH` | صدور بيكاتا | Chicken Piccata Breast | 135 |
| `-Ou30F63sErUP5FXi62t` | صدور رانشي | Ranch Chicken Breast | 125 |
| `-Ou30F8ehJozf-bmGL-Q` | صدور فاهيتا | Fajita Chicken Breast | 120 |
| `-Ou30FBO_0TlQeWm1V4Y` | شيش طاووق بروتين | Shish Tawook (Protein) | 120 |
| `-Ou30FE1wDgwX62g0hjA` | كفته دجاج تركي بروتين | Turkish Chicken Kofta (Protein) | 120 |
| `-Ou30FGmXBPwltdsh1KS` | برجر دجاج بروتين | Chicken Burger (Protein) | 120 |
| `-Ou30FJZtv0ru6imOdwU` | ميت بولز بالصوص | Meatballs in Sauce | 160 |
| `-Ou30FMPICTcj8nuJvys` | كفته مشويه | Grilled Kofta | 160 |
| `-Ou30FPNuQR057Rd8Fkz` | برجر لحم بروتين | Beef Burger (Protein) | 160 |

**SIDE DISH**
| Item ID | Current (Arabic) | New English name | Price (EGP) |
|---|---|---|---|
| `-Ou30FS3rMpS4DbT2Z3k` | أرز بسمتي | Basmati Rice | 40 |
| `-Ou30FUjKRj96yl_zmgS` | باستا وايت صوص | Pasta White Sauce | 50 |
| `-Ou30FXZjEf_rOTfI-_y` | باستا ريد صوص | Pasta Red Sauce | 45 |
| `-Ou30F_Gv48Eb-j6NrfB` | بيستو باستا سايد | Pesto Pasta (Side) | 50 |
| `-Ou30FbuvNPn76pPI8X2` | فرايز ايرفراير | Air Fryer Fries | 40 |
| `-Ou30Fec8qWn6MgIwMqu` | بطاطس مهروسة | Mashed Potatoes | 40 |
| `-Ou30FhNoWPWIOIsb_QJ` | سلطة خضراء | Green Salad | (no price set) |

**To apply this fix**, either:
1. Manually edit each item's "Name" field in the Owner panel's menu editor, using the table above, or
2. Have someone with valid owner credentials (or the Firebase project owner, via the Firebase
   Console directly) run a one-time script that PATCHes `menu/items/{id}/name` for each row above.

### ISSUE #2 (FIXED this session, but the underlying fragility remains elsewhere): UTC-based day rollover
`getDayId()` in `public/shared/firebase-config.js`:
```js
function getDayId() {
  return new Date().toISOString().split('T')[0];
}
```
This returns the **UTC** calendar date, not the local (Cairo, UTC+2) calendar date. Day-scoped
Firebase queries (`.orderByChild('dayId').equalTo(dayId)`) that capture `dayId` once and keep a
long-lived listener open will silently stop matching new orders starting at **2:00 AM Cairo time**
(when UTC rolls to the next day) until the page is refreshed and `dayId` is recomputed. This was the
root cause of the kitchen screen "needing frequent refresh" bug reported by the user.

**Fix applied**: in `public/kitchen/index.html`'s `listenOrders()`, added a self-healing check:
```js
setInterval(() => {
  if (getDayId() !== _today) location.reload();
}, 60000);
```
This pattern was **only** applied to the kitchen screen. If similar long-lived day-scoped listeners
exist elsewhere (e.g. cashier's `listenActiveOrders()`-equivalent, owner's order screens), they
carry the same latent risk and were not audited/fixed in this session — worth checking if similar
"needs refresh" complaints arise for other screens during overnight hours.

### ISSUE #3 (the original motivating bug, FIXED): duplicate ingredient/description text on `order.html`
Some menu items had their `nameAr` field mistakenly filled with the same text as their `description`
field (an ingredients list), causing both to render and look like duplicated text on food cards.
**Final fix** (in `buildFoodCard()` in `order.html`): never render the `nameAr` line at all when
`item.description` is truthy, regardless of whether the two strings match exactly — this is robust
even against near-duplicate (not character-for-character identical) text, which an earlier attempted
fix using exact string comparison failed to catch.

---

## 5. Feature work completed this session (chronological)

> All of the below was committed on branch `claude/jolly-ritchie-1ye8yi`, then merged into `main`
> and pushed, per the user's standing instruction: *"اه بعد كل تعديل تعمله ارفعه علشان انا اشوفه"*
> ("yes, after every edit you make, push it so I can see it") — meaning every change in this log was
> deployed to production after being made, without needing to re-ask each time.

1. **Owner mobile new-order screen layout fix** — notes textarea was overlapping the table-select
   dropdown on mobile. Fixed by making the notes field collapsible (`oToggleNotes()`) and
   dynamically syncing the fixed footer's height into a `--o-ftr-pad` CSS variable
   (`oSyncFooterPadding()`), recalculated via `requestAnimationFrame` on screen-switch, notes-toggle,
   resize, and order-reset.

2. **Cashier edit-order modal save button hidden behind bottom nav** — root cause: `.modal-bg` and
   `.mob-bottom-nav` both had `z-index:200`, so paint order let the nav bar cover the modal's save
   button on mobile. Fixed by bumping `.modal-bg` to `z-index:300` (cashier only; owner and waiter's
   modal/nav z-indices were already safely separated).

3. **Kitchen screen needing frequent manual refresh** — see Issue #2 above. Fixed with a self-healing
   `setInterval` + `location.reload()` check.

4. **Kitchen/cashier not alerting on order EDITS** (only alerted on brand-new orders or status
   changes) — fixed by comparing `o.updatedAt` against a previously-cached `prev.updatedAt` inside
   each `child_changed` Firebase listener; if newer, re-trigger the sound/visual alert
   (`playNewOrderBeep()` / `flashCard()` / `flashTicket()`).

5. **`order.html` menu page improvements**:
   - Removed `-webkit-line-clamp` description truncation so full ingredient lists show.
   - Added the ability for a customer to **edit their cart before confirming**: per-item quantity
     +/-, per-item remove, and a "cancel whole order" button — both inside the checkout modal
     (`renderCheckoutItems()`, `checkoutChangeQty()`, `removeCheckoutItem()`, `cancelOnlineOrder()`)
     and as a quick-access button directly in the floating cart bar (`.float-cart-cancel-btn`).
   - Fixed the duplicate-ingredients-text bug (Issue #3 above).

6. **Owner Reports — click-to-view full order detail**: clicking a calendar day in the monthly
   report now lets you click any individual past order to open a full read-only modal
   (`#histOrderModal`, `openHistOrder()`) showing all items/prices/quantities/notes/payment
   method/email/total — previously the day list only showed a truncated item summary. Reuses the
   existing `printLogReceipt()` print logic.

7. **Same feature ported to Cashier's Reports page** (`openHistOrderC()`, `#histOrderModal` with
   cashier-specific markup, `_reportOrdersCache` populated from the data already loaded for stats
   — no extra Firebase fetch needed), since cashier's reports page previously had **no** order list
   at all, only aggregate stats.

8. **Cashier new-order screen layout widened/narrowed** (tablet ergonomics fix): the cart/order
   panel (the large white area the user called "الحتة البيضا") was shrunk and the menu grid widened,
   across desktop (`350px` → `290px` cart column), the two tablet breakpoints
   (`768–1023px`: `255px → 215px` cart, menu min-width `115px → 105px`; `1024–1279px`: `295px → 250px`
   cart, menu min-width `122px → 115px`), and mobile (stacked cart `max-height: 55vh → 40vh`,
   `min-height: 200px → 160px`).

9. **Removed the "All" category tab system-wide, replaced with "Best Sellers"** — across cashier,
   owner, waiter, and `order.html`. Implementation went through **two iterations**:
   - **First iteration**: a live `itemSales/{itemId}` counter (incremented via
     `recordItemSales()` — added to `public/shared/firebase-config.js` — called from every order
     submission path: cashier's `submitCashierOrder()`, owner's `oSubmitOrder()`, waiter's
     `submitOrder()`, and `order.html`'s `submitOnlineOrder()`), with the "Best Sellers" tab
     rendering the top 16 items sorted by that counter descending, falling back to showing the
     plain list of active menu items when no sales data existed yet (to avoid an empty tab).
   - **Second iteration (final, current state)**: per explicit user request
     ("بص في الاكثر مبيعا هتحط داول Tokyo, Toxic, Casdia, Barry, Crunchy wrap, Delight, Brownie, Pesto
     وتشيل الي انت حطتتها في كله بقا"), the sales-counter-driven logic was **replaced** with a fixed
     curated list of item names, matched case-insensitively by substring against `item.name`:
     ```js
     const BEST_SELLER_NAMES = ['Tokyo','Toxic','Casdia','Barry','Crunchy wrap','Delight','Brownie','Pesto'];
     function pickBestSellers(itemsObj) {
       const entries = Object.entries(itemsObj || {});
       const result = [];
       BEST_SELLER_NAMES.forEach(name => {
         const nameLower = name.toLowerCase();
         entries.forEach(([id, item]) => {
           if (item && item.active !== false &&
               (item.name || '').toLowerCase().includes(nameLower) &&
               !result.some(([rid]) => rid === id)) {
             result.push([id, item]);
           }
         });
       });
       return result;
     }
     ```
     This function lives in `public/shared/firebase-config.js` (used by owner/cashier/waiter) and is
     **duplicated inline** in `order.html` (since that page doesn't load the shared config file).
   - The `itemSales` counter-incrementing calls (`recordItemSales(...)`) were **left in place** in
     all four order-submission paths — they are currently unused by the UI but continue silently
     collecting real sales data, in case a future data-driven version of this feature is wanted.
   - **Database rule added**: a new `itemSales` node in `database.rules.json` — public read,
     write allowed for unauthenticated users (needed for the public website to record sales) or
     staff roles, validated as a non-negative number capped at 1,000,000.
   - **CI workflow updated**: `.github/workflows/firebase-deploy.yml` now deploys
     `--only hosting,database` instead of just `--only hosting`, so future `database.rules.json`
     changes actually take effect on push (previously they would silently not deploy via CI).

10. **"⭐ Best Sellers" tab label language fix**: initially written in Arabic ("⭐ الأكثر مبيعاً") even
    on `order.html`, which is an otherwise English-language page — user caught this
    ("اكتبها في الموقع بالانجلش مش بالعربي... الموقع كله انجلش وانت كتبها عربي") and it was corrected
    to "⭐ Best Sellers" in `order.html` only (cashier/owner/waiter keep the Arabic label, since
    those staff apps are Arabic-UI throughout).

11. **"New" badge language fix**: the `<span class="new-tag">جديد</span>` badge shown on `order.html`
    food cards (for items with `isNew: true`) was also Arabic on the English site — changed to
    `<span class="new-tag">New</span>`.

12. **Identified but NOT fixed**: the 37-Arabic-menu-item-name data issue (Issue #1 above), discovered
    when the user sent a screenshot showing Arabic item names in the PROTEIN tab on the live site.

---

## 6. Pending / unresolved at the time of this document

- **Issue #1 is still unresolved** — the 37 Arabic-named menu items have not been corrected in the
  database. This requires either manual editing via the Owner panel, or an authenticated write
  (owner/cashier/waiter Firebase Auth credentials), which has not yet been provided to the assistant
  working in this session.
- The `database.rules.json` `itemSales` addition and the CI workflow change to deploy `database`
  rules will only take effect once the corresponding commit's CI run completes on `main` (the
  assistant's sandbox had no authenticated `firebase` CLI session, so rules could not be deployed
  manually — they rely on the GitHub Actions workflow).
- `order.html`'s online order flow does not currently persist orders to `online_orders` in Firebase
  — it only opens a pre-filled WhatsApp message. If the business expects online orders to appear
  automatically in the cashier/owner/kitchen apps the same way dine-in orders do, this is a gap
  worth raising with the project owner (not something that was asked to be fixed this session).
- No audit was done of whether other long-lived day-scoped Firebase listeners (outside the kitchen
  screen) have the same UTC-day-rollover fragility described in Issue #2.

---

## 7. Working conventions observed in this codebase (for future edits)

- **No npm build for `public/`** — files are deployed as-is via Firebase Hosting. Don't introduce a
  bundler/transpiler without discussing it first; everything is hand-written vanilla JS/CSS/HTML.
- **Inline `<script>` per page** — before committing any HTML-file edit, sanity-check the inline
  script's syntax, e.g.:
  ```js
  const fs = require('fs');
  const body = fs.readFileSync('public/cashier/index.html', 'utf8');
  const scripts = [...body.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)];
  scripts.forEach(m => new Function(m[1])); // throws on syntax errors
  ```
  (Skip any `<script type="application/ld+json">` blocks — those aren't JS.)
- **Git workflow used this session**: commit on `claude/jolly-ritchie-1ye8yi`, push, then
  `git checkout main && git merge --no-edit claude/jolly-ritchie-1ye8yi && git push origin main`,
  then switch back to the feature branch. This was done after every single change, per the user's
  standing deploy-immediately instruction quoted in section 5.
- **RTL Arabic UI** for owner/cashier/waiter/kitchen (`dir="rtl"`, Arabic copy throughout) vs.
  **English UI** for `order.html` (despite also being `dir="rtl"` for layout-mirroring reasons,
  all *visible copy* should be English — see items 10 and 11 above for two cases where this was
  initially gotten wrong and had to be corrected).
- **Public read / staff-only write** is the general security posture for anything customer-facing
  (menu, plans, item sales counters) — always double check `database.rules.json` before assuming a
  write will succeed from an unauthenticated context.
- The assistant in this session had **no Firebase CLI authentication** and **no app login
  credentials** — all Firebase interaction was done either through each app's already-logged-in
  client-side code (edited as source files, never executed directly by the assistant) or via plain
  unauthenticated `curl` reads against the public REST endpoint
  (`https://tucomida-pos-default-rtdb.firebaseio.com/<path>.json`). Any future agent wanting to
  directly mutate data (rather than edit app source code) will need either:
  - valid owner/cashier/waiter login credentials (to use the Firebase Auth REST API +
    RTDB REST API with an ID token), or
  - an authenticated `firebase login` session / service account, to use the Firebase CLI or Admin SDK.
