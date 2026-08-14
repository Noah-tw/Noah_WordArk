/* ─── QUESTION GENERATORS ─────────────────────────────────── */
// Shared Levenshtein distance utility for distractor quality filtering.
// Used by genSpelling, genListeningWord, genDefinition to exclude visually
// too-similar distractors (distance <= 2) that would make MC unfairly hard.
// Capped at 20 chars to avoid O(n*m) expense on very long words.
function _lev(a,b){
  if(!a||!b)return Math.max((a||'').length,(b||'').length);
  if(a===b)return 0;
  const m=a.length,n=b.length;
  if(m>20||n>20)return Math.abs(m-n);
  const dp=Array.from({length:m+1},(_,i)=>Array.from({length:n+1},(_,j)=>i?j?0:i:j));
  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}
// Shared article-root extractor for German same-root distractor filtering
function _deRoot(w){
  return w?(w.replace(/^(der|die|das|den|dem|des|ein|eine|einen|einem|eines)\s+/i,'')).toLowerCase():'';
}

function genDefinition(r,pool,lc){
  // German: pre-filter pool to exclude same-root words before meaning selection
  // so "der Zug" (train) doesn't compete with "ziehen" (to pull) as distractor
  const _defPool= r.lang==='german'
    ? pool.filter(x=>x.id===r.id||_deRoot(x.word)!==_deRoot(r.word))
    : pool;
  const d=padArr(dMean(r,_defPool,3,r.forbidden_distractors||null),3);
  const isJP=lc.type==='japanese';
  // Pick a random sentence from all available
  const sentSlots=[
    {s:r.sentence1, sr:r.sentence1_reading||null, se:r.sentence1_en||null, hl:r.sentence1_hl||null},
    {s:r.sentence2, sr:r.sentence2_reading||null, se:r.sentence2_en||null, hl:null},
    {s:r.sentence3, sr:r.sentence3_reading||null, se:r.sentence3_en||null, hl:null},
  ].filter(x=>x.s);
  const sent=sentSlots.length?sentSlots[0|Math.random()*sentSlots.length]:{s:null,sr:null,se:null,hl:null};
  return {mode:'definition',wordId:r.id,lang:r.lang,
    displayWord:r.word,
    displayReading:isJP&&r.reading&&r.word!==r.reading?r.reading:null,
    displayKanji:null,
    displayHint:isJP?null:(r.ipa||null),
    prompt:'What does this word mean?', answer:r.meaning,
    options:shuffle([r.meaning,...d]),
    tts:isJP?(r.reading||r.word):(r.tts_override||r.word),
    sentence1:sent.s, sentence1_en:sent.se,
    sentence1_hl:sent.hl,
    sentence1_reading:sent.sr,
    pos:r.pos||null, definition:r.definition||null,
    zh:r.zh||null, zh_def:r.zh_def||null,
    meta:{romaji:r.romaji}};
}
function canDefinition(r){return !!(r.word&&r.meaning);}

function genMatchingSet(pool,lc,size=5){
  // Deduplicate by normalised meaning so words sharing the same core meaning
  // (e.g. ser "to be (permanent)" and estar "to be (temporary)") never appear
  // in the same matching set — the player could not distinguish them.
  const _meaningKey=m=>{
    if(!m)return '';
    // Collapse parenthetical qualifiers: "to be (temporary state)" → "to be"
    return m.replace(/\s*\(.*?\)/g,'').trim().toLowerCase();
  };
  const seen=new Set();
  const eligible=shuffle(pool.filter(r=>r.word&&r.meaning));
  const c=[];
  for(const r of eligible){
    const key=_meaningKey(r.meaning);
    if(seen.has(key))continue;
    // BUG-10 FIX: use true median (average of two middle values for even arrays).
    // Old code used upper-median (lens[floor(n/2)]) which is biased high for even arrays,
    // letting long Finnish compounds inflate the gate and pass other long words through.
    if(c.length>=1){
      const lens=c.map(x=>_cleanWord(x.word).length).sort((a,b)=>a-b);
      const mid=Math.floor(lens.length/2);
      const median=lens.length%2===0?(lens[mid-1]+lens[mid])/2:lens[mid];
      const wLen=_cleanWord(r.word).length;
      if(median>0&&(wLen>median*3||wLen*3<median))continue;
    }
    seen.add(key);
    c.push(r);
    if(c.length>=size)break;
  }
  if(c.length<2)return null;
  return {mode:'matching',wordIds:c.map(r=>r.id),lang:c[0].lang,
    pairs:c.map(r=>({id:r.id,word:r.word,reading:r.reading||null,meaning:r.meaning})),
    prompt:'Match each word to its meaning.',tts:null};
}




// Unicode NFC normalisation — prevents NFD/NFC mismatch between authored data and
// browser strings. macOS writes NFD by default; browsers compare in NFC. Without this,
// accented characters that look identical can fail string comparison silently.
// Applied to ALL string comparisons throughout the engine.
function _nfc(s){return(s&&s.normalize)?s.normalize('NFC'):s||'';}
// BUG-FIX #301/#304 (Dagesh triple-encoding + full-width alphanumerics):
// _sanitizeInput already applies NFKC to typed answers. CharacterTiles and KanaSpelling
// compare pre-rendered tile chars with _nfc(), but Hebrew Dagesh (U+05BC) composites and
// full-width ASCII variants (U+FF01-U+FF5E) survive NFC unchanged, so a tile char built
// from a database with dagesh-before-shin-dot ordering can silently differ from one built
// with shin-dot-before-dagesh ordering despite looking identical. Use NFKC on tile values
// so both sides of every === in G_ctTap / G_ksTap are normalized the same way.
function _nfkc(s){return(s&&s.normalize)?s.normalize('NFKC'):s||'';}

