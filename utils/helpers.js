const crypto = require('crypto');
const Checklist = require('../models/Checklist');

function errorHandler(error, req, res) {

    /*
    // Automatic function name detection
    if (!functionName) {
        const stack = new Error().stack;
        const caller = stack.split('\n')[2].trim();  // Adjust index if needed
        functionName = caller.split(' ')[1];  // Extract function name
    }

    // Log the error
    console.error(`Error in ${functionName}:`, error.message);
    */

    console.error(`Error: `, error.message);

    // Render error page
    return res.render('error_general_unauth', {
        SITE_TITLE: process.env.SITE_TITLE,
        STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
        STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
        error_title: 'Error',
        msg_error: 'Oops! Something went wrong.'
    });

}

function checkUserLoggedIn(req, res, next) {
    console.log('checkUserLoggedIn() :: Function called for path: ', req.path);

    if (!req.session.session_user_id) {
        return res.redirect('/login');
    }
    return next();
}

async function generateUniqueSlug() {
    console.log('generateUniqueSlug() :: Function called');

    let slug;
    let exists = true;
    
    while (exists) {
        slug = crypto.randomBytes(4).toString('hex'); // Generate 8-character alphanumeric
        exists = await Checklist.findOne({ url_slug: slug });
    }

    return slug;
}

module.exports = { errorHandler, checkUserLoggedIn, generateUniqueSlug };
