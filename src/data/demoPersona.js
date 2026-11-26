/**
 * One-click sample persona ("Try demo") designed to demonstrate:
 * - High-harmony top match (Ananya Rao, 85%+)
 * - Lopsided asymmetric conflict with Aarav Mehta (60–78%, RED late-night timeline window)
 * - Hard deal-breaker cap with Vikram Joshi (smoking)
 */
export const DEMO_PERSONA = {
  profile: {
    name: 'Riya Verma',
    email: 'riya.verma@campus.edu',
    course: 'B.Tech CSE',
    year: '2nd Year',
    gender: 'female',
    genderPreference: 'any',
  },
  answers: {
    bedtime: 0, // Before 10 PM
    wakeTime: 1, // 6 AM - 8 AM
    lightSleeper: 4, // Wake up but drift back (light sleeper)
    screensAtNight: 0, // Lie in the dark
    studyTime: 0, // Early morning revision
    studyHours: 2, // 4-6 hours
    studyNoise: 0, // Silence only
    studyLocation: 1, // Mix of library and room
    classTiming: 0, // Morning 8 AM - 1 PM
    tidiness: 4, // Stack aside, clean after studying (tidy)
    cleaningFrequency: 0, // Daily same-day cleaning
    dishesLaundry: 0, // Wash immediately
    messTolerance: 2, // Would mention politely
    guests: 1, // Occasionally with a heads-up (rarely)
    socialEnergy: 2, // Coffee with 1-2 close friends
    smoking: 'none', // Non-smoker
    temperature: 1, // Moderate 23-25C
  },
  importance: {
    sleep: 4,
    cleanliness: 4,
    study: 3,
    social: 2,
  },
  dealBreakers: ['smoking'],
};
