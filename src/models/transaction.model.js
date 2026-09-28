const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transaction must have a source account"],
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Transaction must have a destination account"],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["pending", "completed", "failed", "reversed"],
            message: "Status must be either pending, completed, failed, or reversed"
        },
        default: "pending"
    }, 
    amount: {
        type: Number,
        required: [true, "Transaction must have an amount"],
        min: [0, "Transaction amount must be a positive number"]
    },
    description: {
        type: String,
        default: ""
    },  
    idempotencyKey: {
        type: String,
        required: [true, "Transaction must have an idempotency key"],
        index: true,
        unique: true
    }
}, {
    timestamps: true
});

transactionSchema.index({ fromAccount: 1, toAccount: 1, status: 1});

const transactionModel = new mongoose.model("transaction", transactionSchema);

module.exports = transactionModel;