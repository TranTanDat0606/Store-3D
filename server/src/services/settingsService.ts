import { SiteSetting, SITE_SETTING_KEY } from '../models/SiteSetting';
import type { UpdateSettingsInput } from '../validators/settings';

/**
 * Task 12 — site settings service (owner mandate: never expose placeholder or
 * fabricated business info).
 *
 * Public read path: DB document wins → optional `SITE_*` env fallback →
 * key omitted entirely when neither is configured. There is NO default
 * anywhere: no '1900 1234', no invented support hours, no fabricated address.
 *
 * Optional env fallbacks (all optional — none is required to boot):
 *   SITE_HOTLINE, SITE_SUPPORT_HOURS, SITE_EMAIL, SITE_ADDRESS,
 *   SITE_FACEBOOK_URL, SITE_ZALO_URL, SITE_INSTAGRAM_URL
 *
 * Statistics (revenue, order/user counts) are NOT settings — they come from
 * the stats API only, per spec §Business info policy.
 */
export interface PublicSettings {
  hotline?: string;
  supportHours?: string;
  email?: string;
  address?: string;
  socialLinks?: {
    facebook?: string;
    zalo?: string;
    instagram?: string;
  };
}

export const PUBLIC_SETTING_KEYS = [
  'hotline',
  'supportHours',
  'email',
  'address',
  'socialLinks',
] as const;

type ScalarKey = 'hotline' | 'supportHours' | 'email' | 'address';
type SocialKey = 'facebook' | 'zalo' | 'instagram';

const SCALAR_KEYS: ScalarKey[] = ['hotline', 'supportHours', 'email', 'address'];
const SOCIAL_KEYS: SocialKey[] = ['facebook', 'zalo', 'instagram'];

const ENV_KEYS: Record<ScalarKey, string> = {
  hotline: 'SITE_HOTLINE',
  supportHours: 'SITE_SUPPORT_HOURS',
  email: 'SITE_EMAIL',
  address: 'SITE_ADDRESS',
};

const SOCIAL_ENV_KEYS: Record<SocialKey, string> = {
  facebook: 'SITE_FACEBOOK_URL',
  zalo: 'SITE_ZALO_URL',
  instagram: 'SITE_INSTAGRAM_URL',
};

/** Non-empty after trim, otherwise "not configured". Non-strings never leak. */
function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Builds the ONLY shape the public API may return: whitelisted keys only,
 * non-empty values only. DB wins over the `SITE_*` env fallback; empty or
 * missing values fall through to env; if neither is set the key is STRIPPED
 * (never `null`, never a placeholder).
 */
export function mergePublicSettings(
  db: Record<string, unknown>,
  env: NodeJS.ProcessEnv,
): PublicSettings {
  const out: PublicSettings = {};

  for (const key of SCALAR_KEYS) {
    const value = clean(db[key]) ?? clean(env[ENV_KEYS[key]]);
    if (value !== undefined) out[key] = value;
  }

  const dbSocial: Record<string, unknown> = isRecord(db.socialLinks) ? db.socialLinks : {};
  const social: NonNullable<PublicSettings['socialLinks']> = {};
  for (const key of SOCIAL_KEYS) {
    const value = clean(dbSocial[key]) ?? clean(env[SOCIAL_ENV_KEYS[key]]);
    if (value !== undefined) social[key] = value;
  }
  if (Object.keys(social).length > 0) out.socialLinks = social;

  return out;
}

export class SettingsService {
  /**
   * Public read (`GET /api/settings/public`): merges the singleton document
   * with the env fallback and returns only configured, whitelisted fields —
   * `_id`, `key` and timestamps can never reach the client because they are
   * not part of the projection.
   */
  async getPublic(): Promise<PublicSettings> {
    const doc = await SiteSetting.findOne({ key: SITE_SETTING_KEY }).lean();
    return mergePublicSettings((doc ?? {}) as Record<string, unknown>, process.env);
  }

  /**
   * Admin write (`PUT /api/settings`): partial upsert of the singleton doc.
   * Only Zod-validated, provided keys are written; the response is the same
   * public projection as the GET, so internal fields stay internal.
   */
  async update(input: UpdateSettingsInput): Promise<PublicSettings> {
    const update: Record<string, unknown> = {};

    for (const key of SCALAR_KEYS) {
      if (input[key] !== undefined) update[key] = input[key];
    }
    if (input.socialLinks !== undefined) {
      const social: Record<string, string> = {};
      for (const key of SOCIAL_KEYS) {
        const value = input.socialLinks[key];
        if (value !== undefined) social[key] = value;
      }
      update.socialLinks = social;
    }

    if (Object.keys(update).length > 0) {
      await SiteSetting.updateOne(
        { key: SITE_SETTING_KEY },
        { $set: update },
        { upsert: true },
      );
    }

    return this.getPublic();
  }
}

export const settingsService = new SettingsService();
