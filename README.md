# ASF Docket

**Open-source task management. Yours to extend.**

Docket is a free, local-first task manager with an Obsidian-style plugin system. Your data stays on your machine, the core is minimal and fast, and community plugins let you build exactly the workflow you need. No accounts, no subscriptions, no vendor lock-in.

An [AI Strategic Forum (ASF)](https://github.com/asf-org) project, alongside [ASF Sentinel](https://github.com/asf-org/sentinel).

<!-- TODO: Add screenshot -->
<!-- ![Docket Screenshot](docs/assets/screenshot.png) -->

## Features

- **Tasks done right** — create, edit, complete, and delete tasks with projects, tags, priorities, due dates, and recurrence
- **Natural language input** — type "buy milk tomorrow at 3pm" and Docket parses it
- **Keyboard-first** — full keyboard navigation for power users
- **Local-first** — SQLite or flat Markdown files, your data never leaves your machine
- **Plugin ecosystem** — Obsidian-style JS/TS plugins: Pomodoro, Kanban, calendar view, time tracking, and more
- **Themes** — light/dark mode plus custom CSS themes
- **CLI companion** — manage tasks from the terminal
- **No vendor lock-in** — plain data formats, easy export, MIT licensed

## Quick Start

```bash
# Clone and install
git clone https://github.com/asf-org/docket.git && cd docket
pnpm install

# Configure
cp .env.example .env

# Set up database
mkdir -p data
pnpm db:migrate

# Run
pnpm dev
```

See [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md) for the full guide.

## Plugin System

Docket's plugin system is inspired by Obsidian. Plugins are JS/TS packages that hook into task lifecycle events, add UI panels, register commands, and extend settings.

```typescript
// plugins/my-plugin/index.ts
import { Plugin } from "@asf-docket/plugin-api";

export default class MyPlugin extends Plugin {
  async onLoad() {
    this.addCommand({
      id: "hello",
      name: "Say Hello",
      callback: () => console.log("Hello from my plugin!"),
    });
  }

  async onUnload() {
    // Clean up
  }
}
```

See [docs/PLUGIN_API.md](docs/PLUGIN_API.md) for the full API reference and [docs/PLUGIN_EXAMPLES.md](docs/PLUGIN_EXAMPLES.md) for walkthroughs.

## Philosophy

Docket reflects ASF values — **accuracy over speed**, **sources over vibes**, **disclosure over persuasion**:

- **Local-first**: Your data, your machine, your rules
- **Open source**: Fully transparent, MIT licensed, community-driven
- **Extensible**: Minimal core, powerful plugins — you decide the complexity
- **No dark patterns**: No upsells, no tracking, no artificial limitations

## Documentation

| Doc | What's Inside |
|-----|--------------|
| [docs/README.md](docs/README.md) | ASF context, vision, design principles |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Modules, data flow, tech decisions |
| [docs/SETUP_LOCAL.md](docs/SETUP_LOCAL.md) | Step-by-step local development |
| [docs/PLUGIN_API.md](docs/PLUGIN_API.md) | Plugin API reference |
| [docs/PLUGIN_EXAMPLES.md](docs/PLUGIN_EXAMPLES.md) | Example plugin walkthroughs |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | How to contribute |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Milestones and future plans |
| [docs/BACKLOG.md](docs/BACKLOG.md) | All work items, prioritized by area |
| [docs/SPRINTS.md](docs/SPRINTS.md) | Sprint planning and tracking |
| [docs/SECURITY.md](docs/SECURITY.md) | Threat model, plugin sandboxing |

## Tech Stack

- **Runtime**: Node.js 22+ / TypeScript
- **Desktop**: Tauri (lightweight, cross-platform)
- **Frontend**: React + Tailwind CSS
- **Database**: SQLite (better-sqlite3 + Drizzle ORM) or flat Markdown files
- **Plugins**: Custom loader with sandboxed execution
- **CLI**: Commander.js
- **Testing**: Vitest
- **Build**: Vite

## Contributing

We welcome contributions! See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

MIT
