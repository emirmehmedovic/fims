import nodemailer from 'nodemailer'

interface EmailAttachment {
  filename: string
  content: Buffer
  contentType: string
  cid?: string
}

interface SendEmailParams {
  to: string[]
  subject: string
  html: string
  attachments?: EmailAttachment[]
}

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM
  const secureEnv = process.env.SMTP_SECURE

  if (!host || !port || !from) {
    throw new Error('Missing SMTP configuration')
  }

  return {
    host,
    port,
    secure: secureEnv ? secureEnv === 'true' : port === 465,
    auth: user && pass ? { user, pass } : undefined,
    from
  }
}

export const sendEmail = async ({ to, subject, html, attachments }: SendEmailParams) => {
  const config = getSmtpConfig()
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth
  })

  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    html,
    attachments
  })
}
