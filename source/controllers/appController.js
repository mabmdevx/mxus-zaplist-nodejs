const Checklist = require('../models/Checklist');
const { errorHandler } = require('../utils/helpers');

exports.renderDashboard = async (req, res) => {
    try{
        console.log("renderDashboard() :: Function called");

        // Get user ID from session
        const session_user_system_id = req.session.session_user_system_id;

        // Get count of checklists created by the user
        const my_total_checklists_count = await Checklist.countDocuments({
            created_by: session_user_system_id,
            is_deleted: false
        });

        console.log("renderDashboard() :: my_total_checklists_count: " + my_total_checklists_count);

        // Get count of checklists shared with the user
        const my_shared_checklists_count = await Checklist.countDocuments({
            "checklist_shared_with": {
                $elemMatch: {
                    "share_user_id": session_user_system_id // Match the session_user_system_id within the share_user_id object
                }
            },
            is_deleted: false
        }).populate({
            path: "created_by",
            model: "User",
            select: "_id user_id user_email"
        }).populate({
            path: "checklist_shared_with.share_user_id",
            model: "User",
            select: "_id user_id user_email"
        });
    
        return res.render("dashboard", {
            SITE_TITLE: process.env.SITE_TITLE,
            CURRENT_YEAR: new Date().getFullYear(),
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            session_user_id: req.session.session_user_id,
            my_total_checklists_count: my_total_checklists_count,
            my_shared_checklists_count: my_shared_checklists_count
        });

    } catch (error) {
        errorHandler(error, req, res);
    }
};
