"use client";

import { useState } from "react";
import { fetchAPI } from "../lib/api";
import { formatVerseRef } from "../bible/page";
import { useToast } from "./Toast";

import { useBookmarks, useAddBookmark, useRemoveBookmark, useHighlights, useRemoveHighlight, useNotes, useAddNote, useRemoveNote } from "../lib/hooks";
import type { Bookmark, Highlight, Note } from "../types";

interface StudySearchResult {
  id: string;
  title?: string;
  chapter?: string;
}

// Hook definitions replace local states
interface BibleStudyToolsProps {
  selectedBibleId: string;
  selectedChapterId: string;
  onNavigateToChapter?: (chapterId: string) => void;
  /** When true, renders panels above the toolbar (for bottom sheet FABs) */
  reversed?: boolean;
}

export default function BibleStudyTools({ selectedBibleId, selectedChapterId, onNavigateToChapter, reversed = false }: BibleStudyToolsProps) {
  const { showToast } = useToast();
  const [activePanel, setActivePanel] = useState<"search" | "bookmarks" | "highlights" | "notes" | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudySearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Query Hooks
  const { data: bookmarks = [], isLoading: bookmarksLoading } = useBookmarks();
  const { data: highlights = [], isLoading: highlightsLoading } = useHighlights();
  const { data: notes = [], isLoading: notesLoading } = useNotes();

  // Mutation Hooks
  const addBookmarkMut = useAddBookmark();
  const removeBookmarkMut = useRemoveBookmark();
  const removeHighlightMut = useRemoveHighlight();
  const addNoteMut = useAddNote();
  const removeNoteMut = useRemoveNote();

  const [newNoteText, setNewNoteText] = useState("");


  // Highlight color (used by parent for text-selection highlighting)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetchAPI(`/bible/search/?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res?.data?.results || res?.results || res?.data || []);
    } catch { /* error */ } finally {
      setSearching(false);
    }
  }

  function addBookmark() {
    if (!selectedChapterId) return;
    const exists = bookmarks.some((bm: Bookmark) => bm.verse_reference === selectedChapterId);
    if (exists) return;
    addBookmarkMut.mutate({ 
      bookmark_type: "api_bible", 
      verse_reference: selectedChapterId 
    });
  }

  function removeBookmark(id: string) {
    removeBookmarkMut.mutate(id);
  }

  function removeHighlight(id: string) {
    removeHighlightMut.mutate(id);
  }

  function addNote() {
    if (!newNoteText.trim() || addNoteMut.isPending || !selectedChapterId) return;
    addNoteMut.mutate(
      { note_type: "api_bible", verse_reference: selectedChapterId, text: newNoteText.trim() },
      { onSuccess: () => setNewNoteText("") }
    );
  }

  function removeNote(id: string) {
    removeNoteMut.mutate(id);
  }

  function togglePanel(panel: typeof activePanel) {
    if (activePanel === panel) { setActivePanel(null); return; }
    setActivePanel(panel);
  }

  const isBookmarked = bookmarks.some((bm: Bookmark) => bm.verse_reference === selectedChapterId);

  return (
    <div className={`space-y-4 ${reversed ? 'flex flex-col-reverse gap-4 [&>*]:!mt-0' : ''}`}>
      {/* Tool Bar */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => togglePanel("search")} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activePanel === "search" ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"}`}>
          <span className="material-symbols-outlined text-sm">search</span> Search
        </button>
        <button onClick={() => togglePanel("bookmarks")} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activePanel === "bookmarks" ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"}`}>
          <span className="material-symbols-outlined text-sm">bookmark</span> Bookmarks
        </button>
        <button onClick={() => togglePanel("highlights")} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activePanel === "highlights" ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"}`}>
          <span className="material-symbols-outlined text-sm">highlight</span> Highlights
        </button>
        <button onClick={() => togglePanel("notes")} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activePanel === "notes" ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"}`}>
          <span className="material-symbols-outlined text-sm">edit_note</span> Notes
        </button>
      </div>

      {/* Quick Actions for current chapter */}
      {selectedChapterId && (
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => { if (isBookmarked) { const bm = bookmarks.find((b: Bookmark) => b.verse_reference === selectedChapterId); if (bm) removeBookmark(bm.id); } else addBookmark(); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isBookmarked ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
            title={isBookmarked ? "Remove bookmark" : "Bookmark this chapter"}
          >
            <span className="material-symbols-outlined text-sm" style={isBookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}>bookmark</span>
            {isBookmarked ? "Bookmarked" : "Bookmark"}
          </button>
          <span className="text-[10px] text-on-surface-variant/50">Select text to highlight</span>
        </div>
      )}

      {/* Search Panel */}
      {activePanel === "search" && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/10">
            <span className="material-symbols-outlined text-primary text-sm">search</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Search</span>
          </div>
          <div className="p-4">
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <input type="text" placeholder="Search study content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary/40" />
              <button type="submit" disabled={searching} className="bg-primary text-on-primary px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 shrink-0">
                {searching ? "..." : "Go"}
              </button>
            </form>
            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
              {searchResults.map((r, i: number) => (
                <button key={r.id || i} onClick={() => onNavigateToChapter?.(r.id || r.chapter)} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors group">
                  <span className="material-symbols-outlined text-primary text-sm shrink-0">article</span>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">{r.title || `Result ${i + 1}`}</span>
                    {r.chapter && <p className="text-[10px] text-on-surface-variant/60 mt-0.5">Chapter: {r.chapter}</p>}
                  </div>
                </button>
              ))}
              {!searching && searchResults.length === 0 && searchQuery && (
                <div className="py-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/20 block mb-1">search_off</span>
                  <p className="text-xs text-on-surface-variant/50">No results found.</p>
                </div>
              )}
              {!searching && searchResults.length === 0 && !searchQuery && (
                <div className="py-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/20 block mb-1">manage_search</span>
                  <p className="text-xs text-on-surface-variant/50">Search across study sections and pages.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bookmarks Panel */}
      {activePanel === "bookmarks" && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/10">
            <span className="material-symbols-outlined text-primary text-sm">bookmark</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Saved Bookmarks</span>
          </div>
          <div className="p-4">
            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
              {bookmarksLoading ? (
                <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/30 border-t-primary"></div></div>
              ) : bookmarks.length > 0 ? bookmarks.map((bm: Bookmark) => (
                <div key={bm.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors group">
                  <button
                    onClick={() => onNavigateToChapter?.(bm.verse_reference)}
                    className="flex items-center gap-2 text-sm text-on-surface hover:text-primary transition-colors min-w-0"
                  >
                    <span className="material-symbols-outlined text-primary text-sm shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                    <span className="truncate">{formatVerseRef(bm.verse_reference)}</span>
                  </button>
                  <button onClick={() => removeBookmark(bm.id)} className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-red-500 transition-all p-1 rounded-md hover:bg-red-500/10" title="Remove">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )) : (
                <div className="py-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/20 block mb-1">bookmark_border</span>
                  <p className="text-xs text-on-surface-variant/50">No bookmarks yet.</p>
                  <p className="text-[10px] text-on-surface-variant/30 mt-0.5">Bookmark a chapter to see it here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Highlights Panel */}
      {activePanel === "highlights" && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/10">
            <span className="material-symbols-outlined text-primary text-sm">highlight</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Highlights</span>
          </div>
          <div className="p-4">
            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
              {highlightsLoading ? (
                <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/30 border-t-primary"></div></div>
              ) : highlights.length > 0 ? highlights.map((hl: Highlight & { selected_text?: string }) => (
                <div key={hl.id} className="flex items-start justify-between px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors group">
                  <button
                    onClick={() => onNavigateToChapter?.(hl.verse_reference)}
                    className="flex items-start gap-2 text-left text-sm text-on-surface hover:text-primary transition-colors min-w-0"
                  >
                    <span className="w-3 h-3 rounded-full shrink-0 mt-1 ring-2 ring-white/20" style={{ backgroundColor: hl.color || "yellow" }} />
                    <div className="min-w-0">
                      {hl.selected_text ? (
                        <>
                          <span className="line-clamp-3 italic text-on-surface-variant">&ldquo;{hl.selected_text}&rdquo;</span>
                          <span className="block text-[10px] text-primary/60 mt-0.5">{formatVerseRef(hl.verse_reference)}</span>
                        </>
                      ) : (
                        <span className="truncate">{formatVerseRef(hl.verse_reference)}</span>
                      )}
                    </div>
                  </button>
                  <button onClick={() => removeHighlight(hl.id)} className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-red-500 transition-all shrink-0 mt-0.5 p-1 rounded-md hover:bg-red-500/10" title="Remove">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )) : (
                <div className="py-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/20 block mb-1">ink_highlighter</span>
                  <p className="text-xs text-on-surface-variant/50">No highlights yet.</p>
                  <p className="text-[10px] text-on-surface-variant/30 mt-0.5">Select text in the reader to highlight.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes Panel */}
      {activePanel === "notes" && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-outline-variant/10">
            <span className="material-symbols-outlined text-primary text-sm">edit_note</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Notes</span>
          </div>
          <div className="p-4">
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="Add a note for this chapter..." value={newNoteText} onChange={(e) => setNewNoteText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} className="flex-1 bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary/40" />
              <button onClick={addNote} disabled={addNoteMut.isPending || !newNoteText.trim()} className="bg-primary text-on-primary px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 shrink-0">
                {addNoteMut.isPending ? "..." : "Add"}
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
              {notesLoading ? (
                <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/30 border-t-primary"></div></div>
              ) : notes.length > 0 ? notes.map((note: Note) => (
                <div key={note.id} className="px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors group">
                  <div className="flex items-center justify-between">
                    <button onClick={() => onNavigateToChapter?.(note.verse_reference)} className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors">
                      {formatVerseRef(note.verse_reference)}
                    </button>
                    <button onClick={() => removeNote(note.id)} className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-red-500 transition-all p-1 rounded-md hover:bg-red-500/10" title="Delete">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                  <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-2">{note.text}</p>
                </div>
              )) : (
                <div className="py-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/20 block mb-1">edit_note</span>
                  <p className="text-xs text-on-surface-variant/50">No notes yet.</p>
                  <p className="text-[10px] text-on-surface-variant/30 mt-0.5">Add your thoughts and reflections here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
