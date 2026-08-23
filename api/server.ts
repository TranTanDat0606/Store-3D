import mongoose from 'mongoose';
import type { IncomingMessage, ServerResponse } from 'http';

const MONGODB_URI = process.env.MONGODB_URI!;

let cached = (global as any).__mongoose_cache;
if (!cached) {
  cached = (global as any).__mongoose_cache = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

let appPromise: Promise<any> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const { createApp } = await import('../server/dist/app');
      return createApp();
    })();
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await connectDB();
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('[Vercel API] Error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
  }
}
