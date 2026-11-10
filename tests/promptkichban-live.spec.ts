import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const SCREENSHOTS_DIR = path.resolve(process.cwd(), "docs/screenshots/promptkichban");

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
});

test.describe("PromptKichBan Live Browser QA with VietAPI (Phase 3D)", () => {
  // Gating: Only run if PROMPTKICHBAN_LIVE_TEST=1 is explicitly passed
  test.beforeEach(() => {
    test.skip(
      process.env.PROMPTKICHBAN_LIVE_TEST?.trim() !== "1",
      "Skipping live browser test: Set PROMPTKICHBAN_LIVE_TEST=1 to enable."
    );
  });

  test("End-to-End Live Video Script Generation with VietAPI", async ({
    browser,
  }) => {
    test.setTimeout(120_000); // 120s timeout for live LLM round-trip

    // 1. Isolated Context with fresh IP header to avoid rate limit
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: {
        "x-forwarded-for": `127.0.0.${Math.floor(Math.random() * 150) + 100}`,
      },
    });
    const page = await context.newPage();

    // 2. Navigate to /promptkichban
    await page.goto("/promptkichban");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Clean localStorage for isolated test
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify main form elements
    const heading = page.locator("h1");
    await expect(heading).toContainText("Tạo kịch bản video tiếp theo");

    const textarea = page.locator("#inputText");
    await expect(textarea).toBeVisible();

    // 3. Fill in realistic test input
    const testScript =
      "iPhone 15 Pro Max màu titan tự nhiên máy cũ đẹp 99% nguyên zin pin 95% giá cực tốt bảo hành 12 tháng tại Anh Táo Mobile. Cần video review chân thực, hài hước, tạo niềm tin cho người mua lần đầu.";
    await textarea.fill(testScript);

    // Select TikTok and Veo 3
    const platformSelect = page.locator("#publishingPlatform");
    if (await platformSelect.isVisible()) {
      await platformSelect.selectOption("tiktok");
    }

    // 4. Click Submit to trigger Live AI generation
    const submitBtn = page.locator("button[type='submit']");
    await expect(submitBtn).toBeEnabled();

    console.log("[Live QA] Submitting script generation request to VietAPI...");
    const startTime = Date.now();
    await submitBtn.click();

    // 5. Verify Loading State & Time to Loading
    const submitBtnDisabled = page.locator("button[type='submit'][disabled]");
    await expect(submitBtnDisabled).toBeVisible({ timeout: 5000 });
    const timeToLoadingMs = Date.now() - startTime;
    console.log(`[Live QA] Time-to-loading indicator: ${timeToLoadingMs} ms`);
    expect(timeToLoadingMs).toBeLessThan(4000);

    // Verify rotating progress messages are present
    const loadingBtnText = await submitBtnDisabled.innerText();
    const validProgressMessages = [
      "Đang đọc kịch bản...",
      "Đang chia cảnh...",
      "Đang viết prompt...",
      "Đang hoàn tất...",
    ];
    const hasValidProgress = validProgressMessages.some((msg) =>
      loadingBtnText.includes(msg)
    );
    console.log(
      `[Live QA] Observed progress text: "${loadingBtnText.trim()}" (valid: ${hasValidProgress})`
    );
    expect(hasValidProgress).toBe(true);

    // Verify double-submit prevention: button is disabled during active request
    await expect(submitBtnDisabled).toBeDisabled();

    // Screenshot: Loading state during live generation
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "live-01-generating.png"),
      fullPage: false,
    });

    // 6. Wait for Live Storyboard workspace to render (VietAPI round-trip ~10-45s)
    console.log("[Live QA] Waiting for Storyboard workspace to render from VietAPI...");
    const sceneDetailHeader = page.locator("text=Chi tiết Cảnh 1");
    await expect(sceneDetailHeader).toBeVisible({ timeout: 90_000 });
    const latencyMs = Date.now() - startTime;
    console.log(`[Live QA] ✅ Live Storyboard rendered in ${latencyMs} ms!`);

    // Verify layout stability: no horizontal scrollbar / overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    console.log(`[Live QA] Horizontal overflow check: ${hasHorizontalOverflow ? "OVERFLOW" : "OK"}`);
    expect(hasHorizontalOverflow).toBe(false);

    // Screenshot: Live Storyboard rendered
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "live-02-storyboard-rendered.png"),
      fullPage: false,
    });

    // 7. Verify Timeline & Scene integrity
    const timelineHeader = page.locator("text=Phân cảnh (");
    await expect(timelineHeader).toBeVisible();

    const promptPreviewHeader = page.locator("text=Prompt Video AI Cảnh 1");
    await expect(promptPreviewHeader).toBeVisible();

    // Verify Voiceover textarea has content
    const voTextarea = page.locator("textarea[placeholder*='lời thoại']");
    await expect(voTextarea).toBeVisible();
    const voText = await voTextarea.inputValue();
    expect(voText.length).toBeGreaterThan(5);
    console.log(`[Live QA] Scene 1 Voiceover: "${voText.slice(0, 80)}..."`);

    // 8. Test Scene Editing
    await voTextarea.fill(`${voText} [Đã duyệt bởi QA]`);
    const saveBtn = page.locator("button:has-text('Lưu sửa')");
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    }

    // 9. Test Model Tabs Switching & Tab Persistence
    const grokTab = page.locator("button[role='tab']:has-text('Grok')");
    if (await grokTab.isVisible()) {
      await grokTab.click();
      await expect(grokTab).toHaveAttribute("aria-selected", "true");
    }

    const seedanceTab = page.locator("button[role='tab']:has-text('Seedance 2.5')");
    if (await seedanceTab.isVisible()) {
      await seedanceTab.click();
      await expect(seedanceTab).toHaveAttribute("aria-selected", "true");
    }

    const museTab = page.locator("button[role='tab']:has-text('Muse')");
    if (await museTab.isVisible()) {
      await museTab.click();
      await expect(museTab).toHaveAttribute("aria-selected", "true");
    }

    // Switch back to Veo 3 tab and verify persistence
    const veoTab = page.locator("button[role='tab']:has-text('Veo 3')");
    if (await veoTab.isVisible()) {
      await veoTab.click();
      await expect(veoTab).toHaveAttribute("aria-selected", "true");
    }

    // Screenshot: Model prompts tab
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "live-03-model-prompts.png"),
      fullPage: false,
    });

    // 10. Verify Copy Prompt button works
    const copyPromptBtn = page.locator("button:has-text('Sao chép prompt')");
    if (await copyPromptBtn.isVisible()) {
      await copyPromptBtn.click();
      await expect(page.locator("text=Đã sao chép").first()).toBeVisible({ timeout: 5000 });
    }

    // 11. Verify LocalStorage Library persistence
    const libraryDrawerBtn = page.locator("button:has-text('Thư viện')").first();
    if (await libraryDrawerBtn.isVisible()) {
      await libraryDrawerBtn.click();
      const libraryItem = page.locator("text=iPhone 15 Pro Max").first();
      await expect(libraryItem).toBeVisible({ timeout: 5000 });

      // Screenshot: Library drawer with live generation item
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, "live-04-library-history.png"),
        fullPage: false,
      });

      // Close library drawer
      const closeDrawerBtn = page.locator("button[aria-label*='Thư viện'], button[aria-label*='thư viện']").first();
      if (await closeDrawerBtn.isVisible()) {
        await closeDrawerBtn.click();
      }
    }

    console.log("[Live QA] ✅ Live VietAPI browser QA completed successfully!");
  });
});
