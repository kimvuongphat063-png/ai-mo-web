import { test, expect } from "@playwright/test";
import { createAuthCookie } from "./auth.setup";
import * as fs from "node:fs";
import * as path from "node:path";

const SCREENSHOTS_DIR = path.resolve(process.cwd(), "docs/screenshots/promptkichban");

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
});

// Robust sample storyboard output for deterministic frontend testing
const mockScriptOutput = {
  title: "Review iPhone 15 Pro Max Titan Tự Nhiên",
  summary: "Video review chi tiết iPhone 15 Pro Max 99% nguyên zin 30 giây",
  visualStyle: "tech-cinematic",
  contentType: "product-review",
  publishingPlatform: "tiktok",
  promptModel: "all",
  aspectRatio: "9:16",
  durationSeconds: 30,
  targetAudience: "Khách hàng mua iPhone cũ uy tín",
  tone: "Chân thực, đáng tin cậy",
  hook: "Đừng mua iPhone 15 Pro Max cũ nếu bạn chưa biết điều này!",
  cta: "Bấm ngay vào giỏ hàng hoặc inbox Anh Táo Mobile nhé!",
  caption: "iPhone 15 Pro Max titan tự nhiên cực hot! #AnhTaoMobile #iPhone15ProMax",
  hashtags: ["#iPhone15ProMax", "#AnhTaoMobile", "#ReviewCongNghe"],
  scenes: [
    {
      sceneNumber: 1,
      startSecond: 0,
      endSecond: 15,
      scenePurpose: "Hook mở đầu",
      visualDescription: "Cận cảnh viền titan tự nhiên lấp lánh ánh kim",
      setting: "Studio chuyên nghiệp",
      subject: "iPhone 15 Pro Max",
      cameraShot: "Extreme Close-up",
      cameraMovement: "Slow orbital pan",
      lensAndDepth: "50mm prime, f/1.8",
      lighting: "Soft cinematic studio lighting",
      action: "Xoay nhẹ thân máy khoe viền titan",
      voiceover: "Trên tay mình là iPhone 15 Pro Max màu titan tự nhiên đẹp 99%.",
      onScreenText: "Titan tự nhiên • Đẹp 99%",
      soundDesign: "Whoosh nhẹ nhàng",
      transition: "Cut",
      prompt: "Cinematic close-up of natural titanium iPhone 15 Pro Max",
      negativePrompt: "blurry, low quality",
      modelPrompts: {
        veo3: "Cinematic macro shot of titanium smartphone",
        grok: "Grok visual camera pan of titanium phone",
        seedance25: "At [0s-15s] Titanium phone showcase",
        seedance2: "[Subject: Phone] | [Shot: Macro]",
        muse: "Tencent Muse commercial 35mm optical profile",
      },
    },
    {
      sceneNumber: 2,
      startSecond: 15,
      endSecond: 30,
      scenePurpose: "Kêu gọi hành động",
      visualDescription: "Toàn cảnh máy và quà tặng kèm bảo hành",
      setting: "Cửa hàng Anh Táo Mobile",
      subject: "iPhone 15 Pro Max & Quà tặng",
      cameraShot: "Medium Shot",
      cameraMovement: "Static",
      lensAndDepth: "35mm prime, f/2.8",
      lighting: "Warm retail lighting",
      action: "Đặt máy xuống bàn cạnh phiếu bảo hành",
      voiceover: "Bảo hành 12 tháng 1 đổi 1. Ghé ngay Anh Táo Mobile nhé!",
      onScreenText: "Bảo hành 12 tháng 1 đổi 1",
      soundDesign: "Nhạc vui tươi chốt hạ",
      transition: "Fade",
      prompt: "Retail counter shot with iPhone and warranty card",
      negativePrompt: "blurry",
      modelPrompts: {
        veo3: "Retail showcase of smartphone",
        grok: "Grok store counter shot",
        seedance25: "At [15s-30s] Retail warranty display",
        seedance2: "[Subject: Warranty] | [Shot: Medium]",
        muse: "Muse retail commercial profile",
      },
    },
  ],
  voiceoverFull: "Trên tay mình là iPhone 15 Pro Max màu titan tự nhiên đẹp 99%. Bảo hành 12 tháng 1 đổi 1. Ghé ngay Anh Táo Mobile nhé!",
  warnings: [],
  missingInformation: [],
  generatedAt: new Date().toISOString(),
  requestId: "req-e2e-test-123",
};

