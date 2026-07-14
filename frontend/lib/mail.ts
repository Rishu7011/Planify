/**
 * Transactional email helper (Nodemailer) — used for signup set-password links.
 */

import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.EMAIL_SERVER_HOST;
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  const port = Number(process.env.EMAIL_SERVER_PORT || 587);

  if (!host || !user || !pass) {
    throw new Error("Email server is not configured (EMAIL_SERVER_* env vars).");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendSetPasswordEmail(params: {
  to: string;
  name: string;
  setPasswordUrl: string;
}): Promise<void> {
  const from = process.env.EMAIL_FROM || "noreply@planify.com";
  const transporter = getTransporter();

  const safeName = params.name.trim() || "there";

  await transporter.sendMail({
    to: params.to,
    from,
    subject: "Set your Planify password",
    text: `Hi ${safeName},

Welcome to Planify. Click the link below to create your password (expires in 1 hour):

${params.setPasswordUrl}

If you didn't sign up, you can ignore this email.`,
    html: `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f1220;background:#f7f8fc;">
        <div style="background:#0F1220;border-radius:20px;padding:28px;color:#F7F8FC;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#aec6ff;font-weight:700;">Planify</p>
          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;">Set your password</h1>
          <p style="margin:0 0 20px;color:#B4BCCB;font-size:15px;line-height:1.55;">
            Hi ${safeName}, thanks for signing up. Create a password to finish setting up your account.
          </p>
          <a href="${params.setPasswordUrl}"
             style="display:inline-block;background:linear-gradient(90deg,#4F8DFF,#8E6BFF);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:12px;">
            Create password
          </a>
          <p style="margin:24px 0 0;color:#7C869A;font-size:12px;line-height:1.5;">
            This link expires in 1 hour. If the button doesn’t work, paste this URL into your browser:<br/>
            <span style="word-break:break-all;color:#aec6ff;">${params.setPasswordUrl}</span>
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendPasswordOtpEmail(params: {
  to: string;
  name?: string;
  otp: string;
}): Promise<void> {
  const from = process.env.EMAIL_FROM || "noreply@planify.com";
  const transporter = getTransporter();
  const safeName = (params.name || "").trim() || "there";

  await transporter.sendMail({
    to: params.to,
    from,
    subject: "Your Planify password code",
    text: `Hi ${safeName},

Your Planify password change code is: ${params.otp}

It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f1220;background:#f7f8fc;">
        <div style="background:#0F1220;border-radius:20px;padding:28px;color:#F7F8FC;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#aec6ff;font-weight:700;">Planify</p>
          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;">Password change code</h1>
          <p style="margin:0 0 20px;color:#B4BCCB;font-size:15px;line-height:1.55;">
            Hi ${safeName}, use this one-time code to change your password:
          </p>
          <p style="margin:0 0 8px;font-size:32px;letter-spacing:0.35em;font-weight:800;color:#F7F8FC;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">
            ${params.otp}
          </p>
          <p style="margin:20px 0 0;color:#7C869A;font-size:12px;line-height:1.5;">
            Expires in 10 minutes. Never share this code with anyone.
          </p>
        </div>
      </div>
    `,
  });
}
