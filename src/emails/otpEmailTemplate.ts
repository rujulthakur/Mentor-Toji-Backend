/**
 * GymTracker AI — Login verification code email.
 *
 * This is the backend copy of frontend/email-templates/otp-email-template.ts —
 * kept in sync manually for now. See that folder's README for the preview
 * workflow. Matches the app's dark, 60-30-10 neon-blue design system:
 *   60%  base       #0D1117
 *   30%  surface    #161B22 / border #262D38
 *   10%  accent     #2E7BFF (Electric Blue)
 *
 * Table-based layout + inline styles only — most email clients (Outlook,
 * Gmail app) strip <style> blocks and don't support flexbox/grid.
 */

const COLORS = {
  base: '#0D1117',
  surface: '#161B22',
  surfaceBorder: '#262D38',
  textPrimary: '#F4F6F8',
  textSecondary: '#9AA4B2',
  textMuted: '#64707D',
  accent: '#2E7BFF',
  accentSoft: 'rgba(46, 123, 255, 0.10)',
  accentGlow: 'rgba(46, 123, 255, 0.35)',
  warning: '#F59E0B',
}

const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

export function otpEmailTemplate(otp: string, options?: { expiresInMinutes?: number }): string {
  const expiresInMinutes = options?.expiresInMinutes ?? 5
  const spacedOtp = otp.split('').join(' ')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your GymTracker AI login code</title>
</head>
<body style="margin:0; padding:0; background-color:${COLORS.base}; font-family:${FONT_STACK};">
  <span style="display:none; max-height:0; overflow:hidden; opacity:0;">
    Your GymTracker AI verification code is ${otp}. It expires in ${expiresInMinutes} minutes.
  </span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.base}; padding:48px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="padding-right:10px; vertical-align:middle;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="32" height="32" style="background-color:${COLORS.accentSoft}; border-radius:9px;">
                <tr>
                  <td align="center" valign="middle" style="font-size:16px; color:${COLORS.accent};">&#9889;</td>
                </tr>
              </table>
            </td>
            <td style="vertical-align:middle; font-size:16px; font-weight:700; letter-spacing:0.2px; color:${COLORS.textPrimary};">
              GymTracker <span style="color:${COLORS.accent};">AI</span>
            </td>
          </tr>
        </table>

        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:${COLORS.surface}; border:1px solid ${COLORS.surfaceBorder}; border-radius:18px;">
          <tr>
            <td style="padding:40px 36px 32px; text-align:center;">
              <p style="margin:0 0 6px; font-size:18px; font-weight:700; color:${COLORS.textPrimary};">
                Confirm it's you
              </p>
              <p style="margin:0 0 32px; font-size:14px; line-height:1.6; color:${COLORS.textSecondary};">
                Enter this code to finish signing in to your GymTracker AI account.
              </p>

              <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border:1px solid ${COLORS.accent}; border-radius:14px; background-color:${COLORS.accentSoft}; padding:18px 28px; box-shadow:0 0 24px 0 ${COLORS.accentGlow};">
                    <span style="font-size:34px; font-weight:700; letter-spacing:6px; color:${COLORS.accent}; font-family:'IBM Plex Mono', 'Courier New', monospace;">
                      ${spacedOtp}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0; font-size:13px; color:${COLORS.textMuted};">
                This code expires in <strong style="color:${COLORS.warning};">${expiresInMinutes} minutes</strong> and can only be used once.
              </p>
            </td>
          </tr>

          <tr>
            <td style="border-top:1px solid ${COLORS.surfaceBorder}; padding:20px 36px; text-align:center;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:${COLORS.textMuted};">
                Didn't request this? You can safely ignore this email — your account is still secure.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:24px 0 0; font-size:11px; letter-spacing:0.3px; color:${COLORS.textMuted}; text-transform:uppercase;">
          GymTracker AI &middot; Automated message, please don't reply
        </p>

      </td>
    </tr>
  </table>
</body>
</html>
`.trim()
}
