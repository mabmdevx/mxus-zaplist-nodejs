const Checklist = require('../models/Checklist');
const User = require('../models/User');
const { errorHandler, generateUniqueSlug } = require('../utils/helpers');

exports.renderListMyOwnedChecklists = async (req, res) => {
    try{
        console.log("renderListMyOwnedChecklists() :: Function called");

        const session_user_id = req.session.session_user_id;
        const session_user_system_id = req.session.session_user_system_id;

        console.log("renderListMyOwnedChecklists() :: session_user_id: " + session_user_id);
        console.log("renderListMyOwnedChecklists() :: session_user_system_id: " + session_user_system_id);

        const my_checklists = await Checklist.find({ created_by: session_user_system_id, is_deleted: false });

        // Add is_shared attribute
        const my_checklists_with_shared_flag = my_checklists.map(checklist => {
            return {
                ...checklist.toObject(),
                checklist_is_shared: checklist.checklist_shared_with.length > 0
            };
        });

        console.log("renderListMyOwnedChecklists() :: my_checklists_with_shared_flag: ", my_checklists_with_shared_flag);

        return res.render("checklist_list_mine", {
            SITE_TITLE: process.env.SITE_TITLE,
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            session_user_id: req.session.session_user_id,
            my_checklists: my_checklists_with_shared_flag
        });

    } catch (error) {
        errorHandler(error, req, res);
    }

};

