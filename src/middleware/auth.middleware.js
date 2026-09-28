const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blackList.model.js");

async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  /*console.log({
    tokenType: typeof token,
    parts: typeof token === "string" ? token.split(".").length : null,
    hasCookie: Boolean(req.cookies?.token),
    authorization: req.headers.authorization?.startsWith("Bearer "),
  });*/

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access. Token is missing.",
    });
  }

  const isBlacklisted = await tokenBlacklistModel.findOne({ token });

  if (isBlacklisted) {
    return res.status(401).json({
      message: "Unauthorized access, token is invalid",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId);

    req.user = user;
    return next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: `Unauthorized access. ${error.message}`,
    });
  }
}

async function authSystemUserMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access, token is missing",
    });
  }

  const isBlacklisted = await tokenBlacklistModel.findOne({ token });

  if (isBlacklisted) {
    return res.status(401).json({
      message: "Unauthorized access, token is invalid",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId).select("+systemUser");
    if (!user.systemUser) {
      return res.status(403).json({
        message: "Forbidden access, not a system user!",
      });
    }
    req.user = user;
    return next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: "Unauthorized access, token is invalid",
    });
  }
}

module.exports = { authMiddleware, authSystemUserMiddleware };
