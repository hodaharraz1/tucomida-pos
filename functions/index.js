/**
 * TuComida Cloud Functions v2.0
 * Firebase Blaze plan required.
 *
 * Functions included:
 *  1. scheduledDailyBackup    — ينسخ كل البيانات يومياً إلى Firebase Storage
 *  2. scheduledWeeklyCleanup  — يحذف السجلات القديمة (أكثر من 90 يوم)
 *  3. onNewOnlineOrder        — يرسل إشعار فوري عند طلب جديد من الموقع
 *  4. manualBackupTrigger     — HTTP trigger للـ backup اليدوي من الـ Owner Dashboard
 *
 * Deploy: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();

const db      = admin.database();
const storage = admin.storage();
const BUCKET  = admin.storage().bucket(); // default bucket

/* ══════════════════════════════════════════════════
   1. SCHEDULED DAILY BACKUP — كل يوم الساعة 2 صباحاً (Cairo UTC+2)
   Schedule: '0 0 * * *' = 12:00 AM UTC = 2:00 AM Cairo
══════════════════════════════════════════════════ */
exports.scheduledDailyBackup = functions
  .region('europe-west1')
  .pubsub
  .schedule('0 0 * * *')          // 2 AM Cairo (UTC+2)
  .timeZone('Africa/Cairo')
  .onRun(async (context) => {
    return runBackup('scheduled');
  });

/* ══════════════════════════════════════════════════
   2. MANUAL BACKUP — HTTP trigger (owner only)
   POST https://{region}-tucomida-pos.cloudfunctions.net/manualBackupTrigger
   Headers: Authorization: Bearer {idToken}
══════════════════════════════════════════════════ */
exports.manualBackupTrigger = functions
  .region('europe-west1')
  .https
  .onRequest(async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', 'https://tucomida-pos.web.app');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST')    { res.status(405).send('Method not allowed'); return; }

    // Verify Firebase ID Token
    const authHeader = req.headers.authorization || '';
    const idToken    = authHeader.replace('Bearer ', '');
    if (!idToken) { res.status(401).json({ error: 'Unauthorized' }); return; }

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const snap    = await db.ref(`users/${decoded.uid}/role`).once('value');
      if (snap.val() !== 'owner') {
        res.status(403).json({ error: 'Owner role required' });
        return;
      }

      const filename = await runBackup('manual');
      res.status(200).json({ success: true, filename, triggeredBy: decoded.uid });

    } catch(e) {
      console.error('Manual backup error:', e);
      res.status(500).json({ error: e.message });
    }
  });

/* ══════════════════════════════════════════════════
   3. WEEKLY CLEANUP — يمسح السجلات الأقدم من 90 يوم
   Runs every Sunday at 3 AM Cairo
══════════════════════════════════════════════════ */
exports.scheduledWeeklyCleanup = functions
  .region('europe-west1')
  .pubsub
  .schedule('0 1 * * 0')          // Sunday 3 AM Cairo (UTC+2)
  .timeZone('Africa/Cairo')
  .onRun(async () => {
    const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
    const cutoff      = Date.now() - NINETY_DAYS;
    let   deleted     = 0;

    // Clean old activity logs
    const logSnap = await db.ref('activity_log')
      .orderByChild('timestamp')
      .endAt(cutoff)
      .once('value');

    const updates = {};
    logSnap.forEach(child => {
      updates[`activity_log/${child.key}`] = null;
      deleted++;
    });

    // Clean old completed/cancelled orders (keep 90 days)
    const ordSnap = await db.ref('orders')
      .orderByChild('createdAt')
      .endAt(cutoff)
      .once('value');

    ordSnap.forEach(child => {
      const o = child.val();
      if (['completed','cancelled'].includes(o?.status)) {
        updates[`orders/${child.key}`] = null;
        deleted++;
      }
    });

    if (deleted > 0) await db.ref().update(updates);
    console.log(`[Cleanup] Deleted ${deleted} old records`);
    return { deleted };
  });

