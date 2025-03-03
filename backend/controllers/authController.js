import bcrypt from "bcrypt";
import { UserModel } from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { Sheet } from "../models/Sheet.js";

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (user) {
      return res.status(409).json({
        message: "User already exists, you can login",
        success: false,
      });
    }
    const userModel = new UserModel({ name, email, password });
    userModel.password = await bcrypt.hash(password, 10);
    await userModel.save();
    res.status(201).json({
      message: "Signup successfully",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    const errorMsg = "Authentication failed! Please check your credentials";

    if (!user) {
      return res.status(403).json({ message: errorMsg, success: false });
    }

    const isPassEqual = await bcrypt.compare(password, user.password);
    if (!isPassEqual) {
      return res.status(403).json({ message: errorMsg, success: false });
    }

    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set JWT as HTTP-only cookie
    res.cookie("jwt", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/", // 24 hours
    });

    // Also send token in response body for localStorage storage
    res.status(200).json({
      message: "Login Success",
      success: true,
      token: jwtToken, // Named 'token' to match localStorage key in frontend
      email,
      name: user.name,
      userId: user._id,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const logout = (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({
      message: "Logout successful",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const userDetails = async (req, res) => {
  try {
    const token = req.cookies?.jwt || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided", success: false });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid token", success: false });
    }

    if (!decoded || !decoded._id) {
      return res
        .status(400)
        .json({ message: "Invalid token structure", success: false });
    }

    // Log decoded token for debugging
    console.log("Decoded token:", decoded);

    const user = await UserModel.findById(decoded._id).select("name email");

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Error fetching user details:", err); // 👈 Logs actual error
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export { signup, login, logout, userDetails };
