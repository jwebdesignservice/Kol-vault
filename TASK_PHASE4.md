# TASK_PHASE4.md — KOLVault Backend Phase 4: Email Notifications (Resend)

## Context

Phases 1–3 are complete. The following already exist:
- Full auth, profiles, subscriptions, deals, applications, escrow, results, scoring, disputes, admin APIs
- `lib/types/index.ts`, `lib/supabase/*`, `lib/auth/helpers.ts`, `lib/validation/schemas.ts`, `lib/api/response.ts`
- `resend` npm package is already installed

## Goal

Build Phase 4: **Transactional Email Notifications via Resend**

**DO NOT:**
- Build any UI, pages, or frontend components
- Modify database schema or migrations
- Install new npm packages

---

## Step 1 — Resend Email Client

Create `lib/email/client.ts`:

```typescript
import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(key)
  }
  return _resend
}

export const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'KOLVault <noreply@kolvault.io>'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kolvault.io'
```

---

## Step 2 — Email Templates

Create `lib/email/templates.ts`.

All templates return `{ subject: string, html: string, text: string }`.

Use simple inline HTML — no React, no JSX, no external template engine. Just plain string template literals.

Implement the following templates:

### 2.1 `welcomeEmail(params: { name: string, role: 'project' | 'kol', loginUrl: string })`
Subject: `Welcome to KOLVault 🚀`
- Greet by name
- Mention their role (project owner / KOL)
- Include login button/link

### 2.2 `applicationReceivedEmail(params: { projectName: string, kolName: string, dealTitle: string, applicationsUrl: string })`
Subject: `New application for "${dealTitle}"`
- Tell project owner a KOL applied
- Include link to view applications

### 2.3 `applicationStatusEmail(params: { kolName: string, dealTitle: string, status: 'accepted' | 'rejected', dealUrl: string })`
Subject: `Your application was ${status === 'accepted' ? 'accepted 🎉' : 'not selected'}`
- Tell KOL their application result
- If accepted: explain next steps (deal is now in_progress)
- If rejected: encourage to apply to other deals

### 2.4 `dealInProgressEmail(params: { recipientName: string, dealTitle: string, kolName: string, dealUrl: string })`
Subject: `Deal "${dealTitle}" is now in progress`
- Sent to both project and KOL when deal moves to in_progress
- Include deal link

### 2.5 `campaignResultEmail(params: { recipientName: string, dealTitle: string, verdict: 'success' | 'partial' | 'failure', kpiAchievedPct: number, scoreAfter?: number, tierAfter?: string, dashboardUrl: string })`
Subject: `Campaign result: ${verdict} — "${dealTitle}"`
- Different message tone per verdict (celebratory for success, neutral for partial, empathetic for failure)
- For KOL: include new score and tier if provided
- Include dashboard link

### 2.6 `disputeOpenedEmail(params: { recipientName: string, dealTitle: string, raisedByRole: 'kol' | 'project', disputeUrl: string })`
Subject: `A dispute has been opened for "${dealTitle}"`
- Notify the other party (and admin) that a dispute was filed
- Include link to view dispute

### 2.7 `disputeResolvedEmail(params: { recipientName: string, dealTitle: string, verdict: string, resolutionNotes: string, dashboardUrl: string })`
Subject: `Dispute resolved for "${dealTitle}"`
- Notify both parties of outcome
- Include verdict and resolution notes

### 2.8 `subscriptionExpiringEmail(params: { kolName: string, expiresAt: string, renewUrl: string })`
Subject: `Your KOLVault subscription expires soon`
- Warn KOL their subscription is expiring
- Include renewal link

---

## Step 3 — Email Service

Create `lib/email/service.ts`:

This is the single entry point for sending emails. Each function handles one notification type, fetches required data from Supabase if needed, and calls `getResend().emails.send(...)`.

```typescript
import { getResend, FROM_ADDRESS, APP_URL } from './client'
import * as templates from './templates'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Send welcome email to a newly registered user.
 */
export async function sendWelcomeEmail(userId: string): Promise<void>

/**
 * Notify project owner of a new KOL application.
 * @param dealId - the deal that was applied to
 * @param applicationId - the new application
 */
export async function sendApplicationReceivedEmail(dealId: string, applicationId: string): Promise<void>

/**
 * Notify KOL their application was accepted or rejected.
 */
export async function sendApplicationStatusEmail(applicationId: string, status: 'accepted' | 'rejected'): Promise<void>

/**
 * Notify both project and KOL that a deal moved to in_progress.
 */
export async function sendDealInProgressEmails(dealId: string): Promise<void>

/**
 * Notify both parties of campaign results.
 * @param dealId
 * @param scoreAfter - new KOL score (optional, include for KOL email)
 * @param tierAfter - new tier (optional)
 */
export async function sendCampaignResultEmails(dealId: string, scoreAfter?: number, tierAfter?: string): Promise<void>

/**
 * Notify the other party + admin that a dispute was opened.
 * @param disputeId
 */
export async function sendDisputeOpenedEmails(disputeId: string): Promise<void>

/**
 * Notify both parties that a dispute was resolved.
 */
export async function sendDisputeResolvedEmails(disputeId: string): Promise<void>

/**
 * Warn a KOL their subscription is expiring soon.
 */
export async function sendSubscriptionExpiringEmail(kolProfileId: string, expiresAt: string): Promise<void>
```

