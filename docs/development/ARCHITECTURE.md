# Architecture

## Overview

ASF Docket is a modular TypeScript application with a clear separation between core logic, storage, UI, plugins, and CLI. Each layer is isolated, testable, and can be developed independently.

```
src/
├── main.ts                  # Entry point — wires everything together
├── config/                  # Configuration & environment
│   ├── env.ts               # Zod-validated env vars
│   ├── defaults.ts          # Default settings and constants
│   └── themes.ts            # Built-in theme definitions
├── db/                      # Database layer
│   ├── schema.ts            # Drizzle schema definitions
│   ├── client.ts            # SQLite connection
│   ├── migrate.ts           # Migration runner
│   ├── migrations/          # Generated SQL migrations
│   └── queries.ts           # Query helpers (CRUD for tasks, projects, tags)
├── core/                    # Core task management logic
│   ├── tasks.ts             # Task CRUD operations
│   ├── projects.ts          # Project management
│   ├── tags.ts              # Tag system
│   ├── priorities.ts        # Priority levels and sorting
│   ├── recurrence.ts        # Recurring task logic
│   ├── filters.ts           # Task filtering and search
│   └── types.ts             # Core type definitions (Zod + TS)
├── parser/                  # Natural language parsing
│   ├── nlp.ts               # Date/time extraction (chrono-node)
│   ├── task-parser.ts       # Full task string parser
│   └── grammar.ts           # Grammar rules for task-specific syntax
├── plugins/                 # Plugin system
│   ├── loader.ts            # Plugin discovery and loading
│   ├── lifecycle.ts         # Plugin lifecycle management
│   ├── api.ts               # Plugin API surface
│   ├── sandbox.ts           # Sandboxed execution environment
│   ├── registry.ts          # Community plugin registry client
│   ├── settings.ts          # Per-plugin settings storage
│   └── types.ts             # Plugin manifest and API types
├── ui/                      # React frontend
│   ├── App.tsx              # Root component with routing, keyboard nav, command palette
│   ├── main.tsx             # Entry point — renders App, initializes theme
│   ├── api.ts               # HTTP client for Vite dev server API
│   ├── context/
│   │   └── TaskContext.tsx   # React context for task state (CRUD, refresh)
│   ├── hooks/
│   │   └── useKeyboardNavigation.ts  # j/k/Enter/Esc keyboard nav hook
│   ├── components/          # Reusable UI components
│   │   ├── TaskInput.tsx    # Natural language input with parser preview
│   │   ├── TaskItem.tsx     # Single task row with selection highlight
│   │   ├── TaskList.tsx     # Task list container
│   │   ├── TaskDetailPanel.tsx  # Slide-over task editor (w-96, auto-save on blur)
│   │   ├── Sidebar.tsx      # Navigation + project list
│   │   └── CommandPalette.tsx   # Ctrl+K command palette with arrow nav
│   ├── views/               # Main application views
│   │   ├── Inbox.tsx        # Default inbox (pending, no project)
│   │   ├── Today.tsx        # Tasks due today
│   │   ├── Upcoming.tsx     # Tasks with due dates, sorted
│   │   ├── Project.tsx      # Single project filtered view
│   │   └── Settings.tsx     # Theme toggle + placeholder sections
│   └── themes/
│       └── manager.ts       # ThemeManager singleton (localStorage persistence)
├── ai/                      # AI assistant layer (future)
│   ├── provider.ts          # Provider abstraction interface
│   ├── providers/           # Provider implementations (OpenAI, Anthropic, Ollama, etc.)
│   ├── chat.ts              # Chat session management
│   ├── tools.ts             # AI tool definitions (task CRUD, scheduling)
│   └── voice.ts             # Voice input processing
├── cli/                     # CLI companion tool
│   ├── index.ts             # Commander.js entry point
│   ├── commands/            # CLI command handlers
│   └── formatter.ts         # Terminal output formatting
└── utils/                   # Shared utilities
    ├── logger.ts            # Structured logger
    ├── ids.ts               # ID generation
    └── dates.ts             # Date utilities
```

## Data Flow

### 1. Task Creation (UI)

