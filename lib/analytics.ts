// In-memory analytics — resets on cold start, but gives real-time funnel visibility
// For persistent analytics, add Vercel Analytics or a DB later

interface AnalyticsData {
  startedAt: string;
  previews: number;
  freeUnlocks: number;
  paidUnlocks: number;
  emailsCaptured: number;
  recentEvents: { type: string; timestamp: string; meta?: string }[];
}

const data: AnalyticsData = {
  startedAt: new Date().toISOString(),
  previews: 0,
  freeUnlocks: 0,
  paidUnlocks: 0,
  emailsCaptured: 0,
  recentEvents: [],
};

const MAX_EVENTS = 50;

function addEvent(type: string, meta?: string) {
  data.recentEvents.unshift({
    type,
    timestamp: new Date().toISOString(),
    meta,
  });
  if (data.recentEvents.length > MAX_EVENTS) {
    data.recentEvents.length = MAX_EVENTS;
  }
}

export function trackPreview(url: string, hasEmail: boolean) {
  data.previews++;
  if (hasEmail) data.emailsCaptured++;
  addEvent("preview", url);
}

export function trackFreeUnlock(email: string) {
  data.freeUnlocks++;
  addEvent("free_unlock", email);
}

export function trackPaidUnlock(sessionId: string) {
  data.paidUnlocks++;
  addEvent("paid_unlock", sessionId);
}

export function getAnalytics(): AnalyticsData & {
  conversionRate: string;
  freeToPreviewRate: string;
  paidToPreviewRate: string;
  uptimeMinutes: number;
} {
  const uptimeMs = Date.now() - new Date(data.startedAt).getTime();
  const previews = data.previews || 1; // avoid /0
  return {
    ...data,
    conversionRate: `${(((data.freeUnlocks + data.paidUnlocks) / previews) * 100).toFixed(1)}%`,
    freeToPreviewRate: `${((data.freeUnlocks / previews) * 100).toFixed(1)}%`,
    paidToPreviewRate: `${((data.paidUnlocks / previews) * 100).toFixed(1)}%`,
    uptimeMinutes: Math.floor(uptimeMs / 60000),
  };
}
