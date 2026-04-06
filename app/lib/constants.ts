// Shared constants used across multiple components

export const REACTIONS = [
  { type: "praying_hands", emoji: "\u{1F64F}", label: "Praying Hands" },
  { type: "heart", emoji: "\u2764\uFE0F", label: "Heart" },
  { type: "fire", emoji: "\u{1F525}", label: "Fire" },
  { type: "amen", emoji: "\u{1F64C}", label: "Amen" },
  { type: "cross", emoji: "\u271D\uFE0F", label: "Cross" },
] as const;

export const LANGUAGES = [
  // Global / Americas / Europe (West)
  { code: "en", label: "English", name: "English", short: "EN", countryCode: "us" },
  { code: "es", label: "Espa\u00f1ol", name: "Espa\u00f1ol", short: "ES", countryCode: "es" },
  { code: "pt", label: "Portugu\u00eas", name: "Portugu\u00eas", short: "PT", countryCode: "br" },
  { code: "fr", label: "Fran\u00e7ais", name: "Fran\u00e7ais", short: "FR", countryCode: "fr" },
  { code: "de", label: "Deutsch", name: "Deutsch", short: "DE", countryCode: "de" },
  { code: "it", label: "Italiano", name: "Italiano", short: "IT", countryCode: "it" },
  { code: "nl", label: "Nederlands", name: "Nederlands", short: "NL", countryCode: "nl" },
  // Europe (Central / Eastern)
  { code: "pl", label: "Polski", name: "Polski", short: "PL", countryCode: "pl" },
  { code: "ro", label: "Rom\u00e2n\u0103", name: "Rom\u00e2n\u0103", short: "RO", countryCode: "ro" },
  { code: "hu", label: "Magyar", name: "Magyar", short: "HU", countryCode: "hu" },
  { code: "cs", label: "\u010ce\u0161tina", name: "\u010ce\u0161tina", short: "CS", countryCode: "cz" },
  { code: "hr", label: "Hrvatski", name: "Hrvatski", short: "HR", countryCode: "hr" },
  { code: "el", label: "\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac", name: "\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac (Greek)", short: "EL", countryCode: "gr" },
  { code: "ru", label: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", name: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439 (Russian)", short: "RU", countryCode: "ru" },
  { code: "uk", label: "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430", name: "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430 (Ukrainian)", short: "UK", countryCode: "ua" },
  // Middle East
  { code: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", name: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629 (Arabic)", short: "AR", countryCode: "sa" },
  { code: "he", label: "\u05e2\u05d1\u05e8\u05d9\u05ea", name: "\u05e2\u05d1\u05e8\u05d9\u05ea (Hebrew)", short: "HE", countryCode: "il" },
  { code: "tr", label: "T\u00fcrk\u00e7e", name: "T\u00fcrk\u00e7e", short: "TR", countryCode: "tr" },
  // South Asia
  { code: "hi", label: "\u0939\u093f\u0928\u094d\u0926\u0940", name: "\u0939\u093f\u0928\u094d\u0926\u0940 (Hindi)", short: "HI", countryCode: "in" },
  { code: "bn", label: "\u09ac\u09be\u0982\u09b2\u09be", name: "\u09ac\u09be\u0982\u09b2\u09be (Bengali)", short: "BN", countryCode: "bd" },
  { code: "ta", label: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd", name: "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd (Tamil)", short: "TA", countryCode: "in" },
  { code: "te", label: "\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41", name: "\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41 (Telugu)", short: "TE", countryCode: "in" },
  { code: "ml", label: "\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02", name: "\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02 (Malayalam)", short: "ML", countryCode: "in" },
  // East & Southeast Asia
  { code: "zh", label: "\u4e2d\u6587", name: "\u4e2d\u6587 (Chinese)", short: "ZH", countryCode: "cn" },
  { code: "ja", label: "\u65e5\u672c\u8a9e", name: "\u65e5\u672c\u8a9e (Japanese)", short: "JA", countryCode: "jp" },
  { code: "ko", label: "\ud55c\uad6d\uc5b4", name: "\ud55c\uad6d\uc5b4 (Korean)", short: "KO", countryCode: "kr" },
  { code: "vi", label: "Ti\u1ebfng Vi\u1ec7t", name: "Ti\u1ebfng Vi\u1ec7t", short: "VI", countryCode: "vn" },
  { code: "th", label: "\u0e44\u0e17\u0e22", name: "\u0e44\u0e17\u0e22 (Thai)", short: "TH", countryCode: "th" },
  { code: "id", label: "Bahasa Indonesia", name: "Bahasa Indonesia", short: "ID", countryCode: "id" },
  { code: "fil", label: "Filipino", name: "Filipino", short: "FIL", countryCode: "ph" },
  { code: "my", label: "\u1019\u103c\u1014\u103a\u1019\u102c", name: "\u1019\u103c\u1014\u103a\u1019\u102c (Burmese)", short: "MY", countryCode: "mm" },
  // Africa
  { code: "sw", label: "Kiswahili", name: "Kiswahili", short: "SW", countryCode: "ke" },
  { code: "am", label: "\u12a0\u121b\u122d\u129b", name: "\u12a0\u121b\u122d\u129b (Amharic)", short: "AM", countryCode: "et" },
  { code: "yo", label: "Yor\u00f9b\u00e1", name: "Yor\u00f9b\u00e1", short: "YO", countryCode: "ng" },
  { code: "zu", label: "isiZulu", name: "isiZulu", short: "ZU", countryCode: "za" },
] as const;

export const VERSE_BACKGROUNDS = [
  "mountain-bg.png",
  "forest-bg.png",
  "ocean-bg.png",
  "aurora-bg.png",
  "desert-bg.png",
] as const;
