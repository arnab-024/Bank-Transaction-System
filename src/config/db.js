const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Database Connection Successful!!");
    } catch(error) {
        console.error("Database Connection failed", error);
        process.exit(1);
    }
}


module.exports = connectDB;