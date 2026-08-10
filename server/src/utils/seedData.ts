export interface SeedCategory {
  name: string;
  description: string;
}

export interface SeedProduct {
  name: string;
  description: string;
  categoryName: string;
  material: 'PLA' | 'PETG' | 'ABS' | 'Resin';
  printerType: 'FDM' | 'Resin Printer';
  size: string;
  stock: number;
  originalPrice: number;
  salePrice: number;
  featured: boolean;
}

export const seedCategories: SeedCategory[] = [
  { name: 'Mô hình nhân vật', description: 'Figurine các nhân vật anime, game và phim hoạt hình.' },
  { name: 'Đồ trang trí', description: 'Vật trang trí bàn làm việc, kệ sách và không gian sống.' },
  { name: 'Mô hình kiến trúc', description: 'Tiểu cảnh kiến trúc, nhà cửa, cầu và di tích.' },
  { name: 'Đồ dùng hằng ngày', description: 'Sản phẩm tiện ích phục vụ sinh hoạt hằng ngày.' },
  { name: 'Phụ kiện & Cosplay', description: 'Phụ kiện cosplay, mũ giáp, đạo cụ in 3D.' },
  { name: 'Mô hình máy móc', description: 'Mô hình cơ khí, robot và các chi tiết máy hoạt động.' },
];

export const seedProducts: SeedProduct[] = [
  {
    name: 'One Piece Luffy - Gear 5',
    description: 'Mô hình nhân vật Luffy trạng thái Gear 5, chi tiết sắc nét, chất liệu nhựa resin cao cấp. Hoàn hảo cho bộ sưu tập của fan One Piece.',
    categoryName: 'Mô hình nhân vật',
    material: 'Resin',
    printerType: 'Resin Printer',
    size: '20 x 15 x 25 cm',
    stock: 12,
    originalPrice: 450000,
    salePrice: 350000,
    featured: true,
  },
  {
    name: 'Naruto Uzumaki - Sage Mode',
    description: 'Mô hình Naruto trạng thái Tiên Nhân, tư thế võ thuật đẹp mắt. In chi tiết với màu sắc trung thực.',
    categoryName: 'Mô hình nhân vật',
    material: 'Resin',
    printerType: 'Resin Printer',
    size: '18 x 12 x 22 cm',
    stock: 8,
    originalPrice: 420000,
    salePrice: 330000,
    featured: true,
  },
  {
    name: 'Rồng lửa châu Âu',
    description: 'Mô hình rồng lửa với cánh dang rộng, tỉ mỉ từng vảy. Sản phẩm tuyệt đẹp cho người yêu thích huyền thoại.',
    categoryName: 'Đồ trang trí',
    material: 'PLA',
    printerType: 'FDM',
    size: '25 x 30 x 15 cm',
    stock: 20,
    originalPrice: 600000,
    salePrice: 480000,
    featured: true,
  },
  {
    name: 'Chậu cây hình robot',
    description: 'Chậu cây mini hình robot dễ thương, có thể đặt trên bàn làm việc. Vừa trang trí vừa chứa cây nhỏ.',
    categoryName: 'Đồ dùng hằng ngày',
    material: 'PLA',
    printerType: 'FDM',
    size: '10 x 10 x 12 cm',
    stock: 35,
    originalPrice: 150000,
    salePrice: 120000,
    featured: false,
  },
  {
    name: 'Bộ bàn ghế mini',
    description: 'Bộ bàn ghế mini tỉ lệ 1:24, thích hợp làm tiểu cảnh hoặc mô hình diorama.',
    categoryName: 'Đồ dùng hằng ngày',
    material: 'PLA',
    printerType: 'FDM',
    size: '12 x 8 x 6 cm',
    stock: 50,
    originalPrice: 200000,
    salePrice: 160000,
    featured: false,
  },
  {
    name: 'Tháp Eiffel mini',
    description: 'Mô hình tháp Eiffel thu nhỏ, chi tiết sắt sảo. Món quà lưu niệm độc đáo.',
    categoryName: 'Mô hình kiến trúc',
    material: 'PLA',
    printerType: 'FDM',
    size: '15 x 15 x 40 cm',
    stock: 18,
    originalPrice: 350000,
    salePrice: 280000,
    featured: true,
  },
  {
    name: 'Mũ giáp Viking',
    description: 'Phụ kiện cosplay mũ giáp Viking, bền bỉ, phù hợp sân khấu và cosplay.',
    categoryName: 'Phụ kiện & Cosplay',
    material: 'PETG',
    printerType: 'FDM',
    size: '22 x 25 x 18 cm',
    stock: 10,
    originalPrice: 550000,
    salePrice: 440000,
    featured: false,
  },
  {
    name: 'Kiếm Ichigo - Bleach',
    description: 'Mô hình kiếm Ichigo (Zangetsu) dùng cho cosplay, chi tiết đẹp, cầm chắc tay.',
    categoryName: 'Phụ kiện & Cosplay',
    material: 'PETG',
    printerType: 'FDM',
    size: '110 x 12 x 6 cm',
    stock: 6,
    originalPrice: 700000,
    salePrice: 560000,
    featured: false,
  },
  {
    name: 'Robot Gundam RX-78',
    description: 'Mô hình robot Gundam RX-78-2, khớp động linh hoạt, chi tiết nổi bật.',
    categoryName: 'Mô hình máy móc',
    material: 'Resin',
    printerType: 'Resin Printer',
    size: '30 x 20 x 15 cm',
    stock: 5,
    originalPrice: 850000,
    salePrice: 680000,
    featured: true,
  },
  {
    name: 'Bánh răng trang trí',
    description: 'Bộ bánh răng cơ khí trang trí, có thể xoay được, đẹp mắt trên bàn làm việc.',
    categoryName: 'Mô hình máy móc',
    material: 'ABS',
    printerType: 'FDM',
    size: '12 x 12 x 4 cm',
    stock: 40,
    originalPrice: 180000,
    salePrice: 145000,
    featured: false,
  },
  {
    name: 'Nhà gỗ truyền thống',
    description: 'Mô hình nhà gỗ truyền thống Việt Nam, chi tiết mái ngói, cột trụ. Tuyệt vời cho diorama.',
    categoryName: 'Mô hình kiến trúc',
    material: 'PLA',
    printerType: 'FDM',
    size: '20 x 14 x 18 cm',
    stock: 15,
    originalPrice: 480000,
    salePrice: 390000,
    featured: false,
  },
  {
    name: 'Móc khóa mini',
    description: 'Bộ 5 móc khóa mini nhiều họa tiết dễ thương, món quà nhỏ ý nghĩa.',
    categoryName: 'Đồ dùng hằng ngày',
    material: 'PLA',
    printerType: 'FDM',
    size: '4 x 3 x 1 cm',
    stock: 100,
    originalPrice: 100000,
    salePrice: 79000,
    featured: false,
  },
];
