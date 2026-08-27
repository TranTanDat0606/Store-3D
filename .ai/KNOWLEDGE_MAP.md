# Store3D — Project Knowledge Map
**Last Updated:** 2026-08-28 [100]  
**Status:** Approved & Compiled [100]

---

## 1. Store3D là gì và Mục tiêu Dự án
* **Định nghĩa:** Store3D là một nền tảng thương mại điện tử (e-commerce) full-stack, được thiết kế sẵn sàng chạy thực tế (production-ready) chuyên bán các **mô hình in 3D** bao gồm: figurine, đồ trang trí, mô hình kiến trúc, và phụ kiện [59, 64, 104].
* **Mục tiêu:** Mang lại trải nghiệm **"phòng trưng bày kỹ thuật số" (digital showroom)** cao cấp mang tính tương lai (futuristic aesthetic) [16, 64, 104]. Nền tảng tập trung tối ưu hóa trải nghiệm thị giác thông qua giao diện sang trọng, mượt mà và các hiệu ứng chiều sâu, thay vì sử dụng trình dựng hình 3D nặng nề [16, 64].

## 2. Người dùng Mục tiêu
Dự án phục vụ hai nhóm người dùng chính trong hệ thống với các vai trò (roles) được định nghĩa rõ ràng:
* **Khách hàng (Customers / Khach):**
  * Duyệt danh sách sản phẩm, tìm kiếm nâng cao kèm đề xuất trực quan [100, 104].
  * Quản lý danh sách yêu thích (wishlist) đồng bộ phía máy chủ [92, 100].
  * Thêm hàng vào giỏ, áp dụng mã giảm giá và thực hiện thanh toán trực tuyến qua mã VietQR thông minh [100, 104].
  * Thực hiện đánh giá sản phẩm (review) có ràng buộc mua hàng (purchase-gated) [100, 104].
* **Quản trị viên (Admins / Quan tri):**
  * Giám sát hệ thống qua Dashboard chứa số liệu doanh thu thực tế, thống kê đơn hàng, sản phẩm và khách hàng [84, 86, 104].
  * Thực hiện toàn bộ các tác vụ CRUD đối với: Sản phẩm (tích hợp tải ảnh Cloudinary), Danh mục, Mã giảm giá, Tin tức/Blog [100, 104].
  * Moderation đánh giá khách hàng và điều phối trạng thái đơn hàng [100, 104].
  * Quản lý trạng thái hoạt động và phân quyền người dùng (chặn xóa Admin cuối) [100, 107].

## 3. Tech Stack Chi tiết
Hệ thống được phát triển hoàn toàn bằng **TypeScript** trên cả hai môi trường Client và Server nhằm đảm bảo tính nhất quán kiểu dữ liệu [60, 106].

### Frontend (client/)
* **Framework chính:** React 19.2.8 [106] phối hợp với Vite 8.2.0 làm công cụ đóng gói [106].
* **Quản lý Route:** React Router DOM 7.18.2 hỗ trợ tải chậm (lazy-loaded) và Route Guards [90, 91, 106].
* **Styling & UI:** Tailwind CSS 4.3.3 [106] kết hợp với bộ component nguyên bản của **shadcn/ui** (New York style) và Radix UI primitives [106].
* **Animation:** Framer Motion 13.0.0 chịu trách nhiệm cho các hiệu ứng chuyển cảnh mượt mà [18, 106].
* **Xử lý biểu đồ:** Recharts 3.10.1 dùng để hiển thị dữ liệu phân tích doanh thu trên Admin Dashboard [86, 106].
* **Quản lý Form & Validation:** React Hook Form + Zod (7.84.0 / 4.4.3) xử lý xác thực dữ liệu đầu vào [106].
* **HTTP Client:** Axios 1.19.0 giao tiếp API thông qua cookie bảo mật [106].
* **Quản lý trạng thái (State):** React Context API kết hợp `useReducer` [60, 92]. Không dùng Redux hoặc Zustand [60, 92].

### Backend (server/)
* **Runtime & Framework:** Node.js 18+ cùng Express 4.19.2 [81, 106].
* **Database & ODM:** MongoDB Community Edition (kết nối local qua cổng `27017` hoặc máy chủ từ xa) thông qua Mongoose 8.5.1 [59, 81, 95, 106].
* **Authentication:** JWT (jsonwebtoken 9.0.2) lưu trữ bằng `httpOnly cookie` [92, 97, 106].
* **Password Hashing:** bcryptjs 2.4.3 mã hóa một chiều [98, 106].
* **Image Upload:** Cloudinary 2.10.1 hỗ trợ upload ảnh trực tiếp lên đám mây [106].
* **Thư viện sinh mã QR:** `qrcode` tạo chuỗi dữ liệu ảnh VietQR [49, 53].

