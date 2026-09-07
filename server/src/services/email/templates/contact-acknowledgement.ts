import type { ContactAcknowledgementEmailData } from '../email.service';

export function contactAcknowledgementTemplate(data: ContactAcknowledgementEmailData) {
  const subject = `[Store3D] Đã tiếp nhận yêu cầu hỗ trợ của bạn`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#05070D;font-family:'Segoe UI',Tahoma,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#0A0E1F;border:1px solid #1e293b;border-radius:12px;padding:32px;">
        <h1 style="color:#4DE8FF;font-size:20px;margin:0 0 16px;text-align:center;">Store3D</h1>
        <p style="color:#8FA3C4;font-size:14px;margin:0 0 24px;text-align:center;">Đã tiếp nhận yêu cầu hỗ trợ</p>

        <div style="background:#131A33;border-radius:8px;padding:20px;margin-bottom:20px;">
          <p style="color:#e2e8f0;font-size:14px;margin:0 0 8px;">Xin chào <strong>${data.customerName}</strong>,</p>
          <p style="color:#e2e8f0;font-size:14px;margin:0 0 8px;">Cảm ơn bạn đã liên hệ với Store3D.</p>
          <p style="color:#e2e8f0;font-size:14px;margin:0;">Chúng tôi đã nhận được yêu cầu hỗ trợ của bạn và bộ phận hỗ trợ sẽ kiểm tra trong thời gian sớm nhất.</p>
        </div>

        ${data.message ? `
        <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:20px;text-align:left;">
          <p style="color:#8FA3C4;font-size:12px;margin:0 0 8px;">Nội dung bạn đã gửi:</p>
          <p style="color:#e2e8f0;font-size:14px;margin:0;line-height:1.6;white-space:pre-wrap;">"${data.message}"</p>
        </div>
        ` : ''}

        <div style="background:#131A33;border-radius:8px;padding:16px;margin-bottom:20px;text-align:left;">
          <p style="color:#8FA3C4;font-size:13px;margin:0 0 4px;">Mã yêu cầu hỗ trợ: <span style="color:#4DE8FF;font-weight:bold;">#${data.ticketId}</span></p>
        </div>

        <div style="border-top:1px solid #1e293b;padding-top:16px;margin-top:8px;">
          <p style="color:#8FA3C4;font-size:12px;margin:0 0 4px;">Nếu cần bổ sung thông tin, bạn có thể tiếp tục liên hệ với Store3D.</p>
          <p style="color:#8FA3C4;font-size:12px;margin:8px 0 0;">Trân trọng,<br/><strong style="color:#e2e8f0;">Bộ phận hỗ trợ Store3D</strong></p>
        </div>
      </div>
    </div>
  </body>
  </html>`;

  return { subject, html };
}
