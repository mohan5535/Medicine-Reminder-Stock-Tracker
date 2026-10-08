import mongoose, { Document, Schema } from "mongoose";

export interface IMedicine extends Document {
  name: string;
  dosage: string;
  frequency: string;
  scheduleTime: string;
  startDate: Date;
  endDate?: Date;
  initialStock: number;
  currentStock: number;
  lowStockThreshold: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const medicineSchema = new Schema<IMedicine>(
  {
    name: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, "Dosage is required"],
      trim: true,
    },
    frequency: {
      type: String,
      required: [true, "Frequency is required"],
      trim: true,
    },
    scheduleTime: {
      type: String,
      required: [true, "Schedule time is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
    },
    initialStock: {
      type: Number,
      required: [true, "Initial stock is required"],
      min: [0, "Initial stock cannot be negative"],
    },
    currentStock: {
      type: Number,
      required: [true, "Current stock is required"],
      min: [0, "Current stock cannot be negative"],
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [0, "Low stock threshold cannot be negative"],
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMedicine>("Medicine", medicineSchema);
