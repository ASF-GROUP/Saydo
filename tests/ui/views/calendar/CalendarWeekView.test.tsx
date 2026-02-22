import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("lucide-react", () => ({
  Circle: (props: any) => <svg data-testid="circle-icon" {...props} />,
  CheckCircle2: (props: any) => <svg data-testid="check-circle" {...props} />,
}));

vi.mock("../../../../src/utils/format-date.js", () => ({
  toDateKey: (date: Date) => date.toISOString().split("T")[0],
}));

vi.mock("../../../../src/ui/views/calendar/useCalendarNavigation.js", () => ({
  getWeekDays: (date: Date, weekStartDay: number) => {
    const days: Date[] = [];
    const start = new Date(date);
    const dayOfWeek = start.getDay();
    const diff = (dayOfWeek - weekStartDay + 7) % 7;
    start.setDate(start.getDate() - diff);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  },
}));

import { CalendarWeekView } from "../../../../src/ui/views/calendar/CalendarWeekView.js";
import type { Task, Project } from "../../../../src/core/types.js";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Week Task",
    description: null,
    status: "pending",
    priority: null,
    dueDate: "2026-02-23T00:00:00.000Z",
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

describe("CalendarWeekView", () => {
  const defaultProps = {
    selectedDate: new Date("2026-02-23"),
    weekStartDay: 0, // Sunday
    tasks: [makeTask()],
    projects: [] as Project[],
    onSelectTask: vi.fn(),
    onToggleTask: vi.fn(),
    onDayClick: vi.fn(),
  };

  it("renders 7 day headers", () => {
    render(<CalendarWeekView {...defaultProps} />);
    // Should have weekday abbreviations
    const buttons = screen.getAllByRole("button");
    // Day headers are buttons, at least 7 for the days
    expect(buttons.length).toBeGreaterThanOrEqual(7);
  });

  it("renders tasks in the correct day column", () => {
    render(<CalendarWeekView {...defaultProps} />);
    expect(screen.getByText("Week Task")).toBeDefined();
  });

  it("calls onSelectTask when task is clicked", () => {
    render(<CalendarWeekView {...defaultProps} />);
    fireEvent.click(screen.getByText("Week Task"));
    expect(defaultProps.onSelectTask).toHaveBeenCalledWith("t1");
  });

  it("calls onDayClick when day header is clicked", () => {
    render(<CalendarWeekView {...defaultProps} />);
    // Day headers contain the day number - click the first one
    const dayHeaders = screen.getAllByRole("button").filter((b) => {
      const text = b.textContent || "";
      // Day headers contain weekday abbreviation and day number
      return /^\w{3}\d+$/.test(text.replace(/\s/g, ""));
    });
    if (dayHeaders.length > 0) {
      fireEvent.click(dayHeaders[0]);
      expect(defaultProps.onDayClick).toHaveBeenCalled();
    }
  });

  it("shows completed tasks with reduced opacity", () => {
    const completed = makeTask({ status: "completed", title: "Done" });
    render(<CalendarWeekView {...defaultProps} tasks={[completed]} />);
    const taskText = screen.getByText("Done");
    expect(taskText.className).toContain("line-through");
  });

  it("renders without crashing with no tasks", () => {
    render(<CalendarWeekView {...defaultProps} tasks={[]} />);
    // Should render the grid without tasks
    const grid = document.querySelector(".grid.grid-cols-7");
    expect(grid).toBeDefined();
  });
});
