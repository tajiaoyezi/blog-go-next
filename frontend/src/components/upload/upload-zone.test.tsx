import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UploadZone } from "./upload-zone";

describe("UploadZone", () => {
  it("renders upload zone with drag prompt", () => {
    render(<UploadZone onFilesDrop={vi.fn()} />);

    expect(screen.getByText("拖拽图片到这里上传")).toBeInTheDocument();
    expect(screen.getByText("或点击选择文件")).toBeInTheDocument();
  });

  it("calls onFilesDrop when files are dropped", () => {
    const onFilesDrop = vi.fn();
    render(<UploadZone onFilesDrop={onFilesDrop} />);

    const file = new File(["content"], "test.png", { type: "image/png" });
    const dropZone = screen.getByText("拖拽图片到这里上传").parentElement!;

    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(onFilesDrop).toHaveBeenCalled();
  });

  it("shows drag active state on drag over", () => {
    const { container } = render(<UploadZone onFilesDrop={vi.fn()} />);

    const dropZone = screen.getByText("拖拽图片到这里上传").parentElement!;
    fireEvent.dragOver(dropZone);

    expect(container.querySelector(".border-primary")).toBeInTheDocument();
  });

  it("calls onFilesDrop when file input changes", () => {
    const onFilesDrop = vi.fn();
    render(<UploadZone onFilesDrop={onFilesDrop} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "test.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesDrop).toHaveBeenCalled();
  });

  it("disables drop when disabled prop is true", () => {
    const onFilesDrop = vi.fn();
    render(<UploadZone onFilesDrop={onFilesDrop} disabled={true} />);

    const dropZone = screen.getByText("拖拽图片到这里上传").parentElement!;
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [] },
    });

    expect(dropZone).toHaveClass("opacity-50");
  });

  it("displays accepted formats", () => {
    render(<UploadZone onFilesDrop={vi.fn()} />);

    expect(screen.getByText(/JPG, PNG, GIF, WebP/)).toBeInTheDocument();
  });
});
