import type { SupportReplyEmailData } from '../email.service';

export function supportReplyTemplate(data: SupportReplyEmailData) {
  const subject = `Store3D — Phản hồi yêu cầu hỗ trợ #${data.ticketId}`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#05070D;font-family:'Segoe UI',Tahoma,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#0A0E1F;border:1px solid #1e293b;border-radius:12px;padding:32px;text-align:center;">
        <h1 style="color:#4DE8FF;font-size:24px;margin:0 0 8px;">Store3D</h1>
        <p style="color:#8FA3C4;font-size:14px;margin:0 0 24px;">Phản hỗ trợ</p>

        <div style="background:#131A33;border-radius:8px;padding:20px;margin-bottom:20px;">
          <p style="color:#4DE8FF;font-size:16px;margin:0 0 4px;">Phản hồi yêu cầu hỗ trợ</p>
          <p style="color:#e2e8f0;font-size:14px;margin:0;">Chúng tôi đã phản hồi yêu cầu của bạn.</p>
        </div>

        <div style="text-align:left;margin-bottom:20px;">
          <p style="color:#8FA3C4;font-size:13px;margin:0 0 4px;">Mã phiếu: <span style="color:#e2e8f0;font-weight:bold;">#${data.ticketId}</span></p>
          <p style="color:#8FA3C4;font-size:13px;margin:0 0 4px;">Chủ đề: <span style="color:#e2e8f0;">${data.subject}</span></p>
        </div>

        <div style="background:#0f172a;border-radius:8px;padding:16px;text-align:left;margin-bottom:20px;">
          <p style="color:#8FA3C4;font-size:12px;margin:0 0 8px;">Phản hồi từ Store3D:</p>
          <p style="color:#e2e8f0;font-size:14px;margin:0;line-height:1.6;white-space:pre-wrap;">${data.adminReply}</p>
        </div>

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1e293b;">
          <p style="color:#8FA3C4;font-size:12px;margin:0;">Đội ngũ hỗ trợ Store3D</p>
        </div>
      </div>
    </div>
  </body>
  </html>`;

  return { subject, html };
}
