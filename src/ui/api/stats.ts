import type { DailyStat } from "../../core/types.js";
import { useDirectServices, BASE, handleResponse, getServices } from "./helpers.js";

export async function getDailyStats(startDate: string, endDate: string): Promise<DailyStat[]> {
  if (useDirectServices()) {
    const svc = await getServices();
    return svc.statsService.getStats(startDate, endDate);
  }
  const url = new URL(`${BASE}/stats/daily`, window.location.origin);
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  const res = await fetch(url.toString());
  return handleResponse<DailyStat[]>(res);
}

export async function getTodayStats(): Promise<DailyStat> {
  if (useDirectServices()) {
    const svc = await getServices();
    return svc.statsService.getToday();
  }
  const res = await fetch(`${BASE}/stats/today`);
  return handleResponse<DailyStat>(res);
}
