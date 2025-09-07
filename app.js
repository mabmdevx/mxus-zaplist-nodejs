require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const { connectToDB } = require('./utils/db');
const { checkUserLoggedIn, errorHandler } = require('./utils/helpers');

const app = express();
const APP_PORT = process.env.APP_PORT || 3000; // Default to 3000 if not set

// Serve static files (CSS, images, etc.)
app.use("/static", express.static(path.join(__dirname, "static")));

// Set EJS as the templating engine
app.set("view engine", "ejs");

// Set views directory
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, maxAge: 2 * 60 * 60 * 1000 } // 2 hours in milliseconds
    })
);

// Session Renewal on Activity (Optional)
app.use((req, res, next) => {
    if (req.session.user) {
        req.session._garbage = Date();
        req.session.touch();
    }
    next();
});

// Connect to MongoDB
connectToDB();

// Controllers
const authController = require('./controllers/authController');
const appController = require('./controllers/appController');
const checklistController = require('./controllers/checklistController');

// List of routes that should NOT require authentication
const publicRoutes = ["/static", "/signup", "/login", "/logout"];

// Apply authentication middleware to all routes except the ones in `publicRoutes` and `/share/<url-slug>`
app.use((req, res, next) => {
    // Skip authentication for routes in `publicRoutes` or routes starting with `/share/`
    if (publicRoutes.includes(req.path) || req.path.startsWith("/share/")) {
        return next(); // Skip authentication
    }

    checkUserLoggedIn(req, res, next); // Apply authentication for all other routes
});


// Define routes
app.get("/", (req, res) => {
    try{

        // Check if user is logged in
        checkUserLoggedIn(req, res);

        return res.redirect("/dashboard");

    } catch (error) {
        errorHandler(error, req, res);
    }
});


// -- Auth routes --
// Signup
app.get('/signup', authController.renderSignupPage);
app.post('/signup', authController.signup);

// Login
app.get('/login', authController.renderLoginPage);
app.post('/login', authController.login);

// Change Password
app.get('/change-password', authController.renderChangePasswordPage);
app.post('/change-password', authController.changePassword);

// Logout
app.get('/logout', authController.logout);


// -- App routes --
// Dashboard
app.get("/dashboard", appController.renderDashboard);

// List My Checklists
app.get("/my-checklists", checklistController.renderListMyOwnedChecklists);

// List Shared Checklists
app.get("/checklists-shared-with-me", checklistController.renderListMySharedChecklists);

// Create Checklist
app.get("/create-checklist", checklistController.renderCreateChecklistPage);
app.post("/create-checklist", checklistController.createChecklist);

// Update Checklist
app.get("/update-checklist/:checklist_id", checklistController.renderUpdateChecklistPage);
app.post("/update-checklist/:checklist_id", checklistController.updateChecklist);

// View Checklist
app.get("/view-checklist/:checklist_id", checklistController.renderViewChecklistPage);

// Delete Checklist
app.get("/delete-checklist/:checklist_id", checklistController.deleteChecklist);

// Share URL
app.get('/share/:url_slug', checklistController.renderSharedChecklistPage);


// -- API Endpoints --
// Toggle Checklist Item Completion
app.post('/api/checklist/toggle-item-completion', checklistController.toggleItemCompletion)

// Share Checklist with a user
app.post("/api/share-checklist", checklistController.shareChecklist);

// Unshare Checklist with a user
app.post("/api/unshare-checklist", checklistController.unshareChecklist);

// Start the server
app.listen(APP_PORT, () => {
    console.log(`Server running at http://localhost:${APP_PORT}`);
});
