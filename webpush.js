// 14 Trades Alert — Web Push (add to server.js on Railway)
// Handles browser push subscriptions (PWA members)

const webpush = require('web-push');

// ─── VAPID keys — generate ONCE and store in Railway env vars ──────
// Run this ONE TIME in terminal to generate your keys:
//   node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(k)"
// Then set in Railway:
//   VAPID_PUBLIC_KEY  = the publicKey value
//   VAPID_PRIVATE_KEY = the privateKey value
//   VAPID_EMAIL       = mailto:you@youremail.com

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ─── Store subscriptions (replace with DB in production) ──────────
const webSubscriptions = new Map(); // email → subscription object

// ─── Save subscription when member enables push in browser ────────
// POST /push/subscribe-web
function setupWebPushRoutes(app, users) {
  app.post('/push/subscribe-web', (req, res) => {
    const auth  = req.headers.authorization;
    const token = auth?.replace('Bearer ', '');

    // Find user by token (simplified — use proper JWT verify in prod)
    const user = [...users.values()].find(u => u.token === token);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    webSubscriptions.set(user.email, req.body);
    console.log(`[WEB PUSH] Subscription saved for ${user.email}`);
    res.json({ ok: true });
  });
}

// ─── Send web push to all subscribed browsers ─────────────────────
async function sendWebPush({ title, body, type, asset, direction, level }) {
  const payload = JSON.stringify({ title, body, type, asset, direction, level });

  const promises = [...webSubscriptions.values()].map(sub =>
    webpush.sendNotification(sub, payload).catch(err => {
      if (err.statusCode === 410) {
        // Subscription expired — remove it
        for (const [email, s] of webSubscriptions) {
          if (s.endpoint === sub.endpoint) webSubscriptions.delete(email);
        }
      }
    })
  );

  await Promise.allSettled(promises);
  console.log(`[WEB PUSH] Sent "${title}" to ${webSubscriptions.size} browsers`);
}

module.exports = { setupWebPushRoutes, sendWebPush };
