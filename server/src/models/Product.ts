import { Schema, model, models, type Model } from 'mongoose';
import type { Types } from 'mongoose';
import slugify from '../utils/slugify';

export enum ProductStatus {
  Active = 'active',
  Inactive = 'inactive',
  OutOfStock = 'out-of-stock',
}

export type ProductMaterial = 'PLA' | 'PETG' | 'ABS' | 'Resin';
export type PrinterType = 'FDM' | 'Resin Printer';

export interface IProduct {
  name: string;
  slug: string;
  description: string;
  images: string[];
  category: Types.ObjectId;
  material: ProductMaterial;
  printerType: PrinterType;
  size: string;
  stock: number;
  originalPrice: number;
  salePrice: number;
  rating: number;
  reviewCount: number;
  status: ProductStatus;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Tên sản phẩm là bắt buộc'],
      trim: true,
      maxlength: [200, 'Tên sản phẩm tối đa 200 ký tự'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: 'Sản phẩm cần ít nhất 1 hình ảnh',
      },
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Danh mục là bắt buộc'],
    },
    material: {
      type: String,
      enum: ['PLA', 'PETG', 'ABS', 'Resin'],
      required: [true, 'Chất liệu in là bắt buộc'],
    },
    printerType: {
      type: String,
      enum: ['FDM', 'Resin Printer'],
      required: [true, 'Loại máy in là bắt buộc'],
    },
    size: {
      type: String,
      trim: true,
      default: '',
    },
    stock: {
      type: Number,
      required: [true, 'Số lượng tồn kho là bắt buộc'],
      min: [0, 'Tồn kho không được âm'],
      default: 0,
    },
    originalPrice: {
      type: Number,
      required: [true, 'Giá gốc là bắt buộc'],
      min: [0, 'Giá không được âm'],
    },
    salePrice: {
      type: Number,
      required: [true, 'Giá bán là bắt buộc'],
      min: [0, 'Giá không được âm'],
    },
    rating: {
      type: Number,
      min: [0, 'Đánh giá tối thiểu 0'],
      max: [5, 'Đánh giá tối đa 5'],
      default: 0,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.Active,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

productSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });

export const Product: Model<IProduct> = models.Product || model<IProduct>('Product', productSchema);
