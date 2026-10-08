import { Request, Response } from "express";
import mongoose from "mongoose";
import DoseRecord from "../models/DoseRecord";
import Medicine from "../models/Medicine";
import Schedule from "../models/Schedule";

const VALID_STATUSES = ["pending", "taken", "missed"] as const;

// CREATE DOSE RECORD
export const createDose = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      medicineId,
      scheduleId,
      scheduledDate,
      scheduledTime,
      status = "pending",
      takenAt,
      notes,
    } = req.body;

    // Validate medicineId
    if (!medicineId || typeof medicineId !== "string" || !medicineId.trim()) {
      res.status(400).json({
        success: false,
        message: "Medicine ID is required",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
      res.status(400).json({
        success: false,
        message: "Invalid medicine ID",
      });
      return;
    }

    const medicineExists = await Medicine.findById(medicineId);
    if (!medicineExists) {
      res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
      return;
    }

    // Validate scheduleId if provided
    let scheduleObjectId: mongoose.Types.ObjectId | undefined;
    if (scheduleId !== undefined && scheduleId !== null && scheduleId !== "") {
      if (typeof scheduleId !== "string" || !mongoose.Types.ObjectId.isValid(scheduleId)) {
        res.status(400).json({
          success: false,
          message: "Invalid schedule ID",
        });
        return;
      }

      const scheduleExists = await Schedule.findById(scheduleId);
      if (!scheduleExists) {
        res.status(404).json({
          success: false,
          message: "Schedule not found",
        });
        return;
      }
      scheduleObjectId = new mongoose.Types.ObjectId(scheduleId);
    }

    // Validate scheduledDate
    if (!scheduledDate) {
      res.status(400).json({
        success: false,
        message: "Scheduled date is required",
      });
      return;
    }

    const parsedScheduledDate = new Date(scheduledDate);
    if (isNaN(parsedScheduledDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid scheduled date",
      });
      return;
    }

    // Validate scheduledTime
    if (!scheduledTime || typeof scheduledTime !== "string" || !scheduledTime.trim()) {
      res.status(400).json({
        success: false,
        message: "Scheduled time is required",
      });
      return;
    }

    // Validate status
    if (typeof status !== "string" || !VALID_STATUSES.includes(status as any)) {
      res.status(400).json({
        success: false,
        message: "Invalid dose status. Allowed values: pending, taken, missed",
      });
      return;
    }

    // Validate takenAt
    let parsedTakenAt: Date | undefined;
    if (takenAt !== undefined && takenAt !== null && takenAt !== "") {
      parsedTakenAt = new Date(takenAt);
      if (isNaN(parsedTakenAt.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid takenAt date",
        });
        return;
      }
    } else if (status === "taken") {
      parsedTakenAt = new Date();
    }

    if (status === "taken" && medicineExists.currentStock > 0) {
      await Medicine.findByIdAndUpdate(medicineId, {
        $set: { currentStock: Math.max(0, medicineExists.currentStock - 1) },
      });
    }

    const dose = await DoseRecord.create({
      medicineId: new mongoose.Types.ObjectId(medicineId),
      scheduleId: scheduleObjectId,
      scheduledDate: parsedScheduledDate,
      scheduledTime: scheduledTime.trim(),
      status,
      takenAt: parsedTakenAt,
      notes: typeof notes === "string" ? notes.trim() : "",
    });

    res.status(201).json({
      success: true,
      message: "Dose record created successfully",
      data: dose,
    });
  } catch (error: any) {
    console.error("Create dose error:", error);

    res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to create dose record",
    });
  }
};

// GET ALL DOSES
export const getDoses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const filter: Record<string, any> = {};

    if (req.query.medicineId && typeof req.query.medicineId === "string") {
      if (!mongoose.Types.ObjectId.isValid(req.query.medicineId)) {
        res.status(400).json({
          success: false,
          message: "Invalid medicine ID filter",
        });
        return;
      }
      filter.medicineId = req.query.medicineId;
    }

    if (req.query.scheduleId && typeof req.query.scheduleId === "string") {
      if (!mongoose.Types.ObjectId.isValid(req.query.scheduleId)) {
        res.status(400).json({
          success: false,
          message: "Invalid schedule ID filter",
        });
        return;
      }
      filter.scheduleId = req.query.scheduleId;
    }

    if (req.query.status && typeof req.query.status === "string") {
      if (!VALID_STATUSES.includes(req.query.status as any)) {
        res.status(400).json({
          success: false,
          message: "Invalid status filter. Allowed values: pending, taken, missed",
        });
        return;
      }
      filter.status = req.query.status;
    }

    const doses = await DoseRecord.find(filter)
      .populate("medicineId")
      .populate("scheduleId")
      .sort({ scheduledDate: -1, scheduledTime: -1 });

    res.status(200).json({
      success: true,
      count: doses.length,
      data: doses,
    });
  } catch (error: any) {
    console.error("Get doses error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dose records",
    });
  }
};

