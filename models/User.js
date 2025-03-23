const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const UserSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 }, // Unique ID for each user
    user_id: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    is_deleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
