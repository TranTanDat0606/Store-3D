# Canonical Store3D Project Context
**Tài liệu tham chiếu chuẩn và duy nhất cho AI Coding Agent**  
*Cập nhật lần cuối: 28/08/2026* [100] • *Trạng thái: Hoàn tất phê duyệt & triển khai* [100, 123]

---

## 1. Tổng quan Dự án & Mục tiêu [127]
*   **Định nghĩa:** Store3D là một nền tảng thương mại điện tử (e-commerce) full-stack phục vụ việc kinh doanh các mô hình in 3D (figurines, đồ trang trí, mô hình kiến trúc, phụ kiện) [59, 127].
*   **Triết lý:** Tập trung tối đa vào hiệu năng hiển thị và trải nghiệm thị giác. Mang lại trải nghiệm **"phòng trưng bày kỹ thuật số" (digital showroom)** cao cấp, mang tính tương lai (futuristic/cyber-premium) nhưng tối giản, mượt mà [16, 64, 105].
*   **Quyết định cốt lõi:** **Dự án hoàn toàn KHÔNG sử dụng trình dựng hình 3D (Three.js, React Three Fiber, <model-viewer>)** [16, 121]. Store3D là một cửa hàng thương mại điện tử dựa trên thư viện hình ảnh 2D chất lượng cao [16, 121].

---

## 2. Xác nhận Trạng thái Product Detail Redesign (APPROVED & IMPLEMENTED) [123]
*   **Trạng thái:** Đã được phê duyệt và triển khai toàn bộ trên thực tế [123].
*   **Commit triển khai:** `bf2c7ab` [123].
*   **Cơ chế usePurchasePanel Hook:** Hook quản lý trạng thái mua hàng `usePurchasePanel` được **gọi duy nhất một lần** tại trang cha `ProductDetailPage` [122]. Toàn bộ dữ liệu trạng thái (state) và các trình xử lý (handlers) được truyền xuống hai component con là `PurchasePanel` (bản desktop) và `MobilePurchaseBar` (bản mobile) thông qua props [122]. Hai component con trình bày này **tuyet doi khong tu goi hook** để tránh phân mảnh hoặc trùng lặp trạng thái [122].
*   **Loại bỏ "Tạm tính":** Trang chi tiết sản phẩm **hoàn toàn không hiển thị tổng tiền "Tạm tính" (subtotal)** dựa trên số lượng [122]. Nút chỉnh số lượng vẫn hoạt động bình thường nhưng không hiển thị dòng tính subtotal [122].
*   **Responsive Layout:** Tránh sử dụng JS breakpoint để render có điều kiện, Responsive Product Detail sử dụng thuộc tính **CSS visibility / Tailwind display classes** để ẩn/hiện đồng thời `PurchasePanel` và `MobilePurchaseBar` theo từng kích thước màn hình [34, 35].
*   **10 Component Mới Đã Triển Khai:** Hệ thống đã tách biệt mã nguồn của `product-detail-page.tsx` thành **10 component độc lập** mới để tối ưu bảo trì [40, 123]:
    1.  `ProductGallery` (Desktop gallery, thumbnails + hero) [40]
    2.  `ProductGalleryMobile` (Mobile carousel với dot indicators) [40]
    3.  `ProductLightbox` (Full-screen lightbox hỗ trợ 2x zoom) [22, 40]
    4.  `PurchasePanel` (Sticky panel mua hàng cho desktop) [40]
    5.  `MobilePurchaseBar` (Bottom bar cố định cho mobile) [40]
    6.  `usePurchasePanel` (Shared custom hook chứa business logic mua hàng) [40]
    7.  `ProductTabs` (Tab điều khiển: Mô tả / Thông số / Đánh giá) [40]
    8.  `RatingSummary` (Bảng thống kê sao đánh giá + CTA viết đánh giá) [29, 40]
    9.  `ReviewCard` (Component kết xuất từng bài đánh giá chi tiết) [30, 40]
    10. `StarRating` (Common component xử lý hiển thị sao tái sử dụng) [41]

---

## 3. Phân loại Trạng thái Tính năng và Thành phần Hệ thống

