/**
 * PromptKichBan — Live Performance & Latency Benchmark (Phase 3E)
 *
 * Runs >= 10 live requests against VietAPI / real LLM providers across diverse
 * realistic video scripting scenarios.
 *
 * Scenarios tested:
 *   1. Review iPhone
 *   2. Video bán hàng (Sales)
 *   3. Tips công nghệ (Tips & Tricks)
 *   4. Storytelling (Narrative)
 *   5. TVC (Brand Commercial)
 *   6. Short Input (~30 chars)
 *   7. Medium Input (~200 chars)
 *   8. Long Input (~800 chars)
 *   9. 30 Seconds Duration
 *  10. 60 Seconds Duration
 *
 * Computes: Min, Avg, P50, P95, Max latency, Token counts, Error rate.
 *
 * Usage:
 *   npx tsx scripts/benchmark-promptkichban.ts
 *   npx tsx scripts/benchmark-promptkichban.ts --model deepseek-v4-flash
 *   npx tsx scripts/benchmark-promptkichban.ts --model deepseek-v4.1-flash
 *   npx tsx scripts/benchmark-promptkichban.ts --compare
 */

import "server-only";

// Auto-load .env.local if present
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Ignore
  }
}

import {
  getPromptKichBanEnv,
  getLastAiExecutionMeta,
  PromptKichBanError,
} from "../src/lib/promptkichban/ai";
import {
  type PromptKichBanInput,
  videoPromptOutputSchema,
} from "../src/lib/promptkichban/schema";
import { generatePromptKichBan } from "../src/lib/promptkichban/service";

// ─────────────────────────────────────────────────────────────────────────────
// 10 Diverse Test Fixtures
// ─────────────────────────────────────────────────────────────────────────────

interface BenchmarkFixture {
  id: string;
  name: string;
  input: PromptKichBanInput;
}

