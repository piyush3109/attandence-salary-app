const nodemailer = require('nodemailer');
const { cacheSet, cacheGet, cacheDel } = require('../config/redis');

// --------------------------------------------------------------------------
// Transporter factory
// --------------------------------------------------------------------------
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'your-email@gmail.com',
            pass: process.env.EMAIL_PASS || 'your-app-password'
        }
    });
};

// --------------------------------------------------------------------------
// OTP helpers — backed by Redis (or in-memory fallback)
// --------------------------------------------------------------------------
const OTP_TTL_SECONDS = 10 * 60; // 10 minutes
const OTP_PREFIX = 'otp:';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const storeOTP = async (email, otp) => {
    await cacheSet(`${OTP_PREFIX}${email}`, otp, OTP_TTL_SECONDS);
};

const verifyStoredOTP = async (email, otp) => {
    const stored = await cacheGet(`${OTP_PREFIX}${email}`);
    if (!stored) return { valid: false, message: 'OTP not found. Please request a new one.' };
    if (stored !== otp) return { valid: false, message: 'Invalid OTP. Please try again.' };
    await cacheDel(`${OTP_PREFIX}${email}`);
    return { valid: true, message: 'Email verified successfully!' };
};

// --------------------------------------------------------------------------
// Email "from" helper
// --------------------------------------------------------------------------
const from = (label = 'WorkSync Team') =>
    `"${label}" <${process.env.EMAIL_USER || 'noreply@worksync.com'}>`;

// --------------------------------------------------------------------------
// Shared HTML wrapper
// --------------------------------------------------------------------------
const emailWrapper = (headerBg, headerContent, bodyContent) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:linear-gradient(135deg,#1a1f2e 0%,#0d1117 100%);border-radius:24px;overflow:hidden;border:1px solid #1e293b;">
    <div style="background:${headerBg};padding:40px 30px;text-align:center;">
      ${headerContent}
    </div>
    <div style="padding:40px 30px;">
      ${bodyContent}
    </div>
    <div style="background:#0d1117;padding:20px 30px;text-align:center;border-top:1px solid #1e293b;">
      <p style="color:#475569;font-size:11px;margin:0;">© ${new Date().getFullYear()} WorkSync. Attendance &amp; Salary Management.</p>
    </div>
  </div>
</body>
</html>`;

// --------------------------------------------------------------------------
// 1. Send OTP for email verification / registration
// --------------------------------------------------------------------------
const sendVerificationOTP = async (email, name) => {
    const otp = generateOTP();
    await storeOTP(email, otp);

    const html = emailWrapper(
        'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
        `<h1 style="color:white;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">🔐 Verify Your Email</h1>
         <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">One step away from joining WorkSync</p>`,
        `<p style="color:#cbd5e1;font-size:15px;margin:0 0 8px;">Hello <strong style="color:white;">${name}</strong>,</p>
         <p style="color:#94a3b8;font-size:14px;margin:0 0 30px;line-height:1.6;">Use the following code to complete your registration. It expires in <strong style="color:#a78bfa;">10 minutes</strong>.</p>
         <div style="background:#111827;border:2px dashed #6366f1;border-radius:16px;padding:24px;text-align:center;margin:0 0 30px;">
           <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:4px;margin:0 0 12px;font-weight:700;">Your Verification Code</p>
           <p style="color:#6366f1;font-size:42px;font-weight:900;letter-spacing:12px;margin:0;">${otp}</p>
         </div>
         <p style="color:#64748b;font-size:12px;margin:0;line-height:1.6;">If you didn't request this, please ignore this email. Never share this code.</p>`
    );

    try {
        await createTransporter().sendMail({ from: from(), to: email, subject: '🔐 Verify Your Email - WorkSync', html });
        return { success: true, message: 'OTP sent to your email' };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, message: 'Failed to send verification email.' };
    }
};

