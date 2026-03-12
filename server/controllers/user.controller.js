import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/AsyncHandler.js"

const generateAccessAndRefreshToken = async(user)=>{

    // const tokenUser = await User.findById(user_id)
    
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave : false})
    
    return {accessToken , refreshToken}
}

const registerUser = asyncHandler(async(req , res)=>{

    const {userName , email , password} = req.body

    if([userName , email , password].some((field)=>
        field?.trim() === ""
    )){
        throw new ApiError(400 , "No fields can be empty");
    }

    const EmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if(!EmailRegex.test(email)){
        throw new ApiError(400 , "Invalid email id")
    }

    const existingUser = await User.findOne({$or : [{userName} , {email}]})

    if(existingUser){
        throw new ApiError(409 , "User with this username or email already exists")
    }

    await User.create({
        userName,
        email,
        password
    })

    const createdUser = await User.findOne({userName}).select("-password")

    if(!createdUser){
        throw new ApiError(500 , "User creation failed");
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(createdUser);

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(201)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json( new ApiResponse(201 , createdUser ,  "User registered Successfully"))
})

const loginUser = asyncHandler(async(req,res)=>{

    const {userName , email , password} = req.body

    if(!userName && !email){
        throw new ApiError(400 , "Either userName or email is required");
    }

    const existingUser = await User.findOne({$or : [{userName},{email}]})

    if(!existingUser){
        throw new ApiError(404 , "User dont exist")
    }

    const passwordCheck = await existingUser.isPasswordCorrect(password)

    if(!passwordCheck){
        throw new ApiError(401 , "Wrong Password")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(existingUser)

    const options = {
        httpOnly : true,
        secure : true
    }

    const loggedInUser = await User.findOne(existingUser._id).select("-password -refreshToken")

    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json( new ApiResponse(200 , loggedInUser , "User logged In successfully"))
})

const logoutUser = asyncHandler(async(req,res)=>{

    await User.findByIdAndUpdate(req.user._id , {
        $unset : {refreshToken : 1}
    })

    return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json( new ApiResponse( 200 , {} , "user logged out successfully"))
})

const deleteUser = asyncHandler(async(req,res)=>{

    const deleteUser = await User.findByIdAndDelete(req.user._id)

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json( new ApiResponse(200 , {} , "User deleted Successfully") )
})

const changePassword = asyncHandler(async(req,res)=>{

    const {oldPassword , newPassword} = req.body

    if(!oldPassword || !newPassword){
        throw new ApiError(400 , "All fields are neccessary")
    }

    const user = await User.findById(req.user._id)

    const passwordCheck = await user.isPasswordCorrect(oldPassword)

    if(!passwordCheck){
        throw new ApiError( 401 , "Incorrect password")
    }

    user.password = newPassword

    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse(200 , {} , "password changed successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    changePassword,
    deleteUser
}