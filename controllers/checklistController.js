const Checklist = require('../models/Checklist');
const User = require('../models/User');
const { errorHandler, generateUniqueSlug } = require('../utils/helpers');

exports.renderListMyChecklists = async (req, res) => {
    try{
        console.log("renderListMyChecklists() :: Function called");

        const user_id = req.session.user_id;

        console.log("renderListMyChecklists() :: user_id: " + user_id);

        const my_checklists = await Checklist.find({ created_by: user_id, is_deleted: false });

        return res.render("checklist_list_mine", {
            site_title: process.env.SITE_TITLE,
            user_id: req.session.user_id,
            my_checklists: my_checklists
        });

    } catch (error) {
        errorHandler(error, req, res);
    }

};

exports.renderCreateChecklistPage = (req, res) => {
    try{
        console.log("renderCreateChecklistPage() :: Function called");

        const user_id = req.session.user_id;

        console.log("renderCreateChecklistPage() :: user_id: " + user_id);

        return res.render("checklist_form", {
            site_title: process.env.SITE_TITLE,
            user_id: user_id,
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
        const user_id = req.session.user_id;

        console.log("createChecklist() :: user_id: " + user_id);

        // Generate unique slug for the new checklist
        const checklist_url_slug = await generateUniqueSlug();

        // Prepare the checklist items array
        const itemsArray = Array.isArray(checklist_items)
            ? checklist_items.filter(item => item.trim() !== "").map(item => ({
                item_name: item,
                is_completed: false,
                created_by: user_id,
                updated_by: user_id,
                is_deleted: false
            }))
            : [];

        const checklist = new Checklist({
            checklist_title,
            checklist_type,
            checklist_url_slug,
            checklist_is_public: checklist_is_public === "true",
            checklist_items: itemsArray,
            created_by: user_id,
            updated_by: user_id,
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
        const user_id = req.session.user_id;

        console.log("renderUpdateChecklistPage() :: checklist_id: " + checklist_id);
        console.log("renderUpdateChecklistPage() :: user_id: " + user_id);

        // Fetch the checklist
        const checklist = await Checklist.findOne({ _id: checklist_id, is_deleted: false });

        if (!checklist) {
            return res.render("error_general_auth", {
                site_title: process.env.SITE_TITLE,
                user_id: req.session.user_id,
                error_title: 'Error',
                error_msg: 'Checklist not found'
            });
        }

        // Verify if the logged-in user is the checklist owner
        if (checklist.created_by.toString() !== user_id) {
            return res.render("error_general_auth", {
                site_title: process.env.SITE_TITLE,
                user_id: req.session.user_id,
                error_title: 'Access Denied',
                error_msg: 'You do not have permission to update this checklist.'
            });
        }

        return res.render("checklist_form", {
            site_title: process.env.SITE_TITLE,
            user_id: req.session.user_id,
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
        const user_id = req.session.user_id;

        console.log("updateChecklist() :: checklist_id: " + checklist_id);
        console.log("updateChecklist() :: user_id: " + user_id);

        // Fetch the checklist
        const checklist = await Checklist.findOne({ _id: checklist_id, is_deleted: false });

        if (!checklist) {
            return res.render("error_general_auth", {
                site_title: process.env.SITE_TITLE,
                user_id: req.session.user_id,
                error_title: 'Error',
                error_msg: 'Checklist not found'
            });
        }

        // Verify if the logged-in user is the checklist owner
        if (checklist.created_by.toString() !== user_id) {
            return res.render("error_general_auth", {
                site_title: process.env.SITE_TITLE,
                user_id: req.session.user_id,
                error_title: 'Access Denied',
                error_msg: 'You do not have permission to update this checklist.'
            });
        }

        // Prepare the checklist items array
        const itemsArray = Array.isArray(checklist_items)
            ? checklist_items.filter(item => item.trim() !== "").map(item => ({
                item_name: item,
                is_completed: false,
                created_by: user_id,
                updated_by: user_id,
                is_deleted: false
            }))
            : [];

        // Update the checklist
        await Checklist.findByIdAndUpdate(checklist_id, {
            checklist_title,
            checklist_type,
            checklist_is_public: checklist_is_public === "true",
            checklist_items: itemsArray,  // Update items here
            updated_by: user_id
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
        const user_id = req.session.user_id;

        console.log("renderViewChecklistPage() :: checklist_id: " + checklist_id);
        console.log("renderViewChecklistPage() :: user_id: " + user_id);

        // Fetch the checklist
        const checklist = await Checklist.findOne({ _id: checklist_id, is_deleted: false });

        if (!checklist){
            return res.render("error_general_auth", {
                site_title: process.env.SITE_TITLE,
                user_id: req.session.user_id,
                error_title: 'Error',
                error_msg: 'Checklist not found'
            });
        }

        // Check if the checklist belongs to the logged-in user
        if (checklist.created_by.toString() !== user_id) {
            return res.render("error_general_auth", {
                site_title: process.env.SITE_TITLE,
                user_id: req.session.user_id,
                error_title: 'Access Denied',
                error_msg: 'You do not have permission to view this checklist.'
            });
        }

        return res.render("checklist_view", {
            site_title: process.env.SITE_TITLE,
            user_id: req.session.user_id,
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
        const user_id = req.session.user_id;

        console.log("deleteChecklist() :: checklist_id: " + checklist_id);
        console.log("deleteChecklist() :: user_id: " + user_id);

        // Fetch the checklist
        const checklist = await Checklist.findOne({ _id: checklist_id, is_deleted: false });

        if (!checklist) {
            return res.render("error_general_auth", {
                site_title: process.env.SITE_TITLE,
                user_id: req.session.user_id,
                error_title: 'Error',
                error_msg: 'Checklist not found'
            });
        }

        // Verify if the logged-in user is the checklist owner
        if (checklist.created_by.toString() !== user_id) {
            return res.render("error_general_auth", {
                site_title: process.env.SITE_TITLE,
                user_id: req.session.user_id,
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
                site_title: process.env.SITE_TITLE,
                error_title: 'Error',
                error_msg: 'Checklist not found'
            });
        }

        // Check if the checklist is public or the user is logged in
        const checklist_is_public = checklist.checklist_is_public;
        const user_is_authenticated = req.session && req.session.user_id;

        // If the checklist is private and the user is not logged in, show access denied
        if (!checklist_is_public && !user_is_authenticated) {
            return res.status(403).render("error_general_unauth", {
                site_title: process.env.SITE_TITLE,
                error_title: 'Access Denied',
                error_msg: "You do not have permission to view this checklist."
            });
        }

        return res.render("checklist_view", {
            site_title: process.env.SITE_TITLE,
            share_url: true,
            checklist: checklist
        });

    } catch (error) {
        errorHandler(error, req, res);
    }
};

