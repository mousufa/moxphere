# Moxphere

A private life-audit app: health, study (pharma core, non-clinical career, tech), social self, akhira, self care and side hustles, with an hour-by-hour plan, focus timer, journal, a "Me, by me" page and a weekly audit.

It is an installable web app (PWA). It works offline, keeps your data on each device, and syncs between your laptop and phone through your own free Supabase project.

## Run it on this laptop

```
npm install
npm run dev
```

Open the address it prints (usually http://localhost:5173).

## Turn on sync (once, about 5 minutes)

1. Go to https://supabase.com, sign up, and create a new project (free plan). Choose any name and a database password, and the region closest to you (Mumbai).
2. In the project, open **SQL Editor → New query**, paste everything from `supabase/schema.sql`, and click **Run**.
3. Open **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
4. Either paste them in the app under **Settings → Sync**, or put them in a `.env` file (copy `.env.example`) before building, so every device gets them automatically.
5. In the app, **Create account** with your email and a password, confirm the email, then sign in on each device with the same account.

The anon key is safe to ship in the app. Your rows are protected by the row-level security rules in `schema.sql`: only your signed-in account can read or write them.

## Put it online

Build with `npm run build`; the `dist` folder is the whole app. Any static host works. Two easy options:

- **Vercel**: `vercel login`, then `vercel --prod` from this folder. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the Vercel project.
- **GitHub Pages**: push the repo, then publish `dist`. If the site lives under `/moxphere/`, build with `BASE_PATH=/moxphere/ npm run build`.

Then open the site on your phone and choose **Add to Home screen** / **Install app**.

## How data is stored

Every piece of data is a small JSON document (for example `d/2026-11-08/health` or `hustle/pinned`). Documents are saved to IndexedDB on the device first and pushed to the `docs` table when online. If the same document is edited on two devices, the most recent edit wins.

**Settings → Backup** downloads everything as one JSON file, and can restore it. It also imports a backup from the first single-page Moxphere (kept in `legacy/`).