// BUG FIX: Strip invisible Unicode characters that survive NFC normalization.
// Covers: ZWNJ (U+200C), ZWJ (U+200D), ZWS (U+200B), BOM (U+FEFF),
// soft-hyphen (U+00AD), and iOS zero-width space injected by predictive text.
// Also normalises half-width Katakana (ｱ-ﾝ) to full-width (ア-ン) for Japanese
// kanaSpelling — half-width and full-width look identical but fail strict ===.
// Applied to all answer strings before comparison.
function _sanitizeInput(s){
  if(!s)return '';
  // Strip invisible / zero-width Unicode
  s=s.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u00AD]/g,'');
  // BUG-FIX #76 (Hebrew Geresh): mobile keyboards often substitute the Hebrew Geresh ׳ (U+05F3)
  // with a standard English single-quote ' (U+0027) in loanwords like צ׳יפס.
  // Normalise straight quote → Geresh only when surrounded by Hebrew characters.
  // Also normalise the reverse: typed Geresh in a non-Hebrew context → straight quote.
  // Strategy: strip both from comparison by mapping Geresh → straight quote universally,
  // so צ'יפס and צ׳יפס both compare equal.
  s=s.replace(/\u05F3/g,"'");
  // BUG-FIX #110 (Hebrew Gershayim): Hebrew acronyms like צה״ל use the Gershayim ״ (U+05F4).
  // Mobile keyboards output the standard English double-quote " (U+0022) instead — visually
  // identical but fails strict ===. Normalise U+05F4 → " so both compare equal.
  s=s.replace(/\u05F4/g,'"');
  // BUG-FIX #108 (Yiddish Double-Yod ligature): The double Yod יי can be typed as two
  // individual Yod characters (U+05D9 + U+05D9) OR the single ligature ײ (U+05F2).
  // Mobile keyboards output two chars; some databases store the ligature. Normalise to two chars.
  s=s.replace(/\u05F2/g,'\u05D9\u05D9');
  // BUG-FIX #243 (Unicode Variation Selectors): Japanese IMEs append invisible VS chars
  // (U+FE00–U+FE0F) to Kanji to force specific stroke orders (e.g. 辻 vs 辻󠄀).
  // They look identical on screen but fail === equality. Strip them from all inputs.
  s=s.replace(/[\uFE00-\uFE0F]/g,'');
  // BUG-FIX #202F (French Narrow No-Break Space): French typography uses Narrow No-Break Space
  // (U+202F) before colons, semicolons, exclamation marks, and question marks.
  // If a Mac-authored database contains U+202F but the comparison string has U+0020 (normal space),
  // strict === fails. Normalise both U+202F and U+00A0 (regular NBSP) to plain space U+0020.
  // 351 #22 (Canadian vs Metropolitan French colon spacing also resolved by this normalisation).
  s=s.replace(/[          ]/g,' ');
  // BUG-FIX (French guillemets as tiles 351 #24): « and » should never be answer tiles.
  // Strip them from comparison strings so their presence/absence doesn't affect scoring.
  // The sentence content is what matters, not the quote marks.
  s=s.replace(/[«»‹›]/g,'');
  // BUG-FIX (French œ/æ ligature 140 #18 / 351 #23): Standard keyboards cannot type œ (U+0153)
  // without special input methods. Accept "oe" as equivalent to "œ" and "ae" as "æ".
  // Applied AFTER NFKC (which decomposes ﬁ/ﬂ) so the substitution is additive.
  s=s.replace(/œ/gi,m=>m==='Œ'?'OE':'oe');
  s=s.replace(/æ/gi,m=>m==='Æ'?'AE':'ae');
  // BUG-FIX (typographic apostrophe): iOS auto-correct replaces straight ' with curly ' (U+2019)
  // or ' (U+2018). Normalise all curly/angled apostrophes to straight ' so French l'arbre etc.
  // compare correctly regardless of which keyboard or device authored the text.
  s=s.replace(/[\u2018\u2019\u02BC\u02BB\u0060]/g,"'");
  // Normalise half-width Katakana → full-width (U+FF65–U+FF9F → U+30A0–U+30FF range)
  s=s.replace(/[\uFF65-\uFF9F]/g,c=>{
    const map={
      '\uFF65':'・','\uFF66':'ヲ','\uFF67':'ァ','\uFF68':'ィ','\uFF69':'ゥ',
      '\uFF6A':'ェ','\uFF6B':'ォ','\uFF6C':'ャ','\uFF6D':'ュ','\uFF6E':'ョ',
      '\uFF6F':'ッ','\uFF70':'ー','\uFF71':'ア','\uFF72':'イ','\uFF73':'ウ',
      '\uFF74':'エ','\uFF75':'オ','\uFF76':'カ','\uFF77':'キ','\uFF78':'ク',
      '\uFF79':'ケ','\uFF7A':'コ','\uFF7B':'サ','\uFF7C':'シ','\uFF7D':'ス',
      '\uFF7E':'セ','\uFF7F':'ソ','\uFF80':'タ','\uFF81':'チ','\uFF82':'ツ',
      '\uFF83':'テ','\uFF84':'ト','\uFF85':'ナ','\uFF86':'ニ','\uFF87':'ヌ',
      '\uFF88':'ネ','\uFF89':'ノ','\uFF90':'ハ','\uFF91':'ヒ','\uFF92':'フ',
      '\uFF93':'ヘ','\uFF94':'ホ','\uFF95':'マ','\uFF96':'ミ','\uFF97':'ム',
      '\uFF98':'メ','\uFF99':'モ','\uFF9A':'ヤ','\uFF9B':'ユ','\uFF9C':'ヨ',
      '\uFF9D':'ラ','\uFF9E':'リ','\uFF9F':'ル'
    };
    return map[c]||c;
  });
  // BUG-FIX #123 (ligature collapse): macOS/iOS auto-substitutes fi/fl/ff etc.
  // into Unicode ligatures (U+FB00-U+FB06). NFC does NOT decompose these — NFKC does.
  // 'office' typed on macOS may become 'ofﬁce' (U+FB01 for fi), failing string comparison.
  if(s.normalize) s=s.normalize('NFKC');
  // BUG-FIX #64 (Sofit mid-word stranding): iOS keyboard auto-converts מ→ם when it's the
  // last character. If the user then inserts a letter before it, ם becomes stranded mid-word.
  // Normalise: any sofit letter (ך ם ן ף ץ) that is NOT at the END of a Hebrew word token
  // is converted back to its non-sofit form. This makes mid-stranded sofits compare equal
  // to the correct form, forgiving the OS autocorrect bug without penalising the learner.
  s=s.replace(/([\u05D0-\u05EA\u05F0-\u05F4])(?=[\u05D0-\u05EA\u05F0-\u05F4\u05B0-\u05C7])/g,c=>{
    const sofitMap={
      '\u05DA':'\u05DB', // ך→כ
      '\u05DD':'\u05DE', // ם→מ
      '\u05DF':'\u05E0', // ן→נ
      '\u05E3':'\u05E4', // ף→פ
      '\u05E5':'\u05E6', // ץ→צ
    };
    return sofitMap[c]||c;
  });
  // BUG-FIX (Romance/Finnish accent tolerance): Spanish/French/Italian/Finnish use
  // accented characters (á é í ó ú à è ù â ê ô ä ö ü ñ ç) that many keyboards lack.
  // Rather than failing on missing accents, we normalise by stripping combining diacritics
  // from the INPUT only — the authored answer stays accented for display, but comparison
  // accepts both forms. Applied after NFKC so ligatures are already decomposed.
  // Note: this does NOT apply to Hebrew/Arabic/Japanese which use diacritics semantically.
  // The check is: if the string contains only non-Hebrew/Arabic/CJK characters, strip diacritics.
  if(!/[֐-׿؀-ۿ　-鿿가-퟿]/.test(s)){
    s=s.normalize('NFD').replace(/[̀-ͯ]/g,'').normalize('NFC');
  }
  // BUG-FIX (German ß/ss equivalence): German spelling reform means ß only appears after
  // long vowels/diphthongs, but many keyboards (especially non-German) lack the ß key.
  // Normalise ß→ss so 'gross' compares equal to 'groß', and 'strasse' equals 'Straße'.
  // Applied last so it doesn't interfere with NFKC or other normalisations above.
  s=s.replace(/ß/g,'ss').replace(/ẞ/g,'SS');
  // Strip trailing punctuation that a user might accidentally add (period, comma etc.)
  s=s.replace(/[.,!?\u3002\u3001\uff01\uff1f\s]+$/,'');
  return _nfc(s).trim();
}

// BUG FIX 1: Unicode-safe whole-token check.
// Plain includes() matches "run" inside "running". This uses lookbehind/lookahead
// with \p{L}\p{N} (any Unicode letter/digit) so "run" won't match inside "running",
// but "ei" still matches in Finnish and Japanese kanji still match (isJP bypasses boundary).
// Also applies NFC normalization on both sides before comparison.
function _formInSent(sent,form,isJP){
  return LangRules.formInSentence(sent,form,isJP);
}

function _blankSentences(r,lc){
  // Return all sentence slots that contain the target word or any of its forms (case-insensitive)
  const isJP=lc.type==='japanese';
  // BUG FIX (pipe normalization): normalize pipes→spaces so 'act|as' matches 'act as' in sentences,
  // otherwise canBlank() silently returns false for all piped-phrase words.
  const allForms=LangRules.expandForms(r.word, [...(r.forms||[]), ...(WordForms[r.id]||[])], r.lang);

  const slots=[
    {sent:r.sentence1, sentReading:r.sentence1_reading||null, sentEn:r.sentence1_en||null},
    {sent:r.sentence2, sentReading:r.sentence2_reading||null, sentEn:r.sentence2_en||null},
    {sent:r.sentence3, sentReading:r.sentence3_reading||null, sentEn:r.sentence3_en||null},
  ];
  return slots.filter(s=>s.sent&&allForms.some(form=>_formInSent(s.sent,form,isJP)));
}



