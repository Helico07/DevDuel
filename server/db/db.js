import mongoose from "mongoose";
import { DB_NAME } from "../const.js";


const connectDB = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`Mongo DB connected successfully ! DB host : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("Mongo DB connection Failed" , error)
        process.exit(1)
    }
}

export default connectDB


