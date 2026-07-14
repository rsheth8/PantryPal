// Daily-streak bookkeeping. Given the last-active date and current streak,
// compute the updated streak when the app is opened on a given day.
//
// Rules:
//  - Same calendar day  -> unchanged
//  - Next calendar day  -> +1
//  - Gap of 2+ days     -> reset to 1

export interface StreakState {
  lastActiveDate: string | null; // YYYY-MM-DD
  currentStreak: number;
  longestStreak: number;
}

export const emptyStreak: StreakState = {
  lastActiveDate: null,
  currentStreak: 0,
  longestStreak: 0,
};

function toDayString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function dayDiff(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

export function updateStreak(
  prev: StreakState,
  now: Date = new Date()
): StreakState {
  const today = toDayString(now);

  if (!prev.lastActiveDate) {
    return { lastActiveDate: today, currentStreak: 1, longestStreak: 1 };
  }

  const diff = dayDiff(prev.lastActiveDate, today);

  if (diff <= 0) {
    // Same day (or clock skew) — no change to the streak count.
    return { ...prev };
  }

  const currentStreak = diff === 1 ? prev.currentStreak + 1 : 1;
  const longestStreak = Math.max(prev.longestStreak, currentStreak);

  return { lastActiveDate: today, currentStreak, longestStreak };
}
