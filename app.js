require("dotenv").config();
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const { connectToDB } = require('./utils/db');
const { checkUserLoggedIn, errorHandler } = require('./utils/helpers');

const app = express();
const PORT = process.env.PORT || 3000; // Default to 3000 if not set

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


// Auth routes
app.get('/signup', authController.renderSignupPage);
app.post('/signup', authController.signup);

app.get('/login', authController.renderLoginPage);
app.post('/login', authController.login);

app.get('/logout', authController.logout);


// App routes
app.get("/dashboard", appController.renderDashboard);


// List My Checklsits
app.get("/my-checklists", checklistController.renderListMyChecklists);

// Create Checklist
app.get("/checklists/create", checklistController.renderCreateChecklistPage);
app.post("/checklists/create", checklistController.createChecklist);

// Update Checklist
app.get("/checklists/update/:checklist_id", checklistController.renderUpdateChecklistPage);
app.post("/checklists/update/:checklist_id", checklistController.updateChecklist);

// View Checklist
app.get("/checklists/view/:checklist_id", checklistController.renderViewChecklistPage);

// Delete Checklist
app.get("/checklists/delete/:checklist_id", checklistController.deleteChecklist);

// Toggle Checklist Item Completion
app.post('/checklists/:checklist_id/items/:item_id/toggle-completion', checklistController.toggleItemCompletion)

// Share URL
app.get('/share/:url_slug', checklistController.renderSharedChecklistPage);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
