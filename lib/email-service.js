let transporterPromise = null

function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || '').trim()
  const port = Number(process.env.SMTP_PORT || 587)
  const secure = ['1', 'true', 'yes'].includes(String(process.env.SMTP_SECURE || '').toLowerCase())
  const user = (process.env.SMTP_USER || '').trim()
  // Gmail App Password viene con espacios; normalizar para evitar errores.
  const pass = String(process.env.SMTP_PASS || '').replace(/\s+/g, '').trim()
  const from = (process.env.SMTP_FROM || user || '').trim()
  const replyTo = (process.env.SMTP_REPLY_TO || '').trim()

  if (!host) return null
  if (!from) return null

  return { host, port, secure, user, pass, from, replyTo }
}

function getBrandConfig() {
  const panelUrl = (process.env.PANEL_URL || '').trim() || 'https://oguricap.ooguy.com'
  const primary = (process.env.EMAIL_BRAND_PRIMARY || '').trim() || '#6366f1'
  const secondary = (process.env.EMAIL_BRAND_SECONDARY || '').trim() || '#7c3aed'
  const background = (process.env.EMAIL_BRAND_BG || '').trim() || '#0b1020'
  const card = (process.env.EMAIL_BRAND_CARD || '').trim() || '#111827'
  return { panelUrl, primary, secondary, background, card }
}

function renderPanelEmail({ subject, preheader, title, contentHtml, ctaUrl, ctaText }) {
  const brand = getBrandConfig()
  const safePreheader = String(preheader || '').trim()
  const safeTitle = String(title || '').trim()
  const safeCtaText = String(ctaText || '').trim()
  const safeCtaUrl = String(ctaUrl || '').trim()

  return `
  <!doctype html>
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
    </head>
    <body style="margin:0;padding:0;background:${brand.background};">
      <span style="display:none;opacity:0;visibility:hidden;height:0;width:0;color:transparent;">
        ${safePreheader}
      </span>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${brand.background};padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
              <tr>
                <td style="padding:0 0 14px 0;">
                  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#e5e7eb;font-weight:700;font-size:18px;letter-spacing:0.2px;">
                    Oguri Bot · Panel
                  </div>
                </td>
              </tr>

              <tr>
                <td style="border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
                  <div style="height:6px;background:linear-gradient(90deg,${brand.primary},${brand.secondary});"></div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${brand.card};">
                    <tr>
                      <td style="padding:22px 22px 10px 22px;">
                        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#ffffff;font-size:22px;font-weight:800;line-height:1.2;">
                          ${safeTitle}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 22px 18px 22px;">
                        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#cbd5e1;font-size:14px;line-height:1.6;">
                          ${contentHtml}
                        </div>
                      </td>
                    </tr>

                    ${
                      safeCtaUrl && safeCtaText
                        ? `
                    <tr>
                      <td style="padding:0 22px 18px 22px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="border-radius:12px;background:${brand.primary};">
                              <a href="${safeCtaUrl}" target="_blank"
                                style="display:inline-block;padding:12px 16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">
                                ${safeCtaText}
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    `
                        : ''
                    }

                    <tr>
                      <td style="padding:0 22px 22px 22px;">
                        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#94a3b8;font-size:12px;line-height:1.6;">
                          Si vos no hiciste esta acción, podés ignorar este email.
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:14px 0 0 0;">
                  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#64748b;font-size:12px;line-height:1.6;text-align:center;">
                    © ${new Date().getFullYear()} Oguri Bot · Notificación automática
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `.trim()
}

async function getTransporter() {
  const config = getSmtpConfig()
  if (!config) return null

  if (!transporterPromise) {
    transporterPromise = import('nodemailer')
      .then(({ default: nodemailer }) => {
        const auth = config.user && config.pass ? { user: config.user, pass: config.pass } : undefined
        return nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth,
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 15_000,
        })
      })
      .catch(() => null)
  }

  return transporterPromise
}

export async function sendMail({ to, subject, html, text }) {
  const config = getSmtpConfig()
  if (!config) return { ok: false, skipped: true, reason: 'SMTP not configured' }

  const transporter = await getTransporter()
  if (!transporter) return { ok: false, skipped: true, reason: 'SMTP transporter unavailable' }

  const message = {
    from: config.from,
    to,
    subject,
    ...(config.replyTo ? { replyTo: config.replyTo } : {}),
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
  }

  try {
    const info = await transporter.sendMail(message)
    return { ok: true, info }
  } catch (error) {
    return { ok: false, skipped: false, reason: 'SMTP send failed', error }
  }
}

