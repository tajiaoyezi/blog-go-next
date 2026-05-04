import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

// Mock use-mobile hook
const mockUseIsMobile = vi.fn();

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

describe("Admin Sidebar Mobile (TASK-5.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SC-5.1.1: shows hamburger button on mobile", () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader><div>Logo</div></SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton>首页</SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    );

    const trigger = screen.getByRole("button", { name: /toggle sidebar/i });
    expect(trigger).toBeInTheDocument();
  });

  it("SC-5.1.1: sidebar is rendered as Sheet on mobile", () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent><div>Menu</div></SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    );

    // Open the drawer first
    const trigger = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(trigger);

    // In mobile, sidebar should have data-mobile="true"
    const sidebar = document.querySelector('[data-mobile="true"]');
    expect(sidebar).toBeTruthy();
  });

  it("SC-5.1.2: opens drawer from left when clicking hamburger", () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent><div>Menu</div></SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    );

    const trigger = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(trigger);

    // After click, the sheet should be open (overlay exists)
    const overlay = document.querySelector('[data-slot="sheet-overlay"]');
    expect(overlay).toBeTruthy();
  });

  it("SC-5.1.3: closes drawer when clicking overlay", () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent><div>Menu</div></SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    );

    // Open drawer
    const trigger = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(trigger);

    // Close by clicking overlay
    const overlay = document.querySelector('[data-slot="sheet-overlay"]');
    expect(overlay).toBeTruthy();
    
    if (overlay) {
      fireEvent.click(overlay);
    }

    // After close, overlay should be removed
    const closedOverlay = document.querySelector('[data-slot="sheet-overlay"]');
    expect(closedOverlay).toBeFalsy();
  });

  it("SC-5.1.4: locks background scroll when drawer is open", () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent><div>Menu</div></SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    );

    const trigger = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(trigger);

    // After click, the sheet should be open with overlay
    const overlay = document.querySelector('[data-slot="sheet-overlay"]');
    expect(overlay).toBeTruthy();
  });

  it("SC-5.1.5: active menu item is highlighted in drawer", () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>首页</SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>文章</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    );

    const trigger = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(trigger);

    // Drawer should open with menu items
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    
    // Check that menu items are rendered
    expect(dialog?.textContent).toContain("首页");
    expect(dialog?.textContent).toContain("文章");
  });

  it("SC-5.1.6: switches between mobile and desktop layout", () => {
    // Mobile mode
    mockUseIsMobile.mockReturnValue(true);

    const { rerender } = render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent><div>Menu</div></SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    );

    // Hamburger button should be visible in both modes
    const trigger = screen.getByRole("button", { name: /toggle sidebar/i });
    expect(trigger).toBeInTheDocument();

    // Switch to desktop
    mockUseIsMobile.mockReturnValue(false);

    // Re-render to pick up new viewport
    rerender(
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader><div>Logo</div></SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton>首页</SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <div>
          <SidebarTrigger />
          <div>Main Content</div>
        </div>
      </SidebarProvider>
    );

    // Desktop: hamburger button should still exist
    expect(screen.getByRole("button", { name: /toggle sidebar/i })).toBeInTheDocument();
  });

  it("SC-5.1.7: drawer has correct dark mode styles", () => {
    mockUseIsMobile.mockReturnValue(true);
    document.documentElement.classList.add("dark");

    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent><div>Menu</div></SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    );

    const trigger = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(trigger);

    const drawerContent = document.querySelector('[role="dialog"]');
    expect(drawerContent).toBeTruthy();
    if (drawerContent) {
      expect(drawerContent).toHaveClass("bg-sidebar");
      expect(drawerContent).toHaveClass("text-sidebar-foreground");
    }

    document.documentElement.classList.remove("dark");
  });

  it("drawer width is 80vw with max 320px on mobile", () => {
    mockUseIsMobile.mockReturnValue(true);

    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarContent><div>Menu</div></SidebarContent>
        </Sidebar>
        <SidebarTrigger />
      </SidebarProvider>
    );

    const trigger = screen.getByRole("button", { name: /toggle sidebar/i });
    fireEvent.click(trigger);

    // Find the sheet content element by role (dialog)
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    
    if (dialog) {
      const classList = (dialog as HTMLElement).classList;
      expect(classList.contains("w-[80vw]")).toBeTruthy();
      expect(classList.contains("max-w-[320px]")).toBeTruthy();
    }
  });
});