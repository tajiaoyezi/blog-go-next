import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Lightbox } from "./lightbox";

const mockImages = [
  { src: "https://example.com/1.jpg", alt: "Photo 1" },
  { src: "https://example.com/2.jpg", alt: "Photo 2" },
  { src: "https://example.com/3.jpg", alt: "Photo 3" },
];

describe("Lightbox", () => {
  it("does not render when closed", () => {
    render(
      <Lightbox
        images={mockImages}
        open={false}
        index={0}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders when open", () => {
    render(
      <Lightbox
        images={mockImages}
        open={true}
        index={0}
        onClose={vi.fn()}
      />
    );

    expect(document.querySelector("[role='dialog']")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(
      <Lightbox
        images={mockImages}
        open={true}
        index={0}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByLabelText("Close");
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it("displays correct image count", () => {
    render(
      <Lightbox
        images={mockImages}
        open={true}
        index={1}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("shows prev/next buttons when multiple images", () => {
    render(
      <Lightbox
        images={mockImages}
        open={true}
        index={1}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Previous")).toBeInTheDocument();
    expect(screen.getByLabelText("Next")).toBeInTheDocument();
  });

  it("hides prev/next buttons when single image", () => {
    render(
      <Lightbox
        images={[mockImages[0]]}
        open={true}
        index={0}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByLabelText("Previous")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Next")).not.toBeInTheDocument();
  });

  it("supports keyboard navigation", () => {
    const onIndexChange = vi.fn();
    render(
      <Lightbox
        images={mockImages}
        open={true}
        index={0}
        onClose={vi.fn()}
        onIndexChange={onIndexChange}
      />
    );

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(onIndexChange).toHaveBeenCalledWith(1);

    fireEvent.keyDown(document, { key: "Escape" });
  });
});
