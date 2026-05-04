import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlbumCard } from "./album-card";

const mockAlbum = {
  id: 1,
  albumName: "旅行相册",
  albumDesc: "2024年旅行记录",
  albumCover: "https://example.com/cover.jpg",
  photoCount: 24,
  status: 1,
  createTime: "2024-01-01",
};

describe("AlbumCard", () => {
  it("renders album name and photo count", () => {
    const onClick = vi.fn();
    render(<AlbumCard album={mockAlbum} onClick={onClick} />);

    expect(screen.getByText("旅行相册")).toBeInTheDocument();
    expect(screen.getByText("24 张图片")).toBeInTheDocument();
  });

  it("renders cover image when albumCover exists", () => {
    render(<AlbumCard album={mockAlbum} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", expect.stringContaining("cover.jpg"));
  });

  it("renders placeholder when no cover", () => {
    const albumWithoutCover = { ...mockAlbum, albumCover: "" };
    render(<AlbumCard album={albumWithoutCover} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("calls onClick when card clicked", () => {
    const onClick = vi.fn();
    render(<AlbumCard album={mockAlbum} onClick={onClick} />);

    const card = screen.getByRole("button");
    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledWith(mockAlbum);
  });

  it("shows action buttons on hover", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <AlbumCard
        album={mockAlbum}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const cards = screen.getAllByRole("button");
    const card = cards[0];
    fireEvent.mouseEnter(card);

    expect(screen.getByLabelText("编辑")).toBeInTheDocument();
    expect(screen.getByLabelText("删除")).toBeInTheDocument();
  });

  it("calls onEdit when edit button clicked", () => {
    const onEdit = vi.fn();
    render(<AlbumCard album={mockAlbum} onEdit={onEdit} />);

    const cards = screen.getAllByRole("button");
    const card = cards[0];
    fireEvent.mouseEnter(card);

    const editBtn = screen.getByLabelText("编辑");
    fireEvent.click(editBtn);

    expect(onEdit).toHaveBeenCalledWith(mockAlbum);
  });

  it("calls onDelete when delete button clicked", () => {
    const onDelete = vi.fn();
    render(<AlbumCard album={mockAlbum} onDelete={onDelete} />);

    const cards = screen.getAllByRole("button");
    const card = cards[0];
    fireEvent.mouseEnter(card);

    const deleteBtn = screen.getByLabelText("删除");
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledWith(mockAlbum);
  });

  it("shows checkbox in selection mode", () => {
    render(
      <AlbumCard
        album={mockAlbum}
        selectable={true}
        selected={true}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeChecked();
  });

  it("calls onSelect when checkbox clicked", () => {
    const onSelect = vi.fn();
    render(
      <AlbumCard
        album={mockAlbum}
        selectable={true}
        onSelect={onSelect}
      />
    );

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(onSelect).toHaveBeenCalledWith(mockAlbum.id, true);
  });
});
