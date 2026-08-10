import { connectDB, disconnectDB } from '../database/connect';
import {
  User,
  UserRole,
  Category,
  Product,
  Coupon,
  CouponType,
  Order,
  OrderItem,
  Wishlist,
  Review,
} from '../models';
import { seedCategories, seedProducts } from '../utils/seedData';
import { svgDataUri } from '../utils/imagePlaceholder';

interface SeedOptions {
  fresh?: boolean;
}

/**
 * Seeds the store3d database with sample data:
 * - 1 admin + 1 customer
 * - 6 categories
 * - 12 products (base64 images inside MongoDB)
 * - 2 coupons
 * - sample wishlist + reviews
 */
export async function seedDatabase(options: SeedOptions = {}) {
  await connectDB();

  if (options.fresh) {
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
      Order.deleteMany({}),
      OrderItem.deleteMany({}),
      Wishlist.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('[Seed] Cleared existing collections');
  }

  // --- Users ---
  const admin = await User.findOne({ email: 'admin@store3d.com' });
  const customer = await User.findOne({ email: 'khach@store3d.com' });

  if (!admin) {
    await User.create({
      fullname: 'Quản trị viên',
      email: 'admin@store3d.com',
      password: 'admin123',
      role: UserRole.Admin,
      phone: '0901234567',
      avatar: svgDataUri('Admin', 0, 200),
    });
    console.log('[Seed] Created admin admin@store3d.com / admin123');
  }

  if (!customer) {
    await User.create({
      fullname: 'Khách hàng demo',
      email: 'khach@store3d.com',
      password: 'khach123',
      role: UserRole.Customer,
      phone: '0912345678',
      avatar: svgDataUri('User', 4, 200),
      address: '123 Nguyễn Trãi, Thanh Xuân, Hà Nội',
    });
    console.log('[Seed] Created customer khach@store3d.com / khach123');
  }

  const adminUser = (await User.findOne({ email: 'admin@store3d.com' }))!;
  const customerUser = (await User.findOne({ email: 'khach@store3d.com' }))!;

  // --- Categories ---
  const categoryMap = new Map<string, string>();
  for (let i = 0; i < seedCategories.length; i++) {
    const c = seedCategories[i];
    let category = await Category.findOne({ name: c.name });
    if (!category) {
      category = await Category.create({
        name: c.name,
        image: svgDataUri(c.name, i + 1, 400),
        description: c.description,
      });
      console.log(`[Seed] Created category ${c.name}`);
    }
    categoryMap.set(c.name, category._id.toString());
  }

  // --- Products ---
  const createdProducts: string[] = [];
  for (let i = 0; i < seedProducts.length; i++) {
    const p = seedProducts[i];
    const existing = await Product.findOne({ name: p.name });
    if (existing) {
      createdProducts.push(existing._id.toString());
      continue;
    }
    const product = await Product.create({
      name: p.name,
      description: p.description,
      images: [svgDataUri(p.name, i, 600), svgDataUri(p.name, i + 1, 600)],
      category: categoryMap.get(p.categoryName),
      material: p.material,
      printerType: p.printerType,
      size: p.size,
      stock: p.stock,
      originalPrice: p.originalPrice,
      salePrice: p.salePrice,
      status: 'active',
      featured: p.featured,
    });
    createdProducts.push(product._id.toString());
    console.log(`[Seed] Created product ${p.name}`);
  }

  // --- Coupons ---
  const coupons = [
    { code: 'SALE10', discount: 10, type: CouponType.Percent, expiredDate: new Date('2026-12-31'), quantity: 100 },
    { code: 'GIAM50K', discount: 50000, type: CouponType.Fixed, expiredDate: new Date('2026-12-31'), quantity: 50 },
  ];
  for (const c of coupons) {
    const existing = await Coupon.findOne({ code: c.code });
    if (!existing) {
      await Coupon.create(c);
      console.log(`[Seed] Created coupon ${c.code}`);
    }
  }

  // --- Wishlist for customer ---
  const wishlist = await Wishlist.findOne({ user: customerUser._id });
  if (!wishlist && createdProducts.length > 0) {
    await Wishlist.create({
      user: customerUser._id,
      products: [createdProducts[0], createdProducts[2]],
    });
    console.log('[Seed] Created sample wishlist');
  }

  // --- Reviews for the first product ---
  const firstProduct = createdProducts[0];
  if (firstProduct) {
    const reviewCount = await Review.countDocuments({ product: firstProduct });
    if (reviewCount === 0) {
      await Review.create([
        {
          user: customerUser._id,
          product: firstProduct,
          rating: 5,
          comment: 'Sản phẩm đẹp tuyệt vời, chi tiết sắc nét, đóng gói kỹ lưỡng. Rất hài lòng!',
          images: [],
        },
        {
          user: adminUser._id,
          product: firstProduct,
          rating: 4,
          comment: 'Chất lượng tốt, màu sắc đẹp. Giao hàng nhanh.',
          images: [],
        },
      ]);

      // Recompute product rating/reviewCount to match the seeded reviews.
      const ratingResult = await Review.aggregate([
        { $match: { product: firstProduct } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      const ratingStats = ratingResult[0];
      await Product.updateOne(
        { _id: firstProduct },
        {
          rating: ratingStats ? Math.round(ratingStats.avg * 10) / 10 : 0,
          reviewCount: ratingStats?.count ?? 0,
        },
      );
      console.log('[Seed] Created sample reviews');
    }
  }

  const stats = {
    users: await User.countDocuments(),
    categories: await Category.countDocuments(),
    products: await Product.countDocuments(),
    coupons: await Coupon.countDocuments(),
    reviews: await Review.countDocuments(),
    wishlists: await Wishlist.countDocuments(),
  };

  console.log('[Seed] Done. Stats:', stats);
  await disconnectDB();
}

const fresh = process.argv.includes('--fresh');

seedDatabase({ fresh }).catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
