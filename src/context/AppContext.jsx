import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { QUESTIONS } from '../data/questions.js';
import { SEED_PROFILES } from '../data/seedProfiles.js';
import { DEMO_PERSONA } from '../data/demoPersona.js';
import { rankMatches } from '../utils/compatibility.js';
import { clearState, getDefaultState, loadState, saveState } from '../utils/storage.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(() => loadState());
  const [toast, setToast] = useState(null);
  const [aiDrawer, setAiDrawer] = useState({ isOpen: false, prompt: '', candidateId: null });

  // Persist every state change to localStorage (with safe fallback)
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Sync Tailwind dark mode class on <html>
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', state.theme === 'dark');
    }
  }, [state.theme]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((prev) => (prev && prev.id === id ? null : prev));
    }, 3000);
  }, []);

  const updateProfile = useCallback((patch) => {
    setState((prev) => ({
      ...prev,
      isDemo: false,
      profile: { ...prev.profile, ...patch },
    }));
  }, []);

  const setAnswer = useCallback((questionId, value) => {
    setState((prev) => ({
      ...prev,
      isDemo: false,
      answers: { ...prev.answers, [questionId]: value },
    }));
  }, []);

  const setImportance = useCallback((categoryId, value) => {
    setState((prev) => ({
      ...prev,
      isDemo: false,
      importance: { ...prev.importance, [categoryId]: Number(value) },
    }));
  }, []);

  const toggleDealBreaker = useCallback((id) => {
    setState((prev) => {
      const exists = prev.dealBreakers.includes(id);
      const next = exists
        ? prev.dealBreakers.filter((item) => item !== id)
        : [...prev.dealBreakers, id];
      return {
        ...prev,
        isDemo: false,
        dealBreakers: next,
      };
    });
  }, []);

  const setDealBreakerActive = useCallback((id, active) => {
    setState((prev) => {
      const exists = prev.dealBreakers.includes(id);
      if (active && exists) return prev;
      if (!active && !exists) return prev;
      const next = active
        ? [...prev.dealBreakers, id]
        : prev.dealBreakers.filter((item) => item !== id);
      return {
        ...prev,
        isDemo: false,
        dealBreakers: next,
      };
    });
  }, []);

  const toggleShortlist = useCallback(
    (candidateId) => {
      setState((prev) => {
        const exists = prev.shortlist.includes(candidateId);
        const next = exists
          ? prev.shortlist.filter((id) => id !== candidateId)
          : [...prev.shortlist, candidateId];
        showToast(exists ? 'Removed from shortlist' : 'Added to shortlist');
        return { ...prev, shortlist: next };
      });
    },
    [showToast]
  );

  const saveSentRequest = useCallback(
    (requestObj) => {
      setState((prev) => {
        const existingIdx = (prev.sentRequests || []).findIndex((r) => r.id === requestObj.id);
        const nextRequests = [...(prev.sentRequests || [])];
        if (existingIdx >= 0) {
          nextRequests[existingIdx] = requestObj;
        } else {
          nextRequests.unshift(requestObj);
        }
        return {
          ...prev,
          sentRequests: nextRequests,
        };
      });
      showToast(`Roommate request saved for ${requestObj.candidateName}`);
    },
    [showToast]
  );

  const updateSentRequest = useCallback((requestId, patch) => {
    setState((prev) => {
      const next = (prev.sentRequests || []).map((r) =>
        r.id === requestId ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
      );
      return { ...prev, sentRequests: next };
    });
  }, []);

  const loadDemoPersona = useCallback(() => {
    setState((prev) => ({
      ...prev,
      profile: { ...DEMO_PERSONA.profile },
      answers: { ...DEMO_PERSONA.answers },
      importance: { ...DEMO_PERSONA.importance },
      dealBreakers: [...DEMO_PERSONA.dealBreakers],
      shortlist: [],
      sentRequests: [],
      isDemo: true,
    }));
    showToast('Loaded demo persona (Riya Verma)');
  }, [showToast]);

  const resetAllData = useCallback(() => {
    clearState();
    setState((prev) => ({
      ...getDefaultState(),
      theme: prev.theme,
    }));
    showToast('All local data cleared');
  }, [showToast]);

  const resetQuizOnly = useCallback(() => {
    setState((prev) => ({
      ...prev,
      answers: {},
      isDemo: false,
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const openAiHelper = useCallback((prompt = '', candidateId = null) => {
    setAiDrawer({ isOpen: true, prompt, candidateId });
  }, []);

  const closeAiHelper = useCallback(() => {
    setAiDrawer((prev) => ({ ...prev, isOpen: false, prompt: '' }));
  }, []);

  const currentUser = useMemo(
    () => ({
      id: 'current-user',
      name: state.profile.name || 'You',
      email: state.profile.email || '',
      course: state.profile.course || 'Student',
      year: state.profile.year || '',
      gender: state.profile.gender || 'prefer-not',
      genderPreference: state.profile.genderPreference || 'any',
      answers: state.answers,
      importance: state.importance,
      dealBreakers: state.dealBreakers,
    }),
    [state.profile, state.answers, state.importance, state.dealBreakers]
  );

  const answeredCount = useMemo(
    () =>
      QUESTIONS.filter((q) => state.answers[q.id] !== undefined && state.answers[q.id] !== null)
        .length,
    [state.answers]
  );

  const isQuizComplete = answeredCount === QUESTIONS.length;

  const matches = useMemo(() => {
    if (answeredCount === 0) return [];
    return rankMatches(currentUser, SEED_PROFILES);
  }, [currentUser, answeredCount]);

  const value = useMemo(
    () => ({
      state,
      currentUser,
      answeredCount,
      totalQuestions: QUESTIONS.length,
      isQuizComplete,
      matches,
      toast,
      aiDrawer,
      showToast,
      updateProfile,
      setAnswer,
      setImportance,
      toggleDealBreaker,
      setDealBreakerActive,
      toggleShortlist,
      saveSentRequest,
      updateSentRequest,
      loadDemoPersona,
      resetAllData,
      resetQuizOnly,
      toggleTheme,
      openAiHelper,
      closeAiHelper,
    }),
    [
      state,
      currentUser,
      answeredCount,
      isQuizComplete,
      matches,
      toast,
      aiDrawer,
      showToast,
      updateProfile,
      setAnswer,
      setImportance,
      toggleDealBreaker,
      setDealBreakerActive,
      toggleShortlist,
      saveSentRequest,
      updateSentRequest,
      loadDemoPersona,
      resetAllData,
      resetQuizOnly,
      toggleTheme,
      openAiHelper,
      closeAiHelper,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