// --------------------------------------------------------------------------
// 2. Password Reset OTP
// --------------------------------------------------------------------------
const sendPasswordResetOTP = async (email, name) => {
    const otp = generateOTP();
    await cacheSet(`reset:${email}`, otp, OTP_TTL_SECONDS);

    const html = emailWrapper(
        'linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)',
        `<h1 style="color:white;margin:0;font-size:28px;font-weight:800;">🔑 Reset Your Password</h1>
         <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">We received a password change request</p>`,
        `<p style="color:#cbd5e1;font-size:15px;margin:0 0 8px;">Hello <strong style="color:white;">${name}</strong>,</p>
         <p style="color:#94a3b8;font-size:14px;margin:0 0 30px;line-height:1.6;">Use the code below to reset your password. It expires in <strong style="color:#fbbf24;">10 minutes</strong>.</p>
         <div style="background:#111827;border:2px dashed #f59e0b;border-radius:16px;padding:24px;text-align:center;margin:0 0 30px;">
           <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:4px;margin:0 0 12px;font-weight:700;">Reset Code</p>
           <p style="color:#f59e0b;font-size:42px;font-weight:900;letter-spacing:12px;margin:0;">${otp}</p>
         </div>
         <div style="background:#1c1917;border-left:4px solid #ef4444;border-radius:8px;padding:14px 16px;margin:0 0 16px;">
           <p style="color:#fca5a5;font-size:13px;margin:0;">⚠️ If you did not request a password change, please secure your account immediately.</p>
         </div>
         <p style="color:#64748b;font-size:12px;margin:0;">Never share this code with anyone, including WorkSync staff.</p>`
    );

    try {
        await createTransporter().sendMail({ from: from('WorkSync Security'), to: email, subject: '🔑 Password Reset Code - WorkSync', html });
        return { success: true, message: 'Password reset OTP sent to your email' };
    } catch (error) {
        console.error('Password reset email error:', error);
        return { success: false, message: 'Failed to send password reset email.' };
    }
};

const verifyPasswordResetOTP = async (email, otp) => {
    const stored = await cacheGet(`reset:${email}`);
    if (!stored) return { valid: false, message: 'OTP not found. Please request a new one.' };
    if (stored !== otp) return { valid: false, message: 'Invalid OTP. Please try again.' };
    // Don't delete yet — keep it so the reset step can confirm it was verified
    await cacheDel(`reset:${email}`);
    // Mark as verified so the change-password step doesn't require OTP again
    await cacheSet(`reset_verified:${email}`, '1', 15 * 60); // 15-min window
    return { valid: true, message: 'OTP verified. You may now set a new password.' };
};

// --------------------------------------------------------------------------
// 3. Password Changed Confirmation Email
// --------------------------------------------------------------------------
const sendPasswordChangedEmail = async (email, name) => {
    const html = emailWrapper(
        'linear-gradient(135deg,#10b981 0%,#059669 100%)',
        `<h1 style="color:white;margin:0;font-size:28px;font-weight:800;">✅ Password Changed</h1>
         <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your account password was updated</p>`,
        `<p style="color:#cbd5e1;font-size:15px;margin:0 0 8px;">Hello <strong style="color:white;">${name}</strong>,</p>
         <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.6;">Your WorkSync account password was successfully changed on <strong style="color:#6ee7b7;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong>.</p>
         <div style="background:#1c1917;border-left:4px solid #ef4444;border-radius:8px;padding:14px 16px;">
           <p style="color:#fca5a5;font-size:13px;margin:0;">🚨 If you did NOT change your password, please contact your administrator immediately or reset your password now.</p>
         </div>`
    );

    try {
        await createTransporter().sendMail({ from: from('WorkSync Security'), to: email, subject: '✅ Password Changed - WorkSync', html });
        return { success: true };
    } catch (error) {
        console.error('Password changed email error:', error);
        return { success: false };
    }
};

