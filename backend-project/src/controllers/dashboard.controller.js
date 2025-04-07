import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.params.channelId
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    const channelStats = await Video.aggregate([
        {
            $match: { owner: channelId }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" },
                totalSubscribers: { $sum: "$subscribers" },
                totalVideos: { $sum: 1 },
                totalLikes: { $sum: "$likes" }
            }
        }
    ])
    if (channelStats.length === 0) {
        throw new ApiError(404, "Channel not found")
    }
    const stats = channelStats[0]
    return res
    .status(200)
    .json(ApiResponse(200, "Channel stats fetched successfully", stats))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.params.channelId

    if(!channelId){
        throw new ApiError(400, 'Invalid channel Id')
    }

    const videos = await Video.find({owner: channelId})
    .sort({ createdAt: -1 })
    .limit(10);

    if(!videos){
        throw new ApiError(400,"No videos found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, videos, 'Videos fetched successfully'))
})

export {
    getChannelStats, 
    getChannelVideos
    }