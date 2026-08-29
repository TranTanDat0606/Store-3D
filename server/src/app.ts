import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { corsOptions } from './config/cors';
import { globalLimiter } from './config/rateLimit';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import productRoutes from './routes/product';
import categoryRoutes from './routes/category';
import orderRoutes from './routes/order';
import paymentRoutes from './routes/payment';
import wishlistRoutes from './routes/wishlist';
import couponRoutes from './routes/coupon';
import reviewRoutes from './routes/review';
import userRoutes from './routes/user';
import statsRoutes from './routes/stats';
import uploadRoutes from './routes/upload';
import contactRoutes from './routes/contact';
import newsRoutes from './routes/news';
import aiChatRoutes from './routes/ai-chat';

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(globalLimiter);

  // Health check
  app.get('/api/health', (_req, res) => {
    const state = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
      success: true,
      message: 'Store 3D API',
      data: { status: 'ok', db: state, timestamp: new Date().toISOString() },
    });
  });

  // API routes are mounted here per phase.
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
  app.use('/api/contact', contactRoutes);
  app.use('/api/news', newsRoutes);
  app.use('/api/ai-chat', aiChatRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