### A. Đã Triển Khai & Đang Sử Dụng (Implemented & Active) [100, 111, 119]
1.  **Duyệt & Tìm kiếm Sản phẩm:** List, search không phân biệt hoa/thường, bộ lọc theo danh mục, sắp xếp, phân trang [100, 111].
2.  **Đề xuất tìm kiếm ngang (Horizontal Suggestions):** Nhận diện từ 1 ký tự đầu tiên gõ trên Navbar, tự động gợi ý danh sách card ngang chứa ảnh thu nhỏ và giá thực tế [12, 13, 100].
3.  **Chi tiết Sản phẩm Redesign:** (Như chi tiết tại Mục 2) [123].
4.  **Giỏ hàng Drawer:** Mở nhanh từ bên phải bằng hiệu ứng kính mờ (glassmorphism) và chuyển động mượt mà, lưu trữ bền vững tại LocalStorage [100, 111, 150].
5.  **Luồng Thanh Toán:** Nhập thông tin giao hàng, áp dụng coupon, chọn COD hoặc chuyển khoản ngân hàng [100, 111].
6.  **Cổng Thanh Toán VietQR:** Tự động tạo mã QR từ dữ liệu đơn hàng (ST3D-XXXXXX), hiển thị thông tin ngân hàng thụ hưởng cấu hình qua `.env`, có countdown 5 phút, tự động polling kiểm tra trạng thái mỗi 3 giây không cần tải lại trang [50, 53, 56, 100].
7.  **Đồng bộ Wishlist:** Cho phép lưu trữ và đồng bộ hóa danh mục yêu thích trực tiếp trên máy chủ MongoDB [92, 100].
8.  **Hệ Thống Đánh Giá Gated:** Chỉ cho phép người mua đã hoàn tất đơn hàng (`status === 'completed'`) viết đánh giá kèm tải ảnh [30, 100, 116].
9.  **Hệ Thống Quản Trị (Admin Panel - Scoped Dark Mode):** [83, 117]
    *   Dashboard thống kê kinh doanh, vẽ biểu đồ AreaChart doanh thu và PieChart trạng thái đơn hàng (Recharts) [84, 86].
    *   CRUD Sản phẩm (tích hợp Cloudinary upload, stock, featured toggle) [100, 117].
    *   CRUD Danh mục dạng bảng thống kê (sử dụng MongoDB Aggregation đếm số lượng sản phẩm liên kết và chặn xóa danh mục chứa sản phẩm) [1, 2, 5].
    *   CRUD Mã giảm giá (Coupon), quản lý đơn hàng một chiều, duyệt/xóa đánh giá [100, 117].
    *   Quản trị tài khoản người dùng (role update, kích hoạt/vô hiệu hóa, chặn tuyệt đối xóa Admin cuối cùng của hệ thống) [100, 107].
10. **Tin tức / Blog & Liên hệ:** Hệ thống CRUD tin tức và form tiếp nhận liên hệ [100].
11. **Giao diện Sáng/Tối (Light/Dark Theme):** Tích hợp nút chuyển đổi nhanh lưu cấu hình trong LocalStorage, chuyển màu mượt mà [100].
12. **Tải ảnh đám mây:** Tích hợp trực tiếp Cloudinary (giới hạn tệp 5MB) cho hình ảnh sản phẩm [100, 118].

### B. Đã Loại Bỏ / Khuyên Dùng Ngừng (Deprecated / Removed)
1.  **Trình dựng 3D (Three.js / React Three Fiber / <model-viewer>):** Tuyệt đối không tích hợp hay cài đặt do thỏa thuận tối ưu hiệu năng [16, 121].
2.  **Lưu trữ hình ảnh local qua Multer (`/uploads`):** Đã loại bỏ luồng lưu tệp trực tiếp trên đĩa cứng máy chủ. Toàn bộ hình ảnh sản phẩm mới tải lên được lưu trực tiếp trên đám mây Cloudinary [100, 118, 122]. *(Lưu ý: Các ảnh seed cũ hoặc ảnh placeholder base64 vẫn được giữ để đảm bảo tính tương thích nhờ hàm resolveImageUrl)* [46, 118].
3.  **Giao diện mosaic lưới bất đối xứng (`categories-section.tsx`):** Đã loại bỏ hoàn toàn do rối mắt [48, 122]. Thay thế bằng cách khôi phục bố cục trang chủ nguyên bản: Card đầu tiên là banner màu dốc (gradient) rộng chiếm 2-3 cột, các card danh mục tiếp theo là card ảnh vuông bo góc gọn gàng [51].
4.  **Các hiệu ứng chuyển động trang trí rườm rà:** Loại bỏ hiệu ứng cuộn trang fade-in so le diện rộng, hiệu ứng chuyển động vẽ rộng biểu đồ đánh giá, thanh tiến trình cuộn trang, và phóng to ảnh `scale-105` khi hover để giữ giao diện chuyên nghiệp [37].
5.  **Hiển thị "Tạm tính" tại Product Detail:** Đã loại bỏ để tinh giản UI [122].

