const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Checklist = require('../models/Checklist');
const User = require('../models/User');

const REMEMBER_ME_COOKIE = 'remember_me';
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

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
        CURRENT_YEAR: new Date().getFullYear(),
        STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
        STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
        error_title: 'Error',
        msg_error: 'Oops! Something went wrong.'
    });

}

// Checks for an active session or, failing that, a valid "remember me" cookie.
// If a valid remember-me token is found, the session is established (and the token rotated).
// Returns true if the request is authenticated (session established), false otherwise.
async function tryEstablishSession(req, res) {
    if (req.session.session_user_id) {
        return true;
    }

    // No active session - fall back to a "remember me" cookie, if present
    const remember_cookie = req.cookies ? req.cookies[REMEMBER_ME_COOKIE] : null;

    if (remember_cookie) {
        try {
            const [user_id, token] = remember_cookie.split(':');

            if (user_id && token) {
                const user = await User.findOne({ user_id, is_deleted: false });

                if (user && user.remember_token_hash && user.remember_token_expires && user.remember_token_expires > new Date()) {
                    const token_is_match = await bcrypt.compare(token, user.remember_token_hash);

                    if (token_is_match) {
                        console.log('tryEstablishSession() :: Valid remember-me token for user: ' + user_id);

                        // Rotate the token so a stolen/replayed cookie value cannot be reused
                        await issueRememberMeToken(res, user);

                        req.session.session_user_id = user.user_id;
                        req.session.session_user_system_id = user._id;

                        return true;
                    }
                }
            }
        } catch (error) {
            console.error('tryEstablishSession() :: Error validating remember-me token:', error.message);
        }

        // Invalid or expired token - clear the stale cookie
        res.clearCookie(REMEMBER_ME_COOKIE);
    }

    return false;
}

async function checkUserLoggedIn(req, res, next) {
    console.log('checkUserLoggedIn() :: Function called for path: ', req.path);

    const is_logged_in = await tryEstablishSession(req, res);

    if (is_logged_in) {
        return next();
    }

    return res.redirect('/login');
}

// Middleware for public-only pages (e.g. /login) - if the user already has an active
// session or a valid remember-me cookie, skip the page and redirect to /dashboard.
async function redirectIfAuthenticated(req, res, next) {
    console.log('redirectIfAuthenticated() :: Function called for path: ', req.path);

    const is_logged_in = await tryEstablishSession(req, res);

    if (is_logged_in) {
        return res.redirect('/dashboard');
    }

    return next();
}

// Generates a new "remember me" token for the given user, persists its hash, and sets the cookie
async function issueRememberMeToken(res, user) {
    const token = crypto.randomBytes(32).toString('hex');
    const hashed_token = await bcrypt.hash(token, 10);

    user.remember_token_hash = hashed_token;
    user.remember_token_expires = new Date(Date.now() + REMEMBER_ME_MAX_AGE);
    await user.save();

    res.cookie(REMEMBER_ME_COOKIE, `${user.user_id}:${token}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REMEMBER_ME_MAX_AGE
    });
}

// Invalidates any "remember me" token for the given session's user and clears the cookie
async function clearRememberMeToken(req, res) {
    const session_user_id = req.session ? req.session.session_user_id : null;

    if (session_user_id) {
        await User.updateOne(
            { user_id: session_user_id },
            { $set: { remember_token_hash: null, remember_token_expires: null } }
        );
    }

    res.clearCookie(REMEMBER_ME_COOKIE);
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

module.exports = { errorHandler, checkUserLoggedIn, redirectIfAuthenticated, generateUniqueSlug, issueRememberMeToken, clearRememberMeToken };
