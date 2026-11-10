import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const SCREENSHOTS_DIR = path.resolve(process.cwd(), "docs/screenshots/promptkichban");

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
});

test.describe("PromptKichBan Real Browser QA & UX Hardening", () => {
  test("Desktop Flow (1440x900): Form -> Preset -> Advanced -> Storyboard -> Edit -> Lock -> Tabs -> Library -> Reload", async ({
    browser,
  }) => {
    // 1. Isolated Context for Desktop with unique IP
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: {
        "x-forwarded-for": "127.0.0.11",
      },
    });
    const page = await context.newPage();

    // Navigate & clean state
    await page.goto("/promptkichban");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    // 2. Default Form
    await expect(page.locator("h1")).toContainText("Tạo kịch bản video tiếp theo");
    const textarea = page.locator("#inputText");
    await expect(textarea).toBeVisible();

    // Verify Platform & Model are independent selectors
    const platformSelect = page.locator("#publishingPlatform");
    await expect(platformSelect).toBeVisible();
    const modelButtons = page.locator("button:has-text('Google Veo 3')");
    await expect(modelButtons).toBeVisible();

    // Screenshot 01: Form mặc định
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "01-form-default.png"),
      fullPage: false,
    });

    // 3. Choose Preset
    const presetBtn = page.locator("button:has-text('iPhone cũ cho sinh viên')");
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    // Check textarea is populated
    await expect(textarea).not.toHaveValue("");
    const textVal = await textarea.inputValue();
    expect(textVal.length).toBeGreaterThan(50);

    // Screenshot 02: Form sau khi chọn preset
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "02-form-preset.png"),
      fullPage: false,
    });

    // 4. Open Advanced Options Accordion
    const accordionBtn = page.locator("button:has-text('Tùy chỉnh nâng cao')");
    await expect(accordionBtn).toHaveAttribute("aria-expanded", "false");
    await accordionBtn.click();
    await expect(accordionBtn).toHaveAttribute("aria-expanded", "true");
    const advPanel = page.locator("#advanced-settings-panel");
    await expect(advPanel).toBeVisible();

    // Screenshot 03: Advanced options mở
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "03-advanced-options.png"),
      fullPage: false,
    });

    // 5. Submit & Generate
    const submitBtn = page.locator("button[type='submit']");
    await expect(submitBtn).toBeEnabled();

    // Click submit
    await submitBtn.click();

    // Check loading indicator or progress text
    const loadingEl = page.locator(".animate-spin, text=Đang đọc kịch bản, text=Đang chia cảnh");
    if (await loadingEl.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      // Screenshot 04: Loading state
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, "04-loading-state.png"),
        fullPage: false,
      });
    } else {
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, "04-loading-state.png"),
        fullPage: false,
      });
    }

    // Wait for Storyboard workspace to render
    const sceneDetailHeader = page.locator("text=Chi tiết Cảnh 1");
    await expect(sceneDetailHeader).toBeVisible({ timeout: 15000 });

    // Verify 3 columns layout: Timeline, Editor, Model Prompt
    const timelineCol = page.locator("text=Phân cảnh (");
    await expect(timelineCol).toBeVisible();
    const promptCol = page.locator("text=Prompt Video AI Cảnh 1");
    await expect(promptCol).toBeVisible();

    // Screenshot 05: Storyboard 3 cột
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "05-storyboard-3-col.png"),
      fullPage: false,
    });

    // 6. Edit Scene & Lock Scene
    const editVoTextarea = page.locator("textarea[placeholder*='lời thoại']");
    await expect(editVoTextarea).toBeVisible();
    await editVoTextarea.fill("Đây là lời thoại kịch bản đã được chỉnh sửa trực tiếp trên màn hình!");

    const editCameraInput = page.locator("input[placeholder*='Slow push-in']");
    if (await editCameraInput.isVisible()) {
      await editCameraInput.fill("Orbital 45-degree cinematic pan left");
    }

    // Toggle Lock
    const lockBtn = page.locator("button:has-text('Khóa cảnh')");
    await expect(lockBtn).toBeVisible();
    await lockBtn.click();
    await expect(page.locator("text=Đã khóa").first()).toBeVisible();

    // Click Save
    const saveBtn = page.locator("button:has-text('Lưu sửa')");
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    }

    // Screenshot 06: Chi tiết cảnh
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "06-scene-detail.png"),
      fullPage: false,
    });

    // 7. Model Prompt Tabs & Copy
    const grokTab = page.locator("button[role='tab']:has-text('Grok')");
    await expect(grokTab).toBeVisible();
    await grokTab.click();
    await expect(grokTab).toHaveAttribute("aria-selected", "true");

    const museTab = page.locator("button[role='tab']:has-text('Muse')");
    await expect(museTab).toBeVisible();
    await museTab.click();
    await expect(museTab).toHaveAttribute("aria-selected", "true");

    // Copy Prompt
    const copyPromptBtn = page.locator("button:has-text('Sao chép Prompt')");
    await expect(copyPromptBtn).toBeVisible();
    await copyPromptBtn.click();
    await expect(page.locator("text=Đã sao chép").first()).toBeVisible();

    // Screenshot 07: Model prompt tabs
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "07-model-prompt-tabs.png"),
      fullPage: false,
    });

    // 8. Open Library Drawer
    const libraryBtn = page.locator("button:has-text('Thư viện')").first();
    await expect(libraryBtn).toBeVisible();
    await libraryBtn.click();

    const libraryDrawer = page.locator("#library-drawer-title");
    await expect(libraryDrawer).toBeVisible();

    // Screenshot 08: Library drawer
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "08-library-drawer.png"),
      fullPage: false,
    });

    // Close Library Drawer
    const closeDrawerBtn = page.locator("button[aria-label='Đóng thư viện']");
    await closeDrawerBtn.click();

    // 9. Reload Persistence
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Chi tiết Cảnh 1")).toBeVisible({ timeout: 8000 });

    // 10. Malfunctioning / Corrupted LocalStorage Resilience
    await page.evaluate(() => {
      localStorage.setItem("aimo_promptkichban_history", "{CORRUPTED_JSON_MALFORMED");
      localStorage.setItem("aimo_promptkichban_current", "{CORRUPTED_JSON_MALFORMED");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    // App should gracefully render without crash!
    await expect(page.locator("h1")).toBeVisible();
    await context.close();
  });

  test("Mobile Flow (390x844): Responsiveness & No Horizontal Scroll", async ({ browser }) => {
    // 1. Mobile Viewport (iPhone size) with distinct IP
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      extraHTTPHeaders: {
        "x-forwarded-for": "127.0.0.22",
      },
    });
    const page = await context.newPage();

    await page.goto("/promptkichban");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    // Clear state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    // Check no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Screenshot 09: Mobile form
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "09-mobile-form.png"),
      fullPage: false,
    });

    // Click preset
    const presetBtn = page.locator("button:has-text('iPhone cũ cho sinh viên')");
    await expect(presetBtn).toBeVisible();
    await presetBtn.click();

    await expect(page.locator("#inputText")).not.toHaveValue("");

    // Submit form
    const submitBtn = page.locator("button[type='submit']");
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Wait for Storyboard workspace on mobile
    await expect(page.locator("text=Chi tiết Cảnh 1")).toBeVisible({ timeout: 15000 });

    // Check no horizontal overflow on mobile workspace
    const mobileWorkspaceOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(mobileWorkspaceOverflow).toBe(false);

    // Screenshot 10: Mobile storyboard
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "10-mobile-storyboard.png"),
      fullPage: false,
    });

    await context.close();
  });

  test("Error State & Rate-Limit State Handling", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: {
        "x-forwarded-for": "127.0.0.33",
      },
    });
    const page = await context.newPage();

    // Clear state
    await page.goto("/promptkichban");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(600);

    // 1. Error state (500 mock)
    await page.route("**/api/promptkichban/generate", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Máy chủ AI đang bảo trì. Vui lòng thử lại sau.",
          code: "server_error",
        }),
      });
    });

    const textarea = page.locator("#inputText");
    await textarea.fill("Đây là đoạn văn bản thử nghiệm lỗi hệ thống lớn hơn hai mươi ký tự.");
    const submitBtn = page.locator("button[type='submit']");
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    const errorAlert = page.locator("text=Máy chủ AI đang bảo trì");
    await expect(errorAlert).toBeVisible({ timeout: 5000 });

    // Screenshot 11: Error state
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "11-error-state.png"),
      fullPage: false,
    });

    // 2. Rate-limit state (429 quota mock)
    await page.unroute("**/api/promptkichban/generate");
    await page.route("**/api/promptkichban/generate", async (route) => {
      await route.fulfill({
        status: 429,
        headers: {
          "Retry-After": "86400",
        },
        contentType: "application/json",
        body: JSON.stringify({
          error: "Bạn đã sử dụng hết lượt tạo kịch bản hôm nay (3 lượt/ngày cho khách). Vui lòng thử lại vào ngày mai!",
          code: "quota",
          remaining: 0,
        }),
      });
    });

    await submitBtn.click();
    const rateLimitAlert = page.locator("text=Bạn đã sử dụng hết lượt tạo kịch bản hôm nay");
    await expect(rateLimitAlert).toBeVisible({ timeout: 5000 });

    // Screenshot 12: Rate-limit state
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, "12-rate-limit-state.png"),
      fullPage: false,
    });

    await context.close();
  });
});
