import { Schema, model, models } from 'mongoose';

export enum NewsStatus {
  Draft = 'draft',
  Published = 'published',
}

export interface INews {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  category: string;
  author: string;
  status: NewsStatus;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true,
      maxlength: [300, 'Tiêu đề tối đa 300 ký tự'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, 'Mô tả ngắn tối đa 500 ký tự'],
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Nội dung là bắt buộc'],
    },
    thumbnail: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'general',
    },
    author: {
      type: String,
      trim: true,
      default: 'Store3D',
    },
    status: {
      type: String,
      enum: Object.values(NewsStatus),
      default: NewsStatus.Draft,
    },
    publishedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

newsSchema.pre('validate', function (next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

newsSchema.index({ slug: 1 });
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ category: 1 });

export const News = models.News || model<INews>('News', newsSchema);
