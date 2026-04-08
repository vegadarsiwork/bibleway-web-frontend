"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import MainLayout from "../../components/MainLayout";
import { LEVELS, type WordData } from "../constants/crosswordLevels";

/* ------------------------------------------------------------------ */
/*  Persistence                                                        */
/* ------------------------------------------------------------------ */

const LS_UNLOCKED = "rapidfire_unlocked_level";
const LS_COMPLETED = "rapidfire_completed_levels";

function getStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}
function setStorage(key: string, value: string) {
  if (typeof window !== "undefined") localStorage.setItem(key, value);
}
function loadUnlocked(): number {
  const v = getStorage(LS_UNLOCKED);
  return v ? parseInt(v, 10) : 1;
}
function loadCompleted(): Set<number> {
  try {
    return new Set(JSON.parse(getStorage(LS_COMPLETED) || "[]"));
  } catch {
    return new Set();
  }
}

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                    */
/* ------------------------------------------------------------------ */

interface LetterTile {
  id: string;
  letter: string;
  used: boolean;
}

const DISTRACTOR_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SECONDS_PER_WORD = 15;
const HINT_COST = 30;
const BASE_WORD_POINTS = 100;
const MIN_WORD_POINTS = 40;
const TIME_BONUS_PER_SECOND = 2;
const MAX_HINTS_PER_WORD = 2;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeBank(word: string): LetterTile[] {
  const unique = new Set(word.split(""));
  const distractors = shuffle(
    DISTRACTOR_POOL.split("").filter((c) => !unique.has(c))
  ).slice(0, Math.min(3, 12 - word.length));
  return shuffle([...word.split(""), ...distractors]).map((letter, i) => ({
    id: `${i}-${letter}-${Math.random().toString(36).slice(2, 6)}`,
    letter,
    used: false,
  }));
}

/* ------------------------------------------------------------------ */
/*  CSS keyframes (injected once)                                      */
/* ------------------------------------------------------------------ */

const KEYFRAMES_ID = "rapidfire-keyframes";

