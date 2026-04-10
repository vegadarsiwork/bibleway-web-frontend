"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { marked } from "marked";
import MainLayout from "../components/MainLayout";
import { fetchAPI } from "../lib/api";
import Shimmer from "../components/Shimmer";
import BibleStudyTools from "../components/BibleStudyTools";
import TTSControls from "../components/TTSControls";
import YouTubeSermons from "../components/YouTubeSermons";
import { useBibles, useBooks, useChapters, useChapterContent, useStudySections, useStudyChapters, useStudyPages, useStudyPageDetail, useBookmarks, useAddBookmark, useRemoveBookmark, useNotes, useAddNote, useRemoveNote, useUpdateNote, useHighlights, useAddHighlight, useRemoveHighlight, useBibleSearch, useApiBibleSearch } from "../lib/hooks";
import { translateText, LANGUAGES, DEFAULT_LANGUAGE, type Language } from "../lib/translate";
import { useToast } from "../components/Toast";
import { sanitizeHTML } from "../lib/sanitize";

marked.setOptions({ breaks: true, gfm: true });

// ─── Book name mapping for readable display ───────────────────
const BOOK_NAMES: Record<string, string> = {
  GEN: "Genesis", EXO: "Exodus", LEV: "Leviticus", NUM: "Numbers", DEU: "Deuteronomy",
  JOS: "Joshua", JDG: "Judges", RUT: "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel",
  "1KI": "1 Kings", "2KI": "2 Kings", "1CH": "1 Chronicles", "2CH": "2 Chronicles",
  EZR: "Ezra", NEH: "Nehemiah", EST: "Esther", JOB: "Job", PSA: "Psalms",
  PRO: "Proverbs", ECC: "Ecclesiastes", SNG: "Song of Solomon", ISA: "Isaiah",
  JER: "Jeremiah", LAM: "Lamentations", EZK: "Ezekiel", DAN: "Daniel", HOS: "Hosea",
  JOL: "Joel", AMO: "Amos", OBA: "Obadiah", JON: "Jonah", MIC: "Micah",
  NAM: "Nahum", HAB: "Habakkuk", ZEP: "Zephaniah", HAG: "Haggai", ZEC: "Zechariah",
  MAL: "Malachi", MAT: "Matthew", MRK: "Mark", LUK: "Luke", JHN: "John",
  ACT: "Acts", ROM: "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians",
  GAL: "Galatians", EPH: "Ephesians", PHP: "Philippians", COL: "Colossians",
  "1TH": "1 Thessalonians", "2TH": "2 Thessalonians", "1TI": "1 Timothy", "2TI": "2 Timothy",
  TIT: "Titus", PHM: "Philemon", HEB: "Hebrews", JAS: "James",
  "1PE": "1 Peter", "2PE": "2 Peter", "1JN": "1 John", "2JN": "2 John", "3JN": "3 John",
  JUD: "Jude", REV: "Revelation",
};

export function formatVerseRef(ref: string): string {
  if (!ref) return ref;
  // "GEN.1" → "Genesis 1", "JHN.3.16" → "John 3:16"
  const parts = ref.split(".");
  const bookCode = parts[0];
  const bookName = BOOK_NAMES[bookCode] || bookCode;
  if (parts.length === 1) return bookName;
  if (parts.length === 2) return `${bookName} ${parts[1]}`;
  return `${bookName} ${parts[1]}:${parts[2]}`;
}

