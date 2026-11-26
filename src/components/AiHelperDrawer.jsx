import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bot, Check, Copy, Send, Sparkles, X } from 'lucide-react';
import { SEED_PROFILES } from '../data/seedProfiles.js';
import { useApp } from '../context/AppContext.jsx';
import { getSuggestedPrompts, runAiHelperTurn } from '../utils/aiHelper.js';

function renderFormattedText(text) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
        {parts.map((part, idx) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={idx} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </p>
    );
  });
}

export default function AiHelperDrawer() {
  const {
    state,
    currentUser,
    answeredCount,
    matches,
    aiDrawer,
    openAiHelper,
    closeAiHelper,
    loadDemoPersona,
    setImportance,
    setDealBreakerActive,
    toggleShortlist,
    showToast,
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm your **Roommate AI Helper**. Ask me to navigate the app, audit or tweak your lifestyle preferences, explain a match's timeline conflicts, or draft your roommate request email & agreement.",
      actions: [],
    },
  ]);

  const scrollRef = useRef(null);

  const routeCandidateId = location.pathname.startsWith('/compare/')
    ? location.pathname.replace('/compare/', '').split('/')[0]
    : aiDrawer.candidateId;
  const activeCandidate = routeCandidateId
    ? SEED_PROFILES.find((p) => p.id === routeCandidateId)
    : null;

  const suggestedPrompts = getSuggestedPrompts({
    route: location.pathname,
    activeCandidateName: activeCandidate?.name,
    hasAnswers: answeredCount > 0,
  });

  const handleSendText = (rawText) => {
    const text = rawText.trim();
    if (!text) return;

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text };
    const result = runAiHelperTurn({
      message: text,
      route: location.pathname,
      currentUser,
      answeredCount,
      matches,
      shortlist: state.shortlist,
      activeCandidateId: routeCandidateId,
    });

    const botMsg = {
      id: `a-${Date.now() + 1}`,
      role: 'assistant',
      text: result.reply,
      actions: result.actions || [],
      draft: result.draft || null,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
  };

  // Auto-run prompt if triggered externally (e.g. "Ask AI Helper" from EmailRequestModal)
  useEffect(() => {
    if (aiDrawer.isOpen && aiDrawer.prompt) {
      handleSendText(aiDrawer.prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiDrawer.isOpen, aiDrawer.prompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, aiDrawer.isOpen]);

  const executeAction = (action) => {
    switch (action.type) {
      case 'navigate':
        navigate(action.to);
        break;
      case 'loadDemo':
        loadDemoPersona();
        navigate('/results');
        break;
      case 'setImportance':
        setImportance(action.categoryId, action.value);
        showToast(`Updated ${action.categoryId} priority to ${action.value}/5`);
        break;
      case 'setDealBreaker':
        setDealBreakerActive(action.id, action.active);
        showToast(`${action.active ? 'Enabled' : 'Disabled'} ${action.id} deal-breaker`);
        break;
      case 'shortlist':
        if (!state.shortlist.includes(action.candidateId)) {
          toggleShortlist(action.candidateId);
        }
        break;
      default:
        break;
    }
  };

  const handleCopyDraft = async (draft) => {
    const full = draft.subject ? `Subject: ${draft.subject}\n\n${draft.body}` : draft.body;
    try {
      await navigator.clipboard.writeText(full);
      showToast('AI draft copied to clipboard');
    } catch {
      showToast('Select the draft text to copy');
    }
  };

  return (
    <div className="no-print">
      {/* Floating Launcher Button */}
      {!aiDrawer.isOpen && (
        <button
          type="button"
          onClick={() => openAiHelper('', routeCandidateId)}
          aria-label="Open AI Helper Agent"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>AI Helper</span>
        </button>
      )}

      {/* Slide-up Assistant Panel */}
      {aiDrawer.isOpen && (
        <aside
          aria-label="Roommate AI Helper Agent"
          className="fixed bottom-4 right-4 z-50 flex h-[540px] max-h-[82vh] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-indigo-600 px-4 py-3 text-white dark:border-slate-800 dark:bg-indigo-600">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold leading-tight">Roommate AI Helper</h2>
                <p className="text-[11px] text-indigo-100">
                  Navigation · Preferences · Email &amp; Agreement drafts
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeAiHelper}
              aria-label="Close AI Helper"
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                      : 'border border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-100'
                  }`}
                >
                  {renderFormattedText(msg.text)}
                </div>

                {/* Draft Preview Card */}
                {msg.draft && (
                  <div className="mt-2 w-full rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-800 dark:bg-indigo-950/40">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                        {msg.draft.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyDraft(msg.draft)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-indigo-700 shadow-xs hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300"
                      >
                        <Copy className="h-3 w-3" aria-hidden="true" />
                        Copy draft
                      </button>
                    </div>
                    {msg.draft.subject && (
                      <p className="mb-1 text-[11px] font-bold text-slate-800 dark:text-slate-100">
                        Subject: {msg.draft.subject}
                      </p>
                    )}
                    <pre className="max-h-36 overflow-y-auto whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-slate-700 dark:text-slate-200">
                      {msg.draft.body}
                    </pre>
                  </div>
                )}

                {/* Action Pills */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.actions.map((act, idx) => (
                      <button
                        key={`${msg.id}-act-${idx}`}
                        type="button"
                        onClick={() => executeAction(act)}
                        className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
                      >
                        <Check className="h-3 w-3" aria-hidden="true" />
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendText(prompt)}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendText(input);
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <label htmlFor="ai-helper-input" className="sr-only">
              Ask Roommate AI Helper
            </label>
            <input
              id="ai-helper-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask to navigate, refine priorities, or draft an email..."
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              aria-label="Send message to AI Helper"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </form>
        </aside>
      )}
    </div>
  );
}
