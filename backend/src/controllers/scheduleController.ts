import { Request, Response } from "express";
import mongoose from "mongoose";
import Schedule from "../models/Schedule";
import Medicine from "../models/Medicine";

// CREATE SCHEDULE
export const createSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      medicineId,
      time,
      frequency,
      startDate,
      endDate,
      enabled,
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

    // Validate required fields
    if (!time || typeof time !== "string" || !time.trim()) {
      res.status(400).json({
        success: false,
        message: "Schedule time is required",
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

    const schedule = await Schedule.create({
      medicineId: new mongoose.Types.ObjectId(medicineId),
      time: time.trim(),
      frequency: frequency.trim(),
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      enabled: enabled !== undefined ? Boolean(enabled) : true,
    });

    res.status(201).json({
      success: true,
      message: "Schedule created successfully",
      data: schedule,
    });
  } catch (error: any) {
    console.error("Create schedule error:", error);

    res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to create schedule",
    });
  }
};

// GET ALL SCHEDULES
export const getSchedules = async (
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

    const schedules = await Schedule.find(filter)
      .populate("medicineId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error: any) {
    console.error("Get schedules error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch schedules",
    });
  }
};

// GET SINGLE SCHEDULE
export const getScheduleById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid schedule ID",
      });
      return;
    }

    const schedule = await Schedule.findById(id).populate("medicineId");

    if (!schedule) {
      res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error: any) {
    console.error("Get schedule error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch schedule",
    });
  }
};

// UPDATE SCHEDULE
export const updateSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid schedule ID",
      });
      return;
    }

    const existingSchedule = await Schedule.findById(id);
    if (!existingSchedule) {
      res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
      return;
    }

    const {
      medicineId,
      time,
      frequency,
      startDate,
      endDate,
      enabled,
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

    if (time !== undefined) {
      if (typeof time !== "string" || !time.trim()) {
        res.status(400).json({
          success: false,
          message: "Schedule time cannot be empty",
        });
        return;
      }
      updateData.time = time.trim();
    }

    if (frequency !== undefined) {
      if (typeof frequency !== "string" || !frequency.trim()) {
        res.status(400).json({
          success: false,
          message: "Frequency cannot be empty",
        });
        return;
      }
      updateData.frequency = frequency.trim();
    }

    let effectiveStartDate = existingSchedule.startDate;
    if (startDate !== undefined) {
      const parsed = new Date(startDate);
      if (isNaN(parsed.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid start date",
        });
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
          res.status(400).json({
            success: false,
            message: "Invalid end date",
          });
          return;
        }
        if (parsed < effectiveStartDate) {
          res.status(400).json({
            success: false,
            message: "End date cannot be before start date",
          });
          return;
        }
        updateData.endDate = parsed;
      }
    }

    if (enabled !== undefined) {
      updateData.enabled = Boolean(enabled);
    }

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("medicineId");

    res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (error: any) {
    console.error("Update schedule error:", error);

    res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message: error.message || "Failed to update schedule",
    });
  }
};

// DELETE SCHEDULE
export const deleteSchedule = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid schedule ID",
      });
      return;
    }

    const schedule = await Schedule.findByIdAndDelete(id);

    if (!schedule) {
      res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete schedule error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete schedule",
    });
  }
};
