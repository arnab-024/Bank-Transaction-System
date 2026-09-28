const mongoose = require('mongoose');


const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required to blacklist"],
        unique: [true, "Token is already blacklisted"]
    }
    
}, {
    timestamps: true 
});

tokenBlacklistSchema.index({createdAt: 1}, {
    expireAfterSeconds: 60 //1 day
});

const tokenBlacklistModel = mongoose.model("tokenBlacklist", tokenBlacklistSchema);
module.exports = tokenBlacklistModel;