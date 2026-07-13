import { updateStreak, emptyStreak } from '../../utils/streak';

const d = (s: string) => new Date(`${s}T12:00:00Z`);

describe('updateStreak', () => {
  it('starts a streak on first activity', () => {
    const next = updateStreak(emptyStreak, d('2026-01-01'));
    expect(next).toEqual({
      lastActiveDate: '2026-01-01',
      currentStreak: 1,
      longestStreak: 1,
    });
  });

  it('does not change the count on the same day', () => {
    const day1 = updateStreak(emptyStreak, d('2026-01-01'));
    const same = updateStreak(day1, d('2026-01-01'));
    expect(same.currentStreak).toBe(1);
  });

  it('increments on consecutive days', () => {
    let s = updateStreak(emptyStreak, d('2026-01-01'));
    s = updateStreak(s, d('2026-01-02'));
    s = updateStreak(s, d('2026-01-03'));
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });

  it('resets after a gap but keeps the longest', () => {
    let s = updateStreak(emptyStreak, d('2026-01-01'));
    s = updateStreak(s, d('2026-01-02'));
    s = updateStreak(s, d('2026-01-03')); // streak 3
    s = updateStreak(s, d('2026-01-10')); // gap -> reset
    expect(s.currentStreak).toBe(1);
    expect(s.longestStreak).toBe(3);
  });
});
