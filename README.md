# Roommate Finder

> **"Other apps give you a compatibility percentage and hope for the best. Ours shows you the exact hour of the day you'll fight, and generates a customized agreement to prevent it before you move in."**

Roommate Finder is a client-side React web app built for college students choosing hostel or PG roommates. Instead of vague 1–5 sliders and symmetric averages, it pairs a scenario-based lifestyle quiz with an **asymmetric compatibility engine**, a **24-hour conflict timeline**, a **live compromise simulator**, and a **one-click Roommate Agreement generator**.

---

## Setup & Run Commands

Requires Node.js 20+ and npm.

```bash
# Install dependencies
npm install

# Start the local development server
npm run dev

# Run the Vitest unit test suite (25 tests across 5 files)
npm test

# Build the production bundle into dist/
npm run build
```

---

## Key Features

- **Scenario-Driven Quiz (`src/data/questions.js`)**: 17 relatable hostel/PG scenarios across Sleep, Study, Cleanliness, and Social/Lifestyle. Numeric values are never exposed in the UI; every option is a tappable card with autosave.
- **Asymmetric Two-Way Compatibility Engine (`src/utils/compatibility.js`)**: Computes **your comfort with them** AND **their comfort with you** independently, then combines them with the **harmonic mean** and flags lopsided pairings (`>= 20` point gap).
- **24-Hour Conflict Timeline (`src/utils/timeline.js`)**: Maps both students across 48 half-hour slots (`6 PM → 6 PM`) and highlights exact sync hours (green) and late-night/study friction windows (amber/red) in plain English.
- **Live Compromise Simulator (`src/utils/simulate.js`)**: Auto-detects the top 3 compromisable habits (excluding smoking), supports **Me / Them / Both**, animates before-and-after scores and friction hours live without mutating saved answers, and carries active commitments into the agreement.
- **Roommate Agreement Generator (`src/utils/agreement.js`)**: Builds a printable House Rules sheet strictly from real friction points, citing the exact answers or timeline windows (`Because:`), with rule toggles, custom rule input, editable names, signature lines, **Print / Save as PDF**, **Download `.txt`**, and **Copy text**.
- **Shortlist, Filters, Dark Mode & Local Persistence (`src/utils/storage.js`)**: Saved under `roommateFinder:v1` in `localStorage` with safe JSON recovery and in-memory fallback.

---

## Questionnaire Design

The quiz UI, scoring engine, comparison table, and compromise simulator are 100% driven by `src/data/questions.js`. Adding a question requires zero UI edits.

- **Sleep (4)**: `bedtime` (ordinal, directional), `wakeTime` (ordinal, directional), `lightSleeper` (scale modifier), `screensAtNight` (ordinal, directional).
- **Study (5)**: `studyTime` (4-slot circular distance so after-midnight and early-morning are adjacent), `studyHours` (ordinal, symmetric), `studyNoise` (ordinal, directional), `studyLocation` (ordinal, symmetric, weight `0.5`), `classTiming` (ordinal, symmetric, weight `0.5`).
- **Cleanliness (4)**: `tidiness` (scale, directional), `cleaningFrequency` (ordinal, directional), `dishesLaundry` (ordinal, directional), `messTolerance` (scale modifier).
- **Social & Lifestyle (4)**: `guests` (ordinal, directional), `socialEnergy` (scale, symmetric), `smoking` (explicit 3×3 directional matrix, non-compromisable), `temperature` (ordinal, symmetric).

---

## Scoring Explained (Plain English for Judges)

1. **Why Asymmetric Scoring?**
   Suppose a messy night owl pairs with a tidy light sleeper. The messy student is delighted to live with someone clean and quiet (`~90%` comfort), while the tidy student is stressed every night (`~25%` comfort). A symmetric average (`|a - b|`) hides who pays the price.
2. **Directional Comfort & Sensitivity Multipliers**
   - On directional questions, if the other person is *better* or *equal* along the friction axis, the viewer only gets a tiny leniency deduction (`1 - 0.1|d|`).
   - If the other person is *worse* (`d > 0`), the penalty scales with the viewer's own sensitivity (`lightSleeper` for sleep questions: `0.6×` to `1.5×`; `messTolerance` for cleanliness questions: `1.5×` to `0.6×`).
