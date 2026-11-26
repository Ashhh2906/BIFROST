/**
 * 24-Hour Conflict Timeline Engine
 *
 * Represents a full day as 48 half-hour slots starting at 6:00 PM (slot 0)
 * and ending at 6:00 PM the next day (slot 48) so overnight sleep/study
 * stays visually contiguous.
 *
 * Slot precedence per person: sleep > class > study > free.
 */

export const TOTAL_SLOTS = 48;

const BEDTIME_HOURS = {
  0: 21.5, // 9:30 PM
  1: 23.0, // 11:00 PM
  2: 25.0, // 1:00 AM (next day relative to 6 PM)
  3: 27.0, // 3:00 AM
};

const WAKE_HOURS = {
  0: 29.5, // 5:30 AM
  1: 31.0, // 7:00 AM
  2: 33.0, // 9:00 AM
  3: 35.0, // 11:00 AM
};

const CLASS_WINDOWS = {
  0: [38, 48], // Wait: converted below using hourToSlot (8 AM = 14h after 6 PM -> slot 28..38)
};

const STUDY_START_HOURS = {
  0: 31.0, // 7:00 AM (Evening=18, Late=22, Morning=31, Afternoon=38)
  1: 38.0, // 2:00 PM -> 20h after 6 PM? Wait: 6PM=18, 2PM next day = 38!
  2: 18.0, // 6:00 PM
  3: 22.0, // 10:00 PM
};

const STUDY_DURATION_HOURS = {
  0: 1, // 0-2h midpoint
  1: 3, // 2-4h midpoint
  2: 5, // 4-6h midpoint
  3: 7, // 6h+ midpoint
};

/**
 * Convert an absolute hour on our 6 PM..6 PM axis (18.0 .. 42.0) to slot index 0..48.
 */
function axisHourToSlot(axisHour) {
  return Math.round((axisHour - 18.0) * 2);
}

/**
 * Format a slot index (0..48, where 0 = 6:00 PM) into 12-hour clock text like "11:30 PM".
 */
export function formatSlotTime(slotIndex) {
  const normalizedSlot = ((slotIndex % TOTAL_SLOTS) + TOTAL_SLOTS) % TOTAL_SLOTS;
  const totalMinutesFromMidnight = (18 * 60 + normalizedSlot * 30) % (24 * 60);
  const hour24 = Math.floor(totalMinutesFromMidnight / 60);
  const minute = totalMinutesFromMidnight % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minStr = minute === 0 ? '00' : String(minute).padStart(2, '0');
  return `${hour12}:${minStr} ${period}`;
}

/**
 * Build a 48-slot daily schedule for a single person.
 */
export function buildPersonSchedule(person) {
  const answers = person?.answers || {};
  const slots = new Array(TOTAL_SLOTS).fill('free');

  // 1. Study block (lowest active priority before free)
  const studyStartHour = STUDY_START_HOURS[answers.studyTime];
  const studyHours = STUDY_DURATION_HOURS[answers.studyHours] ?? 3;
  if (studyStartHour !== undefined) {
    const startSlot = axisHourToSlot(studyStartHour);
    const slotLen = studyHours * 2;
    for (let i = 0; i < slotLen; i += 1) {
      const idx = (startSlot + i) % TOTAL_SLOTS;
      slots[idx] = 'study';
    }
  }

  // 2. Class window (overrides study)
  // Morning: 8 AM - 1 PM (axis 32..37), Midday: 11 AM - 4 PM (axis 35..40), Afternoon: 1 PM - 6 PM (axis 37..42)
  const classRanges = {
    0: [32.0, 37.0], // 8 AM - 1 PM (18 + 14 = 32, 18 + 19 = 37)
    1: [35.0, 40.0], // 11 AM - 4 PM (18 + 17 = 35, 18 + 22 = 40)
    2: [37.0, 42.0], // 1 PM - 6 PM (18 + 19 = 37, 18 + 24 = 42)
  };
  const classRange = classRanges[answers.classTiming];
  if (classRange) {
    const startSlot = axisHourToSlot(classRange[0]);
    const endSlot = axisHourToSlot(classRange[1]);
    for (let i = startSlot; i < endSlot; i += 1) {
      slots[i % TOTAL_SLOTS] = 'class';
    }
  }

  // 3. Sleep window (highest precedence: clips study & class)
  const bedHour = BEDTIME_HOURS[answers.bedtime] ?? 23.0;
  const wakeHour = WAKE_HOURS[answers.wakeTime] ?? 31.0;
  const sleepStart = axisHourToSlot(bedHour);
  const sleepEnd = axisHourToSlot(wakeHour);
  for (let i = sleepStart; i < sleepEnd; i += 1) {
    slots[i % TOTAL_SLOTS] = 'sleep';
  }

  const flags = {
    studiesInRoom: answers.studyLocation !== 2,
    noisy: (answers.studyNoise ?? 0) > 0,
    lightsOn: (answers.screensAtNight ?? 0) > 0,
    screensOften: answers.screensAtNight === 2,
    lightSleeper: answers.lightSleeper ?? 3,
  };

  return { slots, flags };
}

// Keep unused constant clean
void CLASS_WINDOWS;

