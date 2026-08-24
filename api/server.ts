import mongoose from 'mongoose';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { corsOptions } from '../server/src/config/cors';
import { config } from '../server/src/config';
import { globalLimiter } from '../server/src/config/rateLimit';
import { notFoundHandler } from '../server/src/middleware/notFound';
import { errorHandler } from '../server/src/middleware/errorHandler';
import authRoutes from '../server/src/routes/auth';
import productRoutes from '../server/src/routes/product';
import categoryRoutes from '../server/src/routes/category';
import orderRoutes from '../server/src/routes/order';
import paymentRoutes from '../server/src/routes/payment';
import wishlistRoutes from '../server/src/routes/wishlist';
import couponRoutes from '../server/src/routes/coupon';
import reviewRoutes from '../server/src/routes/review';
import userRoutes from '../server/src/routes/user';
import statsRoutes from '../server/src/routes/stats';
import uploadRoutes from '../server/src/routes/upload';

const MONGODB_URI = process.env.MONGODB_URI!;

let cached = (global as any).__mongoose_cache;
if (!cached) {
  cached = (global as any).__mongoose_cache = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;
  cached.conn = null;
  cached.promise = null;
  cached.promise = mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  });
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

let app: any = null;

async function getApp() {
  if (!app) {
    app = express();

    app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      })
    );
    app.set('trust proxy', 1);
    app.use(cors(corsOptions));
    app.use(cookieParser());
    app.use(express.json({ limit: '15mb' }));
    app.use(express.urlencoded({ extended: true, limit: '15mb' }));
    app.use(globalLimiter);

    app.use('/uploads', express.static(config.uploadDir));

    app.get('/api/health', (_req: any, res: any) => {
      const state = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      res.status(200).json({
        success: true,
        message: 'Store 3D API',
        data: { status: 'ok', db: state, timestamp: new Date().toISOString() },
      });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/payment', paymentRoutes);
    app.use('/api/wishlist', wishlistRoutes);
    app.use('/api/coupons', couponRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/admin/stats', statsRoutes);
    app.use('/api/upload', uploadRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);
  }
  return app;
}

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
    const appInstance = await getApp();
    return appInstance(req, res);
  } catch (error) {
    console.error('[Vercel API] Error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
  }
}
