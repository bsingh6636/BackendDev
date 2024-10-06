import express from 'express';
import { addResumeLink, updateRsumeLink } from '../controller/Model/resumeContoller.js';

const router = express.Router();

//resume router
router.patch('/', updateRsumeLink);
router.post('/' , addResumeLink)


export default router;