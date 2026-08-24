import { connectForVercel } from '../server/src/vercel-connect';
import { createApp } from '../server/src/app';

let app: any = null;

export default async function handler(req: any, res: any) {
  try {
    await connectForVercel();
    if (!app) {
      app = createApp();
    }
    return app(req, res);
  } catch (error) {
    console.error('[Vercel API] Error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
  }
}