function genBlank(r,pool,lc){
  const isJP=lc.type==='japanese';
  const eligible=_blankSentences(r,lc);
  // RUNTIME GUARD: if no sentence is reachable (forms[] incomplete for this word),
  // do NOT silently return a broken question. Fall back to Definition mode so the
  // player at least gets a valid question rather than a blank that can never be solved.
  // VocabValidator.run() will tell the author exactly which forms[] entries are missing.
  if(!eligible.length) {
    console.warn(`[WordArk] genBlank: no reachable sentence for "${r.word}" (${r.id}) — falling back to definition. Run VocabValidator.run() to find missing forms[].`);
    return genDefinition(r,pool,lc);
  }
  // Prefer a sentence slot not already used by sentenceTiles for this word this session
  const usedSent=r._usedSentInSession||null;
  const preferred=eligible.filter(s=>s.sent!==usedSent);
  const pool2=preferred.length?preferred:eligible;
  const chosen=pool2[0|Math.random()*pool2.length];
  const sentRaw=chosen.sent;
  // Record so sentenceTiles can avoid the same sentence
  r._usedSentInSession=sentRaw;
  const sentReading=chosen.sentReading;
  const sentEn=chosen.sentEn;

  const wordHtml=isJP&&r.reading?jpRuby(r.word,r.reading):_cleanWord(r.word);
  const blankToken='___';

  // Sort longest-first so 'talossa' matches before 'talo' — prevents [talossa]ssa bug
  // BUG FIX (pipe normalization): piped phrases like 'the|more' must be searched as 'the more'
  // because sentRaw always uses spaces. Without normalizing, fullFormEsc = 'the\|more' which
  // never matches the sentence, so no blank is created and the full answer stays visible.
  // BUG-FIX (acceptedForms gap): genBlank's allForms must include language auto-expansions
  // (German article stripping, verb stems, French elision, Spanish del/al, Italian articles,
  // Finnish case suffixes) so that acceptedForms passed to G_onBlank correctly accepts
  // inflected forms the learner may type. Without this, 'spricht' would be judged wrong
  // even though the engine correctly expanded sprechen→spricht in canBlank().
  // Solution: call _blankSentences() to get back the expanded allForms via a side-channel.
  // We throw away the slot results and just use the expanded form list.
  const allForms=LangRules.expandForms(r.word, [...(r.forms||[]), ...(WordForms[r.id]||[])], r.lang);

  const sentLower=sentRaw.toLowerCase();
  const sortedForms=[...allForms].sort((a,b)=>b.length-a.length);
  // BUG FIX 1: use _formInSent (Unicode word-boundary) so "run" won't match inside "running"
  const matchedForm=sortedForms.find(f=>_formInSent(sentRaw,f,isJP))||allForms[0]||r.word;

  // Blank the FULL matched form
  const fullFormEsc=matchedForm.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  // BUG FIX (word-boundary): add Unicode lookarounds for non-JP so "on" won't match inside "lion".
  // BUG FIX (blank-before-ruby): for JP, blank the RAW text first, then apply furigana HTML.
  // If we blanked sentenceHtml (post-ruby), the kanji would be split across HTML tags and
  // the regex would never find the intact word string, leaving the sentence un-blanked.
  // BUG-FIX (iOS <16.4): replace lookbehind with capturing-group approach.
  // (^|[^\p{L}\p{N}])word(?![\p{L}\p{N}]) is equivalent and works on all iOS versions.
  // For replace(), group 1 must be re-inserted so the leading non-word char is preserved.
  const blankRegexStr=isJP?fullFormEsc:'(^|[^\\p{L}\\p{N}])'+fullFormEsc+(matchedForm.replace(/[\u2018\u2019\u02bc\u0060]/g,"'").endsWith("'")?'':'(?![\\p{L}\\p{N}])');
  const _sentForBlankMatch=sentRaw.replace(/[\u2018\u2019\u02bc\u0060]/g,"'");
  const _blankMatch=_sentForBlankMatch.match(new RegExp(blankRegexStr.replace(/[\u2018\u2019\u02bc\u0060]/g,"'"),'iu'));
  // For non-JP, match[0] includes the leading boundary char — extract the actual word (group 1 or full)
  const _casedForm=_blankMatch?(_blankMatch[1]!==undefined&&!isJP?_blankMatch[0].replace(/^[^\p{L}\p{N}]/u,''):_blankMatch[0]):matchedForm;

  // BUG-FIX #12 (JP first-match kanji sabotage): regex .replace() hits the FIRST occurrence.
  // For a word like 日, the sentence 日曜日は日本に行きます has 日 inside 日曜日 first.
  // Without this fix, ___曜日は… is produced instead of blanking the intended standalone 日.
  // Fix: for Japanese, find the occurrence that is NOT immediately surrounded by other kanji
  // (i.e. a standalone token), and blank only that index using index-based replacement.
  let blankedRaw;
  if(isJP){
    const re=new RegExp(fullFormEsc,'g');
    const isKanjiChar=ch=>/[一-龯々]/.test(ch);
    let replaced=false;
    blankedRaw=sentRaw.replace(re,(match,offset)=>{
      if(replaced) return match; // only replace once, at the best position
      const before=offset>0?sentRaw[offset-1]:'';
      const after=sentRaw[offset+match.length]||'';
      // Prefer a match not flanked by kanji (standalone token)
      const flanked=isKanjiChar(before)||isKanjiChar(after);
      if(!flanked){replaced=true;return blankToken;}
      return match; // skip flanked occurrence, continue searching
    });
    // If every occurrence was flanked (pure embedded kanji), fall back to first occurrence
    if(!replaced) blankedRaw=sentRaw.replace(new RegExp(fullFormEsc,'u'),blankToken);
  } else {
    blankedRaw=sentRaw.replace(new RegExp(blankRegexStr,'iu'),(m,g1)=>(g1||'')+blankToken);
  }
  // Now apply furigana to the already-blanked string (JP), or use as-is (non-JP)
  let blanked=isJP&&sentReading?jpRuby(blankedRaw,sentReading):blankedRaw;

  // ansWord = inflected form shown in options — use the cased version from the sentence
  const ansWord=isJP?wordHtml:_cleanWord(_casedForm);
  const fillWord=matchedForm;

  const sentLowerForDistract = sentRaw.toLowerCase();
  // BUG-FIX (sentence word as distractor): dRecs was drawn from the full pool with
  // no check against the sentence. Words that appear in the sentence (e.g. "Venez"
  // in "Venez tous ici") could become distractors against the blanked word ("tous"),
  // effectively leaking the answer context and making the question misleading.
  // Fix: exclude any word (or its forms) that appears in the target sentence.
  const dRecs=shuffle(pool.filter(x=>{
    if(x.id===r.id) return false;
    if(!x.word) return false;
    const xWord = x.word.replace(/\|/g,' ').toLowerCase();
    if(sentLowerForDistract.includes(xWord)) return false;
    if((x.forms||[]).some(f=>f&&sentLowerForDistract.includes(f.replace(/\|/g,' ').toLowerCase()))) return false;
    return true;
  })).slice(0,3);
  const dWordsRaw=dRecs.map(x=>isJP&&x.reading?jpRuby(x.word,x.reading):_cleanWord(x.word)).filter(w=>w&&w!==ansWord);
  // BUG FIX: If ansWord is capitalised (sentence-start), capitalise all distractors too.
  // Otherwise the capital letter on the correct MC button gives the answer away instantly.
  const _ansCapital=!isJP&&ansWord&&ansWord[0]===ansWord[0].toUpperCase()&&ansWord[0]!==ansWord[0].toLowerCase();
  const dWords=padArr(dWordsRaw.map(w=>(_ansCapital&&w)?w[0].toUpperCase()+w.slice(1):w),3);

  const optMeanings={};
  optMeanings[ansWord]=r.meaning||'';
  dRecs.forEach((x,i)=>{optMeanings[dWords[i]]=x.meaning||'';});

  const tts=isJP?(sentReading||sentRaw):sentRaw;
  const displayBadge=isJP&&r.reading&&r.word!==r.reading?jpRuby(r.word,r.reading):_cleanWord(r.word);
  const acceptedForms=allForms.map(f=>isJP?wordHtml:_cleanWord(f));

  return {mode:'blank',wordId:r.id,lang:r.lang,
    displayWord:r.word, displayBadge,
    displayHint:r.meaning,
    sentenceDisplay:blanked,
    sentenceEn:sentEn||null,
    prompt:'Choose the missing word.',
    answer:ansWord, options:shuffle([ansWord,...dWords]),
    acceptedForms,
    optMeanings,
    tts,
    sentence1:sentRaw||null, sentence1_reading:sentReading||null,
    fillWord,
    meta:{}};
}



function canBlank(r,lc){
  if(lc.type==='hebrew')return false;
  return _blankSentences(r,lc).length>0;
}



