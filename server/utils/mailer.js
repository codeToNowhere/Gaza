//mailer.js
const nodemailer = require("nodemailer");
const config = require("../config/envConfig");
const AppError = require("./AppError");

//Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: { user: config.getEmailUser(), pass: config.getEmailPassword() },
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: config.getEmailUser(),
      to,
      subject,
      html: htmlContent,
    });
    console.log("Email sent successfully.");
    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    throw new AppError(
      "There was a problem sending the email. Please try again later.",
      500
    );
  }
};

module.exports = { transporter, sendEmail };
