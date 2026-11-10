# HƯỚNG DẪN TOÀN DIỆN: ĐÓNG GÓI DESKTOP APP THƯƠNG MẠI HÓA & TÍCH HỢP TỰ ĐỘNG SINH VIDEO (VEO, GROK, SEEDANCE, MUSE, KLING)

> **Tài liệu tham chiếu kiến trúc kỹ thuật & thương mại hóa**  
> **Dự án gốc:** `ai-mo-web-workplace` (AI Mở Universal Video Prompt Studio)  
> **Mục tiêu:** Chuyển đổi Web App Next.js hiện tại thành ứng dụng Desktop hoàn chỉnh (Windows `.exe` / macOS `.dmg`), hỗ trợ người dùng nhập API Key để tự động sinh video từng phân cảnh và ghép nối thành phẩm qua FFmpeg.  
> **Ngày lập:** 08/11/2026  

---

## MỤC LỤC
1. [Chiến lược Thương mại hóa & Mô hình Kinh doanh](#1-chiến-lược-thương-mại-hóa--mô-hình-kinh-doanh)
2. [Kiến trúc Desktop App: Tại sao chọn Tauri v2 thay vì Electron?](#2-kiến-trúc-desktop-app-tại-sao-chọn-tauri-v2-thay-vì-electron)
3. [Tích hợp Video Generation API (Google Veo, Grok, Seedance, Kling, Fal.ai)](#3-tích-hợp-video-generation-api-google-veo-grok-seedance-kling-falai)
4. [Động cơ Ghép Video & Âm thanh Tự động (FFmpeg Local Sidecar Engine)](#4-động-cơ-ghép-video--âm-thanh-tự-động-ffmpeg-local-sidecar-engine)
5. [Hệ thống Bản quyền & Quản lý License Khóa máy (Machine ID Locking)](#5-hệ-thống-bản-quyền--quản-lý-license-khóa-máy-machine-id-locking)
6. [Lộ trình Triển khai Kỹ thuật Từng bước (Step-by-step Setup)](#6-lộ-trình-triển-khai-kỹ-thuật-từng-bước-step-by-step-setup)
7. [Mã nguồn Tham chiếu Hoàn chỉnh (Reference Code)](#7-mã-nguồn-tham-chiếu-hoàn-chỉnh-reference-code)

---

## 1. Chiến lược Thương mại hóa & Mô hình Kinh doanh

Khi đưa sản phẩm từ Web lên Desktop App, giá trị cảm nhận (Perceived Value) của khách hàng tăng vọt từ một "trang web" thành một "phần mềm chuyên nghiệp".

### 1.1. Ba mô hình kinh doanh khả thi

| Tiêu chí | Mô hình 1: BYOK (Khuyên dùng giai đoạn đầu) | Mô hình 2: Bán gói Credits (SaaS) | Mô hình 3: Hybrid (Kết hợp) |
| :--- | :--- | :--- | :--- |
| **Cách vận hành** | Khách mua bản quyền phần mềm trọn đời / thuê bao. Khách tự nhập API Key cá nhân (Google, xAI, Fal.ai). | Khách nạp tiền mua điểm (Credits). Phần mềm gọi qua server proxy của anh. | Khách có thể dùng key riêng HOẶC nạp tiền qua hệ thống nếu lười tạo key. |
| **Rủi ro chi phí AI** | **0% rủi ro** (Khách tự trả tiền sinh video cho nhà cung cấp AI). | Rủi ro cao nếu định giá credit không sát với chi phí token/video biến động. | Thấp và linh hoạt. |
| **Độ phức tạp server** | Gần như bằng 0 (chạy offline trên máy khách, chỉ cần server check key bản quyền). | Cần duy trì server queue, ví điện tử, quản trị gateway, proxy API chống lộ key. | Cần server backend hỗ trợ cả 2 luồng. |
| **Mức giá gợi ý** | • Gói năm: 990.000 VNĐ / năm<br>• Gói trọn đời: 1.990.000 – 2.990.000 VNĐ | • 200.000 VNĐ / 50 video<br>• 500.000 VNĐ / 150 video | Thu phí bản quyền phần mềm + bán thêm credits nếu khách cần. |

> **Khuyến nghị chiến lược:** Bắt đầu bằng **Mô hình BYOK**. Anh chỉ tập trung bán phần mềm tạo giá trị (kịch bản + đạo diễn góc máy + render + ghép tự động), không phải đau đầu lo chi phí thanh toán cho các nhà cung cấp GPU sinh video.

---

## 2. Kiến trúc Desktop App: Tại sao chọn Tauri v2 thay vì Electron?

### 2.1. Bảng so sánh kỹ thuật

```
                     +---------------------------------------+
                     |         Next.js UI (React / TS)       |
                     +---------------------------------------+
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
    [ Electron Architecture ]                             [ Tauri v2 Architecture ]
  ┌───────────────────────────┐                         ┌───────────────────────────┐
  │ - Chromium Bundle (~100MB)│                         │ - Native OS Webview       │
  │ - Node.js Runtime (~40MB) │                         │ - Rust Core (Compiled)    │
  │ - Installer: 120MB - 180MB│                         │ - Installer: 8MB - 15MB   │
  │ - RAM: 300MB - 800MB      │                         │ - RAM: 30MB - 80MB        │
  │ - Code dễ bị decompile/crack                        │ - Mã nhị phân khó bẻ khóa │
  └───────────────────────────┘                         └───────────────────────────┘
```

1. **Bảo vệ bản quyền vượt trội:** Electron đóng gói source code thành file `.asar` (rất dễ bị unpack bằng dòng lệnh để xóa đoạn check license). Tauri biên dịch code kiểm tra license và xử lý logic sang nhị phân **Rust**, chống crack và dịch ngược rất tốt.
2. **Kích thước nhẹ & Cài đặt siêu nhanh:** Bộ cài Windows `.msi` / `.exe` chỉ khoảng **10 MB**, người dùng tải về trong 5 giây là cài xong.
3. **Hiệu năng Render:** Tauri cho phép chạy các tác vụ nặng (như gọi FFmpeg ghép video, xử lý file cục bộ) trên các luồng native thread của Rust mà không làm đơ giao diện UI.

---

## 3. Tích hợp Video Generation API (Google Veo, Grok, Seedance, Kling, Fal.ai)

### 3.1. Tổng quan các Video Generation Engine

1. **Google Veo 3:**
   - Cung cấp chính thức qua **Google Cloud Vertex AI** (`POST https://us-central1-aiplatform.googleapis.com/v1/projects/.../locations/us-central1/publishers/google/models/veo-3:predictLongRunning`).
   - Cú pháp tối ưu: Thẻ ngoặc điện ảnh `[Subject & Action]`, `[Cinematography]`, `[Lighting & Color]`, `[Specs]`.
2. **ByteDance Seedance (Jimeng AI):**
   - Cung cấp qua **Volcengine Visual API (Volcano Engine)**.
   - Tối ưu cho dạng video ngắn dọc TikTok/Douyin, biểu cảm nhân vật tự nhiên.
3. **xAI Grok Video:**
   - API xử lý chuyển động thị giác tốc độ cao, độ tương phản ánh sáng mạnh.
4. **Unified API Gateway (Khuyên dùng hàng đầu: Fal.ai hoặc Replicate):**
   - Thay vì phải tích hợp 5 SDK riêng biệt của 5 công ty khác nhau, **Fal.ai** (`@fal-ai/serverless-client`) tích hợp sẵn:
     - `fal-ai/kling-video/v1.5/pro` (Kling AI)
     - `fal-ai/minimax-video` (Hailuo Minimax)
     - `fal-ai/luma-dream-machine` (Luma)
     - `fal-ai/runway-gen3/turbo` (Runway)
     - `fal-ai/wan-video` (Wan 2.1)
   - Người dùng chỉ cần 1 API Key của Fal.ai là có thể gọi bất kỳ model video nào.

### 3.2. Thiết kế Async Job Pipeline (Hàng đợi Render)

Sinh video AI không thể xử lý bằng request HTTP đồng bộ (vì mỗi cảnh mất từ 30s đến 120s để tạo). Hệ thống Desktop App cần thiết kế theo luồng Task Queue:

```
[ Bấm "Sinh Video Toàn Bộ" ]
            │
            ▼
[ Tạo Job List trong Local SQLite / IndexedDB ]
   ├── Task 1: Scene 1 (Prompt Veo 3) -> Trạng thái: QUEUED
   ├── Task 2: Scene 2 (Prompt Veo 3) -> Trạng thái: QUEUED
   └── Task 3: Scene 3 (Prompt Veo 3) -> Trạng thái: QUEUED
            │
            ▼
[ Worker Loop: Chạy tối đa 2 tác vụ song song ]
   ├── Gửi request tạo: POST /v1/video/generate
   │   └── Nhận về: { request_id: "vid_987xyz" }
   │
   ├── Vòng lặp Polling (mỗi 5 giây/lần):
   │   └── GET /v1/video/requests/vid_987xyz/status
   │       ├── Trạng thái IN_PROGRESS (35%) -> Cập nhật Progress Bar UI
   │       └── Trạng thái COMPLETED -> Nhận URL: "https://.../scene_1.mp4"
   │
   └── Tải file clip về máy: downloads/project_1/scene_1.mp4
```

---

## 4. Động cơ Ghép Video & Âm thanh Tự động (FFmpeg Local Sidecar Engine)

Sau khi app đã tải về $N$ file video tương ứng với $N$ phân cảnh, app sẽ tự động ghép chúng lại thành 1 video hoàn chỉnh mà không cần người dùng phải mở Premiere hay CapCut.

### 4.1. Cách nhúng FFmpeg vào Tauri App (Sidecar)
Tauri hỗ trợ tính năng **External Binary (Sidecar)**. Bạn chỉ cần tải file `ffmpeg.exe` (Windows) hoặc `ffmpeg` (macOS) đặt vào thư mục `src-tauri/binaries/`, Tauri sẽ tự động đóng gói kèm vào bộ cài app.

### 4.2. Quy trình ghép nối hoàn chỉnh qua FFmpeg

#### Bước 1: Tạo file danh sách nối phân cảnh (`concat_list.txt`)
```text
file 'downloads/project_01/scene_1.mp4'
file 'downloads/project_01/scene_2.mp4'
file 'downloads/project_01/scene_3.mp4'
```

#### Bước 2: Nối các video clips (Concatenation)
```bash
ffmpeg -f concat -safe 0 -i concat_list.txt -c:v libx264 -preset fast -crf 22 -c:a aac output_stitched.mp4
```

#### Bước 3: Ghép giọng đọc AI / Nhạc nền (Audio Mixing)
Nếu người dùng sử dụng tính năng lồng tiếng (Voiceover) hoặc sinh TTS (qua ElevenLabs / OpenAI TTS / FPT AI):
```bash
ffmpeg -i output_stitched.mp4 -i voiceover_full.mp3 -filter_complex "[0:a][1:a]amix=inputs=2:duration=first[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac final_rendered_video.mp4
```

#### Bước 4: Chèn phụ đề tự động (Subtitles Burn-in)
Nếu có caption hoặc kịch bản từng cảnh, app tự sinh file `.srt` và ép cứng vào video:
```bash
ffmpeg -i final_rendered_video.mp4 -vf "subtitles=subtitles.srt:force_style='FontSize=16,PrimaryColour=&H00FFFFFF,BorderStyle=3'" output_with_subtitles.mp4
```

---

## 5. Hệ thống Bản quyền & Quản lý License Khóa máy (Machine ID Locking)

Để thương mại hóa, phần mềm cần ngăn chặn việc 1 người mua key rồi chia sẻ cho hàng trăm người khác dùng chung.

### 5.1. Cơ chế Hardware Fingerprinting
Dùng Rust trong Tauri để lấy mã định danh phần cứng duy nhất của máy tính:
- **Windows:** Registry `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography\MachineGuid` + Serial CPU.
- **macOS:** `IOPlatformUUID` từ IOKit.

Mã máy (Machine Code) được băm (hash SHA-256) thành chuỗi dạng:  
`AIMO-8F4B-91E2-C03A`

### 5.2. Luồng Kích hoạt License Key

```
Người dùng mua key trên Web (Qua PayOS / VietQR / Lemon Squeezy / Gumroad)
                        │
                        ▼
           Nhận Key: AIMO-PRO-XXXX-YYYY
                        │
       [ Mở Desktop App -> Nhập License Key ]
                        │
                        ▼
      [ App gửi lên Server License Authentication ]
         POST https://api.aimo.vn/v1/license/activate
         {
           license_key: "AIMO-PRO-XXXX-YYYY",
           machine_id: "AIMO-8F4B-91E2-C03A",
           os: "windows_11"
         }
                        │
                        ▼
      [ Server kiểm tra & lưu liên kết máy tính ]
         - Nếu key hợp lệ & số máy kích hoạt < hạn mức (ví dụ max 2 máy):
           => Trả về Token có chữ ký số (RSA / Ed25519 Signed Token)
         - App lưu Token vào Secure Storage (Windows Credential Manager / Keychain)
                        │
                        ▼
           Mở khóa vĩnh viễn tính năng Pro!
```

---

## 6. Lộ trình Triển khai Kỹ thuật Từng bước (Step-by-step Setup)

### Bước 1: Chuẩn bị môi trường lập trình Desktop
1. Cài đặt **Rust & Cargo**:
   - Truy cập [https://rustup.rs](https://rustup.rs) tải và cài đặt Rust toolchain.
   - Chạy lệnh kiểm tra: `cargo --version` và `rustc --version`.
2. Cài đặt C++ Build Tools (trên Windows: cài Visual Studio Community với gói "Desktop development with C++").

### Bước 2: Tích hợp Tauri v2 vào dự án Web hiện tại
Tại thư mục gốc `ai-mo-web-workplace`:
```bash
npm install -D @tauri-apps/cli@next
npm install @tauri-apps/api@next
npx tauri init
```

*Trong quá trình init, chọn:*
- App name: `AI Mo Video Prompt Studio`
- Window title: `AI Mở - Universal Video Studio`
- Web assets path: `../out` (cho Next.js static export)
- Dev server URL: `http://localhost:3000`
- Frontend dev command: `npm run dev`
- Frontend build command: `npm run build`

### Bước 3: Cấu hình Next.js hỗ trợ Desktop Static Export
Mở file `next.config.mjs` (hoặc `next.config.ts`), bổ sung cấu hình export:
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.TAURI_BUILD ? 'export' : undefined,
  images: {
    unoptimized: true, // Bắt buộc cho Desktop app
  },
};

export default nextConfig;
```

### Bước 4: Thêm Script vào `package.json`
```json
"scripts": {
  "desktop:dev": "tauri dev",
  "desktop:build": "cross-env TAURI_BUILD=true npm run build && tauri build"
}
```

### Bước 5: Build ra file cài đặt `.exe` cho Windows
```bash
npm run desktop:build
```
File cài đặt sẽ được tạo tự động tại:  
`src-tauri/target/release/bundle/nsis/AI Mo Video Prompt Studio_1.0.0_x64-setup.exe`

---

## 7. Mã nguồn Tham chiếu Hoàn chỉnh (Reference Code)

### 7.1. Rust Command: Lấy Machine ID & Gọi FFmpeg (`src-tauri/src/main.rs`)

```rust
// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use tauri::command;

#[command]
fn get_machine_fingerprint() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::*;
        use winreg::RegKey;
        let hklm = RegKey::predef(HKEY_LOCAL_MACHINE);
        let crypto = hklm
            .open_subkey("SOFTWARE\\Microsoft\\Cryptography")
            .map_err(|e| e.to_string())?;
        let guid: String = crypto.get_value("MachineGuid").map_err(|e| e.to_string())?;
        Ok(guid)
    }

    #[cfg(target_os = "macos")]
    {
        let output = Command::new("ioreg")
            .args(&["-rd1", "-c", "IOPlatformExpertDevice"])
            .output()
            .map_err(|e| e.to_string())?;
        let out_str = String::from_utf8_lossy(&output.stdout);
        // Trích xuất UUID
        Ok(out_str.lines().find(|l| l.contains("IOPlatformUUID")).unwrap_or("UNKNOWN").to_string())
    }

    #[cfg(target_os = "linux")]
    {
        std::fs::read_to_string("/etc/machine-id").map_err(|e| e.to_string())
    }
}

#[command]
async fn stitch_video_clips(
    concat_file_path: String,
    output_path: String,
) -> Result<String, String> {
    let output = Command::new("ffmpeg")
        .args(&[
            "-f", "concat",
            "-safe", "0",
            "-i", &concat_file_path,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "22",
            "-c:a", "aac",
            "-y", &output_path,
        ])
        .output()
        .map_err(|e| format!("FFmpeg failed to execute: {}", e))?;

    if output.status.success() {
        Ok(format!("Video stitched successfully: {}", output_path))
    } else {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("FFmpeg error: {}", err_msg))
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_machine_fingerprint,
            stitch_video_clips
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

### 7.2. TypeScript Adapter: Gọi Video Generator qua Fal.ai (`src/lib/video-api/fal-adapter.ts`)

```typescript
/**
 * Adapter sinh video tự động từ prompt từng phân cảnh qua Fal.ai
 */
export interface VideoGenerationJob {
  sceneNumber: number;
  prompt: string;
  negativePrompt?: string;
  durationSeconds: number;
  aspectRatio: "9:16" | "16:9" | "1:1";
}

export interface VideoJobResult {
  sceneNumber: number;
  videoUrl: string;
  duration: number;
}

export async function submitSceneVideoJob(
  job: VideoGenerationJob,
  falApiKey: string,
  onProgress?: (percent: number) => void
): Promise<VideoJobResult> {
  // Model Kling 1.5 Pro hoặc Minimax qua Fal.ai
  const endpoint = "fal-ai/kling-video/v1.5/pro";

  const response = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Key ${falApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: job.prompt,
      negative_prompt: job.negativePrompt || "blurry, low quality, distorted",
      aspect_ratio: job.aspectRatio,
      duration: job.durationSeconds <= 5 ? "5" : "10",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Fal.ai submission failed: ${err}`);
  }

  const { request_id } = await response.json();

  // Polling loop chờ video render xong
  while (true) {
    await new Promise((r) => setTimeout(r, 4000)); // Polling mỗi 4 giây

    const statusRes = await fetch(
      `https://queue.fal.run/${endpoint}/requests/${request_id}/status`,
      {
        headers: { "Authorization": `Key ${falApiKey}` },
      }
    );

    if (!statusRes.ok) continue;
    const statusData = await statusRes.json();

    if (statusData.status === "IN_PROGRESS" && onProgress) {
      onProgress(statusData.progress || 50);
    }

    if (statusData.status === "COMPLETED") {
      const resultRes = await fetch(
        `https://queue.fal.run/${endpoint}/requests/${request_id}`,
        {
          headers: { "Authorization": `Key ${falApiKey}` },
        }
      );
      const resultData = await resultRes.json();
      return {
        sceneNumber: job.sceneNumber,
        videoUrl: resultData.video?.url || resultData.output?.url,
        duration: job.durationSeconds,
      };
    }

    if (statusData.status === "FAILED") {
      throw new Error(`Video generation failed for scene ${job.sceneNumber}: ${statusData.error}`);
    }
  }
}
```

---

### 7.3. UI Component: Khung Cấu hình API Key & Nút "Render Video"

```tsx
"use client";

import { useState } from "react";
import { Play, Key, CheckCircle2, RefreshCw } from "lucide-react";
import { submitSceneVideoJob } from "@/lib/video-api/fal-adapter";

export function VideoRenderPanel({ scenes, aspectRatio }: { scenes: any[]; aspectRatio: any }) {
  const [apiKey, setApiKey] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<number, number>>({});
  const [completedVideos, setCompletedVideos] = useState<string[]>([]);

  const handleRenderAll = async () => {
    if (!apiKey) {
      alert("Vui lòng nhập API Key để bắt đầu sinh video!");
      return;
    }

    setIsRendering(true);
    const results: string[] = [];

    for (const scene of scenes) {
      try {
        const res = await submitSceneVideoJob(
          {
            sceneNumber: scene.sceneNumber,
            prompt: scene.modelPrompts?.veo3 || scene.prompt,
            negativePrompt: scene.negativePrompt,
            durationSeconds: scene.endSecond - scene.startSecond,
            aspectRatio: aspectRatio,
          },
          apiKey,
          (percent) => {
            setProgressMap((prev) => ({ ...prev, [scene.sceneNumber]: percent }));
          }
        );
        results.push(res.videoUrl);
        setCompletedVideos([...results]);
      } catch (e: any) {
        console.error(e);
        alert(`Lỗi sinh video cảnh ${scene.sceneNumber}: ${e.message}`);
        break;
      }
    }

    setIsRendering(false);
    if (results.length === scenes.length) {
      alert("Đã sinh video toàn bộ phân cảnh thành công! Bắt đầu ghép nối...");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center gap-2 font-bold text-sm">
        <Key className="h-4 w-4 text-accent" />
        <span>Cấu hình API Key Video (BYOK)</span>
      </div>

      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Nhập Fal.ai Key (fal_key_...) hoặc Kling / Google Key"
        className="w-full h-9 rounded-md border border-border bg-surface-2/30 px-3 text-xs"
      />

      <div className="space-y-2">
        {scenes.map((s) => (
          <div key={s.sceneNumber} className="flex items-center justify-between text-xs p-2 rounded bg-surface-2/40">
            <span>Cảnh {s.sceneNumber} ({s.startSecond}s - {s.endSecond}s)</span>
            <span>
              {progressMap[s.sceneNumber] === 100 ? (
                <span className="text-success flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Hoàn thành
                </span>
              ) : progressMap[s.sceneNumber] ? (
                `Đang render: ${progressMap[s.sceneNumber]}%`
              ) : (
                "Chờ xử lý"
              )}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={isRendering || !apiKey}
        onClick={handleRenderAll}
        className="w-full h-11 bg-accent text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 cursor-pointer"
      >
        {isRendering ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Đang tạo video hàng loạt...</span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4 fill-white" />
            <span>Tự động sinh video tất cả phân cảnh</span>
          </>
        )}
      </button>
    </div>
  );
}
```

---

## 8. Tóm tắt các việc cần làm khi anh bắt đầu build Desktop App

1. **Test thị trường với bản Web hiện tại:** Đưa lên Vercel để người dùng trải nghiệm tạo kịch bản và nhận phản hồi thực tế.
2. **Khởi tạo Tauri v2:** Chạy `npx tauri init` trong thư mục `ai-mo-web-workplace`.
3. **Thêm module Quản lý License:** Tích hợp kiểm tra Machine ID bằng Rust command.
4. **Nhúng Binary FFmpeg Sidecar:** Đặt `ffmpeg.exe` vào `src-tauri/binaries/` để hỗ trợ xuất video MP4 tự động.
5. **Gắn Adapter Video API:** Tích hợp `fal-adapter.ts` cho phép người dùng tự điền key và render hàng loạt.
6. **Đóng gói file cài đặt:** Chạy `npm run desktop:build` và phát hành file `.exe` / `.msi` thương mại hóa.

*Tài liệu này được lưu trữ vĩnh viễn tại: `docs/DESKTOP-APP-COMMERCIALIZATION-GUIDE.md` để anh mở lại bất cứ lúc nào khi sẵn sàng triển khai!*
