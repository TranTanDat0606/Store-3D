import { streamText, type ModelMessage } from 'ai';
import { MockLanguageModelV4 } from 'ai/test';
import { config } from '../config';

const SYSTEM_PROMPT = `Bạn là trợ lý AI của Store3D - cửa hàng mô hình 3D in.
Bạn giúp khách hàng tìm hiểu về sản phẩm, quy trình in 3D, và thông tin cửa hàng.
Trả lời ngắn gọn, thân thiện bằng tiếng Việt.
Không trả lời về các chủ đề không liên quan đến cửa hàng hoặc in 3D.
Không bao giờ hỏi hoặc tiết lộ thông tin cá nhân nhạy cảm.`;

const MOCK_RESPONSE = 'Cảm ơn bạn đã liên hệ! Đây là bản demo AI chat của Store3D. Trong phiên bản đầy đủ, tôi sẽ giúp bạn tìm hiểu về các mô hình 3D in và dịch vụ của cửa hàng.';

function createMockModel() {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: new ReadableStream({
        async start(controller) {
          const text = MOCK_RESPONSE;
          const words = text.split(' ');
          controller.enqueue({ type: 'stream-start', warnings: [] });
          controller.enqueue({ type: 'text-start', id: 'mock-text' });
          for (let i = 0; i < words.length; i++) {
            const delta = (i === 0 ? '' : ' ') + words[i];
            controller.enqueue({ type: 'text-delta', id: 'mock-text', delta });
            await new Promise((r) => setTimeout(r, 30));
          }
          controller.enqueue({ type: 'text-end', id: 'mock-text' });
          controller.enqueue({ type: 'finish', usage: { inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 0 } } as any, finishReason: { unified: 'stop', raw: 'stop' } });
          controller.close();
        },
      }),
    }),
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

  if (config.ai.provider === 'mock') {
    return streamText({
      model: createMockModel(),
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
