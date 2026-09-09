import type { PaymentSuccessEmailData } from '../email.service';

export function paymentSuccessTemplate(data: PaymentSuccessEmailData) {
  const subject = `Store3D — Thanh toán đơn hàng thành công #${data.orderCode}`;

  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;">${item.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;text-align:right;">${item.price.toLocaleString('vi-VN')} ₫</td>
        <td style="padding:8px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;text-align:right;">${(item.quantity * item.price).toLocaleString('vi-VN')} ₫</td>
      </tr>`
    )
    .join('');

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#05070D;font-family:'Segoe UI',Tahoma,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#0A0E1F;border:1px solid #1e293b;border-radius:12px;padding:32px;text-align:center;">
        <h1 style="color:#4DE8FF;font-size:24px;margin:0 0 8px;">Store3D</h1>
        <p style="color:#8FA3C4;font-size:14px;margin:0 0 24px;">Xác nhận thanh toán</p>

        <div style="background:#131A33;border-radius:8px;padding:20px;margin-bottom:20px;">
          <p style="color:#4DE8FF;font-size:16px;margin:0 0 4px;">Thanh toán thành công!</p>
          <p style="color:#e2e8f0;font-size:14px;margin:0;">Đơn hàng <strong>#${data.orderCode}</strong> đã được xác nhận.</p>
        </div>

        <div style="text-align:left;margin-bottom:20px;">
          <p style="color:#8FA3C4;font-size:13px;margin:0 0 4px;">Khách hàng: <span style="color:#e2e8f0;">${data.customerName}</span></p>
          <p style="color:#8FA3C4;font-size:13px;margin:0 0 4px;">Mã đơn hàng: <span style="color:#e2e8f0;font-weight:bold;">#${data.orderCode}</span></p>
          <p style="color:#8FA3C4;font-size:13px;margin:0 0 4px;">Ngày đặt: <span style="color:#e2e8f0;">${data.orderDate}</span></p>
          <p style="color:#8FA3C4;font-size:13px;margin:0 0 4px;">Phương thức: <span style="color:#e2e8f0;">${data.paymentMethod === 'cash' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}</span></p>
          <p style="color:#8FA3C4;font-size:13px;margin:0;">Trạng thái: <span style="color:#4DE8FF;">${data.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span></p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <thead>
            <tr style="border-bottom:2px solid #1e293b;">
              <th style="padding:8px 12px;color:#8FA3C4;font-size:12px;text-align:left;">Sản phẩm</th>
              <th style="padding:8px 12px;color:#8FA3C4;font-size:12px;text-align:center;">SL</th>
              <th style="padding:8px 12px;color:#8FA3C4;font-size:12px;text-align:right;">Đơn giá</th>
              <th style="padding:8px 12px;color:#8FA3C4;font-size:12px;text-align:right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="border-top:1px solid #1e293b;padding-top:12px;text-align:right;">
          <p style="color:#8FA3C4;font-size:13px;margin:0 0 4px;">Tạm tính: <span style="color:#e2e8f0;">${data.subtotal.toLocaleString('vi-VN')} ₫</span></p>
          ${data.discount > 0 ? `<p style="color:#8FA3C4;font-size:13px;margin:0 0 4px;">Giảm giá: <span style="color:#FF6FC4;">-${data.discount.toLocaleString('vi-VN')} ₫</span></p>` : ''}
          <p style="color:#8FA3C4;font-size:13px;margin:0 0 4px;">Phí vận chuyển: <span style="color:#e2e8f0;">${data.shipping > 0 ? data.shipping.toLocaleString('vi-VN') + ' ₫' : 'Miễn phí'}</span></p>
          <p style="color:#4DE8FF;font-size:18px;font-weight:bold;margin:8px 0 0;">Tổng cộng: ${data.total.toLocaleString('vi-VN')} ₫</p>
        </div>

        <div style="text-align:left;margin-top:20px;">
          <p style="color:#8FA3C4;font-size:13px;margin:0 0 4px;">Địa chỉ nhận hàng:</p>
          <p style="color:#e2e8f0;font-size:14px;margin:0;">${data.address}</p>
        </div>

        <div style="margin-top:24px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/tai-khoan/don-hang/${data.orderId}" style="display:inline-block;background:#4DE8FF;color:#05070D;font-weight:bold;font-size:14px;padding:12px 32px;border-radius:8px;text-decoration:none;">Xem đơn hàng</a>
        </div>

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1e293b;">
          <p style="color:#8FA3C4;font-size:12px;margin:0;">Cần hỗ trợ? Liên hệ: <a href="mailto:${process.env.MAIL_SUPPORT || 'support@store3d.com'}" style="color:#4DE8FF;">${process.env.MAIL_SUPPORT || 'support@store3d.com'}</a></p>
        </div>
      </div>
    </div>
  </body>
  </html>`;

  return { subject, html };
}
