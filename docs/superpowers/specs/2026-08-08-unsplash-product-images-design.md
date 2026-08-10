# Design: Thay ảnh placeholder bằng ảnh thật từ Unsplash

## Mục tiêu
12 sản phẩm hiện đang dùng ảnh SVG placeholder (base64) → thay bằng link ảnh thật
`https://images.unsplash.com/photo-...` để trang web hiện hình ảnh sản phẩm thực.

## Phạm vi
- Data-only: chỉ cập nhật trường `images` của từng sản phẩm trong MongoDB.
- Không đổi code app (client/server).
- Không đụng: đơn hàng, giỏ hàng, wishlist, review.
- Giữ nguyên tính năng upload ảnh (admin vẫn tải ảnh lên được).

## Cách làm
1. Lấy danh sách 12 sản phẩm (slug, tên, images hiện tại).
2. Chọn 1 link Unsplash phù hợp chủ đề từng sản phẩm.
3. Verify từng link trả HTTP 200 trước khi ghi DB.
4. Chạy script Node cập nhật `images: [url]` cho 12 sản phẩm.

## Nguồn ảnh Unsplash (mỗi sản phẩm 1 ảnh)
- Robot Gundam RX-78: link người dùng cung cấp (`photo-1730361961626-b046f69b9df2`).
- Các sản phẩm khác: link Unsplash theo chủ đề tương ứng.

## Verify
- Mở trang chủ + trang chi tiết 2-3 sản phẩm → ảnh thật hiển thị.
- Upload admin vẫn hoạt động.

## Lưu ý
- Không tạo file mới ngoài script tạm (chạy xong xóa hoặc để trong temp).
- Không commit (dự án chưa có git repo).
