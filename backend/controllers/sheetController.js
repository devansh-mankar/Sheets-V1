import { Sheet } from "../models/Sheet.js";

// Create a new sheet
export const createSheet = async (req, res) => {
  try {
    const { name, data } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Sheet name is required" });
    }

    // Check if sheet with same name already exists for this user
    const existingSheet = await Sheet.findOne({ name, user: req.userId });

    if (existingSheet) {
      return res.status(400).json({
        success: false,
        message: "You already have a sheet with this name",
      });
    }

    const newSheet = new Sheet({
      name,
      data: data || {},
      user: req.userId,
    });

    await newSheet.save();

    res.status(201).json({
      success: true,
      sheet: newSheet,
      message: "Sheet created successfully",
    });
  } catch (error) {
    console.error("Create sheet error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating sheet",
    });
  }
};

// Get all sheets for the logged-in user
export const getSheets = async (req, res) => {
  try {
    const sheets = await Sheet.find({ user: req.userId })
      .select("name createdAt updatedAt")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: sheets.length,
      sheets,
    });
  } catch (error) {
    console.error("Get sheets error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sheets",
    });
  }
};

// Get a specific sheet by ID
export const getSheetById = async (req, res) => {
  try {
    const sheet = await Sheet.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: "Sheet not found or you don't have permission to access it",
      });
    }

    res.status(200).json({
      success: true,
      sheet,
    });
  } catch (error) {
    console.error("Get sheet by ID error:", error);

    // Check if error is due to invalid ObjectId
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Sheet not found - invalid ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching sheet",
    });
  }
};

// Update a sheet
export const updateSheet = async (req, res) => {
  try {
    const { name, data } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Sheet name is required",
      });
    }

    // Check if another sheet with same name exists for this user
    const duplicateSheet = await Sheet.findOne({
      name,
      user: req.userId,
      _id: { $ne: req.params.id }, // Exclude current sheet from check
    });

    if (duplicateSheet) {
      return res.status(400).json({
        success: false,
        message: "You already have another sheet with this name",
      });
    }

    // Find and update the sheet
    const updatedSheet = await Sheet.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { name, data: data || {} },
      { new: true, runValidators: true }
    );

    if (!updatedSheet) {
      return res.status(404).json({
        success: false,
        message: "Sheet not found or you don't have permission to update it",
      });
    }

    res.status(200).json({
      success: true,
      sheet: updatedSheet,
      message: "Sheet updated successfully",
    });
  } catch (error) {
    console.error("Update sheet error:", error);

    // Check if error is due to invalid ObjectId
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Sheet not found - invalid ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating sheet",
    });
  }
};

// Delete a sheet
export const deleteSheet = async (req, res) => {
  try {
    const sheet = await Sheet.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!sheet) {
      return res.status(404).json({
        success: false,
        message: "Sheet not found or you don't have permission to delete it",
      });
    }

    res.status(200).json({
      success: true,
      message: "Sheet deleted successfully",
    });
  } catch (error) {
    console.error("Delete sheet error:", error);

    // Check if error is due to invalid ObjectId
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Sheet not found - invalid ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting sheet",
    });
  }
};
