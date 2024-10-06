import express from 'express';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoConnection from './dbConnection.js'; 
import { config } from 'dotenv';
import resumeRouter from './portfolio/routers/portfolioRouter.js'

config({
  path:'./config.env'
})
const app = express();
app.use(cors());
app.use(bodyParser.json());

// app.post('/api/contact', (req, res) => {
//   const { name, email, message } = req.body;
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });
//   const textMessage = `From: ${email}\tMessage:\t${message}`;
//   console.log(textMessage)
//   const mailOptions = {
//     from: email,
//     to: 'bsingh6636@outlook.com',
//     subject: `New message from ${name}`,
//     text: textMessage
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.log(error);
//       return res.json({ status: 'error',error });
//     }
//     res.json({ status: 'success' });
//   });
// });

app.use('/api/',resumeRouter)
  console.log('hi')
mongoConnection()
  .then(()=>{
    console.log('Database connected');
    app.listen(5000, () =>console.log('Server running on port 5000'));})
  .catch((err)=>console.log(err));  

