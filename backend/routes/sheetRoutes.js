import express from "express";
import {
  createSheet,
  getSheets,
  getSheetById,
  updateSheet,
  deleteSheet,
} from "../controllers/sheetController.js";
import { ensureAuthenticated } from "../middlewares/Auth.js";

const router = express.Router();

// Update routes to match controller implementation
router.post("/", ensureAuthenticated, createSheet);
router.get("/", ensureAuthenticated, getSheets);
router.get("/:id", ensureAuthenticated, getSheetById);
router.put("/:id", ensureAuthenticated, updateSheet);
router.delete("/:id", ensureAuthenticated, deleteSheet);

export default router;
