import { useState, useEffect, useCallback } from "react";
import { useAIContext } from "../../context/AIContext.js";
import { api, type AIProviderInfo, type ModelDiscoveryInfo } from "../../api/index.js";
import type { AiMemoryRow } from "../../../storage/interface.js";

const PROVIDER_HELP: Record<string, string> = {
  openai: "Get your API key at platform.openai.com.",
  anthropic: "Get your API key at console.anthropic.com.",
  openrouter: "Unified gateway for 100+ models. Get your key at openrouter.ai.",
  ollama: "Free local models. Install at ollama.com, no API key needed.",
  lmstudio: "Local model server. Download at lmstudio.ai, no API key needed.",
};

const CATEGORY_COLORS: Record<string, string> = {
  preference: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  habit: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  context: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  instruction: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  pattern: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

function MemorySection() {
  const [memories, setMemories] = useState<AiMemoryRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<AiMemoryRow["category"]>("context");
  const { dataMutationCount } = useAIContext();

  const loadMemories = useCallback(async () => {
    try {
      const data = await api.getAiMemories();
      setMemories(data);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories, dataMutationCount]);

  const handleEdit = (memory: AiMemoryRow) => {
    setEditingId(memory.id);
    setEditContent(memory.content);
    setEditCategory(memory.category);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    await api.updateAiMemory(editingId, editContent.trim(), editCategory);
    setEditingId(null);
    await loadMemories();
  };

  const handleDelete = async (id: string) => {
    await api.deleteAiMemory(id);
    await loadMemories();
  };

  const handleClearAll = async () => {
    await api.deleteAllAiMemories();
    await loadMemories();
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-on-surface">Memory</h2>
        {memories.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-on-surface-muted">
              {memories.length} {memories.length === 1 ? "memory" : "memories"}
            </span>
            <button
              onClick={handleClearAll}
              className="text-xs text-danger hover:text-danger/80"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {memories.length === 0 ? (
        <p className="text-sm text-on-surface-muted">
          No memories yet. The AI will remember important things you share in conversations.
        </p>
      ) : (
        <div className="space-y-2 max-w-lg">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="border border-border rounded-lg p-3 bg-surface"
            >
              {editingId === memory.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-border rounded bg-surface text-on-surface resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={editCategory}
                      onChange={(e) =>
                        setEditCategory(e.target.value as AiMemoryRow["category"])
                      }
                      className="px-2 py-1 text-xs border border-border rounded bg-surface text-on-surface"
                    >
                      <option value="preference">preference</option>
                      <option value="habit">habit</option>
                      <option value="context">context</option>
                      <option value="instruction">instruction</option>
                      <option value="pattern">pattern</option>
                    </select>
                    <button
                      onClick={handleSaveEdit}
                      className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent-hover"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-xs text-on-surface-muted hover:text-on-surface"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface">{memory.content}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${CATEGORY_COLORS[memory.category] ?? CATEGORY_COLORS.context}`}
                      >
                        {memory.category}
                      </span>
                      <span className="text-[10px] text-on-surface-muted">
                        {new Date(memory.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(memory)}
                      className="p-1 text-on-surface-muted hover:text-on-surface rounded"
                      title="Edit"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(memory.id)}
                      className="p-1 text-on-surface-muted hover:text-danger rounded"
                      title="Delete"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AITab() {
  const { config, isConfigured, updateConfig, refreshConfig } = useAIContext();
  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelDiscoveryInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsFailed, setModelsFailed] = useState(false);
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [modelLoadingId, setModelLoadingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .listAIProviders()
      .then(setProviders)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (config && !loaded) {
      setProvider(config.provider ?? "");
      setModel(config.model ?? "");
      setBaseUrl(config.baseUrl ?? "");
      setLoaded(true);
    }
  }, [config, loaded]);

  // Fetch available models when provider or baseUrl changes
  useEffect(() => {
    if (!provider) {
      setAvailableModels([]);
      setModelsFailed(false);
      return;
    }

    setModelsLoading(true);
    setModelsFailed(false);
    setUseCustomModel(false);

    const timer = setTimeout(() => {
      api
        .fetchModels(provider, baseUrl || undefined)
        .then((models) => {
          setAvailableModels(models);
          setModelsFailed(false);
          if (models.length > 0) {
            const isPlaceholder = !model || model === "default";
            if (isPlaceholder) {
              // Auto-select first loaded model, or first model
              const firstLoaded = models.find((m) => m.loaded);
              setModel((firstLoaded ?? models[0]).id);
            } else if (!models.some((m) => m.id === model)) {
              setUseCustomModel(true);
            }
          }
        })
        .catch(() => {
          setAvailableModels([]);
          setModelsFailed(true);
        })
        .finally(() => setModelsLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [provider, baseUrl]);

  const currentProvider = providers.find((p) => p.name === provider);
  const supportsAutoLoad = provider === "lmstudio";
  const [autoManage, setAutoManage] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("saydo.ai.auto-manage-lmstudio") === "1";
  });

  const handleProviderChange = async (newProvider: string) => {
    setProvider(newProvider);
    setApiKey("");
    const prov = providers.find((p) => p.name === newProvider);
    setModel(prov?.defaultModel ?? "");
    setBaseUrl(prov?.defaultBaseUrl ?? "");
    setUseCustomModel(false);

    if (!newProvider) {
      await updateConfig({ provider: "", apiKey: "", model: "", baseUrl: "" });
    }
  };

  const handleModelSelect = async (selectedId: string) => {
    if (selectedId === "__custom__") {
      setUseCustomModel(true);
      setModel("");
      return;
    }
    setModel(selectedId);

    // Auto-load if the model isn't loaded yet (LM Studio)
    const modelInfo = availableModels.find((m) => m.id === selectedId);
    if (supportsAutoLoad && modelInfo && !modelInfo.loaded) {
      setModelLoadingId(selectedId);
      try {
        await api.loadModel(provider, selectedId, baseUrl || undefined);
        // Update loaded status in state
        setAvailableModels((prev) =>
          prev.map((m) => (m.id === selectedId ? { ...m, loaded: true } : m)),
        );
      } catch {
        // Model load failed — still set the model, user can retry
      } finally {
        setModelLoadingId(null);
      }
    }
  };

  const handleSave = async () => {
    await updateConfig({
      provider: provider || undefined,
      apiKey: apiKey || undefined,
      model: model || undefined,
      baseUrl: baseUrl || undefined,
    });
    setApiKey("");
    await refreshConfig();
    // Re-fetch models after save (API key may have changed)
    if (provider) {
      api
        .fetchModels(provider, baseUrl || undefined)
        .then((models) => {
          setAvailableModels(models);
          setModelsFailed(false);
        })
        .catch(() => {});
    }
  };

  const showDropdown = availableModels.length > 0 && !useCustomModel;

  return (
    <>
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-on-surface">AI Assistant</h2>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-on-surface-secondary mb-1">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-on-surface"
            >
              <option value="">None (disabled)</option>
              {providers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.displayName}
                  {p.pluginId ? " (plugin)" : ""}
                </option>
              ))}
            </select>
          </div>

          {provider && (
            <>
              {(currentProvider?.needsApiKey || currentProvider?.optionalApiKey) && (
                <div>
                  <label className="block text-xs font-medium text-on-surface-secondary mb-1">
                    API Key
                    {currentProvider?.optionalApiKey && !currentProvider?.needsApiKey && (
                      <span className="font-normal text-on-surface-muted ml-1">(optional)</span>
                    )}
                    {config?.hasApiKey && <span className="font-normal text-success ml-2">Set</span>}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      config?.hasApiKey
                        ? "Enter new key to update"
                        : currentProvider?.optionalApiKey
                          ? "Enter API key for remote servers"
                          : "Enter API key"
                    }
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-on-surface"
                  />
                  {PROVIDER_HELP[provider] && (
                    <p className="mt-1 text-xs text-on-surface-muted">{PROVIDER_HELP[provider]}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-on-surface-secondary mb-1">
                  Model
                  {modelsLoading && (
                    <span className="font-normal text-on-surface-muted ml-2">Loading...</span>
                  )}
                </label>
                {showDropdown ? (
                  <>
                    <select
                      value={model}
                      onChange={(e) => handleModelSelect(e.target.value)}
                      disabled={!!modelLoadingId}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-on-surface disabled:opacity-60"
                    >
                      {!model && <option value="">Select a model...</option>}
                      {availableModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                          {m.loaded ? "" : " (not loaded)"}
                        </option>
                      ))}
                      <option value="__custom__">Custom...</option>
                    </select>
                    {modelLoadingId && (
                      <p className="mt-1 text-xs text-accent">Loading model into LM Studio...</p>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder={currentProvider?.defaultModel ?? "Enter model name"}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-on-surface"
                    />
                    {useCustomModel && availableModels.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustomModel(false);
                          if (!availableModels.some((m) => m.id === model)) {
                            const firstLoaded = availableModels.find((m) => m.loaded);
                            setModel((firstLoaded ?? availableModels[0]).id);
                          }
                        }}
                        className="mt-1 text-xs text-accent hover:text-accent-hover"
                      >
                        Back to model list
                      </button>
                    )}
                    {modelsFailed && (
                      <p className="mt-1 text-xs text-on-surface-muted">
                        {provider === "lmstudio"
                          ? "Could not connect to LM Studio. Make sure LM Studio is running and its local server is started."
                          : provider === "ollama"
                            ? "Could not connect to Ollama. Make sure Ollama is running."
                            : "Could not fetch models — enter a model name manually."}
                      </p>
                    )}
                  </>
                )}
              </div>

              {currentProvider?.showBaseUrl && (
                <div>
                  <label className="block text-xs font-medium text-on-surface-secondary mb-1">
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={currentProvider?.defaultBaseUrl ?? ""}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-on-surface"
                  />
                </div>
              )}

              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover"
              >
                Save
              </button>

              <p className={`text-xs ${isConfigured ? "text-success" : "text-on-surface-muted"}`}>
                {isConfigured ? "Connected" : "Not configured"}
              </p>

              {supportsAutoLoad && (
                <label className="flex items-center gap-2 text-sm text-on-surface mt-2">
                  <input
                    type="checkbox"
                    checked={autoManage}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setAutoManage(checked);
                      window.localStorage.setItem(
                        "saydo.ai.auto-manage-lmstudio",
                        checked ? "1" : "0",
                      );
                    }}
                    className="accent-accent"
                  />
                  Auto-manage LM Studio models
                  <span className="text-xs text-on-surface-muted ml-1">
                    (load on chat open, unload on close)
                  </span>
                </label>
              )}
            </>
          )}
        </div>
      </section>

      <DailyBriefingSection />

      <CustomInstructionsSection />

      <MemorySection />
    </>
  );
}

function CustomInstructionsSection() {
  const [instructions, setInstructions] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .getAppSetting("ai_custom_instructions")
      .then((val) => {
        if (val) setInstructions(val);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    await api.setAppSetting("ai_custom_instructions", instructions.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!loaded) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-1 text-on-surface">Custom Instructions</h2>
      <p className="text-xs text-on-surface-muted mb-3">
        Add instructions the AI will always follow. These are injected into every conversation.
      </p>
      <textarea
        value={instructions}
        onChange={(e) => {
          setSaved(false);
          setInstructions(e.target.value.slice(0, 2000));
        }}
        placeholder="e.g., 'Always suggest time estimates', 'You're a project manager for a software team', 'Respond in Spanish'"
        rows={4}
        className="w-full max-w-lg px-3 py-2 text-sm border border-border rounded-lg bg-surface text-on-surface resize-none"
      />
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={handleSave}
          className="px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent-hover"
        >
          Save
        </button>
        <span className="text-xs text-on-surface-muted">{instructions.length}/2000</span>
        {saved && <span className="text-xs text-success">Saved</span>}
      </div>
    </section>
  );
}

function DailyBriefingSection() {
  const [enabled, setEnabled] = useState(false);
  const [energy, setEnergy] = useState("medium");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getAppSetting("ai_daily_briefing"),
      api.getAppSetting("ai_default_energy"),
    ])
      .then(([briefing, energyVal]) => {
        if (briefing === "on") setEnabled(true);
        if (energyVal) setEnergy(energyVal);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    await api.setAppSetting("ai_daily_briefing", checked ? "on" : "off");
  };

  const handleEnergyChange = async (value: string) => {
    setEnergy(value);
    await api.setAppSetting("ai_default_energy", value);
  };

  if (!loaded) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-1 text-on-surface">Daily Briefing</h2>
      <p className="text-xs text-on-surface-muted mb-3">
        Automatically start your morning with a day plan when you open the AI chat.
      </p>
      <div className="space-y-3 max-w-md">
        <label className="flex items-center gap-2 text-sm text-on-surface">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="accent-accent"
          />
          Auto-show morning briefing
          <span className="text-xs text-on-surface-muted">(5am-12pm)</span>
        </label>

        <div>
          <label className="block text-xs font-medium text-on-surface-secondary mb-1">
            Default energy level
          </label>
          <select
            value={energy}
            onChange={(e) => handleEnergyChange(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-on-surface"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    </section>
  );
}
