const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email required!!"],
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Invalid Email Address"],
        unique: [true, "Email already exists!"]
    },
    name: {
        type: String,
        required: [true, "Name is required for creating an account!!"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password length should be a minimum of 6 characters"],
        select: false
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,
        select: false
    }
}, {
    timestamps: true
});

userSchema.pre("save", async function() {
    if(!this.isModified("password")) { //checks if the password is modified or not. If not modified, then it will not hash the password again and returns the function. 
        ///This is important because if the password is not modified, we don't want to hash it again and again every time we save the user document.
        return;
    }

    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;

    return;
});

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;