```
User types: "buy milk tomorrow at 3pm p1 #groceries +shopping"
  │
  ▼
TaskInput component
  │
  ▼
Task Parser (src/parser/task-parser.ts)
  ├─→ chrono-node extracts: "tomorrow at 3pm" → Date object
  ├─→ Grammar rules extract: "p1" → priority 1
  ├─→ Grammar rules extract: "#groceries" → tag "groceries"
  ├─→ Grammar rules extract: "+shopping" → project "shopping"
  └─→ Remaining text: "buy milk" → task title
  │
  ▼
ParsedTask {
  title: "buy milk",
  dueDate: 2025-01-15T15:00:00Z,
  priority: 1,
  tags: ["groceries"],
  project: "shopping"
}
  │
  ▼
Core Task Service (src/core/tasks.ts)
  ├─→ Validate with Zod schema
  ├─→ Generate task ID (nanoid)
  ├─→ Create/link project if needed
  ├─→ Create/link tags if needed
  │
  ▼
Storage Layer (src/db/queries.ts)
  ├─→ INSERT into tasks table
  ├─→ INSERT into task_tags junction
  │
  ▼
Plugin Hooks
  └─→ Notify all plugins: onTaskCreate(task)
  │
  ▼
UI Update
  └─→ Re-render task list with new task
```

### 2. Task Creation (CLI)

```
$ docket add "buy milk tomorrow at 3pm p1 #groceries +shopping"
  │
  ▼
Commander.js routes to add command (src/cli/commands/add.ts)
  │
  ▼
Same flow: Parser → Core → Storage → Plugin Hooks
  │
  ▼
Terminal output: "Created: buy milk (due tomorrow 3:00 PM, P1)"
```

### 3. Task Completion

```
User clicks checkbox / runs "docket done <id>"
  │
  ▼
Core Task Service (src/core/tasks.ts)
  ├─→ Mark task as completed (completedAt = now)
  ├─→ If recurring: create next occurrence
  │
  ▼
Plugin Hooks
  └─→ Notify all plugins: onTaskComplete(task)
        ├─→ Pomodoro plugin: stop timer if running
        ├─→ Time tracking plugin: record completion time
        └─→ Habit tracker plugin: update streak
  │
  ▼
UI Update / CLI Output
```

### 4. Plugin Loading

```
App startup / Plugin install
  │
  ▼
Plugin Loader (src/plugins/loader.ts)
  ├─→ Scan plugins/ directory
  ├─→ Read manifest.json from each
  ├─→ Validate manifest with Zod
  ├─→ Check minDocketVersion compatibility
  │
  ▼
For each valid plugin:
  │
  ▼
Sandbox Creation (src/plugins/sandbox.ts)
  ├─→ Create isolated execution context
  ├─→ Inject Plugin API (limited, controlled surface)
  ├─→ Set resource limits (memory, CPU)
  │
  ▼
Lifecycle (src/plugins/lifecycle.ts)
  ├─→ Import plugin entry file
  ├─→ Instantiate plugin class
  ├─→ Call plugin.onLoad()
  ├─→ Register plugin's commands, views, settings
  │
  ▼
Plugin is active — receives events, renders UI, responds to commands
```

## Database Schema

### Tables

**tasks** — Core task data
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (PK) | nanoid |
| title | TEXT | Task title (required) |
| description | TEXT | Optional longer description |
| status | TEXT | "pending", "completed", "cancelled" |
| priority | INTEGER | 1 (highest) to 4 (lowest), nullable |
| dueDate | TEXT | ISO timestamp, nullable |
| dueTime | INTEGER | 0/1 — whether due date has a specific time |
| completedAt | TEXT | ISO timestamp, nullable |
| projectId | TEXT (FK) | Reference to projects, nullable |
| recurrence | TEXT | Recurrence rule (RRULE-like), nullable |
| sortOrder | INTEGER | Manual sort position within a view |
| createdAt | TEXT | ISO timestamp |
| updatedAt | TEXT | ISO timestamp |

**projects** — Task groupings
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (PK) | nanoid |
| name | TEXT | Project name (unique) |
| color | TEXT | Hex color for UI |
| icon | TEXT | Optional icon identifier |
| sortOrder | INTEGER | Display order |
| archived | INTEGER | 0/1 |
| createdAt | TEXT | ISO timestamp |

**tags** — Labels for tasks
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT (PK) | nanoid |
| name | TEXT | Tag name (unique, lowercase) |
| color | TEXT | Hex color for UI |

**task_tags** — Many-to-many junction
| Column | Type | Notes |
|--------|------|-------|
| taskId | TEXT (FK) | Reference to tasks |
| tagId | TEXT (FK) | Reference to tags |
| (PK) | composite | (taskId, tagId) |

**plugin_settings** — Per-plugin configuration
| Column | Type | Notes |
|--------|------|-------|
| pluginId | TEXT (PK) | Plugin identifier |
| settings | TEXT | JSON blob of plugin settings |
| updatedAt | TEXT | ISO timestamp |

