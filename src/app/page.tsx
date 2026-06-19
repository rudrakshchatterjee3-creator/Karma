"use client";
import Image from "next/image";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Sun, Moon, LogOut,
  BarChart3,
  Bolt,
  Check,
  Star,
  Clock3,
  Home,
  Leaf,
  Plus,
  RotateCcw,
  Trash2,
  Save,
  Settings2,
  Share2,
  Sparkles,
  Target,
  Train,
  Utensils,
  UserRound,
  WalletCards,
  Wind,
  TrendingUp,
  Zap,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import * as LucideIcons from "lucide-react";
import {
  type Profile,
  type Category,
  type Motivation,
  type Diet,
  type LogEntry,
  type Action,

  defaultProfile,
  calculateMonthlyLeak,
  getStoryCards,
  createActions,
  totalsByCategory,
  formatPoints,
  formatRupees,
  carbon,
  worldCo2TonnesPerYear,
  getCountryEmissions,
} from "@/utils/karmaLogic";

type Tab = "today" | "track" | "insights" | "plan" | "recap" | "profile";



type AppState = {
  onboarded: boolean;
  showLanding: boolean;
  profile: Profile;
  logs: LogEntry[];
  actions: Action[];
};

const storageKey = "karma-product-state-v2";

const initialLogs: LogEntry[] = [
  {
    id: "initial-1",
    category: "energy",
    label: "AC ran overnight, 24°C",
    carbon: 3.2,
    points: -320,
    note: "Cooling represents the largest slice of an urban Indian energy bill.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "initial-2",
    category: "transport",
    label: "Cab to office, peak traffic",
    carbon: 5.1,
    points: -510,
    note: "Idle time in traffic dramatically reduces fuel efficiency.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "initial-3",
    category: "food",
    label: "Two delivery dinners",
    carbon: 2.4,
    points: -240,
    note: "Delivery emissions often exceed the footprint of the food itself.",
    createdAt: new Date().toISOString(),
  },
];

const quickLogs: Record<Category, Omit<LogEntry, "id" | "createdAt">[]> = {
  transport: [
    { category: "transport", label: "Already walking instead of driving", carbon: -4.5, points: 450, note: "Pre-existing healthy habits build the baseline for an efficient footprint." },
    { category: "transport", label: "Metro instead of cab", carbon: -3.1, points: 310, note: "Shared route logged. Less traffic cost, lighter weekly footprint." },
    { category: "transport", label: "Cab commute, 12 km", carbon: 3.2, points: -320, note: "Fast and comfortable, but this is a repeatable leak." },
  ],
  energy: [
    { category: "energy", label: "Already running AC efficiently", carbon: -3.5, points: 350, note: "Efficient baseline habits mean you're already preventing significant waste." },
    { category: "energy", label: "AC at 24°C with fan", carbon: -1.9, points: 190, note: "Same comfort range, lower compressor load." },
    { category: "energy", label: "AC ran extra 2 hours", carbon: 3.8, points: -380, note: "Cooling is useful. Extra hours are where the bill leaks." },
  ],
  food: [
    { category: "food", label: "Already eating plant-based meals", carbon: -3.2, points: 320, note: "Low-impact diets avoid high upstream emissions from agriculture." },
    { category: "food", label: "Home dinner instead of delivery", carbon: -1.7, points: 170, note: "The saving is mostly packaging, delivery, and impulse add-ons." },
    { category: "food", label: "Food waste: half a meal", carbon: 1.1, points: -110, note: "Waste hurts twice: once while buying, once while throwing." },
  ],
  shopping: [
    { category: "shopping", label: "Already buying second-hand", carbon: -5.0, points: 500, note: "Reusing items stops new production emissions entirely." },
    { category: "shopping", label: "Delayed an impulse order", carbon: -2.2, points: 220, note: "A 24-hour pause saved the cleanest kind of points: money not spent." },
    { category: "shopping", label: "Single-item delivery", carbon: 1.4, points: -140, note: "Packaging and delivery make small orders heavier than they look." },
  ],
  waste: [
    { category: "waste", label: "Already composting organics", carbon: -1.5, points: 150, note: "Keeping food out of landfills reduces potent methane emissions." },
    { category: "waste", label: "Separated dry waste", carbon: -0.7, points: 70, note: "A cleaner bin makes recycling possible downstream." },
    { category: "waste", label: "Used reusable bottle", carbon: -0.4, points: 40, note: "Small plastic avoided, small spend avoided." },
  ],
};

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "today", label: "Home", icon: Home },
  { id: "track", label: "Log", icon: Plus },
  { id: "insights", label: "Insights", icon: Sparkles },
  { id: "plan", label: "Plan", icon: Target },
  { id: "recap", label: "Recap", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: Settings2 },
];

const categoryMeta: Record<Category, { label: string; icon: LucideIcon; accent: string }> = {
  transport: { label: "Transport", icon: Train, accent: "text-sky-300" },
  energy: { label: "Energy", icon: Bolt, accent: "text-amber-300" },
  food: { label: "Food", icon: Utensils, accent: "text-coral" },
  shopping: { label: "Shopping", icon: WalletCards, accent: "text-violet-300" },
  waste: { label: "Waste", icon: Trash2, accent: "text-sage" },
};

function getInitialState(): AppState {
  return {
    onboarded: false,
    showLanding: true,
    profile: defaultProfile,
    logs: initialLogs,
    actions: createActions(defaultProfile, initialLogs).map((action, index) => ({
      ...action,
      status: index === 0 ? "active" : "suggested",
    })),
  };
}

