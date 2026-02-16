import { useState, useEffect, useCallback, useRef } from "react";
import type { SettingsTab } from "../views/settings/types.js";

export type View =
  | "inbox"
  | "today"
  | "upcoming"
  | "project"
  | "task"
  | "settings"
  | "plugin-store"
  | "plugin-view"
  | "filters-labels"
  | "completed";

interface RouteState {
  view: View;
  projectId: string | null;
  taskId: string | null;
  pluginViewId: string | null;
  inboxQuery: string;
  settingsTab: SettingsTab;
  pluginSearch: string;
  focusModeOpen: boolean;
}

const DEFAULT_ROUTE_STATE: RouteState = {
  view: "inbox",
  projectId: null,
  taskId: null,
  pluginViewId: null,
  inboxQuery: "",
  settingsTab: "general",
  pluginSearch: "",
  focusModeOpen: false,
};

function decodePathSegment(segment: string | undefined): string | null {
  if (!segment) return null;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function parseSettingsTab(tab: string | null): SettingsTab {
  const validTabs: SettingsTab[] = [
    "general",
    "ai",
    "plugins",
    "templates",
    "keyboard",
    "data",
    "about",
  ];
  if (tab && validTabs.includes(tab as SettingsTab)) {
    return tab as SettingsTab;
  }
  return "general";
}

function parseRouteStateFromHash(hash: string): RouteState {
  const hashValue = hash.startsWith("#") ? hash.slice(1) : hash;
  const normalized = hashValue.startsWith("/") ? hashValue : "/inbox";
  const [rawPath, rawQuery = ""] = normalized.split("?");
  const pathSegments = rawPath.split("/").filter(Boolean);
  const params = new URLSearchParams(rawQuery);
  const route: RouteState = { ...DEFAULT_ROUTE_STATE };
  const root = pathSegments[0] ?? "inbox";

  switch (root) {
    case "inbox":
      route.view = "inbox";
      route.inboxQuery = params.get("q") ?? "";
      break;
    case "today":
      route.view = "today";
      break;
    case "upcoming":
      route.view = "upcoming";
      break;
    case "project":
      route.view = "project";
      route.projectId = decodePathSegment(pathSegments[1]);
      if (!route.projectId) route.view = "inbox";
      break;
    case "task":
      route.view = "task";
      route.taskId = decodePathSegment(pathSegments[1]);
      if (!route.taskId) route.view = "inbox";
      break;
    case "settings":
      route.view = "settings";
      route.settingsTab = parseSettingsTab(params.get("tab"));
      break;
    case "plugin-store":
      route.view = "plugin-store";
      route.pluginSearch = params.get("q") ?? "";
      break;
    case "plugin-view":
      route.view = "plugin-view";
      route.pluginViewId = decodePathSegment(pathSegments[1]);
      if (!route.pluginViewId) route.view = "inbox";
      break;
    case "filters-labels":
      route.view = "filters-labels";
      break;
    case "completed":
      route.view = "completed";
      break;
    default:
      route.view = "inbox";
      break;
  }

  route.focusModeOpen = params.get("focus") === "1";
  return route;
}

function buildHashFromRoute(route: RouteState): string {
  const params = new URLSearchParams();

  if (route.view === "inbox" && route.inboxQuery.trim()) {
    params.set("q", route.inboxQuery);
  }
  if (route.view === "settings") {
    params.set("tab", route.settingsTab);
  }
  if (route.view === "plugin-store" && route.pluginSearch.trim()) {
    params.set("q", route.pluginSearch);
  }
  if (route.focusModeOpen) {
    params.set("focus", "1");
  }
  let path = "/inbox";
  switch (route.view) {
    case "today":
      path = "/today";
      break;
    case "upcoming":
      path = "/upcoming";
      break;
    case "project":
      path = route.projectId ? `/project/${encodeURIComponent(route.projectId)}` : "/inbox";
      break;
    case "task":
      path = route.taskId ? `/task/${encodeURIComponent(route.taskId)}` : "/inbox";
      break;
    case "settings":
      path = "/settings";
      break;
    case "plugin-store":
      path = "/plugin-store";
      break;
    case "plugin-view":
      path = route.pluginViewId
        ? `/plugin-view/${encodeURIComponent(route.pluginViewId)}`
        : "/inbox";
      break;
    case "filters-labels":
      path = "/filters-labels";
      break;
    case "completed":
      path = "/completed";
      break;
    case "inbox":
    default:
      path = "/inbox";
      break;
  }

  const query = params.toString();
  return `#${path}${query ? `?${query}` : ""}`;
}

export function useRouting() {
  const [currentView, setCurrentView] = useState<View>("inbox");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedRouteTaskId, setSelectedRouteTaskId] = useState<string | null>(null);
  const [selectedPluginViewId, setSelectedPluginViewId] = useState<string | null>(null);
  const [inboxQueryText, setInboxQueryText] = useState("");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [pluginStoreSearchQuery, setPluginStoreSearchQuery] = useState("");
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [routeReady, setRouteReady] = useState(false);
  const navigationKeyRef = useRef<string | null>(null);

  const applyRouteState = useCallback((route: RouteState) => {
    setCurrentView(route.view);
    setSelectedProjectId(route.view === "project" ? route.projectId : null);
    setSelectedRouteTaskId(route.view === "task" ? route.taskId : null);
    setSelectedPluginViewId(route.view === "plugin-view" ? route.pluginViewId : null);
    setInboxQueryText(route.inboxQuery);
    setSettingsTab(route.settingsTab);
    setPluginStoreSearchQuery(route.pluginSearch);
    setFocusModeOpen(route.focusModeOpen);
  }, []);

  // Sync from hash on mount and popstate/hashchange
  useEffect(() => {
    const syncRouteFromLocation = () => {
      const route = parseRouteStateFromHash(window.location.hash);
      applyRouteState(route);
      navigationKeyRef.current = `${route.view}:${route.projectId ?? ""}:${route.taskId ?? ""}:${route.pluginViewId ?? ""}`;
    };

    syncRouteFromLocation();
    setRouteReady(true);

    window.addEventListener("popstate", syncRouteFromLocation);
    window.addEventListener("hashchange", syncRouteFromLocation);
    return () => {
      window.removeEventListener("popstate", syncRouteFromLocation);
      window.removeEventListener("hashchange", syncRouteFromLocation);
    };
  }, [applyRouteState]);

  // Push/replace hash when route state changes
  useEffect(() => {
    if (!routeReady) return;

    const route: RouteState = {
      view: currentView,
      projectId: selectedProjectId,
      taskId: selectedRouteTaskId,
      pluginViewId: selectedPluginViewId,
      inboxQuery: inboxQueryText,
      settingsTab,
      pluginSearch: pluginStoreSearchQuery,
      focusModeOpen,
    };

    const nextHash = buildHashFromRoute(route);
    const navigationKey = `${currentView}:${selectedProjectId ?? ""}:${selectedRouteTaskId ?? ""}:${selectedPluginViewId ?? ""}`;

    if (window.location.hash === nextHash) {
      navigationKeyRef.current = navigationKey;
      return;
    }

    if (navigationKeyRef.current === navigationKey) {
      window.history.replaceState(null, "", nextHash);
    } else {
      window.history.pushState(null, "", nextHash);
    }
    navigationKeyRef.current = navigationKey;
  }, [
    routeReady,
    currentView,
    selectedProjectId,
    selectedRouteTaskId,
    selectedPluginViewId,
    inboxQueryText,
    settingsTab,
    pluginStoreSearchQuery,
    focusModeOpen,
  ]);

  const handleNavigate = useCallback(
    (view: string, id?: string) => {
      const nextRoute: RouteState = {
        view: view as View,
        projectId: view === "project" ? (id ?? null) : null,
        taskId: view === "task" ? (id ?? null) : null,
        pluginViewId: view === "plugin-view" ? (id ?? null) : null,
        inboxQuery: inboxQueryText,
        settingsTab,
        pluginSearch: pluginStoreSearchQuery,
        focusModeOpen,
      };

      applyRouteState(nextRoute);
    },
    [applyRouteState, inboxQueryText, settingsTab, pluginStoreSearchQuery, focusModeOpen],
  );

  const openSettingsTab = useCallback(
    (tab: SettingsTab) => {
      handleNavigate("settings");
      setSettingsTab(tab);
    },
    [handleNavigate],
  );

  return {
    currentView,
    selectedProjectId,
    selectedRouteTaskId,
    selectedPluginViewId,
    inboxQueryText,
    setInboxQueryText,
    settingsTab,
    setSettingsTab,
    pluginStoreSearchQuery,
    setPluginStoreSearchQuery,
    focusModeOpen,
    setFocusModeOpen,
    handleNavigate,
    openSettingsTab,
  };
}
