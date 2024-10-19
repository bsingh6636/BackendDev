
import nodemailer from 'nodemailer';
export const SendformData = (req, res) => {
  console.log('hi')
  const { name, email, message } = req.body;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  const textMessage = `From: ${email}\tMessage:\t${message}`;
  console.log(textMessage)
  const mailOptions = {
    from: email,
    to: 'bkushwaha.dev@gmail.com',
    subject: `New message from ${name}`,
    text: textMessage
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.json({ status: 'error', error });
    }
    res.json({ status: 'success' });
  });
}