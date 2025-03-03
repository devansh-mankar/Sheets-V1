import express from "express";
import jwt from "jsonwebtoken"; // Add this import at the top of your file
import {
  signup,
  login,
  logout,
  userDetails,
} from "../controllers/authController.js";
import { UserModel } from "../models/UserModel.js";
import {
  loginValidation,
  signupValidation,
} from "../middlewares/joiValidation.js";
import { ensureAuthenticated } from "../middlewares/Auth.js";

const router = express.Router();

// Login Route
router.post("/login", loginValidation, login);

// Register Route
router.post("/signup", signupValidation, signup);

// Logout Route
router.post("/logout", logout);

// Keep your existing route with a few modifications
// User Details Endpoint - corrected version
router.get("/userDetails", async (req, res) => {
  // Debugging

  const token = req.cookies.jwt;
  if (!token) {
    console.log("No JWT cookie found");
    return res.status(401).json({ message: "No token found" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Use the decoded token to find the user
    // Now correctly using await with async
    const user = await UserModel.findById(decoded._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user details
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        // Add other user fields as needed
      },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
});

export default router;
