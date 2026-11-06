import type { Runtime, Work } from "./schema";
export function restorePageSession(work: Work, saved: Runtime): Runtime {
  const next = structuredClone(saved);
  for (const call of work.data.phone ?? []) {
    if (call.meta.replayOnOpen !== "true") continue;
    const nodes = (call.meta.replayNodes || "").split(",").filter(Boolean);
    const message = call.meta.replayMessage;
    next.completed = next.completed.filter((id) => !nodes.includes(id));
    next.scheduled = next.scheduled?.filter((entry) => !nodes.includes(entry.nodeId));
    next.unlocked = next.unlocked.filter((id) => id !== message);
    next.read = next.read.filter((id) => id !== message);
    next.notifications = next.notifications.filter((text) =>
      text !== call.meta.replayMessageNotice && text !== call.meta.replayCallNotice);
    if (next.incomingCall?.target === call.id) next.incomingCall = null;
    if (next.ui?.photos && call.meta.replayAlbumKey)
      delete next.ui.photos[call.meta.replayAlbumKey];
  }
  return next;
}