import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

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

router.route("/updateVideo/:videoId").patch(
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
    updateVideo
);

router.route("/deleteVideo/:videoId").delete(
    verifyJWT,
    deleteVideo
);

router.route("/togglePublishStatus/:videoId").patch(
    verifyJWT,
    togglePublishStatus
);

export default router;