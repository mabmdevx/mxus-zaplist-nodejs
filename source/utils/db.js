const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

const connectToDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB :: Connected successfully.");
    } catch (err) {
        console.error("MongoDB :: Connection Error:", err);
        process.exit(1); // Exit if connection fails
    }
};

module.exports = { connectToDB };
