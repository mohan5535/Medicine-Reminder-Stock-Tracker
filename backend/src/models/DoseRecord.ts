import mongoose, { Document, Schema, Types } from "mongoose";

export type DoseStatus = "pending" | "taken" | "missed";

export interface IDoseRecord extends Document {
  medicineId: Types.ObjectId;
  scheduleId?: Types.ObjectId;
  scheduledDate: Date;
  scheduledTime: string;
  status: DoseStatus;
  takenAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const doseRecordSchema = new Schema<IDoseRecord>(
  {
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: [true, "Medicine ID is required"],
    },
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: "Schedule",
    },
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    scheduledTime: {
      type: String,
      required: [true, "Scheduled time is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "taken", "missed"],
        message: "Status must be either 'pending', 'taken', or 'missed'",
      },
      default: "pending",
      required: true,
    },
    takenAt: {
      type: Date,
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

export default mongoose.model<IDoseRecord>("DoseRecord", doseRecordSchema);