// GET DOSES FOR TODAY
export const getTodayDoses = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let baseDate = new Date();

    if (req.query.date && typeof req.query.date === "string") {
      const parsed = new Date(req.query.date);
      if (isNaN(parsed.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid date parameter",
        });
        return;
      }
      baseDate = parsed;
    }

    // Local day boundaries
    const localStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
    const localEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

    // UTC day boundaries
    const utcStart = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 0, 0, 0, 0));
    const utcEnd = new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate(), 23, 59, 59, 999));

    // Comprehensive window covering both local and UTC boundaries
    const windowStart = new Date(Math.min(localStart.getTime(), utcStart.getTime()));
    const windowEnd = new Date(Math.max(localEnd.getTime(), utcEnd.getTime()));

    const filter: Record<string, any> = {
      scheduledDate: { $gte: windowStart, $lte: windowEnd },
    };

    if (req.query.medicineId && typeof req.query.medicineId === "string") {
      if (!mongoose.Types.ObjectId.isValid(req.query.medicineId)) {
        res.status(400).json({
          success: false,
          message: "Invalid medicine ID filter",
        });
        return;
      }
      filter.medicineId = req.query.medicineId;
    }

    const doses = await DoseRecord.find(filter)
      .populate("medicineId")
      .populate("scheduleId")
      .sort({ scheduledTime: 1 });

    res.status(200).json({
      success: true,
      count: doses.length,
      data: doses,
    });
  } catch (error: any) {
    console.error("Get today doses error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch today's doses",
    });
  }
};

// GET SINGLE DOSE RECORD
export const getDoseById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid dose ID",
      });
      return;
    }

    const dose = await DoseRecord.findById(id)
      .populate("medicineId")
      .populate("scheduleId");

    if (!dose) {
      res.status(404).json({
        success: false,
        message: "Dose record not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: dose,
    });
  } catch (error: any) {
    console.error("Get dose error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dose record",
    });
  }
};

// UPDATE DOSE RECORD
export const updateDose = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid dose ID",
      });
      return;
    }

    const existingDose = await DoseRecord.findById(id);
    if (!existingDose) {
      res.status(404).json({
        success: false,
        message: "Dose record not found",
      });
      return;
    }

    const {
      medicineId,
      scheduleId,
      scheduledDate,
      scheduledTime,
      status,
      takenAt,
      notes,
    } = req.body;

    const updateData: Record<string, any> = {};

    if (medicineId !== undefined) {
      if (typeof medicineId !== "string" || !mongoose.Types.ObjectId.isValid(medicineId)) {
        res.status(400).json({
          success: false,
          message: "Invalid medicine ID",
        });
        return;
      }
      const medicineExists = await Medicine.findById(medicineId);
      if (!medicineExists) {
        res.status(404).json({
          success: false,
          message: "Medicine not found",
        });
        return;
      }
      updateData.medicineId = new mongoose.Types.ObjectId(medicineId);
    }

    if (scheduleId !== undefined) {
      if (scheduleId === null || scheduleId === "") {
        updateData.scheduleId = undefined;
      } else {
        if (typeof scheduleId !== "string" || !mongoose.Types.ObjectId.isValid(scheduleId)) {
          res.status(400).json({
            success: false,
            message: "Invalid schedule ID",
          });
          return;
        }
        const scheduleExists = await Schedule.findById(scheduleId);
        if (!scheduleExists) {
          res.status(404).json({
            success: false,
            message: "Schedule not found",
          });
          return;
        }
        updateData.scheduleId = new mongoose.Types.ObjectId(scheduleId);
      }
    }

    if (scheduledDate !== undefined) {
      const parsed = new Date(scheduledDate);
      if (isNaN(parsed.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid scheduled date",
        });
        return;
      }
      updateData.scheduledDate = parsed;
    }

    if (scheduledTime !== undefined) {
      if (typeof scheduledTime !== "string" || !scheduledTime.trim()) {
        res.status(400).json({
          success: false,
          message: "Scheduled time cannot be empty",
        });
        return;
      }
      updateData.scheduledTime = scheduledTime.trim();
    }

    if (status !== undefined) {
      if (typeof status !== "string" || !VALID_STATUSES.includes(status as any)) {
        res.status(400).json({
          success: false,
          message: "Invalid dose status. Allowed values: pending, taken, missed",
        });
        return;
      }
      updateData.status = status;

      // Handle automatic takenAt timestamp
      if (status === "taken" && takenAt === undefined && !existingDose.takenAt) {
        updateData.takenAt = new Date();
      } else if (status !== "taken" && takenAt === undefined) {
        updateData.takenAt = null;
      }

      // Stock deduction logic: When a dose is marked Taken, ensure stock is reduced only once. Never allow stock below zero.
      if (status === "taken" && existingDose.status !== "taken") {
        const targetMedId = updateData.medicineId || existingDose.medicineId;
        const targetMed = await Medicine.findById(targetMedId);
        if (targetMed && targetMed.currentStock > 0) {
          await Medicine.findByIdAndUpdate(targetMedId, {
            $set: { currentStock: Math.max(0, targetMed.currentStock - 1) },
          });
        }
      }
    }

    if (takenAt !== undefined) {
      if (takenAt === null || takenAt === "") {
        updateData.takenAt = null;
      } else {
        const parsedTakenAt = new Date(takenAt);
        if (isNaN(parsedTakenAt.getTime())) {
          res.status(400).json({
            success: false,
            message: "Invalid takenAt date",
          });
          return;
        }
        updateData.takenAt = parsedTakenAt;
      }
    }

    if (notes !== undefined) {
      updateData.notes = typeof notes === "string" ? notes.trim() : "";
    }

    const updatedDose = await DoseRecord.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("medicineId")
      .populate("scheduleId");

    res.status(200).json({
      success: true,
      message: "Dose record updated successfully",
      data: updatedDose,
    });
  } catch (error: any) {
    console.error("Update dose error:", error);

    res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to update dose record",
    });
  }
};

// DELETE DOSE RECORD
export const deleteDose = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid dose ID",
      });
      return;
    }

    const dose = await DoseRecord.findByIdAndDelete(id);

    if (!dose) {
      res.status(404).json({
        success: false,
        message: "Dose record not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Dose record deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete dose error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete dose record",
    });
  }
};
