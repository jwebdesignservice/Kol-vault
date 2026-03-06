import { getResend, FROM_ADDRESS, APP_URL } from './client'
import * as templates from './templates'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Send welcome email to a newly registered user.
 */
export async function sendWelcomeEmail(userId: string): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { data: user } = await supabase
      .from('users')
      .select('email, role')
      .eq('id', userId)
      .single()

    if (!user) return

    // Only send to project and kol roles
    if (user.role !== 'project' && user.role !== 'kol') return

    let name = user.email
    if (user.role === 'kol') {
      const { data: kol } = await supabase
        .from('kol_profiles')
        .select('display_name')
        .eq('user_id', userId)
        .single()
      if (kol?.display_name) name = kol.display_name
    }

    const tpl = templates.welcomeEmail({
      name,
      role: user.role as 'project' | 'kol',
      loginUrl: `${APP_URL}/login`,
    })

    await getResend().emails.send({
      from: FROM_ADDRESS,
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    })
  } catch (err) {
    console.error('[email] sendWelcomeEmail failed:', err)
  }
}

/**
 * Notify project owner of a new KOL application.
 */
export async function sendApplicationReceivedEmail(
  dealId: string,
  applicationId: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { data: deal } = await supabase
      .from('deals')
      .select('title, project_id')
      .eq('id', dealId)
      .single()

    if (!deal) return

    const { data: projectProfile } = await supabase
      .from('project_profiles')
      .select('user_id, token_name')
      .eq('id', deal.project_id)
      .single()

    if (!projectProfile) return

    const { data: projectUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', projectProfile.user_id)
      .single()

    if (!projectUser) return

    const { data: application } = await supabase
      .from('applications')
      .select('kol_id')
      .eq('id', applicationId)
      .single()

    if (!application) return

    const { data: kolProfile } = await supabase
      .from('kol_profiles')
      .select('display_name')
      .eq('id', application.kol_id)
      .single()

    const tpl = templates.applicationReceivedEmail({
      projectName: projectProfile.token_name ?? projectUser.email,
      kolName: kolProfile?.display_name ?? 'A KOL',
      dealTitle: deal.title,
      applicationsUrl: `${APP_URL}/deals/${dealId}/applications`,
    })

    await getResend().emails.send({
      from: FROM_ADDRESS,
      to: projectUser.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    })
  } catch (err) {
    console.error('[email] sendApplicationReceivedEmail failed:', err)
  }
}

/**
 * Notify KOL their application was accepted or rejected.
 */
export async function sendApplicationStatusEmail(
  applicationId: string,
  status: 'accepted' | 'rejected'
): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { data: application } = await supabase
      .from('applications')
      .select('kol_id, deal_id')
      .eq('id', applicationId)
      .single()

    if (!application) return

    const { data: kolProfile } = await supabase
      .from('kol_profiles')
      .select('user_id, display_name')
      .eq('id', application.kol_id)
      .single()

    if (!kolProfile) return

    const { data: kolUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', kolProfile.user_id)
      .single()

    if (!kolUser) return

    const { data: deal } = await supabase
      .from('deals')
      .select('title')
      .eq('id', application.deal_id)
      .single()

    if (!deal) return

    const tpl = templates.applicationStatusEmail({
      kolName: kolProfile.display_name ?? kolUser.email,
      dealTitle: deal.title,
      status,
      dealUrl: `${APP_URL}/deals/${application.deal_id}`,
    })

    await getResend().emails.send({
      from: FROM_ADDRESS,
      to: kolUser.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    })
  } catch (err) {
    console.error('[email] sendApplicationStatusEmail failed:', err)
  }
}

/**
 * Notify both project and KOL that a deal moved to in_progress.
 */
