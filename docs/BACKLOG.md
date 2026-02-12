# Backlog

All work items for ASF Docket, organized by area and prioritized within each section. Items are pulled from here into sprints.

## Status Key

- `done` — Completed
- `ready` — Defined, estimated, ready for a sprint
- `needs-design` — Requires design decisions before implementation
- `blocked` — Waiting on another item
- `idea` — Not yet scoped, needs refinement

---

## Foundation & Infrastructure

| ID | Item | Status | Sprint | Notes |
|----|------|--------|--------|-------|
| F-01 | Project scaffold (package.json, tsconfig, lint, format) | done | — | Initial commit |
| F-02 | Core infrastructure (logger, config, validation, IDs) | done | — | Initial commit |
| F-03 | Database schema and migrations (Drizzle + SQLite) | done | — | Schema defined, migration runner ready |
| F-04 | Vite + React entry point and dev server | done | — | index.html, vite.config.ts, main.tsx |
| F-05 | CI/CD pipeline (GitHub Actions: lint, typecheck, test) | ready | — | Use Sentinel's ci.yml as template |
| F-06 | ESLint config file | ready | — | Needs eslint.config.js for flat config |
| F-07 | Prettier config file | ready | — | .prettierrc |

## Core — Task CRUD

| ID | Item | Status | Sprint | Notes |
|----|------|--------|--------|-------|
| C-01 | Wire TaskService to SQLite via Drizzle queries | ready | S1 | Connect tasks.ts to db/queries.ts |
| C-02 | Wire ProjectService to SQLite | ready | S1 | |
| C-03 | Wire TagService to SQLite | ready | S1 | |
| C-04 | Task creation with full field support | ready | S1 | Depends on C-01 |
| C-05 | Task completion (mark done, set completedAt) | ready | S1 | |
| C-06 | Task editing (title, priority, due, project, tags) | ready | S1 | |
| C-07 | Task deletion | ready | S1 | |
| C-08 | Task listing with filters (status, project, tag, priority) | ready | S1 | Depends on C-01, filter logic exists |
| C-09 | Due date queries (today, upcoming, overdue) | ready | S1 | |
| C-10 | Priority sorting in queries | ready | S1 | Sort logic exists, wire to DB |
| C-11 | Recurring task creation on completion | ready | S2 | Recurrence logic exists |
| C-12 | Task search (full-text across title + description) | ready | S2 | |
| C-13 | Bulk operations (complete all, move, tag multiple) | needs-design | — | UX design needed |
| C-14 | Sub-tasks (nested hierarchy) | idea | — | Future |

## Parser & NLP

