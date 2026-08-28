import { connectDB, disconnectDB } from '../database/connect';
import { Product } from '../models';

const PRODUCT_IMAGES: Record<string, string[]> = {
  'Móc khóa mini': [
    'https://images.unsplash.com/photo-1727154085760-134cc942246e?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1727154085760-134cc942246e?w=600&h=600&fit=crop',
  ],
  'Nhà gỗ truyền thống': [
    'https://images.unsplash.com/photo-1772109013915-0a4bcb69ffa7?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1772109013915-0a4bcb69ffa7?w=600&h=600&fit=crop',
  ],
  'Bánh răng trang trí': [
    'https://images.unsplash.com/photo-1593062037896-764e9f52029e?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1593062037896-764e9f52029e?w=600&h=600&fit=crop',
  ],
  'Robot Gundam RX-78': [
    'https://images.unsplash.com/photo-1612400200701-847d015ba101?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1612400200701-847d015ba101?w=600&h=600&fit=crop',
  ],
  'Kiếm Ichigo - Bleach': [
    'https://images.unsplash.com/photo-1772535262208-45511a3dd90b?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1772535262208-45511a3dd90b?w=600&h=600&fit=crop',
  ],
  'Mũ giáp Viking': [
    'https://images.unsplash.com/photo-1525540796810-55f9fbc5592f?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1525540796810-55f9fbc5592f?w=600&h=600&fit=crop',
  ],
  'Tháp Eiffel mini': [
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=600&fit=crop',
  ],
  'Bộ bàn ghế mini': [
    'https://images.unsplash.com/photo-1767363592711-1cda1502284d?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1767363592711-1cda1502284d?w=600&h=600&fit=crop',
  ],
  'Chậu cây hình robot': [
    'https://images.unsplash.com/photo-1615826947154-97ff49484579?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1615826947154-97ff49484579?w=600&h=600&fit=crop',
  ],
  'Rồng lửa châu Âu': [
    'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&h=600&fit=crop',
  ],
  'Naruto Uzumaki - Sage Mode': [
    'https://images.unsplash.com/photo-1674448417295-088682b6adec?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1674448417295-088682b6adec?w=600&h=600&fit=crop',
  ],
  'One Piece Luffy - Gear 5': [
    'https://images.unsplash.com/photo-1571312733647-4d9e70084e56?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1571312733647-4d9e70084e56?w=600&h=600&fit=crop',
  ],
};

async function updateProductImages() {
  await connectDB();

  let updated = 0;
  for (const [name, images] of Object.entries(PRODUCT_IMAGES)) {
    const result = await Product.updateOne({ name }, { $set: { images } });
    if (result.modifiedCount > 0) {
      console.log(`[Update] ${name}: ${images.length} images`);
      updated++;
    } else {
      console.log(`[Skip] ${name}: already up to date`);
    }
  }

  console.log(`[Update] Done. ${updated} products updated.`);
  await disconnectDB();
}

updateProductImages().catch((err) => {
  console.error('[Update] Failed:', err);
  process.exit(1);
});
