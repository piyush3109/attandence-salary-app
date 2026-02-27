/**
 * WhatsApp Service via Twilio
 * 
 * Setup Steps:
 * 1. Create Twilio account at https://www.twilio.com
 * 2. Activate the WhatsApp Sandbox in Twilio Console
 * 3. Get your Account SID & Auth Token from Dashboard
 * 4. Get the WhatsApp-enabled Twilio number
 * 5. Add these to your .env file:
 *    TWILIO_ACCOUNT_SID=your_account_sid
 *    TWILIO_AUTH_TOKEN=your_auth_token  
 *    TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  (sandbox number)
 */

const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

let client = null;

const getClient = () => {
    if (!client && accountSid && authToken) {
        client = twilio(accountSid, authToken);
    }
    return client;
};

/**
 * Send OTP via WhatsApp
 */
const sendWhatsAppOTP = async (phoneNumber, otp, name = 'User') => {
    const twilioClient = getClient();
    if (!twilioClient) {
        console.warn('Twilio not configured. Skipping WhatsApp OTP.');
        return { success: false, message: 'WhatsApp service not configured' };
    }

    try {
        const toNumber = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber.startsWith('+') ? phoneNumber : '+91' + phoneNumber}`;

        const message = await twilioClient.messages.create({
            from: fromNumber,
            to: toNumber,
            body: `🔐 *WorkSync OTP Verification*\n\nHello ${name}!\n\nYour verification code is: *${otp}*\n\nThis code expires in 10 minutes.\n\n⚠️ Do not share this code with anyone.\n\n— WorkSync Team`
        });

        console.log(`✅ WhatsApp OTP sent to ${phoneNumber}: SID ${message.sid}`);
        return { success: true, message: 'OTP sent via WhatsApp', sid: message.sid };
    } catch (error) {
        console.error('❌ WhatsApp OTP failed:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Send task notification via WhatsApp
 */
const sendTaskNotification = async (phoneNumber, employeeName, taskTitle, taskDetails) => {
    const twilioClient = getClient();
    if (!twilioClient) return { success: false, message: 'WhatsApp not configured' };

    try {
        const toNumber = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber.startsWith('+') ? phoneNumber : '+91' + phoneNumber}`;

        const message = await twilioClient.messages.create({
            from: fromNumber,
            to: toNumber,
            body: `📋 *New Task Assigned*\n\nHello ${employeeName}!\n\nYou have been assigned a new task:\n\n📌 *${taskTitle}*\n${taskDetails}\n\nPlease check the app for more details.\n\n— WorkSync Team`
        });

        return { success: true, sid: message.sid };
    } catch (error) {
        console.error('WhatsApp task notification failed:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Send salary notification via WhatsApp
 */
const sendSalaryNotification = async (phoneNumber, employeeName, amount, month) => {
    const twilioClient = getClient();
    if (!twilioClient) return { success: false, message: 'WhatsApp not configured' };

    try {
        const toNumber = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber.startsWith('+') ? phoneNumber : '+91' + phoneNumber}`;

        const message = await twilioClient.messages.create({
            from: fromNumber,
            to: toNumber,
            body: `💰 *Salary Update*\n\nHello ${employeeName}!\n\nYour salary for *${month}* has been processed.\n\n💵 Amount: *₹${amount.toLocaleString()}*\n\nPlease check the app for the full breakdown.\n\n— WorkSync Team`
        });

        return { success: true, sid: message.sid };
    } catch (error) {
        console.error('WhatsApp salary notification failed:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Send attendance reminder via WhatsApp
 */
const sendAttendanceReminder = async (phoneNumber, employeeName) => {
    const twilioClient = getClient();
    if (!twilioClient) return { success: false, message: 'WhatsApp not configured' };

    try {
        const toNumber = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber.startsWith('+') ? phoneNumber : '+91' + phoneNumber}`;

        const message = await twilioClient.messages.create({
            from: fromNumber,
            to: toNumber,
            body: `⏰ *Attendance Reminder*\n\nGood morning ${employeeName}! 🌅\n\nDon't forget to mark your attendance for today.\n\nHave a productive day! 🚀\n\n— WorkSync Team`
        });

        return { success: true, sid: message.sid };
    } catch (error) {
        console.error('WhatsApp attendance reminder failed:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Send generic WhatsApp message
 */
const sendWhatsAppMessage = async (phoneNumber, messageBody) => {
    const twilioClient = getClient();
    if (!twilioClient) return { success: false, message: 'WhatsApp not configured' };

    try {
        const toNumber = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber.startsWith('+') ? phoneNumber : '+91' + phoneNumber}`;

        const message = await twilioClient.messages.create({
            from: fromNumber,
            to: toNumber,
            body: messageBody
        });

        return { success: true, sid: message.sid };
    } catch (error) {
        console.error('WhatsApp message failed:', error.message);
        return { success: false, message: error.message };
    }
};

module.exports = {
    sendWhatsAppOTP,
    sendTaskNotification,
    sendSalaryNotification,
    sendAttendanceReminder,
    sendWhatsAppMessage
};
