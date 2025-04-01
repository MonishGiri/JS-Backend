import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos, getVideoById, publishAVideo } from "../controllers/video.controller.js";

const router = Router();

router.route("/publishAVideo").post(
    verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    publishAVideo
);

router.route("/getAllVideos").get(
    verifyJWT,
    getAllVideos
);

router.route("/getVideoById/:videoId").get(
    verifyJWT,
    getVideoById
);

export default router;