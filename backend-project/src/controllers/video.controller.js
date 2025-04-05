import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

// to be solved later
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
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    console.log(video.owner.toString(), req.user._id.toString())
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video");
    }

    let updatedVideoData = {}; // Initialize an empty object for updates

    if (title !== undefined) {
        updatedVideoData.title = title;
    }
    if (description !== undefined) {
        updatedVideoData.description = description;
    }

    if (req.files?.videoFile && req.files.videoFile.length > 0) {
        const videoFileLocalPath = req.files.videoFile[0].path;
        try {
            const videoFile = await uploadOnCloudinary(videoFileLocalPath);
            updatedVideoData.videoFile = videoFile;
        } catch (error) {
            throw new ApiError(500, "Failed to upload video file to Cloudinary");
        }
    }

    if (req.files?.thumbnail && req.files.thumbnail.length > 0) {
        const thumbnailFileLocalPath = req.files.thumbnail[0].path;
        try {
            const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);
            updatedVideoData.thumbnail = thumbnail;
        } catch (error) {
            throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
        }
    }

    if (Object.keys(updatedVideoData).length === 0) {
        return res.status(400).json(new ApiResponse(400, null, "No updates provided"));
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, updatedVideoData, { new: true });

    return res.status(200).json(new ApiResponse(200, updatedVideo, 'Video updated Successfully'));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!(videoId)){
        throw new ApiError(400, 'Video Id not found')
    }
    const video = await Video.findById(videoId);
    console.log(video, req.user._id)
    if(video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, 'You are not authorized to delete this video')
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, 'Video deleted Successfully'))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to change publish status of this video")
    }

    const toggledVideo = await Video.findByIdAndUpdate(videoId, {
        isPublished: !video.isPublished,
    }, {
        new: true,
    })

    return res
    .status(200)
    .json(new ApiResponse(200, toggledVideo, 'Video publish status updated successfully'))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}