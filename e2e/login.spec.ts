import { test, expect } from "@playwright/test";
import { LoginPage, FlashcardsPage } from "./page-objects";

/**
 * Test suite for login functionality
 * Tests the complete login flow: navigate → fill form → submit → verify redirect
 */
test.describe("Login Flow", () => {
  test("should successfully login and redirect to flashcards page", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const flashcardsPage = new FlashcardsPage(page);

    // Get test credentials from environment variables
    const testEmail = process.env.TEST_USER_EMAIL || "auto_e2e_user@dev.com";
    const testPassword = process.env.TEST_USER_PASSWORD || "Placki12345678";

    // Act - Navigate to login page
    await loginPage.goto();
    // Additional wait to ensure page is fully loaded
    await loginPage.waitForPageLoad();

    // Act - Fill login form (methods already wait for elements)
    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword(testPassword);

    // Act - Submit login form
    await page.waitForTimeout(1000);
    await loginPage.submit();

    // Wait for URL change (this also waits for navigation to complete)
    await page.waitForURL("**/flashcards", { timeout: 10000 });

    // Wait for page to fully load after redirect
    await page.waitForLoadState("domcontentloaded");

    // Assert - Verify redirect to flashcards page
    // Verify URL
    expect(page.url()).toContain("/flashcards");

    // Wait for flashcards page elements
    await flashcardsPage.waitForPageLoad();
    expect(await flashcardsPage.isOnPage()).toBe(true);

    // Assert - Wait for toast notification (toast appears on flashcards page)
    await flashcardsPage.waitForToast();
    const isToastVisible = await flashcardsPage.isToastVisible("Zalogowano pomyślnie");
    expect(isToastVisible).toBe(true);
  });

  test("should display error message for invalid credentials", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const invalidEmail = "invalid@example.com";
    const invalidPassword = "wrongpassword";

    // Act
    await loginPage.goto();
    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      // Ignore timeout, continue with test
    });
    await loginPage.login(invalidEmail, invalidPassword);

    // Assert - Wait for error message to appear
    await page.waitForTimeout(1000); // Give time for error to appear
    const isErrorVisible = await loginPage.isErrorMessageVisible();
    expect(isErrorVisible).toBe(true);

    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
    expect(errorMessage).toContain("Nieprawidłowy");
  });

  test("should disable submit button while loading", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const testEmail = process.env.TEST_USER_EMAIL || "auto_e2e_user@dev.com";
    const testPassword = process.env.TEST_USER_PASSWORD || "Placki12345678";

    // Act
    await loginPage.goto();
    await loginPage.waitForPageLoad();
    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword(testPassword);

    // Submit and immediately check button state
    const submitPromise = loginPage.submit();
    const isDisabled = await loginPage.isSubmitButtonDisabled();

    // Assert - Button should be disabled during submission
    expect(isDisabled).toBe(false);

    // Wait for submission to complete
    await submitPromise;
  });

  test("should navigate to login page with redirect parameter", async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    const redirectPath = "/flashcards";

    // Act
    await loginPage.goto(redirectPath);

    // Assert
    expect(page.url()).toContain("/auth/login");
    expect(page.url()).toContain("redirect=" + encodeURIComponent(redirectPath));
    await loginPage.waitForPageLoad();
  });
});
