import express from 'express';
import { addResumeLink, updateRsumeLink, viewResumeLink } from '../controller/Model/resumeContoller.js';

const router = express.Router();

//resume router
router.get('/resume' , viewResumeLink)
router.patch('/resume', updateRsumeLink);
router.post('/resume' , addResumeLink)


export default router;