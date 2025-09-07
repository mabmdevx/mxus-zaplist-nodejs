const User = require('../models/User');
const bcrypt = require('bcrypt');
const { errorHandler } = require('../utils/helpers');

exports.renderSignupPage = (req, res) => {
    try {
        console.log("renderSignupPage() :: Function called");

        // Render signup form
        return res.render('signup', {
            SITE_TITLE: process.env.SITE_TITLE,
            CURRENT_YEAR: new Date().getFullYear(),
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            msg_error: ''
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
                CURRENT_YEAR: new Date().getFullYear(),
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                msg_error: "Missing data."
            });
        }

        // Check if passwords match
        if (app_user_password !== app_user_confirm_password) {
            console.log("signup() :: Passwords do not match for user: " + app_user_id);

            return res.render('signup', {
                SITE_TITLE: process.env.SITE_TITLE,
                CURRENT_YEAR: new Date().getFullYear(),
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                msg_error: 'Passwords do not match.'
            });
        }

        // Check if user already exists
        const existing_user_obj = await User.findOne({ app_user_id, is_deleted: false });
        if (existing_user_obj) {
            console.log("signup() :: UserID is already in use for user: " + app_user_id);

            return res.render('signup', {
                SITE_TITLE: process.env.SITE_TITLE,
                CURRENT_YEAR: new Date().getFullYear(),
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                msg_error: 'UserID is already in use.'
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
            CURRENT_YEAR: new Date().getFullYear(),
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            msg_error: ''
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
                CURRENT_YEAR: new Date().getFullYear(),
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                msg_error: "Invalid credentials"
            });
        }

        const user = await User.findOne({ user_id: app_user_id, is_deleted: false });

        // Check if user exists
        if (!user) {
            console.log("login() :: Invalid credentials - User does not exist: " + app_user_id);

            return res.render("login", { 
                SITE_TITLE: process.env.SITE_TITLE,
                CURRENT_YEAR: new Date().getFullYear(),
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                msg_error: "Invalid credentials"
            });
        }

        // Check if password is correct
        const password_is_match = await bcrypt.compare(app_user_password, user.user_password);

        if (!password_is_match) {
            console.log("login() :: Invalid credentials - Invalid Password for user: " + app_user_id);

            return res.render("login", { 
                SITE_TITLE: process.env.SITE_TITLE,
                CURRENT_YEAR: new Date().getFullYear(),
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                msg_error: "Invalid credentials"
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

exports.renderChangePasswordPage = async (req, res) => {
    try{
        console.log("renderChangePasswordPage() :: Function called");

        const session_user_id = req.session.session_user_id;
        const session_user_system_id = req.session.session_user_system_id;

        console.log("renderChangePasswordPage() :: session_user_id: " + session_user_id);
        console.log("renderChangePasswordPage() :: session_user_system_id: " + session_user_system_id);

        res.render("change_password", { 
            SITE_TITLE: process.env.SITE_TITLE,
            CURRENT_YEAR: new Date().getFullYear(),
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            session_user_id: session_user_id,
            session_user_system_id: session_user_system_id,
            msg_success: null, 
            msg_error: null 
        });

    } catch (error) {
        errorHandler(error, req, res);
    }
    
};

exports.changePassword = async (req, res) => {
    try {
        console.log("changePassword() :: Function called");

        const { app_current_password, app_new_password, app_confirm_password } = req.body;

        const session_user_id = req.session.session_user_id;
        const session_user_system_id = req.session.session_user_system_id;

        console.log("changePassword() :: session_user_id: " + session_user_id);
        console.log("changePassword() :: session_user_system_id: " + session_user_system_id);

        if (!app_current_password || !app_new_password || !app_confirm_password) {
            console.log("changePassword() :: Error - All fields are required.");

            return res.render("change_password", {
                SITE_TITLE: process.env.SITE_TITLE,
                CURRENT_YEAR: new Date().getFullYear(),
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                session_user_id: session_user_id,
                session_user_system_id: session_user_system_id,
                msg_error: "All fields are required.", 
                msg_success: null 
            });
        }

        if (app_new_password !== app_confirm_password) {
            console.log("changePassword() :: Error - New passwords do not match.");

            return res.render("change_password", { 
                SITE_TITLE: process.env.SITE_TITLE,
                CURRENT_YEAR: new Date().getFullYear(),
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                session_user_id: session_user_id,
                session_user_system_id: session_user_system_id,
                msg_error: "New passwords do not match.", 
                msg_success: null
             });
        }


        const user = await User.findOne({ user_id: session_user_id });

        if (!user) {
            console.log("changePassword() :: Error - User not found.");
            
            return res.render("change_password", { 
                SITE_TITLE: process.env.SITE_TITLE,
                CURRENT_YEAR: new Date().getFullYear(),
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                session_user_id: session_user_id,
                session_user_system_id: session_user_system_id,
                msg_error: "User not found.",
                msg_success: null
            });
        }

        const password_is_match = await bcrypt.compare(app_current_password, user.user_password);

        if (!password_is_match) {
            console.log("changePassword() :: Error - Current password is incorrect.");

            return res.render("change_password", { 
                SITE_TITLE: process.env.SITE_TITLE,
                CURRENT_YEAR: new Date().getFullYear(),
                STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
                STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
                session_user_id: session_user_id,
                session_user_system_id: session_user_system_id,
                msg_error: "Current password is incorrect.",
                msg_success: null
            });
        }

        const hashed_password = await bcrypt.hash(app_new_password, 10);
        user.user_password = hashed_password;

        // Save the Password
        await user.save();

        console.log("changePassword() :: Success - Password changed successfully.");

        return res.render("change_password", { 
            SITE_TITLE: process.env.SITE_TITLE,
            CURRENT_YEAR: new Date().getFullYear(),
            STATCOUNTER_PROJECT_ID: process.env.STATCOUNTER_PROJECT_ID,
            STATCOUNTER_SECURITY_CODE: process.env.STATCOUNTER_SECURITY_CODE,
            session_user_id: session_user_id,
            session_user_system_id: session_user_system_id,
            msg_error: null, 
            msg_success: "Password changed successfully."
        });
        
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
