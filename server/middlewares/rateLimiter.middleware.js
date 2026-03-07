import {rateLimit} from "express-rate-limit"

const limiter = rateLimit({
    windowMs : 15*60*1000,
    limit : 10,
    standardHeaders : true,
    legacyHeaders : false,
    message : {
        status : 429,
        message : "Too many requests , please try again after 15 minutes",
        success : false,
        errors : []
    }
})

export {limiter};