export async function sendDealInProgressEmails(dealId: string): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { data: deal } = await supabase
      .from('deals')
      .select('title, project_id, accepted_kol_id')
      .eq('id', dealId)
      .single()

    if (!deal || !deal.accepted_kol_id) return

    const [{ data: projectProfile }, { data: kolProfile }] = await Promise.all([
      supabase
        .from('project_profiles')
        .select('user_id, token_name')
        .eq('id', deal.project_id)
        .single(),
      supabase
        .from('kol_profiles')
        .select('user_id, display_name')
        .eq('id', deal.accepted_kol_id)
        .single(),
    ])

    if (!projectProfile || !kolProfile) return

    const [{ data: projectUser }, { data: kolUser }] = await Promise.all([
      supabase.from('users').select('email').eq('id', projectProfile.user_id).single(),
      supabase.from('users').select('email').eq('id', kolProfile.user_id).single(),
    ])

    const kolName = kolProfile.display_name ?? kolUser?.email ?? 'KOL'

    const sends: Promise<void>[] = []

    if (projectUser) {
      const tpl = templates.dealInProgressEmail({
        recipientName: projectProfile.token_name ?? projectUser.email,
        dealTitle: deal.title,
        kolName,
        dealUrl: `${APP_URL}/deals/${dealId}`,
      })
      sends.push(
        getResend().emails.send({
          from: FROM_ADDRESS,
          to: projectUser.email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        }).then(() => undefined)
      )
    }

    if (kolUser) {
      const tpl = templates.dealInProgressEmail({
        recipientName: kolName,
        dealTitle: deal.title,
        kolName,
        dealUrl: `${APP_URL}/deals/${dealId}`,
      })
      sends.push(
        getResend().emails.send({
          from: FROM_ADDRESS,
          to: kolUser.email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        }).then(() => undefined)
      )
    }

    await Promise.all(sends)
  } catch (err) {
    console.error('[email] sendDealInProgressEmails failed:', err)
  }
}

/**
 * Notify both parties of campaign results.
 */
export async function sendCampaignResultEmails(
  dealId: string,
  scoreAfter?: number,
  tierAfter?: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { data: deal } = await supabase
      .from('deals')
      .select('title, project_id, accepted_kol_id')
      .eq('id', dealId)
      .single()

    if (!deal || !deal.accepted_kol_id) return

    const { data: result } = await supabase
      .from('campaign_results')
      .select('verdict, kpi_achieved')
      .eq('deal_id', dealId)
      .single()

    if (!result) return

    const [{ data: projectProfile }, { data: kolProfile }] = await Promise.all([
      supabase.from('project_profiles').select('user_id, token_name').eq('id', deal.project_id).single(),
      supabase.from('kol_profiles').select('user_id, display_name').eq('id', deal.accepted_kol_id).single(),
    ])

    if (!projectProfile || !kolProfile) return

    const [{ data: projectUser }, { data: kolUser }] = await Promise.all([
      supabase.from('users').select('email').eq('id', projectProfile.user_id).single(),
      supabase.from('users').select('email').eq('id', kolProfile.user_id).single(),
    ])

    const kpiPct = (result.kpi_achieved as { pct?: number })?.pct ?? 0
    const kolName = kolProfile.display_name ?? kolUser?.email ?? 'KOL'
    const sends: Promise<void>[] = []

    if (projectUser) {
      const tpl = templates.campaignResultEmail({
        recipientName: projectProfile.token_name ?? projectUser.email,
        dealTitle: deal.title,
        verdict: result.verdict as 'success' | 'partial' | 'failure',
        kpiAchievedPct: kpiPct,
        dashboardUrl: `${APP_URL}/dashboard`,
      })
      sends.push(
        getResend().emails.send({
          from: FROM_ADDRESS,
          to: projectUser.email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        }).then(() => undefined)
      )
    }

    if (kolUser) {
      const tpl = templates.campaignResultEmail({
        recipientName: kolName,
        dealTitle: deal.title,
        verdict: result.verdict as 'success' | 'partial' | 'failure',
        kpiAchievedPct: kpiPct,
        scoreAfter,
        tierAfter,
        dashboardUrl: `${APP_URL}/dashboard`,
      })
      sends.push(
        getResend().emails.send({
          from: FROM_ADDRESS,
          to: kolUser.email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        }).then(() => undefined)
      )
    }

    await Promise.all(sends)
  } catch (err) {
    console.error('[email] sendCampaignResultEmails failed:', err)
  }
}

/**
 * Notify the other party + admin that a dispute was opened.
 */
