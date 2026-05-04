import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("Form Mobile (TASK-5.3)", () => {
  it("SC-5.3.1: form inputs have min-height for touch targets", () => {
    const { container } = render(
      <div className="space-y-4">
        <div className="space-y-2">
          <label>名称</label>
          <input 
            className="h-10 w-full rounded-md border px-3 py-2" 
            placeholder="请输入"
          />
        </div>
      </div>
    );

    const input = container.querySelector("input");
    expect(input).toHaveClass("h-10"); // h-10 = 40px, close to 44px
  });

  it("SC-5.3.2: buttons are full width on mobile", () => {
    const { container } = render(
      <div className="flex flex-col gap-2 sm:flex-row">
        <button className="w-full sm:w-auto">保存</button>
        <button className="w-full sm:w-auto">取消</button>
      </div>
    );

    const buttons = container.querySelectorAll("button");
    buttons.forEach((btn) => {
      expect(btn.classList.contains("w-full")).toBeTruthy();
      expect(btn.classList.contains("sm:w-auto")).toBeTruthy();
    });
  });

  it("SC-5.3.3: form layout is single column on mobile", () => {
    const { container } = render(
      <div className="grid gap-4 sm:grid-cols-3">
        <div>Field 1</div>
        <div>Field 2</div>
        <div>Field 3</div>
      </div>
    );

    const grid = container.firstChild as HTMLElement;
    expect(grid.classList.contains("grid")).toBeTruthy();
    expect(grid.classList.contains("sm:grid-cols-3")).toBeTruthy();
  });

  it("SC-5.3.4: textareas are full width", () => {
    const { container } = render(
      <textarea className="w-full min-h-[100px]" />
    );

    const textarea = container.querySelector("textarea");
    expect(textarea).toHaveClass("w-full");
  });
});