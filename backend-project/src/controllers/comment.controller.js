import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

   if(!videoId) throw new ApiError(400, "videoId is required")
    if(!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "videoId is not valid")
    
     const comments = await Comment.find({video: videoId})
          .populate("owner", "-password")
          .skip((page - 1) * limit)
          .limit(limit)
    
     const totalComments = await Comment.countDocuments({video: videoId})
    
     return res.status(200).json(new ApiResponse(200, "success", {comments, totalComments}))
    
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    const userId = req.user?._id

    if(!videoId) throw new ApiError(400,"Videoid is required")
    if(!content) throw new ApiError(400,"Comment content is required")
    if(!userId) throw new ApiError(400,"User id not found")
    
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    })

    const addedComment =await Comment.findById(comment._id);

    if(!addedComment) throw new ApiError(500,"Something went wrong while adding the comment")

    return res
    .status(200)
    .json(new ApiResponse(200, addComment, "Comment Added Successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    const userId = req.user?._id
    if(!commentId) throw new ApiError(400,"Comment id is required")
    if(!content) throw new ApiError(400,"Comment content is required")
    if(!userId) throw new ApiError(400,"User id not found")
    if(!mongoose.isValidObjectId(commentId)) throw new ApiError(400,"Comment id is not valid")

    const updatedComment = await Comment.findByIdAndUpdate(commentId, {
        content,
        owner: userId
    }, {new: true})

    return res.status(200).json(new ApiResponse(200, updatedComment.content, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    const userId = req.user?._id
    if(!commentId) throw new ApiError(400,"Comment id is required")
    if(!userId) throw new ApiError(400,"User id not found")
    if(!mongoose.isValidObjectId(commentId)) throw new ApiError(400,"Comment id is not valid")
    
    const deletedComment = await Comment.findByIdAndDelete(commentId)
    if(!deletedComment) throw new ApiError(404,"Comment not found")

    return res.status(200).json(new ApiResponse(200, deletedComment.content, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }