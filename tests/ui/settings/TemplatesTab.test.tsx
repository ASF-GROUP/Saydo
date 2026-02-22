import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("lucide-react", () => ({
  Plus: (props: any) => <svg data-testid="plus-icon" {...props} />,
  Pencil: (props: any) => <svg data-testid="pencil-icon" {...props} />,
  Trash2: (props: any) => <svg data-testid="trash-icon" {...props} />,
}));

const mockListTemplates = vi.fn();
const mockCreateTemplate = vi.fn();
const mockDeleteTemplate = vi.fn();
const mockUpdateTemplate = vi.fn();

vi.mock("../../../src/ui/api/index.js", () => ({
  api: {
    listTemplates: (...args: any[]) => mockListTemplates(...args),
    createTemplate: (...args: any[]) => mockCreateTemplate(...args),
    deleteTemplate: (...args: any[]) => mockDeleteTemplate(...args),
    updateTemplate: (...args: any[]) => mockUpdateTemplate(...args),
  },
}));

vi.mock("../../../src/utils/logger.js", () => ({
  createLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}));

import { TemplatesTab } from "../../../src/ui/views/settings/TemplatesTab.js";

describe("TemplatesTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTemplates.mockResolvedValue([
      {
        id: "t1",
        name: "Bug Report",
        title: "Fix: {{issue}}",
        description: "",
        priority: 2,
        tags: ["bug"],
        recurrence: null,
      },
    ]);
    mockCreateTemplate.mockResolvedValue({ id: "t2" });
    mockDeleteTemplate.mockResolvedValue(undefined);
  });

  it("renders template list", async () => {
    render(<TemplatesTab />);
    await waitFor(() => {
      expect(screen.getByText("Bug Report")).toBeDefined();
    });
  });

  it("shows template title in list", async () => {
    render(<TemplatesTab />);
    await waitFor(() => {
      expect(screen.getByText("Fix: {{issue}}")).toBeDefined();
    });
  });

  it("shows template tags", async () => {
    render(<TemplatesTab />);
    await waitFor(() => {
      expect(screen.getByText("#bug")).toBeDefined();
    });
  });

  it("shows template priority badge", async () => {
    render(<TemplatesTab />);
    await waitFor(() => {
      expect(screen.getByText("P2")).toBeDefined();
    });
  });

  it("renders New Template button", async () => {
    render(<TemplatesTab />);
    await waitFor(() => {
      expect(screen.getByText("New Template")).toBeDefined();
    });
  });

  it("opens template form on New Template click", async () => {
    render(<TemplatesTab />);
    await waitFor(() => {
      expect(screen.getByText("New Template")).toBeDefined();
    });
    fireEvent.click(screen.getByText("New Template"));
    expect(screen.getByText("New Template", { selector: "h3" })).toBeDefined();
    expect(screen.getByPlaceholderText("e.g., Bug Report")).toBeDefined();
  });

  it("deletes template on delete button click", async () => {
    render(<TemplatesTab />);
    await waitFor(() => {
      expect(screen.getByText("Bug Report")).toBeDefined();
    });
    const deleteButton = screen.getByTitle("Delete template");
    fireEvent.click(deleteButton);
    await waitFor(() => {
      expect(mockDeleteTemplate).toHaveBeenCalledWith("t1");
    });
  });

  it("opens edit form on edit button click", async () => {
    render(<TemplatesTab />);
    await waitFor(() => {
      expect(screen.getByText("Bug Report")).toBeDefined();
    });
    const editButton = screen.getByTitle("Edit template");
    fireEvent.click(editButton);
    expect(screen.getByText("Edit Template")).toBeDefined();
  });

  it("shows empty state when no templates", async () => {
    mockListTemplates.mockResolvedValue([]);
    render(<TemplatesTab />);
    await waitFor(() => {
      expect(screen.getByText(/No templates yet/)).toBeDefined();
    });
  });
});
