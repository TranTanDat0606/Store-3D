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

  let aiModuleStatus = 'not-loaded (mock-only mode, ai SDK not imported at runtime)';
  let aiTestModuleStatus = 'not-loaded (mock-only mode, ai/test SDK not imported at runtime)';
  let mockAvailable = config.ai.provider === 'mock';

  let aiSdkVersion = 'unknown';
  try {
    const fs = await import('fs');
    const path = await import('path');
    const pkgPath = path.default.join(process.cwd(), 'node_modules', 'ai', 'package.json');
    const pkg = JSON.parse(fs.default.readFileSync(pkgPath, 'utf-8'));
    aiSdkVersion = pkg.version || 'cannot-resolve';
  } catch {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const pkgPath = path.default.join(process.cwd(), 'server', 'node_modules', 'ai', 'package.json');
      const pkg = JSON.parse(fs.default.readFileSync(pkgPath, 'utf-8'));
      aiSdkVersion = pkg.version || 'cannot-resolve';
    } catch {
      aiSdkVersion = 'cannot-resolve';
    }
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
