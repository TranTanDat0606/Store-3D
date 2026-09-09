import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface IAddress {
  userId: Types.ObjectId;
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  district?: string;
  ward: string;
  street: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      trim: true,
      maxlength: 50,
      default: '',
    },
    recipientName: {
      type: String,
      required: [true, 'Tên người nhận là bắt buộc'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, 'Số điện thoại là bắt buộc'],
      trim: true,
      match: [/^[0-9+\-\s]{8,15}$/, 'Số điện thoại không hợp lệ'],
    },
    province: {
      type: String,
      required: [true, 'Tỉnh/Thành phố là bắt buộc'],
      trim: true,
    },
    district: {
      type: String,
      trim: true,
      default: '',
    },
    ward: {
      type: String,
      required: [true, 'Phường/Xã là bắt buộc'],
      trim: true,
    },
    street: {
      type: String,
      required: [true, 'Địa chỉ đường là bắt buộc'],
      trim: true,
      maxlength: 500,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// When setting a new default, unset all other defaults for this user
addressSchema.pre('save', async function (next) {
  if (this.isModified('isDefault') && this.isDefault) {
    const Address = this.constructor as Model<IAddress>;
    await Address.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } },
    );
  }
  next();
});

addressSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as Partial<IAddress>;
  if (update.isDefault === true) {
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
      const Address = this.model as Model<IAddress>;
      await Address.updateMany(
        { userId: doc.userId, _id: { $ne: doc._id } },
        { $set: { isDefault: false } },
      );
    }
  }
  next();
});

export const Address: Model<IAddress> = models.Address || model<IAddress>('Address', addressSchema);
