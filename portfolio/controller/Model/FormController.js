import nodemailer from 'nodemailer';

export const SendformData = (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ status: 'error', message: 'Name is required' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ status: 'error', message: 'Email is required' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ status: 'error', message: 'Message is required' });
  }

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
    subject: `Portfolio Contact: ${name}`,
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

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Nodemailer error:', error);
      return res.status(500).json({ status: 'error', error: error.message || error });
    }
    return res.status(200).json({ status: 'success', message: 'Message sent successfully' });
  });
};