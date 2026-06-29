import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: string; // Client-provided device identifier
  pushToken?: string; // FCM registration token or APNs hex token
  platform: 'android' | 'ios' | 'web' | 'desktop';
  status: 'online' | 'offline' | 'busy' | 'dnd'; // 'busy' is used during active calls
  lastSeen: Date;
}

const DeviceSchema = new Schema<IDevice>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deviceId: { type: String, required: true, unique: true, index: true },
  pushToken: { type: String, default: '' },
  platform: { type: String, enum: ['android', 'ios', 'web', 'desktop'], required: true },
  status: { type: String, enum: ['online', 'offline', 'busy', 'dnd'], default: 'offline', index: true },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