### C. Được Lên Kế Hoạch Nhưng Chưa Triển Khai (Planned / Backlog) [120]
1.  **Gửi email thông báo tự động (SMTP / Email Sending):** Khung cấu hình SMTP đã tồn tại trong `.env` nhưng **chưa có mã nguồn xử lý gửi mail thực tế**. Biểu mẫu liên hệ mới gửi mới chỉ lưu vào MongoDB chứ chưa bắn email [101, 103, 120].
2.  **Webhook Thanh Toán Thực Tế:** Đường dẫn `/api/payment/webhook` đã sẵn sàng nhưng hiện đang hoạt động dựa trên cơ chế giả lập DEV-only (`/webhook/simulate`) do chưa đăng ký và đối soát chữ ký số thực tế với bên thứ ba [101, 103, 120].
3.  **Tự động cập nhật Sitemap & Robots.txt:** Hiện tại `sitemap.xml` và `robots.txt` vẫn đang là các tệp tĩnh nằm trong thư mục `client/public`, chưa tự động cập nhật động theo các sản phẩm/bài viết mới trong DB [103, 120].
4.  **Tự động nén / Chuyển đổi định dạng ảnh:** Chưa có logic xử lý nén tự động hoặc xuất ảnh WebP khi upload lên Cloudinary [103, 120].

---

## 4. Quyết Định Kiến Trúc Trọng Yếu [90, 131]
*   **Cấu trúc Monorepo:** Tách biệt rạch ròi giữa ứng dụng khách `client/` (React SPA) và máy chủ dịch vụ `server/` [59].
*   **Cookie-Based Auth:** Mã token JWT được lưu trữ kín trong httpOnly cookie (`token`), bật cờ `secure` trên môi trường sản xuất và thuộc tính `sameSite: lax` để phòng chống triệt để lỗ hổng XSS [92, 97, 98]. Axios gửi yêu cầu bắt buộc đính kèm cấu hình `{ withCredentials: true }` [92, 93].
*   **Xác thực ranh giới (Boundary Validation):** Mọi dữ liệu đầu vào (cả Client-side Form và Server-side Router Middleware) đều được kiểm duyệt cấu trúc nghiêm ngặt thông qua thư viện **Zod Schemas** trước khi đẩy vào Controller [63, 110, 131].
*   **Phản hồi Chuẩn Hóa:** Toàn bộ API phản hồi về một cấu trúc Envelope duy nhất [60, 94, 110]:
    `{ success: boolean, message: string, data: {}, pagination: {}, errors: [] }`
*   **Atomic Stock Decrement:** Luồng tạo đơn hàng thực hiện giảm tồn kho nguyên tử (atomic decrement) của Mongoose, có cơ chế tự động khôi phục dữ liệu (rollback) lập tức nếu xảy ra lỗi giữa chừng [131].
*   **Quy trình trạng thái một chiều (One-Way Status Workflow):** Trạng thái đơn hàng chỉ được phép đi tiến lên (`pending → confirmed → shipping → completed`) [117, 131]. Hủy đơn hàng chỉ được chấp nhận ở giai đoạn sơ khởi [117, 131].
*   **Polling thay vì WebSocket:** Quyết định sử dụng Polling HTTP ngắn (mỗi 3 giây) khi trang thanh toán VietQR mở để tiết kiệm tài nguyên máy chủ và dễ dàng bảo trì hệ thống [50, 122].

---

## 5. Quy Tắc Thiết Kế UI/UX [64, 112]
*   **Font chữ tiêu chuẩn:** Phông chữ duy nhất được sử dụng là **Be Vietnam Pro** [66].
*   **Bo góc (Radius):** Quy chuẩn bo góc chung là **10px** (`0.625rem`) [67], riêng các thẻ card sản phẩm sử dụng bo góc **rounded-2xl** [67].
*   **Palette màu chủ đạo (Ocean Blue):** Giá trị biến `--primary` và `--ring` được cố định về tông màu xanh đại dương (khoảng `250 deg` trong index.css) làm màu chính cho tất cả các nút hành động, mức giá hiển thị và vòng sáng [112, 122].
*   **Bảng màu Tối (Dark mode):** Kích hoạt bằng cách thêm class `.dark` vào thẻ root, lưu trữ trong LocalStorage [92, 100]. Riêng **hệ thống Admin được ép cứng giao diện tối (Dark mode Only)** thông qua thẻ bọc AdminLayout [83, 85].
*   **Hiển thị hình ảnh an toàn:** Tất cả các hình ảnh kết xuất từ cơ sở dữ liệu bắt buộc phải đi qua hàm tiện ích `resolveImageUrl(img)` để tự động xử lý các trường hợp: (1) Giữ nguyên chuỗi Base64 placeholder hoặc đường dẫn đầy đủ Unsplash/Cloudinary, (2) Ghép nối VITE_API_URL đối với các ảnh tĩnh local dạng `/uploads/...` cũ [46, 118].
*   **Ngôn ngữ UI:** Toàn bộ văn bản hiển thị cho khách hàng và quản trị viên bắt buộc phải sử dụng **Tiếng Việt** [59, 130]. Các đường dẫn tĩnh cũng phải là tiếng Việt không dấu chuẩn SEO (`/san-pham`, `/thanh-toan-qr`, `/tai-khoan`) [130].

