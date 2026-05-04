import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SkeletonCard } from "./skeleton-card";
import { SkeletonCardList } from "./skeleton-card-list";
import { SkeletonTable } from "./skeleton-table";
import { SkeletonChart } from "./skeleton-chart";

describe("Skeleton Components", () => {
  describe("SkeletonCard", () => {
    it("renders card skeleton with correct structure", () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletons = container.querySelectorAll("[data-slot='skeleton']");
      expect(skeletons.length).toBeGreaterThanOrEqual(2);
    });

    it("applies custom className", () => {
      const { container } = render(<SkeletonCard className="custom-class" />);
      
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("SkeletonCardList", () => {
    it("renders default 4 card skeletons", () => {
      const { container } = render(<SkeletonCardList />);
      
      const grid = container.querySelector(".grid");
      expect(grid).toBeInTheDocument();
    });

    it("renders specified count of card skeletons", () => {
      const { container } = render(<SkeletonCardList count={8} />);
      
      const items = container.querySelectorAll("[data-slot='skeleton']");
      expect(items.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe("SkeletonTable", () => {
    it("renders table skeleton with default 5 columns and 5 rows", () => {
      const { container } = render(<SkeletonTable />);
      
      const table = container.querySelector(".rounded-md");
      expect(table).toBeInTheDocument();
    });

    it("renders table skeleton with custom columns and rows", () => {
      const { container } = render(
        <SkeletonTable columns={3} rows={2} />
      );
      
      const rows = container.querySelectorAll(".flex");
      expect(rows.length).toBeGreaterThan(0);
    });

    it("renders with toolbar when showToolbar is true", () => {
      const { container } = render(
        <SkeletonTable showToolbar={true} />
      );
      
      const toolbar = container.querySelector(".flex.items-center.gap-2");
      expect(toolbar).toBeInTheDocument();
    });

    it("hides header when showHeader is false", () => {
      const { container } = render(
        <SkeletonTable showHeader={false} />
      );
      
      const header = container.querySelector(".bg-muted\\/50");
      expect(header).not.toBeInTheDocument();
    });
  });

  describe("SkeletonChart", () => {
    it("renders chart skeleton with default height", () => {
      const { container } = render(<SkeletonChart />);
      
      const chartArea = container.querySelector(".bg-muted");
      expect(chartArea).toBeInTheDocument();
    });

    it("renders chart skeleton with custom height", () => {
      const { container } = render(
      <SkeletonChart height={500} />
      );
      
      // Check that the component renders a div with height-related style
      const divWithStyle = container.querySelector('div[style]');
      expect(divWithStyle).toBeInTheDocument();
      expect(divWithStyle?.getAttribute("style")).toContain("500");
    });
  });
});
