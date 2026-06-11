const db = require("../database/db");

module.exports = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      const isApi = req.originalUrl.startsWith("/api");
      return isApi ? res.status(401).json({ error: "Nicht autorisiert" }) : res.redirect("/login");
    }

    const user = db.prepare("SELECT is_admin FROM users WHERE id = ?").get(req.user.id);
    
    if (!user || !user.is_admin) {
      const isApi = req.originalUrl.startsWith("/api");
      return isApi ? res.status(403).json({ error: "Admin-Zugriff erforderlich" }) : res.redirect("/login");
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
