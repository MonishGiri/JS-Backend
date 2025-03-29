import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from 'jsonwebtoken'
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return {accessToken, refreshToken}

    } catch (error) {
        console.log(error)
        throw new ApiError(500, "Something went wrong while generating refresh and acess token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user data from frontend
    const {fullName, email, username, password} = req.body;

    // validation
    if(
        [fullName, email, username, password].some((field) => field?.trim() === "" )
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists: username and email
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser) throw new ApiError(409, "User with email or username already exists")

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath) throw new ApiError(400, "Avatar file is required")

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    // create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );


    // check for user creation
    if(!createdUser) throw new ApiError(500, "Something went wrong while registering the user")

    // return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully")
    )
} )

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    const {username, password, email} = req.body;
    console.log("email", email)

    // username or email
    if(!(username || email)) throw new ApiError(400, "Username or Email is required")

    // find the user
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) throw new ApiError(404, "User does not exists")

    // check password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) throw new ApiError(401, "Invalid user credentials")

    // access and refresh token
    const{accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // send cookie
    const options = {
        httpOnly: true,
        secure: true
    }


    // return res
    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "User logged Out successfully"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) throw new ApiError(401, "Unauthorized Request")

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) throw new ApiError(401, "Invalid refresh token")
    
        if(incomingRefreshToken !== user?.refreshToken) throw new ApiError(401, "Refresh token is expired or used")
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
        
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed Successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) throw new ApiError(400,"Invalid old password")

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{}, "Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    console.log("Current user is: ",req.user)
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email) throw new ApiError(400, "All fields are required")

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details updated Successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) =>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) throw new ApiError(400, "Avatar file is missing")

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) throw new ApiError(400, "Error while uploading on avatar")
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user,"Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async(req, res) =>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) throw new ApiError(400, "Cover image file is missing")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url) throw new ApiError(400, "Error while uploading on Cover image")
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user,"Cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params
    if(!username?.trim()) throw new ApiError(400,"Username is missing")
    
    const channel = await User.aggregate([
        {
            $match: username?.toLowerCase()
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                    isSubscribed: {
                        $cond: {
                            if: {$in: [req.user?._id,  "$subscribers"]},
                            then: true,
                            else: false
                        }

                    }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length) throw new ApiError(404, "channel does not exists")

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User Channel fetched Successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) =>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId.createFromHexString(req.user._id),

            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                $project: {
                                    fullName: 1,
                                    username: 1,
                                    avatar: 1
                                }
                            }
                        ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch History Fetched Successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}