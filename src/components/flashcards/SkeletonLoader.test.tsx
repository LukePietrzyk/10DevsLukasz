import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { SkeletonLoader } from "./SkeletonLoader";

describe("SkeletonLoader", () => {
  it("should render desktop table view by default", () => {
    render(<SkeletonLoader />);

    // Check if table headers are present
    expect(screen.getByText("Front")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("Next Review")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("should render mobile card view when isMobile is true", () => {
    render(<SkeletonLoader isMobile={true} />);

    // In mobile view, we should not see table headers
    expect(screen.queryByText("Front")).not.toBeInTheDocument();
    expect(screen.queryByText("Back")).not.toBeInTheDocument();
  });

  it("should render correct number of skeleton rows", () => {
    const { container } = render(<SkeletonLoader />);

    // Desktop view should have 10 skeleton rows
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(10);
  });

  it("should render correct number of skeleton cards in mobile view", () => {
    const { container } = render(<SkeletonLoader isMobile={true} />);

    // Mobile view should have 5 skeleton cards
    const cards = container.querySelectorAll('[class*="Card"]');
    expect(cards.length).toBe(5);
  });
});
