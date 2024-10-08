import { Resume } from "../../model/ResumeSchema.js";

export const addResumeLink = async (req, res) => {
    const resumeLink = req.body.resumeLink;
    const resume = new Resume({ resumeLink });
    const newResumeLink = await resume.save();
    if (!newResumeLink)  return res.status(400).json({ message: 'No link found' });
    else return res.status(200).send(newResumeLink) 
}

export const viewResumeLink = async ( req , res ) =>{
    const item = await Resume.findOne();
    return res.status(200).json(item);
}

export const updateRsumeLink = async (req, res) => {
    const { newResumeLink } = req.body;
    const resume = await Resume.findOneAndUpdate({}, { resumeLink: newResumeLink }, { new: true });
    if (!resume) {
        return res.status(404).json({ message: 'Resume link not found' });
    } else {
        res.status(200).json({
            message: 'Successfully updated',
            resume
        })
    }
}

