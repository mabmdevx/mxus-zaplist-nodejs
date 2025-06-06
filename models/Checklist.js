const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const ChecklistItemSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 }, // Unique ID for each checklist item
    item_name: { type: String, required: true },
    is_completed: { type: String, enum: ["incomplete", "complete", "skipped"], default: "incomplete" },
    created_by: { type: String, ref: "User", required: true }, // References User using UUID
    updated_by: { type: String, ref: "User", required: true }, // References User using UUID
    is_deleted: { type: Boolean, default: false },
}, { timestamps: true });

const ChecklistSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 }, // Unique ID for each checklist
    checklist_title: { type: String, required: true },
    checklist_type: { type: String, enum: ["Groceries", "Bills", "Events", "Travel", "Work", "Other"], required: true },
    checklist_url_slug: { type: String, unique: true, required: true },
    checklist_is_public: { type: Boolean, default: false },
    checklist_items: [ChecklistItemSchema],
    checklist_shared_with: [{
        _id: { type: String, default: uuidv4 }, // Unique ID for each share
        share_user_id: { type: String, ref: "User" },
        share_access_level: { type: String, enum: ["RO", "RW"], default: "RW" }
    }],
    created_by: { type: String, ref: "User", required: true }, // References User using UUID
    updated_by: { type: String, ref: "User", required: true }, // References User using UUID
    is_deleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Checklist", ChecklistSchema);