## 4. Kiến trúc Dự án & Phương thức Kết nối
Dự án sử dụng mô hình **Monorepo** chia làm hai thư mục độc lập `client/` và `server/` [59].

```
Store3D Monorepo
├── client/ (Vite + React SPA)
│   ├── src/
│   │   ├── components/  # Chứa UI primitives và các component theo nghiệp vụ
│   │   ├── contexts/    # Quản lý Auth, Cart, Wishlist, Theme Context [90]
│   │   ├── layouts/     # Main Layout, Account Layout, Admin Layout [90]
│   │   ├── pages/       # Các trang nghiệp vụ được tải chậm (lazy-loaded) [90, 91]
│   │   └── services/    # Các module Axios bọc API endpoint [90, 93]
└── server/ (Node.js + Express)
    ├── src/
        ├── config/      # Khai báo biến môi trường, CORS, Rate Limit [93]
        ├── controllers/ # Điều hướng nghiệp vụ và đóng gói phản hồi [93]
        ├── models/      # Định nghĩa 10 Mongoose schemas [93, 95]
        ├── routes/      # Ánh xạ endpoint HTTP [93]
        └── services/    # Chứa toàn bộ Business Logic nghiệp vụ [93]
```

### Cách thức Kết nối Client - Server:
1. **Cookie-Based Auth:** Máy chủ cấp token JWT và đặt vào cookie `httpOnly` có tên là `token` [92, 97]. Client sử dụng Axios cấu hình `{ withCredentials: true }` để tự động đính kèm cookie này trong mọi request API mà không cần lưu trữ token ở LocalStorage [92, 93].
2. **Standard Response Envelope:** Mọi API phản hồi thống nhất theo cấu trúc chuẩn hóa:  
   `{ success: boolean, message: string, data: {}, pagination: {}, errors: [] }` [60, 94, 108].
3. **Zod Boundary Validation:** Dữ liệu được kiểm duyệt chặt chẽ tại ranh giới bằng Zod Schemas ở cả Client-side form và Server-side middleware trước khi đi vào Controllers [63, 94, 108].

## 5. Các Chức năng Chính Hiện có
* **Duyệt & Tìm kiếm Sản phẩm:** Hỗ trợ tìm kiếm không phân biệt chữ hoa/thường, bộ lọc theo danh mục, sắp xếp giá/ngày tạo và phân trang [60, 95, 100].
* **Gợi ý Tìm kiếm Ngang:** Tích hợp bộ gợi ý (suggestions) dạng hàng ngang cuộn mượt ngay dưới thanh tìm kiếm khi gõ từ 1 ký tự, hiển thị ảnh đại diện và giá thực tế [12, 13, 69].
* **Chi tiết Sản phẩm Cao cấp:** Trình bày thư viện ảnh (gallery) với lightbox zoom, thông số kỹ thuật dạng bảng, đánh giá của người mua, sản phẩm liên quan và nhanh chọn số lượng [16, 24, 28, 100].
* **Giỏ hàng Drawer:** Drawer trượt từ bên phải dạng kính mờ (glass design) với hiệu ứng chuyển động mượt mà bằng Framer Motion [127], tự động lưu trạng thái vào `localStorage` [92, 100].
* **Thanh toán QR (VietQR):** Sinh mã QR tự động từ dữ liệu đơn hàng (số tiền, mã đơn hàng `ST3D-XXXXXX`) [53, 56], tích hợp countdown 5 phút và tự động chuyển trạng thái thành công nhờ polling API mỗi 3 giây mà không cần F5 [50, 56, 100].
* **Đồng bộ Wishlist:** Cho phép người dùng lưu trữ sản phẩm yêu thích đồng bộ phía máy chủ và chuyển nhanh vào giỏ hàng [92, 100].
* **Hệ thống Đánh giá Gated:** Chỉ những khách hàng đã mua sản phẩm và đơn hàng ở trạng thái hoàn thành mới có quyền viết đánh giá kèm theo ảnh chụp thực tế [30, 100].
* **Hệ thống Quản trị Toàn diện:** Dashboard phân tích kinh doanh [84, 86], các trang quản lý CRUD sản phẩm/danh mục/coupon/tin tức, điều phối trạng thái đơn hàng và phân quyền người dùng [1, 2, 88, 100].
* **Blog/Tin tức & Liên hệ:** Chuyên trang hiển thị bài viết tin tức và tiếp nhận yêu cầu liên hệ hỗ trợ từ khách hàng [95, 96, 100].