3. **Why the Harmonic Mean?**
   Each person's overall comfort is weighted by **their own** category importance sliders (default: Sleep 4, Cleanliness 4, Study 3, Social 2). We combine `yourComfort` and `theirComfort` using:
   $$\text{Overall} = \frac{2 \cdot C_{\text{you}} \cdot C_{\text{them}}}{C_{\text{you}} + C_{\text{them}}}$$
   Unlike an arithmetic average, the harmonic mean pulls the score down toward the **less comfortable** roommate, because a room is only as peaceful as its most stressed occupant.
4. **Hard Deal-Breakers**
   Clashes on smoking (`none` vs `yes`), overnight guests (`never` vs `often`), or AC temperature (`18–22°C` vs `26°C+`) always show a warning badge. If either person marked that topic as a hard deal-breaker, the overall score is capped at **60%**.

---

## 24-Hour Timeline Rules

- Each person gets 48 half-hour slots (`6:00 PM` to `6:00 PM`) with precedence `sleep > class > study > free`.
- Study blocks are clipped by sleep and overridden by class windows.
- **Green (Sync)**: Both sleeping or both in class.
- **Red (High Friction)**: One sleeps while the other studies in the room (`studyLocation !== outside`) with lights on or speaker audio, AND either the sleeper has `lightSleeper >= 3` or the other uses bright screens/lights often.
- **Amber (Mild Friction)**: Same disturbance with lower sensitivity, or one sleeps while the other is awake with bright screens/lights often.
- Windows shorter than 1 hour are filtered out so minor 30-minute transitions don't create noise.

---

## Assumptions Made

- **Workspace Layout**: Scaffolded directly at the repository root (`/`) so `npm run dev`, `npm test`, and `npm run build` run immediately in VS Code.
- **Client-Only Pool**: The matching pool consists of 12 curated, realistic seed student profiles (`src/data/seedProfiles.js`) evaluated deterministically in the browser.
- **Mutual Gender Preference**: `"Same gender only"` checks exact equality between both students' selected `gender` values when either student chooses `"same"`.
- **Single-Step Compromises**: The Compromise Simulator tests realistic 1-step adjustments per question (never touching `smoking`) so projected improvements stay believable.
- **"Say hi" Action**: Opens a modal with an editable, copyable intro message rather than sending real emails/DMs, since there is no backend.

---

## 2-Minute Hackathon Demo Script

1. **Hook (15s)**: Open `/` and read the pitch line. Click **"Try demo"** to load **Riya Verma** (early sleeper, light sleeper, tidy, non-smoker).
2. **Top Match & Deal-Breaker Contrast (25s)**: Point out **Ananya Rao** at `#1` (`85%+`, `0h/day friction`), and scroll briefly to show **Vikram Joshi** capped at `<= 60%` with a Smoking Deal-Breaker badge.
3. **Asymmetry + Timeline on Aarav (35s)**: Open **Aarav Mehta** (`Compare`). Show the **Lopsided** badge (`yourComfort` 20+ points lower than `theirComfort`), the overlaid asymmetric shapes on the **Radar Chart**, and the **24-Hour Conflict Timeline** highlighting the exact red late-night window (`10:00 PM – 1:00 AM`).
4. **Live Compromise Simulator (25s)**: Toggle suggestions in **"What if I compromise?"** (try switching between **Me**, **Aarav**, and **Both**) to watch the match score climb and friction hours drop live.
5. **1-Click Roommate Agreement (20s)**: Click **"Generate Roommate Agreement"** — show that every House Rule quotes the real clash/timeline window and includes the simulated commitments, ready to **Print / Save as PDF** or **Download `.txt`**.

---

## Future Ideas

- Real backend (PostgreSQL + campus `.edu` SSO authentication) so students match with verified batchmates.
- End-to-end encrypted in-app chat and shared room-booking checklist.
- Timetable / Google Calendar `.ics` import for exact lecture & lab blocks on the 24-hour timeline.
- Feedback-trained ML re-ranking after semester-end roommate satisfaction check-ins.
