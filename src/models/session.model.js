import mongoose, { Schema } from "mongoose";


const sessionSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:[true,"user is required"],
    },
    refreshToken:{
        type:String,
        required:[true,"refresh token hash is required"],
    },
    ip:{
        type:String,
        required:[true,"IP address is required"]
    },
    userAgent:{
        type:String,
        required:[true,"user agent is required"]
    },
    revoked:{
        type:Boolean,
        default:false
    }
},{
    timestamps:true,
})

const sessionModel = new mongoose.model("sessions",sessionSchema)

export default sessionModel