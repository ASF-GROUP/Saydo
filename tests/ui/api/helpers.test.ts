import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the tauri utility before importing helpers
vi.mock("../../../src/utils/tauri.js", () => ({
  isTauri: () => false,
}));

// Mock the web bootstrap
vi.mock("../../../src/bootstrap-web.js", () => ({
  bootstrapWeb: vi.fn().mockResolvedValue({ mock: "services" }),
}));

import { handleResponse, handleVoidResponse, getServices } from "../../../src/ui/api/helpers.js";

describe("handleResponse", () => {
  it("returns parsed JSON for ok response", async () => {
    const res = {
      ok: true,
      json: () => Promise.resolve({ id: "t1", title: "Hello" }),
    } as unknown as Response;

    const data = await handleResponse<{ id: string }>(res);
    expect(data.id).toBe("t1");
  });

  it("throws with error message from response body", async () => {
    const res = {
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Bad input" }),
    } as unknown as Response;

    await expect(handleResponse(res)).rejects.toThrow("Bad input");
  });

  it("falls back to HTTP status code if body has no error", async () => {
    const res = {
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("parse error")),
    } as unknown as Response;

    await expect(handleResponse(res)).rejects.toThrow("HTTP 500");
  });
});

describe("handleVoidResponse", () => {
  it("resolves for ok response", async () => {
    const res = { ok: true } as Response;
    await expect(handleVoidResponse(res)).resolves.toBeUndefined();
  });

  it("throws for non-ok response", async () => {
    const res = {
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Not found" }),
    } as unknown as Response;

    await expect(handleVoidResponse(res)).rejects.toThrow("Not found");
  });

  it("falls back to status code on json parse failure", async () => {
    const res = {
      ok: false,
      status: 403,
      json: () => Promise.reject(new Error("no json")),
    } as unknown as Response;

    await expect(handleVoidResponse(res)).rejects.toThrow("HTTP 403");
  });
});

describe("getServices", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns services from bootstrapWeb", async () => {
    // getServices is already imported with the mock. Just ensure it returns something.
    // Note: getServices caches, so the first call creates, subsequent return cached.
    const svc = await getServices();
    expect(svc).toBeDefined();
  });
});
