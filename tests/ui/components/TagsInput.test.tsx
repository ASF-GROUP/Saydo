import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("lucide-react", () => ({
  X: (props: any) => <svg data-testid="x-icon" {...props} />,
}));

vi.mock("../../../src/utils/color.js", () => ({
  hexToRgba: (hex: string, alpha: number) => `rgba(0,0,0,${alpha})`,
}));

import { TagsInput } from "../../../src/ui/components/TagsInput.js";

describe("TagsInput", () => {
  const defaultProps = {
    value: ["bug", "frontend"],
    onChange: vi.fn(),
    suggestions: ["backend", "design", "bug", "frontend"],
    placeholder: "Add tag...",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders existing tags", () => {
    render(<TagsInput {...defaultProps} />);
    expect(screen.getByText("bug")).toBeDefined();
    expect(screen.getByText("frontend")).toBeDefined();
  });

  it("renders remove buttons for each tag", () => {
    render(<TagsInput {...defaultProps} />);
    expect(screen.getByLabelText("Remove tag bug")).toBeDefined();
    expect(screen.getByLabelText("Remove tag frontend")).toBeDefined();
  });

  it("calls onChange when removing a tag", () => {
    render(<TagsInput {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Remove tag bug"));
    expect(defaultProps.onChange).toHaveBeenCalledWith(["frontend"]);
  });

  it("adds a tag on Enter key", () => {
    render(<TagsInput {...defaultProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "newTag" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(defaultProps.onChange).toHaveBeenCalledWith(["bug", "frontend", "newtag"]);
  });

  it("adds a tag on comma key", () => {
    render(<TagsInput {...defaultProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "design" } });
    fireEvent.keyDown(input, { key: "," });
    expect(defaultProps.onChange).toHaveBeenCalledWith(["bug", "frontend", "design"]);
  });

  it("does not add duplicate tags", () => {
    render(<TagsInput {...defaultProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "bug" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });

  it("removes last tag on Backspace when input is empty", () => {
    render(<TagsInput {...defaultProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(defaultProps.onChange).toHaveBeenCalledWith(["bug"]);
  });

  it("shows suggestions dropdown on focus", () => {
    render(<TagsInput {...defaultProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    // Only suggestions not already in value should appear
    expect(screen.getByText("backend")).toBeDefined();
    expect(screen.getByText("design")).toBeDefined();
  });

  it("filters suggestions based on input", () => {
    render(<TagsInput {...defaultProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "back" } });
    expect(screen.getByText("backend")).toBeDefined();
    expect(screen.queryByText("design")).toBeNull();
  });

  it("adds suggestion on click", () => {
    render(<TagsInput {...defaultProps} />);
    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.click(screen.getByText("backend"));
    expect(defaultProps.onChange).toHaveBeenCalledWith(["bug", "frontend", "backend"]);
  });

  it("shows placeholder when no tags selected", () => {
    render(<TagsInput {...defaultProps} value={[]} />);
    expect(screen.getByPlaceholderText("Add tag...")).toBeDefined();
  });

  it("hides placeholder when tags are present", () => {
    render(<TagsInput {...defaultProps} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.placeholder).toBe("");
  });
});
