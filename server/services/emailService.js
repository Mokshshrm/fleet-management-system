import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
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
