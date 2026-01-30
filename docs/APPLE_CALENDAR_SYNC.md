# Apple Calendar Sync for m-finance-dash

## Current state

- **App calendar** = finance due-dates only: `CalendarModal` shows **upcoming payments** from the Zustand store (`upcomingPayments`).
- **Data**: `UpcomingPayment` = `{ id, icon, title, date (YYYY-MM-DD), cost }`. Stored in `finance-store` and persisted to **localStorage**.
- **No backend**: No `app/api` routes; no server-side storage. Export/import today is JSON file download/upload via `lib/settings/data-io.ts`.

So “sync with Apple Calendar” means: get those due-dates into (and optionally back from) Apple Calendar.

---

## Sync options (by difficulty)

### 1. Easy — One-way export to .ics (download)

**What:** User gets an **.ics file** of all upcoming payments and adds it to Apple Calendar (File → Import, or open the file). Re-export when they add/change payments.

**Effort:** Low (roughly 0.5–1 day).

- Add a small **ICS generator** (e.g. [ical-generator](https://www.npmjs.com/package/ical-generator) or a minimal hand-rolled VCALENDAR/VEVENT builder).
- Map each `UpcomingPayment` to a VEVENT: `title`, `date` (all-day), optional `DESCRIPTION` with cost/currency.
- Reuse existing pattern: read `upcomingPayments` from the store (same as CalendarModal).
- Add a button: e.g. “Export to calendar” in `CalendarModal` or in Settings → Backup section. On click: build ICS string, create blob, trigger download (same approach as `exportBackup` in `lib/settings/data-io.ts`).
- No server, no auth, no new infra. Works with current client-only setup.

**Limitation:** Not automatic. User must re-download and re-import (or replace the imported calendar) when data changes.

---

### 2. Medium — Subscribe URL (one-way, auto-updating in Apple Calendar)

**What:** User adds a **calendar subscription URL** (e.g. `webcal://yoursite.com/api/calendar/feed.ics?token=...`) in Apple Calendar. Apple Calendar periodically fetches that URL; events stay up to date.

**Effort:** Medium–high, and **requires a backend**.

**Why backend:** Apple Calendar (and iCloud) fetches the URL from **their** side. They do not have access to the user’s browser/localStorage. So the URL must point to a **server** that returns ICS for that user. That implies:

- API route (e.g. Next.js `app/api/calendar/feed.ics/route.ts`) that returns `Content-Type: text/calendar` and the ICS body.
- Some way to know *which* user’s data to use: e.g. **secret token in the URL** (`?token=xxx`) and server-side storage that maps `token → user/store snapshot`, or real auth (session/cookie) and server-stored payments.

So you need at least: **server-side storage** for “upcoming payments” (or a cached snapshot) and a way to **push** data from the client to the server when the user changes something (e.g. after add/update/delete of upcoming payments, call an API that updates the server copy). Optional: simple auth or token-based access for the feed URL.

**Limitation:** One-way only (app → Apple). No import from Apple Calendar back into the app.

#### Option 2 — Implementation steps (short list)

You don’t need a separate “calendar service” — you implement it in **your** app (e.g. Next.js API routes + some storage).

1. **Choose where to store feed data**  
   Pick one: **database** (e.g. Vercel Postgres, Supabase, SQLite), or **file/blob storage** (e.g. S3, Vercel Blob). You’ll store “upcoming payments” (or a JSON snapshot) keyed by a **feed token** (or by user id if you add auth).

2. **Create a feed token per user (or per “calendar”)**  
   Generate a secret token (e.g. UUID). Store it with the user or with the feed. The subscribe URL will be:  
   `https://yourdomain.com/api/calendar/feed.ics?token=THAT_TOKEN`  
   (Or put the token in the path if you prefer.)

3. **Add an API route that serves ICS**  
   e.g. `app/api/calendar/feed.ics/route.ts` (or `route.ts` under a path that includes the token).  
   - Read the token from the query (or path).  
   - Load the stored upcoming payments for that token.  
   - Generate ICS (same logic as Option 1: one VEVENT per payment, all-day on `date`).  
   - Return with `Content-Type: text/calendar` and `Content-Disposition: inline` (or attachment).  
   - No auth cookie required for this route — the **token in the URL** is the “auth” for the feed.

4. **Push data from the app to your backend when it changes**  
   Whenever the user adds/updates/deletes an upcoming payment in the app, call an API (e.g. `POST /api/calendar/sync` or `PUT /api/calendar/feed`) that:  
   - Authenticates the user (session/cookie or API key) or accepts the same token if you’re doing token-only.  
   - Writes the current `upcomingPayments` (or minimal fields needed for ICS) to the store you chose in step 1, keyed by that user’s feed token.

5. **Create / expose the subscribe URL in the UI**  
   After the first “publish” or “enable calendar feed”, create the token, save it, then show the user the URL (and a “Copy” button).  
   - Format: `webcal://yourdomain.com/api/calendar/feed.ics?token=...` (Apple Calendar will subscribe to that).  
   - Or `https://...` and tell the user to add it as a calendar subscription.

6. **Optional: simple auth**  
   If you don’t want token-in-URL (e.g. for multi-user with login), use session auth: feed URL is something like `/api/calendar/feed.ics`, and the route reads the session cookie and loads payments for the logged-in user. Then only “logged-in in browser” can get the feed; Apple Calendar would need to send cookies (possible if you use a browser or an app that shares cookies — often not the case for native Calendar). So for **Apple Calendar** subscribing from iOS/macOS, **token-in-URL** is the usual approach.

**Summary for Option 2:** You **don’t** need a third-party calendar service. You **do** need: **storage** (DB or blob) + **one read-only API route** (serve ICS by token) + **one write API** (save upcoming payments when they change) + **token generation and UI** to show the subscribe URL. The “service” is just your own backend (e.g. Next.js API routes + Postgres/Blob).

---

### 3. Hard — Two-way sync with iCloud (CalDAV)

**What:** App and Apple Calendar both read/write the same events; changes in one show up in the other.

**Effort:** High (order of weeks).

- Apple Calendar (iCloud) uses **CalDAV**; there is no official “Apple Calendar API” for third-party sync. You need a **CalDAV client** (e.g. [tsdav](https://www.npmjs.com/package/tsdav)) and a **backend** that:
  - Authenticates with iCloud (app-specific password or, if available, OAuth).
  - Performs REPORT/MKCOL/PUT/DELETE on the user’s calendar collection.
  - Maps `UpcomingPayment` ↔ VEVENT (and handles recurrence if you ever support it).
- Challenges: auth (iCloud has no simple OAuth for “calendar only”), session/cookie handling, **conflict resolution** (same event edited in both places), **no webhooks** (polling only), and UX (which calendar, which account). All of this is server-side; the client would call your API, which then talks CalDAV to iCloud.

**Limitation:** Complex and brittle; only worth it if you need true two-way sync and are willing to maintain a backend and CalDAV integration.

---

## Recommendation

- **Start with (1) — .ics export.** It’s low effort, no backend, and gives real value: users can see their finance due-dates in Apple Calendar. You can add it next to the existing “Export full backup” in Settings or as “Export to calendar” in the Calendar modal.
- **Add (2) only if** you introduce a backend anyway (e.g. for multi-device or auth) and want “subscribe once, always up to date” in Apple Calendar.
- **Treat (3)** as a later, optional step only if you have a clear need for two-way sync and the resources to maintain a CalDAV integration.

---

## Summary table

| Option              | Difficulty | Backend? | Result in Apple Calendar        |
|---------------------|-----------|----------|----------------------------------|
| Download .ics      | Easy      | No       | One-time/manual re-import        |
| Subscribe URL      | Medium    | Yes      | Auto-refreshing feed             |
| Two-way CalDAV     | Hard      | Yes      | Full read/write sync with iCloud |

**Bottom line:** Syncing *into* Apple Calendar in the simplest form (export .ics) is **easy**. Making that sync automatic (subscribe URL) or two-way (CalDAV) is **medium to hard** and requires a backend and more design (auth, storage, conflict handling).
