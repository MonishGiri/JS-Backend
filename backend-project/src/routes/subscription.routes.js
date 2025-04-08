import express from 'express';
import { getSubscribedChannels } from '../controllers/subscriptionController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';
import { getUserChannelSubscribers, toggleSubscription } from '../controllers/subscription.controller.js';

const router = express.Router();

router.get('/subscriptions/:subscriberId', verifyJWT, getSubscribedChannels);

router.get('/subscribers/:channelId', verifyJWT, getUserChannelSubscribers);

router.get('/toggleSubscription/:channelId', verifyJWT, toggleSubscription)

export default router;
