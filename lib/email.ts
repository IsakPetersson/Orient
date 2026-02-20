import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function baseUrl(): string {
    return (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '')
}

function fromAddress(): string {
    return process.env.RESEND_FROM_EMAIL || 'Orient <noreply@orient.app>'
}

const brandColor = '#4f46e5'

function emailWrapper(body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Orient</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:520px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:${brandColor};padding:28px 40px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Orient</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">This email was sent by Orient. If you didn't request this, you can safely ignore it.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    const link = `${baseUrl()}/login?action=verify&token=${token}`

    const html = emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Verify your email</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;">Hi ${escapeHtml(name)}, thanks for creating an Orient account. Click the button below to confirm your email address.</p>
      <a href="${link}" style="display:inline-block;background:${brandColor};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;margin-bottom:24px;">Verify Email Address</a>
      <p style="margin:0;font-size:13px;color:#9ca3af;">Or copy this link: <a href="${link}" style="color:${brandColor};word-break:break-all;">${link}</a></p>
      <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">This link expires in 24 hours.</p>
    `)

    await resend.emails.send({
        from: fromAddress(),
        to,
        subject: 'Verify your Orient email address',
        html
    })
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    const link = `${baseUrl()}/login?action=reset&token=${token}`

    const html = emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Reset your password</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;">Hi ${escapeHtml(name)}, we received a request to reset the password for your Orient account.</p>
      <a href="${link}" style="display:inline-block;background:${brandColor};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;margin-bottom:24px;">Reset Password</a>
      <p style="margin:0;font-size:13px;color:#9ca3af;">Or copy this link: <a href="${link}" style="color:${brandColor};word-break:break-all;">${link}</a></p>
      <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    `)

    await resend.emails.send({
        from: fromAddress(),
        to,
        subject: 'Reset your Orient password',
        html
    })
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}
