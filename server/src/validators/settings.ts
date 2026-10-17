import { z } from 'zod';

/**
 * Task 12 — admin write contract for site settings.
 *
 * Everything is optional (a missing key = leave untouched/not configured),
 * trimmed, and capped at 200 chars. Unknown keys are stripped by Zod, so a
 * request can never smuggle `_id`/`key`/timestamps into the store.
 */
const MAX_LEN = 200;

const settingText = z.string().trim().max(MAX_LEN, `Giá trị tối đa ${MAX_LEN} ký tự`);

export const updateSettingsSchema = z.object({
  hotline: settingText.optional(),
  supportHours: settingText.optional(),
  email: settingText.optional(),
  address: settingText.optional(),
  socialLinks: z
    .object({
      facebook: settingText.optional(),
      zalo: settingText.optional(),
      instagram: settingText.optional(),
    })
    .optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
