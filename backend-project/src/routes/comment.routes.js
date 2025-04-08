import express from 'express';
import { getSubscribedChannels } from '../controllers/subscriptionController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';
import { addComment, deleteComment, getVideoComments, updateComment } from '../controllers/comment.controller.js';

const router = express.Router();

router.get('/:videoId/comments', verifyJWT, getVideoComments);

router.post('/addComment/:videoId', verifyJWT, addComment);

router.get('updateComment/:commentId', verifyJWT, updateComment);

router.get('deleteComment/:commentId', verifyJWT, deleteComment);

export default router;
