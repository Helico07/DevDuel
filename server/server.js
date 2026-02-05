import app from "./app.js"
import 'dotenv/config'
import connectDB from "./db/db.js"
const PORT = process.env.PORT || 8000


app.listen( PORT , ()=>{
    connectDB()
    console.log(`Server is live at port ${PORT}`)
})


