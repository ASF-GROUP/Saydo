import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("lucide-react", () => ({
  AlertTriangle: (props: any) => <svg data-testid="alert-icon" {...props} />,
  Calendar: (props: any) => <svg data-testid="calendar-icon" {...props} />,
  ChevronDown: (props: any) => <svg data-testid="chevron-down" {...props} />,
  ChevronRight: (props: any) => <svg data-testid="chevron-right" {...props} />,
}));

import { OverdueSection } from "../../../src/ui/components/OverdueSection.js";
import type { Task, Project } from "../../../src/core/types.js";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Test Task",
    description: null,
    status: "pending",
    priority: null,
    dueDate: "2026-01-01T00:00:00.000Z",
    dueTime: false,
    completedAt: null,
    projectId: null,
    recurrence: null,
    parentId: null,
    remindAt: null,
    tags: [],
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("OverdueSection", () => {
  const defaultProps = {
    tasks: [makeTask()],
    projects: new Map<string, Project>(),
    onSelectTask: vi.fn(),
    onToggleTask: vi.fn(),
    onReschedule: vi.fn(),
    selectedTaskId: null,
  };

  it("renders nothing when tasks is empty", () => {
    const { container } = render(<OverdueSection {...defaultProps} tasks={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders overdue tasks with count", () => {
    render(<OverdueSection {...defaultProps} />);
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("calls onToggleTask when circle is clicked", () => {
    const onToggleTask = vi.fn();
    render(<OverdueSection {...defaultProps} onToggleTask={onToggleTask} />);
    fireEvent.click(screen.getByLabelText("Complete task"));
    expect(onToggleTask).toHaveBeenCalledWith("t1");
  });

  it("calls onSelectTask when row is clicked", () => {
    const onSelectTask = vi.fn();
    render(<OverdueSection {...defaultProps} onSelectTask={onSelectTask} />);
    fireEvent.click(screen.getByText("Test Task"));
    expect(onSelectTask).toHaveBeenCalledWith("t1");
  });

  it("calls onReschedule when button is clicked", () => {
    const onReschedule = vi.fn();
    render(<OverdueSection {...defaultProps} onReschedule={onReschedule} />);
    fireEvent.click(screen.getByText("Reschedule"));
    expect(onReschedule).toHaveBeenCalled();
  });

  it("collapses and expands on toggle click", () => {
    render(<OverdueSection {...defaultProps} />);
    expect(screen.getByText("Test Task")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Overdue"));
    expect(screen.queryByText("Test Task")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Overdue"));
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("shows project badge when task has project", () => {
    const project: Project = {
      id: "p1",
      name: "Work",
      color: "#ff0000",
      icon: null,
      parentId: null,
      isFavorite: false,
      viewStyle: "list",
      sortOrder: 0,
      archived: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const tasks = [makeTask({ projectId: "p1" })];
    const projects = new Map<string, Project>([["p1", project]]);
    render(<OverdueSection {...defaultProps} tasks={tasks} projects={projects} />);
    expect(screen.getByText("Work")).toBeInTheDocument();
  });
});
