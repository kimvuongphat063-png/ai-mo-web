import "server-only";

/**
 * Safe Observability & Metrics for PromptKichBan (Phase 5A)
 *
 * Provides structured telemetry without ever logging:
 * - API keys or secrets
 * - Full user input prompt text
 * - Full output storyboard/script text
 * - Database credentials or connection URLs
 * - Passwords, hashes, or session tokens
 */

export interface SafeMetricEvent {
  timestamp: string;
  requestId: string;
  event: "generate" | "regenerate_scene" | "save_document" | "update_document" | "delete_document";
  status: "success" | "error";
  statusCode: number;
  provider: string;
  model: string;
  latencyMs: number;
  sceneCount?: number;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  errorCode?: string;
  quotaRemaining?: number;
  clientIpHash?: string;
}

export interface MetricsSummary {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  errorsByCode: Record<string, number>;
  avgLatencyMs: number;
  totalTokensConsumed: number;
}

// In-memory ring buffer of recent metrics (last 100 requests) for runtime health checks
const metricHistory: SafeMetricEvent[] = [];
const MAX_HISTORY = 100;

/**
 * Records a safe metric event. Outputs structured JSON log and updates in-memory counters.
 */
export function recordSafeMetric(event: Omit<SafeMetricEvent, "timestamp">): SafeMetricEvent {
  const record: SafeMetricEvent = {
    timestamp: new Date().toISOString(),
    ...event,
  };

  // Keep ring buffer bounded
  if (metricHistory.length >= MAX_HISTORY) {
    metricHistory.shift();
  }
  metricHistory.push(record);

  // Structured console log for standard observability ingestion (Vercel / Datadog / CloudWatch)
  const logPrefix = record.status === "success" ? "[PROMPTKICHBAN_METRIC]" : "[PROMPTKICHBAN_ERROR_METRIC]";
  const logLine = `${logPrefix} ${JSON.stringify(record)}`;

  if (record.status === "success") {
    console.info(logLine);
  } else {
    console.warn(logLine);
  }

  return record;
}

/**
 * Returns aggregated in-memory metrics for diagnostics and health reporting.
 */
export function getMetricsSummary(): MetricsSummary {
  const totalRequests = metricHistory.length;
  let successCount = 0;
  let totalLatency = 0;
  let totalTokens = 0;
  const errorsByCode: Record<string, number> = {};

  for (const item of metricHistory) {
    if (item.status === "success") {
      successCount++;
    } else if (item.errorCode) {
      errorsByCode[item.errorCode] = (errorsByCode[item.errorCode] || 0) + 1;
    }
    totalLatency += item.latencyMs;
    totalTokens += item.totalTokens || 0;
  }

  return {
    totalRequests,
    successCount,
    errorCount: totalRequests - successCount,
    errorsByCode,
    avgLatencyMs: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
    totalTokensConsumed: totalTokens,
  };
}

/**
 * Resets metrics for testing purposes.
 */
export function _resetMetricsForTesting(): void {
  metricHistory.length = 0;
}
