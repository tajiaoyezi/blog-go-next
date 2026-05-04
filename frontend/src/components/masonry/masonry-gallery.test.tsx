import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MasonryGallery } from "./masonry-gallery";

const mockPhotos = [
  { id: 1, photoSrc: "https://example.com/1.jpg", photoName: "photo1.jpg", photoDesc: "", createTime: "2024-01-01" },
  { id: 2, photoSrc: "https://example.com/2.jpg", photoName: "photo2.jpg", photoDesc: "", createTime: "2024-01-02" },
  { id: 3, photoSrc: "https://example.com/3.jpg", photoName: "photo3.jpg", photoDesc: "", createTime: "2024-01-03" },
  { id: 4, photoSrc: "https://example.com/4.jpg", photoName: "photo4.jpg", photoDesc: "", createTime: "2024-01-04" },
];

describe("MasonryGallery", () => {
  it("renders all photos in masonry layout", () => {
    render(<MasonryGallery photos={mockPhotos} />);

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(mockPhotos.length);
  });

  it("renders empty state when no photos", () => {
    render(<MasonryGallery photos={[]} />);

    expect(screen.getByText("暂无照片")).toBeInTheDocument();
  });

  it("calls onPhotoClick when photo clicked", () => {
    const onPhotoClick = vi.fn();
    render(<MasonryGallery photos={mockPhotos} onPhotoClick={onPhotoClick} />);

    const images = screen.getAllByRole("img");
    fireEvent.click(images[0]);

    expect(onPhotoClick).toHaveBeenCalledWith(mockPhotos[0], 0);
  });

  it("shows photo name on hover", () => {
    render(<MasonryGallery photos={mockPhotos} />);

    expect(screen.getByText("photo1.jpg")).toBeInTheDocument();
  });

  it("renders checkboxes in selection mode", () => {
    render(
      <MasonryGallery
        photos={mockPhotos}
        selectable={true}
        selectedIds={[1, 3]}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(mockPhotos.length);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });

  it("calls onSelect when checkbox clicked", () => {
    const onSelect = vi.fn();
    render(
      <MasonryGallery
        photos={mockPhotos}
        selectable={true}
        onSelect={onSelect}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    expect(onSelect).toHaveBeenCalledWith(1, true);
  });

  it("uses responsive grid classes", () => {
    const { container } = render(<MasonryGallery photos={mockPhotos} />);

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("grid-cols-1");
    expect(grid).toHaveClass("md:grid-cols-2");
    expect(grid).toHaveClass("lg:grid-cols-3");
  });

  it("shows loading skeleton when loading is true", () => {
    render(<MasonryGallery photos={[]} loading={true} />);

    expect(document.querySelectorAll("[data-slot='skeleton']").length).toBeGreaterThan(0);
  });
});