function evaluateSleeperVsAwake(sleeperName, sleeperFlags, awakeName, awakeState, awakeFlags) {
  const isRoomStudyDisturbance =
    awakeState === 'study' && awakeFlags.studiesInRoom && (awakeFlags.lightsOn || awakeFlags.noisy);

  if (isRoomStudyDisturbance) {
    const highSeverity = sleeperFlags.lightSleeper >= 3 || awakeFlags.screensOften;
    const reasons = [];
    if (awakeFlags.lightsOn) reasons.push('lights on');
    if (awakeFlags.noisy) reasons.push('speaker/audio');
    return {
      zone: highSeverity ? 'red' : 'amber',
      causeKey: `${sleeperName}-sleeps-${awakeName}-studies`,
      sleeper: sleeperName,
      disturber: awakeName,
      action: `studying in the room with ${reasons.join(' & ')}`,
    };
  }

  if (awakeFlags.screensOften) {
    return {
      zone: 'amber',
      causeKey: `${sleeperName}-sleeps-${awakeName}-screens`,
      sleeper: sleeperName,
      disturber: awakeName,
      action: 'awake in the room with bright screens/lights',
    };
  }

  return null;
}

/**
 * Analyze the 24-hour overlap between `user` and `candidate`.
 */
export function buildConflictTimeline(user, candidate) {
  const userName = user?.name || 'You';
  const candName = candidate?.name || 'Match';

  const userSched = buildPersonSchedule(user);
  const candSched = buildPersonSchedule(candidate);

  const overlapSlots = [];
  let syncSleepSlots = 0;
  let syncClassSlots = 0;

  for (let i = 0; i < TOTAL_SLOTS; i += 1) {
    const uState = userSched.slots[i];
    const cState = candSched.slots[i];

    if (uState === 'sleep' && cState === 'sleep') {
      syncSleepSlots += 1;
      overlapSlots.push({
        slot: i,
        zone: 'green',
        causeKey: 'both-sleep',
        description: 'Both sleeping',
      });
      continue;
    }

    if (uState === 'class' && cState === 'class') {
      syncClassSlots += 1;
      overlapSlots.push({
        slot: i,
        zone: 'green',
        causeKey: 'both-class',
        description: 'Both in class',
      });
      continue;
    }

    if (uState === 'sleep' && cState !== 'sleep') {
      const clash = evaluateSleeperVsAwake('You', userSched.flags, candName, cState, candSched.flags);
      if (clash) {
        overlapSlots.push({
          slot: i,
          zone: clash.zone,
          causeKey: clash.causeKey,
          sleeper: 'You',
          disturber: candName,
          action: clash.action,
        });
        continue;
      }
    }

    if (cState === 'sleep' && uState !== 'sleep') {
      const clash = evaluateSleeperVsAwake(candName, candSched.flags, 'You', uState, userSched.flags);
      if (clash) {
        overlapSlots.push({
          slot: i,
          zone: clash.zone,
          causeKey: clash.causeKey,
          sleeper: candName,
          disturber: 'You',
          action: clash.action,
        });
        continue;
      }
    }

    overlapSlots.push({
      slot: i,
      zone: 'neutral',
      causeKey: 'neutral',
      description: 'No direct conflict',
    });
  }

  // Merge consecutive slots into windows
  const rawWindows = [];
  for (const entry of overlapSlots) {
    const prev = rawWindows[rawWindows.length - 1];
    if (prev && prev.zone === entry.zone && prev.causeKey === entry.causeKey) {
      prev.endSlot = entry.slot + 1;
    } else {
      rawWindows.push({
        zone: entry.zone,
        causeKey: entry.causeKey,
        startSlot: entry.slot,
        endSlot: entry.slot + 1,
        sleeper: entry.sleeper,
        disturber: entry.disturber,
        action: entry.action,
        description: entry.description,
      });
    }
  }

  // Ignore red/amber windows shorter than 1 hour (2 slots)
  const conflictWindows = [];
  const keptSlotZones = new Array(TOTAL_SLOTS).fill('neutral');
  for (let i = 0; i < TOTAL_SLOTS; i += 1) {
    if (overlapSlots[i].zone === 'green') keptSlotZones[i] = 'green';
  }

  let redSlots = 0;
  let amberSlots = 0;

  for (const w of rawWindows) {
    const lengthSlots = w.endSlot - w.startSlot;
    if (w.zone === 'red' || w.zone === 'amber') {
      if (lengthSlots < 2) continue;

      for (let s = w.startSlot; s < w.endSlot; s += 1) {
        keptSlotZones[s] = w.zone;
      }
      if (w.zone === 'red') redSlots += lengthSlots;
      else amberSlots += lengthSlots;

      const startLabel = formatSlotTime(w.startSlot);
      const endLabel = formatSlotTime(w.endSlot);
      const durationHours = lengthSlots * 0.5;
      const sleeperClause =
        w.sleeper === 'You' ? "You're sleeping" : `${w.sleeper} is sleeping`;
      const disturberClause =
        w.disturber === 'You' ? `you are ${w.action}` : `${w.disturber} is ${w.action}`;

      conflictWindows.push({
        zone: w.zone,
        startSlot: w.startSlot,
        endSlot: w.endSlot,
        startLabel,
        endLabel,
        durationHours,
        sleeper: w.sleeper,
        disturber: w.disturber,
        sentence: `${startLabel} – ${endLabel}: ${sleeperClause}, ${disturberClause}.`,
      });
    }
  }

  const normalizedOverlap = overlapSlots.map((slot, idx) => ({
    ...slot,
    effectiveZone: keptSlotZones[idx],
  }));

  const frictionHours = Number(((redSlots + amberSlots) * 0.5).toFixed(1));
  const redHours = Number((redSlots * 0.5).toFixed(1));
  const amberHours = Number((amberSlots * 0.5).toFixed(1));
  const syncSleepHours = Number((syncSleepSlots * 0.5).toFixed(1));
  const syncClassHours = Number((syncClassSlots * 0.5).toFixed(1));

  return {
    userName,
    candName,
    userSchedule: userSched,
    candidateSchedule: candSched,
    overlapSlots: normalizedOverlap,
    conflictWindows,
    summary: {
      frictionHours,
      redHours,
      amberHours,
      syncSleepHours,
      syncClassHours,
    },
  };
}
