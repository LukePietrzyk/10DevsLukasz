import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { MarkdownContent } from "./MarkdownContent";

describe("MarkdownContent", () => {
  describe("Podstawowe renderowanie", () => {
    it("should render plain text", () => {
      render(<MarkdownContent content="Simple text" />);
      expect(screen.getByText("Simple text")).toBeInTheDocument();
    });

    it("should render empty content", () => {
      const { container } = render(<MarkdownContent content="" />);
      expect(container).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(<MarkdownContent content="Test" className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("custom-class");
    });
  });

  describe("Rozmiary", () => {
    it("should apply prose-sm class for size sm", () => {
      const { container } = render(<MarkdownContent content="Test" size="sm" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("prose-sm");
    });

    it("should apply prose class for size base", () => {
      const { container } = render(<MarkdownContent content="Test" size="base" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("prose");
    });

    it("should default to base size when size is not provided", () => {
      const { container } = render(<MarkdownContent content="Test" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("prose");
    });
  });

  describe("Nagłówki", () => {
    it("should render h1 with correct styling", () => {
      render(<MarkdownContent content="# Heading 1" />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Heading 1");
      expect(heading).toHaveClass("text-2xl", "font-semibold");
    });

    it("should render h2 with correct styling", () => {
      render(<MarkdownContent content="## Heading 2" />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Heading 2");
      expect(heading).toHaveClass("text-xl", "font-semibold");
    });
  });

  describe("Formatowanie tekstu", () => {
    it("should render bold text", () => {
      render(<MarkdownContent content="**Bold text**" />);
      const bold = screen.getByText("Bold text");
      expect(bold.tagName).toBe("STRONG");
      expect(bold).toHaveClass("font-semibold");
    });

    it("should render italic text", () => {
      render(<MarkdownContent content="*Italic text*" />);
      const italic = screen.getByText("Italic text");
      expect(italic.tagName).toBe("EM");
      expect(italic).toHaveClass("italic");
    });
  });

  describe("Listy", () => {
    it("should render unordered list", () => {
      render(<MarkdownContent content="- Item 1\n- Item 2" />);
      const list = screen.getByRole("list");
      expect(list).toBeInTheDocument();
      expect(list.tagName).toBe("UL");
      expect(list).toHaveClass("list-disc", "list-inside");
    });

    it("should render ordered list", () => {
      render(<MarkdownContent content="1. First\n2. Second" />);
      const list = screen.getByRole("list");
      expect(list).toBeInTheDocument();
      expect(list.tagName).toBe("OL");
      expect(list).toHaveClass("list-decimal", "list-inside");
    });
  });

  describe("Kod", () => {
    it("should render inline code", () => {
      render(<MarkdownContent content="This is `inline code` example" />);
      const code = screen.getByText("inline code");
      expect(code.tagName).toBe("CODE");
      expect(code).toHaveClass("bg-muted", "font-mono");
    });
  });

  describe("Linki", () => {
    it("should render link with correct attributes", () => {
      render(<MarkdownContent content="[Link text](https://example.com)" />);
      const link = screen.getByRole("link", { name: "Link text" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveClass("text-primary", "underline");
    });
  });

  describe("Tryb ciemny", () => {
    it("should apply dark:prose-invert class", () => {
      const { container } = render(<MarkdownContent content="Test" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("dark:prose-invert");
    });
  });

  describe("Klasy Tailwind Typography", () => {
    it("should apply prose utility classes", () => {
      const { container } = render(<MarkdownContent content="Test" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("prose-headings:font-semibold");
      expect(wrapper).toHaveClass("prose-p:my-2");
      expect(wrapper).toHaveClass("prose-ul:my-2");
      expect(wrapper).toHaveClass("prose-ol:my-2");
      expect(wrapper).toHaveClass("prose-li:my-1");
      expect(wrapper).toHaveClass("max-w-none");
    });
  });

  describe("Rozmiary - wszystkie warianty", () => {
    it("should apply prose-lg class for size lg", () => {
      const { container } = render(<MarkdownContent content="Test" size="lg" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("prose-lg");
    });

    it("should apply prose-xl class for size xl", () => {
      const { container } = render(<MarkdownContent content="Test" size="xl" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("prose-xl");
    });

    it("should apply prose-2xl class for size 2xl", () => {
      const { container } = render(<MarkdownContent content="Test" size="2xl" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("prose-2xl");
    });
  });

  describe("Nagłówki - dodatkowe testy", () => {
    it("should render h3 with correct styling", () => {
      render(<MarkdownContent content="### Heading 3" />);
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Heading 3");
      expect(heading).toHaveClass("text-lg", "font-semibold");
    });
  });

  describe("Kod - dodatkowe testy", () => {
    it("should render code block content", () => {
      render(<MarkdownContent content="```\nconst x = 1;\n```" />);
      const codeBlock = screen.getByText(/const x = 1/);
      expect(codeBlock.tagName).toBe("CODE");
    });
  });

  describe("Paragrafy", () => {
    it("should render paragraph content", () => {
      render(<MarkdownContent content="Paragraph text" />);
      const paragraph = screen.getByText("Paragraph text");
      expect(paragraph.tagName).toBe("P");
      expect(paragraph).toHaveClass("mb-2");
    });
  });

  describe("Złożone scenariusze", () => {
    it("should render complex markdown with multiple elements", () => {
      const content = `# Title

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2

\`inline code\` and [a link](https://example.com)`;

      render(<MarkdownContent content={content} />);

      expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument();
      expect(screen.getByText(/This is a paragraph/)).toBeInTheDocument();
      expect(screen.getByText("bold")).toBeInTheDocument();
      expect(screen.getByText("italic")).toBeInTheDocument();
      expect(screen.getByText("List item 1")).toBeInTheDocument();
      expect(screen.getByText("inline code")).toBeInTheDocument();
      expect(screen.getByRole("link")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle whitespace-only content", () => {
      const { container } = render(<MarkdownContent content="   \n\n   " />);
      expect(container).toBeInTheDocument();
    });

    it("should handle content with only markdown syntax", () => {
      render(<MarkdownContent content="**" />);
      expect(screen.getByText("**")).toBeInTheDocument();
    });

    it("should handle content with newlines", () => {
      render(<MarkdownContent content="Line 1\nLine 2\nLine 3" />);
      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    });
  });
});
