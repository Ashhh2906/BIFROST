import { describe, expect, it } from 'vitest';
import { DEMO_PERSONA } from '../data/demoPersona.js';
import { SEED_PROFILES } from '../data/seedProfiles.js';
import { TOTAL_SLOTS, buildConflictTimeline, buildPersonSchedule, formatSlotTime } from '../utils/timeline.js';

describe('24-hour conflict timeline engine', () => {
  it('formats 6PM-aligned slot indices in 12-hour format', () => {
    expect(formatSlotTime(0)).toBe('6:00 PM');
    expect(formatSlotTime(12)).toBe('12:00 AM');
    expect(formatSlotTime(24)).toBe('6:00 AM');
    expect(formatSlotTime(36)).toBe('12:00 PM');
  });

  it('builds 48 slots with sleep > class > study precedence', () => {
    const person = {
      answers: {
        bedtime: 0, // 9:30 PM (slot 7)
        wakeTime: 1, // 7:00 AM (slot 26)
        studyTime: 3, // 10:00 PM (slot 8)
        studyHours: 2, // 5h -> slots 8..18 (all clipped by sleep!)
        classTiming: 0, // 8 AM - 1 PM
        studyLocation: 0,
        studyNoise: 0,
        screensAtNight: 0,
      },
    };
    const sched = buildPersonSchedule(person);
    expect(sched.slots).toHaveLength(TOTAL_SLOTS);
    // Slot 8 (10 PM) must remain sleep, not study
    expect(sched.slots[8]).toBe('sleep');
    // Slot 28 (8 AM) must be class
    expect(sched.slots[28]).toBe('class');
  });

  it('detects a >= 1.5h RED friction window between Demo User and Aarav', () => {
    const demoUser = { id: 'demo', name: 'Riya Verma', answers: DEMO_PERSONA.answers };
    const aarav = SEED_PROFILES.find((p) => p.id === 'aarav-mehta');
    const timeline = buildConflictTimeline(demoUser, aarav);

    const redWindows = timeline.conflictWindows.filter((w) => w.zone === 'red');
    expect(redWindows.length).toBeGreaterThanOrEqual(1);
    expect(redWindows.some((w) => w.durationHours >= 1.5)).toBe(true);
    expect(redWindows[0].sentence).toContain('Aarav Mehta');
    expect(timeline.summary.frictionHours).toBeGreaterThanOrEqual(1.5);
  });

  it('shows zero friction windows and high shared sleep for synchronized Demo + Ananya', () => {
    const demoUser = { id: 'demo', name: 'Riya Verma', answers: DEMO_PERSONA.answers };
    const ananya = SEED_PROFILES.find((p) => p.id === 'ananya-rao');
    const timeline = buildConflictTimeline(demoUser, ananya);

    expect(timeline.conflictWindows).toHaveLength(0);
    expect(timeline.summary.frictionHours).toBe(0);
    expect(timeline.summary.syncSleepHours).toBeGreaterThanOrEqual(8);
  });

  it('ignores transient friction windows shorter than 1 hour', () => {
    const earlySleeper = {
      name: 'Early',
      answers: {
        bedtime: 0, // 9:30 PM (slot 7)
        wakeTime: 1, // 7:00 AM
        lightSleeper: 5,
        screensAtNight: 0,
        studyTime: 0,
        studyHours: 0,
        studyNoise: 0,
        studyLocation: 2,
        classTiming: 3,
      },
    };
    const briefPhone = {
      name: 'Brief',
      answers: {
        bedtime: 1, // 11:00 PM (slot 10)
        wakeTime: 1,
        lightSleeper: 1,
        screensAtNight: 2, // awake screens between 9:30-11:00 is 1.5h, let's test 10:00 PM study ending at 10:30?
        // Instead use bedtime 0 (9:30) vs bedtime 0? No, if studyTime 3 (10 PM) studyHours 0 (1h -> 10-11 PM = 1h),
        // let's make earlySleeper sleep at 11 PM (slot 10) and Brief study 10-11 PM? No overlap.
        // Better: earlySleeper wakes 5:30 AM (slot 23), brief wakes 5:30 AM, sleeps 11 PM -> overlap is 9:30-11 PM (1.5h).
        // Let's test earlySleeper bedtime 1 (11 PM, slot 10) and brief bedtime 1? No.
        // What if earlySleeper sleeps 9:30 PM (slot 7), brief sleeps 11 PM (slot 10), brief has screensAtNight: 1 (low brightness, not screensOften),
        // and brief studies 10:00 PM - 11:00 PM? That's 1h (kept). How to make 0.5h?
        // earlySleeper sleeps 11 PM (slot 10), wakes 7 AM (slot 26); brief sleeps 11 PM, wakes 5:30 AM (slot 23) and studies at 7 AM? No.
        // Wait: earlySleeper sleeps 9:30 PM (slot 7), brief studies 6:00 PM + 5h = 6 PM - 11 PM -> overlaps 9:30 - 11:00 (1.5h).
        // If brief studies 6:00 PM + 4h? Midpoints are 1,3,5,7h.
        // What if brief sleeps at 9:30 PM? No conflict.
        // Actually, 9:30 PM (slot 7) to 10:00 PM (slot 8) in Aarav vs Demo is 0.5h AMBER before RED starts at 10:00 PM!
        studyTime: 3,
        studyHours: 1,
        studyNoise: 1,
        studyLocation: 0,
        classTiming: 3,
      },
    };
    void briefPhone;
    const demoUser = { id: 'demo', name: 'Riya Verma', answers: DEMO_PERSONA.answers };
    const aarav = SEED_PROFILES.find((p) => p.id === 'aarav-mehta');
    const timeline = buildConflictTimeline(demoUser, aarav);
    // Slot 7 (9:30-10:00 PM) is only 0.5h amber (screens), so it MUST be ignored from conflictWindows!
    expect(timeline.conflictWindows.every((w) => w.durationHours >= 1)).toBe(true);
    expect(timeline.conflictWindows.some((w) => w.startLabel === '9:30 PM')).toBe(false);
  });
});
