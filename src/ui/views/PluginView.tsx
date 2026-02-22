import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api/index.js";
import {
  StructuredContentRenderer,
  type StructuredContent,
} from "../components/StructuredContentRenderer.js";
import type { ViewInfo } from "../api/plugins.js";

interface PluginViewProps {
  viewId: string;
  viewInfo?: ViewInfo;
}

export function PluginView({ viewId, viewInfo }: PluginViewProps) {
  const [content, setContent] = useState("");
  const mountedRef = useRef(true);
  const isStructured = viewInfo?.contentType === "structured";

  useEffect(() => {
    mountedRef.current = true;

    const fetchContent = async () => {
      try {
        const text = await api.getPluginViewContent(viewId);
        if (mountedRef.current) setContent(text);
      } catch {
        // Non-critical
      }
    };

    fetchContent();
    // Structured views poll faster (timers need responsive updates)
    const interval = setInterval(fetchContent, isStructured ? 500 : 1000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [viewId, isStructured]);

  const handleCommand = useCallback(async (commandId: string) => {
    await api.executePluginCommand(commandId);
  }, []);

  if (isStructured) {
    let parsed: StructuredContent | null = null;
    try {
      parsed = JSON.parse(content) as StructuredContent;
    } catch {
      // Content isn't valid JSON yet — show nothing while loading
    }

    if (!parsed) {
      return <div className="p-6 text-on-surface-muted text-sm">Loading...</div>;
    }

    return (
      <div className="p-6 max-w-lg mx-auto">
        <StructuredContentRenderer content={parsed} onCommand={handleCommand} />
      </div>
    );
  }

  return (
    <div>
      <pre className="whitespace-pre-wrap text-sm text-on-surface-secondary font-mono">
        {content}
      </pre>
    </div>
  );
}
