interface EmailTemplate {
  subject: string
  html: string
  text: string
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">KOLVault</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              &copy; ${new Date().getFullYear()} KOLVault. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;font-size:14px;">${label}</a>`
}

// ─── 2.1 Welcome ────────────────────────────────────────────────────────────

export function welcomeEmail(params: {
  name: string
  role: 'project' | 'kol'
  loginUrl: string
}): EmailTemplate {
  const { name, role, loginUrl } = params
  const roleLabel = role === 'kol' ? 'KOL (Key Opinion Leader)' : 'project owner'
  const subject = 'Welcome to KOLVault'

  const html = layout(subject, `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:24px;">Welcome to KOLVault!</h2>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">Hi ${name},</p>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">
      Your account has been created and you're registered as a <strong>${roleLabel}</strong>.
    </p>
    ${role === 'kol'
      ? `<p style="margin:0 0 24px;color:#334155;line-height:1.6;">
          Subscribe to unlock the KOL directory and start applying to crypto marketing deals.
        </p>`
      : `<p style="margin:0 0 24px;color:#334155;line-height:1.6;">
          Complete your project profile and post your first deal to start connecting with top KOLs.
        </p>`
    }
    <p style="margin:0 0 0;">${btn('Log in to KOLVault', loginUrl)}</p>
  `)

  const text = `Welcome to KOLVault!\n\nHi ${name},\n\nYour account has been created. You are registered as a ${roleLabel}.\n\nLog in here: ${loginUrl}\n`

  return { subject, html, text }
}

// ─── 2.2 Application Received ───────────────────────────────────────────────

export function applicationReceivedEmail(params: {
  projectName: string
  kolName: string
  dealTitle: string
  applicationsUrl: string
}): EmailTemplate {
  const { projectName, kolName, dealTitle, applicationsUrl } = params
  const subject = `New application for "${dealTitle}"`

  const html = layout(subject, `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;">New Application Received</h2>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">Hi ${projectName},</p>
    <p style="margin:0 0 24px;color:#334155;line-height:1.6;">
      <strong>${kolName}</strong> has applied to your deal <strong>"${dealTitle}"</strong>.
      Head over to your applications page to review their pitch and profile.
    </p>
    <p style="margin:0 0 0;">${btn('Review Applications', applicationsUrl)}</p>
  `)

  const text = `New Application for "${dealTitle}"\n\nHi ${projectName},\n\n${kolName} has applied to your deal "${dealTitle}".\n\nReview applications: ${applicationsUrl}\n`

  return { subject, html, text }
}

// ─── 2.3 Application Status ─────────────────────────────────────────────────

export function applicationStatusEmail(params: {
  kolName: string
  dealTitle: string
  status: 'accepted' | 'rejected'
  dealUrl: string
}): EmailTemplate {
  const { kolName, dealTitle, status, dealUrl } = params
  const subject = status === 'accepted'
    ? `Your application was accepted`
    : `Your application was not selected`

  const bodyHtml = status === 'accepted'
    ? `<p style="margin:0 0 16px;color:#334155;line-height:1.6;">
        Great news! Your application to <strong>"${dealTitle}"</strong> was <strong style="color:#16a34a;">accepted</strong>.
      </p>
      <p style="margin:0 0 24px;color:#334155;line-height:1.6;">
        The deal is now <strong>in progress</strong>. Log in to view the deal details, submit campaign events, and track your progress.
      </p>
      <p style="margin:0 0 0;">${btn('View Deal', dealUrl)}</p>`
    : `<p style="margin:0 0 16px;color:#334155;line-height:1.6;">
        Thank you for applying to <strong>"${dealTitle}"</strong>. Unfortunately, another KOL was selected for this deal.
      </p>
      <p style="margin:0 0 24px;color:#334155;line-height:1.6;">
        Don't be discouraged — there are plenty of other deals on the platform. Keep your profile up to date and apply to more opportunities.
      </p>
      <p style="margin:0 0 0;">${btn('Browse Deals', dealUrl)}</p>`

  const html = layout(subject, `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;">
      ${status === 'accepted' ? 'Application Accepted!' : 'Application Update'}
    </h2>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">Hi ${kolName},</p>
    ${bodyHtml}
  `)

  const text = status === 'accepted'
    ? `Application Accepted!\n\nHi ${kolName},\n\nYour application to "${dealTitle}" was accepted. The deal is now in progress.\n\nView deal: ${dealUrl}\n`
    : `Application Update\n\nHi ${kolName},\n\nYour application to "${dealTitle}" was not selected. Browse other deals: ${dealUrl}\n`

  return { subject, html, text }
}

// ─── 2.4 Deal In Progress ───────────────────────────────────────────────────

export function dealInProgressEmail(params: {
  recipientName: string
  dealTitle: string
  kolName: string
  dealUrl: string
}): EmailTemplate {
  const { recipientName, dealTitle, kolName, dealUrl } = params
  const subject = `Deal "${dealTitle}" is now in progress`

  const html = layout(subject, `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;">Deal In Progress</h2>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">Hi ${recipientName},</p>
    <p style="margin:0 0 24px;color:#334155;line-height:1.6;">
      The deal <strong>"${dealTitle}"</strong> is now <strong style="color:#2563eb;">in progress</strong>
      with <strong>${kolName}</strong>.
      Log in to track campaign events, submit milestones, and monitor progress.
    </p>
    <p style="margin:0 0 0;">${btn('View Deal', dealUrl)}</p>
  `)

  const text = `Deal In Progress\n\nHi ${recipientName},\n\nThe deal "${dealTitle}" is now in progress with ${kolName}.\n\nView deal: ${dealUrl}\n`

  return { subject, html, text }
}

// ─── 2.5 Campaign Result ────────────────────────────────────────────────────

export function campaignResultEmail(params: {
  recipientName: string
  dealTitle: string
  verdict: 'success' | 'partial' | 'failure'
  kpiAchievedPct: number
  scoreAfter?: number
  tierAfter?: string
  dashboardUrl: string
}): EmailTemplate {
  const { recipientName, dealTitle, verdict, kpiAchievedPct, scoreAfter, tierAfter, dashboardUrl } = params
  const subject = `Campaign result: ${verdict} — "${dealTitle}"`

  const verdictConfig = {
    success: {
      emoji: '',
      label: 'Success',
      color: '#16a34a',
      message: `Excellent work! The campaign hit its KPI target at <strong>${kpiAchievedPct}%</strong>. This is a great outcome for everyone involved.`,
    },
    partial: {
      emoji: '',
      label: 'Partial',
      color: '#d97706',
      message: `The campaign achieved <strong>${kpiAchievedPct}%</strong> of its KPI target — a partial result. Not the full goal, but progress was made.`,
    },
    failure: {
      emoji: '',
      label: 'Not Achieved',
      color: '#dc2626',
      message: `The campaign achieved <strong>${kpiAchievedPct}%</strong> of its KPI target, falling short of the goal. We understand this is disappointing.`,
    },
  }[verdict]

  const scoreSection = (scoreAfter !== undefined && tierAfter)
    ? `<p style="margin:16px 0 0;color:#334155;line-height:1.6;">
        Your updated reputation score is <strong>${scoreAfter}</strong> — tier: <strong style="text-transform:capitalize;">${tierAfter}</strong>.
      </p>`
    : ''

  const html = layout(subject, `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;">Campaign Result: <span style="color:${verdictConfig.color};">${verdictConfig.label}</span></h2>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">Hi ${recipientName},</p>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">
      The campaign for <strong>"${dealTitle}"</strong> has been reviewed.
    </p>
    <p style="margin:0 0 0;color:#334155;line-height:1.6;">${verdictConfig.message}</p>
    ${scoreSection}
    <p style="margin:24px 0 0;">${btn('View Dashboard', dashboardUrl)}</p>
  `)

  const textScore = (scoreAfter !== undefined && tierAfter) ? `\nYour updated score: ${scoreAfter} (${tierAfter} tier).` : ''
  const text = `Campaign Result: ${verdictConfig.label}\n\nHi ${recipientName},\n\nThe campaign for "${dealTitle}" achieved ${kpiAchievedPct}% of its KPI target (${verdict}).${textScore}\n\nView dashboard: ${dashboardUrl}\n`

  return { subject, html, text }
}

// ─── 2.6 Dispute Opened ─────────────────────────────────────────────────────

export function disputeOpenedEmail(params: {
  recipientName: string
  dealTitle: string
  raisedByRole: 'kol' | 'project'
  disputeUrl: string
}): EmailTemplate {
  const { recipientName, dealTitle, raisedByRole, disputeUrl } = params
  const raiserLabel = raisedByRole === 'kol' ? 'the KOL' : 'the project owner'
  const subject = `A dispute has been opened for "${dealTitle}"`

  const html = layout(subject, `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;">Dispute Opened</h2>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">Hi ${recipientName},</p>
    <p style="margin:0 0 24px;color:#334155;line-height:1.6;">
      A dispute has been filed by <strong>${raiserLabel}</strong> for the deal <strong>"${dealTitle}"</strong>.
      Our team will review the evidence submitted and reach a resolution. Please log in to view the dispute details and submit any supporting evidence.
    </p>
    <p style="margin:0 0 0;">${btn('View Dispute', disputeUrl)}</p>
  `)

  const text = `Dispute Opened\n\nHi ${recipientName},\n\nA dispute has been filed by ${raiserLabel} for the deal "${dealTitle}".\n\nView dispute: ${disputeUrl}\n`

  return { subject, html, text }
}

// ─── 2.7 Dispute Resolved ───────────────────────────────────────────────────

export function disputeResolvedEmail(params: {
  recipientName: string
  dealTitle: string
  verdict: string
  resolutionNotes: string
  dashboardUrl: string
}): EmailTemplate {
  const { recipientName, dealTitle, verdict, resolutionNotes, dashboardUrl } = params
  const verdictLabel = verdict.replace(/_/g, ' ')
  const subject = `Dispute resolved for "${dealTitle}"`

  const html = layout(subject, `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;">Dispute Resolved</h2>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">Hi ${recipientName},</p>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">
      The dispute for <strong>"${dealTitle}"</strong> has been resolved by our team.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;margin:0 0 24px;">
      <tr>
        <td style="padding:16px;">
          <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Verdict</p>
          <p style="margin:0 0 16px;color:#0f172a;font-weight:600;text-transform:capitalize;">${verdictLabel}</p>
          <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">Resolution Notes</p>
          <p style="margin:0;color:#334155;line-height:1.6;">${resolutionNotes}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 0;">${btn('View Dashboard', dashboardUrl)}</p>
  `)

  const text = `Dispute Resolved\n\nHi ${recipientName},\n\nThe dispute for "${dealTitle}" has been resolved.\n\nVerdict: ${verdictLabel}\nResolution notes: ${resolutionNotes}\n\nView dashboard: ${dashboardUrl}\n`

  return { subject, html, text }
}

// ─── 2.8 Subscription Expiring ──────────────────────────────────────────────

export function subscriptionExpiringEmail(params: {
  kolName: string
  expiresAt: string
  renewUrl: string
}): EmailTemplate {
  const { kolName, expiresAt, renewUrl } = params
  const formattedDate = new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const subject = 'Your KOLVault subscription expires soon'

  const html = layout(subject, `
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;">Subscription Expiring Soon</h2>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">Hi ${kolName},</p>
    <p style="margin:0 0 16px;color:#334155;line-height:1.6;">
      Your KOLVault subscription expires on <strong>${formattedDate}</strong>.
    </p>
    <p style="margin:0 0 24px;color:#334155;line-height:1.6;">
      Renew now to keep your profile active in the KOL directory and continue applying to deals without interruption.
    </p>
    <p style="margin:0 0 0;">${btn('Renew Subscription', renewUrl)}</p>
  `)

  const text = `Subscription Expiring Soon\n\nHi ${kolName},\n\nYour KOLVault subscription expires on ${formattedDate}.\n\nRenew here: ${renewUrl}\n`

  return { subject, html, text }
}
