import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/getChannelVideos/:channelId").get(verifyJWT,getChannelVideos)

router.route("/getChannel-Stat/:channelId").get(verifyJWT, getChannelStats)

export default router;