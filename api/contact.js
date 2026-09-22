import nodemailer from 'nodemailer';

const ALLOWED_ORIGINS = [
  'https://brijeshhq.com',
  'http://brijeshhq.com',
  'https://www.brijeshhq.com',
  'http://www.brijeshhq.com',
  'https://brijeshkushwaha.com.np',
  'http://brijeshkushwaha.com.np',
  'https://www.brijeshkushwaha.com.np',
  'http://www.brijeshkushwaha.com.np',
  'https://brijeshkushwaha6636.netlify.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
];

function applyCors(req, res) {
  const origin = req.headers.origin;
  const isAllowed =
    !origin ||
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.brijeshhq.com') ||
    origin.endsWith('.brijeshkushwaha.com.np') ||
    origin.endsWith('.netlify.app') ||
    origin.endsWith('.vercel.app');

  res.setHeader('Access-Control-Allow-Origin', isAllowed && origin ? origin : '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
  }

  const { name, email, message } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ status: 'error', message: 'Name is required' });
  }
  if (!email || !String(email).trim()) {
    return res.status(400).json({ status: 'error', message: 'Email is required' });
  }
  if (!message || !String(message).trim()) {
    return res.status(400).json({ status: 'error', message: 'Message is required' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: 'brijesh@brijeshhq.com',
      cc: 'bkushwaha.dev@gmail.com',
      subject: `Portfolio Message from ${name}`,
      text: `From: ${name} (${email})\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #0284c7; margin-top: 0; font-size: 20px;">New Message from Portfolio</h2>
          <div style="margin: 16px 0; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 14px; line-height: 1.6;">
            <p style="margin: 4px 0;"><strong>Sender Name:</strong> ${name}</p>
            <p style="margin: 4px 0;"><strong>Sender Email:</strong> <a href="mailto:${email}" style="color: #0284c7;">${email}</a></p>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <h3 style="color: #334155; font-size: 15px; margin-bottom: 8px;">Message:</h3>
          <div style="white-space: pre-wrap; background: #f1f5f9; padding: 16px; border-radius: 8px; color: #1e293b; font-size: 14px; line-height: 1.5;">${message}</div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">Hit Reply to respond directly to ${email}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ status: 'success', message: 'Message sent successfully' });
  } catch (error) {
    console.error('Email delivery error:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Failed to send email' });
  }
}
