# FIXIA CoachingOS — Production Deployment & Cloud Infrastructure Runbook

**Document Version:** 1.0.0  
**Phase Completed:** Phase 16 — Final Production Audit, Testing & Launch Readiness  
**Target Environments:** Supabase Cloud (PostgreSQL 15+), Vercel / Netlify (Frontend Edge)  
**Date:** 2026-11-10  
**Audience:** DevSecOps Engineers, Cloud Architects, and Institute IT Administrators

---

## 1. Architecture Overview

FIXIA CoachingOS is engineered as a modern, decoupled cloud application:

```
+---------------------------------------------------------------------------------+
|                                 CLIENT TIER                                     |
|               Vercel / Netlify CDN Edge (Global Anycast DNS)                    |
|             SPA Built with React 18, Vite 8, React Router v6                    |
+---------------------------------------------------------------------------------+
                                       |
                   HTTPS (TLS 1.3) / WSS (Realtime)
                                       v
+---------------------------------------------------------------------------------+
|                             CLOUD SERVICES TIER                                 |
|                       Supabase Managed Cloud Platform                           |
|  - Auth (PKCE / JWT Sessions)        - PostgreSQL 15+ (Multi-Tenant Schema)     |
|  - Row Level Security (RLS) Engine   - S3 Storage (Receipts & Documents)        |
+---------------------------------------------------------------------------------+
```

---

## 2. Step 1: Database Setup on Supabase

### 2.1 Provision Project
1. Log into your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Ensure you have selected your project: **`Coaching-`** (`xruokhpngwzlodpgmsui`) in Region `ap-northeast-2` (or your preferred region, e.g. `ap-south-1` Mumbai).

### 2.2 Execute Consolidated Migration
A single complete setup script concatenating all 7 production migrations is prepared in the repository:
📄 [`supabase/SETUP_COMPLETE_DATABASE.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/SETUP_COMPLETE_DATABASE.sql)

1. In the Supabase left navigation bar, click the **SQL Editor** icon (`>_`), or open:  
   `https://supabase.com/dashboard/project/xruokhpngwzlodpgmsui/sql/new`
2. Open [`supabase/SETUP_COMPLETE_DATABASE.sql`](file:///c:/Users/hp/OneDrive/Desktop/antigravity%20workspace/Coaching%20Saas/supabase/SETUP_COMPLETE_DATABASE.sql), copy its entire contents, and paste them into the SQL editor window.
3. Click the green **Run** button.
4. **Verification:** Confirm the successful creation of all 12 tables (`institutes`, `profiles`, `memberships`, `students`, `courses`, `batches`, `batch_schedules`, `batch_enrollment_history`, `attendance_sessions`, `attendance_records`, `payments`, `expenses`, `audit_logs`, `commercial_subscriptions`, `platform_admins`).

---

## 3. Step 2: Supabase Storage & Bucket Configuration

FIXIA CoachingOS uses Supabase Storage for storing receipt PDFs, fee vouchers, and institute branding logos.

1. Navigate to **Storage** in the Supabase Dashboard:  
   `https://supabase.com/dashboard/project/xruokhpngwzlodpgmsui/storage/buckets`
2. Create the following three storage buckets:
   - **`receipts`** (Private: only authorized owners/admins can download payment receipts)
   - **`vouchers`** (Private: only authorized owners/admins can access expense proof vouchers)
   - **`branding`** (Public: institute logos and banners displayed in receipt headers)
3. **Storage Security Policies:**  
   Execute the storage policies defined in `supabase/migrations/20261103000004_storage_and_security_hardening.sql` to enforce that uploaded files are placed under `/institutes/{institute_id}/...` and protected by Row Level Security.

---

## 4. Step 3: Supabase Authentication Configuration

1. In the Supabase dashboard, navigate to **Authentication** > **URL Configuration**:
   - **Site URL:** Set to your production domain (e.g. `https://coaching.fixia.in` or `https://your-app.vercel.app`).
   - **Redirect URLs:** Add:
     - `http://localhost:5173/**` (for local development)
     - `https://your-production-domain.com/**`
2. In **Authentication** > **Providers** > **Email**:
   - Ensure **Enable Email provider** is toggled ON.
   - For production, configure custom SMTP (e.g. SendGrid, Amazon SES, or Postmark) for reliable password reset and faculty invitation delivery.

---

## 5. Step 4: Frontend Deployment (Vercel / Netlify)

### 5.1 Environment Variables
Set the following environment variables in your Vercel or Netlify project settings:

```env
# Supabase API Configuration (From Supabase Project Settings > API Keys)
VITE_SUPABASE_URL=https://xruokhpngwzlodpgmsui.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_public_anon_key_here

# Runtime Environment
VITE_APP_ENV=production
```

> [!CAUTION]
> **NEVER** expose the Supabase `service_role` key in `VITE_SUPABASE_ANON_KEY` or any client configuration. The application will throw a runtime security exception if a service-role key is detected.

### 5.2 Build Command & Output Directory
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Node Version:** `18.x` or `20.x`

### 5.3 Single Page Application (SPA) Routing Rewrite
For client-side routing (`/teacher/*`, `/superadmin/*`, etc.), ensure clean rewrites:

**For Vercel (`vercel.json`):**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**For Netlify (`_redirects`):**
```
/*    /index.html   200
```

---

## 6. Backup, Disaster Recovery & High Availability

### 6.1 Automated Daily Backups
- Supabase Pro/Team tiers provide automated daily point-in-time recovery (PITR) with WAL archiving.
- For community/free tiers, configure a daily `pg_dump` backup via GitHub Actions or scheduled cron:
  ```bash
  # Daily Snapshot Command
  pg_dump -h db.xruokhpngwzlodpgmsui.supabase.co -U postgres -d postgres -F c -b -v -f "fixia_backup_$(date +%Y%m%d).dump"
  ```

### 6.2 Disaster Recovery Runbook
1. **RTO (Recovery Time Objective):** $< 30$ minutes.
2. **RPO (Recovery Point Objective):** $< 24$ hours (Daily snapshots) or $< 5$ minutes (PITR enabled).
3. **Database Restoration:**
   ```bash
   pg_restore -h new-db-host -U postgres -d postgres -v "fixia_backup_YYYYMMDD.dump"
   ```

---

## 7. Post-Deployment Verification Checklist

- [ ] Production URL loads over HTTPS with valid TLS 1.3 certificate.
- [ ] Login screen accepts owner credentials and boots to `/`.
- [ ] Navigation to `/teacher` loads dedicated Teacher Portal.
- [ ] Navigation to `/superadmin` as a non-super-admin is blocked with security screen.
- [ ] Student admission increments active student count and honors commercial quota.
- [ ] Fee payment generates downloadable receipt with correct currency format (₹).
- [ ] Attendance roll-call submission succeeds and displays confirmed status badge.
- [ ] No JavaScript console errors, CSP violations, or unhandled promise rejections.
