const { errorHandler } = require('../utils/helpers');

exports.renderDashboard = async (req, res) => {
    try{
        console.log("renderDashboard() :: Function called");
    
        return res.render("dashboard", {
            site_title: process.env.SITE_TITLE,
            user_id: req.session.user_id
        });

    } catch (error) {
        errorHandler(error, req, res);
    }
};
