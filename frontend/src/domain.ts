export type Mode = 'READ' | 'WRITE';
export type Status = 'PENDING' | 'HELD' | 'CONFLICT' | 'UNCLEAR' | 'RETRYABLE' | 'RELEASED' | 'EXPIRED' | 'CANCELLED';
export interface Workspace { id: string; name: string; resource: string; creator: string; members: string[]; closes_at: number; epoch: number; digest?: string; }
export interface Reservation { id: string; namespace_id: string; owner: string; scope: string; mode: Mode; status: Status; review_deadline: number; expires_at: number; fence: number; used: boolean; reason: string; attempts: number; deposit_gen: string; }
export interface Credit { owner: string; available_gen: string; withdrawn_gen: string; }
export interface Attempt { id: string; status: string; reason: string; relations: Record<string, string>; }
export type TxPhase = 'Awaiting signature' | 'Submitted' | 'Accepted' | 'Finalized' | 'Failed' | 'Review undecided';
export type Progress = (phase: TxPhase, hash?: string) => void;
export type Command = 'create_namespace' | 'open_request' | 'review_request' | 'use_fence' | 'release' | 'cancel_request' | 'recover' | 'withdraw';
export interface ContractAdapter {
  configured: boolean;
  workspaces(): Promise<Workspace[]>;
  workspace(id: string): Promise<Workspace>;
  requests(id: string): Promise<Reservation[]>;
  request(id: string): Promise<Reservation>;
  activity(owner: string): Promise<Reservation[]>;
  credit(owner: string): Promise<Credit>;
  attempts(id: string): Promise<Attempt[]>;
  write(command: Command, args: (string | number)[], valueGEN: '0' | '1', progress: Progress): Promise<unknown>;
}
export const labels: Record<Status, string> = { PENDING: 'Ready to check', HELD: 'Reserved', CONFLICT: 'Conflicting work', UNCLEAR: 'Clarify your scope', RETRYABLE: 'Review unavailable', RELEASED: 'Released', EXPIRED: 'Expired', CANCELLED: 'Cancelled' };
export function effectiveStatus(r: Reservation, now = Date.now() / 1000): Status {
  const expired = r.status === 'HELD' ? now >= r.expires_at : ['PENDING', 'RETRYABLE'].includes(r.status) && now >= r.review_deadline;
  return expired ? 'EXPIRED' : r.status;
}
export function actions(r: Reservation, account: string | undefined, w: Workspace | undefined, now = Date.now() / 1000): Command[] {
  if (!account || !w || !w.members.some(x => x.toLowerCase() === account.toLowerCase())) return [];
  const own = r.owner.toLowerCase() === account.toLowerCase(), pending = ['PENDING', 'RETRYABLE'].includes(r.status), held = r.status === 'HELD';
  const result: Command[] = [];
  if (own && pending && now < r.review_deadline && now < w.closes_at && r.attempts < 2) result.push('review_request');
  if (own && pending) result.push('cancel_request');
  if (own && held && now < r.expires_at) { if (!r.used) result.push('use_fence'); result.push('release'); }
  if ((pending && now >= r.review_deadline) || (held && now >= r.expires_at)) result.push('recover');
  return result;
}
