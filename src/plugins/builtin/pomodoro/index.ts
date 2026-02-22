import { Plugin } from "../../lifecycle.js";

type TimerState = "idle" | "running" | "paused" | "break";
type Phase = "work" | "break" | "longBreak";

export default class PomodoroPlugin extends Plugin {
  private state: TimerState = "idle";
  private phase: Phase = "work";
  private timeLeft = 0;
  private session = 1;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private statusHandle: { update: (data: { text?: string; icon?: string }) => void } | null = null;

  async onLoad() {
    this.timeLeft = this.getWorkSeconds();

    // Register commands
    this.app.commands?.register({
      id: "start",
      name: "Pomodoro: Start",
      callback: () => this.start(),
    });

    this.app.commands?.register({
      id: "pause",
      name: "Pomodoro: Pause",
      callback: () => this.pause(),
    });

    this.app.commands?.register({
      id: "reset",
      name: "Pomodoro: Reset",
      callback: () => this.reset(),
    });

    this.app.commands?.register({
      id: "skip",
      name: "Pomodoro: Skip",
      callback: () => this.skip(),
    });

    // Status bar
    this.statusHandle =
      this.app.ui.addStatusBarItem?.({
        id: "pomodoro-timer",
        text: "Ready",
        icon: "\uD83C\uDF45",
      }) ?? null;

    // View (replaces old sidebar panel)
    this.app.ui.addView?.({
      id: "pomodoro",
      name: "Pomodoro",
      icon: "\uD83C\uDF45",
      slot: "tools",
      contentType: "structured",
      render: () => this.getViewContent(),
    });
  }

  async onUnload() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.statusHandle = null;
  }

  private start() {
    if (this.state === "running") return;

    if (this.state === "idle") {
      this.timeLeft = this.getPhaseSeconds();
    }

    this.state = "running";
    this.intervalId = setInterval(() => this.tick(), 1000);
    this.updateUI();
  }

  private pause() {
    if (this.state !== "running") return;

    this.state = "paused";
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.updateUI();
  }

  private reset() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.timeLeft = this.getPhaseSeconds();
    this.state = "idle";
    this.updateUI();
  }

  private skip() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.advancePhase();
    this.state = "idle";
    this.updateUI();
  }

  private tick() {
    this.timeLeft--;
    if (this.timeLeft <= 0) {
      this.advancePhase();
      // Auto-start next phase
      this.timeLeft = this.getPhaseSeconds();
    }
    this.updateUI();
  }

  private advancePhase() {
    if (this.phase === "work") {
      const sessionsBeforeLong = this.settings.get<number>("sessionsBeforeLongBreak");
      if (this.session >= sessionsBeforeLong) {
        this.phase = "longBreak";
        this.session = 1;
      } else {
        this.phase = "break";
        this.session++;
      }
    } else {
      this.phase = "work";
    }
    this.timeLeft = this.getPhaseSeconds();
  }

  private getWorkSeconds(): number {
    return this.settings.get<number>("workMinutes") * 60;
  }

  private getPhaseSeconds(): number {
    switch (this.phase) {
      case "work":
        return this.settings.get<number>("workMinutes") * 60;
      case "break":
        return this.settings.get<number>("breakMinutes") * 60;
      case "longBreak":
        return this.settings.get<number>("longBreakMinutes") * 60;
    }
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  private getPhaseLabel(): string {
    switch (this.phase) {
      case "work":
        return "Work";
      case "break":
        return "Break";
      case "longBreak":
        return "Long Break";
    }
  }

  private updateUI() {
    const time = this.formatTime(this.timeLeft);

    // Update status bar
    if (this.state === "idle") {
      this.statusHandle?.update({ text: "Ready" });
    } else if (this.state === "paused") {
      this.statusHandle?.update({ text: `${time} (paused)` });
    } else {
      this.statusHandle?.update({ text: time });
    }
  }

  private getViewContent(): string {
    const time = this.formatTime(this.timeLeft);
    const phaseLabel = this.getPhaseLabel();
    const totalSeconds = this.getPhaseSeconds();
    const elapsed = totalSeconds - this.timeLeft;
    const sessionsBeforeLong = this.settings.get<number>("sessionsBeforeLongBreak");

    // Build action buttons based on state
    const buttons: unknown[] = [];
    if (this.state === "running") {
      buttons.push({ type: "button", label: "Pause", commandId: "pomodoro:pause", variant: "primary" });
    } else {
      buttons.push({
        type: "button",
        label: this.state === "paused" ? "Resume" : "Start",
        commandId: "pomodoro:start",
        variant: "primary",
      });
    }
    buttons.push({ type: "button", label: "Reset", commandId: "pomodoro:reset", variant: "secondary" });
    buttons.push({ type: "button", label: "Skip", commandId: "pomodoro:skip", variant: "ghost" });

    const content = {
      layout: "center",
      elements: [
        { type: "text", value: phaseLabel, variant: "subtitle" },
        { type: "spacer", size: "sm" },
        { type: "text", value: time, variant: "mono" },
        { type: "spacer", size: "sm" },
        {
          type: "progress",
          value: elapsed,
          max: totalSeconds,
          color: this.phase === "work" ? "accent" : "success",
        },
        { type: "spacer", size: "sm" },
        { type: "row", elements: buttons, gap: "md", justify: "center" },
        { type: "spacer", size: "sm" },
        {
          type: "row",
          elements: [
            {
              type: "badge",
              value: `Session ${this.session}/${sessionsBeforeLong}`,
              color: "default",
            },
            {
              type: "badge",
              value: this.state.charAt(0).toUpperCase() + this.state.slice(1),
              color:
                this.state === "running"
                  ? "success"
                  : this.state === "paused"
                    ? "warning"
                    : "default",
            },
          ],
          gap: "sm",
          justify: "center",
        },
      ],
    };

    return JSON.stringify(content);
  }
}
