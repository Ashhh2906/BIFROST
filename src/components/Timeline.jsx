import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { TOTAL_SLOTS, formatSlotTime } from '../utils/timeline.js';

const STATE_COLOR = {
  sleep: 'bg-indigo-600 dark:bg-indigo-500',
  class: 'bg-sky-500 dark:bg-sky-400',
  study: 'bg-violet-500 dark:bg-violet-400',
  free: 'bg-slate-200 dark:bg-slate-700',
};

const OVERLAP_COLOR = {
  green: 'bg-emerald-500 dark:bg-emerald-400',
  red: 'bg-rose-500 dark:bg-rose-500',
  amber: 'bg-amber-400 dark:bg-amber-400',
  neutral: 'bg-slate-200/70 dark:bg-slate-800',
};

const STATE_LABEL = {
  sleep: 'Sleeping',
  class: 'In class',
  study: 'Studying',
  free: 'Free / room time',
};

const AXIS_LABELS = [
  { slot: 0, text: '6PM' },
  { slot: 12, text: '12AM' },
  { slot: 24, text: '6AM' },
  { slot: 36, text: '12PM' },
  { slot: 48, text: '6PM' },
];

export default function Timeline({ timeline }) {
  const [activeSlot, setActiveSlot] = useState(null);
  const { userName, candName, userSchedule, candidateSchedule, overlapSlots, conflictWindows, summary } =
    timeline;

  const inspected = activeSlot !== null ? overlapSlots[activeSlot] : null;
  const srSummary =
    conflictWindows.length > 0
      ? conflictWindows.map((w) => w.sentence).join(' ')
      : `No major schedule conflicts detected. Shared sleep: ${summary.syncSleepHours} hours/day.`;

  return (
    <section
      aria-label="24-hour conflict timeline"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6"
    >
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
              24-Hour Conflict Timeline (6 PM → 6 PM)
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Hover or tap any 30-minute block to inspect what both roommates are doing.
          </p>
        </div>

        {/* Totals summary pills */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span
            className={`rounded-full border px-2.5 py-1 ${
              summary.frictionHours >= 1.5
                ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                : summary.frictionHours > 0
                ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            {summary.frictionHours}h/day friction
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            {summary.syncSleepHours}h shared sleep
          </span>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
            {summary.syncClassHours}h shared class
          </span>
        </div>
      </div>

      {/* Screen-reader accessible summary */}
      <p className="sr-only">{srSummary}</p>

      {/* Lanes */}
      <div className="space-y-3" onMouseLeave={() => setActiveSlot(null)}>
        {/* Lane 1: You */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
            <span>{userName}</span>
            <span className="text-[11px] font-normal text-slate-400">Daily routine</span>
          </div>
          <div
            className="grid h-6 w-full gap-[1px] overflow-hidden rounded-lg bg-slate-100 p-[1px] dark:bg-slate-800"
            style={{ gridTemplateColumns: 'repeat(48, minmax(0, 1fr))' }}
          >
            {userSchedule.slots.map((st, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`${formatSlotTime(idx)}: ${userName} is ${STATE_LABEL[st]}`}
                onMouseEnter={() => setActiveSlot(idx)}
                onFocus={() => setActiveSlot(idx)}
                onClick={() => setActiveSlot(idx)}
                className={`h-full w-full rounded-[1px] transition-opacity ${STATE_COLOR[st]} ${
                  activeSlot === idx ? 'ring-2 ring-slate-900 dark:ring-white' : 'hover:opacity-85'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Lane 2: Match */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
            <span>{candName}</span>
            <span className="text-[11px] font-normal text-slate-400">Daily routine</span>
          </div>
          <div
            className="grid h-6 w-full gap-[1px] overflow-hidden rounded-lg bg-slate-100 p-[1px] dark:bg-slate-800"
            style={{ gridTemplateColumns: 'repeat(48, minmax(0, 1fr))' }}
          >
            {candidateSchedule.slots.map((st, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`${formatSlotTime(idx)}: ${candName} is ${STATE_LABEL[st]}`}
                onMouseEnter={() => setActiveSlot(idx)}
                onFocus={() => setActiveSlot(idx)}
                onClick={() => setActiveSlot(idx)}
                className={`h-full w-full rounded-[1px] transition-opacity ${STATE_COLOR[st]} ${
                  activeSlot === idx ? 'ring-2 ring-slate-900 dark:ring-white' : 'hover:opacity-85'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Lane 3: Thin Overlap Zone */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
            <span>Overlap Zones</span>
            <span className="text-[11px] font-normal text-slate-400">Sync vs. friction</span>
          </div>
          <div
            className="grid h-3.5 w-full gap-[1px] overflow-hidden rounded-full bg-slate-100 p-[1px] dark:bg-slate-800"
            style={{ gridTemplateColumns: 'repeat(48, minmax(0, 1fr))' }}
          >
            {overlapSlots.map((entry, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`${formatSlotTime(idx)} overlap status: ${entry.effectiveZone}`}
                onMouseEnter={() => setActiveSlot(idx)}
                onFocus={() => setActiveSlot(idx)}
                onClick={() => setActiveSlot(idx)}
                className={`h-full w-full ${OVERLAP_COLOR[entry.effectiveZone]}`}
              />
            ))}
          </div>
        </div>

        {/* 6PM - 12AM - 6AM - 12PM - 6PM Axis */}
        <div className="relative mt-1 flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {AXIS_LABELS.map((item, idx) => (
            <span key={`${item.text}-${idx}`}>{item.text}</span>
          ))}
        </div>
      </div>

      {/* Interactive Tooltip / Inspector Bar */}
      <div className="mt-3 min-h-[38px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
        {inspected ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold">
              {formatSlotTime(inspected.slot)} – {formatSlotTime((inspected.slot + 1) % TOTAL_SLOTS)}
            </span>
            <span>
              {userName}: <strong>{STATE_LABEL[userSchedule.slots[inspected.slot]]}</strong> ·{' '}
              {candName}: <strong>{STATE_LABEL[candidateSchedule.slots[inspected.slot]]}</strong>
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                inspected.effectiveZone === 'red'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : inspected.effectiveZone === 'amber'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : inspected.effectiveZone === 'green'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
              }`}
            >
              {inspected.effectiveZone === 'red'
                ? 'High Friction'
                : inspected.effectiveZone === 'amber'
                ? 'Mild Friction'
                : inspected.effectiveZone === 'green'
                ? 'In Sync'
                : 'Neutral'}
            </span>
          </div>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">
            Tap or hover any slot above to inspect exact half-hour schedule alignment.
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-100 pt-3 text-[11px] font-medium text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-indigo-600 dark:bg-indigo-500" /> Sleep
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-sky-500" /> Class
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-violet-500" /> Study
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-slate-200 dark:bg-slate-700" /> Free
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Sync
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Mild friction
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> High friction
        </span>
      </div>

      {/* Plain-English Conflict Windows List */}
      <div className="mt-4 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Detected Friction Windows
        </h3>
        {conflictWindows.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Zero sleep/study friction windows of 1 hour or more! Your clocks align well.</span>
          </div>
        ) : (
          conflictWindows.map((win, idx) => (
            <div
              key={`${win.startSlot}-${idx}`}
              className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
                win.zone === 'red'
                  ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200'
                  : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
              }`}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{win.sentence}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
