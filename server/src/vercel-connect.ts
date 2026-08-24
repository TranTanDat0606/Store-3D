import mongoose from 'mongoose';

export async function connectForVercel(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
}