function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement("style");
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes rf-shake {
      0%, 100% { transform: translateX(0); }
      10% { transform: translateX(-8px); }
      20% { transform: translateX(8px); }
      30% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      50% { transform: translateX(-4px); }
      60% { transform: translateX(4px); }
      70% { transform: translateX(-2px); }
      80% { transform: translateX(2px); }
    }
    @keyframes rf-pop {
      0% { transform: scale(1); }
      40% { transform: scale(1.08); }
      100% { transform: scale(1); }
    }
    @keyframes rf-letter-in {
      0% { transform: scale(0.3); opacity: 0; }
      60% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes rf-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.55; }
    }
    .rf-shake { animation: rf-shake 0.5s ease-in-out; }
    .rf-pop   { animation: rf-pop 0.5s ease-out; }
    .rf-letter-in { animation: rf-letter-in 0.2s ease-out; }
    .rf-pulse { animation: rf-pulse 1s ease-in-out infinite; }
  `;
  document.head.appendChild(style);
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function RapidFirePage() {
  const [screen, setScreen] = useState<"levels" | "play" | "result">("levels");
  const [levelId, setLevelId] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    setUnlockedLevel(loadUnlocked());
    setCompletedLevels(loadCompleted());
    setMounted(true);
  }, []);

  // Game state
  const [wordIdx, setWordIdx] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [input, setInput] = useState<string[]>([]);
  const [bank, setBank] = useState<LetterTile[]>([]);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const [hintsThisWord, setHintsThisWord] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finalTimeLeft, setFinalTimeLeft] = useState(0);
  const [didWin, setDidWin] = useState(false);

  const level = LEVELS[levelId - 1];
  const word: WordData | undefined = level?.words[wordIdx];

  // Inject CSS keyframes on mount
  useEffect(() => {
    injectKeyframes();
  }, []);

  /* ---- Timer ---- */
  useEffect(() => {
    if (screen !== "play") return;
    if (timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(t);
  }, [screen, timeLeft]);

  // Time-out → result
  useEffect(() => {
    if (screen !== "play") return;
    if (timeLeft === 0) {
      setFinalTimeLeft(0);
      setDidWin(false);
      setScreen("result");
    }
  }, [timeLeft, screen]);

  /* ---- Game actions ---- */

  const startLevel = useCallback((id: number) => {
    const lv = LEVELS[id - 1];
    if (!lv) return;
    setLevelId(id);
    setWordIdx(0);
    setSolvedCount(0);
    setScore(0);
    setHintsThisWord(0);
    setFeedback("idle");
    setInput([]);
    setBank(makeBank(lv.words[0].word));
    setTimeLeft(lv.words.length * SECONDS_PER_WORD);
    setDidWin(false);
    setScreen("play");
  }, []);

  // Reset bank/input when wordIdx changes (but not on level start — handled above)
  const advanceToWord = useCallback((nextIdx: number) => {
    const lv = LEVELS[levelId - 1];
    if (!lv) return;
    setWordIdx(nextIdx);
    setBank(makeBank(lv.words[nextIdx].word));
    setInput([]);
    setHintsThisWord(0);
    setFeedback("idle");
  }, [levelId]);

  const tapTile = useCallback(
    (id: string, letter: string) => {
      if (!word) return;
      if (feedback === "correct") return;
      if (input.length >= word.word.length) return;
      setInput((p) => [...p, letter]);
      setBank((p) => p.map((t) => (t.id === id ? { ...t, used: true } : t)));
    },
    [input.length, word, feedback]
  );

  // Keyboard-input flavor: pick the first unused tile matching this letter
  const tapLetterByKey = useCallback(
    (rawLetter: string) => {
      if (!word) return;
      if (feedback === "correct") return;
      if (input.length >= word.word.length) return;
      const letter = rawLetter.toUpperCase();
      const tile = bank.find((t) => !t.used && t.letter === letter);
      if (!tile) return;
      setInput((p) => [...p, letter]);
      setBank((p) =>
        p.map((t) => (t.id === tile.id ? { ...t, used: true } : t))
      );
    },
    [bank, input.length, word, feedback]
  );

  const deleteLast = useCallback(() => {
    if (!input.length || feedback === "correct") return;
    const last = input[input.length - 1];
    setBank((p) => {
      const n = [...p];
      for (let i = n.length - 1; i >= 0; i--) {
        if (n[i].used && n[i].letter === last) {
          n[i] = { ...n[i], used: false };
          break;
        }
      }
      return n;
    });
    setInput((p) => p.slice(0, -1));
  }, [input, feedback]);

  const clearAll = useCallback(() => {
    if (!input.length || feedback === "correct") return;
    setBank((p) => p.map((t) => ({ ...t, used: false })));
    setInput([]);
  }, [input, feedback]);

  const useHint = useCallback(() => {
    if (!word || feedback === "correct") return;
    const next = input.length;
    if (next >= word.word.length || hintsThisWord >= MAX_HINTS_PER_WORD) return;
    const needed = word.word[next];
    const tile = bank.find((t) => !t.used && t.letter === needed);
    if (!tile) return;
    setHintsThisWord((h) => h + 1);
    tapTile(tile.id, tile.letter);
  }, [input.length, word, bank, tapTile, hintsThisWord, feedback]);

  const checkAnswer = useCallback(() => {
    if (!word || input.length < word.word.length) return;
    if (feedback === "correct") return;
    if (input.join("") === word.word) {
      setFeedback("correct");
      const wordPoints = Math.max(
        MIN_WORD_POINTS,
        BASE_WORD_POINTS - hintsThisWord * HINT_COST
      );
      setScore((p) => p + wordPoints);
      const newSolved = solvedCount + 1;
      setSolvedCount(newSolved);

      setTimeout(() => {
        if (newSolved >= level.words.length) {
          // Level complete — bank time bonus & finalize
          setFinalTimeLeft(timeLeft);
          setScore((p) => p + timeLeft * TIME_BONUS_PER_SECOND);
          setDidWin(true);
          setCompletedLevels((p) => {
            const next = new Set([...p, levelId]);
            setStorage(LS_COMPLETED, JSON.stringify([...next]));
            return next;
          });
          if (levelId >= unlockedLevel) {
            const next = Math.min(levelId + 1, LEVELS.length);
            setUnlockedLevel(next);
            setStorage(LS_UNLOCKED, String(next));
          }
          setScreen("result");
        } else {
          advanceToWord(wordIdx + 1);
        }
      }, 500);
    } else {
      setFeedback("wrong");
      setTimeout(() => {
        // Wrong answer → clear and let them try again
        setBank((p) => p.map((t) => ({ ...t, used: false })));
        setInput([]);
        setFeedback("idle");
      }, 500);
    }
  }, [
    input,
    word,
    wordIdx,
    level,
    levelId,
    hintsThisWord,
    solvedCount,
    unlockedLevel,
    timeLeft,
    feedback,
    advanceToWord,
  ]);

  /* ---- Keyboard handling (desktop) ---- */
  useEffect(() => {
    if (screen !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      // Don't hijack typing in real form fields
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        deleteLast();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        checkAnswer();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        clearAll();
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        tapLetterByKey(e.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, deleteLast, checkAnswer, clearAll, tapLetterByKey]);

  /* ================================================================ */
  /*  LEVEL SELECT SCREEN                                              */
  /* ================================================================ */

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

  if (screen === "levels") {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link
            href="/games"
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="text-sm font-medium">Games</span>
          </Link>
          <h1 className="text-3xl font-headline text-on-surface mb-2">
            Bible Rapid Fire
          </h1>
          <p className="text-on-surface-variant text-sm mb-6">
            Beat the clock — answer all the clues before time runs out.
          </p>

          <div className="space-y-3">
            {LEVELS.map((lv) => {
              const locked = lv.id > unlockedLevel;
              const completed = completedLevels.has(lv.id);
              const seconds = lv.words.length * SECONDS_PER_WORD;
              return (
                <button
                  key={lv.id}
                  onClick={() => !locked && startLevel(lv.id)}
                  disabled={locked}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    locked
                      ? "opacity-40 cursor-not-allowed border-outline-variant/10 bg-surface-container-low"
                      : "border-outline-variant/20 bg-surface-container-lowest hover:border-primary/30 editorial-shadow card-hover"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      completed
                        ? "border-primary bg-primary/10"
                        : locked
                          ? "border-outline-variant/30"
                          : "border-primary"
                    }`}
                  >
                    {completed ? (
                      <span className="material-symbols-outlined text-primary text-lg">check</span>
                    ) : locked ? (
                      <span className="material-symbols-outlined text-on-surface-variant/40 text-sm">lock</span>
                    ) : (
                      <span className="text-sm font-bold text-primary">{lv.id}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface">{lv.theme}</p>
                    <p className="text-xs text-on-surface-variant">
                      {lv.words.length} questions &middot; {formatTime(seconds)}
                    </p>
                  </div>
                  {!locked && (
                    <span className="material-symbols-outlined text-primary text-sm">
                      {completed ? "refresh" : "play_arrow"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </MainLayout>
    );
  }

  /* ================================================================ */
  /*  RESULT SCREEN                                                    */
  /* ================================================================ */

  if (screen === "result") {
    const isLastLevel = levelId >= LEVELS.length;
    const maxScore = level.words.length * BASE_WORD_POINTS;
    const stars = didWin
      ? score >= maxScore * 0.9
        ? 3
        : score >= maxScore * 0.6
          ? 2
          : 1
      : 0;

    return (
      <MainLayout>
        <div className="max-w-md mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 text-center">
          {/* Trophy / Time-out icon */}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              didWin ? "bg-primary/10" : "bg-red-50"
            }`}
          >
            <span
              className={`material-symbols-outlined text-4xl ${
                didWin ? "text-primary" : "text-red-500"
              }`}
            >
              {didWin ? "emoji_events" : "timer_off"}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-on-surface mb-1">{level.theme}</h2>
          <p className="text-on-surface-variant mb-5">
            {didWin ? "Level Complete!" : "Time's Up!"}
          </p>

          {/* Stars (only on win) */}
          {didWin && (
            <div className="flex items-center justify-center gap-1 mb-5">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`material-symbols-outlined text-3xl ${
                    n <= stars ? "text-yellow-500" : "text-on-surface-variant/20"
                  }`}
                >
                  star
                </span>
              ))}
            </div>
          )}

          {/* Score card */}
          <div className="flex items-stretch bg-surface-container-lowest rounded-2xl border border-outline-variant/10 editorial-shadow mb-3 mx-auto max-w-xs">
            <div className="flex-1 flex flex-col items-center py-4">
              <span className="material-symbols-outlined text-yellow-500 text-xl mb-1">
                emoji_events
              </span>
              <p className="text-xl font-bold text-on-surface">{score}</p>
              <p className="text-xs text-on-surface-variant">Points</p>
            </div>
            <div className="w-px bg-outline-variant/10" />
            <div className="flex-1 flex flex-col items-center py-4">
              <span className="material-symbols-outlined text-primary text-xl mb-1">
                check_circle
              </span>
              <p className="text-xl font-bold text-on-surface">
                {solvedCount}/{level.words.length}
              </p>
              <p className="text-xs text-on-surface-variant">Solved</p>
            </div>
          </div>

          {didWin && finalTimeLeft > 0 && (
            <p className="text-xs text-on-surface-variant mb-8">
              Time bonus: +{finalTimeLeft * TIME_BONUS_PER_SECOND} pts
              ({finalTimeLeft}s left)
            </p>
          )}
          {!didWin && <div className="mb-8" />}

          {/* Action buttons */}
          <div className="space-y-3">
            {didWin && !isLastLevel && (
              <button
                onClick={() => startLevel(levelId + 1)}
                className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                Next Level
              </button>
            )}
            <button
              onClick={() => startLevel(levelId)}
              className="w-full border border-outline-variant/20 py-3.5 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-container-low transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              {didWin ? "Play Again" : "Try Again"}
            </button>
            <button
              onClick={() => setScreen("levels")}
              className="text-primary font-semibold py-2"
            >
              All Levels
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  /* ================================================================ */
  /*  PLAY / GAME SCREEN                                               */
  /* ================================================================ */

  if (!word) return null;

  const feedbackAnimClass =
    feedback === "wrong" ? "rf-shake" : feedback === "correct" ? "rf-pop" : "";

  const timeLow = timeLeft <= 10;
  const timePct = Math.max(
    0,
    Math.min(100, (timeLeft / (level.words.length * SECONDS_PER_WORD)) * 100)
  );

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col min-h-[calc(100dvh-4rem)] sm:min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setScreen("levels")}
            className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
            <span className="text-sm font-medium hidden sm:inline">Levels</span>
          </button>
          <h2 className="font-headline text-lg text-on-surface truncate px-2">
            {level.theme}
          </h2>
          <div className="flex items-center gap-1.5 bg-surface-container-lowest rounded-full px-3 py-1.5 border border-outline-variant/10">
            <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
            <span className="text-sm font-bold text-on-surface">{score}</span>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className={`material-symbols-outlined text-xl ${
              timeLow ? "text-red-500 rf-pulse" : "text-on-surface-variant"
            }`}
          >
            timer
          </span>
          <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                timeLow ? "bg-red-500" : "bg-primary"
              }`}
              style={{ width: `${timePct}%` }}
            />
          </div>
          <span
            className={`text-sm font-bold tabular-nums whitespace-nowrap ${
              timeLow ? "text-red-500" : "text-on-surface"
            }`}
          >
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Question progress */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/70 rounded-full transition-all duration-500"
              style={{
                width: `${(solvedCount / level.words.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">
            {solvedCount}/{level.words.length}
          </span>
        </div>

        {/* Question card */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 editorial-shadow mb-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1">
              Question {solvedCount + 1}
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              {word.word.length} letters
            </span>
          </div>
          <p className="text-base sm:text-lg text-on-surface leading-relaxed">
            {word.hint}
          </p>
        </div>

        {/* Spacer (mobile only — pushes input boxes toward middle) */}
        <div className="flex-1 sm:hidden" />

        {/* Letter input boxes */}
        <div
          className={`flex items-center justify-center flex-wrap gap-2 sm:gap-2 mb-5 px-2 ${feedbackAnimClass}`}
          key={`input-${levelId}-${wordIdx}-${feedback}`}
        >
          {word.word.split("").map((_, i) => {
            const isFilled = !!input[i];
            const borderColor =
              feedback === "correct"
                ? "border-green-500"
                : feedback === "wrong"
                  ? "border-red-400"
                  : isFilled
                    ? "border-primary"
                    : "border-outline-variant/25";
            const bgColor =
              feedback === "correct"
                ? "bg-green-50"
                : feedback === "wrong"
                  ? "bg-red-50"
                  : isFilled
                    ? "bg-primary/5"
                    : "bg-surface-container-lowest";

            return (
              <div
                key={i}
                className={`flex items-center justify-center rounded-xl border-2 transition-all w-11 h-14 sm:w-12 sm:h-14 ${borderColor} ${bgColor}`}
              >
                {input[i] ? (
                  <span className="text-2xl font-bold text-on-surface rf-letter-in">
                    {input[i]}
                  </span>
                ) : (
                  <span className="block w-3 h-0.5 rounded-full bg-on-surface-variant/20" />
                )}
              </div>
            );
          })}
        </div>

        {/* Spacer (mobile only — pushes bank+controls toward bottom) */}
        <div className="flex-1 sm:hidden" />

        {/* Letter bank */}
        <div className="flex flex-wrap justify-center gap-2 mb-5 px-2">
          {bank.map((tile) => (
            <button
              key={tile.id}
              disabled={tile.used}
              onClick={() => tapTile(tile.id, tile.letter)}
              className={`flex items-center justify-center rounded-xl font-bold transition-all select-none w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl ${
                tile.used
                  ? "bg-surface-container text-on-surface-variant/20 cursor-default opacity-30"
                  : "bg-primary text-on-primary hover:opacity-90 active:scale-95 shadow-md shadow-primary/20 cursor-pointer"
              }`}
            >
              {tile.letter}
            </button>
          ))}
        </div>

        {/* Desktop hint */}
        <p className="hidden sm:block text-center text-[11px] text-on-surface-variant/60 mb-3">
          Type letters &middot; Backspace to delete &middot; Enter to submit &middot; Esc to clear
        </p>

        {/* Action buttons row */}
        <div className="flex gap-2.5 mb-4">
          <button
            onClick={deleteLast}
            className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 text-on-surface-variant hover:bg-surface-container-low transition-all"
          >
            <span className="material-symbols-outlined text-xl">backspace</span>
          </button>
          <button
            onClick={clearAll}
            className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 text-on-surface-variant hover:bg-surface-container-low transition-all"
          >
            <span className="material-symbols-outlined text-xl">close</span>
            <span className="text-sm font-semibold hidden sm:inline">Clear</span>
          </button>
          <button
            onClick={useHint}
            disabled={hintsThisWord >= MAX_HINTS_PER_WORD}
            className="flex-1 flex items-center justify-center gap-1.5 h-12 rounded-2xl bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-xl">lightbulb</span>
            <span className="text-sm font-semibold">Hint</span>
            <span className="text-[10px] text-yellow-500 font-medium">
              {MAX_HINTS_PER_WORD - hintsThisWord}
            </span>
          </button>
        </div>

        {/* Check Answer button */}
        <button
          onClick={checkAnswer}
          disabled={!word || input.length < word.word.length}
          className="w-full h-14 rounded-2xl bg-primary text-on-primary font-bold text-base tracking-wide hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Check Answer
        </button>
      </div>
    </MainLayout>
  );
}
