## Sample Projects

### 1) AI Chatbot (Next.js + OpenRouter + Supabase)
- Auth with `Clerk`
- Store chat history in `Supabase`
- Stream responses from `OpenRouter`

Steps:
1. Init Next.js app; add Clerk and Supabase client
2. API route calls OpenRouter; stream to UI
3. Save messages; show history per user

### 2) File Uploader (Next.js + UploadThing + EdgeStore)
- Auth with `Auth.js`
- Upload via `UploadThing`
- Store metadata in `Postgres` (Neon)

Steps:
1. Configure Auth.js providers
2. Create upload endpoint and UI
3. Persist file records and render gallery

### 3) Analytics Dashboard (Next.js + PostHog + Stripe Webhooks)
- Capture events with `PostHog`
- Show metrics by day/user
- Add Stripe webhook to track revenue

Steps:
1. Add PostHog SDK and identify users
2. Create dashboard page with charts
3. Add webhook endpoint and revenue card

