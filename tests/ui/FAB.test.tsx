import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FAB } from "../../src/ui/components/FAB.js";

describe("FAB", () => {
  it("renders the button", () => {
    render(<FAB onClick={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Add task" });
    expect(button).toBeDefined();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<FAB onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("has correct aria-label", () => {
    render(<FAB onClick={vi.fn()} />);
    expect(screen.getByLabelText("Add task")).toBeDefined();
  });

  it("has md:hidden class for mobile-only display", () => {
    render(<FAB onClick={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Add task" });
    expect(button.className).toContain("md:hidden");
  });
});
