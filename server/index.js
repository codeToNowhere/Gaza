//server/index.js
if (process.env.NODE_ENV === "production") {
  require("dotenv").config({ path: ".env.production" });
} else {
  require("dotenv").config({ path: ".env.development" });
}

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const config = require("./config/envConfig");

// --- IMPORT ROUTES ---
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const photocardRoutes = require("./routes/photocard");
const reportRoutes = require("./routes/report");

// --- IMPORT ERROR HANDLING ---
const globalErrorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/AppError");

const app = express;

// --- MIDDLEWARE ---

// CORS Origin (incoming)
const allowedOrigin = config.getFrontendUrl();

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
mongoose
  .connect(config.getDatabaseUrl())
  .then(() => console.log("MongoDB connected."))
  .catch((err) => console.error("MongoDB error:", err));

// Session Middleware for Passport
app.use(
  session({
    secret: config.getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      secure: config.getNodeEnv() === "production",
    },
  })
);

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// --- ROUTES ---
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/photocards", photocardRoutes);
app.use("/api/reports", reportRoutes);

// --- UNHANDLED ROUTES (404) ---
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// --- GLOBAL ERROR HANDLING MIDDLEWARE ---
app.use(globalErrorHandler);

// Start Server
const PORT = config.getPort();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
