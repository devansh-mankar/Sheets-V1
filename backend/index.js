import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./routes/authRouter.js";
import sheetRouter from "./routes/sheetRoutes.js";
import connectDB from "./models/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Update CORS to handle production environments
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || true
        : "http://localhost:5173",
    credentials: true, // Allow credentials (cookies, auth headers)
  })
);

app.use(cookieParser());

// API routes
app.use("/auth", authRouter);
app.use("/api/sheets", sheetRouter);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Handle all other routes by serving the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
