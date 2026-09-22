import mongoose from "mongoose";
import { Resume } from "../../model/ResumeSchema.js";
import mongoConnection from "../../dbConnection.js";

const DEFAULT_RESUME = '/resume.pdf';

export const addResumeLink = async (req, res) => {
  try {
    const resumeLink = req.body.resumeLink;
    if (!resumeLink) {
      return res.status(400).json({ message: 'resumeLink is required' });
    }
    await mongoConnection();
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database currently unavailable' });
    }
    const resume = new Resume({ resumeLink });
    const newResumeLink = await resume.save();
    return res.status(200).json(newResumeLink);
  } catch (error) {
    return res.status(500).json({ message: 'Error adding resume link', error: error.message });
  }
};

export const viewResumeLink = async (req, res) => {
  try {
    await mongoConnection();
    if (mongoose.connection.readyState === 1) {
      const item = await Resume.findOne().sort({ _id: -1 }).lean().exec();
      if (item && item.resumeLink) {
        return res.status(200).json(item);
      }
    }
    return res.status(200).json({ resumeLink: DEFAULT_RESUME });
  } catch (error) {
    console.warn('Falling back to default resume:', error.message);
    return res.status(200).json({ resumeLink: DEFAULT_RESUME });
  }
};

export const updateRsumeLink = async (req, res) => {
  try {
    const { newResumeLink } = req.body;
    if (!newResumeLink) {
      return res.status(400).json({ message: 'newResumeLink is required' });
    }
    await mongoConnection();
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database currently unavailable' });
    }
    const resume = await Resume.findOneAndUpdate(
      {},
      { resumeLink: newResumeLink },
      { new: true, upsert: true }
    );
    return res.status(200).json({
      message: 'Successfully updated',
      resume,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating resume link', error: error.message });
  }
};
