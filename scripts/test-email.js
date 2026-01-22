const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testEmail() {
    console.log('--- Email Configuration Test ---');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);
    console.log('Secure:', process.env.SMTP_SECURE);
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('Error: SMTP_USER or SMTP_PASS is missing in .env.local');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection verified successfully');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: `"Project Hub Test" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Send to self
            subject: 'Test Notification - System Check',
            text: 'This is a test email from the Project Hub notification system.',
            html: '<b>This is a test email from the Project Hub notification system.</b>',
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
    } catch (error) {
        console.error('❌ Error testing email:');
        console.error(error);
        
        if (error.code === 'EAUTH') {
            console.error('\nTIP: Authentication failed. If using Gmail, make sure you have "2-Step Verification" enabled and are using an "App Password" (not your regular account password).');
        }
    }
}

testEmail();
