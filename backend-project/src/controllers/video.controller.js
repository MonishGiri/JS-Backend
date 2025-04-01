import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType="desc" } = req.query
    //TODO: get all videos based on query, sort, pagination

    const userId = req.user?._id;
    
      // Convert page and limit to numbers
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);

      // Create filter object
      let filter = {};
      if (query) {
          filter.title = { $regex: query, $options: "i" }; // Case-insensitive search
      }
      if (userId) {
          filter.userId = userId; // Filter videos by user ID
      }
      console.log("filter", filter)
      // Create sort object
      let sortOptions = {};
      sortOptions[sortBy] = sortType === "asc" ? 1 : -1; // Sorting order

      // Fetch videos with pagination, sorting, and filtering
      const videos = await Video.find(filter)
        .populate("owner", "name email profilePicture")
        .sort(sortOptions)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);
    
        console.log("videos", videos)

      // Get total count for pagination
      const totalVideos = await Video.countDocuments(filter);

      return res
      .status(200)
      .json(
        new ApiResponse(
            200,
            {
                videos: videos.map((video) => video.toObject()),
                totalPages: Math.ceil(totalVideos / limitNumber),
                currentPage: pageNumber,
                totalVideos: totalVideos,
            },
            "Videos fetched successfully",
        )
      )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    const videoFileLocalPath  = req.files?.videoFile[0]?.path
    const thumbnailFileLocalPath  = req.files?.thumbnail[0]?.path
    if (!videoFileLocalPath || !thumbnailFileLocalPath) {
        throw new ApiError(400, "Please upload video and thumbnail")
    }
    const videoFile = await uploadOnCloudinary(videoFileLocalPath, "video")
    const thumbnailFile = await uploadOnCloudinary(thumbnailFileLocalPath, "thumbnail")

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile?.secure_url,
        thumbnail: thumbnailFile?.secure_url,
        owner: req.user._id,
        duration: videoFile?.duration,
    })

    if(!video) {
        throw new ApiError(400, "Unable to create video")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {
                video: video.toObject(),
            },
            "Video created successfully",
        )
    )


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId).populate("owner", "name email profilePicture")
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                video
            },
            "Video fetched successfully",
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}