import { ApiError } from "../utils/ApiError"

const errorHandler = (err,req,res,next)=>{
    
    if(err instanceof ApiError){
        return res.status(err.statusCode).json({
            success : false,
            message : err.message,
            errors : err.errors
        })
    }

    console.log(err);

    return res.status(500).json({
        success : false,
        message : "Internal Server Error",
        errors : []
    })

}

export {errorHandler}