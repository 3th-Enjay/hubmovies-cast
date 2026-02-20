import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@hubmovies-cd.com";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email notification
 * Falls back gracefully if email service is not configured
 */
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  const context = {
    to,
    subject,
    from: FROM_EMAIL,
    hasApiKey: Boolean(process.env.RESEND_API_KEY),
  };
  // If Resend API key is not configured, log and return false
  // This allows the app to work without email in development
  if (!process.env.RESEND_API_KEY) {
    console.error("[Email] Service not configured. Missing RESEND_API_KEY.", context);
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Resend error:", { ...context, error });
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Resend exception:", { ...context, error });
    return false;
  }
}

/**
 * Send application status change notification email
 */
export async function sendApplicationStatusEmail(
  talentEmail: string,
  jobTitle: string,
  status: "shortlisted" | "rejected"
): Promise<boolean> {
  const statusText = status === "shortlisted" ? "Shortlisted" : "Rejected";
  const subject = `Your Application Has Been ${statusText} - ${jobTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0b0b0c; color: #f4f4f5; padding: 20px; text-align: center; }
          .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 4px; font-weight: bold; margin: 20px 0; }
          .shortlisted { background: #c7a24b; color: #000; }
          .rejected { background: #8f1d18; color: #fff; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #c7a24b; color: #000; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HubMovies Cast</h1>
          </div>
          <div class="content">
            <h2>Application Status Update</h2>
            <p>Your application for <strong>${jobTitle}</strong> has been updated.</p>
            <div class="status-badge ${status}">${statusText}</div>
            <p>You can view your application and any messages from the casting director in your dashboard.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://hubmovies-cd.com"}/talent/dashboard" class="button">View Dashboard</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from HubMovies Cast.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: talentEmail, subject, html });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  resetUrl: string
): Promise<boolean> {
  const subject = "Reset Your Password - HubMovies Cast";
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0b0b0c; color: #f4f4f5; padding: 20px; text-align: center; }
          .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #c7a24b; color: #000; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; color: #856404; }
          .url-fallback { word-break: break-all; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HubMovies Cast</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password for your HubMovies Cast account.</p>
            <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="url-fallback">
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p>${resetUrl}</p>
            </div>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>This is an automated email from HubMovies Cast.</p>
            <p>The reset link will expire in 1 hour for security reasons.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: userEmail, subject, html });
}

/**
 * Send new message notification email
 */
export async function sendMessageNotificationEmail(
  talentEmail: string,
  jobTitle: string,
  directorName?: string
): Promise<boolean> {
  const subject = `New Message from Casting Director - ${jobTitle}`;
  const directorText = directorName ? ` from ${directorName}` : "";
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0b0b0c; color: #f4f4f5; padding: 20px; text-align: center; }
          .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #c7a24b; color: #000; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HubMovies Cast</h1>
          </div>
          <div class="content">
            <h2>New Message</h2>
            <p>You have received a new message${directorText} regarding your application for <strong>${jobTitle}</strong>.</p>
            <p>Log in to your dashboard to view the message and respond.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://hubmovies-cd.com"}/talent/dashboard" class="button">View Message</a>
          </div>
          <div class="footer">
            <p>This is an automated notification from HubMovies Cast.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: talentEmail, subject, html });
}

/**
 * Send email verification email
 * Used by NextAuth email provider
 */
export async function sendVerificationEmail(
  userEmail: string,
  verificationUrl: string
): Promise<boolean> {
  const subject = "Verify Your Email - HubMovies Cast";
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0b0b0c; color: #f4f4f5; padding: 20px; text-align: center; }
          .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: #c7a24b; color: #000; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; color: #856404; }
          .url-fallback { word-break: break-all; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HubMovies Cast</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Welcome to HubMovies Cast! Please verify your email address to complete your account setup.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <div class="url-fallback">
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p>${verificationUrl}</p>
            </div>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.</div>
          </div>
          <div class="footer">
            <p>This is an automated email from HubMovies Cast.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: userEmail, subject, html });
}

/**
 * Send OTP email for sign-in (used for one-time code flow)
 */
export async function sendOtpEmail(userEmail: string, otp: string, expiresMinutes = 10): Promise<boolean> {
  const subject = "Your HubMovies sign-in code";
  const expiryText = `${expiresMinutes} minute${expiresMinutes === 1 ? '' : 's'}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0b0b0c; color: #f4f4f5; padding: 20px; text-align: center; }
          .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
          .code { font-size: 28px; font-weight: 700; letter-spacing: 4px; background: #f4f4f5; padding: 14px 18px; display: inline-block; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HubMovies Cast</h1>
          </div>
          <div class="content">
            <h2>Your sign-in code</h2>
            <p>Use the following one-time code to sign in. It will expire in ${expiryText}.</p>
            <div class="code">${otp}</div>
            <p>If you didn't request this code, please ignore this message.</p>
            <p class="footer">This is an automated email from HubMovies Cast.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: userEmail, subject, html });
}

/**
 * Send admin notification when a director posts a new job requiring approval.
 */
export async function sendDirectorJobApprovalRequestEmail(
  adminEmail: string,
  payload: {
    jobId: string;
    title: string;
    directorName?: string;
    directorEmail?: string;
    approveUrl: string;
  }
): Promise<boolean> {
  const subject = `Job Approval Required - ${payload.title}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0b0b0c; color: #f4f4f5; padding: 20px; text-align: center; }
          .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
          .button { display: inline-block; padding: 12px 24px; background: #c7a24b; color: #000; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: 700; }
          .meta { background: #f5f5f5; border-radius: 6px; padding: 12px; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HubMovies Admin Alert</h1>
          </div>
          <div class="content">
            <h2>New Director Job Pending Approval</h2>
            <div class="meta">
              <p><strong>Job:</strong> ${payload.title}</p>
              <p><strong>Director:</strong> ${payload.directorName || "Unknown"}</p>
              <p><strong>Director Email:</strong> ${payload.directorEmail || "Unknown"}</p>
              <p><strong>Job ID:</strong> ${payload.jobId}</p>
            </div>
            <p>Click the button below to open admin review and confirm this job.</p>
            <a href="${payload.approveUrl}" class="button">Review & Confirm Job</a>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: adminEmail, subject, html });
}