exports.renderListMySharedChecklists = async (req, res) => {
    try{
        console.log("renderListMySharedChecklists() :: Function called");

        const session_user_id = req.session.session_user_id;
        const session_user_system_id = req.session.session_user_system_id;

        console.log("renderListMySharedChecklists() :: session_user_id: " + session_user_id);
        console.log("renderListMySharedChecklists() :: session_user_system_id: " + session_user_system_id);
        
        const my_shared_checklists = await Checklist.find({
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
        
        console.log("renderListMySharedChecklists() :: my_shared_checklists: ", JSON.stringify(my_shared_checklists, null, 2));

        return res.render("checklist_list_shared", {
            SITE_TITLE: process.env.SITE_TITLE,
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            session_user_id: req.session.session_user_id,
            session_user_system_id: req.session.session_user_system_id,
            my_shared_checklists: my_shared_checklists
        });

    } catch (error) {
        errorHandler(error, req, res);
    }
}

exports.renderCreateChecklistPage = (req, res) => {
    try{
        console.log("renderCreateChecklistPage() :: Function called");

        const session_user_id = req.session.session_user_id;

        console.log("renderCreateChecklistPage() :: session_user_id: " + session_user_id);

        return res.render("checklist_form", {
            SITE_TITLE: process.env.SITE_TITLE,
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            session_user_id: session_user_id,
            checklist: null,
            edit_mode: false
        });

    } catch (error) {
        errorHandler(error, req, res);
    }
};

exports.createChecklist = async (req, res) => {
    try {
        console.log("createChecklist() :: Function called");

        const { checklist_title, checklist_type, checklist_is_public, checklist_items } = req.body;
        const session_user_id = req.session.session_user_id;
        const session_user_system_id = req.session.session_user_system_id;

        console.log("createChecklist() :: session_user_id: " + session_user_id);

        // Generate unique slug for the new checklist
        const checklist_url_slug = await generateUniqueSlug();

        // Prepare the checklist items array
        const itemsArray = Array.isArray(checklist_items)
            ? checklist_items.filter(item => item.trim() !== "").map(item => ({
                item_name: item,
                is_completed: false,
                created_by: session_user_system_id,
                updated_by: session_user_system_id,
                is_deleted: false
            }))
            : [];

        const checklist = new Checklist({
            checklist_title,
            checklist_type,
            checklist_url_slug,
            checklist_is_public: checklist_is_public === "true",
            checklist_items: itemsArray,
            created_by: session_user_system_id,
            updated_by: session_user_system_id,
            is_deleted: false
        });

        await checklist.save();
        res.redirect("/my-checklists");
    } catch (error) {
        errorHandler(error, req, res);
    }
};

exports.renderUpdateChecklistPage = async (req, res) => {
    try{
        console.log("renderUpdateChecklistPage() :: Function called");

        const checklist_id = req.params.checklist_id;
        const session_user_id = req.session.session_user_id;
        const session_user_system_id = req.session.session_user_system_id;

        console.log("renderUpdateChecklistPage() :: checklist_id: " + checklist_id);
        console.log("renderUpdateChecklistPage() :: session_user_id: " + session_user_id);
        console.log("renderUpdateChecklistPage() :: session_user_system_id: " + session_user_system_id);

        // Fetch the checklist and populate share list with user object
        const checklist = await Checklist.findOne({ _id: checklist_id, is_deleted: false })
        .populate({
            path: "checklist_shared_with.share_user_id",
            model: "User",
            select: "_id user_id user_email"
        })
 
        console.log("renderUpdateChecklistPage() :: checklist: ", JSON.stringify(checklist, null, 2));

        if (!checklist) {
            return res.render("error_general_auth", {
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                session_user_id: session_user_id,
                session_user_system_id: session_user_system_id,
                error_title: 'Error',
                error_msg: 'Checklist not found'
            });
        }

        // Check if the logged-in user is the owner
        const is_checklist_owner = checklist.created_by.toString() === session_user_system_id;
        console.log("renderUpdateChecklistPage() :: is_checklist_owner: " + is_checklist_owner);

        // Check if the checklist is shared with the logged-in user
        const checklist_shared_with_user = checklist.checklist_shared_with.find(
            (share) => share.share_user_id && share.share_user_id._id && share.share_user_id._id.toString() === session_user_system_id
        );
        console.log("renderUpdateChecklistPage() :: checklist_shared_with_user: " + checklist_shared_with_user);

        // Determine if the user has RW (Read & Write) permission
        const has_shared_checklist_write_access = checklist_shared_with_user && checklist_shared_with_user.share_access_level === "RW";
        console.log("renderUpdateChecklistPage() :: has_shared_checklist_write_access: " + has_shared_checklist_write_access);

        // If the user is not the owner and the checklist is not shared with the user, deny access
        if (is_checklist_owner === false && has_shared_checklist_write_access === false) {
            return res.render("error_general_auth", {
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                session_user_id: session_user_id,
                session_user_system_id: session_user_system_id,
                error_title: 'Access Denied',
                error_msg: 'You do not have permission to update this checklist.'
            });
        }

        return res.render("checklist_form", {
            SITE_TITLE: process.env.SITE_TITLE,
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            session_user_id: session_user_id,
            session_user_system_id: session_user_system_id,
            checklist: checklist,
            edit_mode: true
        });

    } catch (error) {
        errorHandler(error, req, res);
    }
};

exports.updateChecklist = async (req, res) => {
    try {
        console.log("updateChecklist() :: Function called");

        const { checklist_title, checklist_type, checklist_is_public, checklist_items } = req.body;
        const checklist_id = req.params.checklist_id;
        const session_user_id = req.session.session_user_id;
        const session_user_system_id = req.session.session_user_system_id;

        console.log("updateChecklist() :: checklist_id: " + checklist_id);
        console.log("updateChecklist() :: session_user_id: " + session_user_id);
        console.log("updateChecklist() :: session_user_system_id: " + session_user_system_id);

        // Fetch the checklist and populate share list with user object
        const checklist = await Checklist.findOne({ _id: checklist_id, is_deleted: false })
        .populate({
            path: "checklist_shared_with.share_user_id",
            model: "User",
            select: "_id user_id user_email"
        })

        if (!checklist) {
            return res.render("error_general_auth", {
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                session_user_id: session_user_id,
                session_user_system_id: session_user_system_id,
                error_title: 'Error',
                error_msg: 'Checklist not found'
            });
        }

        // # Start: Security check {

        // Check if the logged-in user is the owner
        const is_checklist_owner = checklist.created_by.toString() === session_user_system_id;
        console.log("updateChecklist() :: is_checklist_owner: " + is_checklist_owner);

        // Check if the checklist is shared with the logged-in user
        const checklist_shared_with_user = checklist.checklist_shared_with.find(
            (share) => share.share_user_id && share.share_user_id._id.toString() === session_user_system_id
        );
        console.log("updateChecklist() :: checklist_shared_with_user: ", checklist_shared_with_user);

        // Determine if the user has RW (Read & Write) permission
        const has_shared_checklist_write_access = checklist_shared_with_user && checklist_shared_with_user.share_access_level === "RW";
        console.log("updateChecklist() :: has_shared_checklist_write_access: " + has_shared_checklist_write_access);

        // If the user is not the owner and the checklist is not shared with the user, deny access
        if (is_checklist_owner === false && has_shared_checklist_write_access === false) {
            return res.render("error_general_auth", {
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                session_user_id: session_user_id,
                session_user_system_id: session_user_system_id,
                error_title: "Access Denied",
                error_msg: "You do not have permission to update this checklist."
            });
        }

        // # } End: Security Check

        // Prepare the checklist items array
        const itemsArray = Array.isArray(checklist_items)
            ? checklist_items.filter(item => item.trim() !== "").map(item => ({
                item_name: item,
                is_completed: false,
                created_by: session_user_system_id,
                updated_by: session_user_system_id,
                is_deleted: false
            }))
            : [];

        // Update the checklist
        await Checklist.findByIdAndUpdate(checklist_id, {
            checklist_title,
            checklist_type,
            checklist_is_public: checklist_is_public === "true",
            checklist_items: itemsArray,  // Update items here
            updated_by: session_user_system_id
        });

        res.redirect("/my-checklists");
    } catch (error) {
        errorHandler(error, req, res);
    }
};

exports.renderViewChecklistPage = async (req, res) => {
    try{
        console.log("renderViewChecklistPage() :: Function called");

        const checklist_id = req.params.checklist_id;
        const session_user_id = req.session.session_user_id;
        const session_user_system_id = req.session.session_user_system_id;

        console.log("renderViewChecklistPage() :: checklist_id: " + checklist_id);
        console.log("renderViewChecklistPage() :: session_user_id: " + session_user_id);
        console.log("renderViewChecklistPage() :: session_user_system_id: " + session_user_system_id);

        // Fetch the checklist and populate share list with user object
        const checklist = await Checklist.findOne({ _id: checklist_id, is_deleted: false })
        .populate({
            path: "checklist_shared_with.share_user_id",
            model: "User",
            select: "_id user_id user_email"
        })

        if (!checklist){
            return res.render("error_general_auth", {
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                session_user_id: session_user_id,
                session_user_system_id: session_user_system_id,
                error_title: 'Error',
                error_msg: 'Checklist not found'
            });
        }

        // Check if the logged-in user is the owner
        const is_checklist_owner = checklist.created_by.toString() === session_user_system_id;
        console.log("renderViewChecklistPage() :: is_checklist_owner: " + is_checklist_owner);

        // Check if the checklist is shared with the logged-in user
        const checklist_shared_with_user = checklist.checklist_shared_with.find(
            (share) => share.share_user_id && share.share_user_id._id && share.share_user_id._id.toString() === session_user_system_id
        );
        console.log("renderViewChecklistPage() :: checklist_shared_with_user: ", checklist_shared_with_user);

        // If the user is not the owner and the checklist is not shared with the user, deny access
        if (is_checklist_owner === false && !checklist_shared_with_user) {
            return res.render("error_general_auth", {
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                session_user_id: session_user_id,
                session_user_system_id: session_user_system_id,
                error_title: 'Access Denied',
                error_msg: 'You do not have permission to view this checklist.'
            });
        }

        return res.render("checklist_view", {
            SITE_TITLE: process.env.SITE_TITLE,
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            session_user_id: session_user_id,
            session_user_system_id: session_user_system_id,
            share_url: false,
            checklist: checklist
        });

    } catch (error) {
        errorHandler(error, req, res);
    }
};

exports.deleteChecklist = async (req, res) => {
    try {
        console.log("deleteChecklist() :: Function called");

        const checklist_id = req.params.checklist_id;
        const session_user_id = req.session.session_user_id;
        const session_user_system_id = req.session.session_user_system_id;

        console.log("deleteChecklist() :: checklist_id: " + checklist_id);
        console.log("deleteChecklist() :: session_user_id: " + session_user_id);
        console.log("updateChecklist() :: session_user_system_id: " + session_user_system_id);

        // Fetch the checklist
        const checklist = await Checklist.findOne({ _id: checklist_id, is_deleted: false });

        if (!checklist) {
            return res.render("error_general_auth", {
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                session_user_id: session_user_id,
                session_user_system_id: session_user_system_id,
                error_title: 'Error',
                error_msg: 'Checklist not found'
            });
        }

        // Verify if the logged-in user is the checklist owner
        if (checklist.created_by.toString() !== session_user_system_id) {
            return res.render("error_general_auth", {
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                session_user_id: session_user_id,
                session_user_system_id: session_user_system_id,
                error_title: 'Access Denied',
                error_msg: 'You do not have permission to delete this checklist.'
            });
        }

        // Mark the checklist as deleted
        await Checklist.findOneAndUpdate({ _id: checklist_id }, { is_deleted: true });

        res.redirect('/my-checklists');
    } catch (error) {
        errorHandler(error, req, res);
    }
};

exports.toggleItemCompletion = async (req, res) => {
    try {
        console.log("toggleItemCompletion() :: Function called");

        const { checklist_id, item_id } = req.params;
        const { is_completed } = req.body;

        console.log("toggleItemCompletion() :: checklist_id: " + checklist_id)
        console.log("toggleItemCompletion() :: item_id: " + item_id)
        console.log("toggleItemCompletion() :: is_completed: " + is_completed)

        await Checklist.updateOne(
            { _id: checklist_id, "checklist_items._id": item_id },
            { $set: { "checklist_items.$.is_completed": is_completed } }
        );

        res.status(200).json({ message: "Item completion status updated." });
    } catch (error) {
        console.error("Error updating item completion status:", error);
        res.status(500).json({ message: "Error updating item completion status." });
    }
};

exports.renderSharedChecklistPage = async (req, res) => {
    try{
        console.log("renderSharedChecklistPage() :: Function called");

        const url_slug = req.params.url_slug;

        console.log("renderSharedChecklistPage() :: url_slug: " + url_slug);

        const checklist = await Checklist.findOne({ checklist_url_slug: url_slug, is_deleted: false });

        if (!checklist){
            return res.status(404).render("error_general_unauth", {
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                error_title: 'Error',
                error_msg: 'Checklist not found'
            });
        }

        // Check if the checklist is public or the user is logged in
        const checklist_is_public = checklist.checklist_is_public;
        const user_is_authenticated = req.session && req.session.session_user_id;

        // If the checklist is private and the user is not logged in, show access denied
        if (!checklist_is_public && !user_is_authenticated) {
            return res.status(403).render("error_general_unauth", {
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                error_title: 'Access Denied',
                error_msg: "You do not have permission to view this checklist."
            });
        }

        return res.render("checklist_view", {
            SITE_TITLE: process.env.SITE_TITLE,
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            share_url: true,
            checklist: checklist
        });

    } catch (error) {
        errorHandler(error, req, res);
    }
};

exports.shareChecklist = async (req, res) => {
    try {
        console.log("shareChecklist() :: Function called");

        const { checklist_id, share_user_id, share_access_level } = req.body;
        const session_user_id = req.session.session_user_id;
        const session_user_system_id = req.session.session_user_system_id;

        console.log("shareChecklist() :: checklist_id: " + checklist_id);
        console.log("shareChecklist() :: share_user_id: " + share_user_id);
        console.log("shareChecklist() :: share_access_level: " + share_access_level);
        console.log("shareChecklist() :: session_user_id: " + session_user_id);
        console.log("shareChecklist() :: session_user_system_id: " + session_user_system_id);

        const checklist = await Checklist.findOne({ _id: checklist_id, created_by: session_user_system_id, is_deleted: false });

        if (!checklist) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const user_to_share = await User.findOne({
            $or: [{ user_email: share_user_id }, { user_id: share_user_id }]
        });

        console.log("shareChecklist() :: user_to_share: ", user_to_share);
        
        if (!user_to_share) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        /*
        if (checklist.checklist_shared_with.find(
            (shared) => shared.user.toString() === user_to_share._id.toString()
        )) {
            return res.status(400).json({ success: false, message: "Already shared with this user" });
        }
        */


        checklist.checklist_shared_with.push({
            share_user_id: user_to_share._id,
            share_access_level: share_access_level
        });
        await checklist.save();

        res.json({ success: true, message: "Checklist shared successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.unshareChecklist = async (req, res) => {
    try {
        console.log("unshareChecklist() :: Function called");

        const { checklist_id, unshare_user_id } = req.body;
        const session_user_id = req.session.session_user_id;
        const session_user_system_id = req.session.session_user_system_id;

        console.log("unshareChecklist() :: checklist_id: " + checklist_id);
        console.log("unshareChecklist() :: unshare_user_id: " + unshare_user_id);
        console.log("unshareChecklist() :: session_user_id: " + session_user_id);
        console.log("unshareChecklist() :: session_user_system_id: " + session_user_system_id);

        const checklist = await Checklist.findOne({ _id: checklist_id, created_by: session_user_system_id, is_deleted: false })
        .populate({
            path: "checklist_shared_with.share_user_id",
            model: "User",
            select: "_id user_id user_email"

        })
        
        if (!checklist) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        // Filter based on the `_id` property of the populated user documents
        checklist.checklist_shared_with = checklist.checklist_shared_with.filter(user => user.share_user_id.user_id.toString() !== unshare_user_id);
        //console.log("unshareChecklist() :: checklist: ", checklist)
        await checklist.save();

        res.json({ success: true, message: "User removed from shared list" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
