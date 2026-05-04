import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ViewToggle } from "./view-toggle";

describe("ViewToggle", () => {
  it("renders grid and list buttons", () => {
    render(<ViewToggle view="grid" onChange={vi.fn()} />);

    expect(screen.getByLabelText("网格视图")).toBeInTheDocument();
    expect(screen.getByLabelText("列表视图")).toBeInTheDocument();
  });

  it("shows grid button as active when view is grid", () => {
    render(<ViewToggle view="grid" onChange={vi.fn()} />);

    const gridBtn = screen.getByLabelText("网格视图");
    expect(gridBtn).toHaveAttribute("data-active", "true");
  });

  it("shows list button as active when view is list", () => {
    render(<ViewToggle view="list" onChange={vi.fn()} />);

    const listBtn = screen.getByLabelText("列表视图");
    expect(listBtn).toHaveAttribute("data-active", "true");
  });

  it("calls onChange when clicking inactive button", () => {
    const onChange = vi.fn();
    render(<ViewToggle view="grid" onChange={onChange} />);

    const listBtn = screen.getByLabelText("列表视图");
    fireEvent.click(listBtn);

    expect(onChange).toHaveBeenCalledWith("list");
  });

  it("persists view mode to localStorage", () => {
    const onChange = vi.fn();
    render(<ViewToggle view="grid" onChange={onChange} />);

    const listBtn = screen.getByLabelText("列表视图");
    fireEvent.click(listBtn);

    expect(localStorage.getItem("album-view-mode")).toBe("list");
  });

  it("reads initial view from localStorage", () => {
    localStorage.setItem("album-view-mode", "list");

    const onChange = vi.fn();
    render(<ViewToggle view="list" onChange={onChange} />);

    const listBtn = screen.getByLabelText("列表视图");
    expect(listBtn).toHaveAttribute("data-active", "true");
  });
});
