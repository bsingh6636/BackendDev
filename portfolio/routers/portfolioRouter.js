import express from 'express';
import { addResumeLink, updateRsumeLink, viewResumeLink } from '../controller/Model/resumeContoller.js';

const router = express.Router();

//resume router
router.get('/' , viewResumeLink)
router.patch('/', updateRsumeLink);
router.post('/' , addResumeLink)


export default router;