export async function sendDisputeOpenedEmails(disputeId: string): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { data: dispute } = await supabase
      .from('disputes')
      .select('deal_id, raised_by_role')
      .eq('id', disputeId)
      .single()

    if (!dispute) return

    const { data: deal } = await supabase
      .from('deals')
      .select('title, project_id, accepted_kol_id')
      .eq('id', dispute.deal_id)
      .single()

    if (!deal) return

    const [{ data: projectProfile }, { data: kolProfile }] = await Promise.all([
      supabase.from('project_profiles').select('user_id, token_name').eq('id', deal.project_id).single(),
      deal.accepted_kol_id
        ? supabase.from('kol_profiles').select('user_id, display_name').eq('id', deal.accepted_kol_id).single()
        : Promise.resolve({ data: null }),
    ])

    const disputeUrl = `${APP_URL}/deals/${dispute.deal_id}/disputes/${disputeId}`
    const sends: Promise<void>[] = []

    // Notify both parties
    const recipients: Array<{ userId: string; name: string }> = []

    if (projectProfile) {
      recipients.push({
        userId: projectProfile.user_id,
        name: projectProfile.token_name ?? 'Project Owner',
      })
    }

    if (kolProfile) {
      const kp = kolProfile as { user_id: string; display_name: string | null } | null
      if (kp) {
        recipients.push({
          userId: kp.user_id,
          name: kp.display_name ?? 'KOL',
        })
      }
    }

    for (const recipient of recipients) {
      const { data: recipientUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', recipient.userId)
        .single()

      if (!recipientUser) continue

      const tpl = templates.disputeOpenedEmail({
        recipientName: recipient.name,
        dealTitle: deal.title,
        raisedByRole: dispute.raised_by_role as 'kol' | 'project',
        disputeUrl,
      })

      sends.push(
        getResend().emails.send({
          from: FROM_ADDRESS,
          to: recipientUser.email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        }).then(() => undefined)
      )
    }

    // Notify admin users
    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'admin')

    if (admins) {
      for (const admin of admins) {
        const tpl = templates.disputeOpenedEmail({
          recipientName: 'Admin',
          dealTitle: deal.title,
          raisedByRole: dispute.raised_by_role as 'kol' | 'project',
          disputeUrl,
        })
        sends.push(
          getResend().emails.send({
            from: FROM_ADDRESS,
            to: admin.email,
            subject: tpl.subject,
            html: tpl.html,
            text: tpl.text,
          }).then(() => undefined)
        )
      }
    }

    await Promise.all(sends)
  } catch (err) {
    console.error('[email] sendDisputeOpenedEmails failed:', err)
  }
}

/**
 * Notify both parties that a dispute was resolved.
 */
export async function sendDisputeResolvedEmails(disputeId: string): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { data: dispute } = await supabase
      .from('disputes')
      .select('deal_id, verdict, resolution_notes')
      .eq('id', disputeId)
      .single()

    if (!dispute || !dispute.verdict) return

    const { data: deal } = await supabase
      .from('deals')
      .select('title, project_id, accepted_kol_id')
      .eq('id', dispute.deal_id)
      .single()

    if (!deal) return

    const [{ data: projectProfile }, { data: kolProfile }] = await Promise.all([
      supabase.from('project_profiles').select('user_id, token_name').eq('id', deal.project_id).single(),
      deal.accepted_kol_id
        ? supabase.from('kol_profiles').select('user_id, display_name').eq('id', deal.accepted_kol_id).single()
        : Promise.resolve({ data: null }),
    ])

    const dashboardUrl = `${APP_URL}/dashboard`
    const resolutionNotes = dispute.resolution_notes ?? 'No additional notes provided.'
    const sends: Promise<void>[] = []

    const recipients: Array<{ userId: string; name: string }> = []

    if (projectProfile) {
      recipients.push({
        userId: projectProfile.user_id,
        name: projectProfile.token_name ?? 'Project Owner',
      })
    }

    if (kolProfile) {
      const kp = kolProfile as { user_id: string; display_name: string | null } | null
      if (kp) {
        recipients.push({
          userId: kp.user_id,
          name: kp.display_name ?? 'KOL',
        })
      }
    }

    for (const recipient of recipients) {
      const { data: recipientUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', recipient.userId)
        .single()

      if (!recipientUser) continue

      const tpl = templates.disputeResolvedEmail({
        recipientName: recipient.name,
        dealTitle: deal.title,
        verdict: dispute.verdict,
        resolutionNotes,
        dashboardUrl,
      })

      sends.push(
        getResend().emails.send({
          from: FROM_ADDRESS,
          to: recipientUser.email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        }).then(() => undefined)
      )
    }

    await Promise.all(sends)
  } catch (err) {
    console.error('[email] sendDisputeResolvedEmails failed:', err)
  }
}

/**
 * Warn a KOL their subscription is expiring soon.
 */
export async function sendSubscriptionExpiringEmail(
  kolProfileId: string,
  expiresAt: string
): Promise<void> {
  try {
    const supabase = createAdminClient()

    const { data: kolProfile } = await supabase
      .from('kol_profiles')
      .select('user_id, display_name')
      .eq('id', kolProfileId)
      .single()

    if (!kolProfile) return

    const { data: kolUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', kolProfile.user_id)
      .single()

    if (!kolUser) return

    const tpl = templates.subscriptionExpiringEmail({
      kolName: kolProfile.display_name ?? kolUser.email,
      expiresAt,
      renewUrl: `${APP_URL}/subscriptions/renew`,
    })

    await getResend().emails.send({
      from: FROM_ADDRESS,
      to: kolUser.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    })
  } catch (err) {
    console.error('[email] sendSubscriptionExpiringEmail failed:', err)
  }
}
