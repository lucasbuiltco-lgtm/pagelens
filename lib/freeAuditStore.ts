const claimed = new Set<string>();

export function hasFreeAudit(email: string): boolean {
  return claimed.has(email.toLowerCase().trim());
}

export function claimFreeAudit(email: string): void {
  claimed.add(email.toLowerCase().trim());
}
