# IntentOS — Deployment Guide

> This is a **private reference doc** for deploying the IntentOS app online.

---

## Understanding the Project Structure

IntentOS is a **monorepo**. The backend does not contain all its code inside `backend/` — it imports from several sibling folders at runtime. This means you **must push the entire root folder to GitHub**, not just `frontend/` or `backend/` in isolation.

Here's what each folder does and whether it needs to be deployed:

```
intentos/  (push the ENTIRE root to GitHub)
│
├── frontend/              ✅ Deployed to Vercel (Next.js app)
├── backend/               ✅ Entry point for Railway (Express API)
│
├── agent-orchestrator/    ✅ REQUIRED — imported by backend routes
├── ai-engine/             ✅ REQUIRED — imported by backend routes
├── simulation-engine/     ✅ REQUIRED — imported by backend routes
├── types/                 ✅ REQUIRED — shared TypeScript types
│
├── contracts/             ❌ NOT needed at runtime (Move source code only)
├── execution-engine/      ⚠️ Check if imported (likely needed)
├── config/                ⚠️ May be needed depending on env setup
└── docs/                  ❌ NOT needed
```

**Key insight:** Railway runs the backend from the **repo root**, not just the `backend/` folder. This ensures it has access to `ai-engine/`, `agent-orchestrator/`, `simulation-engine/`, and `types/` which the backend imports directly using relative paths like `../../../ai-engine/src/...`.

---

## Step 1 — Push Code to GitHub

Before deploying anything, make sure your code is pushed to a GitHub repository.

```bash
cd /path/to/intentos

git init                        # if not already a git repo
git add .
git commit -m "deploy: initial submission"
git remote add origin https://github.com/YOUR_USERNAME/intentos.git
git push -u origin main
```

> ✅ Your repo is now on GitHub. Both Vercel and Railway will pull directly from it.

---

## Step 2 — Deploy the Backend to Railway

Railway is the easiest free host for a Node.js Express backend.

### 2a — Create a Railway Account
1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → Sign up with GitHub
3. Authorize Railway to access your GitHub account

### 2b — Create a New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select your `intentos` repository
4. When asked for the **Root Directory**, type: `backend`
5. Click **"Deploy Now"**

### 2c — Add Environment Variables
In your Railway project, click the service → go to the **"Variables"** tab → add these one by one:

| Variable | Value |
|---|---|
| `PORT` | `4000` |
| `NODE_ENV` | `production` |
| `EXECUTION_MODE` | `testnet` |
| `INITIA_RPC` | `https://rpc.testnet.initia.xyz` |
| `INITIA_REST` | `https://lcd.testnet.initia.xyz` |
| `CHAIN_ID` | `initiation-2` |
| `FRONTEND_URL` | _(add your Vercel URL after Step 3 — leave blank for now)_ |
| `CONTRACT_STRATEGY_EXECUTOR` | _(your deployed contract address, or leave placeholder)_ |
| `CONTRACT_PERMISSION_MANAGER` | _(your deployed contract address, or leave placeholder)_ |

### 2d — Get Your Backend URL
After deploying, Railway gives you a public URL. It looks like:
```
https://intentos-backend-production.up.railway.app
```
**Copy this URL — you'll need it in Step 3.**

> ⚠️ **If Railway asks for a start command**, make sure your `backend/package.json` has a `start` script:
> ```json
> "scripts": {
>   "start": "node dist/index.js",
>   "dev": "ts-node src/index.ts"
> }
> ```

---

## Step 3 — Deploy the Frontend to Vercel

Vercel is purpose-built for Next.js and completely free for personal projects.

### 3a — Create a Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** → Continue with GitHub
3. Authorize Vercel

### 3b — Import the Project
1. Click **"Add New Project"**
2. Find your `intentos` repository and click **"Import"**
3. On the configuration screen:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** Click **Edit** → type `frontend` → click **Continue**
   - Leave all build settings as default

### 3c — Add Environment Variables
Before clicking Deploy, scroll down to **"Environment Variables"** and add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Railway backend URL from Step 2d |
| `NEXT_PUBLIC_CHAIN_ID` | `initiation-2` |
| `NEXT_PUBLIC_EXECUTION_MODE` | `testnet` |

### 3d — Deploy
Click **"Deploy"**. Vercel will build and give you a live URL like:
```
https://intentos.vercel.app
```

### 3e — Update CORS on Railway
Go back to your Railway project → **Variables** → update `FRONTEND_URL` to your new Vercel URL:
```
FRONTEND_URL=https://intentos.vercel.app
```
Railway will automatically redeploy.

---

## Step 4 — Test the Live Deployment

1. Visit your Vercel URL
2. Click **"Get Started"** → **"Connect Wallet"**
3. Connect a wallet with some testnet INIT
4. Type `"stake 0.5 init"` in the intent box
5. Confirm the transaction and verify it appears on the [Initia Explorer](https://scan.testnet.initia.xyz)

✅ If the transaction submits and your portfolio updates — the deployment is working end-to-end.

---

## Alternative Free Backend Hosts

If Railway doesn't work for you, here are 3 alternatives:

### Option A — Render (render.com)
- Free "Web Service" tier
- Go to [render.com](https://render.com) → New → Web Service → Connect GitHub
- Set **Root Directory** to `backend`
- Set **Build Command**: `npm install && npm run build`
- Set **Start Command**: `npm start`
- Add all environment variables from the table above
- ⚠️ Free tier **sleeps after 15 min of inactivity** — first request after sleep takes ~30 seconds

### Option B — Fly.io (fly.io)
- Free tier with no sleep, more reliable
- Requires installing the Fly CLI: `brew install flyctl`
- Then from your `backend/` folder:
  ```bash
  flyctl launch
  flyctl deploy
  ```
- Set env vars with: `flyctl secrets set KEY=VALUE`
- Best performance of the free options

### Option C — Vercel Serverless Functions
- If you don't want a separate backend, you can port the Express routes to Next.js API Routes inside `frontend/app/api/`
- This keeps everything in one Vercel deployment
- Trade-off: requires refactoring the Express routes into Next.js route handlers

---

## Troubleshooting

| Problem | Fix |
|---|---|
| CORS error in the browser | Make sure `FRONTEND_URL` on Railway matches your exact Vercel URL (no trailing slash) |
| "Cannot connect to backend" | Verify `NEXT_PUBLIC_API_URL` in Vercel env vars points to Railway (not `localhost`) |
| Wallet won't connect | Check `NEXT_PUBLIC_CHAIN_ID=initiation-2` is set in Vercel |
| Transactions failing silently | Switch `EXECUTION_MODE` to `mock` to test the flow without real funds |
| Railway build fails | Make sure `backend/package.json` has a valid `start` script |

---

*Last updated: March 2026*
