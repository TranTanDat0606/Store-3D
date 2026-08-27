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
  News,
  NewsStatus,
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
  } else if (admin.role !== UserRole.Admin) {
    await User.updateOne(
      { _id: admin._id },
      { $set: { role: UserRole.Admin } },
      { runValidators: true },
    );
    console.log('[Seed] Fixed admin role for admin@store3d.com');
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

  // --- News Articles ---
  const newsArticles = [
    {
      title: 'FDM là gì? Hướng dẫn cho người mới bắt đầu với công nghệ in 3D',
      slug: 'fdm-la-gi-huong-dan-nguoi-moi',
      excerpt: 'Tìm hiểu về công nghệ in 3D FDM phổ biến nhất hiện nay - nguyên lý hoạt động, vật liệu filament và những lỗi thường gặp khi mới bắt đầu.',
      content: `<h2>FDM là gì?</h2>
<p>Fused Deposition Modeling (FDM) là công nghệ in 3D phổ biến nhất hiện nay. FDM hoạt động bằng cách nung nóng vật liệu nhựa (filament) ở nhiệt độ cao, sau đó kéo nhựa qua nozzle (đầu phun) và lắng đọng từng lớp vật liệu lên bề mặt in để tạo thành sản phẩm hoàn chỉnh.</p>

<h2>Filament là gì?</h2>
<p>Filament là vật liệu dạng sợi được cuộn thành cuộn, có đường kính phổ biến 1.75mm hoặc 2.85mm. Filament được nung nóng trong hotend của máy in và chảy ra qua nozzle để tạo hình. Các loại filament phổ biến bao gồm PLA, PETG, ABS, TPU và nhiều loại vật liệu đặc biệt khác.</p>

<h2>So sánh PLA, PETG và ABS</h2>
<p><strong>PLA (Polylactic Acid):</strong> Là vật liệu thân thiện với môi trường, dễ in, mùi nhẹ khi in. Phù hợp cho người mới bắt đầu, mô hình trang trí, đồ chơi. Điểm yếu: dễ biến dạng ở nhiệt độ cao trên 60°C.</p>
<p><strong>PETG (Polyethylene Terephthalate Glycol):</strong> Kết hợp độ bền của ABS với tính dễ in của PLA. Chống va đập tốt, chống nước, chịu nhiệt nhẹ. Phù hợp cho phụ kiện thực tế, đồ gia dụng, vật dụng ngoài trời.</p>
<p><strong>ABS (Acrylonitrile Butadiene Styrene):</strong> Vật liệu công nghiệp có độ bền cao, chịu nhiệt tốt. Yêu cầu heated bed và môi trường kín. Phù hợp cho linh kiện cơ khí, phụ kiện ô tô, sản phẩm cần chịu nhiệt.</p>

<h2>Các lỗi cơ bản người mới thường gặp</h2>
<p><strong>Warping ( cong vênh):</strong> Sản phẩm bị cong lên ở các góc khi in. Nguyên nhân do sự co giãn không đồng đều của vật liệu. Giải pháp: sử dụng heated bed, keo dán hoặc brim/raft.</p>
<p><strong>Stringing (đứt sợi):</strong> Xuất hiện các sợi nhựa mảnh giữa các phần của mô hình. Điều chỉnh nhiệt độ nozzle và tốc độ di chuyển không tải (retraction).</p>
<p><strong>Layer shifting (dịch chuyển lớp):</strong> Các lớp bị lệch so với nhau. Kiểm tra belt, motor và đảm bảo bàn in chắc chắn.</p>

<h2>Lời khuyên cho người mới</h2>
<p>Bắt đầu với PLA, in chậm để có chất lượng tốt nhất. Đọc kỹ hướng dẫn sử dụng máy in và luôn chú ý đến nhiệt độ, tốc độ in cũng như các thông số cơ bản. Tham gia các cộng đồng 3D printing để học hỏi kinh nghiệm từ những người đi trước.</p>`,
      category: '3d-printing',
      author: 'Store3D',
      status: NewsStatus.Published,
      publishedAt: new Date('2026-08-20'),
    },
    {
      title: 'PLA, PETG và ABS: Nên chọn loại filament nào?',
      slug: 'pla-petg-abs-chon-loai-filament-nao',
      excerpt: 'So sánh chi tiết 3 loại filament phổ biến nhất về độ bền, nhiệt độ in, độ khó và ứng dụng phù hợp để bạn lựa chọn vật liệu phù hợp.',
      content: `<h2>Giới thiệu</h2>
<p>Việc lựa chọn filament phù hợp là quyết định quan trọng nhất khi bắt đầu in 3D. Mỗi loại vật liệu có ưu và nhược điểm riêng, phù hợp với các mục đích sử dụng khác nhau. Bài viết này giúp bạn hiểu rõ sự khác biệt giữa PLA, PETG và ABS.</p>

<h2>PLA - Lựa chọn phổ biến nhất</h2>
<p><strong>Độ bền:</strong> Trung bình. Dễ gãy khi chịu lực mạnh, không linh hoạt. Phù hợp cho mô hình tĩnh.</p>
<p><strong>Nhiệt độ in:</strong> Nozzle 190-220°C, Bed 50-60°C.</p>
<p><strong>Độ khó:</strong> Rất dễ in. Là vật liệu lý tưởng cho người mới bắt đầu.</p>
<p><strong>Ứng dụng:</strong> Mô hình trang trí, đồ chơi, phụ kiện thời trang, bản mẫu nhanh.</p>
<p><strong>Ưu điểm:</strong> Thân thiện môi trường, mùi nhẹ, màu sắc đa dạng, giá rẻ.</p>
<p><strong>Nhược điểm:</strong> Không chịu nhiệt tốt (biến dạng trên 60°C), không phù hợp cho sản phẩm ngoài trời.</p>

<h2>PETG - Cân bằng giữa dễ in và bền</h2>
<p><strong>Độ bền:</strong> Cao. Chống va đập tốt, linh hoạt, không giòn như PLA.</p>
<p><strong>Nhiệt độ in:</strong> Nozzle 220-250°C, Bed 70-80°C.</p>
<p><strong>Độ khó:</strong> Trung bình. Dễ hơn ABS nhưng khó hơn PLA một chút.</p>
<p><strong>Ứng dụng:</strong> Đồ gia dụng, phụ kiện thực tế, vật dụng ngoài trời, linh kiện cần độ bền.</p>
<p><strong>Ưu điểm:</strong> Chống nước, chống bụi, chịu nhiệt nhẹ,linh hoạt.</p>
<p><strong>Nhược điểm:</strong> Dính bụi bẩn, dễ tạo sợi khi in, cần tinh chỉnh retraction.</p>

<h2>ABS - Vật liệu công nghiệp</h2>
<p><strong>Độ bền:</strong> Rất cao. Chịu nhiệt tốt, chống hóa chất, bền bỉ.</p>
<p><strong>Nhiệt độ in:</strong> Nozzle 230-260°C, Bed 90-110°C.</p>
<p><strong>Độ khó:</strong> Khó. Cần heated bed, môi trường kín, thông gió tốt.</p>
<p><strong>Ứng dụng:</strong> Linh kiện cơ khí, phụ kiện ô tô, sản phẩm công nghiệp cần chịu nhiệt.</p>
<p><strong>Ưu điểm:</strong> Chịu nhiệt cao (trên 100°C), dễ gia công (cắt, khoan, mài).</p>
<p><strong>Nhược điểm:</strong> Mùi mạnh khi in, dễ cong vênh, yêu cầu máy in có vỏ kín.</p>

<h2>Bảng so sánh nhanh</h2>
<table>
<tr><th>Đặc tính</th><th>PLA</th><th>PETG</th><th>ABS</th></tr>
<tr><td>Độ bền</td><td>Trung bình</td><td>Cao</td><td>Rất cao</td></tr>
<tr><td>Chịu nhiệt</td><td>~60°C</td><td>~75°C</td><td>~100°C</td></tr>
<tr><td>Độ khó in</td><td>Dễ</td><td>Trung bình</td><td>Khó</td></tr>
<tr><td>Mùi khi in</td><td>Nhẹ</td><td>Trung bình</td><td>Mạnh</td></tr>
<tr><td>Giá</td><td>Rẻ</td><td>Trung bình</td><td>Trung bình</td></tr>
</table>

<h2>Kết luận</h2>
<p>Nếu bạn mới bắt đầu, hãy chọn PLA. Khi đã quen thuộc và muốn thử thách bản thân, PETG là bước tiếp theo lý tưởng. Chỉ nên chuyển sang ABS khi bạn thực sự cần vật liệu chịu nhiệt cao và đã có máy in phù hợp.</p>`,
      category: 'filament',
      author: 'Store3D',
      status: NewsStatus.Published,
      publishedAt: new Date('2026-08-22'),
    },
    {
      title: '5 lỗi in 3D phổ biến và cách khắc phục',
      slug: '5-loi-in-3d-pho-bien-va-cach-khac-phuc',
      excerpt: 'Tổng hợp 5 lỗi thường gặp nhất khi in 3D cùng nguyên nhân và giải pháp chi tiết giúp bạn in 3D hiệu quả hơn.',
      content: `<h2>1. Warping (Cong vênh)</h2>
<p><strong>Mô tả:</strong> Góc hoặc cạnh dưới của sản phẩm bị cong lên, không còn phẳng. Đây là lỗi phổ biến nhất khi in 3D.</p>
<p><strong>Nguyên nhân:</strong> Vật liệu co lại khi nguội quá nhanh, không bám chắc vào bàn in.</p>
<p><strong>Cách khắc phục:</strong></p>
<ul>
<li>Sử dụng heated bed ở nhiệt độ phù hợp (PLA: 50-60°C, PETG: 70-80°C, ABS: 90-110°C)</li>
<li>Sử dụng keo dán bàn in hoặc băng keo painter</li>
<li>Sử dụng brim hoặc raft để tăng diện tích tiếp xúc</li>
<li>Đảm bảo bàn in phẳng và được level đúng cách</li>
<li>Sử dụng vỏ kín (enclosure) cho ABS</li>
</ul>

<h2>2. Stringing (Đứt sợi)</h2>
<p><strong>Mô tả:</strong> Các sợi nhựa mảnh xuất hiện giữa các phần riêng biệt của mô hình.</p>
<p><strong>Nguyên nhân:</strong> Nhựa chảy ra khi nozzle di chuyển giữa các vị trí.</p>
<p><strong>Cách khắc phục:</strong></p>
<ul>
<li>Tăng retraction distance và speed trong slicer</li>
<li>Giảm nhiệt độ nozzle (giảm 5-10°C mỗi lần)</li>
<li>Tăng travel speed (tốc độ di chuyển không tải)</li>
<li>Bật chế độ wipe (lau nozzle) trong slicer</li>
</ul>

<h2>3. Poor First Layer (Lớp đầu kém)</h2>
<p><strong>Mô tả:</strong> Lớp đầu tiên không bám chắc vào bàn in, có khoảng trống hoặc bị kéo gerektiğini.</p>
<p><strong>Nguyên nhân:</strong> Bàn in không phẳng, nozzle quá xa hoặc quá gần bàn.</p>
<p><strong>Cách khắc phục:</strong></p>
<ul>
<li>Level bàn in lại bằng tay hoặc sử dụng auto bed leveling</li>
<li>Điều chỉnh Z-offset cho phù hợp</li>
<li>In chậm hơn ở lớp đầu tiên (15-20mm/s)</li>
<li>Vệ sinh bàn in trước khi in</li>
</ul>

<h2>4. Layer Shifting (Dịch chuyển lớp)</h2>
<p><strong>Mô tả:</strong> Các lớp bị lệch so với nhau, tạo ra sản phẩm bị biến dạng.</p>
<p><strong>Nguyên nhân:</strong> Belt (dây curoa) bị lỏng, motor bị skip, bàn in rung.</p>
<p><strong>Cách khắc phục:</strong></p>
<ul>
<li>Kiểm tra và thắt chặt belt X/Y</li>
<li>Giảm tốc độ in nếu mô hình quá cao hoặc mỏng</li>
<li>Đảm bảo bàn in và máy in chắc chắn, không rung</li>
<li>Kiểm tra motor và driver</li>
</ul>

<h2>5. Under-extrusion (Thiếu vật liệu)</h2>
<p><strong>Mô tả:</strong> Sản phẩm có khoảng trống, bề mặt thô, kém chi tiết.</p>
<p><strong>Nguyên nhân:</strong> Nozzle bị tắc, flow rate không đúng, filament kẹt.</p>
<p><strong>Cách khắc phục:</strong></p>
<ul>
<li>Vệ sinh hoặc thay nozzle</li>
<li>Tăng flow rate lên 5-10%</li>
<li>Kiểm tra đường đi của filament, đảm bảo không bị gấp khúc</li>
<li>Điều chỉnh temperatures phù hợp cho vật liệu đang dùng</li>
</ul>

<h2>Kết luận</h2>
<p>Hầu hết các lỗi in 3D đều có thể khắc phục được bằng cách điều chỉnh cài đặt và bảo trì máy in thường xuyên. Kiên nhẫn thử nghiệm và ghi lại các thông số tốt nhất cho từng loại vật liệu sẽ giúp bạn in 3D hiệu quả hơn theo thời gian.</p>`,
      category: 'tips',
      author: 'Store3D',
      status: NewsStatus.Published,
      publishedAt: new Date('2026-08-24'),
    },
    {
      title: 'Cách chuẩn bị máy in 3D trước khi bắt đầu một bản in',
      slug: 'chuan-bi-may-in-3d-truoc-khi-in',
      excerpt: 'Hướng dẫn các bước chuẩn bị cần thiết trước mỗi lần in 3D để đảm bảo chất lượng sản phẩm tốt nhất và tránh lãng phí vật liệu.',
      content: `<h2>Tại sao cần chuẩn bị kỹ trước khi in?</h2>
<p>Mỗi bản in 3D đều tốn thời gian và vật liệu. Việc chuẩn bị kỹ trước khi in giúp giảm thiểu lỗi, tiết kiệm filament và đảm bảo sản phẩm hoàn thành tốt. Dưới đây là các bước quan trọng bạn nên thực hiện trước mỗi bản in.</p>

<h2>1. Kiểm tra Nozzle</h2>
<p>Nozzle (đầu phun) là bộ phận quan trọng nhất tiếp xúc trực tiếp với vật liệu. Trước khi in:</p>
<ul>
<li>Vệ sinh nozzle bằng wire brush hoặc cold pull (phương pháp kéo lạnh)</li>
<li>Kiểm tra đường kính nozzle có bị mòn không (thay khi cần thiết)</li>
<li>Đảm bảo nhiệt độ nozzle hoạt động chính xác</li>
<li>Kiểm tra không có vật cản hoặc vật liệu thừa bám vào</li>
</ul>

<h2>2. Bed Leveling (Cân bằng bàn in)</h2>
<p>Bàn in phẳng là yếu tố quyết định chất lượng lớp đầu tiên:</p>
<ul>
<li>Sử dụng giấy A4 để kiểm tra khoảng cách giữa nozzle và bed</li>
<li>Kiểm tra cả 4 góc và giữa bàn in</li>
<li>Sử dụng auto bed leveling nếu máy hỗ trợ</li>
<li>Điều chỉnh Z-offset sau khi level</li>
</ul>

<h2>3. Kiểm tra First Layer</h2>
<p>In thử lớp đầu tiên để kiểm tra:</p>
<ul>
<li>Lớp đầu phải bám chắc vào bàn in</li>
<li>Không có khoảng trống giữa các đường in</li>
<li>Độ dày lớp đồng đều, không bị phồng hay mỏng</li>
<li>Điều chỉnh flow rate nếu cần thiết</li>
</ul>

<h2>4. Kiểm tra Filament</h2>
<p>Trước khi in, đảm bảo filament:</p>
<ul>
<li>Khô ráo (nếu ẩm, sấy ở 50-60°C trong 2-4 giờ)</li>
<li>Không bị gấp khúc hay rối</li>
<li>Đường kính đồng đều (kiểm tra bằng thước)</li>
<li>Đủ số lượng cho toàn bộ bản in</li>
</ul>

<h2>5. Cài đặt Slicer</h2>
<p>Kiểm tra các thông số quan trọng trong phần mềm slicer:</p>
<ul>
<li>Nhiệt độ nozzle và bed phù hợp với vật liệu</li>
<li>Tốc độ in (in chậm hơn ở lớp đầu)</li>
<li>Layer height (độ cao lớp) phù hợp</li>
<li>Infill (tỷ lệ lấp đầy) theo yêu cầu</li>
<li>Support (khung đỡ) nếu cần</li>
<li>Retraction settings (cài đặt kéo lui)</li>
</ul>

<h2>Checklist trước khi in</h2>
<table>
<tr><th>Bước</th><th>Kiểm tra</th><th>Thời gian</th></tr>
<tr><td>Nozzle</td><td>Vệ sinh, nhiệt độ</td><td>2-3 phút</td></tr>
<tr><td>Bed Level</td><td>Phẳng, Z-offset</td><td>3-5 phút</td></tr>
<tr><td>Filament</td><td>Khô, đủ số lượng</td><td>1 phút</td></tr>
<tr><td>Slicer</td><td>Cài đặt chính xác</td><td>2-5 phút</td></tr>
<tr><td>First Layer</td><td>In thử, kiểm tra</td><td>5-10 phút</td></tr>
</table>

<h2>Kết luận</h2>
<p>Việc chuẩn bị kỹ trước khi in có vẻ tốn thời gian nhưng thực tế lại giúp bạn tiết kiệm thời gian và vật liệu đáng kể. Một bản in thành công luôn bắt đầu từ sự chuẩn bị chu đáo.</p>`,
      category: 'tips',
      author: 'Store3D',
      status: NewsStatus.Published,
      publishedAt: new Date('2026-08-25'),
    },
    {
      title: 'Xu hướng công nghệ in 3D năm 2026',
      slug: 'xu-huong-cong-nghe-in-3d-2026',
      excerpt: 'Cập nhật những xu hướng công nghệ in 3D nổi bật trong năm 2026: in đa màu, AI hỗ trợ thiết kế, máy in tốc độ cao và vật liệu mới.',
      content: `<h2>Giới thiệu</h2>
<p>Năm 2026 đánh dấu nhiều bước tiến quan trọng trong ngành công nghiệp in 3D. Từ việc in đa màu trở nên phổ biến đến AI hỗ trợ tối ưu thiết kế, công nghệ in 3D đang phát triển nhanh hơn bao giờ hết. Hãy cùng điểm qua những xu hướng nổi bật nhất.</p>

<h2>1. In đa màu / đa vật liệu</h2>
<p>Công nghệ in đa màu đã trở nên dễ tiếp cận hơn bao giờ hết. Các hệ thống như AMS (Automatic Material System) của Bambu Lab cho phép thay đổi màu tự động trong quá trình in. Điều này mở ra khả năng tạo ra những mô hình phức tạp với nhiều màu sắc mà không cần phải in thủ công từng phần.</p>
<p>Xu hướng này đang lan rộng với nhiều hãng máy in tích hợp hệ thống thay đổi vật liệu tự động, giúp người dùng tạo ra sản phẩm đa chức năng từ nhiều loại vật liệu khác nhau trong một lần in.</p>

<h2>2. Tool-changing Printers</h2>
<p>Các máy in thay đổi công cụ (tool-changing printers) đang trở thành xu hướng cao cấp. Thay vì chỉ thay đổi filament, các máy này có thể thay đổi cả đầu phun và công cụ in, cho phép kết hợp nhiều loại vật liệu và kỹ thuật in khác nhau trong cùng một sản phẩm.</p>
<p>Điều này đặc biệt hữu ích cho sản xuất linh kiện phức tạp, nơi cần kết hợp vật liệu cứng và mềm, hoặc vật liệu dẫn điện và cách điện trong cùng một chi tiết.</p>

<h2>3. AI hỗ trợ thiết kế và in 3D</h2>
<p>Trí tuệ nhân tạo đang thay đổi cách chúng ta tiếp cận in 3D ở nhiều khía cạnh:</p>
<ul>
<li><strong>Tối ưu thiết kế:</strong> AI phân tích và tối ưu hóa cấu trúc mô hình để giảm vật liệu và thời gian in mà vẫn đảm bảo độ bền</li>
<li><strong>Tự động phát hiện lỗi:</strong> Camera AI theo dõi quá trình in và phát hiện lỗi real-time, dừng in khi có vấn đề</li>
<li><strong>Tối ưu cài đặt:</strong> AI gợi ý thông số in phù hợp dựa trên vật liệu và mô hình cụ thể</li>
<li><strong>Thiết kế generative:</strong> AI tạo ra các thiết kế dựa trên yêu cầu chức năng, tạo ra những hình dạng tối ưu mà con người khó có thể thiết kế thủ công</li>
</ul>

<h2>4. Máy in tốc độ cao</h2>
<p>Tốc độ in đã tăng đáng kể trong những năm gần đây. Các máy in như Bambu Lab X1 Carbon, Prusa MK4S và nhiều máy khác có thể in với tốc độ lên đến 500mm/s mà vẫn giữ được chất lượng tốt. Công nghệ input shaping và flow dynamics compensation giúp loại bỏ rung và đảm bảo chi tiết sắc nét ngay cả ở tốc độ cao.</p>

<h2>5. Vật liệu mới</h2>
<p>Nhiều vật liệu mới đang được phát triển và thương mại hóa:</p>
<ul>
<li><strong>PA-CF (Nylon dệt carbon):</strong> Kết hợp độ bền cơ học cao với trọng lượng nhẹ</li>
<li><strong>PEEK/ULTEM:</strong> Vật liệu chịu nhiệt cực cao cho ứng dụng hàng không và y tế</li>
<li><strong>Vật liệu sinh học:</strong> PLA nâng cấp với độ bền cao hơn, phân hủy sinh học</li>
<li><strong>Vật liệu dẫn điện:</strong> Cho phép in các linh kiện điện tử trực tiếp</li>
<li><strong>Vật liệu trong suốt:</strong> Cho phép in các chi tiết quang học</li>
</ul>

<h2>6. Ứng dụng công nghiệp mở rộng</h2>
<p>In 3D đang dần trở thành phương pháp sản xuất chính trong nhiều ngành công nghiệp:</p>
<ul>
<li>Hàng không: In linh kiện máy bay nhẹ hơn 60%</li>
<li>Y tế: In假体, dụng cụ phẫu thuật tùy chỉnh</li>
<li>Ô tô: In phụ kiện và linh kiệnprototype nhanh</li>
<li>Xây dựng: In các mô hình kiến trúc phức tạp</li>
</ul>

<h2>Kết luận</h2>
<p>Năm 2026 là năm đầy hứa hẹn cho ngành công nghiệp in 3D với nhiều công nghệ mới giúp việc in 3D trở nên dễ dàng, nhanh chóng và đa dạng hơn bao giờ hết. Việc cập nhật xu hướng sẽ giúp bạn tận dụng tối đa tiềm năng của công nghệ này.</p>`,
      category: '3d-printing',
      author: 'Store3D',
      status: NewsStatus.Published,
      publishedAt: new Date('2026-08-26'),
    },
    {
      title: 'In 3D đang được ứng dụng ở đâu?',
      slug: 'in-3d-ung-dung-o-dau',
      excerpt: 'Khám phá các lĩnh vực ứng dụng thực tế của công nghệ in 3D từ giáo dục, y tế đến sản xuất công nghiệp và làm mô hình.',
      content: `<h2>Giới thiệu</h2>
<p>Công nghệ in 3D không còn là điều gì đó xa xỉ hay chỉ dành cho những người đam mê công nghệ. Ngày nay, in 3D đang được ứng dụng rộng rãi trong nhiều lĩnh vực khác nhau, từ giáo dục đến sản xuất công nghiệp. Bài viết này giới thiệu các ứng dụng thực tế và tiềm năng to lớn của công nghệ này.</p>

<h2>1. Giáo dục</h2>
<p>In 3D đã trở thành công cụ giáo dục quan trọng trong nhiều trường học:</p>
<ul>
<li><strong>Mô hình học tập:</strong> Tạo mô hình giải phẫu, địa lý, hóa học để học sinh quan sát trực quan</li>
<li><strong>Khoa học máy tính:</strong> Hướng dẫn thiết kế CAD và quy trình sản xuất</li>
<li><strong>Nghệ thuật:</strong> Tạo tác phẩm điêu khắc và thiết kế sáng tạo</li>
<li><strong>Kỹ thuật:</strong> Thực hành thiết kế và chế tạo chi tiết cơ khí</li>
</ul>
<p>Nhiều trường đại học đã trang bị phòng lab in 3D để sinh viên thực hành, giúp rút ngắn khoảng cách giữa lý thuyết và thực tiễn.</p>

<h2>2. Prototype và phát triển sản phẩm</h2>
<p>Đây là ứng dụng phổ biến nhất của in 3D trong kinh doanh:</p>
<ul>
<li>Tạo mẫu nhanh trong vài giờ thay vì vài tuần</li>
<li>Kiểm tra thiết kế và chức năng trước khi sản xuất hàng loạt</li>
<li>Thu thập phản hồi từ khách hàng với sản phẩm thực tế</li>
<li>Thử nghiệm nhiều phiên bản thiết kế khác nhau</li>
</ul>
<p>Các công ty từ startup đến tập đoàn lớn đều sử dụng in 3D để rút ngắn quy trình phát triển sản phẩm.</p>

<h2>3. Mô hình và đồ chơi</h2>
<p>Đây là lĩnh vực phát triển mạnh nhất trong cộng đồng in 3D:</p>
<ul>
<li><strong>Mô hình nhân vật:</strong> Tạo mô hình nhân vật game, phim ảnh chi tiết</li>
<li><strong>Đồ chơi:</strong> Tạo đồ chơi tùy chỉnh, an toàn cho trẻ em</li>
<li><strong>Mô hình kiến trúc:</strong> Tạo mô hình tòa nhà, quy hoạch đô thị</li>
<li><strong>Bộ phận cơ khí:</strong> In phụ kiện thay thế cho đồ chơi, mô hình</li>
</ul>

<h2>4. Y tế</h2>
<p>In 3D đang thay đổi ngành y tế với nhiều ứng dụng đột phá:</p>
<ul>
<li><strong>假体 tùy chỉnh:</strong> Chế tạo假肢体, nẹp, dụng cụ chỉnh hình phù hợp với từng bệnh nhân</li>
<li><strong>Mô hình giải phẫu:</strong> Tạo mô hình 3D từ dữ liệu CT/MRI để bác sĩ lên kế hoạch phẫu thuật</li>
<li><strong>Dụng cụ phẫu thuật:</strong> In các dụng cụ chuyên dụng theo yêu cầu</li>
<li><strong>Nha khoa:</strong> Chế tạo mão răng, cầu răng, dụng cụ nha khoa chính xác</li>
</ul>
<p>Nhiều bệnh viện trên thế giới đã áp dụng in 3D vào quy trình điều trị, giúp tăng độ chính xác và giảm chi phí.</p>

<h2>5. Sản xuất công nghiệp</h2>
<p>In 3D đang dần trở thành phương pháp sản xuất thay thế hoặc bổ sung cho phương pháp truyền thống:</p>
<ul>
<li><strong>Linh kiện hàng không:</strong> In các bộ phận nhẹ hơn 60% so với phương pháp truyền thống</li>
<li><strong>Phụ kiện ô tô:</strong> In phụ tùng thay thế, bản mẫu</li>
<li><strong>Dây chuyền sản xuất:</strong> In dụng cụ, khuôn mẫu, jig và fixture</li>
<li><strong>Sản xuất nhỏ lẻ:</strong> In sản phẩm theo đơn đặt hàng</li>
</ul>

<h2>6. Maker và DIY</h2>
<p>Cộng đồng maker (người sáng tạo) là lực lượng thúc đẩy sự phát triển của in 3D:</p>
<ul>
<li><strong>Dự án DIY:</strong> In phụ kiện nhà cửa, dụng cụ, thiết bị gia đình</li>
<li><strong>Sửa chữa:</strong> In phụ tùng thay thế cho đồ gia dụng</li>
<li><strong>Nghệ thuật:</strong> Tạo tác phẩm nghệ thuật, trang trí nội thất</li>
<li><strong>Cộng đồng:</strong> Chia sẻ thiết kế trên Thingiverse, Printables, Thangs</li>
</ul>

<h2>Tiềm năng tương lai</h2>
<p>Với sự phát triển nhanh chóng của công nghệ và vật liệu, in 3D hứa hẹn sẽ còn được ứng dụng rộng rãi hơn nữa trong tương lai, trở thành một phần không thể thiếu trong cuộc sống hàng ngày.</p>`,
      category: 'general',
      author: 'Store3D',
      status: NewsStatus.Published,
      publishedAt: new Date('2026-08-26'),
    },
  ];

  let newsCreated = 0;
  for (const article of newsArticles) {
    const existing = await News.findOne({ slug: article.slug });
    if (!existing) {
      await News.create(article);
      newsCreated++;
      console.log(`[Seed] Created news: ${article.title}`);
    }
  }
  console.log(`[Seed] News: ${newsCreated} new articles created`);

  const finalStats = { ...stats, news: await News.countDocuments() };
  console.log('[Seed] Done. Stats:', finalStats);
  await disconnectDB();
}

const fresh = process.argv.includes('--fresh');

seedDatabase({ fresh }).catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
