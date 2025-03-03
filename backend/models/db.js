import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export default async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Database connected successfully!");
  } catch (error) {
    console.log(error);
  }
}
