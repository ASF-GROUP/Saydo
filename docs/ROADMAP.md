# Roadmap

## v0.1 — Foundation (MVP)

Core task management without plugins. A usable task manager.

- [x] Project scaffold (package.json, tsconfig, linting, formatting)
- [x] Core infrastructure (logger, config, validation, ID generation)
- [x] Database schema and migrations (Drizzle + SQLite)
- [ ] Task CRUD (create, read, update, delete, complete)
- [ ] Project management (create, list, archive)
- [ ] Tag system (create, assign, filter)
- [x] Priority levels (P1–P4 with sorting)
- [ ] Due dates with time support
- [x] Natural language task input (chrono-node + custom grammar)
- [x] Basic React UI: inbox, today, upcoming views
- [x] Sidebar navigation
- [ ] Keyboard-first navigation
- [x] Command palette (Ctrl+K)
- [ ] Light/dark theme
- [x] CLI companion: `add`, `list`, `done`, `edit`, `delete` commands
- [x] Unit tests for core logic and parser
- [x] Documentation: all docs complete

## v0.2 — Polish

Refinements to the core experience before plugins.

- [ ] Recurring tasks (daily, weekly, monthly, custom)
- [ ] Task search and filtering (by project, tag, priority, date range)
- [ ] Bulk operations (complete all, move to project, tag multiple)
- [ ] Drag-and-drop task reordering
- [ ] Task descriptions (longer notes below the title)
- [ ] Undo/redo for task operations
- [ ] Custom CSS theme support
- [ ] Keyboard shortcut customization
- [ ] Data export (JSON, Markdown, CSV)
- [ ] Data import (Todoist JSON, plain text)

## v0.5 — Plugin System

The Obsidian-style plugin architecture.

- [ ] Plugin manifest schema and validation
- [ ] Plugin loader (discovery, validation, loading)
- [ ] Plugin lifecycle management (load, unload, enable, disable)
- [ ] Sandboxed plugin execution environment
- [ ] Plugin API surface: task read/write, events, commands
- [ ] Plugin UI extension points: sidebar panels, views, status bar
- [ ] Plugin settings system (defined in manifest, managed by Docket)
- [ ] Plugin-specific storage (isolated key-value store)
- [ ] Community plugin registry (sources.json)
- [ ] Plugin store view (browse, install, configure, remove)
- [ ] Built-in example plugin (Pomodoro timer)
- [ ] Plugin API documentation and examples
- [ ] Plugin permission model (approve on install)

## v0.7 — Markdown Storage

Alternative storage backend for portability.

- [ ] Markdown storage backend (YAML frontmatter + body)
- [ ] Storage interface abstraction (SQLite and Markdown share API)
- [ ] File-based project organization (one directory per project)
- [ ] Storage mode switching in settings
- [ ] Markdown import/export
- [ ] Git-friendly file format (minimal diffs on updates)

## v1.0 — Stable Release

Production-quality task manager with a stable plugin API.

- [ ] Stable Plugin API (v1 — breaking changes require major version)
- [ ] Tauri desktop app packaging (macOS, Windows, Linux)
- [ ] Auto-update mechanism
- [ ] Performance optimization (large task lists, many plugins)
- [ ] Accessibility audit (screen readers, keyboard-only use)
- [ ] Comprehensive test suite (unit, component, integration)
- [ ] CI/CD pipeline (lint, typecheck, test, build, release)
- [ ] First batch of community plugins published

## Backlog

Ideas for future development, roughly prioritized:

- **CalDAV sync plugin** — sync tasks with Nextcloud, iCloud, Google Calendar
- **Git sync plugin** — version-controlled task storage across devices
- **WebDAV sync plugin** — generic sync for self-hosted setups
- **AI prioritization plugin** — smart priority suggestions based on due dates, workload, history
- **AI scheduling plugin** — auto-schedule tasks into calendar blocks
- **Natural language queries** — "what's due this week?" "show urgent tasks in the Work project"
- **Calendar view plugin** — monthly/weekly view of tasks by due date
- **Kanban board plugin** — drag-and-drop column-based task management
- **Time tracking plugin** — track time spent on tasks with reports
- **Habit tracker plugin** — recurring habit tracking with streaks
- **Daily agenda plugin** — morning planning view with scheduled blocks
- **Focus mode** — hide everything except the current task
- **Mobile companion** — React Native or PWA for phone access
- **Team sync** — shared projects with conflict resolution
- **Webhooks plugin** — trigger external services on task events
- **Email-to-task plugin** — create tasks by forwarding emails
- **Browser extension** — quick-add tasks from any webpage
- **Widget support** — system tray / menu bar quick-add
- **Templated tasks** — reusable task templates with variables
- **Sub-tasks** — nested task hierarchy
