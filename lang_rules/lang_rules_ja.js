/* lang_rules_ja.js — Japanese language-level rules and data (not tied to any single word id).
   Two things live here:

   1. LangRules.register — verb/adjective conjugation rules (五段/一段, い形容詞) are a
      future addition; until then this stays empty and the engine falls back to
      word/forms[]/word_forms.js as normal. isJP substring-only matching in
      lang_rules_core.js already handles the no-whitespace issue.

   2. window.KanjiReadings — kanji-chunk -> reading lookup table for jpRuby() furigana.
      HARVESTED, not hand-typed: every entry below was extracted from Noah's own
      already-authored (sentence, sentence_reading) / (word, reading) pairs using
      the same alignment logic jpRuby() itself uses — never guessed from general
      kanji knowledge, so there is no risk of introducing a reading Noah didn't
      already write and verify himself.
      When jpRuby() finds a kanji chunk here, it uses this reading directly and
      skips the position-search alignment entirely for that chunk — immune to
      the whole class of alignment bugs (the 、 leading-punctuation bug fixed
      earlier, and any future duplicate-substring edge case). Chunks not listed
      here still fall through to the existing search-based alignment, unchanged
      — this table is purely additive, safe to ship empty or partial.
      Currently seeded from only 2 word files (ja_0001, ja_0002) — this is a
      proof of concept, not broad "common kanji" coverage. Grow this by running
      harvest_kanji_readings.js (kept locally, not part of the game files) over
      the full word corpus as it's uploaded, reviewing the output, and pasting
      new entries in below — do NOT hand-add guessed entries here, the whole
      point is that every entry is traceable back to a sentence Noah actually
      wrote and verified. */
LangRules.register('japanese', {});

window.KanjiReadings = window.KanjiReadings || {};
Object.assign(window.KanjiReadings, {
  "切手": "きって",
  "貼": "は",
  "珍": "めずら",
  "集": "あつ",
  "好": "す",
  "家": "いえ",
  "帰": "かえ",
  "電話": "でんわ",
  "雨": "あめ",
  "降": "ふ",
  "試合": "しあい",
  "中止": "ちゅうし",
  "春": "はる",
  "花見": "はなみ"
});
