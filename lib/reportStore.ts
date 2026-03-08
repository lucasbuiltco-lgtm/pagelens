export interface AuditSection {
  title: string;
  score: number;
  summary: string;
  details: string[];
}

export interface AuditResult {
  overallScore: number;
  sections: AuditSection[];
  improvements: string[];
  seo: {
    title: string | null;
    metaDescription: string | null;
    h1Count: number;
    headingStructure: string;
    assessment: string;
  };
}

interface StoredEntry {
  report: AuditResult;
  url: string;
  email?: string;
  createdAt: number;
}

const store = new Map<string, StoredEntry>();
const TTL = 24 * 60 * 60 * 1000; // 24 hours

function cleanup() {
  const now = Date.now();
  store.forEach((value, key) => {
    if (now - value.createdAt > TTL) store.delete(key);
  });
}

export function storeReport(id: string, data: Omit<StoredEntry, "createdAt">) {
  cleanup();
  store.set(id, { ...data, createdAt: Date.now() });
}

export function getReport(id: string): StoredEntry | undefined {
  const entry = store.get(id);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > TTL) {
    store.delete(id);
    return undefined;
  }
  return entry;
}
