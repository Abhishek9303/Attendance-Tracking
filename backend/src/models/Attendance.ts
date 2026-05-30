import { Schema, model } from 'mongoose';

const AttendanceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    checkInTime: { type: String, required: true }, // Format: HH:MM:SS
    timestamp: { type: Date, required: true, default: Date.now },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    selfieUrl: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    isLate: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

// Compound index to guarantee uniqueness of attendance per user per day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Attendance = model('Attendance', AttendanceSchema);
export default Attendance;
