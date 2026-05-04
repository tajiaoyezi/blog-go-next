import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlbumGrid } from "./album-grid";

const mockAlbums = [
  {
    id: 1,
    albumName: "旅行相册",
    albumDesc: "2024年旅行记录",
    albumCover: "https://example.com/cover1.jpg",
    photoCount: 24,
    status: 1,
    createTime: "2024-01-01",
  },
  {
    id: 2,
    albumName: "美食记录",
    albumDesc: "",
    albumCover: "",
    photoCount: 56,
    status: 2,
    createTime: "2024-02-01",
  },
];

describe("AlbumGrid", () => {
  it("renders all album cards in grid", () => {
    render(<AlbumGrid albums={mockAlbums} />);

    expect(screen.getByText("旅行相册")).toBeInTheDocument();
    expect(screen.getByText("美食记录")).toBeInTheDocument();
  });

  it("renders empty state when no albums", () => {
    render(<AlbumGrid albums={[]} />);

    expect(screen.getByText("暂无相册")).toBeInTheDocument();
  });

  it("uses responsive grid classes", () => {
    const { container } = render(<AlbumGrid albums={mockAlbums} />);

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("grid-cols-1");
    expect(grid).toHaveClass("sm:grid-cols-2");
    expect(grid).toHaveClass("lg:grid-cols-4");
  });

  it("calls onAlbumClick when card clicked", () => {
    const onAlbumClick = vi.fn();
    render(<AlbumGrid albums={mockAlbums} onAlbumClick={onAlbumClick} />);

    const cards = screen.getAllByRole("button");
    fireEvent.click(cards[0]);

    expect(onAlbumClick).toHaveBeenCalledWith(mockAlbums[0]);
  });

  it("passes selection props to cards", () => {
    render(
      <AlbumGrid
        albums={mockAlbums}
        selectable={true}
        selectedIds={[1]}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });
});
