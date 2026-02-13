# Roadmap

## v0.1 — Foundation (MVP)

Core task management without plugins. A usable task manager.

- [x] Project scaffold (package.json, tsconfig, linting, formatting)
- [x] Core infrastructure (logger, config, validation, ID generation)
- [x] Database schema and migrations (Drizzle + SQLite)
- [x] Task CRUD (create, read, update, delete, complete)
- [x] Project management (create, list, archive)
- [x] Tag system (create, assign, filter)
- [x] Priority levels (P1–P4 with sorting)
- [x] Due dates with time support
- [x] Natural language task input (chrono-node + custom grammar)
- [x] Basic React UI: inbox, today, upcoming views
- [x] Sidebar navigation
- [x] Keyboard-first navigation
- [x] Command palette (Ctrl+K)
- [x] Light/dark theme
- [x] CLI companion: `add`, `list`, `done`, `edit`, `delete` commands
- [x] Unit tests for core logic and parser
- [x] Documentation: all docs complete

## v0.2 — Polish

Refinements to the core experience before plugins.

- [x] Recurring tasks (daily, weekly, monthly, custom)
- [x] Task search and filtering (by project, tag, priority, date range)
- [ ] Bulk operations (complete all, move to project, tag multiple)
- [ ] Drag-and-drop task reordering
- [x] Task descriptions (longer notes below the title)
- [ ] Undo/redo for task operations
- [ ] Custom CSS theme support
- [ ] Keyboard shortcut customization
- [ ] Data export (JSON, Markdown, CSV)
- [ ] Data import (Todoist JSON, plain text)

## v0.3 — AI Assistant

The conversational AI that makes Docket feel like JARVIS for tasks.

- [ ] AI provider abstraction interface
- [ ] OpenAI provider implementation
- [ ] Anthropic provider implementation
- [ ] OpenRouter provider implementation
- [ ] Ollama provider implementation (local, zero data exposure)
- [ ] LM Studio provider implementation (local)
- [ ] AI chat panel in sidebar
- [ ] Chat session management (conversation history)
- [ ] AI tool definitions (task CRUD, scheduling, reminders)
- [ ] Context injection (tasks, projects, priorities, schedule)
- [ ] Natural language task creation via AI ("I need to finish the report by Friday")
- [ ] AI follow-up questions ("Which project should this go under?")
- [ ] AI priority suggestions ("You have 3 overdue tasks — want me to reschedule?")
- [ ] Voice input (speech-to-text → AI chat)
- [ ] Provider settings UI (select provider, enter API keys)
- [ ] Custom AI provider plugin support (BYOM)

## v0.5 — Plugin System

The Obsidian-style plugin architecture.

- [x] Plugin manifest schema and validation
- [x] Plugin settings manager
- [x] Plugin registry search
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

## v1.5 — Docket Sync

Cross-device sync service (paid, optional — like Obsidian Sync).

- [ ] Sync server architecture (ASF-hosted)
- [ ] User accounts and authentication
- [ ] End-to-end encrypted task sync
- [ ] Conflict resolution for concurrent edits
- [ ] Sync client in desktop app
- [ ] Subscription management and billing

## v2.0 — Mobile

Native mobile apps + PWA (requires Docket Sync).

- [ ] React Native iOS app
- [ ] React Native Android app
- [ ] PWA for browser-based mobile access
- [ ] Push notifications for reminders
- [ ] Mobile-optimized UI

## v3.0 — Web App

Full browser-based client (requires Docket Sync).

- [ ] Web client (React, same codebase where possible)
- [ ] Collaborative features (shared projects, team sync)
- [ ] Enterprise tier (SSO, admin controls, audit logs)

## Backlog

Ideas for future development, roughly prioritized:

- **CalDAV sync plugin** — sync tasks with Nextcloud, iCloud, Google Calendar
- **Git sync plugin** — version-controlled task storage across devices (free alternative to Docket Sync)
- **WebDAV sync plugin** — generic sync for self-hosted setups
- **AI auto-scheduling plugin** — auto-schedule tasks into calendar blocks
- **AI daily planner plugin** — morning planning view with AI-suggested schedule
- **Natural language queries** — "what's due this week?" "show urgent tasks in the Work project"
- **Calendar view plugin** — monthly/weekly view of tasks by due date
- **Kanban board plugin** — drag-and-drop column-based task management
- **Time tracking plugin** — track time spent on tasks with reports
- **Habit tracker plugin** — recurring habit tracking with streaks
- **Discord reminder plugin** — task reminders via Discord bot
- **Google Calendar plugin** — two-way sync with Google Calendar
- **Focus mode** — hide everything except the current task
- **Team sync** — shared projects with conflict resolution
- **Webhooks plugin** — trigger external services on task events
- **Email-to-task plugin** — create tasks by forwarding emails
- **Browser extension** — quick-add tasks from any webpage
- **Widget support** — system tray / menu bar quick-add
- **Templated tasks** — reusable task templates with variables
- **Sub-tasks** — nested task hierarchy
