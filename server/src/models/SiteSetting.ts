import { Schema, model, models, type Model } from 'mongoose';

/**
 * Task 12 — site settings store.
 *
 * Owner mandate: hotline, support hours, contact email, address and social
 * links are CONFIGURATION, never fabricated in code. Exactly one document is
 * ever written (key `site`); every field is optional — an absent/empty field
 * simply means "not configured" and is stripped from the public payload.
 */
export const SITE_SETTING_KEY = 'site';

export interface ISiteSettingSocialLinks {
  facebook?: string;
  zalo?: string;
  instagram?: string;
}

export interface ISiteSetting {
  key: string;
  hotline?: string;
  supportHours?: string;
  email?: string;
  address?: string;
  socialLinks?: ISiteSettingSocialLinks;
  createdAt: Date;
  updatedAt: Date;
}

const socialLinksSchema = new Schema<ISiteSettingSocialLinks>(
  {
    facebook: { type: String, trim: true, maxlength: 200 },
    zalo: { type: String, trim: true, maxlength: 200 },
    instagram: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false },
);

const siteSettingSchema = new Schema<ISiteSetting>(
  {
    key: { type: String, required: true, unique: true, default: SITE_SETTING_KEY },
    hotline: { type: String, trim: true, maxlength: 200 },
    supportHours: { type: String, trim: true, maxlength: 200 },
    email: { type: String, trim: true, maxlength: 200 },
    address: { type: String, trim: true, maxlength: 200 },
    socialLinks: { type: socialLinksSchema, _id: false },
  },
  { timestamps: true },
);

export const SiteSetting: Model<ISiteSetting> =
  models.SiteSetting || model<ISiteSetting>('SiteSetting', siteSettingSchema);
