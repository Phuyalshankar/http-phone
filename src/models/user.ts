import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  extension: string; // Intercom extension number, e.g., "1001"
  name: string;
  phone?: string;
  avatar?: string;
  role: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
  recoveryCodes?: string[] | null;
  pending2FASecret?: string | null;
  publicKey?: string | null; // ECDH exchange key
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String },
  extension: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },
  role: { type: String, default: 'user' },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: null },
  recoveryCodes: { type: [String], default: null },
  pending2FASecret: { type: String, default: null },
  publicKey: { type: String, default: null },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
