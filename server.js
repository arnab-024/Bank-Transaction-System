require("dotenv").config(); //without this process.env won't work

const app = require("./src/app.js");
const connectDB = require("./src/config/db.js");


async function startServer() {
    try {
        await connectDB();
        app.listen(3000, () => {
            console.log("Server is running on https://localhost:3000");
        });
    } catch (error) {
        console.error("Failed to start the server: ", error);
    }
}

startServer();