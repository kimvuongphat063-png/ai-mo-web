"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Play,
  Maximize2,
  Volume2,
  Gamepad2,
  Download,
  Lock,
} from "lucide-react";
import type { GameItem, CollectionItem } from "@/lib/games-data";
import { triggerCoffeePopup } from "./donate-coffee";

interface Props {
  games: GameItem[];
  collections: CollectionItem[];
  isLoggedIn?: boolean;
}

export function GamesClientView({ games, collections, isLoggedIn }: Props) {
  const [search, setSearch] = useState("");
  const [activeCollection, setActiveCollection] = useState<string>("all");
  const [activeModalGame, setActiveModalGame] = useState<GameItem | null>(null);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModalGame(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter games based on collection and search
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchCol = activeCollection === "all" || game.collection === activeCollection;
      if (!matchCol) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      const matchTitle = game.title.toLowerCase().includes(q);
      const matchBlurb = game.blurb.toLowerCase().includes(q);
      const matchSlug = game.slug.toLowerCase().includes(q);
      return matchTitle || matchBlurb || matchSlug;
    });
  }, [games, activeCollection, search]);

  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: games.length };
    games.forEach((g) => {
      counts[g.collection] = (counts[g.collection] || 0) + 1;
    });
    return counts;
  }, [games]);

  return (
    <div className="space-y-8" id="danh-sach-game">
      {/* ── FILTER & SEARCH TOOLBAR ────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 p-4 sm:p-6 shadow-xs space-y-4">
        {/* Search Bar & Quick Count */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên trò chơi, kỹ năng (ví dụ: cờ, toán, từ vựng)..."
              aria-label="Tìm kiếm trò chơi"
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white text-neutral-900 placeholder:text-neutral-400 rounded-2xl border border-neutral-200 focus:border-[#0057ff] focus:ring-2 focus:ring-[#0057ff]/15 outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Xóa tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs font-bold p-1"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 shrink-0 self-end sm:self-center">
            <Gamepad2 className="w-4 h-4 text-[#0057ff]" />
            <span>
              Hiển thị <strong className="text-neutral-900">{filteredGames.length}</strong> / {games.length} game
            </span>
          </div>
        </div>

        {/* Collections Tab Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setActiveCollection("all")}
            className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeCollection === "all"
                ? "bg-[#0057ff] text-white shadow-sm shadow-[#0057ff]/25"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900"
            }`}
          >
            <span>Tất cả</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeCollection === "all" ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-700"
              }`}
            >
              {collectionCounts.all}
            </span>
          </button>

          {collections.map((col) => {
            const isSelected = activeCollection === col.id;
            const count = collectionCounts[col.id] || 0;
            if (count === 0) return null;

            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setActiveCollection(col.id)}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#0057ff] text-white shadow-sm shadow-[#0057ff]/25"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900"
                }`}
              >
                <span>{col.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── GAMES GRID ─────────────────────────────────────────────────── */}
      {filteredGames.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900">Không tìm thấy trò chơi phù hợp</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Thử tìm với từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ 65 game trong kho.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setActiveCollection("all");
            }}
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors"
          >
            Xem toàn bộ 65 game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredGames.map((game) => {
            const playUrl = `/games/play.html?g=${encodeURIComponent(game.slug)}`;
            const iconUrl = `/games/${game.icon}`;

            return (
              <div
                key={game.slug}
                className="group bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/90 hover:border-[#0057ff]/40 p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Icon + Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/60 shrink-0 group-hover:scale-105 transition-transform">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={iconUrl}
                        alt={game.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to placeholder if icon missing
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0057ff] border border-blue-200/50">
                        {game.ages ? `Độ tuổi: ${game.ages}` : "Mọi lứa tuổi"}
                      </span>
                      {game.voice && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Volume2 className="w-3 h-3 text-emerald-600" />
                          Giọng nói AI
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-extrabold text-neutral-900 group-hover:text-[#0057ff] transition-colors leading-snug line-clamp-1">
                      {game.title}
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2 min-h-[34px]">
                      {game.blurb}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3.5 mt-2 border-t border-neutral-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModalGame(game)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#0057ff] hover:bg-[#0043c7] text-white text-xs font-bold transition-all shadow-sm shadow-[#0057ff]/20 active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Chơi ngay</span>
                    </button>

                    <a
                      href={playUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Mở toàn màn hình trong tab mới"
                      className="p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <a
                    href={isLoggedIn ? `/api/games/${game.slug}/download` : `/login?next=${encodeURIComponent("/games")}`}
                    onClick={() => {
                      if (isLoggedIn) {
                        triggerCoffeePopup("download");
                      }
                    }}
                    title={isLoggedIn ? `Tải game offline ${game.slug}.zip về máy` : "Đăng nhập để tải game"}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      isLoggedIn
                        ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs"
                        : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                    }`}
                  >
                    {isLoggedIn ? (
                      <>
                        <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Tải game offline (.zip)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200/70 text-emerald-900 font-mono">ZIP</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Đăng nhập để tải game (.zip)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/70 text-amber-900">Free</span>
                      </>
                    )}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── IN-PAGE GAME MODAL PLAYER ───────────────────────────────────── */}
      {activeModalGame && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeModalGame.title}
          className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-5xl h-[92vh] sm:h-[88vh] bg-neutral-900 rounded-3xl overflow-hidden flex flex-col border border-neutral-700/80 shadow-2xl">
            {/* Modal Top Control Bar */}
            <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm sm:text-base font-extrabold text-white truncate max-w-xs sm:max-w-md">
                  {activeModalGame.title}
                </h3>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {activeModalGame.ages ? `Độ tuổi ${activeModalGame.ages}` : "Game trí tuệ"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={isLoggedIn ? `/api/games/${activeModalGame.slug}/download` : `/login?next=${encodeURIComponent("/games")}`}
                  onClick={() => {
                    if (isLoggedIn) {
                      triggerCoffeePopup("download");
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                    isLoggedIn
                      ? "bg-emerald-600 hover:bg-emerald-500 !text-white"
                      : "bg-amber-500 hover:bg-amber-400 !text-white"
                  }`}
                  title={isLoggedIn ? "Tải trọn bộ game offline (.zip)" : "Đăng nhập để tải game"}
                >
                  {isLoggedIn ? (
                    <Download className="w-3.5 h-3.5 !text-white" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 !text-white" />
                  )}
                  <span className="hidden sm:inline !text-white">Tải về (.zip)</span>
                </a>

                <a
                  href={`/games/play.html?g=${encodeURIComponent(activeModalGame.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors"
                  title="Mở toàn màn hình trong tab mới"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Toàn màn hình</span>
                </a>

                <button
                  type="button"
                  onClick={() => setActiveModalGame(null)}
                  className="p-1.5 rounded-xl bg-neutral-800 hover:bg-red-500/20 hover:text-red-400 text-neutral-400 transition-colors cursor-pointer"
                  aria-label="Đóng cửa sổ chơi game"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Game Frame */}
            <div className="relative flex-1 bg-white overflow-hidden">
              <iframe
                src={`/games/play.html?g=${encodeURIComponent(activeModalGame.slug)}`}
                title={activeModalGame.title}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen"
                sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
