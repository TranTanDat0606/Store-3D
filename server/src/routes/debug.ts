import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { config } from '../config';
import mongoose from 'mongoose';

const router = Router();

const _dynamicImport = new Function('specifier', 'return import(specifier)');

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
    const ai = await _dynamicImport('ai');
    aiModuleStatus = 'loaded';
    mockAvailable = typeof (ai as any).streamText === 'function';
  } catch (e: any) {
    aiModuleStatus = `FAILED: ${e?.message}`;
  }
  try {
    await _dynamicImport('ai/test');
    aiTestModuleStatus = 'loaded';
  } catch (e: any) {
    aiTestModuleStatus = `FAILED: ${e?.message}`;
  }

  let aiSdkVersion = 'unknown';
  try {
    const aiPkg = await _dynamicImport('ai/package.json');
    aiSdkVersion = aiPkg.version || 'cannot-resolve';
  } catch {
    try {
      // Fallback: try reading package.json directly from filesystem
      const fs = await import('fs');
      const path = await import('path');
      const pkgPath = path.default.join(process.cwd(), 'node_modules', 'ai', 'package.json');
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
