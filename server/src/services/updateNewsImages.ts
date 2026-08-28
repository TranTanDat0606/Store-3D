import { connectDB, disconnectDB } from '../database/connect';
import { News } from '../models';

const NEWS_THUMBNAILS: Record<string, string> = {
  'in-3d-ung-dung-o-dau': 'https://images.unsplash.com/photo-1741848137437-56fb14b7ba87?w=800&h=450&fit=crop',
  'xu-huong-cong-nghe-in-3d-2026': 'https://images.unsplash.com/photo-1767498051855-f28d8c941b5a?w=800&h=450&fit=crop',
  'chuan-bi-may-in-3d-truoc-khi-in': 'https://images.unsplash.com/photo-1762579318096-8e9bc45b8feb?w=800&h=450&fit=crop',
  '5-loi-in-3d-pho-bien-va-cach-khac-phuc': 'https://images.unsplash.com/photo-1758387836566-6a342434f5b4?w=800&h=450&fit=crop',
  'pla-petg-abs-chon-loai-filament-nao': 'https://images.unsplash.com/photo-1742971239045-afabc9f7d744?w=800&h=450&fit=crop',
  'fdm-la-gi-huong-dan-nguoi-moi': 'https://images.unsplash.com/photo-1742971500442-8fb8610dfbf5?w=800&h=450&fit=crop',
};

async function updateNewsThumbnails() {
  await connectDB();

  let updated = 0;
  for (const [slug, thumbnail] of Object.entries(NEWS_THUMBNAILS)) {
    const result = await News.updateOne({ slug }, { $set: { thumbnail } });
    if (result.modifiedCount > 0) {
      console.log(`[Update] ${slug}`);
      updated++;
    }
  }

  console.log(`[Update] Done. ${updated} news articles updated.`);
  await disconnectDB();
}

updateNewsThumbnails().catch((err) => {
  console.error('[Update] Failed:', err);
  process.exit(1);
});
