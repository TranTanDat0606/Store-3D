import { GoogleGenAI } from '@google/genai';
import { config } from '../config';
import { AppError } from '../utils/AppError';

// ── Prompt version — bump to invalidate stale cached assets ────────
const PROMPT_VERSION = 'v2';

// ── Cache with TTL and size limit ──────────────────────────────────
interface CacheEntry {
  base64: string;
  timestamp: number;
}
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_MAX_ENTRIES = 20;
const CACHE = new Map<string, CacheEntry>();

function cacheGet(key: string): string | null {
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    CACHE.delete(key);
    return null;
  }
  return entry.base64;
}

function cacheSet(key: string, base64: string) {
  // Evict oldest if at capacity
  if (CACHE.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = CACHE.keys().next().value;
    if (oldestKey) CACHE.delete(oldestKey);
  }
  CACHE.set(key, { base64, timestamp: Date.now() });
}

// ── In-flight deduplication ────────────────────────────────────────
const inflight = new Map<string, Promise<GenerateImageResult>>();

// ── Gemini client ──────────────────────────────────────────────────
let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    if (!config.gemini.apiKey) {
      throw new AppError('Gemini API key is not configured', 500);
    }
    client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  }
  return client;
}

export interface GenerateImageInput {
  prompt: string;
  aspectRatio?: string;
  cacheKey?: string;
}

export interface GenerateImageResult {
  base64: string;
  mimeType: string;
  cached: boolean;
}

const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'] as const;

const GEMINI_MODEL = 'gemini-2.5-flash-image';
const REQUEST_TIMEOUT_MS = 8000;

// ── Style anchor (spec §25) ────────────────────────────────────────
const STYLE_ANCHOR = 'Pixar-style 3D render, cel-shaded with soft rim lighting, consistent saturated cyberpunk neon palette (hot pink #FF6FC4, purple #B98BFF, cyan #4DE8FF, dark navy background #0A0E1F), clean smooth toon shading, premium mobile game asset style —';

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageResult> {
  const cacheKey = input.cacheKey || `${PROMPT_VERSION}:${input.prompt}`;

  // Check cache
  const cached = cacheGet(cacheKey);
  if (cached) {
    return { base64: cached, mimeType: 'image/png', cached: true };
  }

  // In-flight dedup
  const existing = inflight.get(cacheKey);
  if (existing) {
    return existing;
  }

  const promise = doGenerate(input, cacheKey);
  inflight.set(cacheKey, promise);

  try {
    return await promise;
  } finally {
    inflight.delete(cacheKey);
  }
}

async function doGenerate(input: GenerateImageInput, cacheKey: string): Promise<GenerateImageResult> {
  const geminiClient = getClient();
  const aspectRatio = input.aspectRatio && ASPECT_RATIOS.includes(input.aspectRatio as any)
    ? input.aspectRatio
    : '16:9';

  try {
    // Timeout wrapper (spec §32: 8 seconds max)
    const response = await Promise.race([
      geminiClient.models.generateContent({
        model: GEMINI_MODEL,
        contents: input.prompt,
        config: {
          imageConfig: {
            aspectRatio,
            imageSize: '1K',
          },
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new AppError('Gemini API timeout', 504)), REQUEST_TIMEOUT_MS)
      ),
    ]);

    const parts = response?.candidates?.[0]?.content?.parts;
    if (!parts) {
      throw new AppError('No response from Gemini model', 500);
    }

    const imagePart = parts.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      throw new AppError('Gemini did not return an image', 500);
    }

    const base64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';

    cacheSet(cacheKey, base64);
    return { base64, mimeType, cached: false };
  } catch (err) {
    if (err instanceof AppError) throw err;
    const msg = (err as Error).message || '';
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      throw new AppError('Gemini API quota exceeded. Please try again later.', 429);
    }
    if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
      throw new AppError('Gemini API access denied. Check API key configuration.', 403);
    }
    throw new AppError(`Gemini API error: ${msg.slice(0, 200)}`, 502);
  }
}

export interface GenerateGameAssetInput {
  assetType: 'background' | 'road' | 'player' | 'bird-robot' | 'mouse-robot';
}

// ── Game asset prompts (spec §25-28) with versioned cache keys ─────
const GAME_ASSET_PROMPTS: Record<GenerateGameAssetInput['assetType'], string> = {
  background: `${STYLE_ANCHOR} Futuristic cyberpunk city skyline at night, dark neon atmosphere, glowing cyan and pink lights, tall skyscrapers with holographic billboards, 2D game background layer, pixel art style, seamless horizontal tileable, dark blue-purple sky`,
  road: `${STYLE_ANCHOR} Futuristic cyberpunk road surface, dark asphalt with glowing cyan neon lane lines, perspective view from side-scrolling game, seamless horizontal tileable, dark atmosphere with pink and cyan reflections`,
  player: `${STYLE_ANCHOR} Cute pink cyber cat protagonist, unmistakably a CAT with visible cat ears, cute face, expressive eyes, small cute proportions, pink dominant soft cyber armor, cyan accents, purple accents, compact laser gun, game-ready silhouette, transparent background, full body, centered, consistent lighting, no text, no watermark, no environment background`,
  'bird-robot': `${STYLE_ANCHOR} Cute but dangerous cyberpunk robotic bird enemy, unmistakably a BIRD with wings, beak, bird-like head, mechanical body, dark metallic armor, pink/purple/red neon accents, red eyes, game-ready silhouette, transparent background, full body, consistent lighting with player`,
  'mouse-robot': `${STYLE_ANCHOR} Cyberpunk robotic mouse enemy, unmistakably a MOUSE with mouse ears, mouse head, small snout, dark metallic armor, red eyes, neon sword, pink/purple/red accents, game-ready silhouette, transparent background, full body, consistent lighting with player and bird`,
};

export async function generateGameAsset(input: GenerateGameAssetInput): Promise<GenerateImageResult> {
  const prompt = GAME_ASSET_PROMPTS[input.assetType];
  if (!prompt) {
    throw new AppError(`Unknown asset type: ${input.assetType}`, 400);
  }

  return generateImage({
    prompt,
    aspectRatio: input.assetType === 'background' ? '16:9' : '1:1',
    cacheKey: `game_asset_${PROMPT_VERSION}_${input.assetType}`,
  });
}

export function clearCache() {
  CACHE.clear();
}
