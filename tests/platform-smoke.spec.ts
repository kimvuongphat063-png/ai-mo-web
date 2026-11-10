import { test, expect } from "@playwright/test";

test.describe("AI Mở Platform Smoke Tests", () => {
  test("Homepage renders hero, 4 pathways, spotlight, and footer", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("http://localhost:3000/");

    // Check header branding and navigation
    await expect(page.locator("text=AI MỞ").first()).toBeVisible();
    await expect(page.locator("nav#main-nav >> text=Công cụ AI")).toBeVisible();
    await expect(page.locator("nav#main-nav >> text=App miễn phí")).toBeVisible();
    await expect(page.locator("nav#main-nav >> text=Học AI")).toBeVisible();
    await expect(page.locator("nav#main-nav >> text=Game")).toBeVisible();
    await expect(page.locator("nav#main-nav >> text=Sản phẩm số")).toBeVisible();

    // Check Hero
    await expect(page.locator("h1 >> text=Học AI bằng cách").first()).toBeVisible();
    await expect(page.locator("text=Dùng thử công cụ miễn phí").first()).toBeVisible();

    // Check Intent & Tools
    await expect(page.locator("text=Bạn muốn làm gì hôm nay?")).toBeVisible();
    await expect(page.locator("text=PromptKichBan").first()).toBeVisible();

    // Check Footer
    await expect(page.locator("footer >> text=AI MỞ").first()).toBeVisible();
  });

  test("Apps catalog and detail page work smoothly", async ({ page }) => {
    await page.goto("http://localhost:3000/apps");
    await expect(page.locator("h1 >> text=14+ App HTML Miễn Phí").first()).toBeVisible();
    await expect(page.locator("text=Tính lãi thật từng đơn hàng").first()).toBeVisible();

    // Navigate to detail
    await page.click("text=Tính lãi thật từng đơn hàng");
    await expect(page.locator("h1 >> text=Tính lãi thật từng đơn hàng")).toBeVisible();
    await expect(page.locator("iframe")).toBeVisible();
  });

  test("Games coming-soon page renders properly", async ({ page }) => {
    await page.goto("http://localhost:3000/games");
    await expect(page.locator("h1 >> text=Game Web Giải Trí")).toBeVisible();
    await expect(page.locator("text=Sắp ra mắt").first()).toBeVisible();
  });

  test("Mobile viewport renders responsive navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("http://localhost:3000/");

    const menuButton = page.locator("button.menu-button");
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    await expect(page.locator("#main-nav-mobile >> text=Công cụ AI")).toBeVisible();
    await expect(page.locator("#main-nav-mobile >> text=App miễn phí")).toBeVisible();
  });
});
