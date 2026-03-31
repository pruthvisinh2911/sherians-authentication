import userModel from "../models/user.model.js"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import configs from "../config/config.js"
import sessionModel from "../models/session.model.js"

export async function register(req,res) {
    const {username,email,password} = req.body 

    const isAlreadyRegistered = await userModel.findOne({
        $or:[
            {username},
            {email}
        ]
    })
    if(isAlreadyRegistered){
        res.status(409).json({
            message:"username or email is already Exists"
        })
    }
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const user = await userModel.create({
        username,
        email,
        password,
    })


      const refreshToken = jwt.sign({
        id:user._id
    },configs.JWT_SECRET,
{
    expiresIn:"7d"
})

const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

const session = await sessionModel.create({
    user:user._id,
    refreshToken,
    ip:req.ip,
    userAgent:req.headers["user-agent"]

})

    const accessToken = jwt.sign({
        id:user._id,
        sessionId:session._id
    },configs.JWT_SECRET,
{
    expiresIn:"15m"
})


res.cookie("refreshToken",refreshToken,{
    httpOnly:true,
    secure:true,
    sameSite:"strict",
    maxAge:7*24*60*60*1000,
})



res.status(201).json({
    message:"user Registred SuccessFully",
    user:{
        username:user.username,
        email:user.email,
    },
    accessToken,
})
}


export async function login(req, res) {
    try {
        const { email, password } = req.body;

        // ✅ check if email & password provided
        if (!email || !password) {
            return res.status(400).json({
                message: "email and password are required"
            });
        }

        // ✅ find user
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "invalid email or password"
            });
        }

        // ✅ hash incoming password
        const hashedPassword = crypto
            .createHash("sha256")
            .update(password)
            .digest("hex");

        // ✅ compare passwords
        const isPasswordValid = hashedPassword === user.password;

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "invalid email or password"
            });
        }

        // ✅ create refresh token
        const refreshToken = jwt.sign(
            { id: user._id },
            configs.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // ✅ hash refresh token before saving
        const refreshTokenHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        // ✅ create session
        const session = await sessionModel.create({
            user: user._id,
            refreshTokenHash,
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        });

        // ✅ create access token
        const accessToken = jwt.sign(
            {
                id: user._id,
                sessionId: session._id,
            },
            configs.JWT_SECRET,
            {
                expiresIn: "15m"
            }
        );

        // ✅ send cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, // ⚠️ set true only in production (HTTPS)
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // ✅ response
        return res.status(200).json({
            message: "logged in successfully",
            user: {
                username: user.username,
                email: user.email,
            },
            accessToken,
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            message: "internal server error"
        });
    }
}

export async function getMe(req,res){
    const token = req.headers.authorization?.split(" ")[1]

    if(!token){
        return res.status(401).json({
            message:"jwt token is not found"
        })
    }
    const decoded = jwt.verify(token,configs.JWT_SECRET)

    const user = await userModel.findById(decoded.id)

    res.status(200).json({
        message:"user fetched successfully",
        user:{
            username:user.username,
            email:user.email,
        }
    })
}

export async function refreshToken(req,res){
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        return res.status(401).json({
            message:"refresh token not found"
        })
    }
    const decoded = jwt.verify(refreshToken,configs.JWT_SECRET)

    const accessToken = jwt.sign({
        id:decoded._id
    },configs.JWT_SECRET,{
        expiresIn:"15m"
    })


    const newRefreshToken = jwt.sign({
        id:decoded._id
    },configs.JWT_SECRET,
    {
        expiresIn:"7d"
    }
)
    
res.cookie("refreshToken",newRefreshToken,{
    httpOnly:true,
    secure:true,
    sameSite:"strict",
    maxAge:7*24*60*60*1000,
})

    res.status(200).json({
        message:"access token refreshed SuccessFully",
        accessToken
    })
}

export async function logout(req,res) {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken)
    {
        return res.status(400).json({
            message:"refresh token is required"
        })
    }
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

    const session = await sessionModel.findOne({
        refreshToken,
        revoked:false
    })
    if(!session){
        res.status(400).json({
            message:"invalid refresh token"
        })
    }
    session.revoked = true
    await session.save();

    res.clearCookie("refreshToken")

    res.status(200).json({
        message:"user logged out successfully"
    })
}

export async function logoutAll(req,res) {
const refreshToken = req.cookie.refreshToken

if(!refreshToken)
    return res.status(400).json({
    message:"Refresh token not found"
})
const decoded = jwt.verify(refreshToken,configs.JWT_SECRET)

await sessionModel.updateMany({
    user:decoded.id,
    revoked:false
},{
    revoked:true
})
res.clearCookie("refreshToken")
res.status(200).json({
    message:"logged out from all the devices successfully"
})
}