## 6. Design System & Phong cách UI/UX
* **Triết lý Thiết kế:** Phong cách "Digital Showroom" mang hơi hướng tương lai (futuristic/cyber-premium) [64]. Tận dụng nền tối kết hợp hiệu ứng kính mờ (glassmorphism), lưới kỹ thuật số mờ (`.bg-grid`) [124], phản chiếu sáng nhẹ ở đỉnh card và các quầng sáng (ambient glows) xanh dương/cyan dịu mắt phía sau sản phẩm [21, 37, 64].
* **Phông chữ:** Sử dụng phông chữ **Be Vietnam Pro** làm tiêu chuẩn duy nhất [66].
* **Bo góc chuẩn (Border Radius):** Bo góc mặc định là **10px** (0.625rem) [67]. Các card sản phẩm được bo tròn lớn hơn ở mức `rounded-2xl` [67].
* **Mảng màu Sáng (Light Theme):** Nền trắng `#ffffff`, chữ gần đen `#111827`, màu chính (Primary) là xanh dương-tím `#3b6ee8` dùng cho nút nhấn hành động, giá và trạng thái kích hoạt [65].
* **Mảng màu Tối (Dark Theme):** Nền gần đen `#222222` [65], card màu xám tối `#343434` [66], đường viền mỏng trắng với độ mờ 10% [66], màu chính xanh nhạt dịu hơn [66].
* **Tinh chỉnh Đồng nhất:** Toàn bộ thuộc tính màu chủ đạo `--primary` và viền sáng tỏa `--ring` đã được đổi tông từ màu tím sang màu xanh đại dương (ocean blue ~250 deg) trong `index.css` để giữ tính đồng nhất cao [123].

## 7. Cơ chế Authentication & Authorization
* **JWT Token Security:** Token được mã hóa chứa thông tin `userId` và `role` [97]. Token chỉ lưu trong cookie `httpOnly` phía máy chủ, kích hoạt cờ `secure` trên môi trường sản xuất và thuộc tính `sameSite: lax` nhằm ngăn chặn tuyệt đối các cuộc tấn công đánh cắp phiên XSS [97, 98].
* **Mã hóa mật khẩu:** Mật khẩu người dùng được băm tự động bằng thuật toán `bcryptjs` trước khi lưu vào cơ sở dữ liệu qua Mongoose pre-save hook [98]. Cấu hình model mặc định loại trừ mật khẩu khỏi mọi truy vấn tìm kiếm (`select: false`) [95, 98].
* **Phân quyền người dùng (Authorization):** Hệ thống định nghĩa hai vai trò duy nhất: `customer` (Khách hàng) và `admin` (Quản trị viên) [107].
* **Route Guards (Phía Client):**
  * `ProtectedRoute`: Chặn truy cập trái phép vào các trang như thanh toán, tài khoản, đánh giá nếu chưa đăng nhập [91].
  * `AdminRoute`: Kiểm tra vai trò nghiêm ngặt, chỉ cho phép tài khoản có `role === 'admin'` tiếp cận bảng điều khiển quản trị [91].
  * `GuestOnlyRoute`: Chuyển hướng người dùng đã đăng nhập ra xa khỏi trang Đăng nhập / Đăng ký [91].
* **Bảo vệ Hệ thống:** Admin cuối cùng của hệ thống được bảo vệ bằng code cứng, ngăn chặn hành vi xóa tài khoản hoặc tự hạ quyền nhằm tránh khóa hệ thống vô hạn [100, 107].

## 8. Chi tiết các Luồng Xử lý Dữ liệu Chính (Flows)

### A. Luồng Giỏ hàng & Ràng buộc Đăng nhập (Cart Flow)
```
[Khách click Thêm vào giỏ] 
       │
       ▼
 [Đã đăng nhập?] ──(Chưa)──▶ [Mở LoginPromptDialog] ──▶ Đăng nhập ──▶ Quay lại trang cũ và tự động Thêm [116]
       │
     (Có)
       ▼
[Gọi CartContext.addItem()] ──▶ Cập nhật LocalStorage ──▶ Mở Cart Drawer hiển thị chi tiết [92, 115, 116, 127]
```

