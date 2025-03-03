import express from "express";

import authRouter from "./routes/authRouter.js";
import sheetRouter from "./routes/sheetRoutes.js";

import connectDB from "./models/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend URL
    credentials: true, // Allow credentials (cookies, auth headers)
  })
);

app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/api/sheets", sheetRouter);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
