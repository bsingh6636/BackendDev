import express from 'express';
import { addResumeLink, updateRsumeLink, viewResumeLink } from '../controller/Model/resumeContoller.js';
import { SendformData } from '../controller/Model/FormController.js';

const router = express.Router();

//resume router
router.get('/resume', viewResumeLink)
router.patch('/resume', updateRsumeLink);
router.post('/resume', addResumeLink)
router.post('/contact', SendformData )
export default router;