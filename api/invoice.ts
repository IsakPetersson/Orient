import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../lib/session.js'
import { getOrgIdFromHeader, requireOrgAdmin, requireOrgMember } from '../lib/org.js'
import { Resend } from 'resend'

function fromAddress(): string {
    return process.env.RESEND_FROM_EMAIL || 'Orient <noreply@orient.app>'
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const userId = requireAuth(req, res)
        if (!userId) return

        const organizationId = getOrgIdFromHeader(req)
        if (!organizationId) {
            return res.status(400).json({ error: 'Missing or invalid x-org-id header' })
        }

        const membership = await requireOrgMember(req, res, userId, organizationId)
        if (!membership) return

        const { action } = req.query
        const actionStr = Array.isArray(action) ? action[0] : (action || 'list')

        switch (actionStr) {
            case 'list':
                return await handleList(req, res, organizationId)
            case 'create':
                return await handleCreate(req, res, organizationId, membership)
            case 'update-status':
                return await handleUpdateStatus(req, res, organizationId, membership)
            case 'send-email':
                return await handleSendEmail(req, res, organizationId, membership)
            default:
                return res.status(404).json({ error: 'Invoice action not found' })
        }
    } catch (error) {
        console.error('Invoice API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

async function handleList(req: VercelRequest, res: VercelResponse, organizationId: number) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const invoices = await prisma.invoice.findMany({
        where: { organizationId },
        include: { member: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
    })

    return res.status(200).json(invoices)
}

async function handleCreate(
    req: VercelRequest,
    res: VercelResponse,
    organizationId: number,
    membership: Awaited<ReturnType<typeof requireOrgMember>>
) {
    if (!membership) return
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Requires OWNER or ADMIN role' })
    }

    const { recipientName, recipientEmail, description, amount, dueDate, notes, memberId } = req.body

    if (!recipientName || !description || !amount) {
        return res.status(400).json({ error: 'recipientName, description and amount are required' })
    }

    // Generate next invoice number for this org (e.g. 2026-001)
    const year = new Date().getFullYear()
    const lastInvoice = await prisma.invoice.findFirst({
        where: { organizationId, invoiceNumber: { startsWith: `${year}-` } },
        orderBy: { createdAt: 'desc' }
    })
    let seq = 1
    if (lastInvoice) {
        const parts = lastInvoice.invoiceNumber.split('-')
        seq = (parseInt(parts[parts.length - 1], 10) || 0) + 1
    }
    const invoiceNumber = `${year}-${String(seq).padStart(3, '0')}`

    const invoice = await prisma.invoice.create({
        data: {
            organizationId,
            memberId: memberId ? Number(memberId) : null,
            invoiceNumber,
            recipientName,
            recipientEmail: recipientEmail || null,
            description,
            amount: Number(amount),
            dueDate: dueDate ? new Date(dueDate) : null,
            notes: notes || null,
            status: 'DRAFT'
        }
    })

    return res.status(201).json(invoice)
}

async function handleUpdateStatus(
    req: VercelRequest,
    res: VercelResponse,
    organizationId: number,
    membership: Awaited<ReturnType<typeof requireOrgMember>>
) {
    if (!membership) return
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Requires OWNER or ADMIN role' })
    }

    const { invoiceId, status } = req.body
    const validStatuses = ['DRAFT', 'SENT', 'PAID', 'CANCELLED']
    if (!invoiceId || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'invoiceId and valid status required' })
    }

    const invoice = await prisma.invoice.findFirst({
        where: { id: Number(invoiceId), organizationId }
    })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })

    const updated = await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status }
    })

    return res.status(200).json(updated)
}

async function handleSendEmail(
    req: VercelRequest,
    res: VercelResponse,
    organizationId: number,
    membership: Awaited<ReturnType<typeof requireOrgMember>>
) {
    if (!membership) return
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Requires OWNER or ADMIN role' })
    }

    const { invoiceId } = req.body
    if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' })

    const invoice = await prisma.invoice.findFirst({
        where: { id: Number(invoiceId), organizationId },
        include: { organization: { select: { name: true, orgNumber: true } } }
    })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    if (!invoice.recipientEmail) return res.status(400).json({ error: 'Invoice has no recipient email' })

    const orgName = escapeHtml(invoice.organization.name)
    const recipientName = escapeHtml(invoice.recipientName)
    const dueDateStr = invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString('sv-SE')
        : '–'
    const amountStr = Number(invoice.amount).toLocaleString('sv-SE', { minimumFractionDigits: 2 })

    const html = `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Faktura ${escapeHtml(invoice.invoiceNumber)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:560px;width:100%;">
          <tr>
            <td style="background:#1e293b;padding:28px 40px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${orgName}</span>
              <span style="display:block;font-size:13px;color:#94a3b8;margin-top:4px;">Faktura</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Fakturanummer</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">${escapeHtml(invoice.invoiceNumber)}</p>
                  </td>
                  <td align="right">
                    <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">Förfallodatum</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">${dueDateStr}</p>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Till:</p>
              <p style="margin:0 0 24px;font-size:16px;font-weight:600;color:#111827;">${recipientName}</p>
              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Avser:</p>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;">${escapeHtml(invoice.description)}</p>
              ${invoice.notes ? `<p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Notering:</p><p style="margin:0 0 24px;font-size:14px;color:#374151;">${escapeHtml(invoice.notes)}</p>` : ''}
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;">
                    <span style="font-size:14px;color:#6b7280;">Belopp att betala</span>
                  </td>
                  <td align="right" style="padding:16px 20px;">
                    <span style="font-size:22px;font-weight:700;color:#111827;">${amountStr} kr</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #e5e7eb;margin-top:24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Denna faktura skickades av ${orgName}. Kontakta avsändaren om du har frågor.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    if (!process.env.RESEND_API_KEY) {
        return res.status(503).json({ error: 'Email sending is not configured on this server.' })
    }
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
        from: fromAddress(),
        to: invoice.recipientEmail,
        subject: `Faktura ${invoice.invoiceNumber} från ${invoice.organization.name}`,
        html
    })

    // Mark as SENT if it was a DRAFT
    if (invoice.status === 'DRAFT') {
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: 'SENT' }
        })
    }

    return res.status(200).json({ ok: true })
}
