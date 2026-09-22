import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { config } from 'dotenv';
import resumeRouter from './portfolio/routers/portfolioRouter.js';

config();

const allowedOrigins = [
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

const app = express();
app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.brijeshhq.com') ||
      origin.endsWith('.brijeshkushwaha.com.np') ||
      origin.endsWith('.netlify.app') ||
      origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Portfolio Backend API' });
});

app.use('/api', resumeRouter);

// Local listener (skip in Vercel serverless environment)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server listening on PORT ${PORT}`);
  });
}

export default (req, res) => {
  return app(req, res);
};
