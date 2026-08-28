import { connectDB, disconnectDB } from '../database/connect';
import { Category } from '../models';

const CATEGORY_IMAGES: Record<string, string> = {
  'Mô hình máy móc': 'https://images.unsplash.com/photo-1768909198566-21f1faf5de10?w=600&h=400&fit=crop',
  'Phụ kiện & Cosplay': 'https://images.unsplash.com/photo-1772535262208-45511a3dd90b?w=600&h=400&fit=crop',
  'Đồ dùng hằng ngày': 'https://images.unsplash.com/photo-1767363592711-1cda1502284d?w=600&h=400&fit=crop',
  'Mô hình kiến trúc': 'https://images.unsplash.com/photo-1739133887954-ac18f17d1d5a?w=600&h=400&fit=crop',
  'Đồ trang trí': 'https://images.unsplash.com/photo-1773578639782-2046b150ce28?w=600&h=400&fit=crop',
  'Mô hình nhân vật': 'https://images.unsplash.com/photo-1762089423685-60f5cef02cda?w=600&h=400&fit=crop',
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
