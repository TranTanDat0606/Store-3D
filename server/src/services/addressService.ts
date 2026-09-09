import { Address, type IAddress } from '../models/Address';
import { AppError } from '../utils/AppError';

export interface CreateAddressInput {
  userId: string;
  label?: string;
  recipientName: string;
  phone: string;
  province: string;
  district?: string;
  ward: string;
  street: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  label?: string;
  recipientName?: string;
  phone?: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  isDefault?: boolean;
}

class AddressService {
  async listByUser(userId: string): Promise<IAddress[]> {
    return Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
  }

  async getById(addressId: string, userId: string): Promise<IAddress> {
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) throw new AppError('Không tìm thấy địa chỉ', 404);
    return address;
  }

  async create(data: CreateAddressInput): Promise<IAddress> {
    // If marking as default or first address, ensure only one default
    if (data.isDefault) {
      await Address.updateMany(
        { userId: data.userId },
        { $set: { isDefault: false } },
      );
    } else {
      // If this is the user's first address, make it default automatically
      const count = await Address.countDocuments({ userId: data.userId });
      if (count === 0) {
        data.isDefault = true;
      }
    }

    return Address.create(data);
  }

  async update(addressId: string, userId: string, data: UpdateAddressInput): Promise<IAddress> {
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) throw new AppError('Không tìm thấy địa chỉ', 404);

    Object.assign(address, data);
    await address.save();
    return address;
  }

  async delete(addressId: string, userId: string): Promise<void> {
    const address = await Address.findOneAndDelete({ _id: addressId, userId });
    if (!address) throw new AppError('Không tìm thấy địa chỉ', 404);

    // If deleted address was default, set the most recent one as default
    if (address.isDefault) {
      const lastAddress = await Address.findOne({ userId }).sort({ createdAt: -1 });
      if (lastAddress) {
        lastAddress.isDefault = true;
        await lastAddress.save();
      }
    }
  }

  async setDefault(addressId: string, userId: string): Promise<IAddress> {
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) throw new AppError('Không tìm thấy địa chỉ', 404);

    await Address.updateMany(
      { userId },
      { $set: { isDefault: false } },
    );

    address.isDefault = true;
    await address.save();
    return address;
  }

  async getDefault(userId: string): Promise<IAddress | null> {
    return Address.findOne({ userId, isDefault: true });
  }
}

export const addressService = new AddressService();
