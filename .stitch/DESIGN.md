# Store 3D — Design System v2 "Obsidian Gold" (cho Stitch)

## 1. Brand & Context

- **Tên:** Store 3D — cửa hàng thương mại điện tử bán **mô hình in 3D** (figurine, mô hình kiến trúc, đồ trang trí, phụ kiện, quà tặng) — thị trường Việt Nam.
- **Ngôn ngữ UI:** Tiếng Việt. Giữ nguyên mọi chuỗi tiếng Việt trong mọi màn hình.
- **Phong cách:** *Premium Dark Futuristic Collectibles* — "tủ trưng bày obsidian": nền đen huyền bí, vàng kim (gold) cho giá trị/cao cấp/hành động chính, xanh dương cho nét công nghệ/thông tin, trắng cho nội dung, xám slate cho thứ cấp. Sang trọng + chính xác, **không** neon chói, **không** glassmorphism dày.
- **Dark mode duy nhất.** Không light mode, không theme toggle (kể cả Admin).
- **Logo:** wordmark "STORE 3D" + monogram hình học 3D (khối isometric cách điệu), tông vàng kim trên nền đen; biến thể: logo đầy đủ, icon app, favicon, phiên bản Admin (đơn sắc trắng). (Chi tiết ở màn LOGO-SYSTEM.)

## 2. Design Tokens

### Colors (dark only)
- background (trang): `#07090F`
- surface/card: `#0E1219` · surface cao hơn (popover, drawer): `#151A24`
- border: `#1E2532` (hoặc white 8%)
- foreground: `#FFFFFF` · muted-foreground: `#94A3B8` · subtle: `#64748B`
- **primary / gold:** `#EDB84C` — nút chính, giá bán, badge giảm giá, active nav, glow. Ngữ nghĩa:premium/money. Text trên gold dùng `#07090F`.
- **secondary / blue:** `#3E8BFF` — link, chip công nghệ (material/printer), trạng thái info, biểu đồ.
- semantic: success `#34D399` · warning `#FBBF24` · destructive `#F43F5E`
- star rating: amber `#FBBF24`
- order status: pending `#FBBF24` · confirmed `#3E8BFF` · shipping `#A78BFA` · completed `#34D399` · cancelled `#F43F5E`; payment: unpaid `#94A3B8` · paid `#34D399`
- charts: `#EDB84C`, `#3E8BFF`, `#2DD4BF`, `#FB7185`, `#A78BFA`

### Typography
- Body/UI: **Be Vietnam Pro** (400–800, dấu tiếng Việt đầy đủ) — mặc định mọi nơi.
- Display/accents (chỉ Latin/số, KHÔNG dùng cho từ tiếng Việt có dấu): **Orbitron** 700/900 — wordmark "STORE 3D", chữ số thống kê, badge "3D".
- Scale: display 4xl–6xl extrabold · heading 2xl–3xl bold · body sm/base · caption xs.

### Shape & Radius
- Radius chuẩn **10px**; card sản phẩm `rounded-2xl` (16px); icon box `rounded-xl`; badge/nút nhỏ bo tròn.
- Viền 1px sáng nhẹ thay vì bóng đậm; CTA gold có glow `gold/25` vừa phải.

### Motion
- Chỉ animation có mục đích (entrance fade, hover feedback, state change). Tôn trọng `prefers-reduced-motion`.
- Hero AO BING: **dải video cinematic ~3 giây** (muted, autoplay, loop), **không** scroll-driven/pinning.

## 3. Patterns & Components

- **Navbar (sticky, 64px):** nền `#07090F/85` + blur, border-bottom subtle; trái: logo mới; giữa: Trang chủ · Sản phẩm · Danh mục (dropdown, lấy từ DB) · Tin tức · Liên hệ; phải: ô tìm kiếm live có gợi ý, icon wishlist (count), giỏ hàng (count), user dropdown hoặc nút "Đăng nhập" (gold outline). Mobile: drawer có ô tìm kiếm + nav dọc + nút đăng nhập.
- **Footer:** surface `#0E1219`, cột: thương hiệu+MXH, Liên kết, Hỗ trợ, Liên hệ.
- **Product card:** nền `#0E1219`, ảnh sản phẩm trên nền tối, tên (2 dòng), giá sale màu gold + giá gạch gốc, badge `-x%` destructive, sao amber + (review), tồn kho, nút/thêm vào giỏ; hover: nâng nhẹ + viền gold.
- **Buttons:** primary = gold bg + `#07090F` text · outline = viền subtle, text trắng · info = blue · danger = red.
- **Inputs:** bg `#151A24`, border `#1E2532`, focus ring gold.
- **Badge/Chip:** filter material (PLA/PETG/ABS/Resin), printer (FDM/Resin) — blue outline; active = gold.
- **Order timeline:** bước theo đúng trạng thái server: pending → confirmed → shipping → completed (+ cancelled nhánh đỏ) kèm badge thanh toán.
- **Cart drawer:** panel phải `#0E1219`, item + subtotal, CTA "Thanh toán" gold.
- **States:** skeleton shimmer tối, EmptyState icon + mô tả + action, ErrorState + "Thử lại", toasts top-right.
- **Admin shell:** sidebar `#0B0F16` (240px, active có indicator gold), topbar tiêu đề + breadcrumb; bảng dày (header sticky, hàng 48px), badge trạng thái, nút hành động icon; Dialog CRUD form; StatCard nền `#0E1219` số trắng + delta gold/blue; chart nền tối grid `#1E2532`.

## 4. Nguyên tắc nội dung (business)

- Dữ liệu thật lấy từ API: giá/tồn kho/đánh giá/mã giảm giá/chương trình (SALE10, GIAM50K, REWARD-*) — **không bịa** số liệu, thống kê giả ("500+/10K+/4.9"), sản phẩm, đánh giá.
- Danh mục hiển thị theo DB (không giới hạn số lượng).
- Thanh toán: COD + chuyển khoản VietQR (QR + đếm ngược); phí vận chuyển 0₫.
- Ngôn ngữ, thông báo lỗi tiếng Việt theo message từ server.

## 5. Screen inventory (design scope)

Storefront: HOME (desktop/tablet/mobile), PLP, PDP, CHECKOUT (+cart drawer), LOGIN/REGISTER, ACCOUNT-ORDERS (timeline), NEWS, CONTACT.
Admin: DASHBOARD, PRODUCTS (list + edit), ORDERS, SUPPORT/USERS inbox.
Specs: NAVBAR-FOOTER-SPEC (kèm mobile menu), LOGO-SYSTEM, chính sách AO BING hero ~3s trong HOME.
