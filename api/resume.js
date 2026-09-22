import mongoose from "mongoose";

const DEFAULT_RESUME = '/resume.pdf';

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

const resumeSchema = new mongoose.Schema({
  resumeLink: { type: String, required: true },
}, { timestamps: true });

const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);

async function connectDb() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URL) return;
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
      bufferCommands: false,
    });
  } catch (e) {
    console.warn('DB connect warning:', e.message);
  }
}

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

  // GET: Fetch latest resume URL
  if (req.method === 'GET') {
    try {
      await connectDb();
      if (mongoose.connection.readyState === 1) {
        const item = await Resume.findOne().sort({ _id: -1 }).lean().exec();
        if (item && item.resumeLink) {
          return res.status(200).json(item);
        }
      }
      return res.status(200).json({ resumeLink: DEFAULT_RESUME });
    } catch (err) {
      return res.status(200).json({ resumeLink: DEFAULT_RESUME });
    }
  }

  // POST: Add new resume link
  if (req.method === 'POST') {
    const { resumeLink } = req.body || {};
    if (!resumeLink) {
      return res.status(400).json({ status: 'error', message: 'resumeLink is required' });
    }
    try {
      await connectDb();
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ status: 'error', message: 'Database currently unavailable' });
      }
      const resume = new Resume({ resumeLink });
      const saved = await resume.save();
      return res.status(200).json(saved);
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  // PATCH: Update existing resume link
  if (req.method === 'PATCH') {
    const { newResumeLink } = req.body || {};
    if (!newResumeLink) {
      return res.status(400).json({ status: 'error', message: 'newResumeLink is required' });
    }
    try {
      await connectDb();
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ status: 'error', message: 'Database currently unavailable' });
      }
      const updated = await Resume.findOneAndUpdate(
        {},
        { resumeLink: newResumeLink },
        { new: true, upsert: true }
      );
      return res.status(200).json({ status: 'success', message: 'Successfully updated', resume: updated });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
