const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const UserSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 }, // Unique ID for each user
    user_id: { type: String, required: true, unique: true },
    user_password: { type: String, required: true },
    user_email: { type: String, required: true },
    is_deleted: { type: Boolean, default: false },
    remember_token_hash: { type: String, default: null }, // Hashed "remember me" validator token
    remember_token_expires: { type: Date, default: null } // Expiry of the "remember me" token
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
