import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISchedule extends Document {
  medicineId: Types.ObjectId;
  time: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSchema = new Schema<ISchedule>(
  {
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
      required: [true, "Medicine ID is required"],
    },
    time: {
      type: String,
      required: [true, "Schedule time is required"],
      trim: true,
    },
    frequency: {
      type: String,
      required: [true, "Frequency is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISchedule>("Schedule", scheduleSchema);
