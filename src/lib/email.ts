import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface ReplyEmailParams {
  to: string;
  toName: string;
  subject: string;
  originalMessage: string;
  replyText: string;
  repliedBy: string;
}
export async function sendPasswordResetEmail(
  to: string,
  toName: string,
  resetLink: string,
) {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto">
      <h2>Password Reset Request</h2>
      <p>Hello ${toName || 'there'},</p>
      <p>We received a request to reset your password. Click the button below to set a new password. This link will expire soon.</p>
      <p style="text-align:center; margin:24px 0">
        <a href="${resetLink}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">Reset Password</a>
      </p>
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="word-break:break-all">${resetLink}</p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p>— Texplore Club</p>
    </div>
  `;

  const mailOptions = {
    from: `Texplore Club <${process.env.SMTP_USER || 'noreply@texploreclub.org'}>`,
    to,
    subject: 'Reset your Texplore account password',
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

// Create transporter
const createTransporter = () => {
  const config: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };

  return nodemailer.createTransport(config);
};

// Send reply email
export async function sendReplyEmail(params: ReplyEmailParams) {
  const { to, toName, subject, originalMessage, replyText, repliedBy } = params;

  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reply from Texplore Club</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .original-message { background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
        .reply { background: #e7f3ff; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Reply from Texplore Club</h2>
          <p>Dear ${toName},</p>
        </div>
        
        <div class="content">
          <p>Thank you for contacting Texplore Club. Here is our response to your inquiry:</p>
          
          <div class="original-message">
            <strong>Your original message:</strong><br>
            ${originalMessage.replace(/\n/g, '<br>')}
          </div>
          
          <div class="reply">
            <strong>Our reply:</strong><br>
            ${replyText.replace(/\n/g, '<br>')}
          </div>
          
          <p>If you have any further questions, please don't hesitate to contact us again.</p>
          
          <p>Best regards,<br>
          <strong>${repliedBy}</strong><br>
          Texplore Club Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated response from the Texplore Club contact system.</p>
          <p>© 2024 Texplore Club - Amity University Mohali</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Texplore Club" <${process.env.SMTP_USER || 'noreply@texploreclub.org'}>`,
    to: `${toName} <${to}>`,
    subject: subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Send notification email to admin (optional)
export async function sendAdminNotification(submission: any) {
  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Contact Form Submission</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .content { background: #fff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Contact Form Submission</h2>
        </div>
        
        <div class="content">
          <p>A new contact form has been submitted:</p>
          
          <div class="details">
            <strong>From:</strong> ${submission.name} (${submission.email})<br>
            <strong>Date:</strong> ${new Date(submission.createdAt).toLocaleString()}<br>
            <strong>Message:</strong><br>
            ${submission.message.replace(/\n/g, '<br>')}
          </div>
          
          <p>Please log in to the admin dashboard to respond to this inquiry.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Texplore Club" <${process.env.SMTP_USER || 'noreply@texploreclub.org'}>`,
    to: process.env.ADMIN_EMAIL || 'admin@texploreclub.org',
    subject: `New Contact Form Submission by ${submission.email}`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Admin notification sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending admin notification:', error);
    // Don't throw error for admin notifications
  }
}
