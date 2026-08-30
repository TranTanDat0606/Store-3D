import { streamText, type ModelMessage } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { config } from '../config';
import { Product } from '../models/Product';
import mongoose from 'mongoose';

const SYSTEM_PROMPT = `Bạn là trợ lý AI của Store3D - cửa hàng mô hình 3D in.
Bạn giúp khách hàng tìm hiểu về sản phẩm, quy trình in 3D, và thông tin cửa hàng.
Trả lời ngắn gọn, thân thiện bằng tiếng Việt.
Không trả lời về các chủ đề không liên quan đến cửa hàng hoặc in 3D.
Không bao giờ hỏi hoặc tiết lộ thông tin cá nhân nhạy cảm.
Khi gợi ý sản phẩm, luôn bao gồm tên, giá, và link chi tiết.`;

const QUERY_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Query timeout: ${label} exceeded ${ms}ms`)), ms)
    ),
  ]);
}

const GREETING_RESPONSES = [
  'Xin chào! Mình là trợ lý AI của Store3D. Bạn muốn tìm mô hình 3D, xem sản phẩm nổi bật, hay cần mình tư vấn theo ngân sách?',
  'Chào bạn! Chào mừng đến với Store3D. Mình có thể giúp bạn tìm mô hình 3D phù hợp, tư vấn chất liệu, hoặc gợi ý sản phẩm theo ngân sách.',
  'Xin chào! Mình sẵn sàng giúp bạn tìm mô hình 3D yêu thích. Bạn có ngân sách cụ thể nào không?',
  'Chào bạn đến với Store3D! Bạn cần tìm mô hình 3D, tư vấn in 3D, hay xem sản phẩm đang giảm giá?',
];

const GREETING_PATTERNS = /^(hello|hi|hey|xin\s*chào|chào|alo|chào\s*bạn|xin\s*chào\s*bạn|hey\s*bạn|hi\s*bạn|hello\s*bạn)\b/i;

const BUDGET_PATTERNS = [
  /(?:khoảng|tầm|dưới|trên|từ|đến|ngoài|trong|khoảng?\s*tầm)\s*(\d[\d.,]*)\s*(k|tr(?:iệu)?|nghìn|đồng)?/i,
  /(\d[\d.,]*)\s*(k|tr(?:iệu)?|nghìn|đồng)\s*(?:không|không?|có|còn|được)/i,
  /(?:tìm|kiếm|mua|có|find)\s*(?:.*?)(\d[\d.,]*)\s*(k|tr(?:iệu)?|nghìn|đồng)?/i,
  /(\d[\d.,]*)\s*(?:₫|đ)/i,
  /(?:giá|price|budget|ngân\s*sách)\s*(?:.*?)(\d[\d.,]*)\s*(k|tr(?:ệu)?|nghìn|đồng)?/i,
];

const PRODUCT_KEYWORDS = /(?:sản\s*phẩm|mô\s*hình|model|figure|mô|hình|đồ|chơi|figure|toy|product|items?)/i;

function parseBudget(text: string): { min?: number; max?: number; target?: number } | null {
  const tuDenMatch = text.match(/từ\s*(\d[\d.,]*)\s*(k|tr(?:ệu)?|nghìn|đồng)?\s*đến\s*(\d[\d.,]*)\s*(k|tr(?:ệu)?|nghìn|đồng)?/i);
  if (tuDenMatch) {
    const parseVal = (numStr: string, unit: string) => {
      let v = parseInt(numStr.replace(/[.,]/g, ''), 10);
      if (isNaN(v)) return 0;
      const u = unit.toLowerCase();
      if (u === 'k' || u === 'nghìn') v *= 1000;
      else if (u.startsWith('tr') || u === 'triệu') v *= 1000000;
      else if (v < 1000) v *= 1000;
      return v;
    };
    const min = parseVal(tuDenMatch[1], tuDenMatch[2] || '');
    const max = parseVal(tuDenMatch[3], tuDenMatch[4] || '');
    if (min > 0 && max > 0) return { min, max };
  }

  for (const pattern of BUDGET_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      let numStr = match[1].replace(/[.,]/g, '');
      const unit = (match[2] || '').toLowerCase();

      let value = parseInt(numStr, 10);
      if (isNaN(value)) continue;

      if (unit === 'k' || unit === 'nghìn') {
        value *= 1000;
      } else if (unit.startsWith('tr') || unit === 'triệu') {
        value *= 1000000;
      } else if (value < 1000) {
        value *= 1000;
      }

      if (text.includes('dưới')) {
        return { max: value };
      }
      if (text.includes('trên')) {
        return { min: value };
      }
      return { target: value };
    }
  }
  return null;
}

function isGreeting(text: string): boolean {
  return GREETING_PATTERNS.test(text.trim());
}

function isProductQuery(text: string): boolean {
  return PRODUCT_KEYWORDS.test(text) || /bao\s*nhiêu|giá|giá?\s*bao|bao nhiêu|đồng|vnd|k\b|triệu|nghìn/i.test(text);
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

function formatProductLine(p: Record<string, unknown>): string {
  const name = (p.name as string) ?? 'Sản phẩm';
  const salePrice = (p.salePrice as number) ?? 0;
  const slug = (p.slug as string) ?? '';
  return `- **${name}** — ${formatPrice(salePrice)} → [Xem chi tiết](/san-pham/${slug})`;
}

async function searchProductsByBudget(budget: { min?: number; max?: number; target?: number }) {
  const readyState = mongoose.connection.readyState;
  if (readyState !== 1) {
    console.error(`[AIChat] MongoDB not ready (readyState=${readyState}). Attempting reconnect...`);
    try {
      await mongoose.connect(process.env.MONGODB_URI!, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
    } catch (reconnectErr: any) {
      console.error('[AIChat] Reconnect failed:', reconnectErr.message);
    }
  }

  const filter: Record<string, unknown> = { status: 'active', stock: { $gt: 0 } };

  if (budget.target) {
    const tolerance = budget.target * 0.4;
    filter.salePrice = {
      $gte: Math.max(0, budget.target - tolerance),
      $lte: budget.target + tolerance,
    };
  } else {
    if (budget.min != null || budget.max != null) {
      filter.salePrice = {};
      if (budget.min != null) (filter.salePrice as Record<string, number>).$gte = budget.min;
      if (budget.max != null) (filter.salePrice as Record<string, number>).$lte = budget.max;
    }
  }

  console.log('[AIChat] Product query filter:', JSON.stringify(filter));

  let products = await withTimeout(
    Product.find(filter)
      .sort({ salePrice: 1 })
      .limit(5)
      .select('name slug salePrice originalPrice images')
      .lean(),
    QUERY_TIMEOUT_MS,
    'searchProductsByBudget primary'
  );

  if (products.length === 0 && budget.target) {
    const closest = await withTimeout(
      Product.find({ status: 'active', stock: { $gt: 0 } })
        .sort({ salePrice: 1 })
        .select('name slug salePrice originalPrice images')
        .lean(),
      QUERY_TIMEOUT_MS,
      'searchProductsByBudget fallback'
    );

    if (closest.length > 0) {
      const sorted = closest.map((p) => ({
        ...p,
        distance: Math.abs(p.salePrice - budget.target!),
      })).sort((a, b) => a.distance - b.distance);

      products = sorted.slice(0, 3);
    }
  }

  console.log(`[AIChat] Found ${products.length} products`);
  return products;
}

function buildBudgetResponse(products: Awaited<ReturnType<typeof searchProductsByBudget>>, budget: { min?: number; max?: number; target?: number }): string {
  const budgetStr = budget.target
    ? formatPrice(budget.target)
    : budget.min && budget.max
      ? `${formatPrice(budget.min)} - ${formatPrice(budget.max)}`
      : budget.min
        ? `trên ${formatPrice(budget.min)}`
        : `dưới ${formatPrice(budget.max!)}`;

  if (products.length === 0) {
    return `Hiện tại Store3D chưa có sản phẩm phù hợp với ngân sách ${budgetStr}. Bạn có thể thử ngân sách khác hoặc xem toàn bộ sản phẩm tại /san-pham`;
  }

  const lines = products.map(formatProductLine);
  return `Mình tìm được ${products.length} sản phẩm phù hợp với ngân sách ${budgetStr}:\n\n${lines.join('\n')}\n\nBạn có muốn xem chi tiết sản phẩm nào không?`;
}

function createSmartMockModel(userMessage: string, contextProducts?: string) {
  return new MockLanguageModelV4({
    doStream: async () => {
      let response: string;

      try {
        if (isGreeting(userMessage)) {
          response = GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
        } else if (isProductQuery(userMessage)) {
          const budget = parseBudget(userMessage);

          if (budget) {
            const products = await searchProductsByBudget(budget);
            response = buildBudgetResponse(products, budget);
          } else if (contextProducts) {
            response = contextProducts;
          } else {
            const allProducts = await withTimeout(
              Product.find({ status: 'active', stock: { $gt: 0 } })
                .sort({ salePrice: 1 })
                .limit(5)
                .select('name slug salePrice originalPrice')
                .lean(),
              QUERY_TIMEOUT_MS,
              'allProducts fallback'
            );

            if (allProducts.length > 0) {
              const lines = allProducts.map(formatProductLine);
              response = `Đây là một số sản phẩm hiện có tại Store3D:\n\n${lines.join('\n')}\n\nBạn có muốn tìm sản phẩm theo ngân sách cụ thể không?`;
            } else {
              response = 'Hiện tại Store3D chưa có sản phẩm. Bạn có thể quay lại sau!';
            }
          }
        } else {
          const budget = parseBudget(userMessage);
          if (budget) {
            const products = await searchProductsByBudget(budget);
            response = buildBudgetResponse(products, budget);
          } else {
            response = 'Mình là trợ lý AI của Store3D. Mình có thể giúp bạn tìm mô hình 3D, tư vấn ngân sách, hoặc xem sản phẩm nổi bật. Bạn cần gì?';
          }
        }
      } catch (err: any) {
        console.error('[AIChat] doStream error:', err.message, err.stack);
        response = 'Xin lỗi, mình gặp vấn đề khi truy vấn sản phẩm. Bạn vui lòng thử lại hoặc liên hệ support@store3d.com để được hỗ trợ.';
      }

      const words = response.split(' ');

      return {
        stream: new ReadableStream({
          async start(controller) {
            controller.enqueue({ type: 'stream-start', warnings: [] });
            controller.enqueue({ type: 'text-start', id: 'mock-text' });
            for (let i = 0; i < words.length; i++) {
              const delta = (i === 0 ? '' : ' ') + words[i];
              controller.enqueue({ type: 'text-delta', id: 'mock-text', delta });
              await new Promise((r) => setTimeout(r, 20));
            }
            controller.enqueue({ type: 'text-end', id: 'mock-text' });
            controller.enqueue({ type: 'finish', usage: { inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 0 } } as any, finishReason: { unified: 'stop', raw: 'stop' } });
            controller.close();
          },
        }),
      };
    },
  });
}

export interface ChatServiceParams {
  messages: Array<{ role: 'user' | 'assistant'; content?: string; parts?: Array<{ type: string; text: string }> }>;
}

function extractText(msg: ChatServiceParams['messages'][number]): string {
  if (msg.content) return msg.content;
  if (msg.parts) {
    return msg.parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('');
  }
  return '';
}

export async function createChatStream(params: ChatServiceParams) {
  const { messages } = params;

  const modelMessages: ModelMessage[] = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: extractText(m),
  }));

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
  const userText = lastUserMessage ? extractText(lastUserMessage) : '';

  if (config.ai.provider === 'mock') {
    return streamText({
      model: createSmartMockModel(userText),
      messages: modelMessages,
      system: SYSTEM_PROMPT,
    });
  }

  if (!config.ai.apiKey) {
    throw new Error('AI_SERVICE_UNAVAILABLE');
  }

  return streamText({
    model: config.ai.model as any,
    messages: modelMessages,
    system: SYSTEM_PROMPT,
  });
}
