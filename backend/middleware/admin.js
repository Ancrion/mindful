const db = require("../database/db");

module.exports = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Nicht autorisiert" });
    }

    const user = db.prepare("SELECT is_admin FROM users WHERE id = ?").get(req.user.id);
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: "Admin-Zugriff erforderlich" });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
