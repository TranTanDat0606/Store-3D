import type { SupportReplyEmailData } from '../email.service';

export function supportReplyTemplate(data: SupportReplyEmailData) {
  const subject = `[Store3D] Phản hồi yêu cầu hỗ trợ #${data.ticketId}`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#05070D;font-family:'Segoe UI',Tahoma,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#0A0E1F;border:1px solid #1e293b;border-radius:12px;padding:32px;">
        <h1 style="color:#4DE8FF;font-size:20px;margin:0 0 16px;text-align:center;">Store3D</h1>
        <p style="color:#8FA3C4;font-size:14px;margin:0 0 24px;text-align:center;">Phản hồi yêu cầu hỗ trợ</p>

        <div style="background:#131A33;border-radius:8px;padding:20px;margin-bottom:20px;">
          <p style="color:#e2e8f0;font-size:14px;margin:0 0 8px;">Xin chào <strong>${data.customerName}</strong>,</p>
          <p style="color:#e2e8f0;font-size:14px;margin:0 0 8px;">Chúng tôi là bộ phận hỗ trợ của Store3D.</p>
          <p style="color:#e2e8f0;font-size:14px;margin:0;">Store3D đã xem xét yêu cầu hỗ trợ của bạn.</p>
        </div>

        ${data.originalMessage ? `
        <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:16px;text-align:left;">
          <p style="color:#8FA3C4;font-size:12px;margin:0 0 8px;">Nội dung yêu cầu ban đầu:</p>
          <p style="color:#e2e8f0;font-size:14px;margin:0;line-height:1.6;white-space:pre-wrap;">"${data.originalMessage}"</p>
        </div>
        ` : ''}

        <div style="background:#131A33;border-radius:8px;padding:16px;margin-bottom:20px;text-align:left;">
          <p style="color:#8FA3C4;font-size:12px;margin:0 0 8px;">Hướng giải quyết:</p>
          <p style="color:#e2e8f0;font-size:14px;margin:0;line-height:1.6;white-space:pre-wrap;">${data.adminReply}</p>
        </div>

        <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:20px;text-align:left;">
          <p style="color:#e2e8f0;font-size:14px;margin:0;">Chúng tôi hy vọng hướng dẫn trên có thể giúp bạn giải quyết vấn đề.</p>
          <p style="color:#e2e8f0;font-size:14px;margin:8px 0 0;">Nếu bạn vẫn cần hỗ trợ thêm, vui lòng liên hệ lại với Store3D.</p>
        </div>

        <div style="border-top:1px solid #1e293b;padding-top:16px;margin-top:8px;">
          <p style="color:#e2e8f0;font-size:13px;margin:0 0 4px;">Cảm ơn bạn <strong>${data.customerName}</strong> đã sử dụng dịch vụ bên Store3D.</p>
          <p style="color:#8FA3C4;font-size:12px;margin:8px 0 0;">Trân trọng,<br/><strong style="color:#e2e8f0;">Bộ phận hỗ trợ Store3D</strong></p>
        </div>
      </div>
    </div>
  </body>
  </html>`;

  return { subject, html };
}
