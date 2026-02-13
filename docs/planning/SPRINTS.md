# Sprints

Two-week sprint cycles. Each sprint has a clear goal and pulls items from the [Backlog](BACKLOG.md).

## How Sprints Work

- **Duration**: 2 weeks
- **Planning**: Select items from backlog at sprint start, assign to sprint column in BACKLOG.md
- **Daily work**: Pick the next `ready` item, mark `in-progress`, complete it
- **Review**: At sprint end, update items to `done`, write retro notes, plan next sprint
- **Carry-over**: Incomplete items return to backlog or carry into the next sprint

### Sprint Sizing

| Size | Effort | Example |
|------|--------|---------|
| S | < 2 hours | Wire a single service to DB, add a test file |
| M | 2–6 hours | Build a complete view, implement a CLI command end-to-end |
| L | 1–2 days | Plugin loader with validation, keyboard navigation system |
| XL | 3–5 days | Sandbox implementation, storage abstraction layer |

---

## Sprint 1 — "First Blood"

**Goal**: Wire the skeleton to a real database. Tasks can be created, listed, completed, and deleted through both the UI and CLI. The app actually works.

**Dates**: TBD (2 weeks)

| ID | Item | Size | Status |
|----|------|------|--------|
| D-03 | Generate initial migration from schema | S | done |
| D-04 | CRUD query helpers (tasks, projects, tags, task_tags) | M | done |
| C-01 | Wire TaskService to SQLite via Drizzle queries | M | done |
| C-02 | Wire ProjectService to SQLite | S | done |
| C-03 | Wire TagService to SQLite | S | done |
| C-04 | Task creation with full field support | M | done |
| C-05 | Task completion (mark done, set completedAt) | S | done |
| C-06 | Task editing (title, priority, due, project, tags) | M | done |
| C-07 | Task deletion | S | done |
| C-08 | Task listing with filters | S | done |
| C-09 | Due date queries (today, upcoming, overdue) | S | done |
| C-10 | Priority sorting in queries | S | done |
| U-06 | Wire Inbox view to live data | M | done |
| U-07 | Wire Today view to live data | S | done |
| U-08 | Wire Upcoming view to live data | S | done |
| L-02 | `docket add` — wire to TaskService | S | done |
| L-03 | `docket list` — wire to TaskService | S | done |
| L-04 | `docket done` — wire to TaskService | S | done |
| T-07 | Integration tests: TaskService + SQLite | M | done |

**Capacity**: ~18 items (mostly S/M), fits a focused 2-week sprint.

**Definition of Done**:
- [x] `pnpm dev` → open browser → create a task via input → see it in the inbox
- [x] Complete a task → it disappears from inbox
- [x] Today view shows only tasks due today
- [x] `pnpm cli add "task"` → `pnpm cli list` shows the task
- [x] `pnpm cli done <id>` marks the task complete
- [x] Integration tests pass: create → read → update → complete → delete
- [x] `pnpm check` passes (lint + typecheck + test)

---

## Sprint 2 — "Feel Good"

**Goal**: The app feels polished. Keyboard navigation, command palette, theme switching, task editor, project views, recurring tasks. Users can actually use this day-to-day.

**Dates**: TBD (2 weeks, after Sprint 1)

| ID | Item | Size | Status |
|----|------|------|--------|
| C-11 | Recurring task creation on completion | M | done |
| C-12 | Task search (full-text across title + description) | S | done |
| U-09 | Project view with task list | M | done |
| U-10 | Settings view: theme toggle | S | done |
| U-12 | Task detail panel / editor | L | done |
| U-13 | Keyboard navigation (j/k, enter, esc) | L | done |
| U-14 | Command palette keybinding (Ctrl+K) | S | done |
| U-15 | Light/dark theme switching | S | done |
| P-06 | Parser inline preview (show parsed result as user types) | M | done |
| L-05 | `docket edit` — wire to TaskService | S | done |
| L-06 | `docket delete` — wire to TaskService | S | done |
| L-07 | JSON output format (`--json`) | S | done |
| T-08 | Integration tests: CLI commands | M | done |
| T-09 | Component tests: TaskInput, TaskList | M | done |

**Capacity**: ~14 items (mix of S/M/L), fits a 2-week sprint.

**Definition of Done**:
- [x] j/k navigates tasks, Enter opens editor, Esc closes
- [x] Ctrl+K opens command palette with available commands
- [x] Theme toggle switches between light and dark
- [x] Completing a recurring task creates the next occurrence
- [x] Task detail panel shows all fields and allows editing
- [x] Project view filters to a single project
- [x] CLI `edit` and `delete` commands work
- [x] `pnpm check` passes

---

## Sprint 3 — "Plugins: Foundation"

**Goal**: Plugin loader works. Plugins can be discovered, validated, loaded, and unloaded. The event bus dispatches task lifecycle hooks. The example plugin actually runs.

**Dates**: TBD (2 weeks, after Sprint 2)

| ID | Item | Size | Status |
|----|------|------|--------|
| PL-16 | Event bus for task lifecycle hooks | M | pending |
| PL-04 | Plugin loader (discover + validate manifests) | L | pending |
| PL-05 | Plugin lifecycle (load/unload, call onLoad/onUnload) | L | pending |
| PL-06 | Plugin sandbox (restricted execution context) | XL | pending |
| PL-07 | Plugin API surface (task read/write, events) | L | pending |
| PL-17 | Plugin-specific isolated storage (persist to DB) | M | pending |
| T-10 | Plugin loader integration tests | M | pending |

