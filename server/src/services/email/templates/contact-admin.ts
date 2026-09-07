import type { ContactAdminEmailData } from '../email.service';

export function contactAdminTemplate(data: ContactAdminEmailData) {
  const subject = `Store3D — Liên hệ mới từ ${data.contactName}`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#05070D;font-family:'Segoe UI',Tahoma,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:#0A0E1F;border:1px solid #1e293b;border-radius:12px;padding:32px;">
        <h1 style="color:#4DE8FF;font-size:20px;margin:0 0 16px;text-align:center;">Store3D — Liên hệ mới</h1>

        <div style="background:#131A33;border-radius:8px;padding:16px;margin-bottom:16px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:4px 0;color:#8FA3C4;font-size:13px;width:100px;">Họ tên:</td>
              <td style="padding:4px 0;color:#e2e8f0;font-size:13px;">${data.contactName}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#8FA3C4;font-size:13px;">Email:</td>
              <td style="padding:4px 0;color:#e2e8f0;font-size:13px;">${data.contactEmail}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#8FA3C4;font-size:13px;">Điện thoại:</td>
              <td style="padding:4px 0;color:#e2e8f0;font-size:13px;">${data.contactPhone}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#8FA3C4;font-size:13px;">Chủ đề:</td>
              <td style="padding:4px 0;color:#e2e8f0;font-size:13px;">${data.subject}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#8FA3C4;font-size:13px;">Thời gian:</td>
              <td style="padding:4px 0;color:#e2e8f0;font-size:13px;">${data.submittedAt}</td>
            </tr>
          </table>
        </div>

        <div style="background:#0f172a;border-radius:8px;padding:16px;text-align:left;">
          <p style="color:#8FA3C4;font-size:12px;margin:0 0 8px;">Nội dung liên hệ:</p>
          <p style="color:#e2e8f0;font-size:14px;margin:0;line-height:1.6;white-space:pre-wrap;">${data.message}</p>
        </div>
      </div>
    </div>
  </body>
  </html>`;

  return { subject, html };
}
