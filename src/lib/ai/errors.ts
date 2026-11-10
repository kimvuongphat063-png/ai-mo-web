/** Machine-readable AI failure codes, mapped to user-facing Vietnamese copy. */
export type AiErrorCode =
  | "config"
  | "timeout"
  | "rate_limit"
  | "quota"
  | "upstream"
  | "invalid_response"
  | "unknown";

const USER_MESSAGE: Record<AiErrorCode, string> = {
  config:
    "Dịch vụ AI chưa được cấu hình đúng. Vui lòng liên hệ quản trị viên.",
  timeout:
    "AI phản hồi quá lâu nên đã dừng. Vui lòng thử lại sau ít phút.",
  rate_limit:
    "Nhà cung cấp AI đang quá tải. Vui lòng thử lại sau ít phút.",
  quota:
    "Bạn đã dùng hết lượt tạo nội dung AI trong hôm nay. Hạn mức sẽ được đặt lại vào ngày mai.",
  upstream:
    "Dịch vụ AI đang gặp sự cố. Vui lòng thử lại sau.",
  invalid_response:
    "AI trả về dữ liệu không hợp lệ. Vui lòng thử lại — nội dung đã bị từ chối để đảm bảo chất lượng.",
  unknown: "Không thể tạo nội dung. Vui lòng thử lại.",
};

const STATUS: Record<AiErrorCode, number> = {
  config: 503,
  timeout: 504,
  rate_limit: 429,
  quota: 429,
  upstream: 502,
  invalid_response: 502,
  unknown: 500,
};

export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly retryable: boolean;
  readonly userMessage: string;
  readonly status: number;
  readonly details?: string;

  constructor(code: AiErrorCode, options?: { cause?: unknown; details?: string }) {
    super(`AiError(${code})`, options?.cause ? { cause: options.cause } : undefined);
    this.name = "AiError";
    this.code = code;
    this.retryable = code === "timeout" || code === "rate_limit" || code === "upstream";
    this.userMessage = USER_MESSAGE[code];
    this.status = STATUS[code];
    this.details = options?.details;
  }
}

export function toAiError(err: unknown): AiError {
  if (err instanceof AiError) return err;
  if (err instanceof Error && err.name === "AiConfigError") {
    return new AiError("config", { cause: err, details: err.message });
  }
  if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
    return new AiError("timeout", { cause: err });
  }
  return new AiError("unknown", { cause: err });
}

/** Response body for API routes. Never leaks provider internals to the client. */
export function aiErrorBody(err: AiError) {
  return {
    error: err.userMessage,
    code: err.code,
    retryable: err.retryable,
  };
}
