import { Resend } from "resend"
import { EmailTemplate } from "@/components/email-template"

const resend = new Resend(process.env.RESEND_API_KEY)
const domain = process.env.NEXT_PUBLIC_APP_URL

export const sendTwoFactorTokenEmail = async (email: string, token: string) => {
  const html = EmailTemplate({
    title: "Your Two-Factor Authentication Code",
    content: `
      <p>Hello,</p>
      <p>Your two-factor authentication code is below. This code will expire in 5 minutes.</p>
      <p>Enter this code to complete the sign-in process:</p>
    `,
    note: "For security reasons, this code will expire in 5 minutes. If you didn't request this code, please secure your account immediately."
  }).replace('</div>', `
    <div class="token">
      <div class="token-code">${token}</div>
      <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">Enter this code on the verification page</p>
    </div>
  </div>`)

  await resend.emails.send({
    from: 'security@altbet.casino',
    to: email,
    subject: 'Your 2FA Code - altbet',
    html: html
  })
}

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/new-password?token=${token}`

  const html = EmailTemplate({
    title: "Reset Your Password",
    content: `
      <p>Hello,</p>
      <p>We received a request to reset your password for your altbet account. Click the button below to create a new password:</p>
    `,
    buttonText: "Reset Password",
    buttonLink: resetLink,
    note: "This password reset link will expire in 5 minutes. If you didn't request a password reset, please ignore this email or contact support if you have concerns."
  })

  await resend.emails.send({
    from: 'security@altbet.casino',
    to: email,
    subject: 'Reset Your Password - altbet',
    html: html
  })
}

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/new-verification?token=${token}`

  const html = EmailTemplate({
    title: "Verify Your Email Address",
    content: `
      <p>Welcome to altbet!</p>
      <p>Thank you for signing up. To get started, please verify your email address by clicking the button below:</p>
    `,
    buttonText: "Verify Email",
    buttonLink: confirmLink,
    note: "This verification link will expire in 5 minutes. If you didn't create an account with us, please disregard this email."
  })

  await resend.emails.send({
    from: 'security@altbet.casino',
    to: email,
    subject: 'Verify Your Email - altbet',
    html: html
  })
}