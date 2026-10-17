import { createApp } from './app';
import { connectDB } from './database/connect';
import { config } from './config';
import { assertWebhookBootConfig } from './services/paymentService';

async function startServer() {
  // Fail fast at boot (GAP-10): production webhooks are always
  // signature-checked, so production must never start without a secret.
  assertWebhookBootConfig(config.env, config.paymentWebhookSecret);

  await connectDB();

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`[Server] Running at http://localhost:${config.port} (${config.env})`);
  });

  const shutdown = (signal: string) => {
    console.log(`[Server] Received ${signal}, shutting down...`);
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('[Server] Failed to start:', err instanceof Error ? err.message : err);
  process.exit(1);
});
