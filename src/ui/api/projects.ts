import type { Project } from "../../core/types.js";
import { isTauri, BASE, handleResponse, getServices } from "./helpers.js";

export async function listTags(): Promise<{ id: string; name: string; color: string }[]> {
  if (isTauri()) {
    const svc = await getServices();
    return svc.tagService.list();
  }
  const res = await fetch(`${BASE}/tags`);
  return handleResponse<{ id: string; name: string; color: string }[]>(res);
}

export async function listProjects(): Promise<Project[]> {
  if (isTauri()) {
    const svc = await getServices();
    return svc.projectService.list();
  }
  const res = await fetch(`${BASE}/projects`);
  return handleResponse<Project[]>(res);
}
