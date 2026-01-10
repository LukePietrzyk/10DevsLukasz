import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@/test/utils";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render with default placeholder", () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Szukaj fiszek...");
    expect(input).toBeInTheDocument();
  });

  it("should render with custom placeholder", () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="" onChange={mockOnChange} placeholder="Custom placeholder" />);

    const input = screen.getByPlaceholderText("Custom placeholder");
    expect(input).toBeInTheDocument();
  });

  it("should display initial value", () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="test query" onChange={mockOnChange} />);

    const input = screen.getByDisplayValue("test query") as HTMLInputElement;
    expect(input.value).toBe("test query");
  });

  it("should call onChange after debounce delay", async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnChange = vi.fn();
    render(<SearchBar value="" onChange={mockOnChange} debounceMs={300} />);

    const input = screen.getByPlaceholderText("Szukaj fiszek...");
    await user.type(input, "test");

    // onChange should not be called immediately
    expect(mockOnChange).not.toHaveBeenCalled();

    // Fast-forward time by 300ms
    vi.advanceTimersByTime(300);

    // Now onChange should be called
    expect(mockOnChange).toHaveBeenCalledWith("test");
  });

  it("should show clear button when value is not empty", () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="test" onChange={mockOnChange} />);

    const clearButton = screen.getByLabelText("Wyczyść wyszukiwanie");
    expect(clearButton).toBeInTheDocument();
  });

  it("should hide clear button when value is empty", () => {
    const mockOnChange = vi.fn();
    render(<SearchBar value="" onChange={mockOnChange} />);

    const clearButton = screen.queryByLabelText("Wyczyść wyszukiwanie");
    expect(clearButton).not.toBeInTheDocument();
  });

  it("should clear value when clear button is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnChange = vi.fn();
    render(<SearchBar value="test" onChange={mockOnChange} />);

    const clearButton = screen.getByLabelText("Wyczyść wyszukiwanie");
    await user.click(clearButton);

    // onChange should be called immediately with empty string
    expect(mockOnChange).toHaveBeenCalledWith("");
  });

  it("should debounce multiple rapid changes", async () => {
    const user = userEvent.setup({ delay: null });
    const mockOnChange = vi.fn();
    render(<SearchBar value="" onChange={mockOnChange} debounceMs={300} />);

    const input = screen.getByPlaceholderText("Szukaj fiszek...");
    await user.type(input, "abc");

    // Fast-forward time by 200ms (less than debounce delay)
    vi.advanceTimersByTime(200);
    expect(mockOnChange).not.toHaveBeenCalled();

    // Fast-forward remaining time
    vi.advanceTimersByTime(100);
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith("abc");
  });
});