---

## 6. Hạn Chế Hiện Tại & Nợ Kỹ Thuật [102, 120]
*   **Khoản nợ Kiểm thử (Testing Debt):** Phía client không có bất kỳ file test nào (0%); máy chủ backend chỉ có duy nhất 3 kiểm thử đơn vị cơ bản [102, 120].
*   **Thông tin đăng nhập demo:** Tài khoản dùng thử của Admin (`admin@store3d.com / admin123`) hiện đang bị viết công khai trong tệp `client/README.md` [102, 120].
*   **Cấu hình CORS:** CORS đang để mở tự do (`*`) khi chạy ở chế độ phát triển (`NODE_ENV !== 'production'`) [102].
*   **Thiếu Log & Tài liệu:** Dự án chưa tích hợp thư viện ghi nhật ký yêu cầu (như morgan), không có tài liệu hướng dẫn API Swagger/OpenAPI [102].
*   **Chế độ TypeScript:** Phía máy chủ server chưa bật cấu hình kiểm tra nghiêm ngặt `strict` trong tệp `tsconfig.json` [102, 120].

---

## 7. Sơ đồ Luồng Dữ liệu & Kiến trúc cho AI Coding Agent [110, 124, 125]

```
                                  CLIENT BROWSER (React SPA)
                ┌────────────────────────────────────────────────────────────┐
                │ - Storefront (Home, Details, Cart, Checkout, QR Page)      │
                │ - Scoped Dark Admin Dashboard (KPI Cards, Recharts, CRUD)  │
                └──────────────┬──────────────────────────────▲──────────────┘
                               │                              │
                               │ HTTPS Axios                  │ HTTP Only Cookie
                               │ (withCredentials: true) [92] │ (token: JWT) [97]
                               ▼                              │
         ┌────────────────────────────────────────────────────┴──────────────┐
         │                          EXPRESS SERVER                           │
         │                                                                   │
         │  [Route Layer]                                                    │
         │     ├── /api/auth/*, /api/products/*, /api/categories/*           │
         │     └── /api/orders/*, /api/wishlist/*, /api/payment/* [96]       │
         │                                                                   │
         │  [Middleware Layer]                                               │
         │     ├── Zod Schema Boundary Validation [94]                       │
         │     ├── requireAuth (JWT cookie parsing) [97]                     │
         │     └── Centralized Error Handler (AppError) [94]                 │
         │                                                                   │
         │  [Controllers & Services]                                         │
         │     ├── Atomic Stock Management (with rollback) [131]             │
         │     ├── VietQR Code Generator Service (qrcode) [53]               │
         │     └── Cloudinary Upload Service [118]                           │
         └─────────────────────────────┬─────────────────────────────────────┘
                                       │ Mongoose Schema
                                       ▼ (ODM Mongoose 8.5) [95, 108]
                        ┌──────────────────────────────┐
                        │          MONGODB DB          │
                        │                              │
                        │ - Users (Bcrypt) [98]        │
                        │ - Products (Cloudinary URLs) │
                        │ - Orders & Coupons [95]      │
                        └──────────────────────────────┘
```

---

## 8. Chỉ thị Vàng khi Phát triển Code (Gold Instructions) [126]
1.  **Không tự ý cài đặt** Three.js, React Three Fiber, hay bất kỳ thư viện 3D nào vào dự án [16, 121, 126].
2.  **Luôn bọc** mọi hình ảnh hiển thị bằng hàm tiện ích `resolveImageUrl(img)` để tránh lỗi hiển thị chéo hệ thống giữa ảnh local, base64, và Cloudinary [46, 126].
3.  **Không chỉnh sửa** hoặc làm thay đổi logic hoạt động của các file quản lý trạng thái nền tảng (`AuthContext`, `CartContext`, `WishlistContext`, `ThemeContext`) [17, 126].
4.  **Tuyệt đối không** cho phép Client tự ý gửi trạng thái thay đổi thanh toán đơn hàng. Mọi thay đổi trạng thái tài chính của đơn hàng bắt buộc phải do API backend điều phối và đối soát thông qua webhook [49, 126].
5.  **Mọi nhãn hiển thị UI** và phản hồi thông báo lỗi giao tiếp trực tiếp với người dùng phải viết bằng **Tiếng Việt** [59, 130].
