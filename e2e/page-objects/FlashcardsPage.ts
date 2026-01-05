import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Flashcards Page
 * Handles all interactions with the flashcards list page
 */
export class FlashcardsPage extends BasePage {
  // Selectors
  readonly flashcardsPage: Locator;
  readonly toastContainer: Locator;

  constructor(page: Page) {
    super(page);
    this.flashcardsPage = this.getByTestId("flashcards-page");
    this.toastContainer = this.getByTestId("toast-container");
  }

  /**
   * Navigate to flashcards page
   */
  async goto(): Promise<void> {
    await this.page.goto("/flashcards", { waitUntil: "domcontentloaded" });
    await this.waitForPageLoad();
  }

  /**
   * Wait for flashcards page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    // Wait for page to be in DOM
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for main page container
    await this.flashcardsPage.waitFor({ state: "visible" });
  }

  /**
   * Verify that we are on the flashcards page
   */
  async isOnPage(): Promise<boolean> {
    try {
      await this.flashcardsPage.waitFor({ state: "visible", timeout: 3000 });
      return this.page.url().includes("/flashcards");
    } catch {
      return false;
    }
  }

  /**
   * Wait for toast to appear
   */
  async waitForToast(timeout = 5000): Promise<void> {
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
