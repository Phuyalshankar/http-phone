import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/http_intercom';
  
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log('🐬 MongoDB Connected Successfully to:', uri);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
}
