const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const isApiRequest = req.originalUrl.startsWith("/api");

  const token =
    req.cookies?.token || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    if (isApiRequest) {
      return res.status(401).json({ error: "Nicht autorisiert: Kein Token." });
    }
    return res.redirect("/login");
  }

  // 3. Token validieren
  try {
    // Sicherheit: Erzwungene Environment-Variable
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET ist nicht definiert!");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    res.locals.currentUser = decoded;
    return next();
  } catch (err) {
    // 4. Token fehlerhaft/abgelaufen
    res.clearCookie("token");

    if (isApiRequest) {
      return res.status(401).json({ error: "Token ungültig oder abgelaufen." });
    }
    return res.redirect("/login");
  }
};
