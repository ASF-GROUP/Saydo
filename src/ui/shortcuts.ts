export interface ShortcutBinding {
  id: string;
  description: string;
  defaultKey: string;
  currentKey: string;
  callback: () => void;
  /** Two-key chord sequence, e.g. "g i" meaning press g, then i. */
  chord?: string;
}

/**
 * Global keyboard shortcut manager.
 * Supports customizable key bindings persisted to appSettings.
 */
export class ShortcutManager {
  private bindings = new Map<string, ShortcutBinding>();
  private listeners = new Set<() => void>();
  private pendingChord: string | null = null;
  private chordTimer: ReturnType<typeof setTimeout> | null = null;
  private chordListeners = new Set<(pending: string | null) => void>();

  register(binding: {
    id: string;
    description: string;
    defaultKey: string;
    callback: () => void;
    chord?: string;
  }): void {
    // Don't overwrite currentKey if already registered with a custom binding
    const existing = this.bindings.get(binding.id);
    if (existing) {
      existing.callback = binding.callback;
      existing.description = binding.description;
      if (binding.chord !== undefined) existing.chord = binding.chord;
      return;
    }

    this.bindings.set(binding.id, {
      ...binding,
      currentKey: binding.defaultKey,
    });
  }

  rebind(id: string, newKey: string): { ok: true } | { ok: false; conflict: string } {
    const binding = this.bindings.get(id);
    if (!binding) return { ok: false, conflict: `Unknown shortcut: ${id}` };

    const conflict = this.getConflict(newKey, id);
    if (conflict) {
      return { ok: false, conflict: conflict.description };
    }

    binding.currentKey = newKey;
    this.notify();
    return { ok: true };
  }

  resetToDefault(id: string): void {
    const binding = this.bindings.get(id);
    if (binding) {
      binding.currentKey = binding.defaultKey;
      this.notify();
    }
  }

  handleKeyDown(e: KeyboardEvent): boolean {
    // Don't handle shortcuts when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return false;

    const pressed = normalizeKeyEvent(e);
    if (!pressed) return false;

    // --- Chord handling ---
    if (this.pendingChord) {
      const chordCombo = this.pendingChord + " " + pressed;
      this.clearChordState();

      for (const binding of this.bindings.values()) {
        if (binding.chord && binding.chord.toLowerCase() === chordCombo) {
          e.preventDefault();
          binding.callback();
          return true;
        }
      }
      // No chord match — fall through to normal handling below
    }

    // Check if this key starts any chord sequence
    for (const binding of this.bindings.values()) {
      if (binding.chord) {
        const firstKey = binding.chord.toLowerCase().split(" ")[0];
        if (firstKey === pressed) {
          e.preventDefault();
          this.setPendingChord(pressed);
          return true;
        }
      }
    }

    // --- Normal (non-chord) binding handling ---
    for (const binding of this.bindings.values()) {
      if (normalizeKeyCombo(binding.currentKey) === pressed) {
        e.preventDefault();
        binding.callback();
        return true;
      }
    }
    return false;
  }

  /** Returns the current pending chord key, or null if no chord is in progress. */
  getPendingChord(): string | null {
    return this.pendingChord;
  }

  /** Subscribe to chord state changes. Returns an unsubscribe function. */
  onChordChange(listener: (pending: string | null) => void): () => void {
    this.chordListeners.add(listener);
    return () => this.chordListeners.delete(listener);
  }

  private setPendingChord(key: string): void {
    this.pendingChord = key;
    this.chordTimer = setTimeout(() => {
      this.clearChordState();
    }, 1500);
    this.notifyChordListeners();
  }

  private clearChordState(): void {
    if (this.chordTimer) {
      clearTimeout(this.chordTimer);
      this.chordTimer = null;
    }
    if (this.pendingChord !== null) {
      this.pendingChord = null;
      this.notifyChordListeners();
    }
  }

  private notifyChordListeners(): void {
    for (const listener of this.chordListeners) {
      listener(this.pendingChord);
    }
  }

  getConflict(key: string, excludeId?: string): ShortcutBinding | null {
    const normalized = normalizeKeyCombo(key);
    for (const binding of this.bindings.values()) {
      if (binding.id !== excludeId && normalizeKeyCombo(binding.currentKey) === normalized) {
        return binding;
      }
    }
    return null;
  }

  toJSON(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const binding of this.bindings.values()) {
      if (binding.currentKey !== binding.defaultKey) {
        result[binding.id] = binding.currentKey;
      }
    }
    return result;
  }

  loadCustomBindings(bindings: Record<string, string>): void {
    for (const [id, key] of Object.entries(bindings)) {
      const binding = this.bindings.get(id);
      if (binding) {
        binding.currentKey = key;
      }
    }
  }

  unregister(id: string): void {
    this.bindings.delete(id);
  }

  getAll(): ShortcutBinding[] {
    return Array.from(this.bindings.values());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

/** Normalize a key combo string like "ctrl+shift+k" to a canonical form. */
export function normalizeKeyCombo(combo: string): string {
  const parts = combo
    .toLowerCase()
    .split("+")
    .map((p) => p.trim());
  const mods: string[] = [];
  let key = "";

  for (const part of parts) {
    if (part === "ctrl" || part === "control") mods.push("ctrl");
    else if (part === "meta" || part === "cmd" || part === "command") mods.push("meta");
    else if (part === "alt" || part === "option") mods.push("alt");
    else if (part === "shift") mods.push("shift");
    else key = part;
  }

  mods.sort();
  return [...mods, key].join("+");
}

/** Convert a KeyboardEvent to a normalized key combo string. */
export function normalizeKeyEvent(e: KeyboardEvent): string {
  const mods: string[] = [];
  if (e.ctrlKey || e.metaKey) mods.push("ctrl");
  if (e.altKey) mods.push("alt");
  if (e.shiftKey) mods.push("shift");

  let key = e.key.toLowerCase();
  // Normalize special keys
  if (key === " ") key = "space";
  if (key === "escape") key = "esc";

  // Skip modifier-only keypresses
  if (["control", "meta", "alt", "shift"].includes(key)) return "";

  mods.sort();
  return [...mods, key].join("+");
}
