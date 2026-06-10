// ─── Email Validation ───
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email && email.length <= 254 && emailRegex.test(email);
}

// ─── Search Query Validation ───
function isValidSearchQuery(query) {
  // Max 200 chars to prevent ReDoS
  return query && query.length > 0 && query.length <= 200;
}

// ─── Safe Date Parsing ───
function safeParseDateISO(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch (err) {
    return null;
  }
}

// ─── File Size Validation (in bytes) ───
const MAX_FILE_SIZES = {
  avatar: 5 * 1024 * 1024,        // 5 MB
  document: 100 * 1024 * 1024,    // 100 MB
  default: 50 * 1024 * 1024,      // 50 MB
};

function isValidFileSize(sizeBytes, type = "default") {
  const maxSize = MAX_FILE_SIZES[type] || MAX_FILE_SIZES.default;
  return sizeBytes > 0 && sizeBytes <= maxSize;
}

module.exports = {
  isValidEmail,
  isValidSearchQuery,
  safeParseDateISO,
  isValidFileSize,
  MAX_FILE_SIZES,
};
