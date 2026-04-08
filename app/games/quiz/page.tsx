"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import MainLayout from "../../components/MainLayout";
import { QUIZ_LEVELS } from "../constants/quizLevels";

function getStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}
function setStorage(key: string, value: string) {
  if (typeof window !== "undefined") localStorage.setItem(key, value);
}
function loadUnlocked(): number { const v = getStorage("quiz_unlocked_level"); return v ? parseInt(v, 10) : 1; }
function loadCompleted(): Set<number> { try { return new Set(JSON.parse(getStorage("quiz_completed_levels") || "[]")); } catch { return new Set(); } }
function loadHighScores(): Record<number, number> { try { return JSON.parse(getStorage("quiz_high_scores") || "{}"); } catch { return {}; } }

export default function BibleQuizPage() {
  const [screen, setScreen] = useState<"levels" | "story" | "quiz" | "result">("levels");
  const [levelId, setLevelId] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [highScores, setHighScores] = useState<Record<number, number>>({});

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setUnlockedLevel(loadUnlocked());
    setCompletedLevels(loadCompleted());
    setHighScores(loadHighScores());
    setMounted(true);
  }, []);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const level = QUIZ_LEVELS[levelId - 1];
  const question = level?.questions[questionIdx];

  const startLevel = useCallback((id: number) => {
    setLevelId(id); setQuestionIdx(0); setSelected(null); setAnswered(false); setCorrectCount(0); setShowHint(false); setScreen("story");
  }, []);

  const selectAnswer = useCallback((optIdx: number) => {
    if (answered) return;
    setSelected(optIdx); setAnswered(true);
    if (optIdx === question.correctIndex) setCorrectCount((p) => p + 1);
  }, [answered, question]);

  const nextQuestion = useCallback(() => {
    if (questionIdx + 1 < level.questions.length) {
      setQuestionIdx((p) => p + 1); setSelected(null); setAnswered(false); setShowHint(false);
    } else {
      setCompletedLevels((p) => { const next = new Set([...p, levelId]); setStorage("quiz_completed_levels", JSON.stringify([...next])); return next; });
      if (levelId >= unlockedLevel) { const next = Math.min(levelId + 1, QUIZ_LEVELS.length); setUnlockedLevel(next); setStorage("quiz_unlocked_level", String(next)); }
      setHighScores((p) => { const next = { ...p }; if (!next[levelId] || correctCount > next[levelId]) next[levelId] = correctCount; setStorage("quiz_high_scores", JSON.stringify(next)); return next; });
      setScreen("result");
    }
  }, [questionIdx, level, correctCount, levelId, unlockedLevel]);

  if (!mounted) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-16 bg-surface-container-low rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  // LEVEL SELECT
  if (screen === "levels") {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link href="/games" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-medium">Games</span>
          </Link>
          <h1 className="text-3xl font-headline text-on-surface mb-2">Bible Quiz</h1>
          <p className="text-on-surface-variant text-sm mb-6">Journey through 30 Bible stories from Creation to the Great Commission</p>

          <div className="space-y-3">
            {QUIZ_LEVELS.map((lv) => {
              const locked = lv.id > unlockedLevel;
              const completed = completedLevels.has(lv.id);
              const best = highScores[lv.id];
              return (
                <button
                  key={lv.id}
                  onClick={() => !locked && startLevel(lv.id)}
                  disabled={locked}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    locked ? "opacity-40 cursor-not-allowed border-outline-variant/10 bg-surface-container-low"
                    : "border-outline-variant/20 bg-surface-container-lowest hover:border-primary/30 editorial-shadow card-hover"
                  }`}
                >
                  <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    completed ? "border-primary bg-primary/10" : locked ? "border-outline-variant/30" : "border-primary"
                  }`}>
                    {completed ? (
                      <span className="material-symbols-outlined text-primary text-lg">check</span>
                    ) : locked ? (
                      <span className="material-symbols-outlined text-on-surface-variant/40 text-sm">lock</span>
                    ) : (
                      <span className="text-sm font-bold text-primary">{lv.id}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface">{lv.theme}</p>
                    <p className="text-xs text-on-surface-variant">{lv.title} &middot; {lv.questions.length} questions</p>
                  </div>
                  {best !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm">star</span>
                      {best}/{lv.questions.length}
                    </div>
                  )}
                  {!locked && (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${completed ? "bg-primary/10" : "bg-primary/10"}`}>
                      <span className="material-symbols-outlined text-primary text-sm">{completed ? "refresh" : "play_arrow"}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </MainLayout>
    );
  }

  // STORY
  if (screen === "story") {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <button onClick={() => setScreen("levels")} className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6">
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-medium">All Levels</span>
          </button>
          <h2 className="text-2xl font-headline text-on-surface mb-6">{level.theme}</h2>
          <div className="bg-primary/5 rounded-2xl p-6 mb-8 border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary">menu_book</span>
              <span className="text-sm font-bold text-primary">Story</span>
            </div>
            <p className="text-on-surface leading-7">{level.story}</p>
          </div>
          <button onClick={() => setScreen("quiz")} className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-primary/20">
            Start Quiz
          </button>
        </div>
      </MainLayout>
    );
  }

  // RESULT
  if (screen === "result") {
    const stars = correctCount >= level.questions.length ? 3 : correctCount >= 3 ? 2 : 1;
    const isLastLevel = levelId >= QUIZ_LEVELS.length;
    return (
      <MainLayout>
        <div className="max-w-md mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">emoji_events</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-1">Quiz Complete!</h2>
          <p className="text-on-surface-variant mb-5">{level.theme}</p>
          <div className="flex items-center justify-center gap-1 mb-5">
            {[1, 2, 3].map((n) => (
              <span key={n} className={`material-symbols-outlined text-3xl ${n <= stars ? "text-tertiary-fixed-dim" : "text-on-surface-variant/20"}`}>
                {n <= stars ? "star" : "star_outline"}
              </span>
            ))}
          </div>
          <div className="bg-surface-container-lowest rounded-2xl px-10 py-5 inline-block editorial-shadow border border-outline-variant/10 mb-8">
            <p className="text-4xl font-bold text-primary">{correctCount}/{level.questions.length}</p>
            <p className="text-xs text-on-surface-variant font-semibold mt-1">Correct Answers</p>
          </div>
          <div className="space-y-3">
            {!isLastLevel && (
              <button onClick={() => startLevel(levelId + 1)} className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">arrow_forward</span> Next Level
              </button>
            )}
            <button onClick={() => startLevel(levelId)} className="w-full border border-outline-variant/20 py-3.5 rounded-xl font-semibold text-on-surface-variant flex items-center justify-center gap-2 hover:bg-surface-container-low transition-all">
              <span className="material-symbols-outlined">refresh</span> Play Again
            </button>
            <button onClick={() => setScreen("levels")} className="text-primary font-semibold py-2">All Levels</button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // QUIZ
  const getOptionStyle = (optIdx: number) => {
    if (!answered) return "border-outline-variant/20 bg-surface-container-lowest hover:border-primary/40";
    if (optIdx === question.correctIndex) return "border-primary bg-primary/10";
    if (optIdx === selected) return "border-error bg-error/10";
    return "border-outline-variant/10 bg-surface-container-low opacity-50";
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setScreen("levels")} className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="font-headline text-lg text-on-surface">{level.theme}</h2>
          <span className="text-sm font-bold text-on-surface-variant">{questionIdx + 1}/{level.questions.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-8">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((questionIdx + (answered ? 1 : 0)) / level.questions.length) * 100}%` }} />
        </div>

        <p className="text-lg font-semibold text-on-surface leading-7 mb-6">{question.question}</p>

        <div className="space-y-3 mb-6">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => selectAnswer(i)}
              disabled={answered}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${getOptionStyle(i)}`}
            >
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                answered && i === question.correctIndex ? "border-primary bg-primary/10"
                : answered && i === selected ? "border-error bg-error/10"
                : "border-outline-variant/30"
              }`}>
                <span className={`text-xs font-bold ${
                  answered && i === question.correctIndex ? "text-primary"
                  : answered && i === selected ? "text-error"
                  : "text-on-surface-variant"
                }`}>{String.fromCharCode(65 + i)}</span>
              </div>
              <span className="flex-1 text-sm text-on-surface">{opt}</span>
              {answered && i === question.correctIndex && <span className="material-symbols-outlined text-primary">check_circle</span>}
              {answered && i === selected && i !== question.correctIndex && <span className="material-symbols-outlined text-error">cancel</span>}
            </button>
          ))}
        </div>

        {!answered && !showHint && (
          <button onClick={() => setShowHint(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-tertiary-fixed/15 border border-tertiary-fixed/30 text-tertiary-fixed-dim font-semibold text-sm hover:bg-tertiary-fixed/25 transition-all">
            <span className="material-symbols-outlined text-lg">lightbulb</span> Show Hint
          </button>
        )}

        {showHint && !answered && (
          <div className="bg-tertiary-fixed/10 rounded-xl p-4 border border-tertiary-fixed/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-sm">lightbulb</span>
              <span className="text-xs font-bold text-tertiary-fixed-dim">HINT</span>
            </div>
            <p className="text-sm text-on-surface">{question.hint}</p>
          </div>
        )}

        {answered && (
          <button onClick={nextQuestion} className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-base mt-4 hover:opacity-90 transition-all shadow-lg shadow-primary/20">
            {questionIdx + 1 < level.questions.length ? "Next Question" : "See Results"}
          </button>
        )}
      </div>
    </MainLayout>
  );
}
