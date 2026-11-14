import "server-only";

export interface LeadData {
  name?: string | null;
  email: string;
  phone?: string | null;
  intent?: string | null;
  method?: string; // "web_form" | "google_oauth"
  createdAt?: string;
  source?: string;
}

/**
 * Real-time synchronization to Google Sheet via Webhook (Google Apps Script).
 * Google Sheet target: https://docs.google.com/spreadsheets/d/1Zfg-amVnsiQJCCr-Ea3IK4rAAwSkHOcqreBnTTsQTug/edit
 */
export async function syncLeadToGoogleSheet(lead: LeadData): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  const payload = {
    timestamp: lead.createdAt || new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
    name: lead.name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    intent: lead.intent || "Tất cả công cụ",
    method: lead.method || "Form đăng ký website",
    source: lead.source || "AI MỞ Platform (heyaimo.com)",
    sheetId: "1Zfg-amVnsiQJCCr-Ea3IK4rAAwSkHOcqreBnTTsQTug",
  };

  console.log("[lead-sync] New registration lead captured:", {
    email: payload.email,
    phone: payload.phone,
    name: payload.name,
    method: payload.method,
  });

  if (!webhookUrl) {
    console.warn(
      "[lead-sync] GOOGLE_SHEET_WEBHOOK_URL is not set. Data logged locally. Set webhook URL in Vercel to sync into sheet 1Zfg-amVnsiQJCCr-Ea3IK4rAAwSkHOcqreBnTTsQTug."
    );
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn(`[lead-sync] Google Sheet webhook returned status ${res.status}`);
      return false;
    }
    console.log("[lead-sync] Successfully synced lead to Google Sheet!");
    return true;
  } catch (err) {
    console.error("[lead-sync] Error posting to Google Sheet webhook:", err);
    return false;
  }
}
