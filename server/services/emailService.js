import nodemailer from 'nodemailer';

let transporter = null;
let transporterInitialized = false;

// Initialize transporter lazily (only when first email is sent)
const initializeTransporter = async () => {
  if (transporterInitialized) {
    return;
  }

  transporterInitialized = true;

  // Check if SMTP is configured
  const isSmtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (isSmtpConfigured) {
    // Use configured SMTP server
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('✅ Email service: Using SMTP server');
    console.log(`   Host: ${process.env.SMTP_HOST}`);
    console.log(`   User: ${process.env.SMTP_USER}`);
  } else {
    // Fallback: Create test account with Ethereal
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('📧 Email service: Using Ethereal (test mode)');
      console.log(`   View emails at: https://ethereal.email/messages`);
      console.log(`   Login: ${testAccount.user} / ${testAccount.pass}`);
    } catch (error) {
      // Fallback: Log to console only
      transporter = null;
      console.log('📧 Email service: Console mode (emails will be logged only)');
    }
  }
};

export const sendEmail = async ({ to, subject, html }) => {
  // Initialize transporter on first use
  await initializeTransporter();

  // If no transporter is ready, just log to console
  if (!transporter) {
    console.log('\n📧 ========== EMAIL (Console Mode) ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('----------------------------------------');
    console.log(html.substring(0, 200) + '...');
    console.log('===========================================\n');
    return { success: true, messageId: 'console-' + Date.now(), mode: 'console' };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@fleetflow.local',
      to,
      subject,
      html
    });

    // If using Ethereal, provide preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`\n📧 Email sent to: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Preview: ${previewUrl}\n`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    
    // Fallback to console logging if sending fails
    console.log('\n📧 ========== EMAIL (Fallback) ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('========================================\n');
    
    return { success: false, error: error.message };
  }
};

export const sendInvitationEmail = async ({ email, inviterName, companyName, token, role }) => {
  const inviteLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FleetFlow Invitation</h1>
        </div>
        <div class="content">
          <h2>You've been invited!</h2>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on FleetFlow.</p>
          <p>You will be joining as a <strong>${role.replace('_', ' ').toUpperCase()}</strong>.</p>
          <p>Click the button below to accept the invitation and create your account:</p>
          <a href="${inviteLink}" class="button">Accept Invitation</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb;">${inviteLink}</p>
          <p><strong>Note:</strong> This invitation will expire in 7 days.</p>
        </div>
        <div class="footer">
          <p>This invitation was sent to ${email}. If you didn't expect this email, you can safely ignore it.</p>
          <p>&copy; 2026 FleetFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `You're invited to join ${companyName} on FleetFlow`,
    html
  });
};

export const sendWelcomeEmail = async (email, firstName, companyName) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to FleetFlow!</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>Welcome to FleetFlow! Your account for <strong>${companyName}</strong> has been successfully created.</p>
          <p>You can now log in to the system and start managing your fleet operations efficiently.</p>
          <a href="${process.env.FRONTEND_URL}/login" class="button">Log In Now</a>
          <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>This email was sent to ${email}.</p>
          <p>&copy; 2026 FleetFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `Welcome to FleetFlow!`,
    html
  });
};

export const sendTripAssignmentEmail = async ({ email, driverName, tripNumber, origin, destination, departureTime }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .trip-details { background: white; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Trip Assignment</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${driverName}</strong>,</p>
          <p>You have been assigned to a new trip.</p>
          <div class="trip-details">
            <p><strong>Trip Number:</strong> ${tripNumber}</p>
            <p><strong>From:</strong> ${origin}</p>
            <p><strong>To:</strong> ${destination}</p>
            <p><strong>Departure:</strong> ${new Date(departureTime).toLocaleString()}</p>
          </div>
          <p>Please log in to the FleetFlow system for complete trip details.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 FleetFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `New Trip Assignment - ${tripNumber}`,
    html
  });
};

export const sendMaintenanceAlertEmail = async ({ email, managerName, vehicleName, maintenanceType, scheduledDate }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .alert { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Maintenance Alert</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${managerName}</strong>,</p>
          <div class="alert">
            <p><strong>Vehicle:</strong> ${vehicleName}</p>
            <p><strong>Maintenance Type:</strong> ${maintenanceType}</p>
            <p><strong>Scheduled Date:</strong> ${new Date(scheduledDate).toLocaleDateString()}</p>
          </div>
          <p>Please ensure the maintenance is performed as scheduled to keep the fleet operational.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 FleetFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `Maintenance Alert - ${vehicleName}`,
    html
  });
};

export const sendLicenseExpiryReminderEmail = async ({ email, driverName, expiryDate, daysUntilExpiry }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .warning { background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>License Expiry Reminder</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${driverName}</strong>,</p>
          <div class="warning">
            <p><strong>⚠️ Your driver's license will expire in ${daysUntilExpiry} days</strong></p>
            <p><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>
          </div>
          <p>Please renew your license before the expiration date. You will not be able to be assigned to trips if your license expires.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 FleetFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `License Expiry Reminder - ${daysUntilExpiry} days remaining`,
    html
  });
};

export const sendDriverCredentials = async ({ email, firstName, companyName, password }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .credentials { background: white; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .warning { background: #fef3c7; padding: 10px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to FleetFlow</h1>
        </div>
        <div class="content">
          <h2>Hi ${firstName},</h2>
          <p>Your driver account has been created by <strong>${companyName}</strong>. You can now access the FleetFlow system.</p>
          <div class="credentials">
            <h3>Your Login Credentials:</h3>
            <p><strong>Username:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 3px;">${password}</code></p>
          </div>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> Please change your password immediately after logging in for the first time.
          </div>
          <a href="${process.env.FRONTEND_URL}/login" class="button">Log In Now</a>
          <p>If you have any questions or need assistance, please contact your fleet manager.</p>
        </div>
        <div class="footer">
          <p>This email was sent to ${email}.</p>
          <p>&copy; 2026 FleetFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: `Your FleetFlow Driver Account - ${companyName}`,
    html
  });
};