function genSentenceTiles(r,pool,lc){
  const allCandidates=[{sent:r.sentence1, sentEn:r.sentence1_en||null},{sent:r.sentence2, sentEn:r.sentence2_en||null},{sent:r.sentence3, sentEn:r.sentence3_en||null}].filter(s=>s.sent&&s.sent.split(' ').length>=3);
  // RUNTIME GUARD: if no sentence has ≥3 words, fall back to matching rather than
  // returning a broken 0-tile SentenceTiles question.
  if(!allCandidates.length) {
    console.warn(`[WordArk] genSentenceTiles: no valid sentence (≥3 words) for "${r.word}" (${r.id}) — falling back to matching.`);
    return null; // buildQueue will skip this mode for this word
  }
  // Prefer a sentence not already used by blank mode for this word this session
  const usedSent=r._usedSentInSession||null;
  const preferred=allCandidates.filter(s=>s.sent!==usedSent);
  const candidates=preferred.length?preferred:allCandidates;
  const chosen=candidates[0|Math.random()*candidates.length]||{sent:r.sentence1,sentEn:r.sentence1_en||null};
  r._usedSentInSession=chosen.sent;

  // BUG FIX (CPU freeze): phraseSet is now pre-built by Store.load() — no per-question scan.
  // We still add the current word's own data in case it was loaded after Store.load().
  const phraseSet = new Set(Store.phraseSet);
  const _collectPhrase=(w)=>{if(w&&w.includes('|'))phraseSet.add(w.toLowerCase());};
  if(r.word_map){Object.keys(r.word_map).forEach(_collectPhrase);}
  if(r.word_raw){_collectPhrase(r.word_raw);}

  // Tokenise sentence, greedily matching multi-word phrases first
  function tokeniseSentence(sent){
    // Sort phrases longest-first so "not only but also" beats "not only"
    const phrases=[...phraseSet].sort((a,b)=>b.split('|').length-a.split('|').length);
    // BUG-FIX (ghost tile): filter empty strings caused by double-spaces in vocab data.
    // split(' ') on "foo  bar" produces ["foo","","bar"]; the "" becomes a 0-pixel invisible
    // tile that misaligns st.placed[], making the level permanently unsolvable.
    const words=sent.split(' ').filter(w=>w!=='');
    const tiles=[];
    let i=0;
    while(i<words.length){
      let matched=false;
      for(const ph of phrases){
        const parts=ph.split('|');
        if(i+parts.length>words.length)continue;
        const slice=words.slice(i,i+parts.length);
        if(slice.map(w=>w.toLowerCase()).join('|')===ph||slice.map(w=>_stClean(w).toLowerCase()).join('|')===ph){
          // Join the matched words with spaces as a single tile
          tiles.push(slice.join(' '));
          i+=parts.length;matched=true;break;
        }
      }
      if(!matched){tiles.push(words[i]);i++;}
    }
    return tiles;
  }

  const rawWords = tokeniseSentence(chosen.sent);

  // Seed tileTrans from the pre-built Store cache (avoids O(N) pool scan per question).
  // Overlay this word's own word_map for any custom phrase→meaning entries.
  const tileTrans=Object.assign({},Store.tileTransBase);
  const _mapWord=(w,m)=>{if(!w||!m)return;tileTrans[w]=m;tileTrans[w.toLowerCase()]=m;const wc=_getCoreWord(w);if(wc){tileTrans[wc]=m;tileTrans[wc.toLowerCase()]=m;}};
  // Also map pipe-phrase display form (e.g. "act as" → meaning)
  const _mapPhrase=(w,m)=>{if(!w||!m)return;const disp=w.replace(/\|/g,' ');tileTrans[disp]=m;tileTrans[disp.toLowerCase()]=m;_mapWord(w,m);};
  if(r.word_map){Object.entries(r.word_map).forEach(([w,m])=>_mapPhrase(w,m));}

  // answerClean: join tile tokens' core words
  const answerClean=rawWords.map(w=>{
    // For multi-word tile: clean each sub-word and join
    if(w.includes(' ')){return w.split(' ').map(p=>_getCoreWord(p).toLowerCase()).join(' ');}
    return _getCoreWord(w).toLowerCase();
  }).join(' ');

  // answerTiles: ordered tile tokens (may be multi-word), used for position-based checking
  const answerTiles = rawWords.map(w => {
    if(w.includes(' ')){return w.split(' ').map(p=>_stClean(p).toLowerCase()).join(' ');}
    return _stClean(w).toLowerCase();
  });

  // alternate_tiles support (bugs 20,54,79,80,81,197):
  // Data authors add alternate_tiles:[["word1","word2",...], ...] to vocab entries
  // for sentences with multiple valid word orders (Finnish free order, Spanish clitic
  // placement, French object-fronting). Each inner array is a full accepted tile sequence.
  // All alternatives are cleaned the same way as answerTiles for consistent comparison.
  const altTiles=(r.alternate_tiles||[]).map(alt=>
    alt.map(w=>w.includes(' ')?w.split(' ').map(p=>_stClean(p)).join(' '):_stClean(w).toLowerCase())
  );

  // SPANISH/ITALIAN CLITIC AUTO-ALTERNATE: clitics (me/te/se/lo/la/los/las/le/les/
  // mi/ti/si/lo/la/li/le/ci/vi/ne) can appear pre-verbal OR post-verbal (enclitic).
  // "Lo veo" ↔ "Veo lo" / "Me lo dai" ↔ "Dammelo" — auto-generate both orders
  // when a tile is a clitic pronoun and appears at position 0 or end.
  if((r.lang==='spanish'||r.lang==='italian') && rawWords.length>=2){
    const _clitics=r.lang==='spanish'
      ? new Set(['me','te','se','le','lo','la','nos','os','les','los','las'])
      : new Set(['mi','ti','si','lo','la','li','le','ci','vi','ne','me','te','se','gli']);
    const t0=rawWords[0]?rawWords[0].replace(/[,]/g,'').toLowerCase():'';
    const tLast=rawWords[rawWords.length-1]?rawWords[rawWords.length-1].replace(/[.!?,]/g,'').toLowerCase():'';
    // Pre-verbal clitic at position 0: generate post-verbal (enclitic) alternate
    if(_clitics.has(t0) && rawWords.length>=2){
      const withoutCliticFront=rawWords.slice(1);
      // Attach clitic to end of first remaining word (verb)
      const enclitic=[...withoutCliticFront,rawWords[0]]
        .map(w=>w.includes(' ')?w.split(' ').map(p=>_stClean(p)).join(' '):_stClean(w).toLowerCase());
      altTiles.push(enclitic);
    }
    // Double clitic: me lo / te lo at position 0-1
    if(rawWords.length>=3){
      const t1=rawWords[1]?rawWords[1].toLowerCase():'';
      if(_clitics.has(t0)&&_clitics.has(t1)){
        const rest=rawWords.slice(2);
        const swapped=[...rest,rawWords[0],rawWords[1]]
          .map(w=>w.includes(' ')?w.split(' ').map(p=>_stClean(p)).join(' '):_stClean(w).toLowerCase());
        altTiles.push(swapped);
      }
    }
  }

  // FRENCH ne...pas TOLERANCE: French negation wraps the verb (ne V pas).
  // In informal French, "ne" is often dropped → "Je comprends pas" = "Je ne comprends pas".
  // If sentence has ne...pas/ne...plus/ne...jamais/ne...que, also accept the version without "ne".
  if(r.lang==='french'){
    const _neIdx=rawWords.findIndex(w=>w.toLowerCase()==='ne'||w.toLowerCase()==="n'");
    const _negWords=new Set(['pas','plus','jamais','rien','personne','que','guère','nullement']);
    if(_neIdx>=0){
      const withoutNe=rawWords.filter((_,i)=>i!==_neIdx)
        .map(w=>w.includes(' ')?w.split(' ').map(p=>_stClean(p)).join(' '):_stClean(w).toLowerCase());
      altTiles.push(withoutNe);
    }
  }

  // GERMAN V2 AUTO-ALTERNATE: German allows time/place adverbials in position 1,
  // which forces subject-verb inversion (V2 rule). Engine auto-generates the
  // canonical Subject-first order as an accepted alternate so authors don't need
  // to manually add alternate_tiles for every sentence with a fronted adverbial.
  // Only fires for German; only when no manual alternate_tiles already cover this.
  // Pattern detected: tile[0]=adverb, tile[1]=verb, tile[2]=subject pronoun → generate S-V swap.
  // German time adverbs that commonly front: morgen/heute/gestern/jetzt/dann/dort/hier/
  // danach/vorher/später/früher/zuerst/schließlich/manchmal/oft/immer/nie/noch/auch/trotzdem
  if(r.lang==='german' && rawWords.length>=3){
    const _deTimeAdv=new Set(['morgen','heute','gestern','jetzt','dann','dort','hier',
      'danach','vorher','später','früher','zuerst','schließlich','manchmal','oft',
      'immer','nie','noch','auch','trotzdem','deshalb','daher','deswegen','außerdem',
      'zuerst','zuletzt','plötzlich','leider','natürlich','eigentlich','vielleicht']);
    const _deSubjPron=new Set(['ich','du','er','sie','es','wir','ihr','man']);
    const t0=rawWords[0]?rawWords[0].replace(/[,]/g,'').toLowerCase():'';
    const t1=rawWords[1]?rawWords[1].toLowerCase():'';
    const t2=rawWords[2]?rawWords[2].replace(/[,]/g,'').toLowerCase():'';
    // Detect: ADV VERB SUBJ ... → generate SUBJ VERB ... ADV alternate
    if(_deTimeAdv.has(t0) && _deSubjPron.has(t2)){
      // Swap: move adverb from front to end, restore normal S-V-O order
      // [ADV, VERB, SUBJ, ...rest] → [SUBJ, VERB, ...rest, ADV]
      const adv=rawWords[0]; const verb=rawWords[1]; const rest=rawWords.slice(2);
      const swapped=[...rest, adv].map(w=>w.includes(' ')?w.split(' ').map(p=>_stClean(p)).join(' '):_stClean(w).toLowerCase());
      altTiles.push(swapped);
    }
    // Also detect: SUBJ VERB ... ADV (canonical) → generate ADV VERB SUBJ alternate
    // This handles sentences written in canonical order so fronted form is also accepted
    const lastT=rawWords[rawWords.length-1]?rawWords[rawWords.length-1].replace(/[.!?]/g,'').toLowerCase():'';
    if(_deTimeAdv.has(lastT) && _deSubjPron.has(t0) && !_deTimeAdv.has(t0)){
      const adv=rawWords[rawWords.length-1]; const subj=rawWords[0]; const verb=rawWords[1]; const middle=rawWords.slice(2,-1);
      const fronted=[adv, verb, subj, ...middle].map(w=>w.includes(' ')?w.split(' ').map(p=>_stClean(p)).join(' '):_stClean(w).toLowerCase());
      altTiles.push(fronted);
    }
  }

  return {mode:'sentenceTiles',wordId:r.id,lang:r.lang,
    displayWord:r.word, displayHint:r.meaning,
    sentence1:chosen.sent, sentence1_en:chosen.sentEn,
    prompt:'Arrange the words to form the sentence.',
    answer:chosen.sent,
    answerClean, // space-joined cleaned string (kept for hint compat)
    answerTiles, // ordered array of cleaned tile tokens — source of truth for checking
    altTiles: altTiles.filter((a,i,arr)=>    // deduplicate identical alternates
      i===arr.findIndex(b=>b.length===a.length&&b.every((w,j)=>w===a[j]))),
    // additional accepted orderings from alternate_tiles[] in vocab data
    _wordForms:[r.word,...(r.forms||[])].map(f=>_getCoreWord(f).toLowerCase()), // for form-tolerant checking
    tiles:shuffle([...rawWords]),
    tileTrans,
    tts:chosen.sent, meta:{}};
}




