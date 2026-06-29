import mongoose, { Schema, Document } from 'mongoose';

export interface ICallLog extends Document {
  callLogId: string; // unique ID from signaling
  callerExt: string;
  receiverExt: string;
  callerName?: string;
  receiverName?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // duration in seconds
  status: 'connecting' | 'connected' | 'completed' | 'rejected' | 'missed' | 'failed';
  createdAt: Date;
}

const CallLogSchema = new Schema<ICallLog>({
  callLogId: { type: String, required: true, unique: true, index: true },
  callerExt: { type: String, required: true, index: true },
  receiverExt: { type: String, required: true, index: true },
  callerName: { type: String, default: '' },
  receiverName: { type: String, default: '' },
  startTime: { type: Date },
  endTime: { type: Date },
  duration: { type: Number, default: 0 },
  status: { type: String, enum: ['connecting', 'connected', 'completed', 'rejected', 'missed', 'failed'], default: 'connecting' }
}, { timestamps: true });

export const CallLog = mongoose.model<ICallLog>('CallLog', CallLogSchema);
