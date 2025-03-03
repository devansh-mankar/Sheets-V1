import jwt from "jsonwebtoken";

const ensureAuthenticated = (req, res, next) => {
  console.log("Cookies received:", req.cookies);
  const token = req.cookies.jwt;

  console.log("JWT token found:", token ? "Yes" : "No");

  if (!token) {
    return res
      .status(403)
      .json({ message: "Unauthorized, JWT token is required" });
  }

  try {
    console.log("Attempting to verify token");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded:", decoded);
    req.userId = decoded._id;
    console.log("User ID set to:", req.userId);
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res
      .status(403)
      .json({ message: "Unauthorized, JWT token wrong or expired" });
  }
};

export { ensureAuthenticated };
