const User = require('../models/User');
const bcrypt = require('bcrypt');
const { errorHandler } = require('../utils/helpers');

exports.renderSignupPage = (req, res) => {
    try {
        console.log("renderSignupPage() :: Function called");

        // Render signup form
        return res.render('signup', {
            site_title: process.env.SITE_TITLE,
            error_msg: ''
        });

    } catch (error) {
        errorHandler(error, req, res);
    }
};

exports.signup = async (req, res) => {
    try {
        console.log("signup() :: Function called");

        const { app_user_id, app_password, app_confirm_password } = req.body;

        // Check if userId and password are provided
        if (!app_user_id|| !app_password || !app_confirm_password) {
            return res.render("signup", { 
                site_title: process.env.SITE_TITLE, 
                error_msg: "Missing data."
            });
        }

        // Check if passwords match
        if (app_password !== app_confirm_password) {
            return res.render('signup', {
                site_title: process.env.SITE_TITLE,
                error_msg: 'Passwords do not match.'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ app_user_id, is_deleted: false });
        if (existingUser) {
            return res.render('signup', {
                site_title: process.env.SITE_TITLE,
                error_msg: 'User ID is already in use.'
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(app_password, saltRounds);

        // Create new user
        const newUser = new User({
            user_id: app_user_id,
            password: hashedPassword,
            is_deleted: false
        });

        await newUser.save();
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
            site_title: process.env.SITE_TITLE,
            error_msg: ''
        });

    } catch (error) {
        errorHandler(error, req, res); 
    }
};

exports.login = async (req, res) => {
    try {
        console.log("login() :: Function called");

        const { app_user_id, app_password } = req.body;

        // Check if userId and password are provided
        if (!app_user_id|| !app_password) {
            return res.render("login", { 
                site_title: process.env.SITE_TITLE, 
                error_msg: "Invalid credentials"
            });
        }

        const user = await User.findOne({ user_id: app_user_id, is_deleted: false });

        // Check if user exists
        if (!user) {
            return res.render("login", { 
                site_title: process.env.SITE_TITLE, 
                error_msg: "Invalid credentials"
            });
        }

        // Check if password is correct
        const isMatch = await bcrypt.compare(app_password, user.password);

        if (!isMatch) {
            return res.render("login", { 
                site_title: process.env.SITE_TITLE, 
                error_msg: "Invalid credentials"
            });
        } else {
            req.session.user_id = app_user_id; // Store user in session
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
        if (req?.session?.user_id) {
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