// --------------------------------------------------------------------------
// 4. Welcome / Greeting Email
// --------------------------------------------------------------------------
const sendGreetingEmail = async (email, name, employeeId) => {
    const html = emailWrapper(
        'linear-gradient(135deg,#10b981 0%,#059669 100%)',
        `<h1 style="color:white;margin:0;font-size:28px;font-weight:800;">🎉 Welcome Aboard!</h1>
         <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your account has been created successfully</p>`,
        `<p style="color:#cbd5e1;font-size:15px;margin:0 0 8px;">Hello <strong style="color:white;">${name}</strong>,</p>
         <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.6;">Welcome to <strong style="color:#10b981;">WorkSync</strong>! Your account is ready. Here are your details:</p>
         <div style="background:#111827;border-radius:16px;padding:24px;margin:0 0 24px;">
           <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #1e293b;">
             <span style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Name</span>
             <span style="color:white;font-size:14px;font-weight:600;">${name}</span>
           </div>
           <div style="display:flex;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #1e293b;">
             <span style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Email</span>
             <span style="color:white;font-size:14px;font-weight:600;">${email}</span>
           </div>
           ${employeeId ? `
           <div style="display:flex;justify-content:space-between;">
             <span style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Employee ID</span>
             <span style="color:#10b981;font-size:14px;font-weight:700;">${employeeId}</span>
           </div>` : ''}
         </div>
         <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);border-radius:12px;padding:16px 20px;text-align:center;">
           <p style="color:white;font-size:13px;margin:0;font-weight:600;">✅ You can now log in and start using WorkSync!</p>
         </div>`
    );

    try {
        await createTransporter().sendMail({ from: from(), to: email, subject: '🎉 Welcome to WorkSync - You\'re All Set!', html });
        return { success: true };
    } catch (error) {
        console.error('Greeting email error:', error);
        return { success: false };
    }
};

// --------------------------------------------------------------------------
// 5. Generic Notification Email
// --------------------------------------------------------------------------
const sendNotificationEmail = async (email, name, subject, message) => {
    const html = emailWrapper(
        'linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)',
        `<h1 style="color:white;margin:0;font-size:22px;font-weight:800;">📬 ${subject}</h1>`,
        `<p style="color:#cbd5e1;font-size:15px;margin:0 0 20px;">Hello <strong style="color:white;">${name}</strong>,</p>
         <div style="background:#111827;border-radius:12px;padding:20px;border-left:4px solid #3b82f6;">
           <p style="color:#94a3b8;font-size:14px;margin:0;line-height:1.7;">${message}</p>
         </div>`
    );

    try {
        await createTransporter().sendMail({ from: from('WorkSync Notifications'), to: email, subject: `📬 ${subject}`, html });
        return { success: true };
    } catch (error) {
        console.error('Notification email error:', error);
        return { success: false };
    }
};

// --------------------------------------------------------------------------
// 6. Role Assignment Notification
// --------------------------------------------------------------------------
const sendRoleChangeEmail = async (email, name, newRole, changedBy) => {
    const roleColors = {
        admin: '#ef4444', ceo: '#8b5cf6', manager: '#3b82f6',
        accountant: '#10b981', hr: '#f59e0b', employee: '#64748b'
    };
    const color = roleColors[newRole] || '#3b82f6';

    const html = emailWrapper(
        `linear-gradient(135deg,${color} 0%,${color}cc 100%)`,
        `<h1 style="color:white;margin:0;font-size:26px;font-weight:800;">🏷️ Role Updated</h1>
         <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your access level has changed</p>`,
        `<p style="color:#cbd5e1;font-size:15px;margin:0 0 8px;">Hello <strong style="color:white;">${name}</strong>,</p>
         <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.6;">Your role in WorkSync has been updated by <strong style="color:white;">${changedBy}</strong>.</p>
         <div style="background:#111827;border-radius:16px;padding:24px;text-align:center;margin:0 0 24px;">
           <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:3px;margin:0 0 10px;font-weight:700;">New Role</p>
           <p style="color:${color};font-size:28px;font-weight:900;margin:0;text-transform:uppercase;letter-spacing:4px;">${newRole}</p>
         </div>
         <p style="color:#64748b;font-size:12px;margin:0;">Log in to see your updated permissions and dashboard.</p>`
    );

    try {
        await createTransporter().sendMail({ from: from('WorkSync Admin'), to: email, subject: `🏷️ Your Role Was Updated - ${newRole.toUpperCase()}`, html });
        return { success: true };
    } catch (error) {
        console.error('Role change email error:', error);
        return { success: false };
    }
};

module.exports = {
    generateOTP,
    storeOTP,
    verifyStoredOTP,
    sendVerificationOTP,
    sendPasswordResetOTP,
    verifyPasswordResetOTP,
    sendPasswordChangedEmail,
    sendGreetingEmail,
    sendNotificationEmail,
    sendRoleChangeEmail
};
