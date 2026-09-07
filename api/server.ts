import { connectForVercel } from '../server/src/vercel-connect';
import { createApp } from '../server/src/app';

let app: any = null;

export default async function handler(req: any, res: any) {
  const requestId = Math.random().toString(36).slice(2, 8);
  const isAiChat = req.url?.includes('/ai-chat');

  if (isAiChat) {
    console.log(`[AI-DIAG ${requestId}] ${req.method} ${req.url} — Content-Type: ${req.headers?.['content-type'] || 'none'}`);
  }

  try {
    if (isAiChat) console.log(`[AI-DIAG ${requestId}] step=connectForVercel`);
    await connectForVercel();
    if (isAiChat) console.log(`[AI-DIAG ${requestId}] step=createApp, cached=${!!app}`);
    if (!app) {
      app = createApp();
    }
    if (isAiChat) console.log(`[AI-DIAG ${requestId}] step=app(req,res)`);
    return app(req, res);
  } catch (error: any) {
    console.error(`[Vercel API ${requestId}] Error in phase:`, {
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
      method: req.method,
      url: req.url,
    });
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
  }
}
