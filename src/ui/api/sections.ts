import type { Section } from "../../core/types.js";
import { isTauri, BASE, handleResponse, handleVoidResponse, getServices } from "./helpers.js";

export async function listSections(projectId: string): Promise<Section[]> {
  if (isTauri()) {
    const svc = await getServices();
    return svc.sectionService.list(projectId);
  }
  const res = await fetch(`${BASE}/sections?projectId=${encodeURIComponent(projectId)}`);
  return handleResponse<Section[]>(res);
}

export async function createSection(projectId: string, name: string): Promise<Section> {
  if (isTauri()) {
    const svc = await getServices();
    const section = await svc.sectionService.create({ projectId, name });
    svc.save();
    return section;
  }
  const res = await fetch(`${BASE}/sections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, name }),
  });
  return handleResponse<Section>(res);
}

export async function updateSection(
  id: string,
  data: { name?: string; isCollapsed?: boolean },
): Promise<void> {
  if (isTauri()) {
    const svc = await getServices();
    await svc.sectionService.update(id, data);
    svc.save();
    return;
  }
  await handleVoidResponse(
    await fetch(`${BASE}/sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
  );
}

export async function deleteSection(id: string): Promise<void> {
  if (isTauri()) {
    const svc = await getServices();
    await svc.sectionService.delete(id);
    svc.save();
    return;
  }
  await handleVoidResponse(await fetch(`${BASE}/sections/${id}`, { method: "DELETE" }));
}

export async function reorderSections(orderedIds: string[]): Promise<void> {
  if (isTauri()) {
    const svc = await getServices();
    await svc.sectionService.reorder(orderedIds);
    svc.save();
    return;
  }
  await handleVoidResponse(
    await fetch(`${BASE}/sections/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    }),
  );
}
