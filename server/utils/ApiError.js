class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(Error)
        this.statusCode = statusCode,
        this.message = message,
        this.data = null,
        this.success = false,
        this.error = errors;

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this ,this.constructor)
        }
    }
}

export {ApiError}