export async function sendRegistrationEmail({ to, username }) {
  const brand = getBrandConfig()
  const safeUsername = typeof username === 'string' ? username.trim() : ''
  const subject = 'Registro exitoso'
  const text =
    `Hola${safeUsername ? ` ${safeUsername}` : ''},\n\n` +
    `Tu cuenta fue creada correctamente.\n\nTu rol: Usuario\n\n` +
    `Ingresá al panel: ${brand.panelUrl}\n\n` +
    `Si vos no hiciste este registro, podés ignorar este email.\n`

  // Diseño tipo panel (compat email): tablas + estilos inline
  const html = `
  <!doctype html>
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
    </head>
    <body style="margin:0;padding:0;background:${brand.background};">
      <span style="display:none;opacity:0;visibility:hidden;height:0;width:0;color:transparent;">
        Tu cuenta fue creada correctamente.
      </span>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${brand.background};padding:24px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">
              <tr>
                <td style="padding:0 0 14px 0;">
                  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#e5e7eb;font-weight:700;font-size:18px;letter-spacing:0.2px;">
                    Oguri Bot · Panel
                  </div>
                </td>
              </tr>

              <tr>
                <td style="border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
                  <div style="height:6px;background:linear-gradient(90deg,${brand.primary},${brand.secondary});"></div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${brand.card};">
                    <tr>
                      <td style="padding:22px 22px 10px 22px;">
                        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#ffffff;font-size:22px;font-weight:800;line-height:1.2;">
                          Registro exitoso
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 22px 16px 22px;">
                        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#cbd5e1;font-size:14px;line-height:1.6;">
                          Hola${safeUsername ? ` <strong style="color:#ffffff;">${safeUsername}</strong>` : ''}, tu cuenta fue creada correctamente.<br />
                          <span style="color:#e2e8f0;">Tu rol: <strong style="color:#ffffff;">Usuario</strong></span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:0 22px 18px 22px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="border-radius:12px;background:${brand.primary};">
                              <a href="${brand.panelUrl}" target="_blank"
                                style="display:inline-block;padding:12px 16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">
                                Ir al panel
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <tr>
                      <td style="padding:0 22px 22px 22px;">
                        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#94a3b8;font-size:12px;line-height:1.6;">
                          Si vos no hiciste este registro, podés ignorar este email.
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:14px 0 0 0;">
                  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#64748b;font-size:12px;line-height:1.6;text-align:center;">
                    © ${new Date().getFullYear()} Oguri Bot · Notificación automática
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `.trim()

  return sendMail({ to, subject, html, text })
}

export async function sendPasswordResetEmail({ to, username, token, expiresMinutes = 30 }) {
  const brand = getBrandConfig()
  const safeUsername = typeof username === 'string' ? username.trim() : ''
  const safeToken = String(token || '').trim()
  const resetUrl = `${brand.panelUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(safeToken)}`
  const subject = 'Restablecer contraseña'

  const text =
    `Hola${safeUsername ? ` ${safeUsername}` : ''},\n\n` +
    `Recibimos una solicitud para restablecer tu contraseña.\n\n` +
    `Abrí este link (vence en ${expiresMinutes} min): ${resetUrl}\n\n` +
    `Si vos no pediste esto, ignorá este email.\n`

  const contentHtml = `
    Hola${safeUsername ? ` <strong style="color:#ffffff;">${safeUsername}</strong>` : ''}.<br />
    Recibimos una solicitud para restablecer tu contraseña.<br /><br />
    <strong style="color:#ffffff;">Este link vence en ${expiresMinutes} minutos.</strong>
  `.trim()

  const html = renderPanelEmail({
    subject,
    preheader: 'Restablecer contraseña',
    title: 'Restablecer contraseña',
    contentHtml,
    ctaUrl: resetUrl,
    ctaText: 'Cambiar contraseña',
  })

  return sendMail({ to, subject, html, text })
}

export async function sendSecurityAlertEmail({ to, subject, title, message, details = [] }) {
  const safeSubject = String(subject || 'Alerta de seguridad').trim()
  const safeTitle = String(title || 'Alerta de seguridad').trim()
  const safeMessage = String(message || '').trim()
  const list = Array.isArray(details) ? details : []

  const detailHtml = list.length
    ? `
      <div style="margin-top:12px;padding:12px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
        ${list
          .map((d) => `<div style="font-size:12px;color:#cbd5e1;line-height:1.5;"><strong style="color:#ffffff;">${d.label}:</strong> ${d.value}</div>`)
          .join('')}
      </div>
    `
    : ''

  const html = renderPanelEmail({
    subject: safeSubject,
    preheader: safeTitle,
    title: safeTitle,
    contentHtml: `${safeMessage}${detailHtml}`,
    ctaUrl: '',
    ctaText: '',
  })

  const text =
    `${safeTitle}\n\n` +
    `${safeMessage}\n\n` +
    list.map((d) => `${d.label}: ${d.value}`).join('\n')

  return sendMail({ to, subject: safeSubject, html, text })
}
