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
- [x] Bulk operations (complete all, move to project, tag multiple)
- [x] Drag-and-drop task reordering
- [x] Task descriptions (longer notes below the title)
- [x] Undo/redo for task operations
- [x] Custom CSS theme support
- [x] Keyboard shortcut customization
- [x] Data export (JSON, Markdown, CSV)
- [x] Data import (Todoist JSON, plain text)

## v0.3 — AI Assistant

The conversational AI layer.

- [x] AI provider abstraction interface
- [x] OpenAI, Anthropic, OpenRouter, Ollama, LM Studio providers
- [x] AI chat panel in sidebar with SSE streaming
- [x] Chat session management and persistence
- [x] AI tool definitions (task CRUD, scheduling, reminders)
- [x] Context injection (tasks, projects, priorities, schedule)
- [x] Natural language task creation via AI
- [x] AI follow-up questions and priority suggestions
- [x] Voice input (speech-to-text → AI chat)
- [x] Voice output (text-to-speech for responses)
- [x] Bidirectional voice mode (VAD + push-to-talk)
- [x] Provider settings UI (select provider, enter API keys)
- [x] Custom AI provider plugin support (BYOM)
- [x] Dynamic model discovery (fetch from provider APIs)
- [x] Error handling with retry, timeout, graceful degradation
- [x] Pluggable LLM core (LLMPipeline, LLMExecutor, ToolRegistry)
- [x] Intelligence tools (pattern analysis, workload, smart organize, energy recommendations)
- [x] Voice provider abstraction (STT/TTS with browser, Groq, local adapters)

## v0.5 — Plugin System

The Obsidian-style plugin architecture.

- [x] Plugin manifest schema and validation
- [x] Plugin settings manager
- [x] Plugin registry search
- [x] Plugin loader (discovery, validation, loading)
- [x] Plugin lifecycle management (load, unload, enable, disable)
- [x] Sandboxed plugin execution environment
- [x] Plugin API surface: task read/write, events, commands
- [x] Plugin UI extension points: sidebar panels, views, status bar
- [x] Plugin settings system (defined in manifest, managed by Saydo)
- [x] Plugin-specific storage (isolated key-value store)
- [x] Community plugin registry (sources.json)
- [x] Plugin store view (browse, install, configure, remove)
- [x] Built-in example plugin (Pomodoro timer)
- [x] Plugin API documentation and examples
- [x] Plugin permission model (approve on install)

## v0.7 — Markdown Storage

Alternative storage backend for portability.

- [x] Markdown storage backend (YAML frontmatter + body)
- [x] Storage interface abstraction (SQLite and Markdown share API)
- [x] File-based project organization (one directory per project)
- [x] Storage mode switching in settings
- [x] Markdown import/export
- [x] Git-friendly file format (minimal diffs on updates)

## v1.0 — Stable Release

Production-quality task manager with a stable plugin API.

- [x] Stable Plugin API (v1 — breaking changes require major version)
- [x] Tauri desktop app packaging (macOS, Windows, Linux)
- [x] Auto-update mechanism
- [x] Performance optimization (large task lists, many plugins)
- [x] Accessibility audit (screen readers, keyboard-only use)
- [x] Comprehensive test suite (unit, component, integration)
- [x] CI/CD pipeline (lint, typecheck, test, build, release)
- [x] First batch of community plugins published
- [x] MCP server for external AI agent integration (Claude Desktop, custom agents)

## v1.5 — Saydo Sync

Cross-device sync service (paid, optional — like Obsidian Sync).

- [ ] Sync server architecture (ASF-hosted)
- [ ] User accounts and authentication
- [ ] End-to-end encrypted task sync
- [ ] Conflict resolution for concurrent edits
- [ ] Sync client in desktop app
- [ ] Subscription management and billing

## v2.0 — Mobile

Native mobile apps + PWA (requires Saydo Sync).

- [ ] React Native iOS app
- [ ] React Native Android app
- [ ] PWA for browser-based mobile access
- [ ] Push notifications for reminders
- [ ] Mobile-optimized UI

## v3.0 — Web App

Full browser-based client (requires Saydo Sync).

- [ ] Web client (React, same codebase where possible)
- [ ] Collaborative features (shared projects, team sync)
- [ ] Enterprise tier (SSO, admin controls, audit logs)

## Backlog

Ideas for future development:

- **CalDAV sync plugin** — sync tasks with Nextcloud, iCloud, Google Calendar
- **Git sync plugin** — version-controlled task storage across devices (free alternative to Saydo Sync)
- **WebDAV sync plugin** — generic sync for self-hosted setups
- ~~**Calendar view plugin**~~ — ✅ Implemented as core Calendar view (week grid) in v1.0
- **Kanban board plugin** — drag-and-drop column-based task management
- **Time tracking plugin** — track time spent on tasks with reports
- **Habit tracker plugin** — recurring habit tracking with streaks
- **Discord reminder plugin** — task reminders via Discord bot
- **Google Calendar plugin** — two-way sync with Google Calendar
- **Team sync** — shared projects with conflict resolution
- **Webhooks plugin** — trigger external services on task events
- **Email-to-task plugin** — create tasks by forwarding emails
- **Browser extension** — quick-add tasks from any webpage
- **Widget support** — system tray / menu bar quick-add
- **Local AI voice models** — local Whisper STT and Kokoro TTS (adapters written, testing in progress)
