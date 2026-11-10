import "server-only";

/**
 * Email adapter.
 *
 * Production:  Resend API (requires RESEND_API_KEY).
 * Dev:         console.log mock — no real emails sent.
 */

export interface SendResetEmailOpts {
  to: string;
  name: string;
  resetUrl: string;
}

export async function sendResetEmail(opts: SendResetEmailOpts): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Dev / demo — log the link so developers can test the flow.
    console.log(
      `[email:mock] Password reset for ${opts.name} <${opts.to}>:\n  ${opts.resetUrl}`,
    );
    return true;
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "AI Mở <no-reply@aimo.vn>",
      to: opts.to,
      subject: "Đặt lại mật khẩu — AI Mở",
      html: `<p>Xin chào ${opts.name},</p>
<p>Nhấn vào liên kết bên dưới để đặt lại mật khẩu. Liên kết hết hạn sau 1 giờ.</p>
<p><a href="${opts.resetUrl}">Đặt lại mật khẩu</a></p>
<p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>`,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send reset email:", err);
    return false;
  }
}
