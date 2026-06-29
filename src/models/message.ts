import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId?: mongoose.Types.ObjectId; // Present if it is a Direct Chat
  groupId?: mongoose.Types.ObjectId;    // Present if it is a Group Chat
  content: string; // Plaintext or encrypted payload
  type: 'text' | 'file' | 'call_log';
  mediaUrl?: string; // If file type, path to file
  mediaName?: string;
  mediaSize?: number;
  iv?: string; // Initialization vector for E2E encryption if used
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  groupId: { type: Schema.Types.ObjectId, ref: 'Group', index: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'file', 'call_log'], default: 'text' },
  mediaUrl: { type: String, default: '' },
  mediaName: { type: String, default: '' },
  mediaSize: { type: Number, default: 0 },
  iv: { type: String, default: '' },
  readBy: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
