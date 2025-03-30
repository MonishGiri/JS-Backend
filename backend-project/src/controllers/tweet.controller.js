import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    const userId = req.user._id
    if (!content) {
        throw new ApiError(400, "Text is required")
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }
    
    const tweet = await Tweet.create({
        content,
        owner: userId
    })

    const addedTweet = await Tweet.findById(tweet._id)

    if(!addedTweet) throw new ApiError(500,"Something went wrong while adding the tweet")

    return res
    .status(200)
    .json(new ApiResponse(200, addedTweet, "Tweet Added Successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    const {page = 1, limit = 10} = req.query
    if (!userId) throw new ApiError(400, "userId is required")      
    if (!isValidObjectId(userId)) throw new ApiError(400, "userId is not valid")
    
    const tweets = await Tweet.find({owner: userId})
        .populate("owner", "-password")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({createdAt: -1})
    
    const totalTweets = await Tweet.countDocuments({owner: userId})
    if (!tweets) throw new ApiError(500, "Something went wrong while fetching the tweets")
    
    return res.status(200).json(new ApiResponse(200, "success", {tweets, totalTweets}))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body
    const userId = req.user._id
    if (!tweetId) throw new ApiError(400, "tweetId is required")
    if (!content) throw new ApiError(400, "Tweet content is required")
    if (!userId) throw new ApiError(400, "User id not found")
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Tweet id is not valid")
    if (!isValidObjectId(userId)) throw new ApiError(400, "User id is not valid")
    
    const tweet = await Tweet.findByIdAndUpdate(tweetId, {
        content,
        owner: userId
    }, {new: true}) 

    if(!tweet) throw new ApiError(500, "Something went wrong while updating the tweet")
    
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet Updated Successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    const userId = req.user._id
    if (!tweetId) throw new ApiError(400, "tweetId is required")
    if (!userId) throw new ApiError(400, "User id not found")
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Tweet id is not valid")
    if (!isValidObjectId(userId)) throw new ApiError(400, "User id is not valid")
    
    const tweet = await Tweet.findByIdAndDelete(tweetId)
    if (!tweet) throw new ApiError(500, "Something went wrong while deleting the tweet")    
    
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet Deleted Successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}