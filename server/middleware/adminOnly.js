//adminOnly.js
const AppError = require("../utils/AppError");

const adminOnly = (req, res, next) => {
  console.log("--> verifyAdmin: Middleware started.");

  if (req.user && req.user.isAdmin === true) {
    console.log("--> verifyAdmin: User is admin. Proceeding.");
    next();
  } else {
    console.log(
      "--> verifyAdmin: User is NOT admin or req.user not properly set. Sending 403."
    );
    return next(new AppError("Admin access required.", 403));
  }
};

module.exports = { adminOnly };
