# ASF Saydo

An open-source task manager with AI and an Obsidian-style plugin system. Local-first, no accounts, no tracking.

Built by the [AI Strategic Forum (ASF)](https://github.com/asf-org) community.

<!-- ![Saydo Screenshot](docs/assets/screenshot.png) -->

## What it does

Saydo is a desktop task manager built with Tauri and React. You type tasks in natural language, organize with projects and tags, and optionally talk to an AI assistant in the sidebar.

**The plugin system is the main idea.** It's simple enough that you can describe what you want to Claude or ChatGPT and get a working plugin back. No coding required.

### Features

- Natural language input — `buy milk tomorrow 3pm p1 #groceries +shopping` just works
- AI sidebar — chat with your LLM of choice to create tasks, plan your day, get suggestions
- Voice — speak instead of type, with browser, Groq, Inworld AI, or local models (Whisper, Kokoro, Piper)
- Plugins — TypeScript files in a folder. Commands, sidebar panels, views, task hooks, storage
- Dual storage — SQLite (default) or Markdown files with YAML frontmatter
- Sub-tasks, templates, recurring tasks, reminders
- Focus mode — distraction-free, keyboard-driven
- CLI companion — `saydo add`, `saydo list`, `saydo done`
- Light/dark themes + custom CSS
- 960+ tests

## Quick start

```bash
git clone https://github.com/asf-org/saydo.git && cd saydo
pnpm install
cp .env.example .env
mkdir -p data && pnpm db:migrate
pnpm dev
```

Open `http://localhost:5173`. Type a task. Press Enter.

For the desktop app (requires Rust + Tauri CLI):

```bash
pnpm tauri:dev
```

See [local setup guide](docs/development/SETUP_LOCAL.md) for details.

## Plugins

Plugins are TypeScript files you drop into `plugins/`. No build step.

```typescript
import { Plugin } from "@asf-saydo/plugin-api";

export default class MyPlugin extends Plugin {
  async onLoad() {
    this.app.commands.register({
      id: "hello",
      name: "Say Hello",
      callback: () => console.log("Hello from my plugin!"),
    });
  }

  async onUnload() {}
}
```

Plugins can register commands, add sidebar panels, add full-page views, hook into task events, and store data. The API is stable (v1.0.0, semver).

Docs: [Plugin API](docs/plugins/API.md) / [Examples](docs/plugins/EXAMPLES.md)

## AI assistant

The sidebar chat connects to your LLM provider. It sees your tasks, projects, and schedule, so it can give useful suggestions.

Supported providers: OpenAI, Anthropic, OpenRouter, Ollama, LM Studio — or write a custom provider plugin.

Nothing AI-related runs unless you configure it. No keys are stored or proxied by Saydo.

## Tech stack

| | |
|---|---|
| Runtime | Node.js 22, TypeScript |
| Desktop | Tauri v2 |
| Frontend | React 19, Tailwind CSS 4 |
| Database | SQLite (better-sqlite3 / sql.js) + Drizzle ORM |
| AI | OpenAI, Anthropic, OpenRouter, Ollama, LM Studio |
| Voice | Browser Speech API, Groq, Inworld AI, Whisper, Kokoro, Piper |
| CLI | Commander.js |
| Tests | Vitest |
| Build | Vite 6 |

## Status

v1.0 shipped. Desktop app works on Mac, Windows, Linux. Active development — Inworld AI TTS, mobile UI, and AI intelligence tools are latest additions.

Next milestone: Saydo Sync (optional paid cross-device sync).

## Docs

- [Architecture](docs/development/ARCHITECTURE.md) — how the codebase is organized
- [Local setup](docs/development/SETUP_LOCAL.md) — getting it running
- [Contributing](docs/development/CONTRIBUTING.md) — how to help
- [Security](docs/development/SECURITY.md) — threat model, plugin sandboxing
- [Plugin API](docs/plugins/API.md) — building plugins
- [Plugin examples](docs/plugins/EXAMPLES.md) — walkthroughs
- [Roadmap](docs/planning/ROADMAP.md) — what's planned

## Contributing

See [CONTRIBUTING.md](docs/development/CONTRIBUTING.md). Run `pnpm check` before submitting PRs.

## License

MIT