const BENCHMARK_FIXTURES: BenchmarkFixture[] = [
  {
    id: "01-review-iphone",
    name: "Review iPhone",
    input: {
      inputText:
        "Review chi tiết iPhone 15 Pro Max màu titan tự nhiên sau 6 tháng sử dụng thực tế: đánh giá viền titan chống xước, camera tiềm vọng zoom 5x quang học và thời lượng pin.",
      contentType: "product-review",
      visualStyle: "tech-cinematic",
      publishingPlatform: "tiktok",
      promptModel: "all",
      aspectRatio: "9:16",
      durationSeconds: 30,
      voiceGender: "male",
      voiceRegion: "south",
      voiceAge: "young",
      voiceRole: "reviewer",
      speakingSpeed: "normal",
      emotion: "friendly",
      language: "vi",
      tone: "Chân thực, khách quan, giàu trải nghiệm",
      callToAction: "Bấm vào giỏ hàng hoặc comment để nhận báo giá máy lướt tốt nhất!",
    },
  },
  {
    id: "02-video-ban-hang",
    name: "Video bán hàng",
    input: {
      inputText:
        "Xả kho siêu sale tai nghe không dây chống ồn chủ động ANC 40dB, pin trâu 40 giờ, chuẩn chống nước IPX5, giá gốc 899k giảm sốc chỉ còn 299k duy nhất hôm nay tặng kèm case silicon.",
      contentType: "sales",
      visualStyle: "ugc",
      publishingPlatform: "tiktok",
      promptModel: "all",
      aspectRatio: "9:16",
      durationSeconds: 30,
      voiceGender: "female",
      voiceRegion: "north",
      voiceAge: "young",
      voiceRole: "seller",
      speakingSpeed: "fast",
      emotion: "urgent",
      language: "vi",
      tone: "Sôi động, kích thích chốt đơn ngay lập tức",
      callToAction: "Số lượng chỉ còn đúng 50 suất, chạm ngay góc trái màn hình!",
    },
  },
  {
    id: "03-tips-cong-nghe",
    name: "Tips công nghệ",
    input: {
      inputText:
        "3 mẹo ẩn trên smartphone giúp tăng gấp đôi tốc độ mạng wifi, dọn dẹp bộ nhớ đệm giải phóng 10GB và kéo dài tuổi thọ pin mà 99% người dùng không hề hay biết.",
      contentType: "tips",
      visualStyle: "clean-commercial",
      publishingPlatform: "shorts",
      promptModel: "all",
      aspectRatio: "9:16",
      durationSeconds: 30,
      voiceGender: "male",
      voiceRegion: "south",
      voiceAge: "middle",
      voiceRole: "expert",
      speakingSpeed: "normal",
      emotion: "informative",
      language: "vi",
      tone: "Rõ ràng, trực quan, đáng tin cậy",
      callToAction: "Lưu lại ngay để thực hành và theo dõi kênh để biết thêm mẹo hay!",
    },
  },
  {
    id: "04-storytelling",
    name: "Storytelling",
    input: {
      inputText:
        "Hành trình của một bạn trẻ từ bỏ công việc văn phòng gò bó để theo đuổi đam mê mở xưởng gốm thủ công mộc mạc, đối mặt vô vàn khó khăn và tìm lại bình yên trong từng sản phẩm.",
      contentType: "storytelling",
      visualStyle: "documentary",
      publishingPlatform: "reels",
      promptModel: "all",
      aspectRatio: "9:16",
      durationSeconds: 45,
      voiceGender: "female",
      voiceRegion: "central",
      voiceAge: "young",
      voiceRole: "storyteller",
      speakingSpeed: "slow",
      emotion: "inspiring",
      language: "vi",
      tone: "Truyền cảm, sâu lắng, chân thành",
      callToAction: "Nếu bạn cũng đang ấp ủ ước mơ, hãy để lại một trái tim cổ vũ nhé!",
    },
  },
  {
    id: "05-tvc",
    name: "TVC",
    input: {
      inputText:
        "Phim ngắn quảng cáo TVC thương hiệu trang sức kim cương cao cấp Aura Diamond. Tôn vinh vẻ đẹp vĩnh cửu, sự kiêu hãnh và khí chất sang trọng của người phụ nữ tự chủ thế kỷ 21.",
      contentType: "tvc",
      visualStyle: "luxury",
      publishingPlatform: "facebook",
      promptModel: "all",
      aspectRatio: "16:9",
      durationSeconds: 30,
      voiceGender: "female",
      voiceRegion: "north",
      voiceAge: "middle",
      voiceRole: "narrator",
      speakingSpeed: "normal",
      emotion: "dramatic",
      language: "vi",
      tone: "Sang trọng, đẳng cấp, cuốn hút",
      callToAction: "Khám phá bộ sưu tập Eternal Shine tại các showroom toàn quốc.",
    },
  },
  {
    id: "06-input-ngan",
    name: "Input ngắn",
    input: {
      inputText: "Son dưỡng môi thuần chay từ bơ hạt mỡ dưỡng ẩm sâu 24 giờ.",
      contentType: "product-review",
      visualStyle: "ugc",
      publishingPlatform: "tiktok",
      promptModel: "all",
      aspectRatio: "9:16",
      durationSeconds: 20,
      voiceGender: "female",
      voiceRegion: "south",
      voiceAge: "young",
      voiceRole: "friend",
      speakingSpeed: "normal",
      emotion: "friendly",
      language: "vi",
      tone: "Tự nhiên, gần gũi",
      callToAction: "Nhấp vào giỏ hàng thử ngay!",
    },
  },
  {
    id: "07-input-trung-binh",
    name: "Input trung bình",
    input: {
      inputText:
        "Hướng dẫn setup góc làm việc tối giản công thái học tại nhà cho freelancer: bàn nâng hạ thông minh chống đau lưng, ghế lưới thoáng khí, đèn treo màn hình bảo vệ mắt và nghệ thuật giấu dây cáp gọn gàng tinh tế.",
      contentType: "tips",
      visualStyle: "tech-cinematic",
      publishingPlatform: "tiktok",
      promptModel: "all",
      aspectRatio: "9:16",
      durationSeconds: 30,
      voiceGender: "male",
      voiceRegion: "south",
      voiceAge: "young",
      voiceRole: "creator",
      speakingSpeed: "normal",
      emotion: "informative",
      language: "vi",
      tone: "Hiện đại, thẩm mỹ, khơi gợi cảm hứng sáng tạo",
      callToAction: "Follow mình để xem thêm các layout setup bàn làm việc đẹp mắt!",
    },
  },
  {
    id: "08-input-dai",
    name: "Input dài",
    input: {
      inputText:
        "Chiến dịch chào mừng tuần lễ khai trương cơ sở thứ 10 của chuỗi phòng gym công nghệ FitTech Studio tại TP.HCM. Ứng dụng công nghệ quét cơ thể 3D phân tích chỉ số trong 15 giây, máy tập EMS kích thích cơ bắp tối đa chỉ với 20 phút tập luyện mỗi buổi tương đương 2 giờ tập gym truyền thống, có huấn luyện viên 1 kèm 1 đạt chuẩn quốc tế. Ưu đãi độc quyền khai trương: Giảm 50% gói tập năm, tặng 3 buổi đo inbody và lên thực đơn dinh dưỡng chuyên sâu, cơ hội bốc thăm xe máy điện VinFast. Địa chỉ số 88 đường Nguyễn Huệ, Quận 1. Đặt lịch trải nghiệm miễn phí ngay hôm nay qua link bên dưới để nhận trọn bộ quà tặng!",
      contentType: "sales",
      visualStyle: "energetic-social",
      publishingPlatform: "tiktok",
      promptModel: "all",
      aspectRatio: "9:16",
      durationSeconds: 45,
      voiceGender: "male",
      voiceRegion: "south",
      voiceAge: "young",
      voiceRole: "coach",
      speakingSpeed: "fast",
      emotion: "motivational",
      language: "vi",
      tone: "Năng động, bùng nổ năng lượng, thuyết phục mạnh mẽ",
      callToAction: "Đăng ký trải nghiệm tập thử EMS miễn phí ngay góc trái màn hình!",
    },
  },
  {
    id: "09-30-giay",
    name: "30 giây",
    input: {
      inputText:
        "Mở hộp và trải nghiệm chuột công thái học không dây Logitech MX Master 3S: con lăn vô cực từ tính MagSpeed, click chuột tĩnh âm 90%, cảm biến hoạt động tốt trên mặt kính dày 4mm.",
      contentType: "product-review",
      visualStyle: "tech-cinematic",
      publishingPlatform: "tiktok",
      promptModel: "all",
      aspectRatio: "9:16",
      durationSeconds: 30,
      voiceGender: "male",
      voiceRegion: "north",
      voiceAge: "young",
      voiceRole: "reviewer",
      speakingSpeed: "normal",
      emotion: "friendly",
      language: "vi",
      tone: "Tinh tế, chú trọng công nghệ và hiệu suất",
      callToAction: "Link chuột chính hãng mình để ở bio nhé!",
    },
  },
  {
    id: "10-60-giay",
    name: "60 giây",
    input: {
      inputText:
        "Kịch bản video dài 60 giây khám phá câu chuyện ra đời của ngôn ngữ lập trình Python và triết lý Thiết kế Đơn giản hơn Phức tạp (Zen of Python). Từ một dự án sở thích trong kỳ nghỉ Giáng sinh năm 1989 của Guido van Rossum đến ngôn ngữ thống trị kỷ nguyên Trí tuệ nhân tạo (AI & Data Science) trên toàn cầu ngày nay.",
      contentType: "storytelling",
      visualStyle: "documentary",
      publishingPlatform: "youtube",
      promptModel: "all",
      aspectRatio: "16:9",
      durationSeconds: 60,
      voiceGender: "male",
      voiceRegion: "south",
      voiceAge: "middle",
      voiceRole: "narrator",
      speakingSpeed: "normal",
      emotion: "inspiring",
      language: "vi",
      tone: "Tri thức, học thuật nhưng gần gũi và hấp dẫn",
      callToAction: "Đừng quên like và subscribe kênh để cùng khám phá thêm những câu chuyện công nghệ thú vị!",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Result Tracking & Metrics Types
// ─────────────────────────────────────────────────────────────────────────────

interface BenchmarkResult {
  fixtureId: string;
  name: string;
  requestId: string;
  model: string;
  status: "PASS" | "FAIL" | "TIMEOUT";
  latencyMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  sceneCount: number;
  schemaValid: boolean;
  timeout: boolean;
  errorMessage?: string;
}

interface BenchmarkSummary {
  model: string;
  total: number;
  passed: number;
  failed: number;
  errorRatePercent: number;
  minLatencyMs: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  maxLatencyMs: number;
  avgPromptTokens: number;
  avgCompletionTokens: number;
  avgTotalTokens: number;
}

function calculatePercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
}

function computeSummary(model: string, results: BenchmarkResult[]): BenchmarkSummary {
  const passedResults = results.filter((r) => r.status === "PASS");
  const latencies = passedResults.map((r) => r.latencyMs).sort((a, b) => a - b);
  const total = results.length;
  const passed = passedResults.length;
  const failed = total - passed;
  const errorRatePercent = total > 0 ? (failed / total) * 100 : 0;

  const minLatencyMs = latencies.length > 0 ? latencies[0] : 0;
  const maxLatencyMs = latencies.length > 0 ? latencies[latencies.length - 1] : 0;
  const avgLatencyMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((sum, v) => sum + v, 0) / latencies.length)
      : 0;
  const p50LatencyMs = calculatePercentile(latencies, 50);
  const p95LatencyMs = calculatePercentile(latencies, 95);

  const promptTokensList = passedResults
    .map((r) => r.promptTokens)
    .filter((v): v is number => typeof v === "number");
  const completionTokensList = passedResults
    .map((r) => r.completionTokens)
    .filter((v): v is number => typeof v === "number");
  const totalTokensList = passedResults
    .map((r) => r.totalTokens)
    .filter((v): v is number => typeof v === "number");

  const avgPromptTokens =
    promptTokensList.length > 0
      ? Math.round(
          promptTokensList.reduce((sum, v) => sum + v, 0) / promptTokensList.length
        )
      : 0;

  const avgCompletionTokens =
    completionTokensList.length > 0
      ? Math.round(
          completionTokensList.reduce((sum, v) => sum + v, 0) /
            completionTokensList.length
        )
      : 0;

  const avgTotalTokens =
    totalTokensList.length > 0
      ? Math.round(
          totalTokensList.reduce((sum, v) => sum + v, 0) / totalTokensList.length
        )
      : 0;

  return {
    model,
    total,
    passed,
    failed,
    errorRatePercent,
    minLatencyMs,
    avgLatencyMs,
    p50LatencyMs,
    p95LatencyMs,
    maxLatencyMs,
    avgPromptTokens,
    avgCompletionTokens,
    avgTotalTokens,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Benchmark Runner
// ─────────────────────────────────────────────────────────────────────────────

async function runBenchmarkForModel(
  targetModel: string,
  fixtures: BenchmarkFixture[]
): Promise<{ results: BenchmarkResult[]; summary: BenchmarkSummary }> {
  process.env.PROMPTKICHBAN_AI_MODEL = targetModel;
  const env = getPromptKichBanEnv();

  console.log(`\n==============================================================`);
  console.log(`  RUNNING BENCHMARK ON MODEL: ${targetModel}`);
  console.log(`  Provider: ${env.provider} | Timeout: ${env.timeoutMs}ms | Retries: ${env.maxRetries}`);
  console.log(`==============================================================`);

  const results: BenchmarkResult[] = [];

  for (let i = 0; i < fixtures.length; i++) {
    const fixture = fixtures[i];
    const prefix = `[${i + 1}/${fixtures.length}] ${fixture.name.padEnd(20)}`;
    const startMs = Date.now();

    try {
      const output = await generatePromptKichBan(fixture.input);
      const latencyMs = Date.now() - startMs;
      const meta = getLastAiExecutionMeta();

      // Validate schema compliance explicitly
      const schemaCheck = videoPromptOutputSchema.safeParse(output);
      const schemaValid = schemaCheck.success;

      const result: BenchmarkResult = {
        fixtureId: fixture.id,
        name: fixture.name,
        requestId: output.requestId || "unknown",
        model: meta?.model || targetModel,
        status: schemaValid ? "PASS" : "FAIL",
        latencyMs,
        promptTokens: meta?.promptTokens ?? null,
        completionTokens: meta?.completionTokens ?? null,
        totalTokens: meta?.totalTokens ?? null,
        sceneCount: output.scenes?.length || 0,
        schemaValid,
        timeout: false,
      };

      results.push(result);

      console.log(
        `${prefix} -> ${result.status} | ${latencyMs}ms | scenes: ${result.sceneCount} | tokens: in=${result.promptTokens ?? "?"}, out=${result.completionTokens ?? "?"} | schema: ${schemaValid ? "VALID" : "INVALID"}`
      );
    } catch (err: any) {
      const latencyMs = Date.now() - startMs;
      const isTimeout =
        (err instanceof PromptKichBanError && err.code === "timeout") ||
        (err instanceof Error && err.message.toLowerCase().includes("timeout"));

      const result: BenchmarkResult = {
        fixtureId: fixture.id,
        name: fixture.name,
        requestId: err instanceof PromptKichBanError ? err.requestId : "failed",
        model: targetModel,
        status: isTimeout ? "TIMEOUT" : "FAIL",
        latencyMs,
        promptTokens: null,
        completionTokens: null,
        totalTokens: null,
        sceneCount: 0,
        schemaValid: false,
        timeout: isTimeout,
        errorMessage: err instanceof Error ? err.message : String(err),
      };

      results.push(result);
      console.log(
        `${prefix} -> ${result.status} | ${latencyMs}ms | Error: ${result.errorMessage?.slice(0, 100)}`
      );
    }
  }

  const summary = computeSummary(targetModel, results);
  return { results, summary };
}

// ─────────────────────────────────────────────────────────────────────────────
// Output Formatting & Machine-Readable Summary
// ─────────────────────────────────────────────────────────────────────────────

function printSummaryTable(summary: BenchmarkSummary) {
  console.log(`\n--------------------------------------------------------------`);
  console.log(`BENCHMARK SUMMARY FOR MODEL: ${summary.model}`);
  console.log(`--------------------------------------------------------------`);
  console.log(`Total Requests:         ${summary.total}`);
  console.log(`Passed Requests:        ${summary.passed}`);
  console.log(`Failed Requests:        ${summary.failed}`);
  console.log(`Error Rate:             ${summary.errorRatePercent.toFixed(1)}%`);
  console.log(`Min Latency:            ${summary.minLatencyMs} ms (${(summary.minLatencyMs / 1000).toFixed(2)}s)`);
  console.log(`Avg Latency:            ${summary.avgLatencyMs} ms (${(summary.avgLatencyMs / 1000).toFixed(2)}s)`);
  console.log(`P50 (Median) Latency:   ${summary.p50LatencyMs} ms (${(summary.p50LatencyMs / 1000).toFixed(2)}s)`);
  console.log(`P95 Latency:            ${summary.p95LatencyMs} ms (${(summary.p95LatencyMs / 1000).toFixed(2)}s)`);
  console.log(`Max Latency:            ${summary.maxLatencyMs} ms (${(summary.maxLatencyMs / 1000).toFixed(2)}s)`);
  console.log(`Avg Prompt Tokens:      ${summary.avgPromptTokens}`);
  console.log(`Avg Completion Tokens:  ${summary.avgCompletionTokens}`);
  console.log(`Avg Total Tokens:       ${summary.avgTotalTokens}`);
  console.log(`--------------------------------------------------------------`);

  // Machine-readable key-values
  console.log(`BENCHMARK_STATUS=${summary.failed === 0 ? "PASS" : "FAIL"}`);
  console.log(`BENCHMARK_MODEL=${summary.model}`);
  console.log(`BENCHMARK_TOTAL_REQUESTS=${summary.total}`);
  console.log(`BENCHMARK_PASSED_REQUESTS=${summary.passed}`);
  console.log(`BENCHMARK_LATENCY_MIN_MS=${summary.minLatencyMs}`);
  console.log(`BENCHMARK_LATENCY_AVG_MS=${summary.avgLatencyMs}`);
  console.log(`BENCHMARK_LATENCY_P50_MS=${summary.p50LatencyMs}`);
  console.log(`BENCHMARK_LATENCY_P95_MS=${summary.p95LatencyMs}`);
  console.log(`BENCHMARK_LATENCY_MAX_MS=${summary.maxLatencyMs}`);
  console.log(`BENCHMARK_ERROR_RATE=${summary.errorRatePercent.toFixed(1)}%`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isCompare = args.includes("--compare");
  let targetModel = "deepseek-v4-flash";

  const modelIdx = args.indexOf("--model");
  if (modelIdx !== -1 && args[modelIdx + 1]) {
    targetModel = args[modelIdx + 1];
  } else if (process.env.PROMPTKICHBAN_AI_MODEL) {
    targetModel = process.env.PROMPTKICHBAN_AI_MODEL;
  }

  const env = getPromptKichBanEnv();
  if (env.provider !== "vietapi") {
    console.error(`Error: Provider is currently set to "${env.provider}". Set PROMPTKICHBAN_AI_PROVIDER=vietapi.`);
    process.exit(1);
  }

  if (isCompare) {
    console.log(`[Benchmark] Running model comparison across: deepseek-v4-flash, glm-5.2, qwen-3.8-max`);
    // Sample 2 core fixtures for rapid side-by-side comparison
    const sampleFixtures = BENCHMARK_FIXTURES.slice(0, 2);
    const candidateModels = ["deepseek-v4-flash", "glm-5.2", "qwen-3.8-max"];
    const comparisonSummaries: BenchmarkSummary[] = [];

    for (const m of candidateModels) {
      const { summary } = await runBenchmarkForModel(m, sampleFixtures);
      comparisonSummaries.push(summary);
      printSummaryTable(summary);
    }

    console.log(`\n==============================================================`);
    console.log(`  MODEL COMPARISON MATRIX`);
    console.log(`==============================================================`);
    console.log(`Model               | Pass | Avg Latency | P50 Latency | Avg Tokens`);
    console.log(`--------------------+------+-------------+-------------+-----------`);
    for (const s of comparisonSummaries) {
      console.log(
        `${s.model.padEnd(19)} | ${s.passed}/${s.total}  | ${(s.avgLatencyMs / 1000).toFixed(1)}s        | ${(s.p50LatencyMs / 1000).toFixed(1)}s        | ${s.avgCompletionTokens}`
      );
    }
    return;
  }

  // Full 10-fixture benchmark for targetModel
  const { summary } = await runBenchmarkForModel(targetModel, BENCHMARK_FIXTURES);
  printSummaryTable(summary);

  if (summary.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Benchmark execution error:", err);
  process.exit(1);
});
