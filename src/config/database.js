import mongoose  from "mongoose";
import config from "./config.js";


async function connectDb() {

    await mongoose.connect(config.MONGO_URI)
    console.log("database conneted")
}

export default connectDb