function canSentenceTiles(r,lc){
  // BUG-FIX (IELTS contradiction): previously hardcoded lc.type==='ielts' exclusion here
  // while buildQueue's singles filter was also removing sentenceTiles for IELTS — creating
  // double-exclusion with conflicting ownership. Now canSentenceTiles() is the single source
  // of truth. IELTS is excluded here because its words only have sentence1 in English (not
  // a foreign language to arrange), making sentenceTiles meaningless for IELTS learners.
  // Japanese and Hebrew are excluded for structural reasons (no spaces / RTL tile complexity).
  if(lc.type==='japanese'||lc.type==='hebrew'||lc.type==='ielts')return false;
  return !![r.sentence1,r.sentence2,r.sentence3].find(s=>s&&s.split(' ').length>=3);
}

// Listening type A: hear a single word → pick the correct word spelling



function genListeningWord(r,pool,lc){
  const isJP=lc.type==='japanese';
  const ttsWord=isJP?(r.reading||r.word):(r.tts_override||r.word);
  // BUG FIX (furigana cheat): in listening mode the player must identify the kanji by ear.
  // jpRuby() would print the hiragana reading directly on the button, bypassing the test.
  // Use the raw word (kanji only) so they must link the sound to the written form.
  const ansWord=r.word;
  const _fdL=r.forbidden_distractors||null;
  const _ansRoot=_deRoot(r.word);
  const _ansCleanL=r.word.toLowerCase();
  const dWRecs=shuffle(pool.filter(x=>{
    if(x.id===r.id)return false;
    if(_fdL&&_fdL.has(x.word))return false;
    // German: exclude same-root different-article distractors
    if(r.lang==='german'&&_ansRoot&&_deRoot(x.word)===_ansRoot)return false;
    // All: exclude visually too-similar words (Levenshtein <= 2)
    if(_lev(_ansCleanL,x.word.toLowerCase())<=2)return false;
    return true;
  })).slice(0,3);
  const dWordsW=padArr(dWRecs.map(x=>x.word),3);
  const optMW={};
  optMW[ansWord]=r.meaning||'';
  dWRecs.forEach((x,i)=>{optMW[dWordsW[i]]=x.meaning||'';});



  return {mode:'listeningWord',wordId:r.id,lang:r.lang,
    displayWord:null,
    displayHint:null,
    prompt:'What word do you hear?',
    answer:ansWord,
    options:shuffle([ansWord,...dWordsW]),
    optMeanings:optMW,
    tts:ttsWord,
    meta:{revealWord:ansWord, meaning:r.meaning}};
}

