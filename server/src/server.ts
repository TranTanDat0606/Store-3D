import { createApp } from './app';
import { connectDB } from './database/connect';
import { config } from './config';

async function startServer() {
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

startServer();
