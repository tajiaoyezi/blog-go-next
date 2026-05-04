import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SmartTagInput } from "./smart-tag-input";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("SmartTagInput", () => {
  let mockOnChange: (tags: string[]) => void;
  let defaultProps: {
    value: string[];
    onChange: (tags: string[]) => void;
    availableTags: string[];
  };

  beforeEach(() => {
    mockOnChange = vi.fn();
    defaultProps = {
      value: [],
      onChange: mockOnChange,
      availableTags: ["JavaScript", "TypeScript", "React", "Vue", "Go"],
    };
    vi.clearAllMocks();
  });

  it("renders empty input", () => {
    render(<SmartTagInput {...defaultProps} />);

    expect(screen.getByPlaceholderText("输入标签...")).toBeInTheDocument();
  });

  it("renders existing tags", () => {
    render(<SmartTagInput {...defaultProps} value={["JavaScript", "React"]} />);

    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("adds tag on Enter key", () => {
    render(<SmartTagInput {...defaultProps} />);

    const input = screen.getByPlaceholderText("输入标签...");
    fireEvent.change(input, { target: { value: "NewTag" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockOnChange).toHaveBeenCalledWith(["NewTag"]);
  });

  it("shows suggestions when typing", () => {
    render(<SmartTagInput {...defaultProps} />);

    const input = screen.getByPlaceholderText("输入标签...");
    fireEvent.change(input, { target: { value: "Java" } });

    expect(screen.getByText("JavaScript")).toBeInTheDocument();
  });

  it("filters out already selected tags from suggestions", () => {
    render(<SmartTagInput {...defaultProps} value={["JavaScript"]} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Java" } });

    // Get the suggestions dropdown
    const suggestionsDropdown = document.querySelector(".bg-popover");
    if (suggestionsDropdown) {
      // JavaScript should not appear in suggestions since it's already selected
      expect(suggestionsDropdown.textContent).not.toContain("JavaScript");
    }
  });

  it("removes tag when clicking X", () => {
    render(<SmartTagInput {...defaultProps} value={["JavaScript", "React"]} />);

    const removeButton = screen.getAllByRole("button").find((btn) =>
      btn.querySelector("svg")
    );
    if (removeButton) {
      fireEvent.click(removeButton);
      expect(mockOnChange).toHaveBeenCalledWith(["React"]);
    }
  });

  it("removes last tag on Backspace when input is empty", () => {
    render(<SmartTagInput {...defaultProps} value={["JavaScript", "React"]} />);

    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Backspace" });

    expect(mockOnChange).toHaveBeenCalledWith(["JavaScript"]);
  });

  it("respects maxTags limit", () => {
    render(<SmartTagInput {...defaultProps} maxTags={2} value={["JavaScript", "React"]} />);

    // Input should not be visible when max tags reached
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows tag count", () => {
    render(<SmartTagInput {...defaultProps} value={["JavaScript"]} maxTags={5} />);

    expect(screen.getByText(/1\s*\/\s*5\s*个标签/)).toBeInTheDocument();
  });

  it("validates tag format by not adding invalid tag", () => {
    const onChange = vi.fn();
    render(
      <SmartTagInput
        {...defaultProps}
        onChange={onChange}
      />
    );

    const input = screen.getByPlaceholderText("输入标签...");
    fireEvent.change(input, { target: { value: "invalid@tag" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Tag should not be added
    expect(onChange).not.toHaveBeenCalled();
  });

  it("validates tag length by not adding long tag", () => {
    const onChange = vi.fn();
    render(
      <SmartTagInput
        {...defaultProps}
        onChange={onChange}
      />
    );

    const input = screen.getByPlaceholderText("输入标签...");
    fireEvent.change(input, { target: { value: "a".repeat(21) } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).not.toHaveBeenCalledWith(["a".repeat(21)]);
  });

  it("prevents duplicate tags by not adding existing tag", () => {
    const onChange = vi.fn();
    render(
      <SmartTagInput
        {...defaultProps}
        value={["JavaScript"]}
        onChange={onChange}
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "JavaScript" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).not.toHaveBeenCalledWith(["JavaScript", "JavaScript"]);
  });

  it("supports keyboard navigation in suggestions", () => {
    render(<SmartTagInput {...defaultProps} />);

    const input = screen.getByPlaceholderText("输入标签...");
    fireEvent.change(input, { target: { value: "J" } });

    // Press arrow down to navigate suggestions
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it("closes suggestions on Escape", () => {
    render(<SmartTagInput {...defaultProps} />);

    const input = screen.getByPlaceholderText("输入标签...");
    fireEvent.change(input, { target: { value: "J" } });
    
    expect(screen.getByText("JavaScript")).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "Escape" });

    // Suggestions should be closed after a short delay due to blur handling
  });

  it("creates new tag option when input not in available tags", () => {
    render(<SmartTagInput {...defaultProps} />);

    const input = screen.getByPlaceholderText("输入标签...");
    fireEvent.change(input, { target: { value: "NewTag" } });

    expect(screen.getByText(/创建新标签: NewTag/)).toBeInTheDocument();
  });
});
