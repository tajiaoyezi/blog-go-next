import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsCard } from "./stats-card";
import { FileText, Eye } from "lucide-react";

describe("StatsCard", () => {
  it("renders title and value", () => {
    render(
      <StatsCard title="文章数" value={128} icon={FileText} />
    );

    expect(screen.getByText("文章数")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
  });

  it("formats large numbers with w suffix", () => {
    render(
      <StatsCard title="访问量" value={12345} icon={Eye} />
    );

    expect(screen.getByText("1.2w")).toBeInTheDocument();
  });

  it("shows loading skeleton when loading is true", () => {
    const { container } = render(
      <StatsCard title="文章数" value={0} icon={FileText} loading={true} />
    );

    expect(container.querySelector("[data-slot='skeleton']")).toBeInTheDocument();
    expect(screen.queryByText("128")).not.toBeInTheDocument();
  });

  it("displays positive trend with green color", () => {
    render(
      <StatsCard
        title="文章数"
        value={128}
        icon={FileText}
        trend={0.15}
        trendLabel="较上周"
      />
    );

    expect(screen.getByText("+15.0%")).toBeInTheDocument();
    expect(screen.getByText("较上周")).toBeInTheDocument();
  });

  it("displays negative trend with red color", () => {
    render(
      <StatsCard
        title="文章数"
        value={128}
        icon={FileText}
        trend={-0.08}
      />
    );

    expect(screen.getByText("-8.0%")).toBeInTheDocument();
  });

  it("displays flat trend with gray color", () => {
    render(
      <StatsCard
        title="文章数"
        value={128}
        icon={FileText}
        trend={0}
      />
    );

    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });

  it("does not display trend when trend is undefined", () => {
    render(
      <StatsCard title="文章数" value={128} icon={FileText} />
    );

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("does not display trend when trend is null", () => {
    render(
      <StatsCard title="文章数" value={128} icon={FileText} trend={null as unknown as number} />
    );

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <StatsCard
        title="文章数"
        value={128}
        icon={FileText}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
