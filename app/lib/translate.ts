const GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";
const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

const cache = new Map<string, string>();

function cacheKey(text: string, from: string, to: string): string {
  return `${from}:${to}:${text.slice(0, 100)}`;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
}

/** Top 20 most popular languages for Bible translation. */
export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", rtl: false },
  { code: "es", name: "Spanish", nativeName: "Espanol", rtl: false },
  { code: "fr", name: "French", nativeName: "Francais", rtl: false },
  { code: "pt", name: "Portuguese", nativeName: "Portugues", rtl: false },
  { code: "de", name: "German", nativeName: "Deutsch", rtl: false },
  { code: "it", name: "Italian", nativeName: "Italiano", rtl: false },
  { code: "ru", name: "Russian", nativeName: "Russkiy", rtl: false },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "Zhongwen", rtl: false },
  { code: "ja", name: "Japanese", nativeName: "Nihongo", rtl: false },
  { code: "ko", name: "Korean", nativeName: "Hangugeo", rtl: false },
  { code: "hi", name: "Hindi", nativeName: "Hindi", rtl: false },
  { code: "ar", name: "Arabic", nativeName: "Al-Arabiyyah", rtl: true },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", rtl: false },
  { code: "vi", name: "Vietnamese", nativeName: "Tieng Viet", rtl: false },
  { code: "th", name: "Thai", nativeName: "Thai", rtl: false },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", rtl: false },
  { code: "fil", name: "Filipino", nativeName: "Filipino", rtl: false },
  { code: "pl", name: "Polish", nativeName: "Polski", rtl: false },
  { code: "uk", name: "Ukrainian", nativeName: "Ukrayinska", rtl: false },
  { code: "he", name: "Hebrew", nativeName: "Ivrit", rtl: true },
];

export const DEFAULT_LANGUAGE = "en";

/**
 * Translate text using Google Translate with MyMemory as fallback.
 * Results are cached in-memory to avoid repeated requests.
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = "en",
): Promise<string> {
  if (!text.trim() || targetLang === sourceLang) return text;

  const key = cacheKey(text, sourceLang, targetLang);
  const cached = cache.get(key);
  if (cached) return cached;

  const chunks = splitText(text, 4000);
  let translated: string[];

  try {
    translated = await Promise.all(
      chunks.map((chunk) => googleTranslateChunk(chunk, targetLang, sourceLang)),
    );
  } catch {
    // Fallback to MyMemory if Google Translate fails
    translated = await Promise.all(
      chunks.map((chunk) => myMemoryTranslateChunk(chunk, targetLang, sourceLang)),
    );
  }

  const fullResult = translated.join("");
  cache.set(key, fullResult);

  // Evict oldest 10% when cache gets large
  if (cache.size > 200) {
    const toDelete = Math.ceil(cache.size * 0.1);
    const keys = cache.keys();
    for (let i = 0; i < toDelete; i++) {
      const k = keys.next().value;
      if (k) cache.delete(k);
    }
  }

  return fullResult;
}

/** Google Translate (unofficial free endpoint). */
async function googleTranslateChunk(
  text: string,
  targetLang: string,
  sourceLang: string,
): Promise<string> {
  const params = new URLSearchParams({
    client: "gtx",
    sl: sourceLang,
    tl: targetLang,
    dt: "t",
    q: text,
  });

  const response = await fetch(`${GOOGLE_TRANSLATE_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Google Translate failed: ${response.status}`);
  }

  const data = await response.json();

  if (Array.isArray(data) && Array.isArray(data[0])) {
    return (data[0] as Array<[string, ...unknown[]] | null>)
      .filter((segment): segment is [string, ...unknown[]] => !!segment?.[0])
      .map((segment) => segment[0])
      .join("");
  }

  return text;
}

/** MyMemory Translation API (free, no key needed, 5000 chars/day anonymous). */
async function myMemoryTranslateChunk(
  text: string,
  targetLang: string,
  sourceLang: string,
): Promise<string> {
  const params = new URLSearchParams({
    q: text,
    langpair: `${sourceLang}|${targetLang}`,
  });

  const response = await fetch(`${MYMEMORY_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`MyMemory failed: ${response.status}`);
  }

  const data = await response.json();

  if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
    return data.responseData.translatedText;
  }

  throw new Error("MyMemory returned no translation");
}

function splitText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    let breakAt = remaining.lastIndexOf(". ", maxLength);
    if (breakAt === -1 || breakAt < maxLength * 0.5) {
      breakAt = remaining.lastIndexOf("\n", maxLength);
    }
    if (breakAt === -1 || breakAt < maxLength * 0.5) {
      breakAt = remaining.lastIndexOf(" ", maxLength);
    }
    if (breakAt === -1) {
      breakAt = maxLength;
    }

    chunks.push(remaining.slice(0, breakAt + 1));
    remaining = remaining.slice(breakAt + 1);
  }

  return chunks;
}