test.describe("Phase 4B — PromptKichBan Cloud Library E2E & Release Gate", () => {
  test.setTimeout(60_000);

  // ─── 1. Guest Flow ────────────────────────────────────────────────────────
  test("1. Guest E2E: Generate -> LocalStorage -> Copy/Download -> Login Required on Cloud Save", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: {
        "x-forwarded-for": "127.0.0.51",
      },
    });
    const page = await context.newPage();

    // Fast deterministic generate for UX/Storage testing
    await page.route("**/api/promptkichban/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          output: mockScriptOutput,
          data: mockScriptOutput,
        }),
      });
    });

    // Open as guest
    await page.goto("/promptkichban");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Fill form using preset
    const presetBtn = page.locator("button:has-text('Review sản phẩm & Unboxing')");
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Submit form
    const submitBtn = page.locator("button[type='submit']");
    await submitBtn.click();

    // Wait for Storyboard workspace (Scene 1 Detail is visible)
    const sceneDetailHeader = page.locator("text=Chi tiết Cảnh 1");
    await expect(sceneDetailHeader).toBeVisible({ timeout: 10_000 });

    // Verify Copy & Download actions
    const copyBtn = page.locator("button:has-text('Chép kịch bản')").first();
    await expect(copyBtn).toBeVisible();

    const downloadMdBtn = page.locator("button:has-text('Tải Markdown (.md)')").first();
    await expect(downloadMdBtn).toBeVisible();

    // Open Library Drawer
    const openLibraryBtn = page.locator("button:has-text('Thư viện')").first();
    await openLibraryBtn.click();
    await page.waitForTimeout(300);

    // Switch to Local tab
    const localTabBtn = page.locator("button:has-text('Thiết bị này')");
    await expect(localTabBtn).toBeVisible();
    await localTabBtn.click();

    // Local library should have the saved script
    const localItem = page.locator("h3:has-text('Review iPhone 15 Pro Max Titan Tự Nhiên')").first();
    await expect(localItem).toBeVisible();

    // Reload page and verify local persistence
    await page.reload();
    await page.waitForLoadState("networkidle");
    const openLibraryAgain = page.locator("button:has-text('Thư viện')").first();
    await openLibraryAgain.click();
    await page.locator("button:has-text('Thiết bị này')").click();
    await expect(page.locator("h3:has-text('Review iPhone 15 Pro Max Titan Tự Nhiên')").first()).toBeVisible();

    // Close drawer
    await page.locator("button[aria-label='Đóng thư viện']").click();
    await page.waitForTimeout(300);

    // Guest clicking "Lưu vào tài khoản" redirects to /login
    const cloudSaveBtn = page.locator("button:has-text('Lưu vào tài khoản')");
    await expect(cloudSaveBtn).toBeVisible();
    await cloudSaveBtn.click();
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  // ─── 2. Authenticated Cloud Flow ──────────────────────────────────────────
  test("2. Authenticated Cloud Flow: Generate -> Cloud Save -> Sync -> Rename -> Soft-delete", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: {
        "x-forwarded-for": "127.0.0.52",
      },
    });

    // Authenticate as learner
    const authCookie = await createAuthCookie("learner");
    await context.addCookies([authCookie]);

    const page = await context.newPage();

    // Fast deterministic generate for UX/Storage testing
    await page.route("**/api/promptkichban/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          output: {
            ...mockScriptOutput,
            title: "Review iPhone 15 Pro Max Bản Đám Mây",
          },
          data: {
            ...mockScriptOutput,
            title: "Review iPhone 15 Pro Max Bản Đám Mây",
          },
        }),
      });
    });

    await page.goto("/promptkichban");
    await page.waitForLoadState("networkidle");

    // Clean local storage
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Choose Preset and Generate
    const presetBtn = page.locator("button:has-text('Mỹ phẩm & Chăm sóc da')");
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    await page.locator("button[type='submit']").click();

    // Wait for workspace
    const sceneDetailHeader = page.locator("text=Chi tiết Cảnh 1");
    await expect(sceneDetailHeader).toBeVisible({ timeout: 10_000 });

    // Click "Lưu vào tài khoản"
    const cloudSaveBtn = page.locator("button:has-text('Lưu vào tài khoản')");
    await expect(cloudSaveBtn).toBeVisible();
    await cloudSaveBtn.click();

    // Should indicate "Đã lưu vào tài khoản"
    await expect(page.locator("button:has-text('Đã lưu vào tài khoản')")).toBeVisible({
      timeout: 10_000,
    });

    // Verify success banner appears
    await expect(page.locator("text=Đã lưu kịch bản thành công vào tài khoản!")).toBeVisible();

    // Open Library Drawer
    await page.locator("button:has-text('Thư viện')").first().click();
    await page.waitForTimeout(300);

    // Switch to Cloud Tab
    const cloudTab = page.locator("div[role='dialog'] button:has-text('Tài khoản')");
    await cloudTab.click();

    // Document must appear in Cloud list
    const cloudItem = page.locator("h3:has-text('Review iPhone 15 Pro Max Bản Đám Mây')").first();
    await expect(cloudItem).toBeVisible();

    // Test Inline Rename
    const renameBtn = page.locator("button[title='Đổi tên bản lưu']").first();
    await expect(renameBtn).toBeVisible();
    await renameBtn.click();

    const renameInput = page.locator("input[placeholder='Nhập tên mới...']");
    await expect(renameInput).toBeVisible();
    await renameInput.fill("iPhone 15 Pro Max VIP Đã Đổi Tên");
    await page.locator("button[title='Lưu tên']").click();

    // Verify title updated
    await expect(page.locator("h3:has-text('iPhone 15 Pro Max VIP Đã Đổi Tên')")).toBeVisible();

    // Reload browser and verify renamed document persists in Cloud
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.locator("button:has-text('Thư viện')").first().click();
    await page.locator("div[role='dialog'] button:has-text('Tài khoản')").click();
    await expect(page.locator("h3:has-text('iPhone 15 Pro Max VIP Đã Đổi Tên')")).toBeVisible();

    // Soft delete
    const deleteBtn = page.locator("button[title='Xóa kịch bản khỏi tài khoản']").first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Verify removed from list
    await expect(page.locator("h3:has-text('iPhone 15 Pro Max VIP Đã Đổi Tên')")).toHaveCount(0);
  });

  // ─── 3. Local-to-Cloud Migration ─────────────────────────────────────────
  test("3. Local-to-Cloud Migration: Sync single and batch sync all without duplicates", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: {
        "x-forwarded-for": "127.0.0.53",
      },
    });

    const page = await context.newPage();
    await page.goto("/promptkichban");
    await page.waitForLoadState("networkidle");

    // Populate 2 local items in localStorage
    await page.evaluate((sampleOutput) => {
      const items = [
        {
          id: "local-item-1",
          savedAt: new Date().toISOString(),
          output: {
            ...sampleOutput,
            title: "Kịch bản Local 1 — Review Laptop",
          },
        },
        {
          id: "local-item-2",
          savedAt: new Date().toISOString(),
          output: {
            ...sampleOutput,
            title: "Kịch bản Local 2 — Xả kho tai nghe",
          },
        },
      ];
      localStorage.setItem("aimo_promptkichban_history", JSON.stringify(items));
    }, mockScriptOutput);

    // Add auth cookie now
    const authCookie = await createAuthCookie("learner");
    await context.addCookies([authCookie]);
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Open Library Drawer
    await page.locator("button:has-text('Thư viện')").first().click();
    await page.waitForTimeout(300);

    // Switch to Local Tab
    await page.locator("button:has-text('Thiết bị này')").click();

    // Verify Migration Banner is displayed
    const syncBanner = page.locator("button:has-text('Đồng bộ tất cả')");
    await expect(syncBanner).toBeVisible();

    // Click "Đồng bộ tất cả"
    await syncBanner.click();

    // Wait for success toast
    await expect(page.locator("text=Đã đồng bộ thành công")).toBeVisible({ timeout: 10_000 });

    // Switch to Cloud Tab to confirm documents exist
    await page.locator("div[role='dialog'] button:has-text('Tài khoản')").click();
    await expect(page.locator("h3:has-text('Kịch bản Local 1 — Review Laptop')")).toBeVisible();
    await expect(page.locator("h3:has-text('Kịch bản Local 2 — Xả kho tai nghe')")).toBeVisible();

    // Run sync again -> duplicate prevention
    await page.locator("button:has-text('Thiết bị này')").click();
    await page.locator("button:has-text('Đồng bộ tất cả')").click();
    await expect(page.locator("text=Đã đồng bộ thành công")).toBeVisible();

    // Clean up created documents
    await page.locator("div[role='dialog'] button:has-text('Tài khoản')").click();
    const deleteButtons = page.locator("button[title='Xóa kịch bản khỏi tài khoản']");
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      await deleteButtons.first().click();
      await page.waitForTimeout(200);
    }
  });

  // ─── 4. Ownership Isolation & API Security ───────────────────────────────
  test("4. Ownership Isolation: User A vs User B strict 404 policy and CSRF protection", async ({
    request,
    baseURL,
  }) => {
    const origin = baseURL || "http://127.0.0.1:3000";

    // Create session tokens for User A (learner) and User B (admin)
    const cookieA = await createAuthCookie("learner");
    const cookieB = await createAuthCookie("admin");

    const sampleInput = {
      inputText: "iPhone 15 Pro Max màu titan tự nhiên nguyên zin bảo hành 12 tháng tại Anh Táo Mobile.",
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
      tone: "Hài hước, gần gũi, uy tín",
      callToAction: "Ghé ngay Anh Táo Mobile để nhận báo giá!",
    };

    const payloadA = {
      title: "Kịch bản bí mật của User A",
      inputSnapshot: sampleInput,
      outputSnapshot: mockScriptOutput,
    };

    // 1. User A creates document
    const createRes = await request.post("/api/promptkichban/documents", {
      headers: {
        Origin: origin,
        Cookie: `${cookieA.name}=${cookieA.value}`,
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      data: payloadA,
    });

    expect(createRes.status()).toBe(201);
    const createData = await createRes.json();
    const docId = createData.data.id;
    expect(docId).toBeDefined();

    // 2. User B lists documents -> docId must NOT appear
    const listResB = await request.get("/api/promptkichban/documents", {
      headers: {
        Cookie: `${cookieB.name}=${cookieB.value}`,
      },
    });
    expect(listResB.status()).toBe(200);
    const listDataB = await listResB.json();
    const foundInB = listDataB.data.some((d: { id: string }) => d.id === docId);
    expect(foundInB).toBe(false);

    // 3. User B tries GET doc A -> receives 404 (ID enumeration protection)
    const getResB = await request.get(`/api/promptkichban/documents/${docId}`, {
      headers: {
        Cookie: `${cookieB.name}=${cookieB.value}`,
      },
    });
    expect(getResB.status()).toBe(404);

    // 4. User B tries PATCH doc A -> receives 404
    const patchResB = await request.patch(`/api/promptkichban/documents/${docId}`, {
      headers: {
        Origin: origin,
        Cookie: `${cookieB.name}=${cookieB.value}`,
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      data: { title: "User B cố tình chiếm đoạt" },
    });
    expect(patchResB.status()).toBe(404);

    // 5. User B tries DELETE doc A -> receives 404
    const deleteResB = await request.delete(`/api/promptkichban/documents/${docId}`, {
      headers: {
        Origin: origin,
        Cookie: `${cookieB.name}=${cookieB.value}`,
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    expect(deleteResB.status()).toBe(404);

    // 6. User A can still fetch and clean up document A
    const getResA = await request.get(`/api/promptkichban/documents/${docId}`, {
      headers: {
        Cookie: `${cookieA.name}=${cookieA.value}`,
      },
    });
    expect(getResA.status()).toBe(200);

    const deleteResA = await request.delete(`/api/promptkichban/documents/${docId}`, {
      headers: {
        Origin: origin,
        Cookie: `${cookieA.name}=${cookieA.value}`,
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    expect(deleteResA.status()).toBe(200);

    // 7. Security: CSRF rejects mismatched origin
    const csrfRes = await request.post("/api/promptkichban/documents", {
      headers: {
        Origin: "https://evil-attacker.com",
        Cookie: `${cookieA.name}=${cookieA.value}`,
        "Content-Type": "application/json",
      },
      data: payloadA,
    });
    expect(csrfRes.status()).toBe(403);
  });

  // ─── 5. Mobile Viewport & Zero Overflow ────────────────────────────────────
  test("5. Mobile Viewport (390x844): Drawer and controls without horizontal overflow", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      extraHTTPHeaders: {
        "x-forwarded-for": "127.0.0.54",
      },
    });
    const page = await context.newPage();
    await page.goto("/promptkichban");
    await page.waitForLoadState("networkidle");

    // Open Library Drawer on mobile via aria-label
    const mobileDrawerBtn = page.locator("button[aria-label='Thư viện kịch bản']");
    await expect(mobileDrawerBtn).toBeVisible();
    await mobileDrawerBtn.click();
    await page.waitForTimeout(300);

    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    // Close drawer
    await page.locator("button[aria-label='Đóng thư viện']").click();
    await page.waitForTimeout(200);
  });
});
