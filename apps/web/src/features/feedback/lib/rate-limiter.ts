/**
 * 4-layer client-side rate limiter for feedback submissions.
 *
 * Layers:
 * 1. Debounce: 2-second cooldown between submissions
 * 2. Per-session: Max 5 submissions per browser tab lifetime
 * 3. Daily quota: Max 10 submissions per day (localStorage with date key)
 * 4. Spam detection: If 3+ submissions in 5 minutes, require 30-min cooldown
 */

const DEBOUNCE_MS = 2_000;
const SESSION_MAX = 5;
const DAILY_MAX = 10;
const SPAM_THRESHOLD = 3;
const SPAM_WINDOW_MS = 5 * 60 * 1000;
const SPAM_COOLDOWN_MS = 30 * 60 * 1000;

const STORAGE_KEYS = {
  daily: (date: string) => `feedback_rate_limit:${date}`,
  sessionCount: "feedback_session_count",
  spamTimestamps: "feedback_spam_timestamps",
  spamCooldown: "feedback_spam_cooldown",
} as const;

function getDateKey(): string {
  return new Date().toISOString().split("T")[0]!;
}

function getNow(): number {
  return Date.now();
}

function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore errors
  }
}

function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
}

interface SessionState {
  count: number;
}

interface SpamState {
  timestamps: number[];
  cooldownUntil?: number;
}

function getSessionCount(): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.sessionCount);
    if (!raw) return 0;
    const state = JSON.parse(raw) as SessionState;
    return state.count ?? 0;
  } catch {
    return 0;
  }
}

function incrementSessionCount(): void {
  try {
    const count = getSessionCount();
    const state: SessionState = { count: count + 1 };
    sessionStorage.setItem(STORAGE_KEYS.sessionCount, JSON.stringify(state));
  } catch {
    // Ignore errors
  }
}

function getDailyCount(): number {
  const dateKey = getDateKey();
  const raw = getItem(STORAGE_KEYS.daily(dateKey));
  if (!raw) return 0;
  try {
    return JSON.parse(raw) as number;
  } catch {
    return 0;
  }
}

function incrementDailyCount(): void {
  const dateKey = getDateKey();
  const count = getDailyCount();
  setItem(STORAGE_KEYS.daily(dateKey), JSON.stringify(count + 1));
}

function getSpamState(): SpamState {
  const raw = getItem(STORAGE_KEYS.spamTimestamps);
  if (!raw) return { timestamps: [] };
  try {
    return JSON.parse(raw) as SpamState;
  } catch {
    return { timestamps: [] };
  }
}

function setSpamState(state: SpamState): void {
  setItem(STORAGE_KEYS.spamTimestamps, JSON.stringify(state));
}

function isInSpamCooldown(): boolean {
  const raw = getItem(STORAGE_KEYS.spamCooldown);
  if (!raw) return false;
  try {
    const cooldownUntil = JSON.parse(raw) as number;
    return getNow() < cooldownUntil;
  } catch {
    return false;
  }
}

function getSpamCooldownRemaining(): number {
  const raw = getItem(STORAGE_KEYS.spamCooldown);
  if (!raw) return 0;
  try {
    const cooldownUntil = JSON.parse(raw) as number;
    const remaining = cooldownUntil - getNow();
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

function setSpamCooldown(until: number): void {
  setItem(STORAGE_KEYS.spamCooldown, JSON.stringify(until));
}

function getLastSubmissionTime(): number {
  const raw = getItem("feedback_last_submission");
  if (!raw) return 0;
  try {
    return JSON.parse(raw) as number;
  } catch {
    return 0;
  }
}

function setLastSubmissionTime(time: number): void {
  setItem("feedback_last_submission", JSON.stringify(time));
}

export function canSubmitFeedback(): RateLimitResult {
  const now = getNow();

  const lastSubmission = getLastSubmissionTime();
  if (lastSubmission > 0 && now - lastSubmission < DEBOUNCE_MS) {
    return {
      allowed: false,
      reason: "Please wait before submitting again",
      retryAfterMs: DEBOUNCE_MS - (now - lastSubmission),
    };
  }

  const sessionCount = getSessionCount();
  if (sessionCount >= SESSION_MAX) {
    return {
      allowed: false,
      reason: "Maximum submissions reached for this session. Please refresh the page to submit more.",
    };
  }

  const dailyCount = getDailyCount();
  if (dailyCount >= DAILY_MAX) {
    return {
      allowed: false,
      reason: "Daily submission limit reached. Please try again tomorrow.",
    };
  }

  if (isInSpamCooldown()) {
    return {
      allowed: false,
      reason: "Too many submissions detected. Please wait 30 minutes before trying again.",
      retryAfterMs: getSpamCooldownRemaining(),
    };
  }

  return { allowed: true };
}

export function recordSubmission(): void {
  const now = getNow();

  setLastSubmissionTime(now);
  incrementSessionCount();
  incrementDailyCount();

  const spamState = getSpamState();
  const recentTimestamps = spamState.timestamps.filter((ts) => now - ts < SPAM_WINDOW_MS);
  recentTimestamps.push(now);

  if (recentTimestamps.length >= SPAM_THRESHOLD) {
    setSpamCooldown(now + SPAM_COOLDOWN_MS);
    setSpamState({ timestamps: [] });
  } else {
    setSpamState({ timestamps: recentTimestamps });
  }
}

export function resetRateLimitState(): void {
  removeItem("feedback_last_submission");
  try {
    sessionStorage.removeItem(STORAGE_KEYS.sessionCount);
  } catch {
    // Ignore
  }
  removeItem(STORAGE_KEYS.daily(getDateKey()));
  removeItem(STORAGE_KEYS.spamTimestamps);
  removeItem(STORAGE_KEYS.spamCooldown);
}
