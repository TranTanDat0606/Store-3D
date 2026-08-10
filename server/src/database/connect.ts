import mongoose from 'mongoose';
import { config } from '../config';

/**
 * Connects to MongoDB. The database (store3d) is created automatically
 * by MongoDB on the first insert once a model writes a document.
 */
export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(config.mongodbUri);
    console.log(`[DB] Connected to MongoDB: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('[DB] MongoDB connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('[DB] Disconnected from MongoDB');
}