function genListeningSentence(r,pool,lc){
  const isJP=lc.type==='japanese';
  // Pick a random sentence that exists
  const candidates=[
    {sent:r.sentence1, sentReading:r.sentence1_reading||null, sentEn:r.sentence1_en||null},
    {sent:r.sentence2, sentReading:r.sentence2_reading||null, sentEn:r.sentence2_en||null},
    {sent:r.sentence3, sentReading:r.sentence3_reading||null, sentEn:r.sentence3_en||null},
  ].filter(s=>s.sent);
  if(!candidates.length) return genListeningWord(r,pool,lc);
  const chosen=candidates[0|Math.random()*candidates.length];
  const ttsText=isJP?(chosen.sentReading||chosen.sent):chosen.sent;
  const sentWords=isJP?(chosen.sentReading||chosen.sent):chosen.sent;
  // BUG FIX JP_WORDMAP_GAP: Japanese has no spaces — split(' ') produces 1 giant tile.
  // Use splitKana() to break the hiragana reading into individual kana tokens for the tile bank.
  const rawWords=isJP?splitKana(sentWords.replace(/[。、！？。・…〜―「」『』【】〔〕]/g,'')):sentWords.split(' ');
  const answerClean=rawWords.map(w=>w.replace(/[¿¡.,!?;:«»"()]+$/,'')).join(' ');
  // answerTiles: per-token cleaned array — mirrors sentenceTiles so G_stPut works correctly
  const answerTiles=rawWords.map(w=>_stClean(w).toLowerCase());
  const sentLower=sentWords.toLowerCase();
  // BUG-20 FIX: also exclude words whose inflected forms appear in the sentence,
  // not just the base word. Without this, "talo" (house) could be a distractor in a
  // sentence containing "talossa" (in the house) — the base is not literally present
  // but placing it in the tile bank creates a near-correct misleading option.
  // BUG-FIX (contraction check): also check contracted/elided forms so "le" is excluded
  // from distractors when sentence has "l'" (French elision), "du" excludes "de" etc.
  const _contractionOf=w=>{
    const wl=(w||'').toLowerCase();
    const maps={
      french:  {'de':["du","d'","des"],'le':["l'"],'la':["l'"],'je':["j'"],'ne':["n'"],'me':["m'"],'te':["t'"],'se':["s'"],'ce':["c'"],'que':["qu'"]},
      spanish: {'de':['del'],'a':['al']},
      italian: {'di':["dell'","dello","della","dei","degli","delle"],'a':["all'","allo","alla","ai","agli","alle"],'in':["nell'","nello","nella","nei","negli","nelle"]},
      german:  {'zu':['zum','zur'],'in':['ins','im'],'an':['am'],'bei':['beim'],'von':['vom']},
    };
    const langMap=maps[r.lang]||{};
    return langMap[wl]||[];
  };
  const distractors=shuffle(pool.filter(x=>{
    if(x.id===r.id)return false;
    const w=isJP?(x.reading||x.word):x.word;
    if(!w)return false;
    if(sentLower.includes(w.toLowerCase()))return false;
    // Also exclude if any of the word's forms appear in the sentence
    if(!isJP&&(x.forms||[]).some(f=>f&&sentLower.includes(f.toLowerCase())))return false;
    // Also exclude if any contracted form of this word appears in the sentence
    if(!isJP&&_contractionOf(w).some(c=>sentLower.includes(c)))return false;
    return true;
  // BUG-FIX (too few distractors): old code only added 2 distractor words to the
  // tile bank, making listening-sentence questions trivially easy (10-word sentence
  // + 2 extras = very small search space). Raised to 4 to match genListeningWord.
  })).slice(0,4).map(x=>isJP?(x.reading||x.word):x.word);
  // BUG FIX (JP distractor size): answer tiles are single kana characters (from splitKana),
  // so distractors must also be broken into individual kana — otherwise a full-word tile
  // like たべる is physically unplayable against single-char answer slots.
  const distractorTiles=isJP?distractors.flatMap(w=>splitKana(w)):distractors;
  const allTiles=shuffle([...rawWords,...distractorTiles]);
  // Seed tileTrans from pre-built Store cache; overlay this word's own word_map.
  let tileTrans=Object.assign({},Store.tileTransBase);
  const _mapW=(w,m)=>{
    if(!w||!m)return;
    tileTrans[w]=m;tileTrans[w.toLowerCase()]=m;
    const wc=w.replace(/[¿¡.,!?;:«»"()]+$/,'');
    if(wc){tileTrans[wc]=m;tileTrans[wc.toLowerCase()]=m;}
  };
  if(r.word_map) Object.entries(r.word_map).forEach(([w,m])=>_mapW(w,m));
  return {mode:'listeningSentence',wordId:r.id,lang:r.lang,
    displayWord:r.word,
    displayHint:r.meaning,
    sentence1:chosen.sent,
    sentence1_en:chosen.sentEn||null,
    sentence1_reading:chosen.sentReading||null,
    prompt:'Tap the words you hear in order.',
    answer:sentWords,
    answerClean,
    answerTiles,
    tiles:allTiles,
    tileTrans,
    tts:ttsText,
    meta:{meaning:r.meaning}};
}

function genListening(r,pool,lc){
  // IELTS: word listening only — sentence tiles don't make sense for vocab learning
  if(lc.type==='ielts') return genListeningWord(r,pool,lc);
  // BUG-FIX (JP listeningSentence unplayable): Japanese has no word-boundary spaces.
  // splitKana() splits the entire sentence reading into individual kana characters,
  // producing 10-15 tiles for a single sentence — completely unplayable.
  // listeningSentence only works for space-delimited languages (Finnish, French etc.).
  // JP always uses listeningWord instead.
  if(lc.type==='japanese') return genListeningWord(r,pool,lc);
  // BUG-FIX (sentence1 hard-check): old code only tested r.sentence1, so words that have
  // sentence2/sentence3 but no sentence1 were never eligible for listeningSentence mode.
  // Fix: check whether ANY sentence slot exists before deciding to use sentence mode.
  // BUG-FIX (listening 50% waste): only try genListeningSentence if it can actually
  // produce a valid question (canListeningSentence). Without this check, 50% of listening
  // questions fall through to genListeningWord even when listeningSentence would fail anyway,
  // wasting the probability slot and always showing listeningWord for those entries.
  const hasAnySentence = !!(r.sentence1 || r.sentence2 || r.sentence3);
  const canSent = hasAnySentence && typeof canListeningSentence==='function'
    ? canListeningSentence(r,lc)
    : hasAnySentence;
  if(canSent && Math.random()<0.5) return genListeningSentence(r,pool,lc);
  return genListeningWord(r,pool,lc);
}
function canListening(r){return !!(r.word&&r.meaning);}
function canListeningSentence(r,lc){
  // listeningSentence requires at least one sentence AND space-delimited language
  // (Japanese uses splitKana which makes it a separate tile mode; Hebrew excluded)
  if(lc.type==='japanese'||lc.type==='hebrew'||lc.type==='ielts') return false;
  return !!(r.sentence1||r.sentence2||r.sentence3);
}



function genSpelling(r,pool,lc){
  const _fd=r.forbidden_distractors||null;
  // BUG-FIX (German same-root different-article): uses shared _deRoot()
  const ansRoot=_deRoot(r.word);
  const ansClean=r.word.toLowerCase();
  const dRecs=shuffle(pool.filter(x=>{
    if(x.id===r.id)return false;
    if(_fd&&_fd.has(x.word))return false;
    // German: exclude same-root different-article distractors
    if(r.lang==='german'&&ansRoot&&_deRoot(x.word)===ansRoot)return false;
    // All languages: exclude visually too-similar distractors (Levenshtein ≤ 2)
    if(_lev(ansClean,x.word.toLowerCase())<=2)return false;
    return true;
  })).slice(0,3);
  const isJP=lc.type==='japanese';
  const ansWord=isJP&&r.reading?jpRuby(r.word, r.reading):r.word;
  const dWords=padArr(dRecs.map(x=>isJP&&x.reading?jpRuby(x.word, x.reading):x.word),3);
  const optMeanings={};
  optMeanings[ansWord]=r.meaning||'';
  dRecs.forEach((x,i)=>{optMeanings[dWords[i]]=x.meaning||'';});
  const sentSlots=[
    {s:r.sentence1, sr:r.sentence1_reading||null, se:r.sentence1_en||null, hl:r.sentence1_hl||null},
    {s:r.sentence2, sr:r.sentence2_reading||null, se:r.sentence2_en||null, hl:null},
    {s:r.sentence3, sr:r.sentence3_reading||null, se:r.sentence3_en||null, hl:null},
  ].filter(x=>x.s);
  const sent=sentSlots.length?sentSlots[0|Math.random()*sentSlots.length]:{s:null,sr:null,se:null,hl:null};
  return {mode:'spelling',wordId:r.id,lang:r.lang,
    displayWord:r.word,
    displayReading:isJP&&r.reading&&r.word!==r.reading?r.reading:null,
    displayKanji:null,
    displayHint:r.meaning,
    displayIpa:r.ipa||null,
    prompt:'Choose the correct word.',
    answer:ansWord,
    options:shuffle([ansWord,...dWords]),
    optMeanings,
    tts:isJP?(r.reading||r.word):(r.tts_override||r.word),
    sentence1:sent.s, sentence1_en:sent.se,
    sentence1_hl:sent.hl,
    sentence1_reading:sent.sr,
    pos:r.pos||null, definition:r.definition||null,
    zh:r.zh||null, zh_def:r.zh_def||null,
    meta:{romaji:r.romaji}};
}
// BUG-3 NOTE: canSpelling checks `pool` (full category-filtered set) for the >=3 guard,
// while genSpelling draws distractors from `bank` (a capped random subset of that same pool).
// This is intentional — canSpelling validates there ARE enough words in the session,
// while bank provides a shuffled distractor source. Both come from the same filtered pool
// passed into buildQueue, so there is no cross-category contamination. Documented here
// to prevent future confusion when reading the two call sites side-by-side.
function canSpelling(r,pool){return !!(r.word&&r.meaning)&&pool.length>=3;}

// BUG FIX HE_NIQQUD: Use Intl.Segmenter (grapheme granularity) to split Hebrew words.
// [...word] splits niqqud vowel marks (U+05B0–U+05C7) as separate code points,
// creating invisible floating-dot tiles. Segmenter keeps consonant+niqqud as one unit.
function _heGraphemes(word){
  if(typeof Intl!=='undefined'&&Intl.Segmenter){
    try{
      const seg=new Intl.Segmenter('he',{granularity:'grapheme'});
      return Array.from(seg.segment(word),s=>s.segment).filter(c=>c.trim()!=='');
    }catch(e){}
  }
  // Fallback: manual grapheme cluster — attach any combining marks (U+0591–U+05C7) to preceding char
  const arr=[...word];
  const out=[];
  for(let i=0;i<arr.length;i++){
    const cp=arr[i].codePointAt(0);
    const isCombining=cp>=0x0591&&cp<=0x05C7;
    if(isCombining&&out.length>0){out[out.length-1]+=arr[i];}
    else if(arr[i].trim()!==''){out.push(arr[i]);}
  }
  return out;
}

function genCharacterTiles(r,pool,lc){
  const chars=_heGraphemes(r.word);
  // BUG-21 FIX: include sofit (final) letter forms in distractor pool.
  // Old pool had only non-final forms, making words ending in ך/ם/ן/ף/ץ trivially
  // identifiable — the final-form tile was the only one of its kind in the bank.
  const alpha=['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ך','ל','מ','ם','נ','ן','ס','ע','פ','ף','צ','ץ','ק','ר','ש','ת'];
  // Bug 238: use base-consonant counts (not a Set) so a word with two ך tiles
  // correctly excludes כ from distractors but still puts BOTH ך tiles in the bank.
  const usedCounts={};
  chars.forEach(c=>{const b=c[0];usedCounts[b]=(usedCounts[b]||0)+1;});
  const extras=shuffle(alpha.filter(c=>!usedCounts[c])).slice(0,3);
  const bank=shuffle([
    ...chars.map((c,i)=>({char:c,srcIdx:i})),
    ...extras.map((c,i)=>({char:c,srcIdx:-1-i}))
  ]);
  return {mode:'characterTiles',wordId:r.id,lang:r.lang,
    displayWord:r.word, displayMeaning:r.meaning, displayHint:null,
    displayRomaji:r.romaji||null,
    prompt:'Tap the letters in the correct order',
    answer:r.word, chars, bank, tts:r.word, meta:{}};
}
function canCharacterTiles(r,lc){return lc.type==='hebrew'&&!!(r.word)&&_heGraphemes(r.word).length>=2;}

/* ─── KANA SPELLING (Japanese character tiles) ───────────── */
// Distractor kana pool — common hiragana chars
const KANA_DISTRACTORS = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ',
  'た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ',
  'ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん',
  'が','ぎ','ぐ','げ','ご','ざ','じ','ず','ぜ','ぞ','だ','で','ど','ば','び','ぶ','べ','ぼ',
  'ぱ','ぴ','ぷ','ぺ','ぽ','きゃ','きゅ','きょ','しゃ','しゅ','しょ','ちゃ','ちゅ','ちょ'];
// Katakana distractor pool
const KATA_DISTRACTORS = ['ア','イ','ウ','エ','オ','カ','キ','ク','ケ','コ','サ','シ','ス','セ','ソ',
  'タ','チ','ツ','テ','ト','ナ','ニ','ヌ','ネ','ノ','ハ','ヒ','フ','ヘ','ホ',
  'マ','ミ','ム','メ','モ','ヤ','ユ','ヨ','ラ','リ','ル','レ','ロ','ワ','ヲ','ン'];

function _isKatakana(ch){ return ch >= '\u30A0' && ch <= '\u30FF'; }
function _isHiragana(ch){ return ch >= '\u3040' && ch <= '\u309F'; }
function _isKanaChar(ch){ return _isHiragana(ch) || _isKatakana(ch); }

// ── Kana → Romaji conversion map ──────────────────────────
// Covers hiragana, katakana, digraphs, and all exception characters.
// Exception cases handled at runtime in kanaToRomaji():
//   っ/ッ  → doubles the consonant of the NEXT token  (e.g. っか → kka)
//   ー     → long vowel mark, shown as "ー" or appended as macron
//   ん/ン  → "n" (becomes "m" before b/p/m — handled in sentence context only; tile shows "n")
const KANA_ROM = {
  // ── Hiragana basic ──
  'あ':'a','い':'i','う':'u','え':'e','お':'o',
  'か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
  'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so',
  'た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
  'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no',
  'は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
  'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo',
  'や':'ya',        'ゆ':'yu',        'よ':'yo',
  'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro',
  'わ':'wa',                          'を':'wo',
  'ん':'n',
  // ── Hiragana voiced (dakuten) ──
  'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go',
  'ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
  'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do',
  'ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo',
  // ── Hiragana semi-voiced (handakuten) ──
  'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
  // ── Hiragana digraphs ──
  'きゃ':'kya','きゅ':'kyu','きょ':'kyo',
  'しゃ':'sha','しゅ':'shu','しょ':'sho',
  'ちゃ':'cha','ちゅ':'chu','ちょ':'cho',
  'にゃ':'nya','にゅ':'nyu','にょ':'nyo',
  'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo',
  'みゃ':'mya','みゅ':'myu','みょ':'myo',
  'りゃ':'rya','りゅ':'ryu','りょ':'ryo',
  'ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
  'じゃ':'ja', 'じゅ':'ju', 'じょ':'jo',
  'びゃ':'bya','びゅ':'byu','びょ':'byo',
  'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
  // ── Hiragana small vowels (standalone edge cases) ──
  'ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o',
  'っ':'(x)', // handled specially — doubles next consonant
  'ゃ':'ya','ゅ':'yu','ょ':'yo',
  // ── Katakana basic ──
  'ア':'a','イ':'i','ウ':'u','エ':'e','オ':'o',
  'カ':'ka','キ':'ki','ク':'ku','ケ':'ke','コ':'ko',
  'サ':'sa','シ':'shi','ス':'su','セ':'se','ソ':'so',
  'タ':'ta','チ':'chi','ツ':'tsu','テ':'te','ト':'to',
  'ナ':'na','ニ':'ni','ヌ':'nu','ネ':'ne','ノ':'no',
  'ハ':'ha','ヒ':'hi','フ':'fu','ヘ':'he','ホ':'ho',
  'マ':'ma','ミ':'mi','ム':'mu','メ':'me','モ':'mo',
  'ヤ':'ya',          'ユ':'yu',          'ヨ':'yo',
  'ラ':'ra','リ':'ri','ル':'ru','レ':'re','ロ':'ro',
  'ワ':'wa',                              'ヲ':'wo',
  'ン':'n',
  'ー':'—', // long vowel mark
  // ── Katakana voiced ──
  'ガ':'ga','ギ':'gi','グ':'gu','ゲ':'ge','ゴ':'go',
  'ザ':'za','ジ':'ji','ズ':'zu','ゼ':'ze','ゾ':'zo',
  'ダ':'da','ヂ':'ji','ヅ':'zu','デ':'de','ド':'do',
  'バ':'ba','ビ':'bi','ブ':'bu','ベ':'be','ボ':'bo',
  // ── Katakana semi-voiced ──
  'パ':'pa','ピ':'pi','プ':'pu','ペ':'pe','ポ':'po',
  // ── Katakana digraphs ──
  'キャ':'kya','キュ':'kyu','キョ':'kyo',
  'シャ':'sha','シュ':'shu','ショ':'sho',
  'チャ':'cha','チュ':'chu','チョ':'cho',
  'ニャ':'nya','ニュ':'nyu','ニョ':'nyo',
  'ヒャ':'hya','ヒュ':'hyu','ヒョ':'hyo',
  'ミャ':'mya','ミュ':'myu','ミョ':'myo',
  'リャ':'rya','リュ':'ryu','リョ':'ryo',
  'ギャ':'gya','ギュ':'gyu','ギョ':'gyo',
  'ジャ':'ja', 'ジュ':'ju', 'ジョ':'jo',
  'ビャ':'bya','ビュ':'byu','ビョ':'byo',
  'ピャ':'pya','ピュ':'pyu','ピョ':'pyo',
  // ── Katakana foreign-sound extensions ──
  'ファ':'fa','フィ':'fi','フェ':'fe','フォ':'fo',
  'ウィ':'wi','ウェ':'we','ウォ':'wo',
  'ティ':'ti','ディ':'di','トゥ':'tu','ドゥ':'du',
  'ヴァ':'va','ヴィ':'vi','ヴ':'vu','ヴェ':'ve','ヴォ':'vo',
  'ツァ':'tsa','ツィ':'tsi','ツェ':'tse','ツォ':'tso',
  'チェ':'che','シェ':'she','ジェ':'je',
  'イェ':'ye',
  // ── Katakana small ──
  'ッ':'(x)', // doubles next consonant
  'ャ':'ya','ュ':'yu','ョ':'yo',
  'ァ':'a','ィ':'i','ゥ':'u','ェ':'e','ォ':'o',
};

/**
 * Convert a single kana token (possibly a digraph) to romaji.
 * Handles special cases:
 *   っ/ッ  → returns the first consonant of the NEXT token doubled.
 *             Since we don't know the next token here, we return the
 *             special marker "(x)" and let the caller handle it.
 *   ー     → long vowel mark; shown as "—" on the tile.
 *   ん/ン  → "n"
 */
function kanaToRomaji(token){
  if(!token)return '';
  // Direct lookup first (covers digraphs like しゃ, フェ stored as 2-char keys)
  if(KANA_ROM[token]!==undefined) return KANA_ROM[token];
  // Fallback: character-by-character (handles C+ー combos like コー → "ko—", ヒー → "hi—")
  // Also handles any unknown combination gracefully.
  return [...token].map(c=>KANA_ROM[c]??c).join('');
}

/**
 * Convert a full splitKana() token array to a romaji string,
 * correctly handling っ/ッ (consonant doubling) context.
 */
function kanaArrayToRomaji(tokens){
  const out=[];
  for(let i=0;i<tokens.length;i++){
    const t=tokens[i];
    if(t==='っ'||t==='ッ'){
      // Double the first consonant of the next token
      const next=tokens[i+1]?kanaToRomaji(tokens[i+1]):'';
      if(next&&next!=='(x)'&&next!=='—'&&/[a-z]/.test(next[0])){
        out.push(next[0]); // the doubled consonant prefix
      } else {
        out.push('(x)');
      }
    } else {
      const rom=kanaToRomaji(t);
      out.push(rom==='(x)'?t:rom); // fallback to original char if unknown
    }
  }
  return out.join('');
}

/**
 * Get the romaji label for a single tile token.
 * For っ/ッ we show a special "×" hint since we can't double without context.
 */
function tileRomaji(token){
  if(token==='っ'||token==='ッ') return '×';  // "doubles next"
  if(token==='ん'||token==='ン') return 'n';
  if(token==='ー') return '—';
  const r=kanaToRomaji(token);
  return (r==='(x)'||!r)?token:r;
}

// Split a kana string into a token array, treating digraphs (e.g. しゃ, きゅ) as one unit
function splitKana(str){
  const small=new Set(['ぁ','ぃ','ぅ','ぇ','ぉ','っ','ゃ','ゅ','ょ','ゎ',
    'ァ','ィ','ゥ','ェ','ォ','ッ','ャ','ュ','ョ','ヮ','ー']);
  const arr=[...str];
  const out=[];
  for(let i=0;i<arr.length;i++){
    if(i+1<arr.length && small.has(arr[i+1])){
      out.push(arr[i]+arr[i+1]); i++;
    } else {
      out.push(arr[i]);
    }
  }
  return out;
}

function genKanaSpelling(r,pool,lc){
  // Use reading (hiragana/katakana) for spelling; fall back to word if no reading
  const target=r.reading||r.word;
  const chars=splitKana(target);
  const used=new Set(chars);
  // Pick distractor pool matching the script of the first char
  const isKata=_isKatakana(chars[0]);
  let distPool=isKata?KATA_DISTRACTORS:KANA_DISTRACTORS;
  // BUG-FIX (Yotsugana ambiguity): ず and づ both romanise to "zu"; じ and ぢ both to "ji".
  // If the target contains ず, remove づ from the pool (and vice versa) so the romaji
  // toggle never shows two tiles with identical labels, creating an unfair 50/50 guess.
  const YOTSUGANA_PAIRS=[['ず','づ'],['じ','ぢ']];
  for(const [a,b] of YOTSUGANA_PAIRS){
    if(used.has(a))      distPool=distPool.filter(c=>c!==b);
    else if(used.has(b)) distPool=distPool.filter(c=>c!==a);
  }
  const extras=shuffle(distPool.filter(c=>!used.has(c))).slice(0,Math.min(4,chars.length+1));
  const bank=shuffle([
    ...chars.map((c,i)=>({char:c,srcIdx:i})),
    ...extras.map((c,i)=>({char:c,srcIdx:-1-i}))
  ]);
  return {mode:'kanaSpelling',wordId:r.id,lang:r.lang,
    displayWord:r.word,       // kanji / kana word (shown on card top)
    displayReading:target,    // hiragana reading (the answer)
    displayMeaning:r.meaning,
    displayRomaji:r.romaji||null,
    prompt:'Tap the kana in the correct order',
    answer:target, chars, bank, tts:target, meta:{}};
}
function canKanaSpelling(r,lc){
  if(lc.type!=='japanese')return false;
  const target=r.reading||r.word;
  if(!target)return false;
  const chars=splitKana(target);
  return chars.length>=2 && chars.every(c=>_isKanaChar(c[0]));
}

function genReading(r,pool,lc){
  const _ansReading=(r.reading||'').toLowerCase();
  const otherRecs=shuffle(pool.filter(x=>{
    if(x.id===r.id)return false;
    if(!x.reading||x.reading===r.reading)return false;
    // Filter readings too visually/phonetically similar (Levenshtein <= 2)
    if(_lev(_ansReading,x.reading.toLowerCase())<=2)return false;
    return true;
  })).slice(0,3);
  const others=otherRecs.map(x=>x.reading);
  const optMeanings={};
  optMeanings[r.reading]=r.meaning||'';
  otherRecs.forEach(x=>{if(x.reading)optMeanings[x.reading]=x.meaning||'';});
  const sentSlots=[
    {s:r.sentence1, sr:r.sentence1_reading||null, se:r.sentence1_en||null},
    {s:r.sentence2, sr:r.sentence2_reading||null, se:r.sentence2_en||null},
    {s:r.sentence3, sr:r.sentence3_reading||null, se:r.sentence3_en||null},
  ].filter(x=>x.s);
  const sent=sentSlots.length?sentSlots[0|Math.random()*sentSlots.length]:{s:null,sr:null,se:null};
  return {mode:'reading',wordId:r.id,lang:r.lang,
    displayWord:r.word,
    displayKanji:null,
    displayHint:r.romaji||null,
    prompt:'Choose the correct reading.',
    answer:r.reading, options:shuffle(padArr([r.reading,...others],4)),
    optMeanings,
    tts:r.reading,
    sentence1:sent.s, sentence1_reading:sent.sr, sentence1_en:sent.se,
    meta:{romaji:r.romaji}};
}
function canReading(r,lc){
  if(lc.type!=='japanese')return false;
  if(!(r.word&&r.reading))return false;
  // Single bare kanji with no okurigana and no compound context are ambiguous
  // (日 = nichi/jitsu/hi/ka depending on compound). Only generate reading questions
  // when the word has okurigana (mixed kanji+kana), is a multi-kanji compound,
  // or is pure kana — all cases where the reading is unambiguous in context.
  const kanjiOnly=/^[一-龯々]+$/.test(r.word);
  const singleKanji=kanjiOnly&&[...r.word].length===1;
  if(singleKanji)return false; // single bare kanji → too ambiguous
  return true;
}



/* ─── SESSION BUILDER ─────────────────────────────────────── */
function buildQueue(recs, modeIds, pool, lc) {
  const q = [];
  const SESSION_LIMIT = 30; 
  
  // A. Smart SRS Allocation — split words into three pools by current status
  const categorized = { new: [], unfamiliar: [], mastered: [] };
  
  recs.forEach(r => {
    const status = Prog.status(lc.id, r.id);
    categorized[status].push(r);
  });

  // BUG-17 FIX: shuffle each group first (true random), then stable-partition by recency.
  // Old code used Math.random()-0.5 as a sort comparator which violates transitivity and
  // produces biased orderings in V8/JSCore. Correct approach: randomise first, then partition.
  function _shuffleThenRecent(arr){
    const s=shuffle([...arr]);
    const notRecent=s.filter(r=>!S.lastSessionWords.has(r.id));
    const recent=s.filter(r=>S.lastSessionWords.has(r.id));
    return [...notRecent,...recent];
  }
  categorized.new       =_shuffleThenRecent(categorized.new);
  categorized.unfamiliar=_shuffleThenRecent(categorized.unfamiliar);
  categorized.mastered  =_shuffleThenRecent(categorized.mastered);

  // C. Quota: 20 unfamiliar → 5 new → 5 mastered, gaps filled by remaining new
  let selected = [];
  let needed = SESSION_LIMIT;

  // 1. unfamiliar first (up to 20)
  const unfamQuota = Math.min(20, categorized.unfamiliar.length);
  selected.push(...categorized.unfamiliar.splice(0, unfamQuota));
  needed -= unfamQuota;

  // 2. new words (up to 5, or more if unfamiliar was short)
  const newQuota = Math.min(5 + (20 - unfamQuota), categorized.new.length);
  selected.push(...categorized.new.splice(0, newQuota));
  needed -= newQuota;

  // 3. mastered words for review (remaining ~5 slots)
  const mastQuota = Math.min(needed, categorized.mastered.length);
  selected.push(...categorized.mastered.splice(0, mastQuota));
  needed -= mastQuota;

  // 4. fill any remaining slots with more new words (e.g. fresh start, no mastered yet)
  if (needed > 0 && categorized.new.length > 0) {
    selected.push(...categorized.new.splice(0, needed));
  }

  // D. Shuffle selected words, update lastSessionWords and persist (BUG-6 FIX)
  const prevSession = new Set(S.lastSessionWords); // snapshot BEFORE overwriting
  const sh = shuffle(selected);
  S.lastSessionWords = new Set(sh.map(r => r.id));
  Prog.saveLastSession(S.lastSessionWords); // BUG-6 FIX: survive page reload
  // How many of this round's words are fresh (weren't in the previous round)
  S.freshCount = sh.filter(r => !prevSession.has(r.id)).length;
  
  const useM = modeIds.includes('matching') && sh.length >= 2;
  let since = 0;
  
  // BUG-7 FIX: scale bank size with pool so distractors don't repeat at large vocab sizes.
  // Minimum 60, maximum 200, proportional at 15% of pool for mid-sizes.
  const BANK_SIZE = Math.min(200, Math.max(60, Math.ceil(pool.length * 0.15)));
  const bank = pool.length <= BANK_SIZE ? shuffle([...pool]) : shuffle([...pool]).slice(0, BANK_SIZE);

  const GEN = {
    definition:    r => canDefinition(r)         ? genDefinition(r, bank, lc) : null,
    spelling:      r => canSpelling(r, pool)     ? genSpelling(r, bank, lc) : null,
    blank:         r => canBlank(r, lc)          ? genBlank(r, bank, lc) : null,
    sentenceTiles: r => canSentenceTiles(r, lc)  ? genSentenceTiles(r, bank, lc) : null,
    listening:     r => canListening(r)          ? genListening(r, bank, lc) : null,
    characterTiles:r => canCharacterTiles(r, lc) ? genCharacterTiles(r, bank, lc) : null,
    reading:       r => canReading(r, lc)        ? genReading(r, bank, lc) : null,
    kanaSpelling:  r => canKanaSpelling(r, lc)   ? genKanaSpelling(r, bank, lc) : null
  };
  
  // BUG-FIX (IELTS mode exclusion): previously hardcoded 'sentenceTiles' and 'matching'
  // as excluded for IELTS. Now uses canSentenceTiles() / canMatching() at the GEN level
  // so the exclusion is data-driven — if IELTS words gain sentence2/3 in the future,
  // sentenceTiles will automatically become available without touching this line.
  // 'matching' is still excluded here because IELTS only has 3 modes by design (blank/listening/matching)
  // and matching is handled via the useM flag above.
  const singles = modeIds.filter(m => m !== 'matching');
  
  const soloShown = new Set();
  const matchPending = [];
  const MATCH_MIN = 5;
  // FIX (IELTS matching imbalance): IELTS `meaning` is a full definition clause,
  // not a short gloss like the other languages, so 5 pairs makes each matching
  // column very tall/cluttered. Smaller set for IELTS only; unaffected elsewhere.
  const matchSize = lc.type === 'ielts' ? 3 : 5;

  for (let _i = 0; _i < sh.length; _i++) {
    const r = sh[_i];
    const isNewWord = Prog.status(lc.id, r.id) === 'new';
    let eligible = singles.map(m => GEN[m] ? GEN[m](r) : null).filter(Boolean);
    // BUG FIX (cross-mode pedagogy): a brand-new word should never be first introduced
    // via listening mode — hearing unknown audio with no visual context is not a valid
    // learning event. Filter out listening questions for truly new words; prefer definition.
    if(isNewWord && eligible.length > 1){
      const nonListen = eligible.filter(q => !['listeningWord','listeningSentence'].includes(q.mode));
      if(nonListen.length > 0) eligible = nonListen;
    }
    if (eligible.length > 0) {
      q.push(eligible[0 | Math.random() * eligible.length]);
      soloShown.add(r.id);
      since++;
    }
    
    if (useM && since >= 6) {
      const fresh = sh.slice(0, _i + 1).filter(x => !soloShown.has(x.id) || matchPending.includes(x));
      const mq = genMatchingSet(fresh.length >= 2 ? fresh : sh.slice(Math.max(0, _i - 9), _i + 1), lc, matchSize);
      if (mq) { q.push(mq); since = 0; }
    }
  }
  
  if (useM && since > 0 && sh.length >= MATCH_MIN) {
    const unseen = sh.filter(x => !soloShown.has(x.id));
    const matchPool = unseen.length >= 2 ? unseen : sh;
    const mq = genMatchingSet(matchPool, lc, Math.min(matchSize, matchPool.length));
    if (mq) q.push(mq);
  }
  
  return q;
}


