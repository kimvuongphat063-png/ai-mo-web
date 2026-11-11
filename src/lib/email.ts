import "server-only";

/**
 * Email adapter for AI Mở.
 *
 * Production:  Resend API (requires RESEND_API_KEY).
 * Dev / demo:  console.log mock — no real emails sent.
 */

export interface SendResetEmailOpts {
  to: string;
  name: string;
  resetUrl: string;
}

export interface OrderItemSummary {
  slug?: string;
  title?: string;
  price?: number;
  quantity?: number;
  license?: string;
}

export interface SendOrderEmailOpts {
  to: string;
  name: string;
  orderId: string;
  total?: number;
  items: OrderItemSummary[];
  viewOrderUrl?: string;
}

function emailLayout(content: string, previewText: string = ""): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Mở</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFBFD; margin: 0; padding: 24px; color: #101828; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #E4E7EC; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #F2F4F7; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #101828; }
    .logo span { color: #155EEF; }
    .btn { display: inline-block; background-color: #155EEF; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #667085; line-height: 1.5; }
    .table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .table th { text-align: left; padding: 8px; border-bottom: 1px solid #E4E7EC; color: #475467; font-weight: 600; }
    .table td { padding: 10px 8px; border-bottom: 1px solid #F2F4F7; color: #101828; }
    .notice { background: #F8F9FC; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #475467; margin-top: 20px; line-height: 1.5; }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>` : ""}
  <div class="card">
    <div class="header">
      <div class="logo">AI <span>MỞ</span></div>
    </div>
    ${content}
  </div>
  <div class="footer">
    <p>AI Mở — Học AI bằng cách tạo ra thứ dùng được.</p>
    <p>Email này được gửi tự động. Vui lòng không trả lời trực tiếp.</p>
  </div>
</body>
</html>`;
}

export async function sendResetEmail(opts: SendResetEmailOpts): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:mock] Password reset for ${opts.name} <${opts.to}>:\n  ${opts.resetUrl}`);
    return true;
  }

  const html = emailLayout(
    `<h2 style="font-size: 18px; font-weight: 700; margin-top: 0; color: #101828;">Yêu cầu đặt lại mật khẩu</h2>
    <p style="font-size: 14px; color: #475467; line-height: 1.6;">Xin chào <strong>${opts.name}</strong>,</p>
    <p style="font-size: 14px; color: #475467; line-height: 1.6;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản AI Mở của bạn. Nhấn vào nút bên dưới để tiến hành tạo mật khẩu mới:</p>
    <div style="text-align: center;">
      <a href="${opts.resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Đặt lại mật khẩu</a>
    </div>
    <div class="notice">
      <strong>Lưu ý bảo mật:</strong> Liên kết này chỉ có hiệu lực trong <strong>1 giờ</strong>. Nếu bạn không gửi yêu cầu này, hãy yên tâm bỏ qua email — tài khoản của bạn vẫn an toàn.
    </div>`,
    "Yêu cầu đặt lại mật khẩu tài khoản AI Mở"
  );

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "AI Mở <no-reply@aimo.vn>",
      to: opts.to,
      subject: "Đặt lại mật khẩu — AI Mở",
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send reset email:", err);
    return false;
  }
}

export async function sendOrderConfirmationEmail(opts: SendOrderEmailOpts): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const viewUrl = opts.viewOrderUrl ?? `${baseUrl}/account/learning`;

  if (!apiKey) {
    console.log(`[email:mock] Order confirmation for ${opts.name} <${opts.to}> [${opts.orderId}]`);
    return true;
  }

  const itemsRows = opts.items
    .map(
      (item) => `<tr>
      <td><strong>${item.title || item.slug || "Sản phẩm số"}</strong>${item.license ? ` (${item.license})` : ""}</td>
      <td style="text-align: center;">${item.quantity ?? 1}</td>
      <td style="text-align: right;">${item.price ? `${item.price.toLocaleString("vi-VN")} ₫` : "Miễn phí"}</td>
    </tr>`
    )
    .join("");

  const totalDisplay = opts.total ? `${opts.total.toLocaleString("vi-VN")} ₫` : "";

  const html = emailLayout(
    `<h2 style="font-size: 18px; font-weight: 700; margin-top: 0; color: #101828;">Xác nhận đơn hàng thành công!</h2>
    <p style="font-size: 14px; color: #475467; line-height: 1.6;">Cảm ơn <strong>${opts.name}</strong> đã đăng ký khóa học / sản phẩm trên <strong>AI Mở</strong>.</p>
    
    <div style="background: #F8F9FC; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 13px; color: #475467;">Mã đơn hàng: <strong style="color: #101828;">${opts.orderId}</strong></p>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #475467;">Trạng thái: <span style="color: #15803D; font-weight: 700;">Đã hoàn thành</span></p>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Sản phẩm</th>
          <th style="text-align: center;">SL</th>
          <th style="text-align: right;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
      ${totalDisplay ? `<tfoot>
        <tr>
          <td colspan="2" style="font-weight: 700; padding-top: 12px;">Tổng cộng:</td>
          <td style="text-align: right; font-weight: 700; color: #155EEF; font-size: 15px; padding-top: 12px;">${totalDisplay}</td>
        </tr>
      </tfoot>` : ""}
    </table>

    <div style="text-align: center;">
      <a href="${viewUrl}" class="btn" target="_blank" rel="noopener noreferrer">Bắt đầu học ngay</a>
    </div>

    <div class="notice">
      Tài nguyên khóa học và ứng dụng đã được mở khóa tự động trong mục <strong>Học tập</strong> của tài khoản bạn.
    </div>`,
    `Xác nhận đơn hàng ${opts.orderId} — AI Mở`
  );

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "AI Mở <no-reply@aimo.vn>",
      to: opts.to,
      subject: `Xác nhận đơn hàng ${opts.orderId} — AI Mở`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send order confirmation email:", err);
    return false;
  }
}
