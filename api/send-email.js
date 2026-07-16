import { getAuth } from 'firebase-admin/auth';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

if (!admin.apps.length) {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    let projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    
    if (!projectId && fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      projectId = config.projectId;
    }
    
    admin.initializeApp({ projectId });
  } catch (e) {
    console.error('Firebase admin init error', e);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying auth token', error);
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
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}
