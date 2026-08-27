import { connectDB, disconnectDB } from '../database/connect';
import { Category } from '../models';

const CATEGORY_IMAGES: Record<string, string> = {
  'Mô hình nhân vật': 'https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=600&h=400&fit=crop',
  'Đồ trang trí': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop',
  'Mô hình kiến trúc': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=400&fit=crop',
  'Đồ dùng hằng ngày': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop',
  'Phụ kiện & Cosplay': 'https://images.unsplash.com/photo-1609873814058-a8928924184a?w=600&h=400&fit=crop',
  'Mô hình máy móc': 'https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7?w=600&h=400&fit=crop',
};

async function updateCategoryImages() {
  await connectDB();

  let updated = 0;
  for (const [name, image] of Object.entries(CATEGORY_IMAGES)) {
    const result = await Category.updateOne({ name }, { $set: { image } });
    if (result.modifiedCount > 0) {
      console.log(`[Update] Category ${name}: updated`);
      updated++;
    } else {
      console.log(`[Skip] Category ${name}: already up to date`);
    }
  }

  console.log(`[Update] Done. ${updated} categories updated.`);
  await disconnectDB();
}

updateCategoryImages().catch((err) => {
  console.error('[Update] Failed:', err);
  process.exit(1);
});
