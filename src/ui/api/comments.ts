import type { TaskComment, TaskActivity } from "../../core/types.js";
import { isTauri, BASE, handleResponse, handleVoidResponse, getServices } from "./helpers.js";

export async function listTaskComments(taskId: string): Promise<TaskComment[]> {
  if (isTauri()) {
    const svc = await getServices();
    return svc.storage.listTaskComments(taskId);
  }
  const res = await fetch(`${BASE}/tasks/${taskId}/comments`);
  return handleResponse<TaskComment[]>(res);
}

export async function addTaskComment(taskId: string, content: string): Promise<TaskComment> {
  if (isTauri()) {
    const { generateId } = await import("../../utils/ids.js");
    const svc = await getServices();
    const now = new Date().toISOString();
    const comment: TaskComment = {
      id: generateId(),
      taskId,
      content,
      createdAt: now,
      updatedAt: now,
    };
    svc.storage.insertTaskComment(comment);
    svc.save();
    return comment;
  }
  const res = await fetch(`${BASE}/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return handleResponse<TaskComment>(res);
}

export async function updateTaskComment(commentId: string, content: string): Promise<void> {
  if (isTauri()) {
    const svc = await getServices();
    svc.storage.updateTaskComment(commentId, {
      content,
      updatedAt: new Date().toISOString(),
    });
    svc.save();
    return;
  }
  await handleVoidResponse(
    await fetch(`${BASE}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }),
  );
}

export async function deleteTaskComment(commentId: string): Promise<void> {
  if (isTauri()) {
    const svc = await getServices();
    svc.storage.deleteTaskComment(commentId);
    svc.save();
    return;
  }
  await handleVoidResponse(await fetch(`${BASE}/comments/${commentId}`, { method: "DELETE" }));
}

export async function listTaskActivity(taskId: string): Promise<TaskActivity[]> {
  if (isTauri()) {
    const svc = await getServices();
    return svc.storage.listTaskActivity(taskId);
  }
  const res = await fetch(`${BASE}/tasks/${taskId}/activity`);
  return handleResponse<TaskActivity[]>(res);
}
