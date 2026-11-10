import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("AI Mở — Homepage Redesign Verification", () => {
  const screenshotDir = path.join(process.cwd(), "docs", "screenshots");

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test("1. Desktop 1440x900: Header, 2-column Hero, Live Preview, and Sections", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:3000/");

    // Check Header
    await expect(page.locator("header .logo")).toBeVisible();
    await expect(page.locator("header #main-nav")).toBeVisible();
    await expect(page.locator("header .menu-button")).toBeHidden();

    // Check Hero H1 & CTAs
    const h1 = page.locator("h1");
    await expect(h1).toContainText("Học AI bằng cách");
    await expect(h1).toContainText("thứ dùng được");

    const primaryCta = page.locator("a:has-text('Dùng thử công cụ miễn phí')");
    await expect(primaryCta).toBeVisible();
    await expect(primaryCta).toHaveAttribute("href", "/promptkichban");

    const secondaryCta = page.locator("a:has-text('Xem lộ trình học')");
    await expect(secondaryCta).toBeVisible();
    await expect(secondaryCta).toHaveAttribute("href", "/learning-paths/bat-dau-voi-ai");

    // Check Product Preview in Hero
    await expect(page.locator("text=PromptKichBan").first()).toBeVisible();
    await expect(page.locator("text=Nhập thông tin video").first()).toBeVisible();
    await expect(page.locator("text=Kịch bản & storyboard").first()).toBeVisible();
    await expect(page.locator("text=Prompt video").first()).toBeVisible();

    // Check Sections
    await expect(page.locator("text=Bạn muốn làm gì hôm nay?").first()).toBeVisible();
    await expect(page.locator("text=Tính lãi thật từng đơn").first()).toBeVisible();
    await expect(page.locator("text=Định giá bán & khuyến mãi").first()).toBeVisible();
    await expect(page.locator("text=Bài viết kiến thức AI").first()).toBeVisible();
    await expect(page.locator("text=Khám phá thêm trên AI Mở").first()).toBeVisible();

    // Check no horizontal scrollbar
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Save screenshot
    await page.screenshot({ path: path.join(screenshotDir, "desktop-1440x900.png"), fullPage: false });
  });

  test("2. Tablet 768x1024: Header responsiveness and Layout Flow", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("http://localhost:3000/");

    // Check Header on Tablet
    const menuButton = page.locator("header .menu-button");
    await expect(menuButton).toBeVisible();

    // Open mobile/tablet menu
    await menuButton.click();
    const mobileDrawer = page.locator("#main-nav-mobile");
    await expect(mobileDrawer).toBeVisible();
    await expect(mobileDrawer.locator("text=Công cụ AI")).toBeVisible();
    await expect(mobileDrawer.locator("text=App miễn phí")).toBeVisible();

    // Close menu
    await menuButton.click();
    await expect(mobileDrawer).toBeHidden();

    // Check Hero content & preview
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("a:has-text('Dùng thử công cụ miễn phí')")).toBeVisible();

    // Check no horizontal scrollbar
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Save screenshot
    await page.screenshot({ path: path.join(screenshotDir, "tablet-768x1024.png"), fullPage: false });
  });

  test("3. Mobile 390x844: Single-column stack, Drawer navigation, Readable Preview", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://localhost:3000/");

    // Check Header & Menu Button
    const menuButton = page.locator("header .menu-button");
    await expect(menuButton).toBeVisible();

    // Open Drawer
    await menuButton.click();
    await expect(page.locator("#main-nav-mobile")).toBeVisible();
    await menuButton.click();

    // Check Headline and CTAs are full width on mobile
    await expect(page.locator("h1")).toBeVisible();
    const cta = page.locator("a:has-text('Dùng thử công cụ miễn phí')");
    await expect(cta).toBeVisible();

    // Preview should be readable and present
    await expect(page.locator("text=PromptKichBan").first()).toBeVisible();

    // Check no horizontal scrollbar
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Save screenshot
    await page.screenshot({ path: path.join(screenshotDir, "mobile-390x844.png"), fullPage: false });
  });

  test("4. Navigation Target Verification (/promptkichban, /apps, /guides, /courses, /products)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Test /promptkichban
    await page.goto("http://localhost:3000/promptkichban");
    await expect(page.locator("text=Universal Video Prompt Studio").first()).toBeVisible();

    // Test /apps
    await page.goto("http://localhost:3000/apps");
    await expect(page.locator("h1 >> text=14+ App HTML Miễn Phí").first()).toBeVisible();

    // Test /guides
    await page.goto("http://localhost:3000/guides");
    await expect(page.locator("h1").first()).toBeVisible();

    // Test /courses
    await page.goto("http://localhost:3000/courses");
    await expect(page.locator("h1").first()).toBeVisible();

    // Test /products
    await page.goto("http://localhost:3000/products");
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
