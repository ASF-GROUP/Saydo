# Vision & Design

## What is ASF?

[AI Strategic Forum (ASF)](https://github.com/asf-org) is a community for AI enthusiasts focused on curated news, long-form analysis, and open-source tools. ASF values accuracy over speed, sources over vibes, and transparency over persuasion.

## What is Saydo?

A task manager that fills a gap: no good open-source option combines a clean UI, real AI integration, a plugin system, and full data ownership.

| Existing tool | Where it falls short |
|---|---|
| Todoist / TickTick | Closed source, weak AI, no extensibility, your data in their cloud |
| Obsidian Tasks | Notes app with tasks bolted on, not a task manager |
| Taskwarrior | Terminal-only, steep learning curve |
| Vikunja / Planka | No plugins, no AI |

Saydo is minimal out of the box. The plugin system is how you add what you need — and it's designed so anyone can ask an AI to generate a working plugin.

## Design principles

### Local-first, private by default

Data lives on your machine. Zero network calls by default. No accounts, no telemetry. AI features require your own API keys going directly to your provider — or run fully local with Ollama.

### AI-native, not bolted on

The AI assistant is a core part of the design — conversational sidebar, voice input, task context awareness. External AI agents can also connect via the MCP server to manage tasks programmatically. But AI is completely optional. The app works fine without it.

### Vibe-code extensible

The plugin API is designed so that describing what you want to Claude or ChatGPT produces a working plugin. If the API is too complicated for AI to generate correct code, it's too complicated.

Inspired by [Obsidian](https://obsidian.md/) and [Pi's extension model](https://github.com/badlogic/pi-mono).

### Minimal by default

Clean UI, no feature bloat. A developer wants Git sync and keyboard shortcuts. A PM wants Kanban. A student wants Pomodoro. The core doesn't pick sides — plugins do.

### No vendor lock-in

SQLite or Markdown files. Export anytime (JSON, CSV, Markdown). Switching away should be trivial. MIT licensed.

### Honest business model

Free forever. Revenue from optional paid sync hosting (like Obsidian Sync), not dark patterns or artificial limitations.

## Platform strategy

| Phase | Platform | Status |
|---|---|---|
| v1 | Desktop (Mac, Windows, Linux via Tauri) | Shipped |
| v1.5 | Cross-device sync service | Planned |
| v2 | Mobile (native + PWA) | Planned (needs sync) |
| v3 | Web app | Planned (needs sync) |

## Business model

| Tier | Price | What you get |
|---|---|---|
| Saydo | Free | Full app, all features, all plugins, local storage |
| Saydo Sync | Paid (TBD) | ASF-hosted sync for cross-device access |
| Saydo Enterprise | Paid (future) | Team features, admin controls, SSO |

The core app will never be paywalled.

## Plugin ecosystem

A community plugin store (like Obsidian's) where plugins are reviewed by ASF maintainers for safety before listing. Anyone can build plugins:

- **Developers**: write TypeScript, use the full Plugin API
- **Everyone else**: describe what you want to an AI, get a working plugin back

See [Plugin API](plugins/API.md) for the reference and [examples](plugins/EXAMPLES.md) for walkthroughs.

## ASF values

| Value | Meaning |
|---|---|
| Accuracy > Speed | Get it right, not just first |
| Disclosure > Persuasion | Be transparent about biases and limitations |
| Sources > Vibes | Cite, link, verify |
| Label speculation | If it's a guess, say so |
| No hidden promotion | Disclose affiliations |
