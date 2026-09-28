/**
 * Human-in-the-loop pause/resume: TanStack `defineInterrupt` + approval flow,
 * LangGraph `interrupt`/`humanInTheLoopMiddleware`. The loop suspends on an
 * `ApprovalRequest` until the host resolves it — no waiting primitives here.
 */
export type ApprovalRequest = {
  callId: string;
  name: string;
  input: unknown;
};

export type ApprovalDecision = { approved: true } | { approved: false; reason?: string };

/**
 * Host-side resolver. In the web app this waits on a confirmation UI;
 * a headless runner may auto-approve read-only tools or deny everything.
 */
export type ApprovalHandler = (
  request: ApprovalRequest,
  signal: AbortSignal,
) => Promise<ApprovalDecision>;
