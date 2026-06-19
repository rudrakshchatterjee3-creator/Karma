import { describe, it, expect } from 'vitest';
import { calculateMonthlyLeak, createActions, defaultProfile, formatPoints } from './karmaLogic';

describe('Karma Logic Physics Engine', () => {
  it('calculates higher leaks for heavy AC users', () => {
    const lowProfile = { ...defaultProfile, acHours: 2, bill: 1000 };
    const highProfile = { ...defaultProfile, acHours: 12, bill: 3000 };
    
    const lowLeak = calculateMonthlyLeak(lowProfile);
    const highLeak = calculateMonthlyLeak(highProfile);
    
    expect(highLeak).toBeGreaterThan(lowLeak);
  });

  it('suggests AC optimization for high AC usage', () => {
    const profile = { ...defaultProfile, acHours: 12 };
    const actions = createActions(profile, []);
    
    expect(actions[0].category).toBe('energy');
  });

  it('suggests Transport optimization for high car usage', () => {
    const profile = { ...defaultProfile, commuteMode: 'car' as const, commuteKm: 300 };
    const actions = createActions(profile, []);
    
    expect(actions[0].category).toBe('transport');
  });

  it('formats points correctly with sign', () => {
    expect(formatPoints(120)).toBe('+120 pts');
    expect(formatPoints(-50)).toBe('-50 pts');
    expect(formatPoints(0)).toBe('0 pts');
  });
});
