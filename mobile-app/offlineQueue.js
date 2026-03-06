const STORAGE_KEY = "proofaid-offline-queue";

export function addOfflineRedemption(voucherId) {
  const queue = getQueue();
  queue.push({
    action: "REDEEM",
    payload: { voucherId },
    createdAt: new Date().toISOString()
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function getQueue() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function syncQueue(apiBase = "") {
  const queue = getQueue();
  if (queue.length === 0) return { synced: 0 };

  const queueResp = await fetch(`${apiBase}/offline/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transactions: queue })
  });

  if (!queueResp.ok) throw new Error("Failed to upload offline queue");

  const syncResp = await fetch(`${apiBase}/offline/sync`, { method: "POST" });
  if (!syncResp.ok) throw new Error("Failed to sync offline queue");

  localStorage.removeItem(STORAGE_KEY);
  return syncResp.json();
}
