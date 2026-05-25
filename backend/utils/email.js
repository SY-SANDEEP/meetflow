const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: { rejectUnauthorized: false }
  });
};

const emailTemplates = {
  bookingConfirmation: (meeting, slot, user) => ({
    subject: `✅ Meeting Confirmed: ${meeting.title}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: white;">MeetFlow</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8);">Meeting Confirmed</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 18px;">Hi ${user.name},</p>
          <p>Your meeting has been successfully booked!</p>
          <div style="background: #1e1e2e; border: 1px solid #6366f1; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px; color: #818cf8;">${meeting.title}</h3>
            <p style="margin: 8px 0;">📅 <strong>Date:</strong> ${new Date(slot.date).toDateString()}</p>
            <p style="margin: 8px 0;">⏰ <strong>Time:</strong> ${slot.startTime} - ${slot.endTime}</p>
            <p style="margin: 8px 0;">📍 <strong>Location:</strong> ${slot.location}</p>
            <p style="margin: 8px 0;">🔗 <strong>Type:</strong> ${slot.meetingType}</p>
            ${slot.meetingLink ? `<p style="margin: 8px 0;">🌐 <strong>Meeting Link:</strong> <a href="${slot.meetingLink}" style="color: #818cf8;">${slot.meetingLink}</a></p>` : ''}
          </div>
          ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
          <p style="color: #94a3b8; font-size: 14px; margin-top: 32px;">If you need to reschedule, please log in to your MeetFlow dashboard.</p>
        </div>
        <div style="background: #1e1e2e; padding: 16px; text-align: center; color: #64748b; font-size: 12px;">
          © 2024 MeetFlow — Smart Scheduling Platform
        </div>
      </div>
    `
  }),

  cancellationNotice: (meeting, slot, user) => ({
    subject: `❌ Meeting Cancelled: ${meeting.title}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: white;">MeetFlow</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8);">Meeting Cancelled</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 18px;">Hi ${user.name},</p>
          <p>Your meeting has been cancelled.</p>
          <div style="background: #1e1e2e; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px; color: #f87171;">${meeting.title}</h3>
            <p style="margin: 8px 0;">📅 <strong>Date:</strong> ${new Date(slot.date).toDateString()}</p>
            <p style="margin: 8px 0;">⏰ <strong>Time:</strong> ${slot.startTime} - ${slot.endTime}</p>
            ${meeting.cancellationReason ? `<p style="margin: 8px 0;">📝 <strong>Reason:</strong> ${meeting.cancellationReason}</p>` : ''}
          </div>
          <p style="color: #94a3b8; font-size: 14px;">You can book another slot from your MeetFlow dashboard.</p>
        </div>
      </div>
    `
  }),

  rescheduleNotice: (meeting, oldSlot, newSlot, user) => ({
    subject: `🔄 Meeting Rescheduled: ${meeting.title}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: white;">MeetFlow</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8);">Meeting Rescheduled</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 18px;">Hi ${user.name},</p>
          <p>Your meeting has been rescheduled to a new time slot.</p>
          <div style="background: #1e1e2e; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px; color: #fbbf24;">${meeting.title}</h3>
            <p style="margin: 8px 0; color: #94a3b8;"><s>Old: ${new Date(oldSlot.date).toDateString()} ${oldSlot.startTime}</s></p>
            <p style="margin: 8px 0; color: #4ade80;">New: ${new Date(newSlot.date).toDateString()} ${newSlot.startTime} - ${newSlot.endTime}</p>
            <p style="margin: 8px 0;">📍 <strong>Location:</strong> ${newSlot.location}</p>
          </div>
        </div>
      </div>
    `
  }),

  reminder: (meeting, slot, user) => ({
    subject: `⏰ Reminder: Meeting tomorrow - ${meeting.title}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #06b6d4, #0891b2); padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; color: white;">MeetFlow</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8);">Meeting Reminder</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 18px;">Hi ${user.name},</p>
          <p>This is a reminder that you have a meeting tomorrow!</p>
          <div style="background: #1e1e2e; border: 1px solid #06b6d4; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px; color: #22d3ee;">${meeting.title}</h3>
            <p style="margin: 8px 0;">📅 <strong>Date:</strong> ${new Date(slot.date).toDateString()}</p>
            <p style="margin: 8px 0;">⏰ <strong>Time:</strong> ${slot.startTime} - ${slot.endTime}</p>
            ${slot.meetingLink ? `<p style="margin: 8px 0;">🌐 <a href="${slot.meetingLink}" style="color: #22d3ee;">Join Meeting</a></p>` : ''}
          </div>
        </div>
      </div>
    `
  })
};

const sendEmail = async ({ to, ...template }) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'MeetFlow <noreply@meetflow.com>',
      to,
      subject: template.subject,
      html: template.html
    });
    console.log(`📧 Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};

module.exports = { sendEmail, emailTemplates };
