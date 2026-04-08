"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import MainLayout from "../../components/MainLayout";
import { FTD_LEVELS } from "../constants/findDifferenceLevels";

function getStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}
function setStorage(key: string, value: string) {
  if (typeof window !== "undefined") localStorage.setItem(key, value);
}
function loadUnlocked(): number {
  const v = getStorage("ftd_unlocked_level");
  return v ? parseInt(v, 10) : 1;
}
function loadCompleted(): Set<number> {
  try { return new Set(JSON.parse(getStorage("ftd_completed_levels") || "[]")); } catch { return new Set(); }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FindDifferencePage() {
  const [screen, setScreen] = useState<"levels" | "game" | "result">("levels");
  const [levelId, setLevelId] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setUnlockedLevel(loadUnlocked());
    setCompletedLevels(loadCompleted());
    setMounted(true);
  }, []);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [zoomImg, setZoomImg] = useState<number | null>(null);

  const level = FTD_LEVELS[levelId - 1];
  const correctSet = useMemo(() => new Set(level?.correct), [levelId]);
  const options = useMemo(() => level ? shuffle([...level.correct, ...level.wrong]) : [], [levelId]);

  const startLevel = useCallback((id: number) => {
    setLevelId(id);
    setSelected(new Set());
    setSubmitted(false);
    setZoomImg(null);
    setScreen("game");
  }, []);

  const toggleOption = useCallback((option: string) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return next;
    });
  }, [submitted]);

  const handleSubmit = useCallback(() => {
    if (submitted) return;
    setSubmitted(true);
    const allCorrect = level.correct.every((c) => selected.has(c));
    const noWrong = level.wrong.every((w) => !selected.has(w));
    if (allCorrect && noWrong) {
      setCompletedLevels((p) => {
        const next = new Set([...p, levelId]);
        setStorage("ftd_completed_levels", JSON.stringify([...next]));
        return next;
      });
      if (levelId >= unlockedLevel) {
        const next = Math.min(levelId + 1, FTD_LEVELS.length);
        setUnlockedLevel(next);
        setStorage("ftd_unlocked_level", String(next));
      }
      setTimeout(() => setScreen("result"), 1200);
    }
  }, [submitted, selected, level, levelId, unlockedLevel]);

  const correctCount = useMemo(() => {
    let count = 0;
    selected.forEach((s) => { if (correctSet.has(s)) count++; });
    return count;
  }, [selected, correctSet]);

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
          <h1 className="text-3xl font-headline text-on-surface mb-2">Find the Difference</h1>
          <p className="text-on-surface-variant text-sm mb-6">Compare two pictures and pick the differences from the options</p>

          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {FTD_LEVELS.map((lv) => {
              const locked = lv.id > unlockedLevel;
              const completed = completedLevels.has(lv.id);
              return (
                <button
                  key={lv.id}
                  onClick={() => !locked && startLevel(lv.id)}
                  disabled={locked}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    completed ? "border-primary bg-primary/10"
                    : locked ? "border-outline-variant/20 bg-surface-container-low opacity-40 cursor-not-allowed"
                    : "border-primary bg-surface-container-lowest hover:bg-primary/5 card-hover"
                  }`}
                >
                  {completed ? <span className="material-symbols-outlined text-primary">check_circle</span>
                  : locked ? <span className="material-symbols-outlined text-on-surface-variant/40 text-sm">lock</span>
                  : <span className="text-lg font-bold text-primary">{lv.id}</span>}
                  <span className={`text-[10px] font-semibold mt-0.5 ${completed ? "text-primary" : locked ? "text-on-surface-variant/40" : "text-primary"}`}>{lv.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </MainLayout>
    );
  }

  // RESULT
  if (screen === "result") {
    const isLastLevel = levelId >= FTD_LEVELS.length;
    return (
      <MainLayout>
        <div className="max-w-md mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">visibility</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface mb-1">Well Done!</h2>
          <p className="text-on-surface-variant mb-8">You found all {level.correct.length} differences</p>
          <div className="space-y-3">
            {!isLastLevel && (
              <button onClick={() => startLevel(levelId + 1)} className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                <span className="material-symbols-outlined">arrow_forward</span> Next Level
              </button>
            )}
            <button onClick={() => startLevel(levelId)} className="w-full border border-outline-variant/20 py-3.5 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-container-low transition-all">Try Again</button>
            <button onClick={() => setScreen("levels")} className="text-primary font-semibold py-2">All Levels</button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // GAME
  const getOptionStyle = (option: string) => {
    const isSelected = selected.has(option);
    const isCorrect = correctSet.has(option);
    if (!submitted) {
      return isSelected ? "border-primary bg-primary/5" : "border-outline-variant/20 bg-surface-container-lowest hover:border-primary/30";
    }
    if (isCorrect && isSelected) return "border-primary bg-primary/10";
    if (isCorrect && !isSelected) return "border-tertiary-fixed-dim bg-tertiary-fixed/10";
    if (!isCorrect && isSelected) return "border-error bg-error/10";
    return "border-outline-variant/10 bg-surface-container-low opacity-50";
  };

  const getOptionIcon = (option: string) => {
    const isSelected = selected.has(option);
    const isCorrect = correctSet.has(option);
    if (!submitted) return isSelected ? "check_box" : "check_box_outline_blank";
    if (isCorrect && isSelected) return "check_circle";
    if (isCorrect && !isSelected) return "error";
    if (!isCorrect && isSelected) return "cancel";
    return "check_box_outline_blank";
  };

  const getOptionIconColor = (option: string) => {
    const isSelected = selected.has(option);
    const isCorrect = correctSet.has(option);
    if (!submitted) return isSelected ? "text-primary" : "text-on-surface-variant/30";
    if (isCorrect && isSelected) return "text-primary";
    if (isCorrect && !isSelected) return "text-tertiary-fixed-dim";
    if (!isCorrect && isSelected) return "text-error";
    return "text-on-surface-variant/30";
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setScreen("levels")} className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="font-headline text-lg text-on-surface">Level {levelId}</h2>
          <span className="text-sm font-bold text-primary">{correctCount}/{level.correct.length}</span>
        </div>

        {/* Images side by side on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-on-surface-variant">Image 1</span>
              <button onClick={() => setZoomImg(1)} className="text-xs text-primary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">zoom_in</span> Zoom
              </button>
            </div>
            <button onClick={() => setZoomImg(1)} className="w-full rounded-xl overflow-hidden border border-outline-variant/20 hover:border-primary/30 transition-all">
              <img src={`/games/find-the-difference/lvl${levelId}_img1.png`} alt="Image 1" className="w-full" />
            </button>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-on-surface-variant">Image 2</span>
              <button onClick={() => setZoomImg(2)} className="text-xs text-primary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">zoom_in</span> Zoom
              </button>
            </div>
            <button onClick={() => setZoomImg(2)} className="w-full rounded-xl overflow-hidden border border-outline-variant/20 hover:border-primary/30 transition-all">
              <img src={`/games/find-the-difference/lvl${levelId}_img2.png`} alt="Image 2" className="w-full" />
            </button>
          </div>
        </div>

        <p className="text-sm text-on-surface-variant text-center mb-4">
          Select the {level.correct.length} items that are different between the images
        </p>

        {/* Options */}
        <div className="space-y-2 mb-6">
          {options.map((option) => (
            <button
              key={`${levelId}-${option}`}
              onClick={() => toggleOption(option)}
              disabled={submitted}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${getOptionStyle(option)}`}
            >
              <span className={`material-symbols-outlined ${getOptionIconColor(option)}`}>{getOptionIcon(option)}</span>
              <span className="text-sm font-semibold text-on-surface flex-1">{option}</span>
            </button>
          ))}
        </div>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selected.size === 0}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-base hover:opacity-90 transition-all disabled:opacity-30"
          >
            Check Answers
          </button>
        ) : !(level.correct.every((c) => selected.has(c)) && level.wrong.every((w) => !selected.has(w))) && (
          <div className="space-y-3">
            <div className="bg-error/10 rounded-xl p-4 border border-error/20 text-center">
              <p className="text-sm text-error font-semibold">Not quite right! Check the highlighted answers above.</p>
            </div>
            <button onClick={() => startLevel(levelId)} className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold hover:opacity-90 transition-all">
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {zoomImg !== null && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center" onClick={() => setZoomImg(null)}>
          <button onClick={() => setZoomImg(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 z-10">
            <span className="material-symbols-outlined">close</span>
          </button>
          <p className="absolute top-8 left-0 right-0 text-center text-white/60 text-sm font-semibold z-10">
            Click to close &middot; Image {zoomImg}
          </p>
          <div className="max-w-4xl max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <img
              src={`/games/find-the-difference/lvl${levelId}_img${zoomImg}.png`}
              alt={`Image ${zoomImg} zoomed`}
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </MainLayout>
  );
}
