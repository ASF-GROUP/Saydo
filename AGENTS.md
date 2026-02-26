# AGENTS.md — AI Agent Quick-Start Guide

This file helps AI agents (Claude, ChatGPT, Copilot, etc.) navigate the Saydo codebase quickly. Read this first, then dive into the specific docs you need.

## Where to Start

| You want to... | Read this first |
|-----------------|----------------|
| Understand the project | [CLAUDE.md](CLAUDE.md) (principles, tech stack, conventions) |
| Fix a frontend bug | [docs/frontend/FILES.md](docs/frontend/FILES.md) → find the file → read the specific doc |
| Fix a backend bug | [docs/backend/FILES.md](docs/backend/FILES.md) → find the file → read the specific doc |
| Add a UI component | [docs/frontend/COMPONENTS.md](docs/frontend/COMPONENTS.md) for patterns |
| Add a new view | [docs/frontend/VIEWS.md](docs/frontend/VIEWS.md) + CLAUDE.md "Add a UI view" section |
| Modify state/context | [docs/frontend/CONTEXT.md](docs/frontend/CONTEXT.md) for provider nesting and exposed functions |
| Work on AI features | [docs/backend/AI.md](docs/backend/AI.md) for pipeline, providers, and tools |
| Work on MCP server | [docs/backend/MCP.md](docs/backend/MCP.md) for tools, resources, prompts, and external agent integration |
| Work on voice | [docs/backend/VOICE.md](docs/backend/VOICE.md) for STT/TTS adapters |
| Work on plugins | [docs/backend/PLUGINS.md](docs/backend/PLUGINS.md) (internals) or [docs/plugins/API.md](docs/plugins/API.md) (author-facing) |
| Change the database | [docs/backend/DATABASE.md](docs/backend/DATABASE.md) for schema and storage abstraction |
| Understand the parser | [docs/backend/PARSER.md](docs/backend/PARSER.md) for NLP pipeline |
| Understand architecture | [docs/development/ARCHITECTURE.md](docs/development/ARCHITECTURE.md) for high-level design |
| Check security | [docs/development/SECURITY.md](docs/development/SECURITY.md) for threat model |
| See what's planned | [docs/planning/ROADMAP.md](docs/planning/ROADMAP.md) and [docs/planning/BACKLOG.md](docs/planning/BACKLOG.md) |

## File Indexes (Start Here for Debugging)

These two files are your primary lookup tables. Every source file is listed with its path, line count, and one-line purpose:

- **[docs/frontend/FILES.md](docs/frontend/FILES.md)** — 82 UI files (components, views, hooks, contexts, themes, API layer)
- **[docs/backend/FILES.md](docs/backend/FILES.md)** — 96 non-UI files (core, db, ai, voice, plugins, mcp, cli, utils)

Use these to find "which file handles X?" without grepping.

## Documentation Map

```
docs/
├── frontend/          Per-file reference for everything in src/ui/
│   ├── FILES.md         Master index (82 files)
│   ├── COMPONENTS.md    26 components with props, deps, who uses them
│   ├── VIEWS.md         10 views + 11 settings tabs
│   ├── CONTEXT.md       6 React contexts (what state, what functions)
│   ├── HOOKS.md         12 hooks (params, returns, consumers)
│   ├── THEMES.md        Theme system, CSS tokens, how to add themes
│   ├── SHORTCUTS.md     ShortcutManager API, default bindings
│   └── API_LAYER.md     Frontend-to-backend API bridge (8 modules)
│
├── backend/           Per-file reference for everything outside src/ui/
│   ├── FILES.md         Master index (85 files)
│   ├── CORE.md          TaskService, ProjectService, TagService, events, undo
│   ├── DATABASE.md      8 tables, Drizzle schema, SQLite + Markdown backends
│   ├── PARSER.md        chrono-node NLP, grammar rules, parseTask() pipeline
│   ├── AI.md            Provider registry, middleware pipeline, 28 tools
│   ├── VOICE.md         3 STT + 5 TTS adapters, audio utils, Web Workers
│   ├── MCP.md           MCP server: 28 tools, 8 resources, 3 prompts (external agent bridge)
│   ├── CLI.md           5 CLI commands (add, list, done, edit, delete)
│   ├── PLUGINS.md       Loader, sandbox, API factory, command/UI registries
│   └── UTILS.md         Logger, IDs, dates, sounds, env config
│
├── development/       Developer guides (setup, contributing, security)
├── plugins/           Plugin author documentation (API ref + examples)
└── planning/          Roadmap, backlog, sprint history
```

## Key Conventions

- **TypeScript strict mode** — no `any` types
- **Named exports** preferred over default
- **React function components** only (no classes)
- **Tailwind CSS** for styling — no inline styles, no CSS modules
- **Conventional Commits** — `feat(scope):`, `fix(scope):`, `docs(scope):`
- **Zod** for runtime validation, types derived from schemas
- **SQLite** is source of truth — UI reads from DB via API layer

## Common Patterns

### Finding the right file for a bug
1. Open `docs/frontend/FILES.md` or `docs/backend/FILES.md`
2. Ctrl+F for the feature keyword
3. Read the specific doc for that area (COMPONENTS.md, AI.md, etc.)
4. Check the "Used By" and "Key Dependencies" sections to trace data flow

### Understanding data flow
```
User Input → src/ui/components/ → src/ui/api/ → src/core/ → src/db/ → SQLite
                                                    ↑
                                              src/parser/ (NLP)
```

### Understanding AI flow
```
User Chat → AIChatPanel → AIContext → api/ai.ts → ChatSession → Pipeline → Provider
                                                       ↓
                                                  ToolRegistry → core services
```

### Understanding MCP flow
```
External Agent → stdio → src/mcp/server.ts → ToolRegistry.execute() → core services
                                            → resources (read-only queries)
                                            → prompts (conversation starters)
```

### Understanding plugin flow
```
plugins/ dir → loader.ts → lifecycle.ts → sandbox.ts → api.ts (permission-gated)
                                              ↓
                                    command-registry.ts / ui-registry.ts
```