**app_settings** — Global application settings
| Column | Type | Notes |
|--------|------|-------|
| key | TEXT (PK) | Setting key |
| value | TEXT | Setting value (JSON) |
| updatedAt | TEXT | ISO timestamp |

### Markdown Storage Alternative

When `STORAGE_MODE=markdown`, tasks are stored as `.md` files with YAML frontmatter:

```markdown
---
id: abc123
status: pending
priority: 1
due: 2025-01-15T15:00:00Z
project: shopping
tags: [groceries]
created: 2025-01-14T10:00:00Z
---

# buy milk

Optional longer description here.
```

File structure:
```
tasks/
├── inbox/           # Tasks with no project
│   └── abc123.md
├── shopping/        # Project directory
│   └── def456.md
└── .docket/         # Metadata
    ├── tags.json    # Tag definitions
    └── plugins.json # Plugin settings
```

## Plugin System Design

### Architecture

```
┌─────────────────────────────────────────────────┐
│                  Docket Core                     │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │            Plugin API Surface             │   │
│  │                                           │   │
│  │  Commands · Views · Settings · Events     │   │
│  │  Task API · UI Slots · Storage Access     │   │
│  └──────────────┬───────────────────────────┘   │
│                 │                                │
│  ┌──────────────┴───────────────────────────┐   │
│  │             Sandbox Layer                 │   │
│  │                                           │   │
│  │  Restricted globals · Memory limits       │   │
│  │  No filesystem · No network (by default)  │   │
│  └──────────────┬───────────────────────────┘   │
│                 │                                │
│  ┌──────────────┴──────┬──────────────────┐     │
│  │  Plugin A           │  Plugin B         │     │
│  │  (Pomodoro)         │  (Kanban)         │     │
│  └─────────────────────┴──────────────────┘     │
└─────────────────────────────────────────────────┘
```

### Plugin Manifest

Every plugin has a `manifest.json`:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "author": "Author Name",
  "description": "What this plugin does",
  "main": "index.js",
  "minDocketVersion": "0.1.0",
  "permissions": ["task:read", "task:write", "ui:panel", "commands"],
  "settings": [
    {
      "id": "interval",
      "name": "Timer Interval",
      "type": "number",
      "default": 25,
      "description": "Pomodoro interval in minutes"
    }
  ]
}
```

### Lifecycle Hooks

| Hook | When | Use Case |
|------|------|----------|
| `onLoad()` | Plugin is activated | Register commands, UI, event listeners |
| `onUnload()` | Plugin is deactivated | Clean up timers, listeners, UI |
| `onTaskCreate(task)` | A task is created | Auto-tag, start timer, log |
| `onTaskComplete(task)` | A task is completed | Stop timer, update stats, trigger next |
| `onTaskUpdate(task, changes)` | A task is modified | React to priority/date changes |
| `onTaskDelete(task)` | A task is deleted | Clean up related plugin data |
| `onSettingsChange(settings)` | Plugin settings change | Re-configure plugin behavior |

### Permission Model

Plugins declare permissions in their manifest. Users approve permissions on install.

| Permission | Access |
|------------|--------|
| `task:read` | Read task data |
| `task:write` | Create, update, delete tasks |
| `ui:panel` | Add sidebar panels |
| `ui:view` | Register custom views |
| `ui:status` | Add status bar items |
| `commands` | Register keyboard commands |
| `settings` | Add settings tab |
| `storage` | Access plugin-specific storage |
| `network` | Make HTTP requests (requires explicit approval) |

## AI Assistant Architecture

### Provider Abstraction

All AI providers implement a common `AIProvider` interface. This allows swapping models with zero code changes — just update the config.

```
┌─────────────────────────────────────────────────┐
│               AI Provider Interface              │
│                                                  │
│  chat(messages) → response                       │
│  streamChat(messages) → AsyncIterable            │
│  toolCall(messages, tools) → tool result          │
│                                                  │
├──────────┬──────────┬──────────┬────────────────┤
│ OpenAI   │Anthropic │OpenRouter│  Ollama / LMS  │
│ (cloud)  │ (cloud)  │ (cloud)  │  (local)       │
└──────────┴──────────┴──────────┴────────────────┘
```

**Supported providers:**
- **OpenAI** — GPT-4, GPT-3.5, etc. via API key
- **Anthropic** — Claude models via API key
- **OpenRouter** — Multi-provider gateway (access many models with one key)
- **Ollama** — Local models, zero data exposure
- **LM Studio** — Local models via OpenAI-compatible API
- **Custom** — Users can build their own provider plugin

### AI Chat Flow

```
User types/speaks in AI panel (sidebar)
  │
  ▼
