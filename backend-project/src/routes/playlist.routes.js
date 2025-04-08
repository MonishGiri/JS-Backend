import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router();

router.post('/createPlaylist', verifyJWT, createPlaylist)

router.get('getUsersPlaylist/:userId', verifyJWT, getUserPlaylists)

router.get('getPlaylistById/:playlistId', verifyJWT, getPlaylistById)

router.patch('/addVideoToPlaylist:/playlistId/:videoId', verifyJWT, addVideoToPlaylist)

router.get('/removeVideoFromPlaylist:/playlistId/:videoId', verifyJWT, removeVideoFromPlaylist)

router.delete('deletePlaylist:/playlistId', verifyJWT, deletePlaylist)

router.patch('updatePlaylist:/playlistId', verifyJWT, updatePlaylist)

export default router;