import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { config } from '../config';
import mongoose from 'mongoose';

const router = Router();

router.get('/config', requireAuth, requireAdmin, async (_req, res) => {
  const envFlags = {
    NODE_ENV: config.env,
    AI_PROVIDER: config.ai.provider,
    AI_API_KEY_CONFIGURED: !!config.ai.apiKey,
    GEMINI_API_KEY_CONFIGURED: !!config.gemini.apiKey,
    CLIENT_URL_CONFIGURED: !!process.env.CLIENT_URL,
    MAIL_HOST_CONFIGURED: !!config.smtp.host,
    SMTP_USER_CONFIGURED: !!config.smtp.user,
    MONGODB_URI_CONFIGURED: !!process.env.MONGODB_URI,
    JWT_SECRET_CONFIGURED: !!process.env.JWT_SECRET,
    CLOUDINARY_CONFIGURED: !!config.cloudinary.cloudName,
    BANK_CONFIGURED: !!config.bank.bin,
  };

  let aiModuleStatus = 'unknown';
  let aiTestModuleStatus = 'unknown';
  let mockAvailable = false;
  try {
    const ai = await import('ai');
    aiModuleStatus = 'loaded';
    mockAvailable = typeof (ai as any).streamText === 'function';
  } catch (e: any) {
    aiModuleStatus = `FAILED: ${e?.message}`;
  }
  try {
    await import('ai/test');
    aiTestModuleStatus = 'loaded';
  } catch (e: any) {
    aiTestModuleStatus = `FAILED: ${e?.message}`;
  }

  let aiSdkVersion = 'unknown';
  try {
    const ai = await import('ai');
    aiSdkVersion = (ai as any).version || 'loaded-but-unknown';
  } catch {
    aiSdkVersion = 'cannot-resolve';
  }

  let dbState = 'unknown';
  try {
    const readyState = mongoose.connection.readyState;
    dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][readyState] || `unknown(${readyState})`;
  } catch {
    dbState = 'error';
  }

  res.json({
    success: true,
    message: 'Debug config (admin only — temporary diagnostic endpoint)',
    data: {
      envFlags,
      aiModules: {
        aiModuleStatus,
        aiTestModuleStatus,
        mockAvailable,
        aiSdkVersion,
      },
      database: {
        readyState: dbState,
      },
      serverRuntime: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: Math.floor(process.uptime()),
        memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    },
  });
});

export default router;
