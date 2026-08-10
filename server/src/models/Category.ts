import { Schema, model, models } from 'mongoose';
import slugify from '../utils/slugify';

export interface ICategory {
  name: string;
  slug: string;
  image: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục là bắt buộc'],
      trim: true,
      maxlength: [100, 'Tên danh mục tối đa 100 ký tự'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Hình ảnh danh mục là bắt buộc'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
);

categorySchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});

export const Category = models.Category || model<ICategory>('Category', categorySchema);
