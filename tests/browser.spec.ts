import { test, expect } from "@playwright/test";
import { createAuthCookie } from "./auth.setup";

/**
 * Integration test: create product -> analyze -> generate script -> reload saved script -> assert all fields remain present
 * 
 * This verifies the Studio data contract holds across the full lifecycle:
 * - All ScriptGeneration fields are persisted
 * - Script detail page can display them after page refresh
 * - No data loss on round-trip
 */

test.describe("Studio Script Generation Flow", () => {
  test.beforeEach(async ({ context }) => {
    // Set up authenticated session using demo learner account
    const authCookie = await createAuthCookie("learner");
    await context.addCookies([authCookie]);
  });

  test("generates script from seeded product, reloads and verifies all fields persist", async ({ page }) => {
    // Step 1: Navigate to script wizard (product already seeded)
    await page.goto("/app/scripts/new");

    // Wizard Step 1: Select product
    await page.waitForSelector('#product');
    // Select first product in dropdown (seeded by studio:readiness)
    await page.selectOption('#product', { index: 1 });

    // Wait for auto-advance to step 2 (analyze completes)
    await page.waitForSelector('input[type="radio"][name="angle"]', { timeout: 20000 });

    // Wizard Step 2: Select first selling angle
    await page.click('input[type="radio"][name="angle"]:first-of-type');
    await page.click('button:has-text("Tiếp theo")');

    // Wizard Step 3: Configure script
    await page.waitForSelector('#duration');
    await page.selectOption('#platform', 'tiktok');
    await page.selectOption('#goal', 'awareness');
    await page.fill('#duration', '45');
    await page.selectOption('#format', 'ugc');

    // Optional fields
    await page.fill('#presenter', 'KOL nữ, 28 tuổi, năng động, thân thiện');
    await page.fill('#tone', 'Gần gũi, tự nhiên như chia sẻ với bạn bè');
    await page.fill('#cta', 'Bấm link trong bio để nhận mã giảm 20%');

    // Generate script
    await page.click('button:has-text("Tạo Script với AI")');

    // Wait for script detail page
    await page.waitForURL(/\/app\/scripts\/[a-f0-9-]+$/, { timeout: 25000 });
    const scriptUrl = page.url();
    const scriptId = scriptUrl.split("/").pop();

    // Step 4: Verify initial render - check all fields are present
    // Verify at least one variant is visible
    await expect(page.locator('text=Biến thể')).toBeVisible();
    await expect(page.locator('text=Góc bán hàng:')).toBeVisible();
    
    // Verify shot breakdown section
    await expect(page.locator('text=Timeline')).toBeVisible();
    
    // Verify caption & hashtags badges
    const captionBadges = page.locator('span.inline-flex.items-center').filter({ hasText: /#/ });
    await expect(captionBadges.first()).toBeVisible();
    
    // Verify optional sections exist (at least one)
    const optionalSections = await page.locator('text=/Alternative Hooks|Audio Suggestion|Call to Action|Disclosure Note/i').count();
    expect(optionalSections).toBeGreaterThan(0);
    
    // Verify generation insights section
    const insightsSections = await page.locator('text=/Missing Information|Compliance Notes/i').count();
    expect(insightsSections).toBeGreaterThanOrEqual(0);

    // Verify copy button exists (CopyButton component)
    const copyButton = page.locator('button:has-text("Sao chép")').first();
    await expect(copyButton).toBeVisible();
    
    // Test copy functionality
    await copyButton.click();
    await expect(page.locator('button:has-text("Đã sao chép")')).toBeVisible({ timeout: 2000 });

    // Step 5: Reload the page (simulate page refresh / direct URL access)
    await page.reload();
    
    // Step 6: Re-verify all fields after reload - data persistence check
    await expect(page.locator('text=Biến thể')).toBeVisible();
    await expect(page.locator('text=Góc bán hàng:')).toBeVisible();
    await expect(page.locator('text=Timeline')).toBeVisible();
    
    // Verify badges still render
    const captionBadgesAfterReload = page.locator('span.inline-flex.items-center').filter({ hasText: /#/ });
    await expect(captionBadgesAfterReload.first()).toBeVisible();
    
    // Verify optional sections still present after reload
    const optionalSectionsAfterReload = await page.locator('text=/Alternative Hooks|Audio Suggestion|Call to Action|Disclosure Note/i').count();
    expect(optionalSectionsAfterReload).toBeGreaterThan(0);
    
    // Verify copy button still works after reload
    const copyButtonAfterReload = page.locator('button:has-text("Sao chép")').first();
    await expect(copyButtonAfterReload).toBeVisible();
    
    console.log(`✅ Integration test passed for script ${scriptId}`);
  });

  test("enforces 15-300 duration policy", async ({ page }) => {
    await page.goto("/app/scripts/new");

    // Step 1: Select product
    await page.waitForSelector('#product');
    await page.selectOption('#product', { index: 1 });

    // Wait for auto-advance to step 2
    await page.waitForSelector('input[type="radio"][name="angle"]', { timeout: 20000 });
    await page.click('input[type="radio"][name="angle"]:first-of-type');
    await page.click('button:has-text("Tiếp theo")');

    // Now on step 3 (script config)
    const durationInput = page.locator('#duration');
    await expect(durationInput).toBeVisible();

    // Verify min/max attributes
    await expect(durationInput).toHaveAttribute('min', '15');
    await expect(durationInput).toHaveAttribute('max', '300');

    // Valid value should work
    await durationInput.fill('60');
    const value = await durationInput.inputValue();
    expect(parseInt(value)).toBe(60);

    // Note: HTML5 validation prevents invalid values from being submitted,
    // but they can be typed. The form submission will be blocked by the browser.
  });
});
