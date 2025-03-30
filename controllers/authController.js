const User = require('../models/User');
const bcrypt = require('bcrypt');
const { errorHandler } = require('../utils/helpers');

exports.renderSignupPage = (req, res) => {
    try {
        console.log("renderSignupPage() :: Function called");

        // Render signup form
        return res.render('signup', {
            SITE_TITLE: process.env.SITE_TITLE,
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            error_msg: ''
        });

    } catch (error) {
        errorHandler(error, req, res);
    }
};

exports.signup = async (req, res) => {
    try {
        console.log("signup() :: Function called");

        const { app_user_id, app_user_password, app_user_confirm_password, app_user_email } = req.body;

        // Check if userId and password are provided
        if (!app_user_id|| !app_user_password || !app_user_confirm_password || !app_user_email) {
            console.log("signup() :: Missing data for user: " + app_user_id);

            return res.render("signup", { 
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                error_msg: "Missing data."
            });
        }

        // Check if passwords match
        if (app_user_password !== app_user_confirm_password) {
            console.log("signup() :: Passwords do not match for user: " + app_user_id);

            return res.render('signup', {
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                error_msg: 'Passwords do not match.'
            });
        }

        // Check if user already exists
        const existing_user_obj = await User.findOne({ app_user_id, is_deleted: false });
        if (existing_user_obj) {
            console.log("signup() :: UserID is already in use for user: " + app_user_id);

            return res.render('signup', {
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                error_msg: 'UserID is already in use.'
            });
        }

        // Hash password
        const salt_rounds = 10;
        const hashed_password = await bcrypt.hash(app_user_password, salt_rounds);

        // Create new user
        const new_user_obj = new User({
            user_id: app_user_id,
            user_password: hashed_password,
            user_email: app_user_email,
            is_deleted: false
        });

        await new_user_obj.save();
        res.redirect("/login");

    } catch (error) {
        errorHandler(error, req, res);
    }
};

exports.renderLoginPage = (req, res) => {
    try {
        console.log("renderLoginPage() :: Function called");

        // Render login form
        return res.render('login', {
            SITE_TITLE: process.env.SITE_TITLE,
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            error_msg: ''
        });

    } catch (error) {
        errorHandler(error, req, res); 
    }
};

exports.login = async (req, res) => {
    try {
        console.log("login() :: Function called");

        const { app_user_id, app_user_password } = req.body;

        // Check if UserId and Password are provided
        if (!app_user_id|| !app_user_password) {
            console.log("login() :: Invalid credentials - UserId or password not provided for user: " + app_user_id);

            return res.render("login", { 
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                error_msg: "Invalid credentials"
            });
        }

        const user = await User.findOne({ user_id: app_user_id, is_deleted: false });

        // Check if user exists
        if (!user) {
            console.log("login() :: Invalid credentials - User does not exist: " + app_user_id);

            return res.render("login", { 
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                error_msg: "Invalid credentials"
            });
        }

        // Check if password is correct
        const isMatch = await bcrypt.compare(app_user_password, user.user_password);

        if (!isMatch) {
            console.log("login() :: Invalid credentials - Invalid Password for user: " + app_user_id);

            return res.render("login", { 
                SITE_TITLE: process.env.SITE_TITLE,
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                error_msg: "Invalid credentials"
            });
        } else {
            req.session.session_user_id = app_user_id; // Store user_id in session
            req.session.session_user_system_id = user._id; // Store user_system_id in session

            console.log("login() :: User logged in: " + req.session.session_user_id);
            console.log("login() :: session_user_system_id: " + req.session.session_user_system_id);

            res.redirect("/dashboard");
        }

    } catch (error) {
        errorHandler(error, req, res);
    }
};

exports.logout = (req, res) => {
    try {
        console.log("logout() :: Function called");
        
        // Destroy session
        if (req?.session?.session_user_id) {
            req.session.destroy(() => {
                res.redirect('/login');
            });
        } else {
            res.redirect('/login');
        }

    } catch (error) {
        errorHandler(error, req, res);
    }
};
