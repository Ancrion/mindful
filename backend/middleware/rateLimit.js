const rateLimit = require("express-rate-limit");

// General API rate limit: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Zu viele Anfragen von dieser IP, bitte später versuchen.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict auth rate limit: 5 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Zu viele Anmeldeversuche, bitte später versuchen.",
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset rate limit: 3 requests per hour
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Zu viele Passwort-Zurücksetzen-Versuche, bitte später versuchen.",
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordLimiter,
};
