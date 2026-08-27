import { connectDB, disconnectDB } from '../database/connect';
import { Product } from '../models';

const PRODUCT_IMAGES: Record<string, string[]> = {
  'One Piece Luffy - Gear 5': [
    'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&h=600&fit=crop',
  ],
  'Naruto Uzumaki - Sage Mode': [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=600&h=600&fit=crop',
  ],
  'Rồng lửa châu Âu': [
    'https://images.unsplash.com/photo-1577083552792-a0d461cb1dd6?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=600&h=600&fit=crop',
  ],
  'Chậu cây hình robot': [
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=600&fit=crop',
  ],
  'Bộ bàn ghế mini': [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&h=600&fit=crop',
  ],
  'Tháp Eiffel mini': [
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=600&h=600&fit=crop',
  ],
  'Mũ giáp Viking': [
    'https://images.unsplash.com/photo-1609873814058-a8928924184a?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=600&h=600&fit=crop',
  ],
  'Kiếm Ichigo - Bleach': [
    'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1584465144078-cb1235f0bbdd?w=600&h=600&fit=crop',
  ],
  'Robot Gundam RX-78': [
    'https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=600&h=600&fit=crop',
  ],
  'Bánh răng trang trí': [
    'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&h=600&fit=crop',
  ],
  'Nhà gỗ truyền thống': [
    'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1524055988636-436cfa46e59e?w=600&h=600&fit=crop',
  ],
  'Móc khóa mini': [
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=600&fit=crop',
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
