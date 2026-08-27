import { connectDB, disconnectDB } from '../database/connect';
import { News } from '../models';

const NEWS_THUMBNAILS: Record<string, string> = {
  'fdm-la-gi-huong-dan-nguoi-moi': 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&h=450&fit=crop',
  'pla-petg-abs-chon-loai-filament-nao': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=450&fit=crop',
  '5-loi-in-3d-pho-bien-va-cach-khac-phuc': 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=450&fit=crop',
  'chuan-bi-may-in-3d-truoc-khi-in': 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&h=450&fit=crop',
  'xu-huong-cong-nghe-in-3d-2026': 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&h=450&fit=crop',
  'in-3d-ung-dung-o-dau': 'https://images.unsplash.com/photo-1577083552792-a0d461cb1dd6?w=800&h=450&fit=crop',
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
