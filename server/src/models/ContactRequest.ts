import { Schema, model, models, Types } from 'mongoose';

export enum ContactStatus {
  New = 'new',
  InProgress = 'in_progress',
  Resolved = 'resolved',
  Rejected = 'rejected',
}

export interface IContactRequest {
  userId?: Types.ObjectId;
  fullname: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: ContactStatus;
  adminNote?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const contactRequestSchema = new Schema<IContactRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fullname: {
      type: String,
      required: [true, 'Họ tên là bắt buộc'],
      trim: true,
      maxlength: [100, 'Họ tên tối đa 100 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      trim: true,
      lowercase: true,
      maxlength: [100, 'Email tối đa 100 ký tự'],
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      default: 'Liên hệ từ trang web',
      maxlength: [200, 'Chủ đề tối đa 200 ký tự'],
    },
    message: {
      type: String,
      required: [true, 'Nội dung là bắt buộc'],
      trim: true,
      maxlength: [2000, 'Nội dung tối đa 2000 ký tự'],
    },
    status: {
      type: String,
      enum: Object.values(ContactStatus),
      default: ContactStatus.New,
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

contactRequestSchema.index({ status: 1, createdAt: -1 });
contactRequestSchema.index({ email: 1 });
contactRequestSchema.index({ userId: 1 });

export const ContactRequest =
  models.ContactRequest || model<IContactRequest>('ContactRequest', contactRequestSchema);
