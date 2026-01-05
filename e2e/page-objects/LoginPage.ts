import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Login Page
 * Handles all interactions with the login page
 */
export class LoginPage extends BasePage {
  // Selectors
  readonly loginPage: Locator;
  readonly loginCard: Locator;
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly toastContainer: Locator;

  constructor(page: Page) {
    super(page);
    this.loginPage = this.getByTestId("login-page");
    this.loginCard = this.getByTestId("login-card");
    this.loginForm = this.getByTestId("login-form");
    this.emailInput = this.getByTestId("login-email-input");
    this.passwordInput = this.getByTestId("login-password-input");
    this.submitButton = this.getByTestId("login-submit-button");
    this.errorMessage = this.getByTestId("login-error-message");
    this.toastContainer = this.getByTestId("toast-container");
  }

  /**
   * Navigate to login page
   */
  async goto(redirectTo?: string): Promise<void> {
    const url = redirectTo ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}` : "/auth/login";
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    await this.waitForPageLoad();
  }

  /**
   * Wait for login page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for page to be in DOM
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for main page container
    await this.loginPage.waitFor({ state: "visible" });
    // Wait for login card to be visible
    await this.loginCard.waitFor({ state: "visible" });
    // Wait for form inputs to be ready
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });
    await this.submitButton.waitFor({ state: "visible" });
  }

  /**
   * Fill email input field
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.waitFor({ state: "visible" });
    await this.emailInput.waitFor({ state: "attached" });
    await this.emailInput.fill(email);
  }

  /**
   * Fill password input field
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "attached" });
    await this.passwordInput.fill(password);
  }

  /**
   * Submit login form
   */
  async submit(): Promise<void> {
    await this.submitButton.waitFor({ state: "visible" });
    await this.submitButton.waitFor({ state: "attached" });
    // Wait for button to be enabled (not disabled)
    await this.submitButton.waitFor({ state: "visible" });
    // Ensure button is clickable
    await this.submitButton.waitFor({ state: "attached" });
    await this.submitButton.click({ force: false });
  }

  /**
   * Perform complete login flow
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  /**
   * Check if error message is visible
   */
  async isErrorMessageVisible(): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({ state: "visible", timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.isErrorMessageVisible()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Wait for toast to appear
   */
  async waitForToast(timeout = 5000): Promise<void> {
    // Sonner renders toast messages, we can wait for the container or specific toast text
    await this.toastContainer.waitFor({ state: "attached", timeout });
  }

  /**
   * Check if toast with specific text is visible
   */
  async isToastVisible(text: string): Promise<boolean> {
    try {
      const toast = this.page.locator(`text=${text}`).first();
      await toast.waitFor({ state: "visible", timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}
