import { describe, it, expect } from "vitest";
import { createSandbox, type SandboxOptions } from "../../src/plugins/sandbox.js";

describe("createSandbox", () => {
  const defaultOptions: SandboxOptions = {
    pluginId: "test-plugin",
    pluginDir: "/plugins/test-plugin",
    permissions: ["tasks:read", "tasks:write"],
  };

  it("creates a sandbox with execute and destroy methods", () => {
    const sandbox = createSandbox(defaultOptions);
    expect(sandbox).toBeDefined();
    expect(typeof sandbox.execute).toBe("function");
    expect(typeof sandbox.destroy).toBe("function");
  });

  it("execute does not throw", async () => {
    const sandbox = createSandbox(defaultOptions);
    await expect(sandbox.execute("index.js")).resolves.toBeUndefined();
  });

  it("destroy does not throw", () => {
    const sandbox = createSandbox(defaultOptions);
    expect(() => sandbox.destroy()).not.toThrow();
  });

  it("works with empty permissions", () => {
    const sandbox = createSandbox({
      ...defaultOptions,
      permissions: [],
    });
    expect(sandbox).toBeDefined();
  });

  it("works with different plugin IDs", () => {
    const sandbox1 = createSandbox({ ...defaultOptions, pluginId: "plugin-a" });
    const sandbox2 = createSandbox({ ...defaultOptions, pluginId: "plugin-b" });
    expect(sandbox1).toBeDefined();
    expect(sandbox2).toBeDefined();
  });

  it("execute can be called multiple times", async () => {
    const sandbox = createSandbox(defaultOptions);
    await sandbox.execute("file1.js");
    await sandbox.execute("file2.js");
    // Should not throw on multiple calls
  });

  it("destroy can be called after execute", async () => {
    const sandbox = createSandbox(defaultOptions);
    await sandbox.execute("index.js");
    expect(() => sandbox.destroy()).not.toThrow();
  });
});
