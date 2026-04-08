"use client";

import Link from "next/link";
import MainLayout from "../components/MainLayout";

const GAMES: { id: string; title: string; description: string; icon: string; href: string; players: string; comingSoon?: boolean }[] = [
  {
    id: "tic-tac-toe",
    title: "Tic Tac Toe",
    description: "The classic game of crosses and circles. Play solo against the computer or with a friend!",
    icon: "grid_on",
    href: "/games/tic-tac-toe",
    players: "1-2 Players",
  },
  {
    id: "bible-quiz",
    title: "Bible Quiz",
    description: "Read Bible stories and answer comprehension questions. 30 levels from Creation to the Great Commission!",
    icon: "quiz",
    href: "/games/quiz",
    players: "1 Player",
  },
  {
    id: "bible-rapidfire",
    title: "Bible Rapid Fire",
    description: "Beat the clock! Answer rapid-fire Bible clues before time runs out. Hints available.",
    icon: "bolt",
    href: "/games/rapidfire",
    players: "1 Player",
  },
  {
    id: "find-difference",
    title: "Find the Difference",
    description: "Spot the hidden differences between two Bible-themed pictures. 30 levels!",
    icon: "visibility",
    href: "/games/find-difference",
    players: "1 Player",
  },
];

export default function GamesPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-headline text-on-surface mb-2">Games</h1>
        <p className="text-on-surface-variant mb-8">Rejoice and have fun with these Bible-themed games</p>

        <div className="space-y-4">
          {GAMES.map((game) => (
            <Link
              key={game.id}
              href={game.comingSoon ? "#" : game.href}
              onClick={(e) => game.comingSoon && e.preventDefault()}
              className={`flex items-center gap-5 p-5 rounded-xl bg-surface-container-lowest editorial-shadow border border-outline-variant/10 transition-all ${
                game.comingSoon ? "opacity-50 cursor-not-allowed" : "hover:border-primary/30 hover:shadow-lg card-hover"
              }`}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">{game.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline text-lg text-on-surface">{game.title}</h3>
                  {game.comingSoon && (
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-tertiary/20 text-tertiary px-2 py-0.5 rounded-full">Soon</span>
                  )}
                </div>
                <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-2">{game.description}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="material-symbols-outlined text-on-surface-variant text-xs">group</span>
                  <span className="text-xs text-on-surface-variant">{game.players}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant shrink-0">chevron_right</span>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
