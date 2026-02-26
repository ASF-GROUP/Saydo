# ASF Saydo — Development Guide

## What Is This

**Build the task manager you've always wanted.**

ASF Saydo is an open-source, AI-native task manager with an Obsidian-style plugin system. Built by the **AI Strategic Forum (ASF)** community. **Simple. Smart. Yours.**

It's the task manager that doesn't exist yet — beautiful and simple out of the box, with a real AI assistant (not a gimmick), and a plugin system so simple that anyone can build features through AI-generated code. No coding experience required.

This is the second ASF project, alongside [ASF Sentinel](https://github.com/asf-org/sentinel) (a Discord bot for AI news curation).

## ASF Values (MUST Follow)

- **Accuracy > Speed** — get it right, not just first
- **Sources > Vibes** — always cite, always link
- **Disclosure > Persuasion** — be transparent
- **Label speculation** — if it's a guess, say so
- **No hidden promotion** — disclose affiliations

## Core Principles

1. **Local-first, private by default** — data lives on the user's machine. Zero network calls by default. No accounts, no telemetry, no analytics.
2. **AI-native, not AI-bolted-on** — the AI assistant is a core part of the experience: conversational sidebar, voice input, BYOM (Bring Your Own Model). But completely optional — Saydo works perfectly without AI.
3. **Vibe-code extensible** — the plugin API is designed so anyone can ask Claude or ChatGPT to build a plugin. If the API is too complicated for AI to generate correct code, it's too complicated.
4. **Minimal by default, powerful when needed** — clean UI out of the box. The app is a canvas — plugins paint the picture.
5. **Open source (MIT), honest business model** — free forever. Revenue from optional paid sync hosting (Saydo Sync), not dark patterns.
6. **No vendor lock-in** — SQLite or Markdown files. Export anytime. Switching away should be trivial.

## Tech Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Runtime | Node.js 22+ / TypeScript | Type safety, ecosystem |
| Desktop | Tauri | Cross-platform, small binary (~5MB vs Electron ~150MB) |
| Frontend | React + Tailwind CSS | Fast, huge ecosystem |
| Local DB | SQLite (better-sqlite3) | Local-first, portable, zero config |
| ORM | Drizzle | Type-safe, lightweight, SQL-close |
| AI | Pluggable providers | OpenAI, Anthropic, OpenRouter, Ollama, LM Studio — or build your own |
| Plugin Runtime | Custom loader with sandboxing | Obsidian-style, controlled execution |
| MCP | @modelcontextprotocol/sdk | External AI agent bridge (Claude Desktop, custom agents) |
| CLI | Commander.js | Companion CLI tool |
| NLP | chrono-node | Natural language date/time parsing |
| Testing | Vitest | Fast, ESM native |
| Build | Vite | Fast bundling |
| Package Manager | pnpm | Fast, disk-efficient |
| Validation | Zod | Runtime type checking |

## Project Structure

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
│   ├── nlp.ts               # Date/time extraction from natural input
│   ├── task-parser.ts       # Full task string parser ("buy milk tomorrow p1 #groceries")
│   └── grammar.ts           # Grammar rules for task input
├── mcp/                     # MCP server (external AI agent bridge)
│   ├── server.ts            # Entry point — bootstrap + stdio transport
│   ├── tools.ts             # Bridges ToolRegistry → MCP tools
│   ├── resources.ts         # Read-only resources (tasks, projects, tags, stats)
│   ├── prompts.ts           # Pre-built prompts (plan-my-day, daily-review, quick-capture)
│   ├── schema-converter.ts  # JSON Schema → Zod converter
│   ├── context.ts           # ToolContext factory
│   └── errors.ts            # Error mapping to MCP responses
├── plugins/                 # Plugin system
│   ├── loader.ts            # Plugin discovery and loading
│   ├── lifecycle.ts         # Plugin lifecycle management (load/unload)
│   ├── api.ts               # Plugin API surface (what plugins can access)
│   ├── sandbox.ts           # Sandboxed execution environment
│   ├── registry.ts          # Community plugin registry client
│   ├── settings.ts          # Per-plugin settings storage
│   └── types.ts             # Plugin manifest and API types
├── ui/                      # React frontend
│   ├── App.tsx              # Root React component
│   ├── components/          # Reusable UI components
│   │   ├── TaskItem.tsx     # Single task row/card
│   │   ├── TaskInput.tsx    # Natural language task input
│   │   ├── TaskList.tsx     # Task list container
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   ├── CommandPalette.tsx # Keyboard command palette
│   │   └── PluginPanel.tsx  # Plugin UI container
│   ├── views/               # Main application views
│   │   ├── Inbox.tsx        # Default inbox view
│   │   ├── Today.tsx        # Today's tasks
│   │   ├── Upcoming.tsx     # Upcoming tasks by date
│   │   ├── Project.tsx      # Single project view
│   │   ├── Settings.tsx     # App and plugin settings
│   │   └── PluginStore.tsx  # Browse/install community plugins
│   └── themes/              # Theme system
│       ├── manager.ts       # Theme loading and switching
│       ├── light.css        # Default light theme
│       └── dark.css         # Default dark theme
├── ai/                      # AI assistant layer (future)
│   ├── provider.ts          # Provider abstraction interface
│   ├── providers/           # Provider implementations
│   │   ├── openai.ts        # OpenAI API provider
│   │   ├── anthropic.ts     # Anthropic API provider
│   │   ├── openrouter.ts    # OpenRouter provider
│   │   ├── ollama.ts        # Ollama (local) provider
│   │   └── lmstudio.ts      # LM Studio (local) provider
│   ├── chat.ts              # Chat session management
│   ├── tools.ts             # AI tool definitions (task CRUD, scheduling)
│   └── voice.ts             # Voice input processing
├── cli/                     # CLI companion tool
│   ├── index.ts             # CLI entry point (Commander.js)
│   ├── commands/            # CLI command handlers
│   │   ├── add.ts           # saydo add "task description"
│   │   ├── list.ts          # saydo list [--today|--project=X]
│   │   ├── done.ts          # saydo done <id>
│   │   ├── edit.ts          # saydo edit <id> [fields]
│   │   └── delete.ts        # saydo delete <id>
│   └── formatter.ts         # Terminal output formatting
└── utils/                   # Shared utilities
    ├── logger.ts            # Structured logger
    ├── ids.ts               # ID generation (nanoid)
    └── dates.ts             # Date utilities
```

## Development Conventions

### Branching
- `main` — stable, deployable
- `feat/<name>` — new features
- `fix/<name>` — bug fixes
- `docs/<name>` — documentation only
- `plugin/<name>` — plugin system changes

### Commits
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat(core): add recurring task support
fix(parser): handle "next Monday" edge case in NLP
docs(plugin): add settings API documentation
test(core): add edge cases for priority sorting
plugin(loader): implement sandbox isolation
```

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier enforced
- No `any` types (warn level — avoid)
- Named exports preferred
- Errors are handled, not swallowed
- All public functions have JSDoc for complex logic
- React components use function syntax (not class)
- Tailwind for styling — no inline styles, no CSS modules

### Testing
- Tests in `tests/` mirror `src/` structure
- Unit tests for pure logic (task CRUD, parsing, filtering, plugin lifecycle)
- Component tests for critical UI flows
- Run: `pnpm test` (vitest)
- Coverage: `pnpm test:coverage`

### Running
```bash
pnpm dev           # Dev mode (Vite dev server with HMR)
pnpm build         # Build for production
pnpm start         # Preview production build
pnpm check         # Lint + typecheck + test
pnpm cli           # Run CLI companion
pnpm mcp           # Start MCP server (for external AI agents)
```

## Architecture Decisions

### Local-First Storage
Two storage backends, selected by `STORAGE_MODE` env var:
- **SQLite** (default): better-sqlite3 + Drizzle ORM. Faster queries, structured data, supports complex filters.
- **Markdown**: Flat `.md` files with YAML frontmatter. Human-readable, git-friendly, portable.

Both backends implement the same interface. The user chooses; the app doesn't care.

### AI Assistant
The AI assistant is a conversational interface that lives in the sidebar:
- **Provider abstraction**: All AI providers implement a common interface. Swapping providers is one config change.
- **BYOM (Bring Your Own Model)**: OpenAI, Anthropic, OpenRouter, Ollama, LM Studio — or build a custom provider plugin.
- **Tool use**: The AI can read/write tasks, manage projects, suggest priorities, auto-schedule. Tools are defined in `src/ai/tools.ts`.
- **Voice input**: Speech-to-text feeds into the same chat interface. The AI parses natural language into structured tasks.
- **Context-aware**: The AI sees the user's task list, projects, priorities, and schedule to give relevant suggestions.
- **Fully optional**: Zero AI code runs unless the user configures a provider. No API keys required for core functionality.

### Plugin System
```
Plugin Discovery → Manifest Validation → Sandbox Creation → Lifecycle Hooks
```
- Plugins are directories in `plugins/` with a `manifest.json` and entry file
- Manifests declare: id, name, version, author, description, minSaydoVersion, permissions
- Plugins run in a sandboxed context with access only to the Plugin API
- Lifecycle: `onLoad()` → active → `onUnload()`. Plugins can also hook into task events.
- Plugins can: register commands, add sidebar panels, add views, add settings tabs, listen to task events
- Plugin settings stored in SQLite (or JSON file in Markdown mode), keyed by plugin ID
- **Vibe-code friendly**: The API is designed so AI (Claude/ChatGPT) can generate working plugins. If the API is too complex for AI to produce correct code, it's too complex.

### State Management
- React state for UI (useState/useReducer for local, context for shared)
- SQLite as the source of truth — UI reads from DB, writes go through core module
- No external state library (Redux, Zustand) unless complexity demands it later
- Plugin state isolated per-plugin

### Natural Language Parsing
- `chrono-node` for date/time extraction
- Custom grammar layer on top for task-specific syntax: priorities (`p1`-`p4`), tags (`#tag`), projects (`+project`)
- Parser returns structured `ParsedTask` with all extracted fields

### Error Philosophy
- Parse errors: show inline feedback, don't block input
- Storage errors: surface to user (these are critical)
- Plugin errors: isolate and disable the plugin, don't crash the app
- AI errors: degrade gracefully — if the provider fails, the app works fine without AI
- Network errors (registry, sync): retry with backoff, degrade gracefully

## Key Files

| File | Purpose |
|------|---------|
| `src/config/env.ts` | All env var definitions with Zod validation |
| `src/db/schema.ts` | Database schema (source of truth for tables) |
| `src/core/tasks.ts` | Task CRUD — the heart of the app |
| `src/core/types.ts` | Core type definitions (Task, Project, Tag, etc.) |
| `src/parser/task-parser.ts` | Natural language task input parser |
| `src/ai/provider.ts` | AI provider abstraction interface (future) |
| `src/ai/tools.ts` | AI tool definitions for task operations (future) |
| `src/plugins/loader.ts` | Plugin discovery and loading |
| `src/plugins/api.ts` | Plugin API surface — what plugins can do |
| `src/plugins/sandbox.ts` | Plugin execution sandbox |
| `src/ui/App.tsx` | Root React component |
| `src/ui/components/TaskInput.tsx` | The main task input field |
| `src/mcp/server.ts` | MCP server entry point (external agent bridge) |
| `src/cli/index.ts` | CLI entry point |
| `sources.json` | Community plugin registry seed |

## Common Tasks

### Add a task field
1. Add the field to `src/core/types.ts` (Zod schema + TS type)
2. Add the column to `src/db/schema.ts`
3. Generate migration: `pnpm db:generate`
4. Update CRUD in `src/core/tasks.ts`
5. Update the parser in `src/parser/task-parser.ts` if the field is parseable from natural language
6. Update `TaskItem.tsx` to display the field
7. Update CLI `list` and `add` commands if applicable

### Create a plugin
1. Create a directory in `plugins/<plugin-name>/`
2. Add `manifest.json` with required fields (id, name, version, author, description, main)
3. Create entry file (e.g., `index.ts`) that exports a class extending `Plugin`
4. Implement `onLoad()` and `onUnload()` lifecycle hooks
5. See [docs/plugins/API.md](docs/plugins/API.md) for the full API reference

### Add a UI view
1. Create component in `src/ui/views/<ViewName>.tsx`
2. Add route/navigation entry in `src/ui/App.tsx`
3. Add sidebar link in `src/ui/components/Sidebar.tsx`

### Add a CLI command
1. Create handler in `src/cli/commands/<name>.ts`
2. Register with Commander in `src/cli/index.ts`
3. Use shared core logic from `src/core/` — CLI and UI share the same backend

### Modify the database schema
1. Edit `src/db/schema.ts`
2. Run `pnpm db:generate` to create a migration
3. Run `pnpm db:migrate` to apply it
4. Update queries in `src/db/queries.ts`

### Add a keyboard shortcut
1. Define the command in the command registry
2. Add default keybinding in `src/ui/components/CommandPalette.tsx`
3. Commands are also available to plugins via the Plugin API

## Documentation

See [AGENTS.md](AGENTS.md) for a quick-start guide on navigating the codebase with AI assistance.

```
docs/
├── README.md                        # Vision, design principles, why Saydo exists
├── frontend/                        # File-by-file frontend reference
│   ├── FILES.md                     # Master index of all 82 UI files
│   ├── COMPONENTS.md                # 26 components: props, deps, usage
│   ├── VIEWS.md                     # 10 views + 11 settings tabs
│   ├── CONTEXT.md                   # 6 React contexts with state/functions
│   ├── HOOKS.md                     # 12 custom hooks with params/returns
│   ├── THEMES.md                    # Theme system, CSS tokens, adding themes
│   ├── SHORTCUTS.md                 # ShortcutManager, all keybindings
│   └── API_LAYER.md                 # 8 API modules, REST endpoints
├── backend/                         # File-by-file backend reference
│   ├── FILES.md                     # Master index of all 96 non-UI files
│   ├── CORE.md                      # Task/project/tag services, events, undo
│   ├── DATABASE.md                  # 8 tables, storage abstraction, migrations
│   ├── PARSER.md                    # NLP pipeline, grammar rules, examples
│   ├── AI.md                        # 29 files: providers, pipeline, 28 tools
│   ├── VOICE.md                     # 14 files: STT/TTS adapters, audio utils
│   ├── MCP.md                       # 7 files: MCP server, tools, resources, prompts
│   ├── CLI.md                       # 5 CLI commands with usage examples
│   ├── PLUGINS.md                   # 10 files: loader, sandbox, API, registry
│   └── UTILS.md                     # Utilities + config modules
├── development/                     # Developer guides
│   ├── ARCHITECTURE.md              # High-level system design & data flow
│   ├── SETUP_LOCAL.md               # Step-by-step local development
│   ├── CONTRIBUTING.md              # How to contribute
│   ├── SECURITY.md                  # Threat model, plugin sandboxing
│   └── UX_REFERENCES.md            # Design inspiration & UX patterns
├── plugins/                         # Plugin documentation
│   ├── API.md                       # Plugin API reference (for authors)
│   └── EXAMPLES.md                  # Example plugin walkthroughs
└── planning/                        # Project planning
    ├── ROADMAP.md                   # Milestones and future plans
    ├── BACKLOG.md                   # All work items, prioritized by area
    └── SPRINTS.md                   # Sprint planning and tracking
```