Implementation notes:
- Each function should fetch the data it needs from Supabase (admin client)
- Wrap `resend.emails.send()` in try/catch — log errors but don't throw (email failure should not break the API flow)
- All functions should be fire-and-forget safe (callers don't need to await them if they don't want to, but implement them as async)
- Use `FROM_ADDRESS` for the from field
- Build URLs using `APP_URL` + relevant path

---

## Step 4 — Wire Emails into Existing API Routes

**Modify the following existing routes** to call email service functions after successful DB operations. Import from `@/lib/email/service`.

### 4.1 `app/api/auth/register/route.ts`
After successful user creation:
```typescript
// Fire and forget — don't await
sendWelcomeEmail(user.id).catch(console.error)
```

### 4.2 `app/api/deals/[id]/applications/route.ts` (POST handler)
After successful application insert:
```typescript
sendApplicationReceivedEmail(dealId, application.id).catch(console.error)
```

### 4.3 `app/api/deals/[id]/applications/[appId]/route.ts` (PATCH handler)
After successful review (both accept and reject):
```typescript
sendApplicationStatusEmail(appId, newStatus).catch(console.error)
// If accepted, also send deal in_progress emails:
if (newStatus === 'accepted') {
  sendDealInProgressEmails(dealId).catch(console.error)
}
```

### 4.4 `app/api/deals/[id]/results/route.ts` (POST handler)
After successful result submission:
```typescript
sendCampaignResultEmails(dealId, scoreAfter, newTier).catch(console.error)
```

### 4.5 `app/api/deals/[id]/disputes/route.ts` (POST handler)
After successful dispute creation:
```typescript
sendDisputeOpenedEmails(dispute.id).catch(console.error)
```

### 4.6 `app/api/deals/[id]/disputes/[disputeId]/route.ts` (PATCH handler)
After successful dispute resolution:
```typescript
sendDisputeResolvedEmails(disputeId).catch(console.error)
```

---

## Step 5 — Subscription Expiry Check Endpoint

Create `app/api/admin/subscriptions/check-expiring/route.ts`:

**POST** — Admin only or internal cron trigger
- Find all active KOL subscriptions expiring in the next 7 days
- For each: call `sendSubscriptionExpiringEmail`
- Return count of emails sent
- This can be hit by a Vercel cron job

---

## Step 6 — Update .env.local.example

Add:
```
# Email (Resend)
RESEND_API_KEY=re_your_key_here
# Get from: https://resend.com
EMAIL_FROM=KOLVault <noreply@kolvault.io>
NEXT_PUBLIC_APP_URL=https://kolvault.io
```

---

## Step 7 — Update README.md

Add Phase 4 section:
- Email setup (Resend account, API key, domain verification)
- List of all triggered emails with trigger points
- Subscription expiry cron setup (Vercel cron or external)

---

## Completion Checklist

- [ ] `lib/email/client.ts` created
- [ ] `lib/email/templates.ts` created with all 8 templates
- [ ] `lib/email/service.ts` created with all 8 send functions fully implemented
- [ ] `app/api/auth/register/route.ts` — welcome email wired
- [ ] `app/api/deals/[id]/applications/route.ts` — application received email wired
- [ ] `app/api/deals/[id]/applications/[appId]/route.ts` — status + in_progress emails wired
- [ ] `app/api/deals/[id]/results/route.ts` — campaign result emails wired
- [ ] `app/api/deals/[id]/disputes/route.ts` — dispute opened emails wired
- [ ] `app/api/deals/[id]/disputes/[disputeId]/route.ts` — dispute resolved emails wired
- [ ] `app/api/admin/subscriptions/check-expiring/route.ts` created
- [ ] `.env.local.example` updated
- [ ] `README.md` updated
- [ ] `tsc --noEmit` passes with zero errors

When all items are checked, output: "Phase 4 complete." then run:
openclaw system event --text "Phase 4 complete: Email notifications built with Resend" --mode now
