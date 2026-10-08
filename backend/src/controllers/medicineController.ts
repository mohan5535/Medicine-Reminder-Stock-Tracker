import { Request, Response } from "express";
import mongoose from "mongoose";
import Medicine from "../models/Medicine";

// CREATE MEDICINE
export const createMedicine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      dosage,
      frequency,
      scheduleTime,
      startDate,
      endDate,
      initialStock,
      currentStock,
      lowStockThreshold,
      notes,
    } = req.body;

    // Validate required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({
        success: false,
        message: "Medicine name is required",
      });
      return;
    }

    if (!dosage || typeof dosage !== "string" || !dosage.trim()) {
      res.status(400).json({
        success: false,
        message: "Dosage is required",
      });
      return;
    }

    if (!frequency || typeof frequency !== "string" || !frequency.trim()) {
      res.status(400).json({
        success: false,
        message: "Frequency is required",
      });
      return;
    }

    if (!scheduleTime || typeof scheduleTime !== "string" || !scheduleTime.trim()) {
      res.status(400).json({
        success: false,
        message: "Schedule time is required",
      });
      return;
    }

    if (!startDate) {
      res.status(400).json({
        success: false,
        message: "Start date is required",
      });
      return;
    }

    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid start date",
      });
      return;
    }

    let parsedEndDate: Date | undefined;
    if (endDate !== undefined && endDate !== null && endDate !== "") {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid end date",
        });
        return;
      }
      if (parsedEndDate < parsedStartDate) {
        res.status(400).json({
          success: false,
          message: "End date cannot be before start date",
        });
        return;
      }
    }

    if (initialStock === undefined || initialStock === null || typeof initialStock !== "number") {
      res.status(400).json({
        success: false,
        message: "Initial stock is required and must be a number",
      });
      return;
    }

    if (initialStock < 0) {
      res.status(400).json({
        success: false,
        message: "Initial stock cannot be negative",
      });
      return;
    }

    if (currentStock === undefined || currentStock === null || typeof currentStock !== "number") {
      res.status(400).json({
        success: false,
        message: "Current stock is required and must be a number",
      });
      return;
    }

    if (currentStock < 0) {
      res.status(400).json({
        success: false,
        message: "Current stock cannot be negative",
      });
      return;
    }

    if (lowStockThreshold !== undefined && lowStockThreshold !== null) {
      if (typeof lowStockThreshold !== "number" || lowStockThreshold < 0) {
        res.status(400).json({
          success: false,
          message: "Low stock threshold cannot be negative",
        });
        return;
      }
    }

    const medicine = await Medicine.create({
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      scheduleTime: scheduleTime.trim(),
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      initialStock,
      currentStock,
      lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold : 5,
      notes: typeof notes === "string" ? notes.trim() : "",
    });

    res.status(201).json({
      success: true,
      message: "Medicine created successfully",
      data: medicine,
    });
  } catch (error: any) {
    console.error("Create medicine error:", error);

    res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to create medicine",
    });
  }
};

// GET ALL MEDICINES
export const getMedicines = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const medicines = await Medicine.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines,
    });
  } catch (error: any) {
    console.error("Get medicines error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch medicines",
    });
  }
};

// GET SINGLE MEDICINE
export const getMedicineById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid medicine ID",
      });
      return;
    }

    const medicine = await Medicine.findById(id);

    if (!medicine) {
      res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error: any) {
    console.error("Get medicine error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch medicine",
    });
  }
};

// UPDATE MEDICINE
export const updateMedicine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid medicine ID",
      });
      return;
    }

    const {
      name,
      dosage,
      frequency,
      scheduleTime,
      startDate,
      endDate,
      initialStock,
      currentStock,
      lowStockThreshold,
      notes,
    } = req.body;

    const existingMedicine = await Medicine.findById(id);
    if (!existingMedicine) {
      res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
      return;
    }

    const updateData: Record<string, any> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json({ success: false, message: "Medicine name cannot be empty" });
        return;
      }
      updateData.name = name.trim();
    }

    if (dosage !== undefined) {
      if (typeof dosage !== "string" || !dosage.trim()) {
        res.status(400).json({ success: false, message: "Dosage cannot be empty" });
        return;
      }
      updateData.dosage = dosage.trim();
    }

    if (frequency !== undefined) {
      if (typeof frequency !== "string" || !frequency.trim()) {
        res.status(400).json({ success: false, message: "Frequency cannot be empty" });
        return;
      }
      updateData.frequency = frequency.trim();
    }

    if (scheduleTime !== undefined) {
      if (typeof scheduleTime !== "string" || !scheduleTime.trim()) {
        res.status(400).json({ success: false, message: "Schedule time cannot be empty" });
        return;
      }
      updateData.scheduleTime = scheduleTime.trim();
    }

    let effectiveStartDate = existingMedicine.startDate;
    if (startDate !== undefined) {
      const parsed = new Date(startDate);
      if (isNaN(parsed.getTime())) {
        res.status(400).json({ success: false, message: "Invalid start date" });
        return;
      }
      effectiveStartDate = parsed;
      updateData.startDate = parsed;
    }

    if (endDate !== undefined) {
      if (endDate === null || endDate === "") {
        updateData.endDate = undefined;
      } else {
        const parsed = new Date(endDate);
        if (isNaN(parsed.getTime())) {
          res.status(400).json({ success: false, message: "Invalid end date" });
          return;
        }
        if (parsed < effectiveStartDate) {
          res.status(400).json({ success: false, message: "End date cannot be before start date" });
          return;
        }
        updateData.endDate = parsed;
      }
    }

    if (initialStock !== undefined) {
      if (typeof initialStock !== "number" || initialStock < 0) {
        res.status(400).json({ success: false, message: "Initial stock cannot be negative" });
        return;
      }
      updateData.initialStock = initialStock;
    }

    if (currentStock !== undefined) {
      if (typeof currentStock !== "number" || currentStock < 0) {
        res.status(400).json({ success: false, message: "Current stock cannot be negative" });
        return;
      }
      updateData.currentStock = currentStock;
    }

    if (lowStockThreshold !== undefined) {
      if (typeof lowStockThreshold !== "number" || lowStockThreshold < 0) {
        res.status(400).json({ success: false, message: "Low stock threshold cannot be negative" });
        return;
      }
      updateData.lowStockThreshold = lowStockThreshold;
    }

    if (notes !== undefined) {
      updateData.notes = typeof notes === "string" ? notes.trim() : "";
    }

    const updatedMedicine = await Medicine.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      data: updatedMedicine,
    });
  } catch (error: any) {
    console.error("Update medicine error:", error);

    res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to update medicine",
    });
  }
};

// DELETE MEDICINE
export const deleteMedicine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid medicine ID",
      });
      return;
    }

    const medicine = await Medicine.findByIdAndDelete(id);

    if (!medicine) {
      res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete medicine error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete medicine",
    });
  }
};