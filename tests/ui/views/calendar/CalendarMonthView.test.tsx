import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("lucide-react", () => ({}));

vi.mock("../../../../src/utils/format-date.js", () => ({
  toDateKey: (date: Date) => date.toISOString().split("T")[0],
}));

import { CalendarMonthView } from "../../../../src/ui/views/calendar/CalendarMonthView.js";
import type { Task, Project } from "../../../../src/core/types.js";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Month Task",
    description: null,
    status: "pending",
    priority: null,
    dueDate: "2026-02-15T00:00:00.000Z",
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

describe("CalendarMonthView", () => {
  const defaultProps = {
    selectedDate: new Date("2026-02-15"),
    weekStartDay: 0, // Sunday
    tasks: [makeTask()],
    projects: [] as Project[],
    onSelectTask: vi.fn(),
    onDayClick: vi.fn(),
  };

  it("renders weekday headers", () => {
    render(<CalendarMonthView {...defaultProps} />);
    expect(screen.getByText("Sun")).toBeDefined();
    expect(screen.getByText("Mon")).toBeDefined();
    expect(screen.getByText("Tue")).toBeDefined();
    expect(screen.getByText("Wed")).toBeDefined();
    expect(screen.getByText("Thu")).toBeDefined();
    expect(screen.getByText("Fri")).toBeDefined();
    expect(screen.getByText("Sat")).toBeDefined();
  });

  it("renders 42 day cells (6 rows x 7 cols)", () => {
    const { container } = render(<CalendarMonthView {...defaultProps} />);
    // The grid has grid-rows-6 grid-cols-7 = 42 cells
    const cells = container.querySelectorAll(".grid.grid-cols-7.grid-rows-6 > div");
    expect(cells.length).toBe(42);
  });

  it("renders task chip in correct day cell", () => {
    render(<CalendarMonthView {...defaultProps} />);
    expect(screen.getByText("Month Task")).toBeDefined();
  });

  it("calls onSelectTask when task chip is clicked", () => {
    render(<CalendarMonthView {...defaultProps} />);
    fireEvent.click(screen.getByText("Month Task"));
    expect(defaultProps.onSelectTask).toHaveBeenCalledWith("t1");
  });

  it("calls onDayClick when day number is clicked", () => {
    render(<CalendarMonthView {...defaultProps} />);
    // Find the "15" day button (our selectedDate is Feb 15)
    const dayButtons = screen.getAllByText("15");
    if (dayButtons.length > 0) {
      fireEvent.click(dayButtons[0]);
      expect(defaultProps.onDayClick).toHaveBeenCalled();
    }
  });

  it("shows overflow indicator when more than 3 tasks on a day", () => {
    const tasks = [
      makeTask({ id: "t1", title: "Task 1" }),
      makeTask({ id: "t2", title: "Task 2" }),
      makeTask({ id: "t3", title: "Task 3" }),
      makeTask({ id: "t4", title: "Task 4" }),
    ];
    render(<CalendarMonthView {...defaultProps} tasks={tasks} />);
    expect(screen.getByText("+1 more")).toBeDefined();
  });

  it("renders with Monday as week start", () => {
    render(<CalendarMonthView {...defaultProps} weekStartDay={1} />);
    // First header should be Mon
    const headers = screen.getAllByText(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/);
    expect(headers[0].textContent).toBe("Mon");
  });
});