// ─── Language Selector dropdown ──────────────────────────────────
function LanguageSelector({
  selectedLang,
  onSelect,
  isTranslating,
}: {
  selectedLang: string;
  onSelect: (code: string) => void;
  isTranslating: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const currentLang = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];
  const filtered = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 hover:border-primary/30 text-sm text-on-surface-variant hover:text-on-surface transition-all"
      >
        <span className="material-symbols-outlined text-base">translate</span>
        <span className="font-medium">{currentLang.name}</span>
        {isTranslating ? (
          <span className="w-3.5 h-3.5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
        ) : (
          <span className="material-symbols-outlined text-base">{open ? "expand_less" : "expand_more"}</span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-64 max-h-80 right-0 sm:right-auto bg-surface-container-lowest rounded-xl border border-outline-variant/15 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-outline-variant/10">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search languages..."
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="overflow-y-auto max-h-60 custom-scrollbar">
            {filtered.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onSelect(lang.code);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                  lang.code === selectedLang
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <span>{lang.name}</span>
                <span className="text-xs text-on-surface-variant/50">{lang.nativeName}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-6 text-sm text-on-surface-variant/50 text-center">No languages found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step type for the Standard Reader flow ────────────────────
type ReaderStep = "pick-bible" | "pick-book" | "pick-chapter" | "reading";
// ─── Step type for the Study flow ──────────────────────────────
type StudyStep = "pick-section" | "pick-module" | "reading";

type TabKey = "standard" | "study" | "bookmarks" | "notes";

// (Local text mappings are not needed if we use global React Query hooks)

// handleShare is now inside BibleContent to access showToast

function BibleContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "standard";
  const validTabs: TabKey[] = ["standard", "study", "bookmarks", "notes"];
  const [activeTab, setActiveTab] = useState<TabKey>(validTabs.includes(initialTab) ? initialTab : "standard");
  const [mobileFabOpen, setMobileFabOpen] = useState(false);

  // ─── Share helper (needs showToast) ──────────────────────────
  const handleShare = useCallback(async (title: string, text: string, url?: string) => {
    const shareUrl = url || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast("success", "Link Copied", "Link copied to clipboard!");
    }
  }, [showToast]);

  useEffect(() => {
    const tab = searchParams.get("tab") as TabKey;
    if (validTabs.includes(tab)) setActiveTab(tab);
  }, [searchParams]);

  // ═══════════════════════════════════════════════════════════════
  // STANDARD READER STATE (React Query cached)
  // ═══════════════════════════════════════════════════════════════
  const [readerStep, setReaderStep] = useState<ReaderStep>("pick-bible");
  const [selectedBible, setSelectedBible] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  // React Query hooks — cached with mobile-matching TTLs
  const { data: bibles = [], isLoading: biblesLoading } = useBibles();
  const { data: books = [], isLoading: booksLoading } = useBooks(selectedBible?.id);
  const { data: chapters = [], isLoading: chaptersLoading } = useChapters(selectedBible?.id, selectedBook?.id);
  const { data: chapterData = null, isLoading: contentLoading } = useChapterContent(selectedBible?.id, selectedChapterId || null);

  // ═══════════════════════════════════════════════════════════════
  // TRANSLATION STATE
  // ═══════════════════════════════════════════════════════════════
  const [selectedLang, setSelectedLang] = useState<string>(DEFAULT_LANGUAGE);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const translationAbortRef = useRef(0); // Counter to abandon stale translations

  // Reset language when chapter changes
  useEffect(() => {
    setSelectedLang(DEFAULT_LANGUAGE);
    setTranslatedContent(null);
  }, [selectedChapterId]);

  // Translate content when language changes
  useEffect(() => {
    if (selectedLang === DEFAULT_LANGUAGE || !chapterData?.content) {
      setTranslatedContent(null);
      return;
    }

    const requestId = ++translationAbortRef.current;
    setIsTranslating(true);

    // Strip HTML tags for translation, then re-wrap in simple paragraphs
    const plainText = chapterData.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    translateText(plainText, selectedLang)
      .then((result) => {
        if (translationAbortRef.current === requestId) {
          // Wrap translated text in paragraphs by splitting on double-newlines or periods with spacing
          const paragraphs = result
            .split(/\n\n+/)
            .filter((p: string) => p.trim())
            .map((p: string) => `<p>${p.trim()}</p>`)
            .join("");
          setTranslatedContent(paragraphs || `<p>${result}</p>`);
        }
      })
      .catch((err) => {
        if (translationAbortRef.current === requestId) {
          console.error("Translation error:", err);
          setTranslatedContent(null);
          setSelectedLang(DEFAULT_LANGUAGE);
        }
      })
      .finally(() => {
        if (translationAbortRef.current === requestId) {
          setIsTranslating(false);
        }
      });
  }, [selectedLang, chapterData?.content]);

  // The content to actually display (translated or original)
  const displayContent = translatedContent || chapterData?.content || "";
  const isRtl = LANGUAGES.find((l) => l.code === selectedLang)?.rtl ?? false;

  // ═══════════════════════════════════════════════════════════════
  // STUDY STATE (React Query cached)
  // ═══════════════════════════════════════════════════════════════
  const [studyStep, setStudyStep] = useState<StudyStep>("pick-section");
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [selectedStudyChapter, setSelectedStudyChapter] = useState<any>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const { data: sections = [], isLoading: sectionsLoading } = useStudySections();
  const { data: studyChapters = [], isLoading: studyChaptersLoading } = useStudyChapters(selectedSection?.id);
  const { data: pages = [], isLoading: studyPagesLoading } = useStudyPages(selectedStudyChapter?.id);
  const { data: pageData = null, isLoading: studyContentLoading } = useStudyPageDetail(selectedPageId);

  // Auto-select first page when pages load
  useEffect(() => {
    if (pages.length > 0 && !selectedPageId) setSelectedPageId(pages[0].id);
  }, [pages]);

  // ═══════════════════════════════════════════════════════════════
  // STUDY TRANSLATION STATE
  // ═══════════════════════════════════════════════════════════════
  const [studyLang, setStudyLang] = useState<string>(DEFAULT_LANGUAGE);
  const [translatedStudyContent, setTranslatedStudyContent] = useState<string | null>(null);
  const [isStudyTranslating, setIsStudyTranslating] = useState(false);
  const studyTranslationAbortRef = useRef(0);

  // Reset study language when page changes
  useEffect(() => {
    setStudyLang(DEFAULT_LANGUAGE);
    setTranslatedStudyContent(null);
  }, [selectedPageId]);

  // Translate study content when language changes
  useEffect(() => {
    if (studyLang === DEFAULT_LANGUAGE || !pageData?.content) {
      setTranslatedStudyContent(null);
      return;
    }

    const requestId = ++studyTranslationAbortRef.current;
    setIsStudyTranslating(true);

    // Parse markdown to HTML, strip tags, translate plain text
    const parsedHtml = marked.parse(pageData.content) as string;
    const plainText = parsedHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    translateText(plainText, studyLang)
      .then((result) => {
        if (studyTranslationAbortRef.current === requestId) {
          const paragraphs = result
            .split(/\n\n+/)
            .filter((p: string) => p.trim())
            .map((p: string) => `<p>${p.trim()}</p>`)
            .join("");
          setTranslatedStudyContent(paragraphs || `<p>${result}</p>`);
        }
      })
      .catch((err) => {
        if (studyTranslationAbortRef.current === requestId) {
          console.error("Study translation error:", err);
          setTranslatedStudyContent(null);
          setStudyLang(DEFAULT_LANGUAGE);
        }
      })
      .finally(() => {
        if (studyTranslationAbortRef.current === requestId) {
          setIsStudyTranslating(false);
        }
      });
  }, [studyLang, pageData?.content]);

  const studyDisplayContent = translatedStudyContent
    || (pageData?.content ? (marked.parse(pageData.content) as string) : "");
  const isStudyRtl = LANGUAGES.find((l) => l.code === studyLang)?.rtl ?? false;

  // ═══════════════════════════════════════════════════════════════
  // SEARCH STATE
  // ═══════════════════════════════════════════════════════════════
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [inlineSearchOpen, setInlineSearchOpen] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  useEffect(() => {
    setShowAllResults(false);
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: segregatedResults = [], isLoading: segregatedSearchLoading } = useBibleSearch(debouncedSearch);
  const { data: apiBibleResults, isLoading: apiBibleSearchLoading } = useApiBibleSearch(
    selectedBible?.id || "",
    selectedBible ? debouncedSearch : ""
  );
  const apiBibleVerses = apiBibleResults?.verses || [];

  // ═══════════════════════════════════════════════════════════════
  // BOOKMARKS STATE
  // ═══════════════════════════════════════════════════════════════
  const { data: bookmarksList = [], isLoading: bookmarksLoading } = useBookmarks();
  const addBookmarkMut = useAddBookmark();
  const removeBookmarkMut = useRemoveBookmark();

  const currentChapterBookmarked = bookmarksList.some(
    (bm: any) => bm.verse_reference === selectedChapterId
  );
  const currentBookmarkId = bookmarksList.find(
    (bm: any) => bm.verse_reference === selectedChapterId
  )?.id;

  function handleToggleBookmark() {
    if (!selectedChapterId) return;
    if (currentChapterBookmarked && currentBookmarkId) {
      removeBookmarkMut.mutate(currentBookmarkId);
    } else {
      addBookmarkMut.mutate({ bookmark_type: "api_bible", verse_reference: selectedChapterId });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // NOTES STATE
  // ═══════════════════════════════════════════════════════════════
  const { data: notesList = [], isLoading: notesLoading } = useNotes();
  const addNoteMut = useAddNote();
  const removeNoteMut = useRemoveNote();
  const updateNoteMut = useUpdateNote();
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");

  function handleAddNote() {
    if (!newNoteText.trim() || !selectedChapterId) return;
    addNoteMut.mutate(
      { note_type: "api_bible", verse_reference: selectedChapterId, text: newNoteText.trim() },
      { onSuccess: () => setNewNoteText("") }
    );
  }

  function handleStartEditNote(note: any) {
    setEditingNoteId(note.id);
    setEditNoteText(note.text);
  }

  function handleSaveEditNote() {
    if (!editingNoteId || !editNoteText.trim()) return;
    updateNoteMut.mutate(
      { id: editingNoteId, text: editNoteText.trim() },
      { onSuccess: () => { setEditingNoteId(null); setEditNoteText(""); } }
    );
  }

  // ─── Inline search click-outside handler ─────────────────────
  const inlineSearchRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (inlineSearchRef.current && !inlineSearchRef.current.contains(e.target as Node)) {
        setInlineSearchOpen(false);
      }
    }
    if (inlineSearchOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [inlineSearchOpen]);

  // ─── Highlight state for visual rendering ───────────────────
  // We sync directly with the global React Query hook rather than local state.
  const { data: globalHighlights = [] } = useHighlights();
  const addHighlightMut = useAddHighlight();
  const removeHighlightMut = useRemoveHighlight();

  const [selectionPopup, setSelectionPopup] = useState<{ text: string; x: number; y: number; start: number; end: number } | null>(null);
  const [popupColor, setPopupColor] = useState("yellow");
  const articleRef = useRef<HTMLDivElement>(null);

  // Listen for text selection inside the bible article or study section
  useEffect(() => {
    function handleMouseUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setTimeout(() => setSelectionPopup(null), 200);
        return;
      }
      
      // Capture from any prose container (standard reader or study pages)
      const isInsideArticle = articleRef.current && articleRef.current.contains(sel.anchorNode);
      const isInsideStudy = document.querySelector(".study-content-article")?.contains(sel.anchorNode as Node);
      
      if (isInsideArticle || isInsideStudy) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionPopup({
          text: sel.toString().trim(),
          start: range.startOffset,
          end: range.endOffset,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
      }
    }
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [activeTab]);

  function handleHighlightSelection(color: string) {
    if (!selectionPopup) return;
    const { text, start, end } = selectionPopup;

    if (activeTab === "standard" && selectedChapterId) {
      addHighlightMut.mutate({
        highlight_type: "api_bible",
        verse_reference: selectedChapterId,
        selected_text: text,
        color,
      });
    } else if (activeTab === "study" && selectedPageId) {
      addHighlightMut.mutate({
        highlight_type: "segregated",
        content_type: 21,
        object_id: selectedPageId,
        selected_text: text,
        selection_start: start,
        selection_end: end,
        color,
      });
    }
    
    showToast("success", "Highlighted", `Text highlighted in ${color}`);
    setSelectionPopup(null);
    window.getSelection()?.removeAllRanges();
  }

  function handleRemoveHighlight(id: string) {
    removeHighlightMut.mutate(id);
  }

  // Apply highlights to HTML content by wrapping matched text in <mark>
  function applyHighlightsToContent(html: string, chapterId?: string, objectId?: string): string {
    if (!html) return html;
    // Filter highlights for the current chapter/page
    const chapterHighlights = globalHighlights.filter(
      (hl: any) => {
        if (chapterId && hl.verse_reference === chapterId) return true;
        if (objectId && hl.object_id === objectId) return true;
        return false;
      }
    );
    if (chapterHighlights.length === 0) return html;

    let result = html;
    const colorMap: Record<string, string> = {
      yellow: "rgba(253, 224, 71, 0.35)",
      green: "rgba(134, 239, 172, 0.35)",
      blue: "rgba(147, 197, 253, 0.35)",
      pink: "rgba(249, 168, 212, 0.35)",
    };
    for (const hl of chapterHighlights) {
      const text = hl.selected_text;
      if (!text) continue;
      // Escape special regex characters
      const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const bg = colorMap[hl.color] || colorMap.yellow;
      result = result.replace(
        new RegExp(`(?<=>)([^<]*?)(${escaped})`, "gi"),
        (_, before, match) => `${before}<mark style="background:${bg};padding:2px 0;border-radius:3px">${match}</mark>`
      );
    }
    return result;
  }

  // Bibles, books, chapters, content all loaded via React Query hooks above

  // ─── Browser back/forward button support ────────────────────
  const isRestoringRef = useRef(false);

  useEffect(() => {
    if (!window.history.state?.bibleStep) {
      window.history.replaceState({ bibleStep: "pick-bible", tab: "standard" }, "");
    }

    function handlePopState(e: PopStateEvent) {
      const state = e.state;
      if (!state?.bibleStep) return;
      isRestoringRef.current = true;

      // Just restore selections — React Query serves from cache instantly
      if (state.tab === "standard") {
        setActiveTab("standard");
        const step = state.bibleStep as ReaderStep;
        setReaderStep(step);
        if (step === "pick-bible") { setSelectedBible(null); setSelectedBook(null); setSelectedChapterId(""); }
        else if (step === "pick-book") { setSelectedBible(state.bible); setSelectedBook(null); setSelectedChapterId(""); }
        else if (step === "pick-chapter") { setSelectedBible(state.bible); setSelectedBook(state.book); setSelectedChapterId(""); }
        else if (step === "reading") { setSelectedBible(state.bible); setSelectedBook(state.book); setSelectedChapterId(state.chapterId); }
      } else if (state.tab === "study") {
        setActiveTab("study");
        const step = state.bibleStep as StudyStep;
        setStudyStep(step);
        if (step === "pick-section") { setSelectedSection(null); setSelectedStudyChapter(null); setSelectedPageId(null); }
        else if (step === "pick-module") { setSelectedSection(state.section); setSelectedStudyChapter(null); setSelectedPageId(null); }
        else if (step === "reading") { setSelectedSection(state.section); setSelectedStudyChapter(state.studyChapter); setSelectedPageId(null); }
      }
      isRestoringRef.current = false;
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function pushBibleHistory(step: string, tab: string, extra: Record<string, any> = {}) {
    window.history.pushState({ bibleStep: step, tab, ...extra }, "");
  }

  // ─── Pick Bible → load books ─────────────────────────────────
  // Navigation just sets state — React Query handles fetching + caching
  function handlePickBible(bible: any) {
    setSelectedBible(bible);
    setSelectedBook(null);
    setSelectedChapterId("");
    setSearchQuery("");
    setReaderStep("pick-book");
    pushBibleHistory("pick-book", "standard", { bible });
  }

  function handlePickBook(book: any) {
    setSelectedBook(book);
    setSelectedChapterId("");
    setSearchQuery("");
    setReaderStep("pick-chapter");
    pushBibleHistory("pick-chapter", "standard", { bible: selectedBible, book });
  }

  function handlePickChapter(chapterId: string) {
    setSelectedChapterId(chapterId);
    setReaderStep("reading");
    pushBibleHistory("reading", "standard", { bible: selectedBible, book: selectedBook, chapterId });
  }

  function handleSwitchChapter(chapterId: string) {
    setSelectedChapterId(chapterId);
    // If switching to a different book, update selectedBook
    const newBookCode = chapterId.split(".")[0];
    if (newBookCode !== selectedBook?.id && books.length > 0) {
      const matchingBook = books.find((b: any) => b.id === newBookCode);
      if (matchingBook) setSelectedBook(matchingBook);
    }
  }

  // Sections, study chapters, pages, page detail all loaded via React Query hooks above

  function handlePickSection(section: any) {
    setSelectedSection(section);
    setSelectedStudyChapter(null);
    setSelectedPageId(null);
    setStudyStep("pick-module");
    pushBibleHistory("pick-module", "study", { section });
  }

  function handlePickModule(chapter: any) {
    setSelectedStudyChapter(chapter);
    setSelectedPageId(null);
    setStudyStep("reading");
    pushBibleHistory("reading", "study", { section: selectedSection, studyChapter: chapter });
  }

  function handleSwitchPage(pageId: string) {
    setSelectedPageId(pageId);
  }

  // ─── Breadcrumb back navigation — just clear selections, data stays cached ──
  function goBackReader(to: ReaderStep) {
    setReaderStep(to);
    setSearchQuery("");
    if (to === "pick-bible") { setSelectedBible(null); setSelectedBook(null); setSelectedChapterId(""); }
    if (to === "pick-book") { setSelectedBook(null); setSelectedChapterId(""); }
    if (to === "pick-chapter") { setSelectedChapterId(""); }
  }

  function goBackStudy(to: StudyStep) {
    setStudyStep(to);
    if (to === "pick-section") { setSelectedSection(null); setSelectedStudyChapter(null); setSelectedPageId(null); }
    if (to === "pick-module") { setSelectedStudyChapter(null); setSelectedPageId(null); }
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <MainLayout>
      <div className="flex flex-col items-center">
        {/* Tab Navigation — centered */}
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 mb-6">
          <div className="flex justify-center gap-6 sm:gap-10 border-b border-outline-variant/20 overflow-x-auto">
            {([
              { key: "standard" as TabKey, label: "Bible", icon: "menu_book" },
              { key: "study" as TabKey, label: "Study", icon: "school" },
              { key: "bookmarks" as TabKey, label: "Bookmarks", icon: "bookmark" },
              { key: "notes" as TabKey, label: "Notes", icon: "edit_note" },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 text-base sm:text-lg font-headline transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === tab.key ? "border-b-2 border-primary text-on-surface" : "text-on-surface-variant/50 hover:text-on-surface"}`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════ STANDARD READER ══════════════ */}
        {activeTab === "standard" && (
          <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-32">

            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-on-surface-variant mb-8">
              <button onClick={() => goBackReader("pick-bible")} className="hover:text-primary transition-colors font-medium">Translations</button>
              {selectedBible && (
                <>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <button onClick={() => goBackReader("pick-book")} className="hover:text-primary transition-colors font-medium">{selectedBible.nameLocal || selectedBible.abbreviation}</button>
                </>
              )}
              {selectedBook && (
                <>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <button onClick={() => goBackReader("pick-chapter")} className="hover:text-primary transition-colors font-medium">{selectedBook.name}</button>
                </>
              )}
              {readerStep === "reading" && chapterData && (
                <>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-primary font-semibold">{chapterData.reference}</span>
                </>
              )}
            </div>

            {/* Filter Search Bar — filters Bible versions, books, or chapters depending on current step */}
            <div className="mb-6">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={readerStep === "pick-bible" ? "Filter translations..." : readerStep === "pick-book" ? "Filter books..." : readerStep === "pick-chapter" ? "Filter chapters..." : "Search..."}
                  className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 text-sm transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* STEP 1: Pick Bible Translation */}
            {readerStep === "pick-bible" && (
              <div>
                <h1 className="text-3xl sm:text-4xl font-headline text-on-surface mb-2">Choose a Translation</h1>
                <p className="text-on-surface-variant mb-8">Select a Bible version to start reading.</p>
                {biblesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3,4,5,6].map(i => <Shimmer key={i} className="h-24 rounded-xl" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bibles.filter((b: any) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (b.nameLocal || b.name || "").toLowerCase().includes(q)
                        || (b.abbreviation || "").toLowerCase().includes(q)
                        || (b.description || "").toLowerCase().includes(q)
                        || (b.language?.nameLocal || "").toLowerCase().includes(q);
                    }).map((b: any) => (
                      <button
                        key={b.id}
                        onClick={() => handlePickBible(b)}
                        className="text-left p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-headline text-lg text-on-surface group-hover:text-primary transition-colors leading-tight">{b.nameLocal || b.name}</h3>
                            {b.description && <p className="text-sm text-on-surface-variant/60 mt-1 line-clamp-1">{b.description}</p>}
                            <p className="text-xs text-on-surface-variant/50 mt-2">{b.language?.nameLocal || "English"} — {b.abbreviation}</p>
                          </div>
                          <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-primary transition-colors ml-3 mt-1 shrink-0">chevron_right</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Pick Book */}
            {readerStep === "pick-book" && (
              <div>
                <button onClick={() => goBackReader("pick-bible")} className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors mb-4">
                  <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Translations
                </button>
                <h1 className="text-3xl sm:text-4xl font-headline text-on-surface mb-2">
                  {selectedBible?.nameLocal || "Bible"}
                </h1>
                <p className="text-on-surface-variant mb-8">Choose a book to read.</p>
                {booksLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[...Array(12)].map((_, i) => <Shimmer key={i} className="h-14 rounded-xl" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {books.filter((b: any) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (b.name || "").toLowerCase().includes(q) || (b.abbreviation || "").toLowerCase().includes(q);
                    }).map((b: any) => (
                      <button
                        key={b.id}
                        onClick={() => handlePickBook(b)}
                        className="text-left px-4 py-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 hover:border-primary/30 hover:bg-surface-container-low transition-all duration-200 group"
                      >
                        <span className="font-headline text-on-surface group-hover:text-primary transition-colors">{b.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Pick Chapter */}
            {readerStep === "pick-chapter" && (
              <div>
                <button onClick={() => goBackReader("pick-book")} className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors mb-4">
                  <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Books
                </button>
                <h1 className="text-3xl sm:text-4xl font-headline text-on-surface mb-2">{selectedBook?.name}</h1>
                <p className="text-on-surface-variant mb-8">Pick a chapter.</p>
                {chaptersLoading ? (
                  <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-3">
                    {[...Array(20)].map((_, i) => <Shimmer key={i} className="aspect-square rounded-xl" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-3">
                    {chapters.map((ch: any) => (
                      <button
                        key={ch.id}
                        onClick={() => handlePickChapter(ch.id)}
                        className="aspect-square flex items-center justify-center rounded-xl font-headline text-lg bg-surface-container-lowest border border-outline-variant/15 hover:bg-primary hover:text-on-primary hover:border-primary transition-all duration-200"
                      >
                        {ch.number}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Reading */}
            {readerStep === "reading" && (
              <div className="flex flex-col xl:flex-row gap-8">
                {/* Sidebar controls — hidden on mobile, shown only on xl+ */}
                <aside className="hidden xl:block w-72 space-y-6 xl:order-2 print:hidden">
                  {/* Chapter grid */}
                  <div>
                    <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/60 block mb-3">Chapters</label>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {chapters.map((ch: any) => (
                        <button
                          key={ch.id}
                          onClick={() => handleSwitchChapter(ch.id)}
                          className={`aspect-square flex items-center justify-center rounded-lg font-headline text-sm transition-all ${
                            selectedChapterId === ch.id ? "bg-primary text-on-primary" : "bg-surface-container-lowest hover:bg-surface-container-high"
                          }`}
                        >
                          {ch.number}
                        </button>
                      ))}
                    </div>
                  </div>

                  <BibleStudyTools
                    selectedBibleId={selectedBible?.id || ""}
                    selectedChapterId={selectedChapterId}
                    onNavigateToChapter={(chId) => handleSwitchChapter(chId)}
                  />
                </aside>

                {/* Content */}
                <div className="flex-1 xl:order-1">
                  <header className="mb-8">
                    <span className="text-xs font-label uppercase tracking-[0.3em] text-primary bg-primary/10 dark:bg-primary/20 dark:text-primary px-3 py-1 rounded-full mb-4 inline-block">
                      {selectedBook?.name}
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline text-on-surface mb-4">
                      {chapterData?.reference || "Loading..."}
                    </h1>
                  </header>

                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <TTSControls content={chapterData?.content || null} chapterId={selectedChapterId} />
                    <LanguageSelector
                      selectedLang={selectedLang}
                      onSelect={setSelectedLang}
                      isTranslating={isTranslating}
                    />
                    <button
                      onClick={handleToggleBookmark}
                      disabled={addBookmarkMut.isPending || removeBookmarkMut.isPending}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm transition-all disabled:opacity-50 ${
                        currentChapterBookmarked
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "bg-surface-container-lowest border-outline-variant/15 text-on-surface-variant hover:border-primary/30 hover:text-primary"
                      }`}
                      title={currentChapterBookmarked ? "Remove bookmark" : "Bookmark this chapter"}
                    >
                      <span
                        className="material-symbols-outlined text-base"
                        style={currentChapterBookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        bookmark
                      </span>
                      <span className="font-medium">{currentChapterBookmarked ? "Bookmarked" : "Bookmark"}</span>
                    </button>
                    {/* Share button */}
                    <button
                      onClick={() => handleShare(
                        chapterData?.reference || "Bible Chapter",
                        `Read ${chapterData?.reference || "this chapter"} on Bibleway`,
                        `${typeof window !== "undefined" ? window.location.origin : ""}/read/${selectedBible?.id}/${selectedChapterId}`
                      )}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/15 bg-surface-container-lowest text-sm text-on-surface-variant hover:border-primary/30 hover:text-primary transition-all"
                      title="Share this chapter"
                    >
                      <span className="material-symbols-outlined text-base">share</span>
                      <span className="font-medium">Share</span>
                    </button>
                  </div>

                  {contentLoading ? (
                    <div className="space-y-4 mt-6">
                      <Shimmer className="h-6 w-3/4" />
                      <Shimmer className="h-4 w-full" />
                      <Shimmer className="h-4 w-full" />
                      <Shimmer className="h-4 w-5/6" />
                    </div>
                  ) : (
                    <>
                      <div ref={articleRef} className="relative">
                        {isTranslating && (
                          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/10 text-sm text-primary">
                            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
                            Translating to {LANGUAGES.find((l) => l.code === selectedLang)?.name || selectedLang}...
                          </div>
                        )}
                        {translatedContent && !isTranslating && (
                          <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl bg-surface-container-low text-xs text-on-surface-variant/60">
                            <span className="material-symbols-outlined text-sm">translate</span>
                            Translated to {LANGUAGES.find((l) => l.code === selectedLang)?.name}
                            <button
                              onClick={() => setSelectedLang(DEFAULT_LANGUAGE)}
                              className="ml-auto text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                              Show original
                            </button>
                          </div>
                        )}
                        <article
                          dir={isRtl ? "rtl" : "ltr"}
                          className="bible-content space-y-4 text-on-surface font-body leading-[1.9] max-w-none mt-6
                            [&>p]:mb-5 [&>p]:text-base [&>p]:sm:text-lg [&>p]:pl-4 [&>p]:border-l-2 [&>p]:border-transparent
                            [&_.v]:text-primary/60 [&_.v]:text-xs [&_.v]:font-bold [&_.v]:align-super [&_.v]:mr-1
                            [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-6 [&_blockquote]:py-3
                            [&_blockquote]:my-6 [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-lg [&_blockquote]:italic
                            [&_h3]:text-2xl [&_h3]:font-headline [&_h3]:mt-8 [&_h3]:mb-4
                            [&_h4]:text-xl [&_h4]:font-headline [&_h4]:mt-6 [&_h4]:mb-3"
                          dangerouslySetInnerHTML={{ __html: sanitizeHTML(applyHighlightsToContent(displayContent || "<p>Select a chapter to begin reading</p>", selectedChapterId, undefined)) }}
                        />

                        {/* Floating highlight toolbar on text selection */}
                        {selectionPopup && (
                          <div
                            className="fixed z-[200] flex items-center gap-1 bg-surface-container-lowest rounded-full shadow-xl border border-outline-variant/20 px-2 py-1.5"
                            style={{ left: selectionPopup.x, top: selectionPopup.y, transform: "translate(-50%, -100%)" }}
                          >
                            {[
                              { color: "yellow", bg: "bg-yellow-300" },
                              { color: "green", bg: "bg-green-300" },
                              { color: "blue", bg: "bg-blue-300" },
                              { color: "pink", bg: "bg-pink-300" },
                            ].map((c) => (
                              <button
                                key={c.color}
                                onMouseDown={(e) => { e.preventDefault(); handleHighlightSelection(c.color); }}
                                className={`w-6 h-6 rounded-full ${c.bg} hover:scale-125 transition-transform`}
                                title={`Highlight ${c.color}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <YouTubeSermons
                        bookId={selectedBook?.id || ""}
                        bookName={selectedBook?.name || ""}
                      />
                    </>
                  )}
              </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ Mobile FAB for Standard Reader (portaled to body) ═══ */}
        {activeTab === "standard" && readerStep === "reading" && typeof document !== "undefined" && createPortal(
          <>
            <div className="xl:hidden fixed bottom-24 right-5 z-[9999] print:hidden">
              <button
                onClick={() => setMobileFabOpen(!mobileFabOpen)}
                className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-xl flex items-center justify-center hover:bg-primary/90 transition-all active:scale-90"
              >
                <span className="material-symbols-outlined text-2xl">{mobileFabOpen ? "close" : "build"}</span>
              </button>
            </div>
            {mobileFabOpen && (
              <div className="xl:hidden fixed inset-0 z-[9998] print:hidden">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFabOpen(false)} />
                <div className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest rounded-t-3xl shadow-2xl border-t border-outline-variant/20 p-6 pb-24 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="w-10 h-1 rounded-full bg-outline-variant/30 mx-auto mb-4" />
                  <h3 className="text-lg font-headline text-on-surface mb-4">Study Tools</h3>
                  <div className="mb-4">
                    <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/60 block mb-2">Chapters</label>
                    <div className="grid grid-cols-8 gap-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                      {chapters.map((ch: any) => (
                        <button
                          key={ch.id}
                          onClick={() => { handleSwitchChapter(ch.id); setMobileFabOpen(false); }}
                          className={`aspect-square flex items-center justify-center rounded-lg font-headline text-xs transition-all ${
                            selectedChapterId === ch.id ? "bg-primary text-on-primary" : "bg-surface-container-low hover:bg-surface-container-high"
                          }`}
                        >
                          {ch.number}
                        </button>
                      ))}
                    </div>
                  </div>
                  <BibleStudyTools
                    selectedBibleId={selectedBible?.id || ""}
                    selectedChapterId={selectedChapterId}
                    onNavigateToChapter={(chId) => {
                      handleSwitchChapter(chId);
                      setMobileFabOpen(false);
                    }}
                    reversed
                  />
                </div>
              </div>
            )}
          </>,
          document.body
        )}

        {/* ══════════════ STUDY ══════════════ */}
        {activeTab === "study" && (
          <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-32">

            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-on-surface-variant mb-8">
              <button onClick={() => goBackStudy("pick-section")} className="hover:text-primary transition-colors font-medium">Sections</button>
              {selectedSection && (
                <>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <button onClick={() => goBackStudy("pick-module")} className="hover:text-primary transition-colors font-medium">{selectedSection.title}</button>
                </>
              )}
              {selectedStudyChapter && (
                <>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-primary font-semibold">{selectedStudyChapter.title}</span>
                </>
              )}
            </div>

            {/* STEP 1: Pick Section */}
            {studyStep === "pick-section" && (
              <div>
                <h1 className="text-3xl sm:text-4xl font-headline text-on-surface mb-2">Study Sections</h1>
                <p className="text-on-surface-variant mb-8">Choose a study section to begin.</p>
                {sectionsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3].map(i => <Shimmer key={i} className="h-28 rounded-xl" />)}
                  </div>
                ) : sections.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sections.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => handlePickSection(s)}
                        className="text-left p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/15 hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-headline text-xl text-on-surface group-hover:text-primary transition-colors">{s.title}</h3>
                          <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-primary transition-colors">arrow_forward</span>
                        </div>
                        {s.age_range && <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium mt-1">Ages {s.age_range}</span>}
                        {s.description && <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{s.description}</p>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4 block">school</span>
                    <p className="text-on-surface-variant/60 text-lg">No study sections available yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Pick Module */}
            {studyStep === "pick-module" && (
              <div>
                <button onClick={() => goBackStudy("pick-section")} className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors mb-4">
                  <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Sections
                </button>
                <h1 className="text-3xl sm:text-4xl font-headline text-on-surface mb-2">{selectedSection?.title}</h1>
                <p className="text-on-surface-variant mb-8">Choose a module to study.</p>
                {studyChaptersLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1,2,3,4].map(i => <Shimmer key={i} className="h-20 rounded-xl" />)}
                  </div>
                ) : studyChapters.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {studyChapters.map((c: any) => (
                      <button
                        key={c.id}
                        onClick={() => handlePickModule(c)}
                        className="text-left p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 hover:border-primary/30 hover:shadow-md transition-all duration-200 group flex items-center gap-4"
                      >
                        <span className="material-symbols-outlined text-2xl text-on-surface-variant/40 group-hover:text-primary transition-colors">menu_book</span>
                        <div>
                          <h3 className="font-headline text-lg text-on-surface group-hover:text-primary transition-colors">{c.title}</h3>
                          {c.description && <p className="text-sm text-on-surface-variant mt-1 line-clamp-1">{c.description}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-on-surface-variant py-12">No modules in this section yet.</p>
                )}
              </div>
            )}

            {/* STEP 3: Reading */}
            {studyStep === "reading" && (
              <div className="flex flex-col xl:flex-row gap-8">
                {/* Page sidebar — hidden on mobile */}
                <aside className="hidden xl:block w-72 space-y-4 xl:order-1">
                  <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/60 block">Readings</label>
                  <div className="space-y-1">
                    {pages.map((p: any, idx: number) => (
                      <button
                        key={p.id}
                        onClick={() => handleSwitchPage(p.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex items-center gap-3 ${
                          selectedPageId === p.id
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-on-surface-variant hover:bg-surface-container-low"
                        }`}
                      >
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">
                          {idx + 1}
                        </span>
                        {p.title}
                      </button>
                    ))}
                  </div>

                  <BibleStudyTools
                    selectedBibleId=""
                    selectedChapterId={selectedPageId || ""}
                    onNavigateToChapter={(chId) => handleSwitchPage(chId)}
                  />
                </aside>

                {/* Content */}
                <div className="flex-1 xl:order-2">
                  {studyContentLoading ? (
                    <div className="space-y-4 py-8">
                      <Shimmer className="h-10 w-1/2 mb-8" />
                      <Shimmer className="h-4 w-full" />
                      <Shimmer className="h-4 w-full" />
                      <Shimmer className="h-4 w-5/6" />
                    </div>
                  ) : pageData ? (
                    <article className="py-4 study-content-article">
                      <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline text-on-surface mb-4">
                        {pageData.title}
                      </h1>

                      {/* Reader toolbar — only show for full content (not preview) */}
                      {!pageData.is_preview && (
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                          <TTSControls content={pageData.content || null} chapterId={selectedPageId || ""} />
                          <LanguageSelector
                            selectedLang={studyLang}
                            onSelect={setStudyLang}
                            isTranslating={isStudyTranslating}
                          />
                          <button
                            onClick={() => {
                              if (!selectedPageId) return;
                              const bm = bookmarksList.find((b: any) => b.object_id === selectedPageId);
                              if (bm) {
                                removeBookmarkMut.mutate(bm.id);
                              } else {
                                addBookmarkMut.mutate({ bookmark_type: "segregated", content_type: 21, object_id: selectedPageId });
                              }
                            }}
                            disabled={addBookmarkMut.isPending || removeBookmarkMut.isPending}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm transition-all disabled:opacity-50 ${
                              bookmarksList.some((b: any) => b.object_id === selectedPageId)
                                ? "bg-primary/10 border-primary/20 text-primary"
                                : "bg-surface-container-lowest border-outline-variant/15 text-on-surface-variant hover:border-primary/30 hover:text-primary"
                            }`}
                            title="Bookmark this page"
                          >
                            <span
                              className="material-symbols-outlined text-base"
                              style={bookmarksList.some((b: any) => b.object_id === selectedPageId) ? { fontVariationSettings: "'FILL' 1" } : undefined}
                            >
                              bookmark
                            </span>
                            <span className="font-medium">{bookmarksList.some((b: any) => b.object_id === selectedPageId) ? "Bookmarked" : "Bookmark"}</span>
                          </button>
                          {/* Share button */}
                          <button
                            onClick={() => handleShare(
                              pageData.title || "Study Page",
                              `Read "${pageData.title}" on Bibleway`,
                              `${typeof window !== "undefined" ? window.location.origin : ""}/read/study/${selectedPageId}`
                            )}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/15 bg-surface-container-lowest text-sm text-on-surface-variant hover:border-primary/30 hover:text-primary transition-all"
                            title="Share this page"
                          >
                            <span className="material-symbols-outlined text-base">share</span>
                            <span className="font-medium">Share</span>
                          </button>
                        </div>
                      )}

                      <div className={`relative ${pageData.is_preview ? "pb-0" : ""}`}>
                        {isStudyTranslating && (
                          <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/10 text-sm text-primary">
                            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
                            Translating to {LANGUAGES.find((l) => l.code === studyLang)?.name || studyLang}...
                          </div>
                        )}
                        {translatedStudyContent && !isStudyTranslating && (
                          <div className="flex items-center gap-2 mb-4 px-4 py-2 rounded-xl bg-surface-container-low text-xs text-on-surface-variant/60">
                            <span className="material-symbols-outlined text-sm">translate</span>
                            Translated to {LANGUAGES.find((l) => l.code === studyLang)?.name}
                            <button
                              onClick={() => setStudyLang(DEFAULT_LANGUAGE)}
                              className="ml-auto text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                              Show original
                            </button>
                          </div>
                        )}
                        <div
                          dir={isStudyRtl ? "rtl" : "ltr"}
                          className="study-content prose prose-lg max-w-none text-on-surface-variant leading-[1.9] font-body
                            [&>p]:mb-5 [&>p]:pl-4
                            [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-6 [&_blockquote]:py-3
                            [&_blockquote]:my-6 [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-r-lg [&_blockquote]:italic
                            [&_h1]:text-3xl [&_h1]:font-headline [&_h1]:mt-8 [&_h1]:mb-4
                            [&_h2]:text-2xl [&_h2]:font-headline [&_h2]:mt-8 [&_h2]:mb-4
                            [&_h3]:text-xl [&_h3]:font-headline [&_h3]:mt-6 [&_h3]:mb-3
                            [&_ul]:pl-8 [&_ul]:space-y-2 [&_ol]:pl-8 [&_ol]:space-y-2
                            [&_strong]:text-on-surface [&_strong]:font-bold
                            [&_em]:italic"
                          dangerouslySetInnerHTML={{ __html: sanitizeHTML(applyHighlightsToContent(studyDisplayContent || "", undefined, selectedPageId || undefined)) }}
                        />

                        {/* Gradient fade for preview mode */}
                        {pageData.is_preview && (
                          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-surface via-surface/95 to-transparent pointer-events-none" />
                        )}
                      </div>

                      {/* Sign-in gate for preview content */}
                      {pageData.is_preview && (
                        <div className="relative z-10 -mt-4 pb-4">
                          <div className="max-w-lg mx-auto">
                            <div className="bg-surface-container-lowest rounded-2xl p-8 sm:p-10 editorial-shadow flex flex-col items-center text-center border border-outline-variant/10">
                              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                              </div>
                              <h2 className="font-headline text-2xl text-on-surface mb-2">Continue Reading</h2>
                              <p className="text-on-surface-variant mb-1">Sign in to read the full study content.</p>
                              <p className="text-on-surface-variant/60 text-sm mb-6">Join thousands exploring Scripture on Bibleway.</p>
                              <a
                                href="/register"
                                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-br from-primary to-primary-container rounded-full text-on-primary font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                              >
                                <span className="material-symbols-outlined text-lg">person_add</span>
                                Create Free Account
                              </a>
                              <p className="mt-4 text-sm text-on-surface-variant">
                                Already have an account?{" "}
                                <a href="/login" className="text-primary font-bold hover:underline">Log in</a>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Floating highlight toolbar on text selection (study) — only for full content */}
                      {!pageData.is_preview && selectionPopup && (
                        <div
                          className="fixed z-[200] flex items-center gap-1 bg-surface-container-lowest rounded-full shadow-xl border border-outline-variant/20 px-2 py-1.5"
                          style={{ left: selectionPopup.x, top: selectionPopup.y, transform: "translate(-50%, -100%)" }}
                        >
                          {[
                            { color: "yellow", bg: "bg-yellow-300" },
                            { color: "green", bg: "bg-green-300" },
                            { color: "blue", bg: "bg-blue-300" },
                            { color: "pink", bg: "bg-pink-300" },
                          ].map((c) => (
                            <button
                              key={c.color}
                              onMouseDown={(e) => { e.preventDefault(); handleHighlightSelection(c.color); }}
                              className={`w-6 h-6 rounded-full ${c.bg} hover:scale-125 transition-transform`}
                              title={`Highlight ${c.color}`}
                            />
                          ))}
                        </div>
                      )}
                    </article>
                  ) : (
                    <div className="py-16 text-center">
                      <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4 block">auto_stories</span>
                      <p className="text-on-surface-variant/60 text-lg">Select a reading to begin</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ Mobile FAB for Study section (portaled to body) ═══ */}
        {activeTab === "study" && studyStep === "reading" && typeof document !== "undefined" && createPortal(
          <>
            <div className="xl:hidden fixed bottom-24 right-5 z-[9999] print:hidden">
              <button
                onClick={() => setMobileFabOpen(!mobileFabOpen)}
                className="w-14 h-14 rounded-full bg-primary text-on-primary shadow-xl flex items-center justify-center hover:bg-primary/90 transition-all active:scale-90"
              >
                <span className="material-symbols-outlined text-2xl">{mobileFabOpen ? "close" : "build"}</span>
              </button>
            </div>
            {mobileFabOpen && (
              <div className="xl:hidden fixed inset-0 z-[9998] print:hidden">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFabOpen(false)} />
                <div className="absolute bottom-0 left-0 right-0 bg-surface-container-lowest rounded-t-3xl shadow-2xl border-t border-outline-variant/20 p-6 pb-24 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="w-10 h-1 rounded-full bg-outline-variant/30 mx-auto mb-4" />
                  <h3 className="text-lg font-headline text-on-surface mb-4">Study Tools</h3>
                  <div className="mb-4">
                    <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/60 block mb-2">Readings</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                      {pages.map((p: any, idx: number) => (
                        <button
                          key={p.id}
                          onClick={() => { handleSwitchPage(p.id); setMobileFabOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                            selectedPageId === p.id ? "bg-primary/10 text-primary font-semibold" : "text-on-surface-variant hover:bg-surface-container-low"
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-bold shrink-0">
                            {idx + 1}
                          </span>
                          {p.title}
                        </button>
                      ))}
                    </div>
                  </div>
                  <BibleStudyTools
                    selectedBibleId=""
                    selectedChapterId={selectedPageId || ""}
                    onNavigateToChapter={(chId) => {
                      handleSwitchPage(chId);
                      setMobileFabOpen(false);
                    }}
                    reversed
                  />
                </div>
              </div>
            )}
          </>,
          document.body
        )}

        {/* ══════════════ BOOKMARKS TAB ══════════════ */}
        {activeTab === "bookmarks" && (
          <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-32">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-headline text-on-surface mb-2">Bookmarks</h1>
                <p className="text-on-surface-variant">Your saved Bible passages.</p>
              </div>
              {selectedChapterId && readerStep === "reading" && (
                <button
                  onClick={handleToggleBookmark}
                  disabled={addBookmarkMut.isPending || removeBookmarkMut.isPending}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                    currentChapterBookmarked
                      ? "bg-primary/15 text-primary"
                      : "bg-primary text-on-primary hover:bg-primary/90"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={currentChapterBookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    bookmark
                  </span>
                  {currentChapterBookmarked ? "Bookmarked" : "Bookmark Current"}
                </button>
              )}
            </div>

            {bookmarksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Shimmer key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : bookmarksList.length > 0 ? (
              <div className="space-y-3">
                {bookmarksList.map((bm: any) => (
                  <div
                    key={bm.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/15 hover:border-primary/30 transition-all group"
                  >
                    <button
                      onClick={() => {
                        if (bm.verse_reference) {
                          handleSwitchChapter(bm.verse_reference);
                          setReaderStep("reading");
                          setActiveTab("standard");
                        }
                      }}
                      className="flex items-center gap-3 text-left flex-1 min-w-0"
                    >
                      <span
                        className="material-symbols-outlined text-primary text-xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        bookmark
                      </span>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-on-surface group-hover:text-primary transition-colors">
                          {formatVerseRef(bm.verse_reference)}
                        </p>
                        <p className="text-xs text-on-surface-variant/60 mt-0.5">
                          {bm.bookmark_type === "api_bible" ? "Bible" : "Study"} &middot; {new Date(bm.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => removeBookmarkMut.mutate(bm.id)}
                      disabled={removeBookmarkMut.isPending}
                      className="p-2 text-on-surface-variant/0 group-hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                      title="Remove bookmark"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4 block">bookmark</span>
                <p className="text-on-surface-variant/60 text-lg">No bookmarks yet</p>
                <p className="text-on-surface-variant/40 text-sm mt-2">Read a chapter and click &ldquo;Bookmark&rdquo; to save it here.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ NOTES TAB ══════════════ */}
        {activeTab === "notes" && (
          <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-32">
            <h1 className="text-3xl sm:text-4xl font-headline text-on-surface mb-2">Notes</h1>
            <p className="text-on-surface-variant mb-6">Your personal Bible study notes.</p>

            {/* Add note form */}
            {selectedChapterId && (
              <div className="mb-8 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/15">
                <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/60 block mb-2">
                  Add note for {formatVerseRef(selectedChapterId)}
                </label>
                <div className="flex gap-3">
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Write your thoughts, reflections..."
                    rows={2}
                    className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={addNoteMut.isPending || !newNoteText.trim()}
                    className="self-end px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    {addNoteMut.isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}

            {!selectedChapterId && (
              <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">info</span>
                Select a chapter in the Bible tab first to add a new note.
              </div>
            )}

            {notesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Shimmer key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : notesList.length > 0 ? (
              <div className="space-y-3">
                {notesList.map((note: any) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/15 group"
                  >
                    {editingNoteId === note.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          rows={3}
                          autoFocus
                          className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setEditingNoteId(null); setEditNoteText(""); }}
                            className="px-3 py-1.5 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEditNote}
                            disabled={updateNoteMut.isPending || !editNoteText.trim()}
                            className="px-4 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                          >
                            {updateNoteMut.isPending ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <button
                            onClick={() => {
                              if (note.verse_reference) {
                                handleSwitchChapter(note.verse_reference);
                                setReaderStep("reading");
                                setActiveTab("standard");
                              }
                            }}
                            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                          >
                            {formatVerseRef(note.verse_reference) || "Untitled"}
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleStartEditNote(note)}
                              className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container-low transition-all"
                              title="Edit note"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button
                              onClick={() => removeNoteMut.mutate(note.id)}
                              disabled={removeNoteMut.isPending}
                              className="p-1.5 text-on-surface-variant hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                              title="Delete note"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-on-surface-variant leading-relaxed">{note.text}</p>
                        <p className="text-[10px] text-on-surface-variant/40 mt-2">
                          {new Date(note.created_at).toLocaleDateString()} {note.updated_at !== note.created_at && "(edited)"}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4 block">edit_note</span>
                <p className="text-on-surface-variant/60 text-lg">No notes yet</p>
                <p className="text-on-surface-variant/40 text-sm mt-2">Read a chapter and add your thoughts here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default function BiblePage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <Shimmer className="h-12 w-full mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <Shimmer key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </MainLayout>
    }>
      <BibleContent />
    </Suspense>
  );
}
