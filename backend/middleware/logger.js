// ─── Simple JSON Logging ───
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data,
  };
  console.log(JSON.stringify(logEntry));
}

const logger = {
  info: (msg, data) => log("INFO", msg, data),
  warn: (msg, data) => log("WARN", msg, data),
  error: (msg, data) => log("ERROR", msg, data),
  debug: (msg, data) => log("DEBUG", msg, data),
};

module.exports = logger;