**Capacity**: ~7 items but heavier (L/XL), fits a 2-week sprint.

**Definition of Done**:
- [ ] Drop a plugin folder into `plugins/` → Docket discovers it on startup
- [ ] Invalid manifests are rejected with clear error messages
- [ ] Plugin `onLoad()` and `onUnload()` are called correctly
- [ ] Plugins can register commands via the API
- [ ] Plugins receive `task:create` and `task:complete` events
- [ ] Plugin storage persists across app restarts
- [ ] Example plugin loads and shows task count in status bar
- [ ] `pnpm check` passes

---

## Sprint 4 — "Plugins: UI"

**Goal**: Plugins can extend the UI. Sidebar panels, custom views, status bar items, settings tabs, and the plugin store are all functional.

**Dates**: TBD (2 weeks, after Sprint 3)

| ID | Item | Size | Status |
|----|------|------|--------|
| PL-08 | Plugin UI extension: sidebar panels | L | pending |
| PL-09 | Plugin UI extension: custom views | L | pending |
| PL-10 | Plugin UI extension: status bar | M | pending |
| PL-11 | Plugin commands integration with command palette | M | pending |
| PL-12 | Plugin settings UI in Settings view | M | pending |
| PL-13 | Plugin store view (browse sources.json) | M | pending |
| PL-18 | Built-in Pomodoro plugin (fully functional) | L | pending |

**Capacity**: ~7 items (M/L), fits a 2-week sprint.

**Definition of Done**:
- [ ] Pomodoro plugin renders a sidebar panel with timer
- [ ] Plugin-registered views appear in sidebar navigation
- [ ] Status bar shows plugin-provided items
- [ ] Plugin commands appear in the command palette
- [ ] Plugin settings appear in Settings > Plugins
- [ ] Plugin store lists plugins from sources.json
- [ ] `pnpm check` passes

---

## Future Sprints (Unscheduled)

These will be planned as we get closer. See [BACKLOG.md](BACKLOG.md) for all items.

| Sprint | Theme | Key Items |
|--------|-------|-----------|
| S5 | AI: Foundation | Provider abstraction, OpenAI/Anthropic providers, chat panel UI |
| S6 | AI: Intelligence | Tool use (task CRUD), context injection, follow-up questions, voice input |
| S7 | CI/CD & Release | GitHub Actions, ESLint/Prettier config, Tauri packaging |
| S8 | Markdown Storage | Storage abstraction, Markdown backend, file-based projects |
| S9 | Data Portability | Export (JSON/MD/CSV), import (Todoist), migration tools |
| S10 | Advanced UX | Drag-and-drop, bulk ops, undo/redo, shortcut customization |
| S11 | Hardening | Accessibility audit, performance profiling, error boundaries |
| S12 | v1.0 Release | Stable API freeze, desktop packaging, auto-updater |

---

## Completed Sprints

### Sprint 0 — "Scaffold" (completed)

**Goal**: Project structure, documentation, config files, source skeletons, and test suite.

| ID | Item | Status |
|----|------|--------|
| F-01 | Project scaffold | done |
| F-02 | Core infrastructure | done |
| F-03 | Database schema | done |
| F-04 | Vite + React entry point | done |
| All DOC items | Full documentation suite | done |
| All T-01–T-06 | Test suite (171 tests) | done |
| PL-01 | Plugin manifest schema | done |
| PL-02 | Plugin settings manager | done |
| PL-03 | Plugin registry search | done |
| P-01–P-05 | Parser (NLP, grammar, task parser) | done |

**Result**: 69 source files, 8 documentation files, 14 test files, 171 passing tests. Dev server runs.

### Sprint 1 — "First Blood" (completed)

**Goal**: Wire the skeleton to a real database. Tasks can be created, listed, completed, and deleted through both the UI and CLI.

| ID | Item | Status |
|----|------|--------|
| D-03, D-04 | Migration generation + CRUD query helpers | done |
| C-01–C-10 | Full task CRUD with filters, priorities, due dates | done |
| U-06–U-08 | Inbox, Today, Upcoming views wired to live data | done |
| L-02–L-04 | CLI add, list, done wired to TaskService | done |
| T-07 | Integration tests: TaskService + SQLite | done |

**Result**: Full CRUD lifecycle with SQLite persistence. 219 passing tests. UI and CLI both functional.

### Sprint 2 — "Feel Good" (completed)

**Goal**: Polish for daily use. Keyboard navigation, command palette, theme switching, task editor, project views, recurring tasks, CLI fully wired.

| ID | Item | Status |
|----|------|--------|
| C-11 | Recurring task creation on completion | done |
| C-12 | Task search (full-text across title + description) | done |
| U-09 | Project view with sidebar navigation | done |
| U-10, U-15 | Settings theme toggle + light/dark switching | done |
| U-12 | Task detail panel / editor (slide-over, auto-save on blur) | done |
| U-13 | Keyboard navigation (j/k/Enter/Esc) | done |
| U-14 | Command palette (Ctrl+K) with arrow nav | done |
| P-06 | Parser inline preview | done |
| L-05–L-07 | CLI edit, delete, --json on all commands | done |
| T-08, T-09 | CLI integration tests + component tests | done |

**Result**: 7 new files, 20 modified files. 246 passing tests. Keyboard-driven workflow, persistent themes, project views, recurring tasks all working.