Voice input → Speech-to-text → Text
  │
  ▼
Chat manager (src/ai/chat.ts)
  ├─→ Inject context: current tasks, projects, priorities, schedule
  ├─→ Include tool definitions (task CRUD, scheduling, reminders)
  │
  ▼
AI Provider (configured by user)
  ├─→ Model processes message with full context
  ├─→ Returns text response and/or tool calls
  │
  ▼
Tool execution (src/ai/tools.ts)
  ├─→ Create/update/complete/delete tasks
  ├─→ Assign priorities and projects
  ├─→ Schedule tasks, set reminders
  ├─→ Ask follow-up questions if unclear
  │
  ▼
Response displayed in chat panel + task list updated
```

### AI Tools

The AI assistant has access to structured tools that map to core operations:

| Tool | What It Does |
|------|-------------|
| `create_task` | Create a task with title, due date, priority, project, tags |
| `list_tasks` | List tasks with filters (today, overdue, project, etc.) |
| `complete_task` | Mark a task as done |
| `update_task` | Edit task fields (title, priority, due date, project) |
| `suggest_schedule` | Suggest a daily plan based on priorities and deadlines |
| `set_reminder` | Create a reminder for a task |

### Design Principles

- **AI is optional**: The app works perfectly without any AI configured. No features are gated behind AI.
- **User controls the model**: BYOM (Bring Your Own Model). Cloud or local — the user decides.
- **Context, not magic**: The AI is good because it sees the user's full context (tasks, projects, history), not because of prompt tricks.
- **Conversational**: Users talk to it like an assistant. It asks follow-up questions. It remembers the conversation.
- **Privacy-first**: API keys go directly to the user's chosen provider. Docket never proxies or stores AI traffic.

## State Management

### Data Flow

```
SQLite / Markdown (source of truth)
        │
        ▼
Core Services (src/core/)
  tasks.ts, projects.ts, tags.ts
        │
        ▼
React Context (app-level state)
  TaskContext, PluginContext, ThemeContext
        │
        ▼
React Components (UI)
  Read from context, dispatch actions through core services
```

**Principles:**
- SQLite/Markdown is the single source of truth
- Core services are the only layer that writes to storage
- UI reads from context, writes through core services
- Plugins interact through the Plugin API, never directly with storage
- No global mutable state outside React context

### Why Not Redux/Zustand?

For v1, the data flow is simple enough that React Context + core services handle it well. The app has one source of truth (SQLite) and a relatively flat state shape. Adding a state library would introduce complexity without clear benefit at this stage. If plugin interactions or multi-window state become complex, we'll revisit.

## Tech Choices & Justifications

### Tauri (not Electron)

- **Binary size**: ~5MB vs Electron's ~150MB
- **Memory usage**: Uses system webview, not bundled Chromium
- **Security**: Rust backend with fine-grained permission system
- **Trade-off**: Less mature ecosystem, but improving rapidly. For a task manager (simple UI, no heavy web APIs), Tauri's constraints are a non-issue.

### SQLite + Drizzle (not IndexedDB, not filesystem-only)

- **SQLite**: Battle-tested, fast, supports complex queries (filters, sorts, full-text search)
- **Drizzle**: Type-safe, SQL-close, tiny runtime. Generates migrations.
- **Why not IndexedDB**: Limited query capabilities, browser-only, awkward API
- **Why not filesystem-only**: Querying Markdown files doesn't scale. Markdown mode is for portability/interop, not performance.
- Schema designed to be Postgres-compatible for future server-side use.

### React + Tailwind (not Svelte, not plain CSS)

- **React**: Largest ecosystem, most plugin authors will know it, excellent tooling
- **Tailwind CSS**: Utility-first, fast prototyping, easy theming with CSS custom properties
- **Trade-off**: React's bundle size is larger than Svelte, but Tauri's system webview means we're not shipping Chromium anyway.

### chrono-node (for NLP)

- Best-in-class natural language date parser for JavaScript
- Supports relative dates ("tomorrow", "next Friday"), times ("at 3pm"), and casual language ("in 2 hours")
- Locale support for international users
- MIT licensed, actively maintained

### Commander.js (for CLI)

- Industry standard for Node.js CLIs
- Excellent developer experience: auto-help, argument parsing, subcommands
- CLI shares the same core logic as the UI — no duplication
