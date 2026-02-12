# ASF Docket — Development Guide

## What Is This

ASF Docket is an open-source task management app built by the **AI Strategic Forum (ASF)** community. It's a Todoist alternative with an Obsidian-style plugin system — free, local-first, extensible, and privacy-respecting.

**Tagline:** "Open-source task management. Yours to extend."

This is the second ASF project, alongside [ASF Sentinel](https://github.com/asf-org/sentinel) (a Discord bot for AI news curation).

## ASF Values (MUST Follow)

- **Accuracy > Speed** — get it right, not just first
- **Sources > Vibes** — always cite, always link
- **Disclosure > Persuasion** — be transparent
- **Label speculation** — if it's a guess, say so
- **No hidden promotion** — disclose affiliations

## Core Principles

1. **Local-first** — data lives on the user's machine by default, sync is opt-in
2. **Plugin ecosystem** — Obsidian-style community plugins that extend core functionality
3. **Minimal by default, powerful when needed** — clean UI out of the box, power features via plugins
4. **Open source (MIT)** — fully transparent, community-driven
5. **No vendor lock-in** — plain Markdown or JSON task files, easy export

## Tech Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Runtime | Node.js 22+ / TypeScript | Type safety, ecosystem |
| Desktop | Tauri | Cross-platform, small binary (~5MB vs Electron ~150MB) |
| Frontend | React + Tailwind CSS | Fast, huge ecosystem |
| Local DB | SQLite (better-sqlite3) | Local-first, portable, zero config |
| ORM | Drizzle | Type-safe, lightweight, SQL-close |
| Plugin Runtime | Custom loader with sandboxing | Obsidian-style, controlled execution |
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
├── cli/                     # CLI companion tool
│   ├── index.ts             # CLI entry point (Commander.js)
│   ├── commands/            # CLI command handlers
│   │   ├── add.ts           # docket add "task description"
│   │   ├── list.ts          # docket list [--today|--project=X]
│   │   ├── done.ts          # docket done <id>
│   │   ├── edit.ts          # docket edit <id> [fields]
│   │   └── delete.ts        # docket delete <id>
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
```

## Architecture Decisions

### Local-First Storage
Two storage backends, selected by `STORAGE_MODE` env var:
- **SQLite** (default): better-sqlite3 + Drizzle ORM. Faster queries, structured data, supports complex filters.
- **Markdown**: Flat `.md` files with YAML frontmatter. Human-readable, git-friendly, portable.

Both backends implement the same interface. The user chooses; the app doesn't care.

### Plugin System
```
Plugin Discovery → Manifest Validation → Sandbox Creation → Lifecycle Hooks
```
- Plugins are directories in `plugins/` with a `manifest.json` and entry file
- Manifests declare: id, name, version, author, description, minDocketVersion, permissions
- Plugins run in a sandboxed context with access only to the Plugin API
- Lifecycle: `onLoad()` → active → `onUnload()`. Plugins can also hook into task events.
- Plugins can: register commands, add sidebar panels, add views, add settings tabs, listen to task events
- Plugin settings stored in SQLite (or JSON file in Markdown mode), keyed by plugin ID

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
- Network errors (registry, sync): retry with backoff, degrade gracefully

## Key Files

| File | Purpose |
|------|---------|
| `src/config/env.ts` | All env var definitions with Zod validation |
| `src/db/schema.ts` | Database schema (source of truth for tables) |
| `src/core/tasks.ts` | Task CRUD — the heart of the app |
| `src/core/types.ts` | Core type definitions (Task, Project, Tag, etc.) |
| `src/parser/task-parser.ts` | Natural language task input parser |
| `src/plugins/loader.ts` | Plugin discovery and loading |
| `src/plugins/api.ts` | Plugin API surface — what plugins can do |
| `src/plugins/sandbox.ts` | Plugin execution sandbox |
| `src/ui/App.tsx` | Root React component |
| `src/ui/components/TaskInput.tsx` | The main task input field |
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
5. See [docs/PLUGIN_API.md](docs/PLUGIN_API.md) for the full API reference

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

| Doc | Content |
|-----|---------|
| [docs/README.md](docs/README.md) | What ASF is, what Docket is, vision |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, data flow, tech decisions |
| [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md) | Step-by-step local development |
| [docs/PLUGIN_API.md](docs/PLUGIN_API.md) | Plugin API reference |
| [docs/PLUGIN_EXAMPLES.md](docs/PLUGIN_EXAMPLES.md) | Example plugin walkthroughs |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | How to contribute |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Milestones and future plans |
| [docs/BACKLOG.md](docs/BACKLOG.md) | All work items, prioritized by area |
| [docs/SPRINTS.md](docs/SPRINTS.md) | Sprint planning and tracking |
| [docs/SECURITY.md](docs/SECURITY.md) | Threat model, plugin sandboxing |
