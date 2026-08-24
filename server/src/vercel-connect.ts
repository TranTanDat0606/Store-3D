import mongoose from 'mongoose';
import { config } from '../config';

export async function connectForVercel(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongodbUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
}
