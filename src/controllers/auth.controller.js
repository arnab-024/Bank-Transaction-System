const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const tokenBlacklist = require("../models/blackList.model.js");
const emailService = require("../services/email.service.js");
const tokenBlacklistModel = require("../models/blackList.model.js");

async function userRegisterController(req, res) {
    const {email, password, name} = req.body;

    const isExists = await userModel.findOne({
        email: email
    });

    if(isExists) {
        return res.status(422).json({
            message: "A user with this email already exists",
            status: "Failed"
        });
    }

    const user = await userModel.create({
        email, password, name
    });

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: "1d"}); //expiresIn sets an expiry time on the token
    res.cookie("token", token);

    res.status(201).json({
        message: "Registered Successfully",
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        }
    });

    await emailService.sendRegistrationEmail(user.email, user.name);
}

async function userLoginController(req, res) {
    const {email, password} = req.body;

    const user = await userModel.findOne({
        email: email
    }).select("+password");   

    if(!user) {
        return res.status(401).json({
            message: "Email or Password is invalid!"
        });
    }

    const isValidPassword = await user.comparePassword(password); 
    //password is same as email
    
    if(!isValidPassword) {
        return res.status(401).json({
            message:"Email or Password is invalid!"
        });
    }
    
    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: "1d"}); //expiresIn sets an expiry time on the token
    res.cookie("token", token);

    res.status(200).json({
        message: "Logged In Successfully",
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        }
    });
}

async function userLogoutController(req, res) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if(!token) {
        return res.status(200).json({
            message: "User logged out successfully"
        });
    }

    await tokenBlacklistModel.create({ 
        token: token
    });

    res.clearCookie("token");
    
    res.status(200).json({
        message: "User logged out successfully"
    });
}


module.exports = {userRegisterController, userLoginController, userLogoutController};