# 14 Trades Alert PWA — Deploy Guide
# Free forever · No App Store · iOS + Android

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — Generate VAPID keys (push encryption)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run this ONCE on your computer:

  npm install web-push -g
  node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(JSON.stringify(k,null,2))"

You'll get:
  {
    "publicKey":  "Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "privateKey": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }

Save both — you need them in the next steps.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — Update app.js with your public key
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
In public/app.js, replace:
  const VAPID_PUBLIC = 'YOUR_VAPID_PUBLIC_KEY';
With:
  const VAPID_PUBLIC = 'Bxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

Also replace:
  const SERVER = 'https://your-server.up.railway.app';
With your actual Railway URL.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — Deploy PWA to Vercel (free)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Option A — GitHub (recommended):
  1. Push this folder to a GitHub repo
  2. Go to https://vercel.com → Import project → select repo
  3. Deploy — done. You get: https://14trades-alert.vercel.app

Option B — Vercel CLI:
  npm install -g vercel
  cd 14trades-pwa
  vercel --prod

Add environment variable in Vercel dashboard:
  RAILWAY_SERVER_URL = https://your-server.up.railway.app

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — Add web-push to Railway server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
In your Railway server:
  npm install web-push

Add to Railway environment variables:
  VAPID_PUBLIC_KEY  = your public key from Step 1
  VAPID_PRIVATE_KEY = your private key from Step 1
  VAPID_EMAIL       = mailto:sadikh@youremail.com

Copy webpush.js into your Railway project root, then
in server.js add at the top:
  const { setupWebPushRoutes, sendWebPush } = require('./webpush');

And after app setup:
  setupWebPushRoutes(app, users);

And in your signal/tp/sl handlers replace:
  sendPushNotification(...)
With also calling:
  sendWebPush(...)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — Custom domain (optional, free)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
In Vercel → Settings → Domains → Add domain
Use: alerts.14trades.com (or any domain you own)
Vercel sets up SSL automatically.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEMBER INSTALL INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Send this to your members:

─── ANDROID (Chrome) ───────────────────
1. Open Chrome → go to https://14trades-alert.vercel.app
2. Tap the menu (⋮) → "Add to Home screen"
3. Tap "Add"
4. App icon appears on your home screen
5. Open app → tap the 🔔 bell → allow notifications
Done ✓

─── iPHONE (Safari) ────────────────────
Requires iOS 16.4 or later (iPhone 8 and newer from 2023+)
1. Open Safari → go to https://14trades-alert.vercel.app
2. Tap the Share button (□↑)
3. Scroll down → tap "Add to Home Screen"
4. Tap "Add"
5. Open app → tap the 🔔 bell → allow notifications
Done ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT MEMBERS GET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ App icon on home screen (looks exactly like a real app)
✓ Full screen — no browser bar
✓ Push notifications even when app is closed
✓ Countdown with BUY/SELL direction
✓ Live trade card with TP1/2/3 and SL
✓ TP hit animations (green pulse + shine)
✓ SL hit animation (red flash + card dims)
✓ Signal history

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COSTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Vercel hosting:    FREE (100GB bandwidth/month)
Railway server:    FREE tier (or ~$5/month for always-on)
Domain (optional): ~$10/year
App Store fee:     $0 — not needed
Total:             FREE or ~$5/month
