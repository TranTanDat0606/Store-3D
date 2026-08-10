import { Types } from 'mongoose';
import { Wishlist, Product } from '../models';
import { AppError } from '../utils/AppError';

export class WishlistService {
  private async ensureWishlist(userId: string) {
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, products: [] });
    }
    return wishlist;
  }

  async get(userId: string) {
    const wishlist = await this.ensureWishlist(userId);
    await wishlist.populate('products');
    return wishlist;
  }

  async add(userId: string, productId: string) {
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

    const wishlist = await this.ensureWishlist(userId);
    const exists = wishlist.products.some((id: Types.ObjectId) => String(id) === productId);
    if (!exists) {
      wishlist.products.push(product._id);
      await wishlist.save();
    }
    await wishlist.populate('products');
    return wishlist;
  }

  async remove(userId: string, productId: string) {
    const wishlist = await this.ensureWishlist(userId);
    wishlist.products = wishlist.products.filter((id: Types.ObjectId) => String(id) !== productId);
    await wishlist.save();
    await wishlist.populate('products');
    return wishlist;
  }

  async moveToCart(userId: string, productId: string) {
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Không tìm thấy sản phẩm', 404);

    const wishlist = await this.ensureWishlist(userId);
    wishlist.products = wishlist.products.filter((id: Types.ObjectId) => String(id) !== productId);
    await wishlist.save();
    await wishlist.populate('products');

    return { product, wishlist };
  }
}

export const wishlistService = new WishlistService();
