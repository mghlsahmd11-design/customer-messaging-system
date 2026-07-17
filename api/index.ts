import express from 'express';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import nodemailer from 'nodemailer';

export const config = {
  export const config = {
  runtime: 'nodejs20.x',
};
};

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'dummy-project-id'
    });
  } catch (e) {
    console.error('Firebase admin init error:', e);
  }
}

const app = express();

// Middleware to parse JSON
app.use(express.json());

// API endpoint
app.post('/send-email', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const idToken = authHeader.split('Bearer ')[1];
  try {
    await getAuth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { to, subject, text, settings } = req.body;
    
    if (!to || !text || !settings) {
      return res.status(400).json({ error: 'Missing required email fields or settings' });
    }

    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
      return res.status(400).json({ error: 'Incomplete SMTP settings.' });
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort) || 587,
      secure: parseInt(settings.smtpPort) === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });

    const mailOptions = {
      from: `"${settings.senderName || 'Support'}" <${settings.senderEmail || settings.smtpUser}>`,
      to: to,
      replyTo: settings.replyToEmail || settings.senderEmail || settings.smtpUser,
      subject: `Re: ${subject}`,
      text: text, 
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

export default app;
