const nodemailer = require('nodemailer');

// Create reusable transporter
// For Gmail: Use App Password (not your real password)
// Go to Google Account > Security > 2-Step Verification > App passwords
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'your-email@gmail.com',
            pass: process.env.EMAIL_PASS || 'your-app-password'
        }
    });
};

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

const storeOTP = (email, otp) => {
    otpStore.set(email, {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
};

const verifyStoredOTP = (email, otp) => {
    const stored = otpStore.get(email);
    if (!stored) return { valid: false, message: 'OTP not found. Please request a new one.' };
    if (Date.now() > stored.expiresAt) {
        otpStore.delete(email);
        return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }
    if (stored.otp !== otp) return { valid: false, message: 'Invalid OTP. Please try again.' };
    otpStore.delete(email);
    return { valid: true, message: 'Email verified successfully!' };
};

// Send OTP verification email
const sendVerificationOTP = async (email, name) => {
    const otp = generateOTP();
    storeOTP(email, otp);

    const transporter = createTransporter();

    const mailOptions = {
        from: `"WorkSync Team" <${process.env.EMAIL_USER || 'noreply@worksync.com'}>`,
        to: email,
        subject: '🔐 Verify Your Email - WorkSync',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#0b0f19;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
            <div style="max-width:520px;margin:40px auto;background:linear-gradient(135deg,#1a1f2e 0%,#0d1117 100%);border-radius:24px;overflow:hidden;border:1px solid #1e293b;">
                <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:40px 30px;text-align:center;">
                    <h1 style="color:white;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">🔐 Verify Your Email</h1>
                    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">One step away from joining WorkSync</p>
                </div>
                <div style="padding:40px 30px;">
                    <p style="color:#cbd5e1;font-size:15px;margin:0 0 8px;">Hello <strong style="color:white;">${name}</strong>,</p>
                    <p style="color:#94a3b8;font-size:14px;margin:0 0 30px;line-height:1.6;">Use the following verification code to complete your registration. This code expires in <strong style="color:#a78bfa;">10 minutes</strong>.</p>
                    <div style="background:#111827;border:2px dashed #6366f1;border-radius:16px;padding:24px;text-align:center;margin:0 0 30px;">
                        <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:4px;margin:0 0 12px;font-weight:700;">Your Verification Code</p>
                        <p style="color:#6366f1;font-size:42px;font-weight:900;letter-spacing:12px;margin:0;">${otp}</p>
                    </div>
                    <p style="color:#64748b;font-size:12px;margin:0;line-height:1.6;">If you didn't request this code, please ignore this email. Do not share this code with anyone.</p>
                </div>
                <div style="background:#0d1117;padding:20px 30px;text-align:center;border-top:1px solid #1e293b;">
                    <p style="color:#475569;font-size:11px;margin:0;">© ${new Date().getFullYear()} WorkSync. Attendance & Salary Management.</p>
                </div>
            </div>
        </body>
        </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true, message: 'OTP sent to your email' };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, message: 'Failed to send verification email. Check email configuration.' };
    }
};

// Send greeting/welcome email after registration
const sendGreetingEmail = async (email, name, employeeId) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"WorkSync Team" <${process.env.EMAIL_USER || 'noreply@worksync.com'}>`,
        to: email,
        subject: '🎉 Welcome to WorkSync - You\'re All Set!',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#0b0f19;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
            <div style="max-width:520px;margin:40px auto;background:linear-gradient(135deg,#1a1f2e 0%,#0d1117 100%);border-radius:24px;overflow:hidden;border:1px solid #1e293b;">
                <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px 30px;text-align:center;">
                    <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">🎉 Welcome Aboard!</h1>
                    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your account has been created successfully</p>
                </div>
                <div style="padding:40px 30px;">
                    <p style="color:#cbd5e1;font-size:15px;margin:0 0 8px;">Hello <strong style="color:white;">${name}</strong>,</p>
                    <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;line-height:1.6;">Welcome to <strong style="color:#10b981;">WorkSync</strong>! Your account is now ready. Here are your details:</p>
                    
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
                    </div>
                </div>
                <div style="background:#0d1117;padding:20px 30px;text-align:center;border-top:1px solid #1e293b;">
                    <p style="color:#475569;font-size:11px;margin:0;">© ${new Date().getFullYear()} WorkSync. Attendance & Salary Management.</p>
                </div>
            </div>
        </body>
        </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Greeting email error:', error);
        return { success: false };
    }
};

// Send notification email (generic)
const sendNotificationEmail = async (email, name, subject, message) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"WorkSync Notifications" <${process.env.EMAIL_USER || 'noreply@worksync.com'}>`,
        to: email,
        subject: `📬 ${subject}`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#0b0f19;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
            <div style="max-width:520px;margin:40px auto;background:linear-gradient(135deg,#1a1f2e 0%,#0d1117 100%);border-radius:24px;overflow:hidden;border:1px solid #1e293b;">
                <div style="background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%);padding:32px 30px;text-align:center;">
                    <h1 style="color:white;margin:0;font-size:22px;font-weight:800;">📬 ${subject}</h1>
                </div>
                <div style="padding:32px 30px;">
                    <p style="color:#cbd5e1;font-size:15px;margin:0 0 20px;">Hello <strong style="color:white;">${name}</strong>,</p>
                    <div style="background:#111827;border-radius:12px;padding:20px;border-left:4px solid #3b82f6;">
                        <p style="color:#94a3b8;font-size:14px;margin:0;line-height:1.7;">${message}</p>
                    </div>
                </div>
                <div style="background:#0d1117;padding:16px 30px;text-align:center;border-top:1px solid #1e293b;">
                    <p style="color:#475569;font-size:11px;margin:0;">© ${new Date().getFullYear()} WorkSync</p>
                </div>
            </div>
        </body>
        </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Notification email error:', error);
        return { success: false };
    }
};

module.exports = {
    generateOTP,
    storeOTP,
    verifyStoredOTP,
    sendVerificationOTP,
    sendGreetingEmail,
    sendNotificationEmail
};
