import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

export const mailer = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465,
  auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
})

export async function sendMail(to: string, subject: string, html: string) {
  await mailer.sendMail({ from: env.EMAIL_FROM, to, subject, html })
}
