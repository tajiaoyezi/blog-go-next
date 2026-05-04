import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from "./select";

describe("Select Components", () => {
  it("renders Select with placeholder", () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="选择选项" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByTestId("trigger")).toBeInTheDocument();
    expect(screen.getByText("选择选项")).toBeInTheDocument();
  });

  it("renders Select with label", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Group Label</SelectLabel>
            <SelectItem value="1">Option 1</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );

    // Open select to see label
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    expect(screen.getByText("Group Label")).toBeInTheDocument();
  });

  it("renders SelectSeparator", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectSeparator />
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    // Open select to see separator
    const trigger = screen.getByRole("combobox");
    fireEvent.click(trigger);

    // Separator should be in the document (as an empty div or hr)
    const separator = document.querySelector('[data-slot="select-separator"]');
    expect(separator).toBeInTheDocument();
  });

  it("handles SelectItem selection", () => {
    const onValueChange = vi.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="选择" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = screen.getByTestId("trigger");
    fireEvent.click(trigger);

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });
});