### B. Luồng Thanh toán VietQR (VietQR Payment Flow)
1. **Khởi tạo:** Khách hàng tại trang Checkout chọn phương thức "Chuyển khoản ngân hàng" và xác nhận đặt hàng [48].
2. **Điều hướng:** Hệ thống tạo đơn hàng ở trạng thái `unpaid`, trừ kho sản phẩm tương ứng và điều hướng khách sang trang `/thanh-toan-qr/:orderId` [48, 52, 56].
3. **Gọi API sinh mã:** Trang QR Payment gửi request POST `/api/orders/:id/payment-qr` lên máy chủ [54, 55].
4. **Xử lý phía máy chủ:** 
   * Server lấy thông tin tài khoản đích từ cấu hình biến môi trường (`.env` bao gồm `BANK_BIN`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_NAME`) [50, 55].
   * Tạo mã đơn hàng duy nhất dạng `ST3D-XXXXXX` (6 ký tự hex) [53].
   * Tính toán thời gian hết hạn mã QR `qrExpiresAt` (= thời gian hiện tại + 5 phút) và lưu trạng thái thanh toán đơn là `pending_payment` [52, 53].
   * Sử dụng thư viện `qrcode` chuyển đổi dữ liệu thành chuỗi Base64 QR Data URL và trả về cho Client [50, 53].
5. **Đếm ngược & Polling:** 
   * Client hiển thị mã QR kèm bộ đếm ngược thời gian hết hạn dựa trên `qrExpiresAt` [56].
   * Khởi động cơ chế Polling: Định kỳ 3 giây một lần, Client gửi request GET `/api/orders/:id` lên server để lấy thông tin trạng thái mới nhất [50, 56].
6. **Đối soát (Reconcile):** 
   * Khi ngân hàng/cổng thanh toán gọi Webhook đến POST `/api/payment/webhook` (hoặc admin giả lập qua `/api/payment/webhook/simulate` ở DEV) [54], máy chủ chạy dịch vụ đối soát `paymentService.markOrderPaid(orderCode, amount)` [53].
   * Thực hiện 4 bước kiểm tra nguyên tử: Trùng khớp mã `orderCode`, trạng thái hiện tại là `pending_payment`, chưa quá hạn `qrExpiresAt` và số tiền chuyển khoản khớp 100% với đơn hàng [53].
   * Nếu hợp lệ: Cập nhật trạng thái thanh toán sang `paid`, ghi nhận ngày thanh toán `paidAt`, đồng thời tự động chuyển trạng thái đơn hàng sang `confirmed` [53].
7. **Phản hồi:** Polling Client nhận được trạng thái `paid` từ API -> Tự động chuyển giao diện sang màn hình "Thành công" tức thì mà không cần tải lại trang [56, 57].

### C. Luồng Đánh giá Sản phẩm (Review Flow)
```
[Gửi request kiểm tra Eligibility] ──▶ GET /api/reviews/my-eligibility/:productId [96]
                                                     │
                             ┌───────────────────────┴───────────────────────┐
                             ▼                                               ▼
                     [Không đủ điều kiện]                               [Đủ điều kiện]
             (Chưa mua hoặc đơn chưa hoàn thành)              (Đã mua hàng & đơn đã completed) [100]
                             │                                               │
                             ▼                                               ▼
                   Ẩn nút viết đánh giá                             Hiện nút "Viết đánh giá" 
                                                                             │
                                                                             ▼
                                                                Nhập thông tin + Tải ảnh lên 
                                                                             │
                                                                             ▼
                                                                  POST /api/reviews [96]
                                                                             │
                                                                             ▼
                                                              Cập nhật điểm Rating trung bình 
                                                                & số lượng Review của sản phẩm [95]
```

## 9. Hệ thống Quản trị (Admin System)
Hệ thống quản trị được thiết kế cô lập về mặt phong cách giao diện (hoàn toàn sử dụng giao diện nền tối tech-blue cao cấp, kính mờ sang trọng, trong khi storefront có thể tùy chỉnh light/dark) [83, 85].
* **Bảng điều khiển Thống kê (Dashboard - `/admin`):**
  * Tích hợp 4 thẻ KPI động: Doanh thu (emerald), Đơn hàng (cyan), Sản phẩm (violet), Khách hàng (amber) [86].
  * Biểu đồ doanh thu 30 ngày qua dạng AreaChart (sử dụng Recharts) lấy dữ liệu thực từ `statsApi.revenue-by-day()` [84, 86].
  * Biểu đồ tròn Donut trạng thái đơn hàng và danh sách Best-Sellers (Top 5 sản phẩm bán chạy nhất) [84, 86].
* **Quản trị Sản phẩm (`/admin/san-pham`):**
  * Danh sách dạng bảng dày đặc thông tin, hỗ trợ debounced search theo tên hoặc slug [87].
  * Moderator badge hiển thị trạng thái tương ứng: Đang bán (emerald), Ẩn (slate), Hết hàng (amber) [87].
  * Form soạn thảo sản phẩm được tách thành một route độc lập `/admin/san-pham/:id` (với `:id = new` cho tạo mới) [83, 88]. Tích hợp đầy đủ trình upload ảnh trực quan, quản lý sắp xếp thứ tự ảnh [88].
* **Quản trị Danh mục (`/admin/categories`):**
  * Thiết kế thống nhất theo mô hình bảng của trang sản phẩm [1].
  * Sử dụng MongoDB Aggregation để tự động thống kê số lượng sản phẩm liên kết với danh mục mà không cần truy vấn lặp [2].
  * Cơ chế bảo vệ: Server chặn hành động xóa danh mục nếu phát hiện vẫn còn sản phẩm liên kết (bắn toast cảnh báo lỗi) [5].
* **Quản trị Đơn hàng (`/admin/don-hang`):**
  * Cho phép tìm kiếm đơn hàng theo mã, lọc theo trạng thái [89].
  * Xem nhanh thông tin chi tiết đơn, lịch sử mua sắm và cập nhật trạng thái đơn hàng theo luồng một chiều (pending → confirmed → shipping → completed) [89, 100, 108].

## 10. Các API và Dòng Chuyển dịch Dữ liệu Quan trọng (Data Flow)
* **Xác thực phiên làm việc:** `GET /api/auth/me` chạy qua middleware `requireAuth` để giải mã token trong cookie, trả về thông tin định danh và vai trò của người dùng hiện tại [96, 97].
* **Gợi ý tìm kiếm trực tiếp:** Trình tìm kiếm trên thanh Navbar gọi debounced request `GET /api/products?search=...&limit=5` [12, 13]. Server thực hiện tìm kiếm bằng case-insensitive substring regex trên trường name và description của Product, trả về mảng đối tượng sản phẩm đầy đủ để vẽ giao diện đề xuất ngang [12].
* **Tải ảnh lên máy chủ:** Component `ImageUpload` thực hiện gửi tệp dạng `FormData` qua API `POST /api/upload` [45, 46, 119]. Server kiểm duyệt định dạng tệp và kích thước (tối đa 5MB), đẩy ảnh lên máy chủ Cloudinary [100, 106], trả về URL lưu trữ để lưu vào mảng `Product.images[]` trong DB [46, 47].
* **Hiển thị hình ảnh an toàn:** Toàn bộ các vị trí hiển thị hình ảnh sản phẩm đều chạy qua hàm tiện ích `resolveImageUrl(img)` [46]. Tiện ích này phân tích:
  * Nếu ảnh bắt đầu bằng `data:` (ảnh SVG placeholder base64) hoặc `http(s)://` (link ảnh Unsplash hoặc Cloudinary) -> Giữ nguyên URL [46].
  * Nếu ảnh bắt đầu bằng `/uploads/...` (đường dẫn tương đối cũ) -> Tự động ghép nối tiền tố gốc `VITE_API_URL` của server để tránh lỗi hiển thị trên client [46].

## 11. Các Tính năng Đã Hoàn thành (Fully Implemented)
Theo ghi nhận tại tài liệu trạng thái hiện tại ngày 28/08/2026, toàn bộ các tính năng cốt lõi sau đã hoàn tất, hoạt động ổn định và đã được triển khai (Vercel cho Client, Render cho Server API) [100]:
* Trình duyệt danh mục sản phẩm (List, Search, Category Filter, Sort, Pagination, Featured, Related) [100].
* Trang chi tiết sản phẩm hoàn chỉnh với gallery lightbox, sticky purchase panel và mobile bottom bar [100].
* Giỏ hàng lưu trữ LocalStorage & Cart Drawer cao cấp [100].
* Checkout hoàn tất tích hợp mã giảm giá và VietQR countdown + automatic polling status [100].
* Hệ thống đồng bộ Wishlist và hệ thống viết Review purchase-gated [100].
* Admin Dashboard hoàn chỉnh (KPI cards, Recharts, Best sellers, Recent orders) [100].
* Toàn bộ hệ thống quản lý Admin (CRUD Sản phẩm, CRUD Danh mục chặn xóa, Quản lý trạng thái Đơn hàng, CRUD Coupon, moderating Review, quản lý hoạt động User) [100].
* Hệ thống tin tức/blog và tiếp nhận form liên hệ [100].
* Chế độ giao diện Sáng / Tối lưu trữ tùy chọn người dùng [100].

## 12. Những Vấn đề và Tính năng Còn Tồn tại (Technical Debt / Backlog)
Hệ thống hiện không ghi nhận lỗi nghiêm trọng gây sập (No critical bugs), tuy nhiên tồn tại các khoản nợ kỹ thuật sau [102]:
* **Khoản nợ Kiểm thử (Testing Debt):** Hoàn toàn chưa có kiểm thử phía Client (0 file test); Server chỉ có vỏn vẹn 3 testcases đơn giản cho VietQR, Payment và cập nhật trạng thái [102].
* ** SMTP / Email Notifications:** Hệ thống đã khai báo các cấu hình SMTP trong biến môi trường nhưng **hoàn toàn chưa có mã nguồn triển khai gửi email** thực tế. Gửi form liên hệ mới chỉ lưu vào cơ sở dữ liệu [101, 103].
* **Payment Webhook:** API endpoint `/api/payment/webhook` đã sẵn sàng nhưng chỉ đang hoạt động thông qua một giả lập DEV-only (`/webhook/simulate`) do chưa được đăng ký webhook thực sự với một đơn vị cung cấp cổng thanh toán [101, 103].
* **SEO Optimization:** Hai tệp cấu hình SEO quan trọng `sitemap.xml` và `robots.txt` nằm trong thư mục public của Client là các **file tĩnh** [103], chưa hỗ trợ cập nhật động khi có sản phẩm hoặc bài viết mới được thêm vào DB.
* **Tối ưu hình ảnh:** Hệ thống chưa tích hợp cơ chế tự động chuyển đổi định dạng ảnh (như WebP) hoặc nén dung lượng ảnh khi tải lên, hoàn toàn phụ thuộc vào cấu hình mặc định của Cloudinary [103].
* **Bảo mật:** Demo credentials (`admin@store3d.com` / `admin123`) được viết công khai trong tệp `client/README.md` [102].
* **Cấu hình TS strict:** Phía máy chủ chưa bật cờ chế độ kiểm tra nghiêm ngặt `strict` trong `tsconfig.json` [102].

## 13. Các Quyết định Thiết kế Quan trọng (Design Decisions)
* **Quyết định 1: Tuyệt đối KHÔNG sử dụng 3D Viewer (Three.js / React Three Fiber).** Mặc dù tên dự án là Store3D và kinh doanh mô hình 3D, khách hàng và đội ngũ phát triển thống nhất hệ thống chỉ là một trang thương mại điện tử sử dụng **thư viện hình ảnh 2D cao cấp** [16]. Quyết định này giúp tối ưu hóa hiệu năng, giảm dung lượng tải trang và tập trung kinh phí vào việc thiết kế hình ảnh thay vì dựng mô hình 3D tương tác [16].
* **Quyết định 2: JWT Cookie-Based Auth.** Lựa chọn lưu trữ JWT trong cookie `httpOnly` thay vì LocalStorage giúp giảm thiểu tối đa nguy cơ bị đánh cắp phiên làm việc thông qua lỗ hổng bảo mật XSS [92, 97].
* **Quyết định 3: Chuyển đổi Lưu trữ Hình ảnh.** Trải qua 3 giai đoạn tiến hóa: Base64 trong MongoDB (Giai đoạn đầu) -> Lưu local thông qua Multer tại `/uploads/` (Giai đoạn hai) -> Tích hợp **Cloudinary** làm nơi lưu trữ đám mây duy nhất (Giai đoạn hiện tại) giúp hệ thống bền bỉ và cơ sở dữ liệu MongoDB nhẹ nhàng [44, 59, 100].
* **Quyết định 4: Cơ chế Khôi phục Layout Danh mục Trang chủ.** Sau khi thử nghiệm mô hình lưới bất đối xứng (asymmetric mosaic), giao diện bị đánh giá là rối mắt. Đội ngũ quyết định xóa bỏ `categories-section.tsx` cũ và khôi phục về layout nguyên bản trực quan: Thẻ danh mục đầu tiên là banner màu dốc rộng (gradient), các thẻ tiếp theo là ảnh vuông bo góc gọn gàng [48, 51].
* **Quyết định 5: Khóa Trạng thái Đơn hàng Một Chiều.** Đơn hàng chỉ được phép di chuyển trạng thái tiến lên (Pending → Confirmed → Shipping → Completed) và chỉ được hủy ở các giai đoạn đầu nhằm đảo bảo tính toàn vẹn của dữ liệu báo cáo tài chính [108].
* **Quyết định 6: Polling trạng thái thay vì WebSocket.** Lựa chọn cơ chế polling HTTP ngắn (gửi yêu cầu mỗi 3 giây) khi trang thanh toán QR mở giúp hệ thống đơn giản, dễ bảo trì, tránh phát sinh chi phí duy trì kết nối WebSocket liên tục trên máy chủ Render [50].
* **Quyết định 7: usePurchasePanel Hook — Mot lan goi, chia se state.** Hook `usePurchasePanel` duoc goi **dung mot lan** trong `ProductDetailPage`. Ket qua tra ve (state + handlers) duoc truyen xuong `PurchasePanel` (desktop) va `MobilePurchaseBar` (mobile) duoi dang props. Hai component trinh bay **tuyet doi khong tu goi hook** — ngan trung lap trang thai mua hang giua desktop va mobile.
* **Quyết định 8: Bo hien thi "Tam tinh" tren Product Detail.** Trang chi tiet san pham **khong hien thi** tong tien tam tinh (subtotal) theo so luong. Selector so luong van hoat dong binh thuong. Ly do: giao dien don gian hon, bot noi dung trung lap voi gia hien thi o purchase panel.

## 14. Phân cấp Tài liệu & Độ ưu tiên khi có Xung đột (Document Priority)
Khi phát triển hoặc bảo trì dự án, nếu phát hiện thông tin mâu thuẫn giữa các tài liệu đặc tả, AI Agent và lập trình viên phải áp dụng quy tắc phân cấp theo **Thời gian cập nhật muộn nhất** và **Trạng thái phê duyệt**:

1. **Độ ưu tiên Cao nhất (Trạng thái Hiện tại và Kiến trúc thực tế):**
   * `Store3D — Current State` (Cập nhật ngày **28/08/2026**) [100].
   * `Store3D — Architecture` (Cập nhật ngày **28/08/2026**) [90].
   * `Store3D — Project Overview` (Cập nhật ngày **28/08/2026**) [104].
2. **Độ ưu tiên Tiếp theo (Các tài liệu thiết kế tính năng đã được duyệt - Approved):**
   * `QR Bank-Transfer Payment + Categories Restore — Design Doc` (Ngày **14/08/2026** - Approved) [48]. *Ghi đè hoàn toàn thiết kế trang chủ và luồng thanh toán trước đó.*
   * `Admin Categories Page — Table Layout Design` (Ngày **14/08/2026** - Approved) [1]. *Ghi đè thiết kế danh mục dạng grid trước đó.*
   * `Design: Admin Product Management Page redesign` (Ngày **14/08/2026**) [6].
   * `Storefront Premium Redesign — Design Doc` (Ngày **12/08/2026** - Approved) [121].
3. **Độ ưu tiên Nhóm Đặc tả Dự thảo (Draft - Đang chờ duyệt):**
   * `Product Detail Page Redesign — Design Spec` (Ngày **28/08/2026** - Trạng thái: **Approved & Implemented**). Đã triển khai hoàn tất với 10 component mới và viết lại `product-detail-page.tsx`, commit `bf2c7ab`.
4. **Các tài liệu lịch sử cũ (Hạn chế tham chiếu trực tiếp):**
   * `Store 3D — Design Spec` (Ngày **07/08/2026**) [59]. *Chú ý: Tài liệu này chứa thông tin cũ nói "không dùng Cloudinary, chỉ lưu Base64 trong MongoDB" [59], thông tin này đã bị loại bỏ hoàn toàn bởi các tài liệu sau ngày 08/08 [44, 96, 100].*

---

## 15. Sơ đồ Kiến trúc Toàn diện cho AI Coding Agent

Dưới đây là sơ đồ kiến trúc hệ thống và luồng dữ liệu cốt lõi giúp các AI Agent dễ dàng nắm bắt toàn bộ dự án trước khi thực hiện mã hóa:

```
                          ┌────────────────────────────────────────────────────────┐
                          │                        BROWSER                         │
                          │                                                        │
                          │   ┌────────────────────────────────────────────────┐   │
                          │   │                   Storefront                   │   │
                          │   │   (Home, Products, Details, Cart, Checkout)    │   │
                          │   └────────────────────────────────────────────────┘   │
                          │   ┌────────────────────────────────────────────────┐   │
                          │   │                Admin Dashboard                 │   │
                          │   │   (KPIs, Recharts, Grids, Form route editors)  │   │
                          │   └────────────────────────────────────────────────┘   │
                          └───────────┬────────────────────────────▲───────────────┘
                                      │                            │
                                      │ HTTP Axios                 │ HTTP Only Cookie 
                                      │ (withCredentials: true)    │ (token: JWT) [92, 97]
                                      │                            │
                                      ▼                            │
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                   EXPRESS SERVER                                 │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                                  Routes                                  │   │
│   │   - Public API (/products, /categories, /news)                           │   │
│   │   - Secure Customer API (/orders, /wishlist, /reviews)                   │   │
│   │   - Admin Secure API (/admin/stats, /upload, CRUD /api/*)                │   │
│   └───────────────────────┬──────────────────────────────────────────────────┘   │
│                           │                                                      │
│                           ▼                                                      │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                               Middleware                                 │   │
│   │   - Zod Validators (Schema boundaries) [94]                              │   │
│   │   - Auth Guard (JWT decryption from Cookie) [97]                         │   │
│   │   - Admin Guard (req.user.role === 'admin') [97]                         │   │
│   │   - Centralized Error Handler (AppError wrapper) [94]                     │   │
│   └───────────────────────┬──────────────────────────────────────────────────┘   │
│                           │                                                      │
│                           ▼                                                      │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                        Controllers & Services                            │   │
│   │   - Business Logic Services (VietQR generator, atomic stock manager)     │   │
│   │   - Cloudinary integration service                                       │   │
│   └───────────────────────┬──────────────────────────────────────────────────┘   │
│                           │                                                      │
│                           ▼                                                      │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                             Mongoose Models                              │   │
│   │   (User, Product, Category, Order, OrderItem, Wishlist, Review, Coupon)  │   │
│   └───────────────────────┬──────────────────────────────────────────────▲───┘   │
│                           │                                              │       │
└───────────────────────────┼──────────────────────────────────────────────┼───────┘
                            │ Read / Write                                 │ Webhook (Đối soát)
                            ▼                                              │ [53, 54]
 ┌─────────────────────────────────────────────────────┐      ┌────────────┴───────────┐
 │                     MONGODB DB                      │      │     VietQR Webhook     │
 │                                                     │      │   (Simulated in DEV)   │
 │   - Users (Bcrypt Passwords) [98]                   │      │                        │
 │   - Products (Images stored as Cloudinary URLs) [95]│      │  POST /payment/webhook │
 │   - Orders (Payment.status: pending_payment) [52]   │      └────────────────────────┘
 └─────────────────────────────────────────────────────┘
```

### 💡 Chỉ thị Vàng dành cho AI Agent khi Coding:
1. **Tuyệt đối không tự ý cài đặt Three.js, `@react-three`, hoặc `<model-viewer>`** trừ khi có yêu cầu bằng văn bản và phê duyệt từ khách hàng [16]. Store3D hoàn toàn là một trang thương mại điện tử dựa trên hình ảnh chất lượng cao [16].
2. **Luôn sử dụng hàm tiện ích `resolveImageUrl(img)`** khi kết xuất hình ảnh sản phẩm để đảm bảo ảnh Base64 cũ, ảnh tĩnh local `/uploads` và ảnh đám mây Cloudinary mới đều hiển thị chính xác trên giao diện [46].
3. **Mọi văn bản hiển thị trên giao diện người dùng phải sử dụng Tiếng Việt [59, 107].** Các slug đường dẫn của client cũng phải tuân thủ tiếng Việt không dấu chuẩn SEO (`/san-pham`, `/thanh-toan-qr`, `/tai-khoan`) [107].
4. **Không can thiệp hoặc thay đổi các file Context hiện tại** (`CartContext`, `AuthContext`, `WishlistContext`, `ThemeContext`) khi thực hiện các đợt tái cấu trúc giao diện để tránh làm đổ vỡ các luồng xử lý dữ liệu ngầm [17, 122].
5. **Hãy lập trình phòng thủ (Defensive Coding) đối với luồng thanh toán:** Tuyệt đối không cho phép Client tự ý cập nhật trạng thái đơn hàng thành "Đã thanh toán" [49]. Mọi sự thay đổi về trạng thái tài chính của đơn hàng bắt buộc phải đi qua API đối soát của Server thông qua Webhook hoặc simulated webhook [49].
