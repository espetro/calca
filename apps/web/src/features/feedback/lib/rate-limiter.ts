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
  return new Date().toISOString().split("T")[0]!];
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

/**
 * Persist spam state.
 */
function setSpamState(state: SpamState): void {
  setItem(STORAGE_KEYS.spamTimestamps, JSON.stringify(state));
}

/**
 * Check if user is in spam cooldown period.
 */
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

/**
 * Get spam cooldown remaining time in ms.
 */
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

/**
 * Set spam cooldown.
 */
function setSpamCooldown(until: number): void {
  setItem(STORAGE_KEYS.spamCooldown, JSON.stringify(until));
}

/**
 * Get the timestamp of the last submission for debounce purposes.
 */
function getLastSubmissionTime(): number {
  const raw = getItem("feedback_last_submission");
  if (!raw) return 0;
  try {
    return JSON.parse(raw) as number;
  } catch {
    return 0;
  }
}

/**
 * Set the last submission timestamp.
 */
function setLastSubmissionTime(time: number): void {
  setItem("feedback_last_submission", JSON.stringify(time));
}

/**
 * Check if feedback submission is allowed based on all 4 rate limit layers.
 *
 * @returns RateLimitResult with allowed=true if submission can proceed,
 *          or allowed=false with reason and optional retryAfterMs
 */
export function canSubmitFeedback(): RateLimitResult {
  const now = getNow();

  // Layer 1: Debounce - 2 second cooldown between submissions
  const lastSubmission = getLastSubmissionTime();
  if (lastSubmission > 0 && now - lastSubmission < DEBOUNCE_MS) {
    const retryAfterMs = DEBOUNCE_MS - (now - lastSubmission);
    return {
      allowed: false,
      reason: "Please wait before submitting again",
      retryAfterMs,
    };
  }

  // Layer 2: Per-session - Max 5 submissions per browser tab
  const sessionCount = getSessionCount();
  if (sessionCount >= SESSION_MAX) {
    return {
      allowed: false,
      reason: "Maximum submissions reached for this session. Please refresh the page to submit more.",
    };
  }

  // Layer 3: Daily quota - Max 10 submissions per day
  const dailyCount = getDailyCount();
  if (dailyCount >= DAILY_MAX) {
    return {
      allowed: false,
      reason: "Daily submission limit reached. Please try again tomorrow.",
    };
  }

  // Layer 4: Spam detection - 3+ submissions in 5 minutes triggers 30-min cooldown
  if (isInSpamCooldown()) {
    return {
      allowed: false,
      reason: "Too many submissions detected. Please wait 30 minutes before trying again.",
      retryAfterMs: getSpamCooldownRemaining(),
    };
  }

  return { allowed: true };
}

/**
 * Record a successful feedback submission.
 * Must be called after each successful submission.
 */
export function recordSubmission(): void {
  const now = getNow();

  // Record for debounce
  setLastSubmissionTime(now);

  // Increment session count
  incrementSessionCount();

  // Increment daily count
  incrementDailyCount();

  // Update spam detection
  const spamState = getSpamState();
  const recentTimestamps = spamState.timestamps.filter((ts) => now - ts < SPAM_WINDOW_MS);
  recentTimestamps.push(now);

  // Check if we crossed the spam threshold
  if (recentTimestamps.length >= SPAM_THRESHOLD) {
    const cooldownUntil = now + SPAM_COOLDOWN_MS;
    setSpamCooldown(cooldownUntil);
    // Clear timestamps after setting cooldown
    setSpamState({ timestamps: [] });
  } else {
    setSpamState({ timestamps: recentTimestamps });
  }
}

/**
 * Reset all rate limit state. Useful for testing.
 */
export function resetRateLimitState(): void {
  removeItem("feedback_last_submission");
  try {
    sessionStorage.removeItem(STORAGE_KEYS.sessionCount);
  } catch {
    // Ignore
  }
  // Only clear today's daily count, not other days
  removeItem(STORAGE_KEYS.daily(getDateKey()));
  removeItem(STORAGE_KEYS.spamTimestamps);
  removeItem(STORAGE_KEYS.spamCooldown);
}
