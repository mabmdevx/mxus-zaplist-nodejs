const { errorHandler } = require('../utils/helpers');

exports.renderDashboard = async (req, res) => {
    try{
        console.log("renderDashboard() :: Function called");
    
        return res.render("dashboard", {
            SITE_TITLE: process.env.SITE_TITLE,
            CURRENT_YEAR: new Date().getFullYear(),
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            session_user_id: req.session.session_user_id
        });

    } catch (error) {
        errorHandler(error, req, res);
    }
};