/* ══════════════════════════════════════════════════
   4. NEW ONLINE ORDER TRIGGER — يسجّل في activity_log
   (يمكن توسعته لإرسال push notification أو SMS)
══════════════════════════════════════════════════ */
exports.onNewOnlineOrder = functions
  .region('europe-west1')
  .database
  .ref('/online_orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.val();
    if (!order) return null;

    // Log in activity_log as system event
    await db.ref('activity_log').push({
      userId:    'SYSTEM',
      role:      'system',
      action:    'online_order_received',
      timestamp: Date.now(),
      dayId:     new Date().toISOString().split('T')[0],
      details: {
        orderId:      context.params.orderId,
        orderNumber:  order.orderNumber,
        total:        order.total,
        type:         order.type,
        customerName: order.customerName || '',
        notes:        order.notes || '',
        items: (order.items||[]).map(i=>`${i.quantity}× ${i.name}${i.size?` (${i.size})`:''}`).join(', '),
        itemsDetail: (order.items||[]).map(i=>({ name:i.name, size:i.size||null, price:i.price, quantity:i.quantity, notes:i.notes||'' }))
      }
    });

    console.log(`[NewOrder] Online order #${order.orderNumber} received — Total: ${order.total} EGP`);
    return null;
  });

/* ══════════════════════════════════════════════════
   HELPER — Core backup logic
══════════════════════════════════════════════════ */
async function runBackup(triggeredBy = 'scheduled') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const dateStr   = new Date().toISOString().split('T')[0];
  const filename  = `backups/${dateStr}/tucomida_backup_${timestamp}_${triggeredBy}.json`;

  // Fetch all critical collections in parallel
  const [
    ordersSnap, onlineSnap, sessionsSnap,
    usersSnap, logSnap, menuSnap, tablesSnap
  ] = await Promise.all([
    db.ref('orders').orderByChild('createdAt').limitToLast(10000).once('value'),
    db.ref('online_orders').orderByChild('createdAt').limitToLast(5000).once('value'),
    db.ref('sessions').once('value'),
    db.ref('users').once('value'),
    db.ref('activity_log').orderByChild('timestamp').limitToLast(5000).once('value'),
    db.ref('menu').once('value'),
    db.ref('tables').once('value')
  ]);

  const backupData = {
    metadata: {
      timestamp:    new Date().toISOString(),
      triggeredBy,
      version:      '2.0.0',
      projectId:    'tucomida-pos'
    },
    orders:        ordersSnap.val()  || {},
    online_orders: onlineSnap.val()  || {},
    sessions:      sessionsSnap.val()|| {},
    users:         usersSnap.val()   || {},
    activity_log:  logSnap.val()     || {},
    menu:          menuSnap.val()    || {},
    tables:        tablesSnap.val()  || {}
  };

  const json = JSON.stringify(backupData, null, 2);
  const file = BUCKET.file(filename);

  await file.save(Buffer.from(json, 'utf8'), {
    metadata: {
      contentType:  'application/json',
      cacheControl: 'no-cache',
      metadata: {
        triggeredBy,
        timestamp: new Date().toISOString(),
        ordersCount:  Object.keys(backupData.orders).length.toString(),
        onlineCount:  Object.keys(backupData.online_orders).length.toString()
      }
    }
  });

  // Log backup event in DB
  await db.ref('activity_log').push({
    userId:    triggeredBy === 'scheduled' ? 'SYSTEM' : 'owner',
    role:      'system',
    action:    'backup_completed',
    timestamp: Date.now(),
    dayId:     dateStr,
    details:   { filename, triggeredBy, sizeKB: Math.round(json.length / 1024) }
  });

  console.log(`[Backup] ✅ ${filename} — ${Math.round(json.length / 1024)} KB`);
  return filename;
}
