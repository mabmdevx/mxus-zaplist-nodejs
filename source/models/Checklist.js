const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const normalizeChecklistItemState = (state) => {
    if (state === "complete" || state === "skipped" || state === "incomplete") {
        return state;
    }

    if (state === true || state === "true" || state === "checked" || state === "on") {
        return "complete";
    }

    return "incomplete";
};

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
    checklist_starred_by: [{ type: String, ref: "User" }], // Users who have starred this checklist
    created_by: { type: String, ref: "User", required: true }, // References User using UUID
    updated_by: { type: String, ref: "User", required: true }, // References User using UUID
    is_deleted: { type: Boolean, default: false },
}, { timestamps: true });

// Safety net for legacy data values (e.g., true/false) before schema enum validation runs.
ChecklistSchema.pre("validate", function(next) {
    if (Array.isArray(this.checklist_items)) {
        this.checklist_items.forEach((item) => {
            item.is_completed = normalizeChecklistItemState(item.is_completed);
        });
    }

    next();
});

module.exports = mongoose.model("Checklist", ChecklistSchema);
