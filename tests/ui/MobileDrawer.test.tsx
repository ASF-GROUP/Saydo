import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileDrawer } from "../../src/ui/components/MobileDrawer.js";

describe("MobileDrawer", () => {
  afterEach(() => {
    // Reset body overflow
    document.body.style.overflow = "";
  });

  it("renders children when open", () => {
    render(
      <MobileDrawer open={true} onClose={vi.fn()}>
        <p>Drawer Content</p>
      </MobileDrawer>,
    );
    expect(screen.getByText("Drawer Content")).toBeDefined();
  });

  it("renders children when closed (but hidden)", () => {
    render(
      <MobileDrawer open={false} onClose={vi.fn()}>
        <p>Drawer Content</p>
      </MobileDrawer>,
    );
    // Content is in the DOM but the wrapper is invisible
    expect(screen.getByText("Drawer Content")).toBeDefined();
  });

  it("has translate-x-0 when open", () => {
    render(
      <MobileDrawer open={true} onClose={vi.fn()}>
        <p>Content</p>
      </MobileDrawer>,
    );
    const drawer = screen.getByRole("dialog");
    expect(drawer.className).toContain("translate-x-0");
  });

  it("has -translate-x-full when closed", () => {
    render(
      <MobileDrawer open={false} onClose={vi.fn()}>
        <p>Content</p>
      </MobileDrawer>,
    );
    const drawer = screen.getByRole("dialog", { hidden: true });
    expect(drawer.className).toContain("-translate-x-full");
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <MobileDrawer open={true} onClose={onClose}>
        <p>Content</p>
      </MobileDrawer>,
    );
    // Click the backdrop (first child div of the root)
    const backdrop = container.firstElementChild!.firstElementChild!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <MobileDrawer open={true} onClose={onClose}>
        <p>Content</p>
      </MobileDrawer>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks body scroll when open", () => {
    render(
      <MobileDrawer open={true} onClose={vi.fn()}>
        <p>Content</p>
      </MobileDrawer>,
    );
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body scroll when closed", () => {
    const { rerender } = render(
      <MobileDrawer open={true} onClose={vi.fn()}>
        <p>Content</p>
      </MobileDrawer>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <MobileDrawer open={false} onClose={vi.fn()}>
        <p>Content</p>
      </MobileDrawer>,
    );
    expect(document.body.style.overflow).toBe("");
  });
});
