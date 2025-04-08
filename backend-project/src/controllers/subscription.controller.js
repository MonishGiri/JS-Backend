import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
  const subscriberId = req.user._id;
  // TODO: toggle subscription

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  if (subscriberId.toString() === channelId.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
  }

  await Subscription.create({ subscriber: subscriberId, channel: channelId });
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Subscribed successfully"));
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
        return ApiResponse.error(res, new ApiError("Invalid channel id", 400))
    }
    const channel = await User.findById(channelId).select("-password")
    if (!channel) {
        return ApiResponse.error(res, new ApiError("Channel not found", 404))
    }
    const subscriptions = await Subscription.find({ channel: channelId }).populate("subscriber", "-password")
    const subscribers = subscriptions.map((subscription) => subscription.subscriber)
    return res.status(200)
    .json(new ApiResponse(200, "Subscribers fetched successfully", subscribers))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        return ApiResponse.error(res, new ApiError("Invalid subscriber id", 400))
    }
    const subscriber = await User.findById(subscriberId).select("-password")
    if (!subscriber) {
        return ApiResponse.error(res, new ApiError("Subscriber not found", 404))
    }
    const subscriptions = await Subscription.find({ subscriber: subscriberId }).populate("channel", "-password")
    const channels = subscriptions.map((subscription) => subscription.channel)
    return res.status(200)
    .json(new ApiResponse(200, "Subscribed channels fetched successfully", channels))
})
export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}