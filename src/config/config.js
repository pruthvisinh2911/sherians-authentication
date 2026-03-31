import dotenv from "dotenv"

dotenv.config();

if(!process.env.MONGO_URI)
{
    throw new Error("MONGO_URI is not defined in enviromental variable")
}

if(!process.env.JWT_SECRET)
{
    throw new Error("JWT_SECRET is not defined in the enviromental variables")
}

const configs={
    MONGO_URI:process.env.MONGO_URI,
    JWT_SECRET:process.env.JWT_SECRET
}

export default configs