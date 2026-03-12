import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"

const userSchema = new  Schema({
    userName : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true,
        index : true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true,
    },
    password : {
        type : String,
        required : true
    },
    firstName : {
        type : String,
        default : ""
    },
    lastName : {
        type : String,
        default : ""
    },
    contestsPlayed : {
        type : Number,
        default : 0
    },
    questionsSolved : {
        type : Number,
        default : 0
    },
    totalAttempted : {
        type : Number,
        default : 0
    },
    contestsWon : {
        type : Number,
        default : 0
    },
    rating : {
        type : Number,
        default : 1000
    },
    refreshToken : {
        type : String
    }
} , {timestamps : true})

userSchema.pre("save" , async function() {
    if(!this.isModified("password")) return

    this.password = await bcrypt.hash(this.password , 10)
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password , this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id : this._id,
        userName : this.userName,
        email : this.email
    },
        process.env.ACCESS_TOKEN_SECRET ,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id : this._id
    },
        process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const User = mongoose.model("User" , userSchema)