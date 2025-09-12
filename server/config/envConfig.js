//envConfig.js

const getNodeEnv = () => process.env.NODE_ENV || "development";

const getFrontendUrl = () => {
  return getNodeEnv() === "production"
    ? process.env.FRONTEND_URL_PRODUCTION
    : process.env.FRONTEND_URL_DEVELOPMENT;
};

const getDatabaseUrl = () => {
  return getNodeEnv() === "production"
    ? process.env.DATABASE_URL_PRODUCTION
    : process.env.DATABASE_URL_DEVELOPMENT;
};

const getAccessTokenSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (getNodeEnv() === "production") {
      console.error(
        "CRITICAL ERROR: JWT_SECRET environment variable is not set in production!"
      );
      //process.exit(1);
    }
    console.warn(
      "WARNING: JWT_SECRET is not set. Using a fallback for development."
    );
    return "your_dev_jwt_secret_fallback";
  }
  console.log("envConfig: getAccessTokenSecret returning a secret.");
  return secret;
};

const getRefreshTokenSecret = () => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) {
    if (getNodeEnv() === "production") {
      console.error(
        "CRITICAL ERROR: REFRESH_TOKEN_SECRET environment variable is not set in production!"
      );
      //process.exit(1);
    }
    console.warn(
      "WARNING: REFRESH_TOKEN_SECRET is not set. Using a fallback for development."
    );
    return "your_dev_refresh_token_secret_fallback";
  }
  return secret;
};

const getPort = () => {
  return process.env.PORT || 5000;
};

const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (getNodeEnv() === "production") {
      console.error(
        "CRITICAL ERROR: SESSION_SECRET environment variable is not set in production!"
      );
      //process.exit(1);
    }
    console.warn(
      "WARNING: SESSION_SECRET is not set. Using a fallback for development."
    );
    return "a_weak_but_functional_dev_secret";
  }
  return secret;
};

const getEmailUser = () => {
  const user = process.env.EMAIL_USER;
  if (!user) {
    if (getNodeEnv() === "production") {
      console.error(
        "CRITICAL ERROR: EMAIL_USER environment variable is not set in production!"
      );
      //process.exit(1);
    }
    console.warn(
      "WARNING: EMAIL_USER is not set. Email sending might fail in development."
    );
    return "dev_email_user_fallback@example.com";
  }
  return user;
};

const getEmailPassword = () => {
  const password = process.env.EMAIL_PASS;
  if (!password) {
    if (getNodeEnv() === "production") {
      console.error(
        "CRITICAL ERROR: EMAIL_PASS environment variable is not set in production!"
      );
      //process.exit(1);
    }
    console.warn(
      "WARNING: EMAIL_PASS is not set. Email sending might fail in development."
    );
    return "dev_email_password_fallback";
  }
  return user;
};

module.exports = {
  getNodeEnv,
  getFrontendUrl,
  getDatabaseUrl,
  getAccessTokenSecret,
  getRefreshTokenSecret,
  getPort,
  getSessionSecret,
  getEmailUser,
  getEmailPassword,
};