export default function KarmaApp() {
  const { data: session, status } = useSession();
  const [state, setState] = useState<AppState>(getInitialState);
  const [tab, setTab] = useState<Tab>("today");
  const [storyStep, setStoryStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Category>("energy");
  const [hydrated, setHydrated] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // 1. Initial Local Hydration
  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    queueMicrotask(() => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AppState;
          setState({ 
            ...getInitialState(), 
            ...parsed, 
            showLanding: parsed.onboarded ? false : (parsed.showLanding ?? true) 
          });
          setIsLightMode(parsed.profile?.themePreference === "light");
          setShowSetup(false);
        } catch {
          setState(getInitialState());
        }
      }
      setHydrated(true);
    });
  }, []);

  // 2. Cloud Hydration
  useEffect(() => {
    if (!hydrated || status === "loading" || cloudSynced) return;
    
    if (session?.user) {
      // Fetch from Cloud KV
      fetch("/api/sync")
        .then(res => res.json())
        .then(data => {
          if (data && data.profile) {
            // Found cloud data, override local
            setState({ 
              ...getInitialState(), 
              ...data, 
              showLanding: data.onboarded ? false : (data.showLanding ?? true) 
            });
            setIsLightMode(data.profile.themePreference === "light");
            setShowSetup(false);
          }
        })
        .catch(() => toast.error("Background sync failed"))
        .finally(() => setCloudSynced(true));
    } else if (status === "unauthenticated") {
      setTimeout(() => setCloudSynced(true), 0);
    }
  }, [session, hydrated, status, cloudSynced]);

  // 3. Save to Local & Cloud
  useEffect(() => {
    if (hydrated) {
      // Local Save
      window.localStorage.setItem(storageKey, JSON.stringify(state));
      
      // Cloud Save (debounced simply by react effect batching, but we can do it directly for now since state changes are relatively rare)
      if (session?.user && cloudSynced && state.onboarded) {
        // We only save to cloud if we've successfully pulled the latest (cloudSynced) and user is logged in
        fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
        }).catch(() => toast.error("Background sync failed"));
      }
    }
  }, [hydrated, state, session, cloudSynced]);

  const [coachReport, setCoachReport] = useState<{
    headline: string;
    summary: string;
    actions: Action[];
    sourceEngine: "nvidia_nim" | "physics_engine";
  } | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);

  useEffect(() => {
    if (!state.onboarded || (tab !== "insights" && tab !== "plan")) return;

    let active = true;
    async function fetchCoachReport() {
      setCoachLoading(true);
      try {
        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: state.profile, logs: state.logs }),
        });
        if (!res.ok) throw new Error("Coach API failed");
        const data = await res.json() as {
          headline: string;
          summary: string;
          actions: Record<string, unknown>[];
          sourceEngine: "nvidia_nim" | "physics_engine";
        };
        if (!active) return;
        
        const actionsMapped: Action[] = data.actions.map((rawAction, index) => {
          const action = rawAction as unknown as Action;
          const previous = state.actions.find((item) => item.id === action.id);
          return {
            id: action.id,
            category: action.category,
            title: action.title,
            why: action.why,
            step: action.step,
            effort: action.effort,
            carbon: action.carbon,
            points: action.points,
            status: previous?.status ?? (index === 0 ? "active" : "suggested"),
            score: 100,
          };
        });

        setCoachReport({
          headline: data.headline,
          summary: data.summary,
          actions: actionsMapped,
          sourceEngine: data.sourceEngine,
        });
      } catch {
        toast.error("Failed to load AI Coach");
      } finally {
        if (active) setCoachLoading(false);
      }
    }

    fetchCoachReport();
    return () => {
      active = false;
    };
  }, [tab, state.logs, state.onboarded, state.actions, state.profile]);

  const renderedActions = useMemo(() => {
    if (coachReport) {
      return coachReport.actions.map((action) => {
        const currentActionState = state.actions.find((a) => a.id === action.id);
        return {
          ...action,
          status: currentActionState?.status ?? action.status,
        };
      });
    }
    return state.actions;
  }, [coachReport, state.actions]);

  const totalCarbon = useMemo(() => state.logs.reduce((sum, log) => sum + log.carbon, 0), [state.logs]);
  const totalPoints = useMemo(() => state.logs.reduce((sum, log) => sum + log.points, 0), [state.logs]);
  const avoidedCarbon = useMemo(() => Math.abs(state.logs.filter((log) => log.carbon < 0).reduce((sum, log) => sum + log.carbon, 0)), [state.logs]);
  const earnedPoints = useMemo(() => state.logs.filter((log) => log.points > 0).reduce((sum, log) => sum + log.points, 0), [state.logs]);
  const activeAction = renderedActions.find((action) => action.status === "active") ?? renderedActions.find((a) => a.status === "suggested");
  const storyCards = useMemo(() => getStoryCards(state.profile), [state.profile]);

  useEffect(() => {
    if (state.onboarded || showSetup || state.showLanding) return;
    const timer = setInterval(() => {
      setStoryStep((prev) => (prev < storyCards.length - 1 ? prev + 1 : prev));
    }, 6000);
    return () => clearInterval(timer);
  }, [state.onboarded, showSetup, state.showLanding, storyCards.length]);

  const biggestLeak = useMemo((): [Category, number] => {
    const totals = totalsByCategory(state.logs, "points");
    const sorted = (Object.entries(totals) as [Category, number][]).sort((a, b) => b[1] - a[1]);
    return sorted[0] ?? ["energy", 0];
  }, [state.logs]);

  function updateProfile(patch: Partial<Profile>) {
    setState((current) => {
      const profile = { ...current.profile, ...patch };
      const fresh = createActions(profile, current.logs);
      const actions = fresh.map((action, index) => {
        const previous = current.actions.find((item) => item.id === action.id);
        return { ...action, status: previous?.status ?? (index === 0 ? "active" : "suggested") };
      });
      return { ...current, profile, actions };
    });
  }

  function finishSetup(profile: Profile) {
    setState((current) => {
      const fresh = createActions(profile, current.logs);
      return {
        ...current,
        profile,
        actions: fresh.map((action, index) => {
          const previous = current.actions.find((item) => item.id === action.id);
          return { ...action, status: previous?.status ?? (index === 0 ? "active" : "suggested") };
        }),
        onboarded: true,
        showLanding: false,
      };
    });
    setIsLightMode(profile.themePreference === "light");
    setShowSetup(false);
  }

  function toggleTheme() {
    setIsLightMode((value) => {
      const next = !value;
      updateProfile({ themePreference: next ? "light" : "dark" });
      return next;
    });
  }

  function finishOnboarding() {
    setState((current) => ({ ...current, onboarded: true, showLanding: false }));
    setTab("track");
  }

  function addLog(template: Omit<LogEntry, "id" | "createdAt">) {
    const entry: LogEntry = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setState((current) => {
      const logs = [entry, ...current.logs].slice(0, 20);
      const generated = createActions(current.profile, logs);
      const actions = generated.map((action, index) => {
        const previous = current.actions.find((item) => item.id === action.id);
        return { ...action, status: previous?.status ?? (index === 0 ? "active" : "suggested") };
      });
      return { ...current, logs, actions };
    });
    setTab("today");
    toast.success("Action logged successfully!");
  }

  function setActionStatus(id: string, status: Action["status"]) {
    setState((current) => {
      let found = false;
      const nextActions = current.actions.map((action) => {
        if (action.id === id) {
          found = true;
          return { ...action, status };
        }
        return action;
      });
      
      if (!found && coachReport) {
        const aiAction = coachReport.actions.find((a) => (a as Action).id === id);
        if (aiAction) {
          nextActions.push({ ...(aiAction as Action), status });
        }
      }
      
      return { ...current, actions: nextActions };
    });

    setCoachReport((current) => {
      if (!current) return current;
      return {
        ...current,
        actions: current.actions.map((action) => ((action as Action).id === id ? { ...(action as Action), status } : (action as Action))),
      };
    });
  }

  async function resetData() {
    if (!window.confirm("Reset all data? This clears your footprint, logs, and profile.")) return;
    
    try {
      await fetch("/api/sync", { method: "DELETE" });
    } catch {
      toast.error("Failed to delete KV data");
    }
    
    window.localStorage.removeItem(storageKey);
    setState(getInitialState());
    setTab("today");
    setStoryStep(0);
    setShowSetup(false);
    setIsLightMode(false);
  }

  // ── LANDING PAGE ───────────────────────────────────────────
  if (state.showLanding) {
    return (
      <main className="min-h-[100dvh] overflow-hidden bg-background text-foreground">
        <div className={`app-shell ${isLightMode ? "theme-light" : ""}`}>
          <LandingPage
            onStart={() => setState((s) => ({ ...s, showLanding: false }))}
            toggleTheme={toggleTheme}
            isLightMode={isLightMode}
          />
        </div>
      </main>
    );
  }

  // ── STORY / SETUP ──────────────────────────────────────────
  if (!state.onboarded) {
    const story = storyCards[storyStep] ?? storyCards[0];
    const StoryIcon = (LucideIcons[story.iconName as keyof typeof LucideIcons] || LucideIcons.Sparkles) as React.ElementType;

    return (
      <main className="min-h-[100dvh] overflow-hidden bg-background text-foreground relative">
        <div className={`app-shell ${isLightMode ? "theme-light" : ""}`}>
        <ThemeToggle isLightMode={isLightMode} toggleTheme={toggleTheme} />
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8 relative">
          <Header compact profile={state.profile} onLogoClick={() => setState((s) => ({ ...s, showLanding: true }))} />
          
          <section className="flex flex-1 flex-col items-center justify-center py-12">
            <div className="w-full max-w-2xl space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60">
                <Leaf size={14} className="text-sage" />
                <span>Impact Intelligence</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.header
                  key={`header-${storyStep}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="text-center sm:text-left min-w-0"
                >
                  <p className="mb-2 text-sm font-medium uppercase tracking-[0.22em] text-sage">{story.eyebrow}</p>
                  <h1 className="text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">{story.title}</h1>
                </motion.header>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {story.isWhyCard ? (
                  <motion.div
                    key="why-card"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                    className="story-panel overflow-hidden flex flex-col justify-center items-center text-center relative p-8 h-[400px] sm:h-[450px] theme-dark-panel"
                  >
                    <div className="absolute inset-0 bg-[#0a0e12]">
                      <Image src={story.image} className="absolute inset-0 h-full w-full object-cover opacity-50" alt="Why Karma" fill unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e12] via-[#0a0e12]/80 to-transparent" />
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-6 mt-4">
                      <h1 className="text-8xl sm:text-9xl font-black text-white tracking-tighter drop-shadow-2xl">WHY</h1>
                      <p className="text-lg sm:text-xl text-white/90 font-medium leading-relaxed max-w-lg drop-shadow-md">
                        {story.insight}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`card-${storyStep}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                    className="story-panel overflow-hidden flex flex-col"
                  >
                    <div className="relative h-64 sm:h-[340px] w-full shrink-0">
                      <Image src={story.image} alt={story.title} className="absolute inset-0 h-full w-full object-cover" fill unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e12] via-[#0a0e12]/40 to-transparent" />
                      
                      <div className="absolute inset-x-6 bottom-6 flex items-end justify-between theme-dark-panel">
                        <div className="min-w-0">
                          <p className="text-sm font-medium uppercase tracking-[0.16em] text-white/50 drop-shadow-md">Story {storyStep + 1} of {storyCards.length}</p>
                          <h2 className="mt-1 text-3xl font-semibold text-white drop-shadow-md truncate">{story.metric}</h2>
                          <p className="mt-1 text-sm text-white/70 drop-shadow-md truncate">{story.metricLabel}</p>
                        </div>
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-black/40 text-white backdrop-blur-md">
                          <StoryIcon className={story.accent} size={24} />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 sm:p-8 min-w-0">
                      <p className="text-lg leading-relaxed opacity-90">{story.insight}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid max-w-2xl gap-3 sm:grid-cols-6 grid-cols-3">
                {storyCards.map((item, index) => {
                  const Icon = (LucideIcons[item.iconName as keyof typeof LucideIcons] || LucideIcons.Sparkles) as React.ElementType;
                  return (
                    <button
                      key={item.eyebrow}
                      onClick={() => setStoryStep(index)}
                      className={`rounded-2xl border p-3 text-left transition ${storyStep === index ? "border-sage/50 bg-sage/10" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"}`}
                    >
                      <Icon className={item.accent} size={17} />
                      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                        {storyStep === index ? (
                          <motion.div
                            key={`progress-${index}`}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 6, ease: "linear" }}
                            className="h-full bg-sage"
                          />
                        ) : (
                          <div className="h-full bg-sage" style={{ width: storyStep > index ? "100%" : "0%" }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                {storyStep < storyCards.length - 1 ? (
                  <button className="primary-button text-lg px-8 py-3" onClick={() => setStoryStep((step) => Math.min(storyCards.length - 1, step + 1))}>
                    Continue <ArrowRight size={20} />
                  </button>
                ) : (
                  <button className="primary-button text-lg px-8 py-3" onClick={() => setShowSetup(true)}>
                    Build my footprint <ArrowRight size={20} />
                  </button>
                )}
                <button className="secondary-button" onClick={() => setShowSetup(true)}>
                  Skip story
                </button>
              </div>

            </div>
          </section>
          
          <AnimatePresence>
            {showSetup && (
              <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0b0f14]/90 p-4 backdrop-blur-md">
                <SetupOverlay
                  profile={state.profile}
                  onFinish={finishSetup}
                  onSkip={() => { setShowSetup(false); finishOnboarding(); }}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </main>
    );
  }

  // ── MAIN APP ───────────────────────────────────────────────
  return (
    <main className="min-h-[100dvh] bg-background text-foreground relative">
      <div className={`app-shell ${isLightMode ? "theme-light" : ""}`}>
      <ThemeToggle isLightMode={isLightMode} toggleTheme={toggleTheme} />
      <div className="mx-auto grid min-h-[100dvh] w-full max-w-7xl grid-rows-[auto_1fr_auto] px-4 py-5 sm:px-6 lg:grid-cols-[230px_1fr] lg:grid-rows-[auto_1fr] lg:gap-6 lg:px-8 relative">
        <aside className="hidden lg:block">
          <div className="sticky top-5 space-y-5">
            <Header compact={false} profile={state.profile} onLogoClick={() => setState((s) => ({ ...s, showLanding: true }))} />
            <nav className="panel p-2">
              {tabs.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`nav-item ${tab === item.id ? "nav-item-active" : ""}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <button className="secondary-button w-full justify-center" onClick={resetData}>
              <RotateCcw size={16} /> Reset data
            </button>
          </div>
        </aside>

        <div className="lg:hidden">
          <Header compact profile={state.profile} onLogoClick={() => setState((s) => ({ ...s, showLanding: true }))} />
        </div>

        <section className="min-w-0 pb-28 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              {tab === "today" && (
                <TodayView
                  profile={state.profile}
                  totalCarbon={totalCarbon}
                  totalPoints={totalPoints}
                  avoidedCarbon={avoidedCarbon}
                  earnedPoints={earnedPoints}
                  biggestLeak={biggestLeak}
                  activeAction={activeAction}
                  logs={state.logs}
                  goTrack={() => setTab("track")}
                  completeAction={(id) => setActionStatus(id, "done")}
                />
              )}
              {tab === "track" && (
                <TrackView
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  addLog={addLog}
                />
              )}
              {tab === "insights" && (
                <InsightsView
                  profile={state.profile}
                  logs={state.logs}
                  actions={renderedActions}
                  coachReport={coachReport}
                  coachLoading={coachLoading}
                />
              )}
              {tab === "plan" && (
                <PlanView
                  actions={renderedActions}
                  setActionStatus={setActionStatus}
                  coachLoading={coachLoading}
                />
              )}
              {tab === "recap" && (
                <RecapView
                  profile={state.profile}
                  logs={state.logs}
                  avoidedCarbon={avoidedCarbon}
                  earnedPoints={earnedPoints}
                  doneCount={state.actions.filter((action) => action.status === "done").length}
                />
              )}
              {tab === "profile" && <ProfileView profile={state.profile} updateProfile={updateProfile} resetData={resetData} applyTheme={(theme) => setIsLightMode(theme === "light")} />}
            </motion.div>
          </AnimatePresence>
        </section>

        <nav className="mobile-nav fixed inset-x-3 bottom-3 z-50 flex overflow-x-auto no-scrollbar rounded-[28px] border border-white/10 bg-[#0b0f14]/90 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl lg:hidden">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex flex-1 min-w-[4rem] shrink-0 h-12 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] text-white/45 transition ${tab === item.id ? "bg-white/10 text-white" : ""}`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// LANDING PAGE — VC-ready cinematic first impression
// ─────────────────────────────────────────────────────────────
function LandingPage({ onStart, toggleTheme, isLightMode }: { onStart: () => void; toggleTheme: () => void; isLightMode: boolean }) {
  const { data: session } = useSession();
  const [globalTonnes, setGlobalTonnes] = useState(0);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    const perSecond = 41600000000 / (365 * 24 * 60 * 60); // approx global emissions
    const timer = setInterval(() => {
      setGlobalTonnes(((Date.now() - startTime) / 1000) * perSecond);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  const stats = [
    { value: "41.6 Gt", label: "Global CO2 emitted per year" },
    { value: "2.8 Gt", label: "India's annual CO2 emissions" },
    { value: "₹1,500+", label: "Monthly leak in average household" },
    { value: "<1 min", label: "Time to log daily choices" },
  ];

  return (
    <div className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      {/* Header */}
      <ThemeToggle isLightMode={isLightMode} toggleTheme={toggleTheme} />
      <div className="flex items-center justify-between px-6 py-6 sm:px-10 z-50 relative">
        <div className="flex items-center gap-3">
          <LogoMark />
          <span className="text-xl font-semibold tracking-normal text-foreground">Karma</span>
        </div>
        <div className="flex items-center gap-4 mr-12 sm:mr-16">
          {session ? (
            <button className="primary-button py-2 px-5" onClick={onStart}>
              Dashboard <ArrowRight size={16} />
            </button>
          ) : (
            <button className="primary-button py-2 px-5" onClick={() => signIn("google")}>
              Sign In <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-20 pb-24 text-center sm:px-10 relative z-10">
        
        {/* Dynamic Glowing Background Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[1000px] max-h-[1000px] bg-sage/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute top-1/4 left-1/4 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-sky-400/5 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] bg-amber-400/5 rounded-full blur-[90px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '12s' }} />
        
        {/* Mockup Floating Cards (Insight Widgets) */}
        <motion.div 
          initial={{ opacity: 0, y: 30, rotate: -6 }} animate={{ opacity: 1, y: [0, -15, 0], rotate: -6 }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute hidden lg:flex top-1/4 left-[10%] flex-col gap-3 rounded-2xl border border-[var(--foreground)]/10 bg-background/60 p-4 backdrop-blur-xl shadow-2xl shadow-sage/5 w-64"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              <span className="text-xs font-semibold text-[var(--foreground)]/70 uppercase">AC Leak</span>
            </div>
            <span className="text-xs font-bold text-red-400">+₹420</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--foreground)]/5 overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-red-400/50" />
          </div>
          <p className="text-left text-[10px] text-[var(--foreground)]/40 mt-1">Running at 22°C overnight</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: -20, rotate: 4 }} animate={{ opacity: 1, y: [0, 20, 0], rotate: 4 }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute hidden lg:flex bottom-1/3 right-[8%] flex-col gap-3 rounded-2xl border border-[var(--foreground)]/10 bg-background/60 p-4 backdrop-blur-xl shadow-2xl shadow-sky-400/5 w-60"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-sky-400" />
              <span className="text-xs font-semibold text-[var(--foreground)]/70 uppercase">Commute</span>
            </div>
            <span className="text-xs font-bold text-emerald-400">-12kg</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-md bg-[var(--foreground)]/5 text-[10px] font-medium text-[var(--foreground)]/60">Cab</div>
            <ArrowRight size={10} className="text-[var(--foreground)]/30" />
            <div className="px-2 py-1 rounded-md bg-emerald-400/10 text-[10px] font-medium text-emerald-500">Metro</div>
          </div>
        </motion.div>

        {/* Live Counter (Now integrated smoothly) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
          className="mb-10 inline-flex flex-col items-center justify-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--foreground)]/60 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-sage animate-pulse" />
            Global Emissions Since Open
          </div>
          <div className="flex items-baseline gap-2 font-outfit">
            <span className="text-6xl sm:text-8xl font-bold tracking-tighter text-foreground tabular-nums drop-shadow-sm">
              {Math.floor(globalTonnes).toLocaleString("en-US")}
            </span>
            <span className="text-2xl sm:text-3xl font-medium text-[var(--foreground)]/40 tabular-nums">
              .{Math.floor((globalTonnes % 1) * 10)} t
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl text-6xl font-extrabold leading-[1.05] tracking-tight sm:text-8xl lg:text-9xl text-balance text-foreground drop-shadow-sm"
        >
          Your lifestyle,{" "}
          <span 
            className="inline-block bg-[linear-gradient(to_right,#9CAF88,#60A5FA,#F6C85F,#9CAF88)] bg-[length:200%_auto] bg-clip-text text-transparent"
            style={{ animation: 'gradient-drift 4s linear infinite' }}
          >
            Reimagined.
          </span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 max-w-3xl text-2xl leading-relaxed text-[var(--foreground)]/60 font-medium sm:text-3xl"
        >
          Karma diagnoses your daily choices into a weekly action plan that saves money, reduces waste, and lowers your carbon footprint — <span className="text-foreground">without the guilt.</span>
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 flex flex-col items-center justify-center gap-4"
        >
          <button
            className="primary-button text-base px-10 py-4 text-lg font-semibold shadow-[0_0_40px_rgba(156,175,136,0.3)] transition-all hover:scale-105 active:scale-95"
            onClick={session ? onStart : () => signIn("google")}
          >
            {session ? "Open Dashboard" : "Sign in with Google"} <ArrowRight size={20} />
          </button>
          <span className="text-xs font-semibold text-[var(--foreground)]/40 tracking-widest uppercase">Secure 1-Click Login</span>
        </motion.div>
      </section>

      {/* Stats Strip */}
      <motion.section
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}
        className="border-y border-[var(--foreground)]/10 bg-[var(--foreground)]/[0.02] px-6 py-10 sm:px-10 backdrop-blur-sm relative z-10"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4 divide-x divide-[var(--foreground)]/5">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`text-center ${i === 0 || i === 2 ? "border-none" : ""} ${i === 1 || i === 3 ? "border-l border-[var(--foreground)]/5" : ""} md:border-l`} style={{ borderLeft: i === 0 ? 'none' : '' }}>
              <p className="font-outfit text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-2 text-[10px] sm:text-xs leading-5 text-[var(--foreground)]/50 font-semibold uppercase tracking-widest mx-auto max-w-[150px]">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Bento Box Features */}
      <section className="px-6 py-24 sm:px-10 sm:py-32 relative z-10">
        <div className="mx-auto max-w-6xl">
          <p className="mb-12 text-center text-xs font-semibold uppercase tracking-[0.22em] text-sage">
            The Intelligence Engine
          </p>
          
          <div className="grid gap-6 md:grid-cols-3 md:grid-rows-2">
            
            {/* Bento 1: Span 2 Cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="md:col-span-2 md:row-span-1 rounded-[2rem] border border-[var(--foreground)]/10 bg-gradient-to-br from-[var(--foreground)]/5 to-[var(--foreground)]/[0.01] p-8 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-10 opacity-20 transition-opacity group-hover:opacity-40">
                <TrendingUp size={120} className="text-sage" />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage/20 text-sage drop-shadow-[0_0_12px_rgba(156,175,136,0.6)]">
                    <TrendingUp size={24} />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Find your hidden waste</h3>
                  <p className="text-[var(--foreground)]/60 text-base max-w-sm leading-relaxed">
                    Karma diagnoses where your money, energy, and carbon are silently leaking — and ranks them by impact.
                  </p>
                </div>
                
                {/* Mock Chart UI */}
                <div className="mt-10 rounded-xl border border-[var(--foreground)]/10 bg-background/50 p-5 backdrop-blur-md max-w-md w-full shadow-lg">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--foreground)]/50 font-bold mb-1">Energy Leak</p>
                      <p className="font-outfit text-2xl font-bold text-foreground">₹1,240 <span className="text-sm font-medium text-red-400 ml-1">↑ 12%</span></p>
                    </div>
                    <div className="flex gap-1">
                      {[30, 45, 25, 60, 80, 50, 95].map((h, i) => (
                        <div key={i} className="w-3 rounded-t-sm bg-sage/40 transition-all hover:bg-sage" style={{ height: `${h}px` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bento 2: Span 1 Col */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
              className="md:col-span-1 md:row-span-1 rounded-[2rem] border border-[var(--foreground)]/10 bg-gradient-to-bl from-[var(--foreground)]/5 to-[var(--foreground)]/[0.01] p-8 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group"
            >
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/20 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">One action at a time</h3>
                <p className="text-[var(--foreground)]/60 text-sm leading-relaxed mb-8">
                  No guilt, no overwhelming lists. One practical recommendation per week.
                </p>
                
                {/* Mock Checklist UI */}
                <div className="mt-auto space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border border-sage/30 bg-sage/10 p-3 shadow-inner">
                    <div className="h-5 w-5 rounded-full bg-sage flex items-center justify-center text-background">
                      <Check size={12} strokeWidth={4} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Switch AC to 26°C</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-3 opacity-50">
                    <div className="h-5 w-5 rounded-full border-2 border-[var(--foreground)]/20" />
                    <span className="text-xs font-medium text-foreground line-through">Carpool to work</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bento 3: Span 1 Col */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
              className="md:col-span-1 md:row-span-1 rounded-[2rem] border border-[var(--foreground)]/10 bg-gradient-to-tr from-[var(--foreground)]/5 to-[var(--foreground)]/[0.01] p-8 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-sky-400/10 rounded-full blur-3xl group-hover:bg-sky-400/20 transition-colors" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-400/20 text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-3">Personalized to India</h3>
                <p className="text-[var(--foreground)]/60 text-sm leading-relaxed">
                  Built around Indian electricity bills, commute modes, and real CO2 data from IEA 2024.
                </p>
                <div className="mt-8 flex items-center gap-2">
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-400/10 rounded-full border border-sky-400/20">₹ Rupee Context</span>
                </div>
              </div>
            </motion.div>

            {/* Bento 4: Span 2 Cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}
              className="md:col-span-2 md:row-span-1 rounded-[2rem] border border-[var(--foreground)]/10 bg-[var(--foreground)]/5 p-8 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-8 group"
            >
              <div className="flex-1">
                <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">Stop guessing. Start knowing.</h2>
                <p className="text-base leading-relaxed text-[var(--foreground)]/60 mb-8">
                  Takes 3 minutes to set up your baseline footprint and unlock personalized AI insights. Secure Google Login included.
                </p>
                <button className="primary-button py-3 px-8 text-base font-semibold w-full sm:w-auto justify-center shadow-lg" onClick={session ? onStart : () => signIn("google")}>
                  {session ? "Enter Workspace" : "Get Started Now"} <ArrowRight size={18} />
                </button>
              </div>
              <div className="flex-1 w-full relative h-48 sm:h-full min-h-[200px] rounded-xl border border-[var(--foreground)]/10 bg-background/50 overflow-hidden shadow-inner flex items-center justify-center group-hover:border-sage/30 transition-colors">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(156,175,136,0.1)_0,transparent_70%)]" />
                <div className="text-center relative z-10">
                  <LogoMark />
                  <p className="mt-3 text-sm font-semibold tracking-widest uppercase text-foreground">Karma Intelligence</p>
                </div>
              </div>
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--foreground)]/5 px-6 py-8 text-center bg-background z-10 relative">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-[var(--foreground)]/30">
          Karma · Carbon data from IEA & Global Carbon Budget 2024 · Built for PromptWars
        </p>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function Header({ compact, profile, onLogoClick }: { compact: boolean; profile: Profile; onLogoClick?: () => void }) {
  const { data: session } = useSession();
  const displayName = session?.user?.name ? `${session.user.name}'s tracker` : (profile.name ? `${profile.name}'s tracker` : "Carbon emissions tracker");
  
  return (
    <div className={`flex items-center gap-3 ${compact ? "py-2" : ""}`}>
      <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={onLogoClick}>
        <LogoMark />
        <div>
          <p className="text-lg font-semibold tracking-normal text-foreground">Karma</p>
          <p className="text-xs text-[var(--foreground)]/45 truncate max-w-[140px] sm:max-w-xs">{displayName}</p>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle({ isLightMode, toggleTheme }: { isLightMode: boolean; toggleTheme: () => void }) {
  return (
    <button
      className="secondary-button absolute top-5 right-4 sm:top-5 sm:right-6 lg:top-5 lg:right-8 z-[100] flex h-10 w-10 items-center justify-center rounded-full p-0 border-sage/50 transition-transform active:scale-95 text-foreground shadow-lg backdrop-blur-md"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <div className={`transition-all duration-500 ${isLightMode ? "rotate-[360deg] opacity-100" : "-rotate-90 opacity-0 absolute"}`}>
        <Sun size={18} />
      </div>
      <div className={`transition-all duration-500 ${!isLightMode ? "rotate-0 opacity-100" : "rotate-90 opacity-0 absolute"}`}>
        <Moon size={18} />
      </div>
    </button>
  );
}

function LogoMark() {
  return (
    <div className="logo-mark hover:scale-105 transition-transform duration-300" aria-label="Karma logo">
      <svg
        viewBox="0 0 48 48"
        role="img"
        className="h-8 w-8 select-none transition-transform duration-1000 hover:rotate-180 ease-out"
      >
        <defs>
          <linearGradient id="karmaLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9CAF88" />
            <stop offset="50%" stopColor="#60A5FA" />
            <stop offset="100%" stopColor="#F6C85F" />
          </linearGradient>
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Outer subtle guide track representing structural alignment */}
        <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.5" />
        
        {/* The open feedback loop curve */}
        <path
          d="M 36.72 11.28 A 18 18 0 1 0 36.72 36.72"
          fill="none"
          stroke="url(#karmaLogoGradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        
        {/* Connection anchor points */}
        <circle cx="36.72" cy="11.28" r="1" fill="#9CAF88" opacity="0.4" />
        <circle cx="36.72" cy="36.72" r="1" fill="#F6C85F" opacity="0.4" />

        {/* Center glowing choice dot representing carbon-karma balance */}
        <circle cx="24" cy="24" r="4" fill="rgba(248, 250, 252, 0.08)" />
        <circle cx="24" cy="24" r="2" fill="var(--foreground)" filter="url(#logoGlow)" />
      </svg>
    </div>
  );
}

function SetupOverlay({
  profile,
  onFinish,
  onSkip,
}: {
  profile: Profile;
  onFinish: (profile: Profile) => void;
  onSkip: () => void;
}) {
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Profile>({
    ...profile,
    name: session?.user?.name || profile.name,
  });

  const setupSteps = [
    {
      eyebrow: "Welcome",
      title: "Make Karma yours.",
      text: "A carbon tracker works better when it knows who it is helping. Start with your baseline details so the story and dashboard feel personal.",
      icon: UserRound,
    },
    {
      eyebrow: "Lifestyle Baseline",
      title: "Your hidden footprint.",
      text: "Karma finds the leaks in your daily routine. We need a quick estimate of your habits to build your baseline footprint.",
      icon: Target,
    },
    {
      eyebrow: "Baseline Details",
      title: "Refining the numbers.",
      text: "Let's refine your estimates for household size, monthly bill, and commute distance to make your footprint calculation accurate.",
      icon: WalletCards,
    },
    {
      eyebrow: "Personalization",
      title: "Choose how Karma should guide you.",
      text: "Some people care about cost first. Some care about health, comfort, or climate. Karma will rank actions around your motivation.",
      icon: Sparkles,
    },
  ];
  const current = setupSteps[step];
  const CurrentIcon = current.icon;

  function next() {
    if (step < setupSteps.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    onFinish(draft);
  }

  return (
    <motion.div
      className="fixed inset-0 z-[80] overflow-y-auto overflow-x-hidden bg-[#05070a]/72 backdrop-blur-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex min-h-full w-full items-center justify-center p-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0a0e14] shadow-2xl theme-dark-panel"
          >
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
          
          <div className="relative p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wider text-white/50">{current.eyebrow}</p>
              <div className="flex gap-1.5">
                {setupSteps.map((_, i) => (
                  <div key={i} className={`h-1.5 w-8 rounded-full transition-colors duration-500 ${i <= step ? "bg-sage" : "bg-white/10"}`} />
                ))}
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-sage">
                <CurrentIcon size={24} />
              </div>
              <h2 className="mb-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{current.title}</h2>
              <p className="text-lg leading-relaxed text-white/60">{current.text}</p>
            </div>

            <div className="min-h-[160px]">
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div key="step-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                    {session?.user ? (
                      <div className="mb-2 flex items-center gap-4 rounded-2xl border border-sage/20 bg-sage/5 p-4">
                        {session.user.image && <Image src={session.user.image} alt="User Avatar" width={40} height={40} className="h-10 w-10 rounded-full border border-sage/30" />}
                        <div>
                          <p className="font-medium text-white">{session.user.name}</p>
                          <p className="text-xs text-white/60">{session.user.email}</p>
                        </div>
                      </div>
                    ) : (
                      <Field label="Your name">
                        <input
                          className="input"
                          value={draft.name}
                          onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
                          placeholder="Example: Ayaan"
                        />
                      </Field>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Country">
                        <input
                          className="input"
                          value={draft.country}
                          onChange={(e) => setDraft((current) => ({ ...current, country: e.target.value }))}
                          placeholder="e.g. India"
                        />
                      </Field>
                      <Field label="City">
                        <input
                          className="input"
                          value={draft.city}
                          onChange={(e) => setDraft((current) => ({ ...current, city: e.target.value }))}
                          placeholder="e.g. Mumbai"
                        />
                      </Field>
                    </div>
                    <Field label="Diet pattern">
                      <select className="input" value={draft.diet} onChange={(e) => setDraft((current) => ({ ...current, diet: e.target.value as Diet }))}>
                        <option value="veg">Vegetarian / plant-based</option>
                        <option value="mixed">Mixed (some meat)</option>
                        <option value="high-meat">High-meat diet</option>
                      </select>
                    </Field>
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                    <Field label="Commute mode">
                      <select className="input" value={draft.commuteMode} onChange={(e) => setDraft((current) => ({ ...current, commuteMode: e.target.value as Profile["commuteMode"] }))}>
                        {[["cab", "Cab / Ola / Uber"], ["car", "Own car"], ["auto", "Auto-rickshaw"], ["metro", "Metro / Train"], ["bike", "Bike / Cycle"], ["walk", "Walk"]].map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                      </select>
                    </Field>
                    <Field label="AC usage (hours/day)">
                      <Range value={draft.acHours} min={0} max={12} step={1} onChange={(value) => setDraft((current) => ({ ...current, acHours: value }))} suffix={`${draft.acHours} h`} />
                    </Field>
                    <Field label="Food deliveries per week">
                      <Stepper value={draft.deliveries} min={0} max={14} onChange={(value) => setDraft((current) => ({ ...current, deliveries: value }))} />
                    </Field>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                    <Field label="Household size">
                      <Stepper value={draft.household} min={1} max={8} onChange={(value) => setDraft((current) => ({ ...current, household: value }))} />
                    </Field>
                    <Field label="Monthly electricity bill">
                      <Range value={draft.bill} min={800} max={8000} step={100} onChange={(value) => setDraft((current) => ({ ...current, bill: value }))} suffix={formatRupees(draft.bill)} />
                    </Field>
                    <Field label="Weekly commute distance">
                      <Range value={draft.commuteKm} min={0} max={180} step={5} onChange={(value) => setDraft((current) => ({ ...current, commuteKm: value }))} suffix={`${draft.commuteKm} km`} />
                    </Field>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-4">
                    <Field label="Main reason to use Karma">
                      <select className="input" value={draft.motivation} onChange={(e) => setDraft((current) => ({ ...current, motivation: e.target.value as Motivation }))}>
                        <option value="save">Reduce cost / save money</option>
                        <option value="comfort">Keep comfort</option>
                        <option value="health">Protect health</option>
                        <option value="organize">Feel organized / reduce clutter</option>
                        <option value="climate">Reduce climate impact</option>
                      </select>
                    </Field>
                    {/* Summary of what they've set */}
                    {draft.name && (
                      <div className="rounded-2xl border border-sage/20 bg-sage/5 p-4 text-sm leading-6 text-white/70">
                        <p className="font-medium text-sage mb-1">Your profile</p>
                        <p>{draft.name} · {[draft.city, draft.country].filter(Boolean).join(", ") || "Location not set"}</p>
                        <p>{draft.acHours}h AC/day · {draft.commuteKm} km/week by {draft.commuteMode} · {draft.deliveries} deliveries/week</p>
                        <p>Diet: {draft.diet === "veg" ? "Vegetarian" : draft.diet === "mixed" ? "Mixed" : "High-meat"} · Household: {draft.household}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-8 flex flex-col gap-3 pt-2 sm:flex-row">
              <button className="primary-button flex-1 justify-center py-3.5 text-lg" onClick={next}>
                {step === setupSteps.length - 1 ? "Start Karma" : "Continue"} <ArrowRight size={20} />
              </button>
              <button className="secondary-button justify-center" onClick={onSkip}>
                Skip setup
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </motion.div>
  );
}


function TodayView({
  profile,
  totalCarbon,
  totalPoints,
  avoidedCarbon,
  earnedPoints,
  biggestLeak,
  activeAction,
  logs,
  goTrack,
  completeAction,
}: {
  profile: Profile;
  totalCarbon: number;
  totalPoints: number;
  avoidedCarbon: number;
  earnedPoints: number;
  biggestLeak: [Category, number];
  activeAction?: Action;
  logs: LogEntry[];
  goTrack: () => void;
  completeAction: (id: string) => void;
}) {
  const LeakIcon = categoryMeta[biggestLeak?.[0] ?? "energy"].icon;
  const [worldTonnes, setWorldTonnes] = useState(0);
  const [startTime] = useState(() => Date.now());
  const monthlyLeak = calculateMonthlyLeak(profile);

  useEffect(() => {
    const perSecond = worldCo2TonnesPerYear / (365 * 24 * 60 * 60);
    const timer = window.setInterval(() => {
      setWorldTonnes(((Date.now() - startTime) / 1000) * perSecond);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [startTime]);

  // Personalized hero headline
  const heroLocation = [profile.city, profile.country].filter(Boolean).join(", ") || "your city";
  const heroGreeting = profile.name ? `${profile.name}'s` : "Your";

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="hero-panel relative overflow-hidden p-5 sm:p-7">
          <div className="grid gap-7 lg:grid-cols-[1fr_280px] lg:items-center">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-sage">{heroGreeting} carbon tracker · {heroLocation}</p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl text-balance">
                See which daily choices create your footprint.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/64">
                Log AC use, commute, food, shopping, and waste. Karma converts them into CO2e, explains the real-world reason to reduce them, and gives one practical next action.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button className="primary-button" onClick={goTrack}>
                  Log today&apos;s choice <Plus size={18} />
                </button>
                <div className="metric-pill"><Star size={16} /> {formatPoints(earnedPoints)} already avoided</div>
              </div>
            </div>
            <CarbonConstellation logs={logs} />
          </div>
        </section>

        <section className="panel flex flex-col justify-between p-5 min-h-[350px]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-white/45">This week&apos;s leak</p>
              <h2 className="mt-2 text-3xl font-semibold break-words">{categoryMeta[biggestLeak?.[0] ?? "energy"].label}</h2>
            </div>
            <div className="icon-tile shrink-0"><LeakIcon size={22} /></div>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative py-10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-36 w-36 animate-pulse rounded-full bg-foreground opacity-5 blur-2xl" />
            </div>
            <LeakIcon size={96} strokeWidth={0.7} className="text-foreground opacity-[0.15] relative z-10" />
          </div>

          <p className="mt-2 text-sm leading-6 text-white/60">
            This category is creating the clearest carbon-and-cost signal this week. Start here for the fastest visible improvement.
          </p>
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <MetricCard icon={BarChart3} label="Tracked CO2e this week" value={carbon(totalCarbon)} context="Approximate footprint from logged choices" />
        <MetricCard icon={Star} label="Karma Points impact" value={formatPoints(totalPoints)} context="Positive means saved/avoided; negative means extra spend/leak" />
        <MetricCard icon={Wind} label="CO2e avoided" value={carbon(avoidedCarbon)} context="From cleaner choices you logged" />
        <div data-testid="monthly-leak">
          <MetricCard icon={WalletCards} label="Monthly lifestyle leak" value={formatRupees(monthlyLeak).replace(/^\+/, '')} context={`Based on ${profile.city || "your city"}'s AC, commute & deliveries`} />
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <StepHint number="1" title="Log one choice" text="Pick the closest tile in Log. It takes under a minute." />
        <StepHint number="2" title="See the source" text="Karma shows which habit is creating the most CO2e." />
        <StepHint number="3" title="Do one action" text="Complete the recommended action and watch the recap change." />
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <WorldEmissionsPanel worldTonnes={worldTonnes} profile={profile} />
        <ContributionPanel avoidedCarbon={avoidedCarbon} earnedPoints={earnedPoints} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="panel p-5 min-w-0 overflow-hidden">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-white/45">Active action</p>
              <h2 className="text-2xl font-semibold break-words">{activeAction?.title ?? "No active action yet"}</h2>
            </div>
            <Target className="text-sage shrink-0 mt-1" />
          </div>
          {activeAction ? (
            <>
              <p className="text-sm leading-6 text-white/62 break-words">{activeAction.why}</p>
              <div className="mt-5 rounded-2xl bg-white/[0.04] p-4 text-sm text-white/70 break-words">{activeAction.step}</div>
              <button className="primary-button mt-5 w-full justify-center" onClick={() => completeAction(activeAction.id)}>
                Mark done <Check size={18} />
              </button>
            </>
          ) : (
            <p className="mt-4 text-sm text-white/45">Log some choices in the Track tab to generate your first action.</p>
          )}
        </section>

        <section className="panel p-5 min-w-0 overflow-hidden">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-white/45">Recent logs</p>
              <h2 className="text-2xl font-semibold break-words">What changed the week</h2>
            </div>
            <Clock3 className="text-white/50 shrink-0 mt-1" />
          </div>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-white/38">
              <Plus size={24} className="text-white/20" />
              <p>No logs yet. Head to Track to start.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.slice(0, 5).map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

type EstimateState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; carbon: number; points: number; note: string; confidence: "low" | "medium" | "high"; category: string; sourceEngine?: string; isFallback?: boolean }
  | { status: "error" };

function TrackView({
  selectedCategory,
  setSelectedCategory,
  addLog,
}: {
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;
  addLog: (entry: Omit<LogEntry, "id" | "createdAt">) => void;
}) {
  const [label, setLabel] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [estimate, setEstimate] = useState<EstimateState>({ status: "idle" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced API call whenever label changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!label.trim() || label.trim().length < 6) {
      setTimeout(() => setEstimate({ status: "idle" }), 0);
      return;
    }
    setTimeout(() => setEstimate({ status: "loading" }), 0);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionText: label, category: selectedCategory }),
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json() as {
          carbon: number; points: number; note: string;
          confidence: "low" | "medium" | "high"; category: string;
          sourceEngine?: string;
        };
        setEstimate({
          status: "done",
          ...data,
          sourceEngine: data.sourceEngine || "physics_engine",
          isFallback: false,
        });
        // Auto-suggest category if detected differs from selected
        if (data.category && data.category !== selectedCategory) {
          setSelectedCategory(data.category as Category);
        }
      } catch {
        toast.error("AI estimation failed. Please try again.");
        setEstimate({ status: "error" });
      }
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [label, selectedCategory, setSelectedCategory]);

  function submitManualLog() {
    if (!label.trim()) return;
    const est = estimate.status === "done" ? estimate : null;
    addLog({
      category: selectedCategory,
      label,
      carbon: est?.carbon ?? 0,
      points: est?.points ?? 0,
      note: customNote.trim() || est?.note || "Manually logged entry.",
    });
    setLabel("");
    setCustomNote("");
    setEstimate({ status: "idle" });
  }

  const confidenceColor: Record<string, string> = {
    high: "text-sage border-sage/30 bg-sage/8",
    medium: "text-amber-300 border-amber-300/30 bg-amber-300/8",
    low: "text-white/45 border-white/15 bg-white/[0.03]",
  };

  return (
    <div className="space-y-5">
      <PageTitle eyebrow="Track" title="Log today's choices. This is where the numbers start." subtitle="Each tile under a minute. Pick the closest option and confirm. Karma does the rest." />
      <div className="grid gap-3 sm:grid-cols-5">
        {(Object.keys(categoryMeta) as Category[]).map((category) => {
          const Icon = categoryMeta[category].icon;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-3xl border p-4 text-left transition ${selectedCategory === category ? "border-sage/50 bg-sage/10" : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"}`}
            >
              <Icon className={categoryMeta[category].accent} size={22} />
              <p className="mt-3 text-sm font-medium">{categoryMeta[category].label}</p>
            </button>
          );
        })}
      </div>
      <section className="panel p-5">
        <h2 className="mb-5 text-2xl font-semibold">{categoryMeta[selectedCategory].label} choices</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {quickLogs[selectedCategory].map((entry) => (
            <button
              key={entry.label}
              onClick={() => addLog(entry)}
              className={`rounded-2xl border p-4 text-left transition hover:bg-white/[0.06] ${entry.points > 0 ? "border-sage/30 bg-sage/5" : "border-white/10 bg-white/[0.035]"}`}
            >
              <p className="text-sm font-medium">{entry.label}</p>
              <p className="mt-3 min-h-16 text-sm leading-6 text-white/60">{entry.note}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className={`metric-pill ${entry.points < 0 ? "text-emerald-200" : "text-amber-200"}`}>{formatPoints(entry.points)}</span>
                <span className={`metric-pill ${entry.carbon < 0 ? "text-emerald-200" : "text-amber-200"}`}>{carbon(entry.carbon)}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── SMART MANUAL ENTRY ─────────────────────────────────── */}
      <section className="panel p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/45">Smart entry</p>
            <h2 className="text-2xl font-semibold">Describe what happened</h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-sky-300/25 bg-sky-300/8 px-3 py-1.5 text-xs text-sky-300">
            <Sparkles size={12} className="animate-ai-sparkle" />
            AI estimates impact
          </div>
        </div>

        <Field label="What happened? (be specific — include distance, hours, or count)">
          <div className="relative">
            <input
              className="input pr-10"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && estimate.status === "done" && submitManualLog()}
              placeholder="e.g. Rode bike 15 km on petrol · AC on for 4 hours at 24°C · Ordered 2 meals from Swiggy"
            />
            {estimate.status === "loading" && (
              <motion.div
                className="absolute right-3 top-1/2 -translate-y-1/2"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={16} className="text-sage" />
              </motion.div>
            )}
          </div>
        </Field>

        {/* Live estimate preview */}
        <AnimatePresence mode="wait">
          {estimate.status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-center gap-3 text-sm text-white/45">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>
                  <Sparkles size={16} className="text-sage" />
                </motion.div>
                Analysing emissions…
              </div>
            </motion.div>
          )}

          {estimate.status === "done" && (
            <motion.div
              key="estimate"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              {/* Estimate header */}
              <div className="flex flex-wrap items-center gap-3 border-b border-white/8 px-4 py-3">
                <Sparkles size={14} className="text-sage" />
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/50">Estimated impact</span>
                {estimate.sourceEngine === "nvidia_nim" ? (
                  <span className="rounded-full border border-sky-400/25 bg-sky-400/8 px-2 py-0.5 text-[10px] font-bold text-sky-400 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles size={10} className="animate-ai-sparkle text-sky-400" />
                    AI Estimated
                  </span>
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/45 uppercase tracking-wide">
                    Physics Engine
                  </span>
                )}
                <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-xs font-medium ${confidenceColor[estimate.confidence]}`}>
                  {estimate.confidence} confidence
                </span>
              </div>

              {/* Carbon + points */}
              <div className="grid grid-cols-2 divide-x divide-white/8">
                <div className="px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/38 mb-1">CO2e impact</p>
                  <p className={`font-outfit text-2xl font-medium tracking-tight ${estimate.carbon < 0 ? "text-sage" : "text-coral"}`}>
                    {carbon(estimate.carbon)}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-white/38 mb-1">Karma points</p>
                  <p className={`font-outfit text-2xl font-medium tracking-tight ${estimate.points > 0 ? "text-sage" : "text-coral"}`}>
                    {formatPoints(estimate.points)}
                  </p>
                </div>
              </div>

              {/* Explanation */}
              <div className="border-t border-white/8 px-4 py-3">
                <p className="text-xs leading-5 text-white/55">{estimate.note}</p>
              </div>
            </motion.div>
          )}

          {estimate.status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-2xl border border-coral/20 bg-coral/5 px-4 py-3 text-sm text-coral"
            >
              Could not estimate impact. The log will still be saved.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optional custom note */}
        <div className="mt-4">
          <Field label="Add a personal note (optional)">
            <input
              className="input"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Why this choice mattered today…"
            />
          </Field>
        </div>

        {/* Submit */}
        <button
          className="primary-button mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50"
          onClick={submitManualLog}
          disabled={!label.trim()}
        >
          {estimate.status === "done"
            ? `Log ${carbon(estimate.carbon)} · ${formatPoints(estimate.points)}`
            : "Log entry"}
          <Plus size={18} />
        </button>
      </section>
    </div>
  );
}


function InsightsView({
  profile,
  logs,
  actions,
  coachReport,
  coachLoading,
}: {
  profile: Profile;
  logs: LogEntry[];
  actions: Action[];
  coachReport: {
    headline: string;
    summary: string;
    sourceEngine: "nvidia_nim" | "physics_engine";
  } | null;
  coachLoading: boolean;
}) {
  const top = actions.find(a => a.status !== "dismissed") ?? actions[0];
  const categoryTotals = totalsByCategory(logs, "carbon");
  const sorted = (Object.entries(categoryTotals) as [Category, number][]).sort((a, b) => b[1] - a[1]);

  // Personalized copy
  const firstName = profile.name ? profile.name.split(" ")[0] : null;
  const location = profile.city || profile.country || "your area";
  const householdText = profile.household > 1 ? `your household of ${profile.household}` : "your lifestyle";
  const dietText = profile.diet === "veg" ? "plant-based" : profile.diet === "high-meat" ? "high-meat" : "mixed";

  if (logs.length === 0) {
    return (
      <div className="space-y-5">
        <PageTitle eyebrow="Insights" title="Your weekly diagnosis is practical, not preachy." subtitle="Start logging choices to unlock your personal diagnosis." />
        <div className="panel flex flex-col items-center gap-4 p-12 text-center">
          <Sparkles size={32} className="text-white/20" />
          <h2 className="text-xl font-semibold">No data yet</h2>
          <p className="max-w-sm text-sm leading-6 text-white/45">Log a few choices in the Track tab and Karma will diagnose your biggest source of hidden waste.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageTitle eyebrow="Insights" title="Your weekly diagnosis is practical, not preachy." subtitle={`Based on ${householdText}'s logged choices with a ${dietText} diet in ${location}.`} />
      <section className="hero-panel p-5 sm:p-7">
        {coachLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/5" />
              <div className="space-y-2 flex-1">
                <div className="h-3.5 w-24 rounded bg-white/5" />
                <div className="h-6 w-2/3 rounded bg-white/5" />
              </div>
            </div>
            <div className="h-16 w-full rounded bg-white/5 mt-3" />
            <div className="grid gap-3 sm:grid-cols-3 mt-4">
              <div className="h-14 rounded bg-white/5" />
              <div className="h-14 rounded bg-white/5" />
              <div className="h-14 rounded bg-white/5" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center gap-3">
              <div className="icon-tile"><Sparkles size={22} className="animate-ai-sparkle" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white/45">Karma Coach</p>
                  {coachReport && (
                    coachReport.sourceEngine === "nvidia_nim" ? (
                      <span className="rounded-full border border-sky-400/25 bg-sky-400/8 px-2 py-0.5 text-[9px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={10} className="animate-ai-sparkle text-sky-400" />
                        AI Estimated
                      </span>
                    ) : (
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-medium text-white/45 uppercase tracking-wider">
                        Physics Engine
                      </span>
                    )
                  )}
                </div>
                <h2 className="text-2xl font-semibold mt-1">
                  {coachReport ? coachReport.headline : `${firstName ? `${firstName}'s` : "Your"} ${location} routine has one obvious first move.`}
                </h2>
              </div>
            </div>
            <p className="max-w-3xl text-lg leading-8 text-white/72">
              {coachReport ? coachReport.summary : (
                <>
                  {top?.why ?? "Log more choices to unlock your personalized diagnosis."}{" "}
                  {top && <>Start with &quot;{top.title}&quot; because it matches your motivation, repeats weekly, and has a visible benefit within seven days.</>}
                </>
              )}
            </p>

            {coachReport && top && (
              <div className="mt-6 flex items-start gap-4 rounded-2xl border border-sage/20 bg-sage/5 p-4 sm:p-5">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/20 text-sage">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-sage">Recommended Action</h3>
                  <p className="mt-1 text-xl font-medium text-white">{top.title}</p>
                  <p className="mt-2 text-base text-white/70">{top.why}</p>
                </div>
              </div>
            )}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Analysis Confidence" value={coachReport && coachReport.sourceEngine === "nvidia_nim" ? "High" : "Medium"} />
              <MiniStat label="Effort required" value={top?.effort === "low" ? "Under 10 min" : "Plan once"} />
              <MiniStat label="Estimated upside" value={top ? `${formatPoints(top.points)} / week` : "—"} />
            </div>
          </>
        )}
      </section>
      <section className="panel p-5">
        <h2 className="mb-5 text-2xl font-semibold">Category pressure</h2>
        <div className="space-y-4">
          {sorted.map(([category, value]) => {
            const Icon = categoryMeta[category].icon;
            const width = Math.min(100, Math.max(8, Math.abs(value) * 8));
            const isGood = value <= 0;
            return (
              <div key={category}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-white/75"><Icon size={16} /> {categoryMeta[category].label}</span>
                  <span className={value > 0 ? "text-coral" : "text-sage"}>{carbon(value)}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.05]">
                  <div className={`h-full rounded-full ${isGood ? "bg-sage" : "bg-coral"}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function PlanView({
  actions,
  setActionStatus,
  coachLoading,
}: {
  actions: Action[];
  setActionStatus: (id: string, status: Action["status"]) => void;
  coachLoading: boolean;
}) {
  const visible = actions.filter((action) => action.status !== "dismissed");
  return (
    <div className="space-y-5">
      <PageTitle eyebrow="Plan" title="Three small moves. No heroic lifestyle change." subtitle="Actions are ranked by impact, ease, motivation match, and whether the habit repeats." />
      {coachLoading ? (
        <div className="grid gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <section key={i} className="panel grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
              <div className="h-14 w-14 rounded-2xl bg-white/5" />
              <div className="space-y-3 flex-1">
                <div className="flex gap-2">
                  <div className="h-4 w-10 rounded bg-white/5" />
                  <div className="h-4 w-12 rounded bg-white/5" />
                  <div className="h-4 w-16 rounded bg-white/5" />
                </div>
                <div className="h-6 w-1/3 rounded bg-white/5" />
                <div className="h-4 w-2/3 rounded bg-white/5" />
                <div className="h-10 w-full rounded bg-white/5" />
              </div>
              <div className="flex flex-col gap-2 md:w-40">
                <div className="h-8 rounded bg-white/5" />
                <div className="h-8 rounded bg-white/5" />
                <div className="h-8 rounded bg-white/5" />
              </div>
            </section>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="panel flex flex-col items-center gap-4 p-12 text-center">
          <Check size={32} className="text-sage" />
          <h2 className="text-xl font-semibold">All actions dismissed</h2>
          <p className="max-w-sm text-sm leading-6 text-white/45">Log more choices to unlock fresh recommendations.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {visible.map((action, index) => {
            const Icon = categoryMeta[action.category].icon;
            return (
              <section key={action.id} className="panel grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-white">
                  <Icon size={24} />
                </div>
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/55">#{index + 1}</span>
                    <span className="rounded-full bg-sage/10 px-2.5 py-1 text-xs text-sage">{action.status}</span>
                    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/55">{action.effort} effort</span>
                  </div>
                  <h2 className="text-xl font-semibold">{action.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/60">{action.why}</p>
                  <p className="mt-3 rounded-2xl bg-white/[0.035] p-3 text-sm text-white/75">{action.step}</p>
                </div>
                <div className="flex flex-col gap-2 md:w-40">
                  <span className="metric-pill justify-center">{formatPoints(action.points)}</span>
                  <span className="metric-pill justify-center">{carbon(action.carbon)}</span>
                  <button className="primary-button justify-center" onClick={() => setActionStatus(action.id, action.status === "done" ? "active" : "done")}>
                    {action.status === "done" ? "Reopen" : "Done"}
                  </button>
                  <button className="secondary-button justify-center" onClick={() => setActionStatus(action.id, "dismissed")}>Dismiss</button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecapView({
  profile,
  logs,
  avoidedCarbon,
  earnedPoints,
  doneCount,
}: {
  profile: Profile;
  logs: LogEntry[];
  avoidedCarbon: number;
  earnedPoints: number;
  doneCount: number;
}) {
  const location = [profile.city, profile.country].filter(Boolean).join(", ") || "Your city";
  const hasData = logs.length > 0;

  return (
    <div className="space-y-5">
      <PageTitle eyebrow="Recap" title="A weekly story worth sharing." subtitle="Status comes from actions completed and choices logged, not generic badges." />
      {!hasData ? (
        <div className="panel flex flex-col items-center gap-4 p-12 text-center">
          <BarChart3 size={32} className="text-white/20" />
          <h2 className="text-xl font-semibold">Nothing to recap yet</h2>
          <p className="max-w-sm text-sm leading-6 text-white/45">Log your first choice in the Track tab and your weekly story will appear here.</p>
        </div>
      ) : (
        <section className="share-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-white/45">Karma week</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-normal">Less waste, same life.</h2>
            </div>
            <Share2 className="text-sage" />
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <MiniStat label="Location" value={location} />
            <MiniStat label="Money avoided" value={formatRupees(earnedPoints)} />
            <MiniStat label="Impact avoided" value={carbon(avoidedCarbon)} />
          </div>
          <p className="mt-10 max-w-2xl text-lg leading-8 text-white/70">
            {profile.name ? `${profile.name}, you` : "You"} logged {logs.length} choice{logs.length === 1 ? "" : "s"} and completed {doneCount} action{doneCount === 1 ? "" : "s"}. The point is not perfection. The point is finding the leak and closing it before it becomes normal.
          </p>
        </section>
      )}
    </div>
  );
}

function ProfileView({
  profile,
  updateProfile,
  resetData,
  applyTheme,
}: {
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
  resetData: () => void;
  applyTheme: (theme: Profile["themePreference"]) => void;
}) {
  const { data: session } = useSession();
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(profile);

  function saveProfile() {
    updateProfile(draft);
    applyTheme(draft.themePreference);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="space-y-5">
      <PageTitle eyebrow="Profile" title="Edit your carbon baseline." subtitle="These values shape your footprint estimate, insights, and action plan. Changes apply after you save." />
      <div className="panel grid gap-4 p-5 sm:grid-cols-2">
        {session?.user ? (
          <div className="col-span-1 sm:col-span-2 mb-2 flex items-center gap-4 rounded-2xl border border-sage/20 bg-sage/5 p-4">
            {session.user.image && <Image src={session.user.image} alt="User Avatar" width={40} height={40} className="h-10 w-10 rounded-full border border-sage/30" />}
            <div>
              <p className="font-medium text-foreground">{session.user.name}</p>
              <p className="text-xs text-[var(--foreground)]/60">{session.user.email}</p>
            </div>
          </div>
        ) : (
          <Field label="Name">
            <input className="input" value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} placeholder="Your name" />
          </Field>
        )}
        <Field label="Country">
          <input className="input" value={draft.country} onChange={(e) => setDraft((current) => ({ ...current, country: e.target.value }))} placeholder="e.g. India" />
        </Field>
        <Field label="City">
          <input className="input" value={draft.city} onChange={(e) => setDraft((current) => ({ ...current, city: e.target.value }))} placeholder="e.g. Mumbai" />
        </Field>
        <Field label="Diet pattern">
          <select className="input" value={draft.diet} onChange={(e) => setDraft((current) => ({ ...current, diet: e.target.value as Diet }))}>
            <option value="veg">Vegetarian / plant-based</option>
            <option value="mixed">Mixed (some meat)</option>
            <option value="high-meat">High-meat diet</option>
          </select>
        </Field>
        <Field label="Household">
          <Stepper value={draft.household} min={1} max={8} onChange={(value) => setDraft((current) => ({ ...current, household: value }))} />
        </Field>
        <Field label="Electricity bill">
          <Range value={draft.bill} min={800} max={8000} step={100} onChange={(value) => setDraft((current) => ({ ...current, bill: value }))} suffix={formatRupees(draft.bill)} />
        </Field>
        <Field label="AC hours/day">
          <Range value={draft.acHours} min={0} max={12} step={1} onChange={(value) => setDraft((current) => ({ ...current, acHours: value }))} suffix={`${draft.acHours} h`} />
        </Field>
        <Field label="Commute mode">
          <select className="input" value={draft.commuteMode} onChange={(e) => setDraft((current) => ({ ...current, commuteMode: e.target.value as Profile["commuteMode"] }))}>
            {[["cab", "Cab / Ola / Uber"], ["car", "Own car"], ["auto", "Auto-rickshaw"], ["metro", "Metro / Train"], ["bike", "Bike / Cycle"], ["walk", "Walk"]].map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        </Field>
        <Field label="Weekly commute distance">
          <Range value={draft.commuteKm} min={0} max={180} step={5} onChange={(value) => setDraft((current) => ({ ...current, commuteKm: value }))} suffix={`${draft.commuteKm} km`} />
        </Field>
        <Field label="Food delivery/week">
          <Stepper value={draft.deliveries} min={0} max={14} onChange={(value) => setDraft((current) => ({ ...current, deliveries: value }))} />
        </Field>
        <Field label="Motivation">
          <select className="input" value={draft.motivation} onChange={(e) => setDraft((current) => ({ ...current, motivation: e.target.value as Motivation }))}>
            <option value="save">Reduce cost / save money</option>
            <option value="comfort">Keep comfort</option>
            <option value="health">Protect health</option>
            <option value="organize">Feel organized / reduce clutter</option>
            <option value="climate">Reduce climate impact</option>
          </select>
        </Field>
        <Field label="Theme">
          <select className="input" value={draft.themePreference} onChange={(e) => setDraft((current) => ({ ...current, themePreference: e.target.value as Profile["themePreference"] }))}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </Field>

        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row pt-2">
          <button className="primary-button flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-55" disabled={!isDirty} onClick={saveProfile}>
            {saved ? <Check size={16} /> : <Save size={16} />} {saved ? "Saved" : isDirty ? "Save profile" : "Profile saved"}
          </button>
          <button className="secondary-button flex-1 justify-center" onClick={() => setDraft(profile)}>
            Undo changes
          </button>
          {session?.user && (
            <button className="secondary-button flex-1 justify-center text-coral hover:bg-coral/10 hover:border-coral/50" onClick={() => signOut()}>
              <LogOut size={16} /> Sign Out
            </button>
          )}
          <button className="secondary-button flex-1 justify-center" onClick={resetData}>
            <RotateCcw size={16} /> Reset data
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, context }: { icon: LucideIcon; label: string; value: string; context: string }) {
  return (
    <section className="panel p-5">
      <div className="mb-8 flex items-center justify-between">
        <p className="text-sm text-white/45">{label}</p>
        <Icon className="text-sage" size={20} />
      </div>
      <p className="font-outfit text-3xl font-medium tracking-tight">{value}</p>
      <p className="mt-3 text-sm leading-5 text-white/48">{context}</p>
    </section>
  );
}

function CarbonConstellation({ logs }: { logs: LogEntry[] }) {
  const totals = totalsByCategory(logs, "carbon");
  const nodes = (Object.entries(totals) as [Category, number][]).map(([category, value], index) => ({
    category,
    value,
    angle: index * 72 - 88,
    radius: 65 + Math.min(25, Math.abs(value) * 4),
  }));
  const total = logs.reduce((sum, log) => sum + log.carbon, 0);

  return (
    <div className="carbon-map relative flex min-h-[500px] flex-col justify-between p-6" aria-label="Live carbon footprint map">
      <div className="relative z-10">
        <p className="text-xs uppercase tracking-[0.18em] text-white/38">Live footprint map</p>
        <p className="mt-1 font-outfit text-3xl font-medium tracking-tight">{carbon(total)}</p>
      </div>
      <div className="relative flex-1 my-12 min-h-[260px] flex items-center justify-center pointer-events-none">
        <motion.div
          className="h-24 w-24 rounded-full border border-sage/35 bg-sage/10 drop-shadow-[0_0_25px_rgba(156,175,136,0.4)]"
          animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute h-40 w-40 rounded-full border border-white/10" />
        <div className="absolute h-56 w-56 rounded-full border border-white/8" />
        {nodes.map((node) => {
          const Icon = categoryMeta[node.category].icon;
          const x = Math.cos((node.angle * Math.PI) / 180) * node.radius;
          const y = Math.sin((node.angle * Math.PI) / 180) * node.radius;
          const isCleaner = node.value < 0;
          return (
            <motion.div
              key={node.category}
              className="absolute pointer-events-auto"
              style={{ x, y }}
              animate={{ y: [y, y - 5, y] }}
              transition={{ duration: 3 + Math.abs(node.value) / 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className={`grid h-12 w-12 place-items-center rounded-2xl border backdrop-blur-md ${isCleaner ? "border-sage/40 bg-sage/15 drop-shadow-[0_0_15px_rgba(156,175,136,0.5)]" : "border-coral/35 bg-coral/12 drop-shadow-[0_0_15px_rgba(249,115,106,0.5)]"}`}>
                <Icon className={isCleaner ? "text-sage" : "text-coral"} size={19} />
              </div>
            </motion.div>
          );
        })}
      </div>
      <p className="relative z-10 mt-auto text-xs leading-5 text-white/45">
        Larger pressure appears where repeated habits add CO2e. Green nodes are choices that reduced impact.
      </p>
    </div>
  );
}

// ── WORLD EMISSIONS — country-aware ───────────────────────────
function WorldEmissionsPanel({ worldTonnes, profile }: { worldTonnes: number; profile: Profile }) {
  const globalPerSecond = worldCo2TonnesPerYear / (365 * 24 * 60 * 60);
  const countryData = getCountryEmissions(profile.country);
  const countryPerSecond = countryData ? (countryData.annual * 1_000_000) / (365 * 24 * 60 * 60) : null;

  // Time elapsed from the parent component's worldTonnes
  const elapsed = globalPerSecond > 0 ? worldTonnes / globalPerSecond : 0;
  const countryTonnes = countryPerSecond ? elapsed * countryPerSecond : null;

  return (
    <section className="panel overflow-hidden p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-white/45">Live global emissions</p>
          <h2 className="mt-2 font-outfit text-3xl font-medium tracking-tight">{Math.round(worldTonnes).toLocaleString("en-US")} t CO2</h2>
          {countryTonnes !== null && countryData && (
            <div className="mt-3 rounded-xl border border-sky-300/20 bg-sky-300/5 px-3 py-2">
              <p className="text-xs text-white/40">{countryData.label} this session</p>
              <p className="font-outfit text-xl font-medium tracking-tight text-sky-300">
                {Math.round(countryTonnes).toLocaleString("en-US")} t CO2
              </p>
            </div>
          )}
        </div>
        <div className="icon-tile shrink-0"><Wind size={22} /></div>
      </div>
      <div className="mt-6 h-28 overflow-hidden rounded-3xl border border-white/10 bg-[#070a0f]/55 p-3">
        <div className="flex h-full items-end gap-1">
          {Array.from({ length: 34 }).map((_, index) => (
            <motion.div
              key={index}
              className="flex-1 rounded-t-lg bg-gradient-to-t from-coral to-amber-300"
              animate={{ height: [`${22 + ((index * 7) % 44)}%`, `${42 + ((index * 11) % 48)}%`, `${22 + ((index * 7) % 44)}%`] }}
              transition={{ duration: 2.4 + index * 0.03, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/58">
        Every second, ~{Math.round(globalPerSecond).toLocaleString("en-US")} tonnes of CO2 enter the atmosphere.{" "}
        {countryData ? `${countryData.label} contributes ~${Math.round(countryPerSecond!)} t/s.` : ""}
        {" "}Source: Global Carbon Budget 2024.
      </p>
    </section>
  );
}

function ContributionPanel({ avoidedCarbon, earnedPoints }: { avoidedCarbon: number; earnedPoints: number }) {
  const treesGrown = avoidedCarbon * 0.05;
  const healthRiskReduced = avoidedCarbon * 0.012;
  return (
    <section className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-white/45">Your contribution</p>
          <h2 className="mt-2 font-outfit text-3xl font-medium tracking-tight break-words">{carbon(avoidedCarbon)} avoided</h2>
        </div>
        <div className="icon-tile shrink-0"><Sparkles size={22} /></div>
      </div>
      <p className="mt-5 text-sm leading-6 text-white/64">
        This is your visible contribution to cleaner shared air. Equivalent to {treesGrown.toFixed(1)} trees growing for a year, or reducing health risks for {Math.max(1, Math.round(healthRiskReduced))} people in high-density areas.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <MiniStat label="Compared with inaction" value={`${Math.max(1, Math.round(avoidedCarbon * 8))}% better`} />
        <MiniStat label="Points earned" value={formatPoints(earnedPoints)} />
      </div>
      <p className="mt-4 rounded-2xl bg-sage/10 p-4 text-sm leading-6 text-white/72">
        You are not saving the world alone. You are proving that a normal routine can become lighter without becoming harder.
      </p>
    </section>
  );
}

function StepHint({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
      <div className="mb-4 grid h-9 w-9 place-items-center rounded-2xl bg-sage/15 text-sm font-semibold text-sage">{number}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.16em] text-white/38">{label}</p>
      <p className="mt-2 font-outfit text-2xl font-medium tracking-tight">{value ?? "—"}</p>
    </div>
  );
}

function LogRow({ log }: { log: LogEntry }) {
  const Icon = categoryMeta[log.category].icon;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06]">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{log.label}</p>
        <p className="truncate text-xs text-white/45">{log.note}</p>
      </div>
      <div className="text-right text-xs text-white/55">
        <p className={log.points > 0 ? "text-sage" : "text-coral"}>{formatPoints(log.points)}</p>
        <p>{carbon(log.carbon)}</p>
      </div>
    </div>
  );
}

function PageTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <header className="mb-5">
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.22em] text-sage">{eyebrow}</p>
      <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-white sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-white/58">{subtitle}</p>
    </header>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-white/42">{label}</span>
      {children}
    </label>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <div className="flex h-12 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-2">
      <button className="h-9 w-9 rounded-xl bg-white/[0.06] text-lg" onClick={() => onChange(Math.max(min, value - 1))} type="button">-</button>
      <span className="font-semibold">{value}</span>
      <button className="h-9 w-9 rounded-xl bg-white/[0.06] text-lg" onClick={() => onChange(Math.min(max, value + 1))} type="button">+</button>
    </div>
  );
}

function Range({ value, min, max, step, onChange, suffix }: { value: number; min: number; max: number; step: number; onChange: (value: number) => void; suffix: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-white/38">{min}</span>
        <span className="font-medium">{suffix}</span>
      </div>
      <input className="w-full accent-[#9caf88]" type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

