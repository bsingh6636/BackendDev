import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
    resumeLink: {
        type: String,
        required: true
    }
}, { timestamps: true });

const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);
export { Resume };