| ID | Item | Status | Sprint | Notes |
|----|------|--------|--------|-------|
| P-01 | Natural language date/time parsing (chrono-node) | done | — | Tested, 12 tests |
| P-02 | Priority extraction (p1–p4) | done | — | Tested, 10 tests |
| P-03 | Tag extraction (#tag) | done | — | Tested, 9 tests |
| P-04 | Project extraction (+project) | done | — | Tested, 6 tests |
| P-05 | Integrated task parser | done | — | Tested, 11 tests |
| P-06 | Parser inline preview (show parsed result as user types) | ready | S2 | UI feature |
| P-07 | Natural language queries ("what's due this week?") | idea | — | Future |

## UI — Views & Components

| ID | Item | Status | Sprint | Notes |
|----|------|--------|--------|-------|
| U-01 | Sidebar navigation | done | — | Component exists |
| U-02 | TaskInput component with NLP | done | — | Component exists |
| U-03 | TaskItem component | done | — | Component exists |
| U-04 | TaskList component | done | — | Component exists |
| U-05 | CommandPalette component | done | — | Component exists |
| U-06 | Wire Inbox view to live data | ready | S1 | Depends on C-01 |
| U-07 | Wire Today view to live data | ready | S1 | Depends on C-09 |
| U-08 | Wire Upcoming view to live data | ready | S1 | Depends on C-09 |
| U-09 | Project view with task list | ready | S2 | Depends on C-02 |
| U-10 | Settings view: theme toggle | ready | S2 | |
| U-11 | Settings view: storage mode display | ready | S2 | |
| U-12 | Task detail panel / editor | ready | S2 | Click task → edit |
| U-13 | Keyboard navigation (j/k, enter, esc) | ready | S2 | |
| U-14 | Command palette keybinding (Ctrl+K) | ready | S2 | Component exists, needs global listener |
| U-15 | Light/dark theme switching | ready | S2 | CSS exists, needs toggle wiring |
| U-16 | Drag-and-drop task reordering | needs-design | — | |
| U-17 | Undo/redo for task operations | needs-design | — | |
| U-18 | Focus mode (hide everything except current task) | idea | — | |

## CLI

| ID | Item | Status | Sprint | Notes |
|----|------|--------|--------|-------|
| L-01 | CLI entry point with Commander.js | done | — | Scaffolded |
| L-02 | `docket add` — wire to TaskService | ready | S1 | Depends on C-01 |
| L-03 | `docket list` — wire to TaskService with filters | ready | S1 | Depends on C-08 |
| L-04 | `docket done` — wire to TaskService | ready | S1 | Depends on C-05 |
| L-05 | `docket edit` — wire to TaskService | ready | S2 | Depends on C-06 |
| L-06 | `docket delete` — wire to TaskService | ready | S2 | Depends on C-07 |
| L-07 | JSON output format (`--json`) | ready | S2 | |
| L-08 | Interactive task picker (fuzzy find) | idea | — | |

## Plugin System

| ID | Item | Status | Sprint | Notes |
|----|------|--------|--------|-------|
| PL-01 | Plugin manifest schema + validation | done | — | Zod schema, 13 tests |
| PL-02 | Plugin settings manager | done | — | In-memory, 7 tests |
| PL-03 | Plugin registry search | done | — | 10 tests |
| PL-04 | Plugin loader (discover + validate manifests) | ready | S3 | |
| PL-05 | Plugin lifecycle (load/unload, call onLoad/onUnload) | ready | S3 | |
| PL-06 | Plugin sandbox (restricted execution context) | needs-design | S3 | vm module vs Worker |
| PL-07 | Plugin API surface (task read/write, events) | ready | S3 | api.ts scaffolded |
| PL-08 | Plugin UI extension: sidebar panels | ready | S4 | |
| PL-09 | Plugin UI extension: custom views | ready | S4 | |
| PL-10 | Plugin UI extension: status bar | ready | S4 | |
| PL-11 | Plugin commands integration with command palette | ready | S4 | |
| PL-12 | Plugin settings UI in Settings view | ready | S4 | |
| PL-13 | Plugin store view (browse sources.json) | ready | S4 | |
| PL-14 | Plugin install/uninstall from store | needs-design | — | Download + extract |
| PL-15 | Plugin permission approval UX | needs-design | — | |
| PL-16 | Event bus for task lifecycle hooks | ready | S3 | |
| PL-17 | Plugin-specific isolated storage (persist to DB) | ready | S3 | settings.ts partial |
| PL-18 | Built-in Pomodoro plugin (fully functional) | blocked | — | Blocked by PL-05 |

## Storage & Data

| ID | Item | Status | Sprint | Notes |
|----|------|--------|--------|-------|
| D-01 | SQLite connection + WAL mode | done | — | client.ts |
| D-02 | Drizzle migration runner | done | — | migrate.ts |
| D-03 | Generate initial migration from schema | ready | S1 | `pnpm db:generate` |
| D-04 | CRUD query helpers (tasks, projects, tags, task_tags) | ready | S1 | queries.ts partial |
| D-05 | Markdown storage backend | needs-design | — | v0.7 milestone |
| D-06 | Storage interface abstraction | needs-design | — | v0.7 milestone |
| D-07 | Data export (JSON, Markdown, CSV) | ready | — | |
| D-08 | Data import (Todoist JSON, plain text) | needs-design | — | |

## Testing

| ID | Item | Status | Sprint | Notes |
|----|------|--------|--------|-------|
| T-01 | Parser unit tests | done | — | 48 tests |
| T-02 | Core logic unit tests (priorities, recurrence, filters) | done | — | 38 tests |
| T-03 | Zod schema validation tests | done | — | 33 tests |
| T-04 | Plugin system tests (types, settings, registry) | done | — | 30 tests |
| T-05 | CLI formatter tests | done | — | 8 tests |
| T-06 | Config/env tests | done | — | 13 tests |
| T-07 | Integration tests: TaskService + SQLite | ready | S1 | End-to-end CRUD |
| T-08 | Integration tests: CLI commands | ready | S2 | |
| T-09 | Component tests: TaskInput, TaskList | ready | S2 | |
| T-10 | Plugin loader integration tests | ready | S3 | |

## Documentation

| ID | Item | Status | Sprint | Notes |
|----|------|--------|--------|-------|
| DOC-01 | README.md | done | — | |
| DOC-02 | CLAUDE.md | done | — | |
| DOC-03 | docs/README.md (project overview) | done | — | |
| DOC-04 | docs/ARCHITECTURE.md | done | — | |
| DOC-05 | docs/PLUGIN_API.md | done | — | |
| DOC-06 | docs/PLUGIN_EXAMPLES.md | done | — | |
| DOC-07 | docs/ROADMAP.md | done | — | |
| DOC-08 | docs/CONTRIBUTING.md | done | — | |
| DOC-09 | docs/SETUP_LOCAL.md | done | — | |
| DOC-10 | docs/SECURITY.md | done | — | |
| DOC-11 | docs/BACKLOG.md | done | — | This file |
| DOC-12 | docs/SPRINTS.md | done | — | Sprint tracking |
