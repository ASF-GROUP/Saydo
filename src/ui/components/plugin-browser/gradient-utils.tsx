// ── Gradient system ──────────────────────────────────

export const GRADIENT_PALETTE = [
  ["from-violet-500", "to-purple-600"],
  ["from-blue-500", "to-cyan-500"],
  ["from-emerald-500", "to-teal-500"],
  ["from-orange-500", "to-amber-500"],
  ["from-rose-500", "to-pink-500"],
  ["from-indigo-500", "to-blue-500"],
  ["from-fuchsia-500", "to-purple-500"],
  ["from-sky-500", "to-indigo-500"],
  ["from-lime-500", "to-green-500"],
  ["from-red-500", "to-orange-500"],
  ["from-teal-500", "to-cyan-500"],
  ["from-pink-500", "to-rose-500"],
] as const;

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getGradient(pluginId: string): [string, string] {
  const idx = hashString(pluginId) % GRADIENT_PALETTE.length;
  return GRADIENT_PALETTE[idx] as [string, string];
}

export function formatDownloads(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

// ── Gradient Banner ──────────────────────────────────

export function GradientBanner({ pluginId, icon }: { pluginId: string; icon?: string }) {
  const [from, to] = getGradient(pluginId);
  return (
    <div
      className={`h-16 rounded-t-lg bg-gradient-to-r ${from} ${to} flex items-center justify-center`}
    >
      <span className="text-3xl drop-shadow-sm">{icon || "🧩"}</span>
    </div>
  );
}
