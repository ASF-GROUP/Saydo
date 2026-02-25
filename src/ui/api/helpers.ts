import { isTauri } from "../../utils/tauri.js";

export { isTauri };

export const BASE = "/api";

export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // Use status code message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function handleVoidResponse(res: Response): Promise<void> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // Use status code message
    }
    throw new Error(message);
  }
}

// Lazy-loaded services for Tauri mode — Promise lock prevents double bootstrap
export type WebServices = Awaited<ReturnType<typeof import("../../bootstrap-web.js").bootstrapWeb>>;
let _services: WebServices | null = null;
let _pending: Promise<WebServices> | null = null;

export async function getServices(): Promise<WebServices> {
  if (_services) return _services;
  if (_pending) return _pending;
  _pending = (async () => {
    const { bootstrapWeb } = await import("../../bootstrap-web.js");
    _services = await bootstrapWeb();
    _pending = null;
    return _services;
  })();
  return _pending;
}
