# Store 3D — Design System & App Spec (dùng cho Stitch AI)

> Cách dùng: Đưa file này vào Stitch AI (Upload DESIGN.md → Create Design System from DESIGN.md), sau đó dùng nó làm nền để Generate screen từng màn hình theo các prompt bên dưới (phần "Per-screen prompts").

## 1. Brand & Context

- **Tên sản phẩm:** Store 3D — cửa hàng bán **mô hình in 3D** (figurine, đồ trang trí, mô hình kiến trúc, phụ kiện).
- **Ngôn ngữ UI:** Tiếng Việt. Giữ nguyên mọi chuỗi tiếng Việt trong mô tả màn hình.
- **Phong cách:** Premium, futuristic, "showroom kỹ thuật số" — nền tối sang trọng ở hero, glassmorphism, glow cyan/blue, lưới kỹ thuật số mờ, hover nâng nổi (translate-y + shadow), transition mượt.
- **Trang sản phẩm:** Ảnh có nền gradient cyan→primary mờ + overlay grid; phản chiếu sáng mờ trên đỉnh card.

## 2. Design Tokens

### Colors (light)
- background: trắng (#ffffff), foreground: gần đen (#111827 / oklch 0.145)
- primary: **xanh dương–tím** (#3b6ee8 / oklch 0.58 0.165 250) — dùng cho nút chính, giá, active
- muted: xám rất nhạt (#f7f7f7), muted-foreground: xám trung bình
- accent: xám nhạt (#f7f7f7), destructive: đỏ (#e5484d)
- card: trắng, border: xám nhạt (#ebebeb)
- amber: sao đánh giá (#fbbf24)

### Colors (dark)
- background: gần đen (#222222 / oklch 0.145), foreground: trắng (#fafafa)
- card: xám tối (#343434), border: trắng 10% opacity
- primary: xanh nhạt hơn (oklch 0.75 0.14 245), primary-foreground: tối
- muted: xám tối (#444), muted-foreground: xám sáng (#b4b4b4)

### Theme
- Hỗ trợ **light + dark** với nút toggle (icon Mặt Trời/Trăng) ở navbar. Không dùng hiệu ứng đổi màu đột ngột (transition 0.25s).

### Typography
- Font: **Be Vietnam Pro** (fallback: system-ui, sans-serif).
- Scale: display = 4xl–6xl extrabold (hero), heading = 2xl–3xl bold, body = text-sm/base, caption = text-xs.
- Hero heading: trắng, có cụm gradient chữ **cyan→blue** (bg-clip-text).

### Shape & Radius
- Bo góc **10px** (radius 0.625rem) làm chuẩn; card sản phẩm = rounded-2xl; icon container = rounded-xl; badge/nút = rounded-full khi nhỏ.
- Shadow: shadow-lg/xl, shadow có tông primary (shadow-primary/10).

### Spacing & Layout
- Container chính: max-w-7xl, padding ngang px-4 sm:px-6.
- Section dọc: py-16/py-20; khoảng cách heading→grid: mb-8.
- Grid: 2 cols mobile → 3 sm → 4 lg (sản phẩm); 2 → 4 → 6 (danh mục); 3 (features).

## 3. Pattern & Components

### Navbar (sticky, backdrop-blur)
- Cao 64px, border-bottom, nền background/80 + blur; z-40.
- Trái: nút burger (mobile) + logo (icon Box trong ô vuông bo 12px nền primary + text "Store**3D**").
- Giữa: menu ngang "Trang chủ / Sản phẩm / Nổi bật".
- Ngay sau menu: **thanh tìm kiếm** (dùng chung 1 ô; gõ ≥1 ký tự hiện gợi ý).
- Phải: nút theme, trái tim (wishlist + badge count), giỏ hàng (badge count), avatar/user dropdown (admin → Quản trị; Tài khoản; Đơn hàng; Đăng xuất) hoặc nút "Đăng nhập".
- Mobile: menu dạng drawer trượt xuống, gồm form tìm kiếm + nav dọc.

### Search suggestions (horizontal, có ảnh)
- Dưới ô tìm kiếm: panel popover bo 12px, chứa **hàng card ngang cuộn ngang (overflow-x-auto)**.
- Mỗi card: ảnh vuông ~96px + tên (line-clamp-2) + giá primary. Click → trang sản phẩm.

### Product card (showroom digital)
- Card nổi (rounded-2xl, bg-card/50 + backdrop-blur), hover: -translate-y-1.5 + shadow-xl primary + border primary/40.
- Ảnh: gradient cyan→primary mờ + grid mờ + glow tròn theo hover + reflection sáng đỉnh + gradient tối dưới.
- Badge góc trái: "-X%" (destructive) và/hoặc "Nổi bật" (primary). Nút trái tim góc phải (tròn, blur) toggle wishlist.
- Hết hàng: overlay mờ + badge "Hết hàng".
- Hover desktop: thanh CTA "Thêm vào giỏ" trượt lên từ dưới.
- Info: sao amber + rating + tên danh mục • tên sản phẩm (2 dòng) • giá primary bold + giá cũ gạch ngang.
- Mobile: nút tròn giỏ hàng góc phải.

### Buttons
- Primary: nền primary, text trắng, shadow, bo 10px. size-lg cho hero.
- Outline: viền border, nền trong suốt.
- Trên hero tối: outline bản đặc biệt border-white/15 bg-white/5 text-white hover:bg-white/10.

### Badges
- primary / destructive / secondary; tròn đủ; có shadow cùng tông.

### Inputs
- Nền muted/50, bo 10px, icon search bên trái, placeholder text-muted-foreground.

## 4. Screens — Mô tả từng màn hình

> Dùng cho Stitch "Generate screen from text". Bật dark mode token khi cần preview tối.

### S1. Home (Trang chủ)
1. **Hero:** nền gradient toàn màn `from-slate-950 via-blue-950 to-black`, glow tròn cyan (trên phải) + xanh (dưới trái) blur-3xl. Nội dung 2 cột: trái = pill badge ("Sản phẩm in 3D chất lượng cao" + icon Sparkles), H1 trắng extrabold "Mô hình in 3D **độc đáo** cho mọi không gian" (từ "độc đáo" gradient cyan→blue), mô tả xám sáng, 2 nút (Primary "Khám phá sản phẩm" + Outline tối "Sản phẩm nổi bật"). Phải (desktop): 2 card ảnh sản phẩm nổi nghiêng (−6°/5°) trên nền glow, glass tối, giá cyan.
2. **Features:** dải bg-muted/30, 3 cột: icon (Printer/Box/Truck) trong ô 48px bo 12px nền primary/10 + tiêu đề + mô tả.
3. **Danh mục sản phẩm:** tiêu đề "Danh mục sản phẩm" + phụ đề. Grid 2/4/6, mỗi card: ảnh vuông rounded + tên, hover nâng nhẹ. (Dùng ảnh mô hình 3D thật nếu có.)
4. **Sản phẩm nổi bật:** bg-muted/30, tiêu đề + nút ghost "Xem tất cả →". Grid 2/3/4 product cards (đúng pattern mục 3).
5. **Hot Sale:** section có badge giảm giá đậm; grid product cards (dữ liệu giảm giá).

### S2. Product List / Search (Danh sách sản phẩm)
- Header trang: tiêu đề + filter. Thanh: danh mục, sắp xếp, tìm kiếm.
- Grid product cards 2/3/4. Pagination dạng số.
- Có thể có sidebar filter (danh mục + giá + trạng thái) — giữ tối giản.

### S3. Product Detail (Chi tiết sản phẩm)
- Breadcrumb. 2 cột: trái = gallery ảnh chính + thumbnail. Phải = tên, rating sao, giá lớn (primary), giá cũ gạch ngang, badge giảm giá, mô tả, thông tin (vật liệu, loại máy in, kích thước, kho), bộ đếm số lượng + nút "Thêm vào giỏ hàng" + wishlist, chính sách (ship, đổi trả).
- Dưới: tabs Mô tả / Đánh giá. Section sản phẩm liên quan (grid 4).

### S4. Cart (Giỏ hàng — drawer hoặc trang)
- Drawer trượt phải: danh sách item (ảnh, tên, giá, bộ đếm, xóa), tổng tiền, nút "Thanh toán".

### S5. Checkout
- Form: thông tin giao hàng (họ tên, SĐT, email, địa chỉ) + chọn phương thức thanh toán (2 card: "Tiền mặt khi nhận hàng" / "Chuyển khoản ngân hàng") + voucher nếu có. Tóm tắt đơn hàng bên phải. Nút đặt hàng.

### S6. QR Payment (Thanh toán QR — chuyển khoản)
- Card trung tâm: header icon QrCode + "Thanh toán bằng mã QR". Countdown pill "Mã QR sẽ hết hạn sau: 04:59" (chuyển đỏ khi ≤1 phút). Ảnh QR 224px trong khung trắng bo 16. Hàng: Ngân hàng / Số tài khoản / Chủ tài khoản / Số tiền / Nội dung CK (monospace + nút copy). Trạng thái: đang tạo (spinner) / thành công (check xanh) / hết hạn (nút "Tạo mã QR mới") / thất bại (nút Thử lại).

### S7. Auth (Đăng nhập / Đăng ký)
- Card trung tâm, logo trên, form email+mật khẩu, nút primary full-width, link chuyển đổi, preview mạng xã hội nếu có.

### S8. User Account (Tài khoản)
- Sidebar trái (Profile / Đơn hàng / Yêu thích / Đổi mật khẩu / Đăng xuất) + nội dung phải.
- Profile: avatar, họ tên, email, SĐT, địa chỉ + nút lưu.
- Orders: list card đơn hàng (mã, ngày, trạng thái badge, tổng tiền, chi tiết).
- Wishlist: grid product cards.

### S9. Admin (Quản trị — dark)
- Layout sidebar (Dashboard / Sản phẩm / Đơn hàng / Khách hàng / Đánh giá / Mã giảm giá / Thống kê).
- Dashboard: thẻ KPI (doanh thu, đơn hàng, sản phẩm, khách) + biểu đồ.
- Products: bảng dữ liệu (ảnh, tên, giá, kho, trạng thái badge) + nút Thêm.
- Orders: bảng đơn hàng + filter trạng thái.
- Users / Reviews / Coupons: bảng tương tự.

## 5. Navigation Map (sitemap)

`/` Trang chủ → `/san-pham` danh sách → `/san-pham/:slug` chi tiết
`/gio-hang` giỏ → `/thanh-toan` checkout → `/thanh-toan-qr/:id` QR payment → `/tai-khoan/don-hang` đơn hàng
`/dang-nhap`, `/dang-ky` auth
`/lien-he` liên hệ
`/tai-khoan/*` (profile, don-hang, yeu-thich, doi-mat-khau)
`/admin/*` (dashboard, san-pham, don-hang, khach-hang, danh-gia, ma-giam-gia, thong-ke) — **loại khỏi index SEO**

### Cấu hình SEO
- `client/public/sitemap.xml`: cấu trúc chuẩn sitemap, chỉ gồm các trang công khai (`/`, `/san-pham`, `/san-pham?featured=true`, `/lien-he`, `/dang-nhap`, `/dang-ky`), domain thay thế `https://store3d.example.com`.
- `client/public/robots.txt`: cho phép `/:`, chặn `/admin`, `/tai-khoan`, `/thanh-toan*`, `/danh-gia`, `/dang-nhap`, `/dang-ky`; khai báo `Sitemap:` trỏ tới `/sitemap.xml`.

## 6. Workflow (đề xuất khi gen bằng Stitch AI)

1. **Tạo design system:** Upload file DESIGN.md này → Create Design System from DESIGN.md (hoặc dán nội dung mục 1–3 vào Design MD). Chọn theme Light, font Be Vietnam Pro, roundness 10px.
2. **Gen từng màn:** bắt đầu S1 Home → S2 Product List → S3 Detail → S4 Cart → S5 Checkout → S6 QR → S7 Auth → S8 Account → S9 Admin. Dùng `generate_screen_from_text` với nội dung mô tả mục 4, luôn kèm: "dark mode khả dụng", "giữ tiếng Việt", "dùng design system Store 3D".
3. **Kiểm tra nhất quán:** sau mỗi màn, so với token (primary #3b6ee8, Be Vietnam Pro, rounded-10, glow cyan). Chỉnh lệch bằng `edit_screens` prompt ngắn.
4. **Variant nếu cần:** dùng `generate_variants` khi muốn 3 biến thể layout cho Home rồi chọn.

## 7. Prompt mẫu để paste ngay (Home)

> Generate a premium e-commerce home page for "Store 3D", a 3D-printed model shop. Use the Store 3D design system tokens (Be Vietnam Pro, primary blue #3b6ee8, rounded 10px). Light mode by default, dark mode available. All UI text in Vietnamese.
>
> Sections top to bottom:
> 1) Hero: full-bleed dark gradient background (slate-950 → blue-950 → black) with large blurred cyan glow top-right and blue glow bottom-left. Left column: small pill badge "Sản phẩm in 3D chất lượng cao" with a sparkles icon; huge white extrabold heading "Mô hình in 3D độc đáo cho mọi không gian" where the word "độc đáo" is a cyan→blue gradient text; gray subtitle; two buttons (primary "Khám phá sản phẩm" with arrow, and translucent outline "Sản phẩm nổi bật"). Right column (desktop): two floating 3D product photo cards, rotated −6° and +5°, glassy dark with cyan glow behind, showing product name and cyan price.
> 2) Feature strip on light muted background: 3 columns each with a 48px rounded icon tile (printer / box / truck icons) in soft primary-tinted background, bold title + small gray description.
> 3) "Danh mục sản phẩm" heading; responsive grid 2/4/6 of square category cards (photo + name), subtle hover lift.
> 4) "Sản phẩm nổi bật" section on muted background with a ghost "Xem tất cả →" link; grid 2/3/4 of premium product cards (square photo with cyan→primary gradient + subtle grid + glowing hover, discount badge top-left "-X%" red and "Nổi bật" blue, heart button top-right, name, star rating, primary bold price + strikethrough old price, hover reveals "Thêm vào giỏ" bar).
> 5) "Hot Sale" section with strong discount badges, same product card grid.
>
> Sticky top navbar (blur): logo "Store3D", links Trang chủ / Sản phẩm / Nổi bật, a search bar that opens a horizontal scrollable row of product thumbnails with names and prices, theme toggle, wishlist heart, cart icon, and an avatar dropdown. All text Vietnamese.
