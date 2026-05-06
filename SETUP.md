# AcSIR PhD Portal — GitHub Pages + Supabase Setup Guide

## Overview
```
GitHub Pages (free)          Supabase (free)
────────────────────         ────────────────────────
index.html  (login)    ───►  Auth (login/passwords)
student.html           ───►  profiles table
supervisor.html        ───►  courses table
admin.html             ───►  academic_timeline table
common.html            ───►  announcements table
                       ───►  Storage (PDFs, photos)
```

---

## STEP 1 — Run the SQL schema in Supabase

1. Go to **Supabase Dashboard → SQL Editor → New Query**
2. Open `supabase_setup.sql` from this folder
3. Paste the entire contents and click **Run**
4. You should see "Success" — this creates all tables, security rules, and storage

---

## STEP 2 — Get your Service Role key (for bulk user import)

1. Supabase Dashboard → **Settings → API**
2. Copy the **service_role** key (secret — never put this in your frontend code)
3. You'll use it only for the sync script below

---

## STEP 3 — Import your data from Excel

```bash
# Install required packages
pip install supabase pandas openpyxl

# Run the sync with your service role key
SUPABASE_SERVICE_KEY=your_service_role_key_here python sync_to_supabase.py
```

This creates all 3 accounts (admin, supervisor, Sreelekshmi) and imports all 7 courses.

---

## STEP 4 — Push to GitHub

Make sure your `.gitignore` contains:
```
acsir_data.xlsx
sync_to_supabase.py
supabase_setup.sql
*.env
```

Then push:
```bash
git add .
git commit -m "Switch to GitHub Pages + Supabase"
git push origin main
```

---

## STEP 5 — Enable GitHub Pages

1. Go to your repo: **https://github.com/TIGS-AcSIR-Students-Portal/phd-portal**
2. Click **Settings → Pages**
3. Under **Source** → select **Deploy from a branch**
4. Branch: **main**, Folder: **/ (root)**
5. Click **Save**

Your portal will be live at:
**https://tigs-acsir-students-portal.github.io/phd-portal/**

(Takes 1-2 minutes to deploy)

---

## STEP 6 — Test Login

Open the GitHub Pages URL and log in with:
- Admin: `shivranjani@acsir.res.in` / `AcSIR@Admin2024`
- Supervisor: supervisor email / `AcSIR@Super2024`  
- Student: `sreelekshmi@acsir.res.in` / `AcSIR@Student2024`

---

## Adding more students later

1. Fill in `acsir_data.xlsx` with new student rows
2. Run `python sync_to_supabase.py` again — safe to re-run
3. No need to redeploy GitHub Pages — data is in Supabase

---

## Is data confidential?

✅ YES — here's why:
- Passwords handled by Supabase Auth (bcrypt hashed, never visible)
- Student data in Supabase PostgreSQL — not on GitHub
- Files in Supabase Storage — behind authentication
- Row Level Security (RLS) — students only see their own data
- GitHub only has HTML/JS code — no passwords, no database

⚠️ Keep these files OFF GitHub:
- `acsir_data.xlsx` (has passwords)
- `sync_to_supabase.py` (has service role key)
- `supabase_setup.sql` (optional but safer to exclude)

---

## Useful Links
- Supabase Dashboard: https://supabase.com/dashboard
- Your project: https://cdztunjaymnwklvguvuu.supabase.co
- GitHub repo: https://github.com/TIGS-AcSIR-Students-Portal/phd-portal
- Live portal: https://tigs-acsir-students-portal.github.io/phd-portal/
