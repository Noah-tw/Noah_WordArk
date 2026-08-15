'use strict';
// VocabGame Engine v5 - intro+hint
// vocab_data.js must be loaded first

/* ─── LANGUAGE CONFIG ─────────────────────────────────────── */
const LC = {
  finnish:      { id:'finnish',       name:'Finnish',       flag:'🦌', type:'standard', rtl:false, ttsLang:'fi',
    defaultModes:['definition','spelling','matching','blank','sentenceTiles','listening'] },
  french:       { id:'french',        name:'French',        flag:'🥐', type:'standard', rtl:false, ttsLang:'fr',
    defaultModes:['definition','spelling','matching','blank','sentenceTiles','listening'] },
  spanish:      { id:'spanish',       name:'Spanish',       flag:'💃', type:'standard', rtl:false, ttsLang:'es',
    defaultModes:['definition','spelling','matching','blank','sentenceTiles','listening'] },
  italian:      { id:'italian',       name:'Italian',       flag:'🍕', type:'standard', rtl:false, ttsLang:'it',
    defaultModes:['definition','spelling','matching','blank','sentenceTiles','listening'] },
  hebrew:       { id:'hebrew',        name:'Hebrew',        flag:'🕊️', type:'hebrew',   rtl:true,  ttsLang:'he',
    defaultModes:['definition','spelling','matching','blank','listening','characterTiles'] },
  japanese:     { id:'japanese',      name:'Japanese',      flag:'🌸', type:'japanese', rtl:false, ttsLang:'ja',
    defaultModes:['definition','spelling','matching','blank','listening','reading','kanaSpelling'], romajiToggle:true },

  english_ielts:{ id:'english_ielts', name:'English IELTS', flag:'🗽', type:'ielts',    rtl:false, ttsLang:'en',
    defaultModes:['blank','listening','matching'] },

  german:       { id:'german',        name:'German',        flag:'🍺', type:'standard', rtl:false, ttsLang:'de',
    defaultModes:['definition','spelling','matching','blank','sentenceTiles','listening'] }
};


const MODE_LABELS = {
  definition:'Definition', matching:'Translation Match', blank:'Fill the Blank',
  sentenceTiles:'Sentence Tiles', listening:'Listening',
  characterTiles:'Character Tiles', reading:'Reading (JP)',
  spelling:'Spelling', kanaSpelling:'Kana Spelling'
};

/* ─── STORE ───────────────────────────────────────────────── */
const Store = (() => {
  let recs = [], idx = {};
  // BUG FIX (CPU freeze): phraseSet was rebuilt inside genSentenceTiles on every question,
  // scanning the entire pool each time (3000 words × 30 questions = 90,000 iterations/round).
  // Built once here at load time and exposed via Store.phraseSet instead.
  let phraseSet = new Set();
  // BUG FIX (CPU - tileTrans): pre-build word→meaning lookup once at load time.
  // genSentenceTiles and genListeningSentence both scanned the full pool every question
  // to build tileTrans translation labels (3000 words × 30 questions = 90k iters each).
  // Built once here; per-question code does a shallow copy + small word_map overlay.
  let tileTransBase = {};
  // ── 多檔案詞庫載入系統 ──────────────────────────────────────────
  // 每個單字一個獨立檔案：fi_0001.js, fi_0002.js, ... fi_2175.js
  // 止血機制：某個檔案有語法錯誤 → 只有那個字消失，其他檔案不受影響。
  //
  // ── Index 檔案系統 ─────────────────────────────────────────────
  // 每個語言有一個 [prefix]_index.js，例如 fi_index.js。
  // 舊格式（每檔 1 字）仍然支援：
  //   window.VOCAB_INDEX = window.VOCAB_INDEX || {};
  //   window.VOCAB_INDEX['finnish'] = 2175;
  // 新格式（建議每檔 100 字）：
  //   window.VOCAB_INDEX['finnish'] = { totalWords:2175, batchSize:100, fileCount:22 };
  //
  // 引擎先載 fi_index.js，讀出數字，再精確載入 fi_0001.js ~ fi_2175.js。
  // 新增詞條時只需更新 fi_index.js 的數字，引擎本身完全不用動。
  // 7 個語言各自維護自己的 index 檔，互不影響。

  const LANG_PREFIX = {
    finnish:'fi', french:'fr', spanish:'es', italian:'it',
    hebrew:'he', japanese:'ja', english_ielts:'en',
    german:'de'
  };

  // 載入單一小檔案，回傳 Promise
  // ⚠️ SERIAL ONLY: _loadOneBatch() patches window.onerror to catch SyntaxErrors.
  // This is safe ONLY when called with await in sequence (one at a time).
  // If you ever switch to Promise.all() parallelism, each call overwrites _prev
  // from the previous call, breaking the restore chain and leaking onerror handlers.
  // Keep the await loop in loadScript() — do not parallelize.
  function _loadOneBatch(src) {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src + '?v=' + (window.APP_VERSION || Date.now());

      // 語法錯誤攔截：SyntaxError 不觸發 onerror，只觸發 window.onerror
      const _prev = window.onerror;
      let settled = false;
      let timeoutId = null;
      function _settle() {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        window.onerror = _prev;
        resolve();
      }

      window.onerror = function(msg, srcUrl, line, col, err) {
        if (srcUrl && srcUrl.includes(script.src.split('?')[0])) {
          console.error('[WordArk] 語法錯誤：' + src + ' 第' + line + '行 — ' + msg);
          if (typeof toast === 'function')
            toast('🚨 ' + src + ' 第' + line + '行語法錯誤（少了逗號或括號？）已略過，其他字正常。', 8000);
          _settle();
          return true;
        }
        return _prev ? _prev.apply(this, arguments) : false;
      };

      script.onload  = () => _settle();          // 正常載入
      script.onerror = () => _settle();          // 404 找不到 → 靜默跳過

      // 保險：3秒超時強制繼續
      timeoutId=setTimeout(_settle, 3000);
      document.head.appendChild(script);
    });
  }

  // 載入 [prefix]_index.js。舊數字格式視為「檔案數」；新物件格式可讓
  // 一個檔案容納 100 筆，並分開記錄實際單字數與批次檔案數。
  function _loadIndex(langId, prefix) {
    return new Promise((resolve) => {
      const src = prefix + '_index.js';
      const script = document.createElement('script');
      let settled=false;
      let timeoutId=null;
      const finish=(value)=>{
        if(settled)return;
        settled=true;
        clearTimeout(timeoutId);
        resolve(value);
      };
      script.src = src + '?v=' + (window.APP_VERSION || Date.now());
      script.onload = () => {
        const raw = (window.VOCAB_INDEX && window.VOCAB_INDEX[langId]) || 0;
        const meta = typeof raw === 'number'
          ? { fileCount:raw, totalWords:raw, batchSize:1, fileStem:'' }
          : {
              fileCount:Number(raw.fileCount || raw.files || 0),
              totalWords:Number(raw.totalWords || raw.total || 0),
              batchSize:Number(raw.batchSize || 100),
              fileStem:(typeof raw.fileStem === 'string' && /^[A-Za-z0-9_-]+$/.test(raw.fileStem))
                ? raw.fileStem
                : ''
            };
        if (!meta.fileCount && meta.totalWords > 0)
          meta.fileCount = Math.ceil(meta.totalWords / Math.max(1, meta.batchSize));
        if (!meta.fileCount) {
          console.error('[WordArk] ' + src + ' 載入成功但 VOCAB_INDEX["' + langId + '"] 為空或未定義。');
          if (typeof toast === 'function')
            toast('⚠️ ' + src + ' 找不到詞條數量，請確認 index 檔格式正確。', 6000);
        }
        finish(meta);
      };
      script.onerror = () => {
        console.error('[WordArk] 找不到 index 檔：' + src + '。請確認每個語言都有對應的 [prefix]_index.js。');
        if (typeof toast === 'function')
          toast('⚠️ 找不到 ' + src + '，請建立此 index 檔。', 6000);
        finish({fileCount:0,totalWords:0,batchSize:1,fileStem:''});
      };
      // 保險：5秒超時（index 檔應該很快，給多一點餘裕）
      timeoutId=setTimeout(() => finish({fileCount:0,totalWords:0,batchSize:1,fileStem:''}), 5000);
      document.head.appendChild(script);
    });
  }

  // 載入某語言的所有詞條檔案（fi_0001.js ~ fi_[count].js）
  // 已載入過則直接跳過（語言切換快取）
  const _loaded = new Set();
  // BUG-FIX (double word count): _loaded only got marked AFTER a full load finished, so
  // if loadScript() was called a second time for the same language while the first call
  // was still mid-flight (slow network + a second trigger before it settled), both calls
  // would independently loop through and inject every fi_0001.js...fi_000N.js script tag,
  // each push()-ing its word into VOCAB_DATA a second time — exactly doubling the count
  // (3 real words → 6). Track in-flight loads so a concurrent call attaches to the same
  // promise instead of starting a second full injection cycle.
  const _loadingPromises = {};
  // Keep the current and immediately previous catalogue in memory. This makes the
  // common EN -> another language -> EN path instant without allowing every language
  // visited during a long session to remain in RAM forever on mobile devices.
  const MAX_CACHED_LANGUAGES = 2;
  let _recentLanguages = [];

  function _trimLanguageCache() {
    const keep = new Set(_recentLanguages.slice(-MAX_CACHED_LANGUAGES));
    [..._loaded].forEach(loadedId => {
      if (!keep.has(loadedId) && !_loadingPromises[loadedId]) unload(loadedId);
    });
  }

  function _rememberLanguage(langId) {
    _recentLanguages = _recentLanguages.filter(id => id !== langId);
    _recentLanguages.push(langId);
    if (_recentLanguages.length > MAX_CACHED_LANGUAGES)
      _recentLanguages = _recentLanguages.slice(-MAX_CACHED_LANGUAGES);
    _trimLanguageCache();
  }

  function loadScript(langId, callback) {
    if (_loaded.has(langId)) { callback(); return; }
    if (_loadingPromises[langId]) { _loadingPromises[langId].then(callback); return; }

    window.VOCAB_DATA = window.VOCAB_DATA || {};
    window.VOCAB_DATA[langId] = window.VOCAB_DATA[langId] || [];

    const prefix = LANG_PREFIX[langId] || langId.slice(0, 2);
    // FOLDER REORG v2: organized by FILE TYPE across all languages, not by language.
    // index/ — all *_index.js together, so bumping word counts as batches are added is
    //          one glance across every language instead of hunting through 8 folders.
    // lang_rules/ — all lang_rules_*.js together (core + all languages).
    // word_forms/ — all word_forms_*.js together.
    // words/ — every <prefix>_0001.js...NNNN.js entry, all languages, flat — filenames
    //          are already self-labeled by prefix, so sorting naturally clusters by
    //          language while keeping every actual word entry visible in one place.
    const idxFolder = 'index/';
    const rulesFolder = 'lang_rules/';
    const formsFolder = 'word_forms/';
    // words/ still needs a per-language subfolder — 2,800+ files per language, up to 8
    // languages, would be ~19,600 files flattened into one folder otherwise. Every other
    // type (index/lang_rules/word_forms/tips) stays flat since those are just 1 file per
    // language (8 total), a completely different scale.
    const wordsFolder = 'words/' + prefix + '/';

    _loadingPromises[langId] = (async () => {
      // lang_rules_<prefix>.js and word_forms_<prefix>.js load alongside this language's
      // vocab data — not on every page load. 404 (a language with no rules/words yet) is
      // silently skipped by _loadOneBatch, same as any other optional file.
      // KanjiReadings (used by jpRuby() furigana, Japanese-only) lives inside
      // lang_rules_ja.js itself rather than a separate file — one less file to load,
      // one less place to look. This line loads it.
      await _loadOneBatch(rulesFolder + 'lang_rules_' + prefix + '.js');
      await _loadOneBatch(formsFolder + 'word_forms_' + prefix + '.js');
      // Tips used to all load upfront in index.html (8 files, every visit, regardless of
      // which language you're practicing — ~1.2MB total). Now only the language you're
      // actually loading fetches its tips, same lazy pattern as the two lines above.
      // If this is still in flight when an interstitial card wants to show, _pickInterstitial()
      // already falls back to a cheer card — same safety net as before, nothing new to break.
      await _loadOneBatch('tips/tips_' + langId + '.js');
      const indexMeta = await _loadIndex(langId, idxFolder + prefix);
      if (indexMeta.fileCount > 0) {
        // Batch files use a distinct stem (for example en_batch_0001.js), so an
        // installed PWA can never mistake an old one-word en_0001.js for a new batch.
        const fileStem = indexMeta.fileStem || prefix;
        for (let i = 1; i <= indexMeta.fileCount; i++) {
          const num = String(i).padStart(4, '0');
          const src = wordsFolder + fileStem + '_' + num + '.js';
          await _loadOneBatch(src);
        }
      }
      _loaded.add(langId);
      delete _loadingPromises[langId];
    })();
    _loadingPromises[langId].then(callback);
  }

  function load(langId, onReady) {
    // Wait for the COMPLETE indexed load. VOCAB_DATA[langId] is created before the first
    // file arrives, so checking only for array existence could process a partial list and
    // make totals jump while the remaining scripts were still pushing records.
    // BUG-FIX (race condition): load() is async — pass onReady so callers (G_switchLang,
    // DOMContentLoaded) can defer startSession() until the vocab file is actually loaded.
    if (!_loaded.has(langId) || !window.VOCAB_DATA || !window.VOCAB_DATA[langId]) {
      loadScript(langId, () => load(langId, onReady));
      return [];
    }

    // A slower, older request may finish after the player has already selected a new
    // language. Never let that stale request replace the one active Store catalogue.
    // The raw data remains cached, so selecting this language again is still immediate.
    if (typeof S !== 'undefined' && S.lang !== langId) {
      _trimLanguageCache();
      if (typeof onReady === 'function') onReady(false);
      return [];
    }

    recs = (VOCAB_DATA[langId] || []).map(r => {
      // BUG-FIX #111 (Hebrew Cantillation Marks): database entries sourced from biblical/
      // dictionary APIs often contain invisible Ta'amim (U+0591–U+05AF) embedded in the
      // word string. They never render visually but cause all character tile comparisons
      // to fail silently — the user taps the correct letter but === returns false.
      // Strip them from all word/form strings at load time for Hebrew only.
      const _stripCantillation = (s) => {
        if (!s || langId !== 'hebrew') return s;
        // Strip invisible Ta'amim (cantillation marks U+0591-U+05AF)
        s = s.replace(/[\u0591-\u05AF]/g, '');
        // Normalise Gershayim (U+05F4) and Double-Yod ligature (U+05F2)
        // so database strings always compare equal to keyboard-typed input.
        s = s.replace(/\u05F4/g, '"').replace(/\u05F2/g, '\u05D9\u05D9');
        return s;
      };
      const _w = _stripCantillation;

      // BUG-FIX #123/#124 (Invisible Unicode in vocab data): text copied from news sites,
      // PDFs, or word processors into vocab_data.js frequently contains invisible characters:
      // soft hyphens U+00AD (124), ZWJ U+200D (121), BOM U+FEFF, fi/fl ligatures U+FB00-06 (123).
      // They survive JSON.parse and cause silent match failures — the player sees and types the
      // right text but === returns false. Strip and normalise all string fields at load time.
      const _cleanDataStr = (s) => {
        if (!s || typeof s !== 'string') return s;
        // Strip invisible/zero-width chars including soft hyphen U+00AD
        s = s.replace(/[­​-‏‪-‮⁠-⁯﻿]/g, '');
        // Decompose fi/fl/ff ligatures via NFKC normalisation
        if (s.normalize) s = s.normalize('NFKC');
        return s;
      };
      // Wrap: apply cantillation strip then invisible char clean
      const _ws = (s) => _cleanDataStr(_w(s));

      return {
        id:String(r.id), lang:langId, category:r.category||'General',
        word:_ws(r.display_word||(r.word?r.word.replace(/\|/g,' '):null)),
        word_raw:_ws(r.word)||null,
        ipa:r.ipa||null, reading:_ws(r.reading)||null, romaji:_ws(r.romaji)||null,
        meaning:_ws(r.meaning)||null, sentence1:_ws(r.sentence1)||null,
        sentence1_en:r.sentence1_en||null,
        sentence1_hl:r.sentence1_hl||null,
        sentence1_reading:_ws(r.sentence1_reading)||null,
        sentence2:_ws(r.sentence2)||null, sentence2_en:r.sentence2_en||null,
        sentence2_reading:_ws(r.sentence2_reading)||null,
        sentence3:_ws(r.sentence3)||null, sentence3_en:r.sentence3_en||null,
        sentence3_reading:_ws(r.sentence3_reading)||null,
        pos:r.pos||null, definition:r.definition||null,
        zh:r.zh||null, zh_def:r.zh_def||null,
        tip:r.tip||null,
        word_map:r.word_map||null,
        form_notes:r.form_notes||null,
        forms:Array.isArray(r.forms)?r.forms.map(_ws):[],
        // tts_override: author-specified TTS string when r.word would be mispronounced.
        // e.g. French "tous" (pronoun) needs tts_override:"tousse" to force /tus/ not /tu/.
        tts_override:r.tts_override?_ws(r.tts_override):null,
        forbidden_distractors:Array.isArray(r.forbidden_distractors)
          ?new Set(r.forbidden_distractors.map(s=>_ws(s)||''))
          :null
      };
    });
    idx = {};
    const uniqueRecs=[];
    recs.forEach(r => {
      const key = langId + ':' + r.id;
      // BUG-FIX (ID collision): AI generators frequently duplicate IDs across batch files.
      // Ignore later duplicates so they cannot inflate Store.count() or show as extra words.
      if (idx[key]) {
        console.error('[WordArk] Duplicate ID detected: ' + key +
          ' — ignored "' + r.word + '"; kept "' + idx[key].word +
          '". Check vocab files for repeated IDs.');
        return;
      }
      idx[key] = r;
      uniqueRecs.push(r);
    });
    recs=uniqueRecs;
    // Build phraseSet once: all pipe-joined multi-word phrases across the entire vocabulary.
    phraseSet = new Set();
    tileTransBase = {};
    recs.forEach(r => {
      if(r.word_raw && r.word_raw.includes('|')) phraseSet.add(r.word_raw.toLowerCase());
      if(r.word_map) Object.keys(r.word_map).forEach(k => { if(k.includes('|')) phraseSet.add(k.toLowerCase()); });
      // tileTransBase: map every word surface form → meaning for tile translation labels.
      // Keyed by: raw word, pipe-normalized display form, cleaned form, and all lowercased variants.
      // For JP we also key by reading (hiragana) since tile bank contains readings not kanji.
      const w=r.word, rd=r.reading, m=r.meaning;
      if(w && m){
        const disp=w.replace(/\|/g,' ');
        const clean=disp.replace(/[¿¡.,!?;:«»"()]+$/,'').trim();
        for(const key of [w, disp, clean]){
          if(key){ tileTransBase[key]=m; tileTransBase[key.toLowerCase()]=m; }
        }
      }
      // JP: also key by reading so hiragana tile bank tiles get translation labels.
      // BUG-FIX (homophone overwrite): if two words share the same reading (e.g. 橋 and 箸
      // both read はし), the last one loaded would silently overwrite the first. Fix: only
      // store the reading key when it is not already occupied by a DIFFERENT meaning.
      // Tile labels will then fall back to the kanji key (stored above) which is unambiguous.
      if(rd && m){
        const rdLow=rd.toLowerCase();
        if(!tileTransBase[rdLow] || tileTransBase[rdLow]===m){
          tileTransBase[rd]=m; tileTransBase[rdLow]=m;
        }
        // Always store kanji→meaning (lines above) so the unambiguous key always wins.
      }
    });
    // BUG-5 FIX: pre-compute blank-reachability at load time so buildQueue doesn't
    // re-run _blankSentences() (regex scan across all forms × 3 sentences) on every
    // session start. _blankSlots is a frozen array of reachable sentence slot objects;
    // _blankReachable is a boolean shortcut for canBlank(). These are invalidated on
    // language switch because Store.load() is called fresh each time.
    const lc = typeof LC !== 'undefined' ? LC[langId] : null;
    const isJP = lc && lc.type === 'japanese';
    const isHE = lc && lc.type === 'hebrew';
    recs.forEach(r => {
      if (isHE) { r._blankReachable = false; r._blankSlots = []; return; }
      const allForms = LangRules.expandForms(r.word_raw||r.word, [...(r.forms||[]), ...(WordForms[r.id]||[])], langId);
      const slots = [
        {sent:r.sentence1, sentReading:r.sentence1_reading||null, sentEn:r.sentence1_en||null},
        {sent:r.sentence2, sentReading:r.sentence2_reading||null, sentEn:r.sentence2_en||null},
        {sent:r.sentence3, sentReading:r.sentence3_reading||null, sentEn:r.sentence3_en||null},
      ].filter(s => s.sent && allForms.some(f => LangRules.formInSentence(s.sent, f, isJP)));
      r._blankReachable = slots.length > 0;
      r._blankSlots = slots;
    });

    // DEV-ONLY DIAGNOSTIC (reuses the same DEV_MODE flag as your validator_*.js loader
    // in index.html): warns in console about any sentence where NO form (word + forms[],
    // plus every LangRules auto-expansion) matches as a whole word — that sentence will
    // silently fail to highlight the keyword, and outside Hebrew, silently fail to be
    // blank-able, with zero runtime error either way. Purely a console report — does NOT
    // touch _blankReachable/_blankSlots above, so it can never change actual gameplay
    // behavior. Flip DEV_MODE=true in index.html, open devtools, switch to this language.
    if (typeof DEV_MODE !== 'undefined' && DEV_MODE) {
      const gaps = [];
      recs.forEach(r => {
        const forms = LangRules.expandForms(r.word_raw||r.word, [...(r.forms||[]), ...(WordForms[r.id]||[])], langId);
        [1,2,3].forEach(n => {
          const sent = r['sentence'+n];
          if (!sent) return;
          const hit = forms.some(f => LangRules.formInSentence(sent, f, isJP));
          if (!hit) gaps.push(`${r.id} "${r.word}" — sentence${n} has no matching form: "${sent}"`);
        });
      });
      if (gaps.length) {
        console.warn(`[forms-gap] ${langId}: ${gaps.length} sentence(s) with no matching form —`);
        gaps.forEach(g => console.warn('  '+g));
      } else {
        console.log(`[forms-gap] ${langId}: no gaps ✅`);
      }
    }
    // AUTO-GROUP: assign group numbers by load order (file sequence = importance order).
    // No group field needed in vocab data — position in recs[] IS the curriculum order.
    const GROUP_SIZE = 10;
    recs.forEach((r, i) => { r._group = Math.floor(i / GROUP_SIZE) + 1; });

    // BUG-FIX (lang switch stale count): snapshot this language's word count now so
    // Prog.stats(langId) can compute new-word counts correctly after a language switch.
    if(typeof Prog !== 'undefined') Prog.setLangCatalog(langId, recs.map(r=>r.id));
    _rememberLanguage(langId);
    if (typeof onReady === 'function') onReady(true);
    return recs;
  }
  function getAll()  { return recs; }
  function getById(langId,id){ return idx[langId+':'+String(id)]||null; }
  function getCats() { return [...new Set(recs.map(r=>r.category).filter(Boolean))]; }
  function count()   { return recs.length; }
  function getGroups(langId) {
    const map = {};
    recs.forEach(r => { if(!map[r._group]) map[r._group]=[]; map[r._group].push(r); });
    return Object.keys(map).map(g => {
      const words = map[g];
      const total = words.length;
      const statuses = words.map(r => (typeof Prog!=='undefined')?Prog.status(langId,r.id):'new');
      const mastered = statuses.filter(s=>s==='mastered').length;
      const started  = statuses.filter(s=>s!=='new').length;
      return { group:Number(g), words, total, mastered, started,
        done: total > 0 && mastered===total,
        inProgress: started>0 && mastered<total };
    }).sort((a,b)=>a.group-b.group);
  }
  // Safe eviction is performed only after a complete load. Never evict the language
  // being left at click time: its scripts may still be in flight, and deleting its
  // array mid-load can corrupt later batch pushes. Keep unload() for bounded LRU cleanup.
  function unload(langId) {
    _loaded.delete(langId);
    _recentLanguages = _recentLanguages.filter(id => id !== langId);
    if (window.VOCAB_DATA) delete window.VOCAB_DATA[langId];
  }

  return { load, unload, getAll, getById, getCats, count, getGroups, get phraseSet(){ return phraseSet; }, get tileTransBase(){ return tileTransBase; } };
})();

/* ─── PROGRESS ────────────────────────────────────────────── */
const Prog = (() => {
  const KEY='vg_prog_v1', SK='vg_schema', VER='2';
  let db={}, timer=null, _statsCache={};
  // BUG-4 FIX: incremental per-language counters so stats() is O(1) instead of O(N).
  let _counts={};
  // BUG-FIX (lang switch stale count): store per-language word totals at vocab load time
  // so stats(l) can compute correct new counts even when l is not the active language.
  let _langTotals={};
  // Only IDs present in the currently loaded catalogue may affect its totals. This keeps
  // old localStorage records for removed/test words from inflating a 10-word list to 12/17.
  let _validIds={};
  function _rebuildCatalogCount(lang){
    const ids=_validIds[lang];
    if(!ids)return;
    const c={new:0,unfamiliar:0,mastered:0};
    ids.forEach(id=>{
      const item=db[_k(lang,id)];
      const st=item&&['new','unfamiliar','mastered'].includes(item.status)?item.status:'new';
      c[st]++;
    });
    _counts[lang]=c;
  }
  function _rebuildCatalogCounts(){Object.keys(_validIds).forEach(_rebuildCatalogCount);}
  function _rebuildCounts(){
    _counts={};
    Object.keys(db).forEach(k=>{
      const sep=k.lastIndexOf(':');
      if(sep<0)return;
      const lang=k.slice(0,sep), st=db[k].status;
      if(!_counts[lang])_counts[lang]={new:0,unfamiliar:0,mastered:0};
      if(_counts[lang][st]!=null)_counts[lang][st]++;
    });
    _rebuildCatalogCounts();
  }
  // BUG-22 FIX: migration dispatch table — add a new entry here whenever VER bumps.
  // Each function receives the old db object and returns a migrated copy.
  // This prevents future schema version bumps from wiping all user progress.
  const MIGRATIONS = {
    // '3': (old) => { /* transform v2 → v3 */ return old; },
  };
  function load() {
    const storedVer = localStorage.getItem(SK);
    if (storedVer !== VER) {
      let raw = {};
      try { raw = JSON.parse(localStorage.getItem(KEY)||'{}'); } catch { raw = {}; }
      // Walk migration chain: storedVer → storedVer+1 → … → VER
      let cur = storedVer ? parseInt(storedVer,10) : 1;
      const target = parseInt(VER,10);
      while (cur < target) {
        const migFn = MIGRATIONS[String(cur+1)];
        if (migFn) { try { raw = migFn(raw); } catch(e) { raw = {}; break; } }
        else { raw = {}; break; } // no migration path → safe reset
        cur++;
      }
      db = raw;
      _save();
      localStorage.setItem(SK, VER);
      _rebuildCounts();
      return;
    }
    try { db=JSON.parse(localStorage.getItem(KEY)||'{}'); } catch { db={}; }
    _rebuildCounts();
  }
  // BUG-FIX #170 (surrogate pair safety): JSON.stringify throws TypeError on orphaned
  // surrogate pairs (e.g. from badly pasted Emoji or Japanese text). Replace any
  // lone surrogates with U+FFFD before serialising so the save never silently fails.
  function _safeStringify(obj){
    try{
      return JSON.stringify(obj);
    }catch(e){
      // Fallback: re-encode via TextDecoder replacing ill-formed sequences
      try{
        const raw=JSON.stringify(obj,(_k,v)=>typeof v==='string'?v.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,'\uFFFD'):v);
        return raw;
      }catch{return '{}';}
    }
  }
  // BUG-FIX (localStorage near-full warning): scan total usage and warn at 80% (~4 MB)
  // so multilingual learners get a heads-up before the hard 5 MB wall hits.
  // Called after every successful save (not on quota error path) to avoid extra overhead
  // when the save itself already failed.
  // Note: localStorage key/value pairs are stored as UTF-16, so each JS char = 2 bytes.
  function _getStorageUsedKB() {
    try {
      let bytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        bytes += (k.length + (localStorage.getItem(k)||'').length) * 2;
      }
      return Math.round(bytes / 1024);
    } catch { return 0; }
  }
  // Throttle the near-full warning: only show once per session, not on every keystroke.
  let _storageWarnShown = false;
  function _save()  {
    try {
      localStorage.setItem(KEY,_safeStringify(db));
      // Proactive near-full warning (only fires once per session to avoid toast spam)
      if (!_storageWarnShown) {
        const usedKB = _getStorageUsedKB();
        if (usedKB > 4096) { // >80% of typical 5120 KB limit
          _storageWarnShown = true;
          console.warn('VocabGame: localStorage at ' + usedKB + ' KB — approaching 5 MB limit.');
          if (typeof toast === 'function')
            toast('⚠️ Storage ' + usedKB + ' KB / ~5120 KB used. Export a backup code in Settings before it fills up.', 8000);
        }
      }
    }
    catch(e){
      if(e&&(e.name==='QuotaExceededError'||e.code===22||e.code===1014)){
        console.error('VocabGame: localStorage quota exceeded — progress not saved.');
        if(typeof toast==='function') toast('🚨 Storage full! Go to Settings → Copy Code to back up your progress before data is lost.',8000);
      }
    }
  }
  function _defer() { clearTimeout(timer); timer=setTimeout(_save,500); }
  function _k(l,id) { return l+':'+String(id); }
  function get(l,id) { return db[_k(l,id)]||{status:'new',correct:0,wrong:0,seen:0}; }


  function rec(l,id,ok) {
    const k=_k(l,id), c=db[k]||{status:'new',correct:0,wrong:0,seen:0};
    const prevStatus=c.status||'new';
    c.seen++; 
    ok ? c.correct++ : c.wrong++;

    // Net Score mastery: correct - wrong >= 3 → mastered
    // BUG-FIX (SRS purgatory): cap the negative floor at -2.
    // Without this, a word answered wrong 15× needs 18 correct in a row to master.
    // With the cap, the worst-case recovery is always 5 correct answers (from -2 to +3).
    const netScore = Math.max(-2, c.correct - c.wrong);
    let newStatus;
    if (netScore >= 3) {
      newStatus = 'mastered';
    } else if(prevStatus==='mastered'){
      // BUG-9 FIX: grace window — require net score to drop below 1 (not just below 3)
      // before demoting. One misclick or accidental tap won't demote a well-known word.
      newStatus = netScore >= 1 ? 'mastered' : 'unfamiliar';
    } else {
      newStatus = 'unfamiliar';
    }
    c.status=newStatus;

    // BUG-4 FIX: update incremental counts instead of invalidating whole cache
    if(!_counts[l])_counts[l]={new:0,unfamiliar:0,mastered:0};
    if(prevStatus!==newStatus){
      if(_counts[l][prevStatus]!=null)_counts[l][prevStatus]--;
      if(_counts[l][newStatus]!=null)_counts[l][newStatus]++;
    }
    db[k]=c; _statsCache={}; _defer();
  }


  function status(l,id)  { return get(l,id).status; }
  // BOOKMARK/FAVORITE: independent of status (new/unfamiliar/mastered) — a word can be
  // mastered AND favorited at the same time. Stored on the same db[lang:id] record so it
  // rides along with the existing debounced _save(), and — once whitelisted in importCode's
  // sanitizer below — with Export/Import and Reset for free.
  function isFav(l,id) { return !!get(l,id).fav; }
  function toggleFav(l,id) {
    const k=_k(l,id);
    const c=db[k]||{status:'new',correct:0,wrong:0,seen:0};
    c.fav=!c.fav;
    db[k]=c; _defer();
    return c.fav;
  }
  function stats(l) {
    // BUG-4 FIX: O(1) lookup from incremental _counts instead of scanning all db keys.
    // _counts is kept up-to-date by rec() and rebuilt from scratch by load().
    // BUG-FIX (new count always 0): _counts only tracks words that have been through
    // rec(). Words never played are not in _counts, so tracked.new is always 0.
    // Correct new count = total words in store minus unfamiliar minus mastered.
    // BUG-FIX (lang switch stale count): Store.count() returns the CURRENTLY LOADED
    // language's word count. After a language switch, stats() for the previous language
    // would use the new language's count and return a wildly wrong new count.
    // Fix: track per-language total word counts at load time in _langTotals so
    // stats(l) always divides correctly even if l is not the currently active language.
    if(_statsCache[l]) return _statsCache[l];
    const tracked=_counts[l]||{new:0,unfamiliar:0,mastered:0};
    if(_validIds[l]){
      const exact={new:tracked.new||0,unfamiliar:tracked.unfamiliar||0,mastered:tracked.mastered||0};
      _statsCache[l]=exact; return exact;
    }
    const totalForLang=_langTotals[l]||Store.count();
    const newCount=Math.max(0, totalForLang - tracked.unfamiliar - tracked.mastered);
    const s={new:newCount, unfamiliar:tracked.unfamiliar, mastered:tracked.mastered};
    _statsCache[l]=s; return s;
  }
  function reset() { db={}; _statsCache={}; _counts={}; _rebuildCatalogCounts(); _save(); }
  function setLangCatalog(l, ids) {
    _validIds[l]=new Set((ids||[]).map(String));
    _langTotals[l]=_validIds[l].size;
    _rebuildCatalogCount(l);
    _statsCache={};
  }
  function setLangTotal(l, n) { _langTotals[l]=n; _statsCache={}; }
  function exportCode() {
    try{
      const json=_safeStringify(db);
      const bytes=new TextEncoder().encode(json);
      // BUG-2 FIX: spread syntax crashes with RangeError once bytes > ~65K args.
      // Chunked loop has no stack limit and works for arbitrarily large progress objects.
      let binary='';
      const chunkSize=8192;
      for(let i=0;i<bytes.length;i+=chunkSize){
        binary+=String.fromCharCode(...bytes.subarray(i,i+chunkSize));
      }
      return btoa(binary);
    }catch{return '';}
  }
  function importCode(code) {
    try{
      const bytes=Uint8Array.from(atob(code.trim()),c=>c.charCodeAt(0));
      const p=JSON.parse(new TextDecoder().decode(bytes));
      if(typeof p!=='object'||Array.isArray(p))throw 0;
      // BUG FIX: validate imported keys before merging (format: "lang:id", or the
      // special "_v" version key) so a crafted base64 string can't inject arbitrary
      // data into localStorage.
      //
      // BUG FIX (cross-device import data loss): this used to validate the "lang:id"
      // key against Object.keys(VOCAB_DATA) — but VOCAB_DATA only holds whichever
      // catalogues happen to be in the small runtime cache, not every supported language.
      // So importing a full multi-language export code — the whole point of
      // this feature, e.g. restoring progress on a new device — silently kept only the
      // currently-loaded language and dropped every other language's progress, with no
      // error shown. Fix: validate the LANGUAGE against LC (the static language config,
      // always fully available, never lazy-loaded) instead of VOCAB_DATA. The id itself
      // is intentionally left freeform (just non-empty, capped length) — the
      // field-level sanitizer right below already clamps status/correct/wrong/seen/fav
      // to safe values, so an id that happens not to match a real word just becomes an
      // inert localStorage entry that nothing ever reads, not a real vulnerability.
      const knownLangs=new Set(Object.keys(LC));
      const isValidKey=(k)=>{
        if(k==='_v')return true;
        const sep=k.lastIndexOf(':');
        if(sep<=0||sep>=k.length-1)return false; // needs "lang:id" with both sides non-empty
        return knownLangs.has(k.slice(0,sep)) && (k.length-sep-1)<=32;
      };
      // SECURITY FIX (field-level validation): beyond key validation, verify that each
      // progress record has the expected shape. A crafted import could otherwise set
      // status:'admin' or correct:Infinity, corrupting stats() and SRS calculations.
      const VALID_STATUSES = new Set(['new','unfamiliar','mastered']);
      const sanitized={};
      Object.keys(p).forEach(k=>{
        if(!isValidKey(k)) return;
        if(k==='_v'){ sanitized[k]=p[k]; return; }
        const v=p[k];
        if(!v||typeof v!=='object'||Array.isArray(v)) return;
        // Validate and clamp each field to its expected type/range
        const status=VALID_STATUSES.has(v.status)?v.status:'new';
        const correct=Number.isFinite(v.correct)&&v.correct>=0?Math.floor(v.correct):0;
        const wrong=Number.isFinite(v.wrong)&&v.wrong>=0?Math.floor(v.wrong):0;
        const seen=Number.isFinite(v.seen)&&v.seen>=0?Math.floor(v.seen):0;
        const fav=v.fav===true;
        sanitized[k]={status,correct,wrong,seen,fav};
      });
      Object.assign(db,sanitized); _statsCache={}; _rebuildCounts(); _save(); return true;
    }catch{return false;}
  }
  // BUG-6 FIX: persist lastSessionWords so spaced repetition survives page reloads.
  const LSW_KEY='vg_lsw_v1';
  function saveLastSession(wordIdSet){
    try{ localStorage.setItem(LSW_KEY,JSON.stringify([...wordIdSet])); }catch(e){}
  }
  function loadLastSession(){
    try{ return new Set(JSON.parse(localStorage.getItem(LSW_KEY)||'[]')); }catch{ return new Set(); }
  }
  return { load, get, rec, status, isFav, toggleFav, stats, reset, exportCode, importCode, saveLastSession, loadLastSession, setLangTotal, setLangCatalog };
})();

/* ─── TTS ─────────────────────────────────────────────────── */
const TTS = (() => {
  // FIX (v38): every word/sentence now plays through its OWN fresh `new Audio(url)`
  // instance — exactly what the two standalone reference games already did successfully,
  // including their setTimeout-delayed auto-play after a correct answer. The old assumption
  // ("iOS grants autoplay permission per media element") is what led this engine to reuse
  // ONE long-lived <audio> element and only reassign .src on it. Reassigning .src on a
  // persistent element WITHOUT calling .load() is a known-unreliable pattern in WebKit/
  // Safari for cross-origin sources: the element does not reliably notice the source
  // changed and start fetching, which then trips this module's own onerror/timeout
  // watchdog and looks exactly like "Google is blocking us" when the shared element is
  // actually just stuck. `player` below is now used ONLY as a silent capability probe on
  // the Start tap (see unlock()) — it never carries real speech audio anymore; see
  // activeEl for that.
  //
  // Native speechSynthesis has its OWN iOS gesture gate, unrelated to <audio> elements,
  // so it is still primed separately during the same Start tap. Unlocking HTMLAudio does
  // not unlock speechSynthesis, and vice versa.
  const player = new Audio();
  player.preload = 'auto';
  player.setAttribute('playsinline','');
  player.setAttribute('webkit-playsinline','');
  const SILENT_AUDIO='data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
  let isPlaying = false;
  let mediaUnlocked = false;
  // If iOS rejects the first media unlock, do not leave the whole session stuck on
  // native speech. The next real user tap can safely retry the probe.
  let needsGestureRecovery = false;
  let nativeSpeechPrimed = false;
  let nativePrimedLang = null;
  let unlockPromise = null;
  let sourceTimer = null;
  let voiceReadyTimer = null;
  let speechStartTimer = null;
  let playToken = 0;
  let webUtterance = null;
  let activeEl = null; // fresh per-utterance Audio element currently playing/attempting real TTS content

  // BUG-FIX (Aug 2026): reduce wasted requests against translate_tts during a Google
  // outage/throttle. Two separate, narrow guards — neither disables or removes any
  // existing source, both only change trial order/timing for an ALREADY-observed word:
  //
  // 1) _lastGoodSource remembers which source actually worked for a given (word,lang)
  //    THIS session, so a repeat play of a word that's already known to need the
  //    dictionary/fallback tries that source FIRST instead of re-hitting the two
  //    Google hosts (which are currently down) every single time it's replayed.
  //    TTL lets Google reclaim first place again periodically, in case it recovers
  //    mid-session, without needing a full reload.
  const _lastGoodSource = new Map(); // key: `${lang}|${text}` -> {id, at}
  const GOOD_SOURCE_TTL_MS = 3 * 60 * 1000;
  // 2) An impatient re-tap of the SAME word while the previous attempt is still mid-
  //    waterfall used to restart the whole thing from google-primary, silently doubling
  //    that word's Google requests per extra tap. Swallow only a near-instant repeat of
  //    the identical (text, lang) pair — anything a beat slower is a deliberate replay
  //    and still goes through as normal.
  let _lastRequestKey = null;
  let _lastRequestAt = 0;
  const DUPLICATE_GUARD_MS = 400;

  // en-GB for IELTS — British English pronunciation (schedule, either, clerk differ from en-US)
  const LANG_MAP = { fi: 'fi-FI', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', he: 'he-IL', ja: 'ja-JP', en: 'en-GB', de: 'de-DE' };

  function _activeTtsLang(){
    try{
      return (typeof S!=='undefined'&&typeof LC!=='undefined'&&LC[S.lang]&&LC[S.lang].ttsLang)||'en';
    }catch(e){return'en';}
  }

  function _nativeLocale(lang){return LANG_MAP[lang]||lang||'en-US';}

  function _findNativeVoice(lang){
    if(!window.speechSynthesis||typeof window.speechSynthesis.getVoices!=='function')return null;
    let voices=[];
    try{voices=window.speechSynthesis.getVoices()||[];}catch(e){return null;}
    const norm=value=>String(value||'').replace(/_/g,'-').toLowerCase();
    const target=norm(_nativeLocale(lang));
    const base=target.split('-')[0];
    // Some WebKit builds still expose Hebrew under its legacy ISO code "iw".
    const bases=base==='he'?['he','iw']:[base];
    return voices.find(v=>norm(v.lang)===target)||
      voices.find(v=>bases.some(b=>norm(v.lang)===b||norm(v.lang).startsWith(b+'-')))||null;
  }

  // WebKit on iPhone requires the FIRST speechSynthesis.speak() call to happen while
  // a real user gesture is active. Prime it silently here so it remains a usable last
  // resort if every Google/dictionary audio URL fails later in an automatic question.
  // Prime the CURRENT language on every real round/lesson gesture; a single hard-coded
  // en-US prime can otherwise make Safari pronounce French/Hebrew/etc. with English rules.
  function _primeNativeSpeechFromGesture(lang) {
    if(!window.speechSynthesis||typeof SpeechSynthesisUtterance==='undefined')return nativeSpeechPrimed;
    // If the browser exposes userActivation, never incorrectly mark an async attempt as
    // primed. Older Safari versions do not expose it, so they are allowed to try.
    if(navigator.userActivation&&navigator.userActivation.isActive===false)return nativeSpeechPrimed;
    const requestedLang=lang||_activeTtsLang();
    try{
      window.speechSynthesis.cancel();
      const prime=new SpeechSynthesisUtterance('\u00a0');
      prime.lang=_nativeLocale(requestedLang);
      const voice=_findNativeVoice(requestedLang);
      if(voice)prime.voice=voice;
      prime.volume=0;
      prime.rate=10;
      webUtterance=prime; // retain the utterance; iOS may drop unreferenced utterances
      window.speechSynthesis.speak(prime);
      nativeSpeechPrimed=true;
      nativePrimedLang=requestedLang;
      return true;
    }catch(e){return false;}
  }

  function unlock(requestedLang) {
    const lang=requestedLang||_activeTtsLang();
    // This function must be ENTERED directly from a Start/Lesson tap. Everything before
    // the first await therefore runs inside the iOS user-activation window.
    if (mediaUnlocked) {
      needsGestureRecovery=false;
      _primeNativeSpeechFromGesture(lang);
      return Promise.resolve(true);
    }
    // Coalesce accidental double taps instead of cancelling the first unlock attempt.
    // Still prime the newly requested language while this fresh gesture is available.
    if(unlockPromise){_primeNativeSpeechFromGesture(lang);return unlockPromise;}
    stop();
    const token=playToken;
    _primeNativeSpeechFromGesture(lang);
    player.src=SILENT_AUDIO;
    player.playbackRate=1;
    player.volume=1;
    player.load();
    let playResult;
    try{playResult=player.play();}
    catch(e){mediaUnlocked=false;needsGestureRecovery=true;return Promise.resolve(false);}
    let attempt;
    attempt=new Promise(resolve=>{
      let settled=false;
      const finish=ok=>{
        if(settled)return;
        settled=true;
        clearTimeout(timeout);
        if(ok){mediaUnlocked=true;needsGestureRecovery=false;}
        else if(token===playToken){mediaUnlocked=false;needsGestureRecovery=true;}
        if(unlockPromise===attempt)unlockPromise=null;
        resolve(ok);
      };
      // A media play Promise is allowed to remain pending by browser implementations.
      // Cap the trigger attempt so it can never hold any later TTS request indefinitely.
      const timeout=setTimeout(()=>{
        if(token===playToken){try{player.pause();player.currentTime=0;}catch{}}
        finish(false);
      },1500);
      Promise.resolve(playResult).then(()=>{
        if(token!==playToken){finish(false);return;}
        player.pause();
        try{player.currentTime=0;}catch{}
        finish(true);
      }).catch(()=>finish(false));
    });
    unlockPromise=attempt;
    return attempt;
  }

  // BUG-FIX (silent auto-play / "must tap to hear"): patient=true (default, used by every
  // manual 🔊 tap) keeps the original long Google timeouts — worth the wait for the better
  // voice when the player is actively waiting. patient=false (used only by the automatic
  // listening-question auto-play) shortens every source's timeout drastically, so when
  // Google is down the fallback to native voice happens in ~2s total instead of up to 46s
  // (15s+10s+3×7s for English) — which is why auto-play looked broken: it WAS eventually
  // reaching native, just far too late for anyone to wait for.
  function say(text, lang, rate = 0.9, patient = true) {
    if (!text) return;
    // Automatic New Word / Listening audio may be scheduled while the Start trigger is
    // still resolving. Queue only the voice request — never the question UI — and play
    // it as soon as unlock succeeds or reaches its bounded 1.5s safety timeout.
    if(unlockPromise){
      const token=playToken;
      unlockPromise.finally(()=>{
        if(token===playToken)say(text,lang,rate,patient);
      });
      return;
    }

    // Guard 2: near-instant duplicate tap on the same word — see module-level comment.
    const wordKey = lang + '|' + text;
    const _now = Date.now();
    if (wordKey === _lastRequestKey && (_now - _lastRequestAt) < DUPLICATE_GUARD_MS) return;
    _lastRequestKey = wordKey;
    _lastRequestAt = _now;

    text = text.replace(/\|/g, ' '); // strip pipe-phrase separators before speaking
    // A manual replay or a new question must interrupt a stalled/older request rather
    // than being swallowed forever by an isPlaying guard.
    stop();
    const token=playToken;
    isPlaying = true;
    TTS._lastPlay = Date.now(); // BUG-FIX #122: track for stuck-state detection

    // 1. Clean the text exactly like your original code did
    let clean = text;
    if (lang === 'ja') {
      clean = text.replace(/[！？｡。、・「」『』【】〔〕…―〜]/g, c => {
        const map = { '！': '!', '？': '?', '。': '.', '、': ',', '…': '...', '―': '-', '〜': '~' };
        return map[c] || ' ';
      }).trim();
    } else if (lang === 'he') {
      clean = text.replace(/[!?.]/g, ' ').replace(/\s+/g, ' ').trim();
    } else {
      clean = text.replace(/[!?.]/g, ' ').trim();
    }

    // 2. Build the "Waterfall" of free audio sources. This array is rebuilt for EVERY
    // utterance, so a Google failure applies only to the current word/sentence — the
    // next TTS.say() always promotes Google back to the first position.
    const sources = [];

    // Source 1: Standard Google Translate. One attempt per host is intentional: every
    // NEW utterance rebuilds this list and starts at Google again, so hammering the same
    // failed URL 250ms later only creates a burst and does not improve future words.
    // iPhone may need several seconds before `playing` even though Google is healthy.
    // The former 3.5s watchdog aborted that valid request by replacing player.src, which
    // made an English dictionary rescue sound as if Google had lost priority. Give the
    // primary the same patient behaviour as the proven standalone games, with only a
    // generous emergency bound so a genuinely hung Listening question cannot lock forever.
    sources.push({
      id:'google-primary', timeoutMs: patient?15000:2500,
      url:`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(clean)}`
    });

    // Source 2: Backup Google Server (Bypasses IP blocks). It also gets a patient window;
    // dictionary/native voices remain rescue tools, never a fast substitute for Google.
    sources.push({
      id:'google-backup', timeoutMs: patient?10000:1500,
      url:`https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=${lang}&q=${encodeURIComponent(clean)}`
    });

    // Source 3: Real Human Dictionary Voice (Only for single English words in IELTS mode)
    if (lang === 'en' && !clean.includes(' ')) {
      const lowerWord = clean.toLowerCase();
      // Keep every original rescue source. They are used only after both Google hosts
      // fail for this particular utterance.
      const dictTimeout = patient?7000:1000;
      sources.push({id:'dictionary-gstatic-gb',timeoutMs:dictTimeout,
        url:`https://ssl.gstatic.com/dictionary/static/sounds/20200429/${lowerWord}--_gb_1.mp3`});
      sources.push({id:'dictionary-gstatic-us',timeoutMs:dictTimeout,
        url:`https://ssl.gstatic.com/dictionary/static/sounds/20200429/${lowerWord}--_us_1.mp3`});
      sources.push({id:'dictionary-api-uk',timeoutMs:dictTimeout,
        url:`https://api.dictionaryapi.dev/media/pronunciations/en/${lowerWord}-uk.mp3`});
    }

    // Guard 1: if this exact (word, lang) already found a working source THIS session,
    // try it first — see module-level comment above _lastGoodSource. This only reorders
    // the list already built above; every source, including both Google hosts, is still
    // present and still gets tried if the remembered one fails this time too.
    const _remembered = _lastGoodSource.get(wordKey);
    if (_remembered && (Date.now() - _remembered.at) < GOOD_SOURCE_TTL_MS) {
      const _idx = sources.findIndex(s => s.id === _remembered.id);
      if (_idx > 0) sources.unshift(sources.splice(_idx, 1)[0]);
    }

    let currentSourceIndex = 0;
    TTS._sourceAttempts=[];
    TTS._lastRequestedLang=lang;
    TTS._lastSource=null;
    TTS._lastNativeVoice=null;
    TTS._lastFailure=null;
    // TEMP DIAGNOSTIC (Aug 2026): Noah reported hearing the native fallback voice
    // instead of Google's. Surface exactly why Google/dictionary sources failed —
    // once per session only, same "don't spam toasts" pattern as the storage
    // warning above — so this can be read straight off the phone with no devtools.
    // Safe to delete this block (and TTS._diagShown) once the cause is confirmed.

    // 3. Try URLs one by one until one works. FIX (v38): each attempt gets its OWN fresh
    // Audio element (matching the proven standalone-game pattern) instead of reassigning
    // .src on one shared element — see the module-level comment for why that was unreliable.
    function tryNextSource() {
      if(token!==playToken)return;
      if (currentSourceIndex >= sources.length) {
        // All web URLs failed (or user has no internet). Use robotic native voice.
        if(!TTS._diagShown && typeof toast==='function'){
          TTS._diagShown=true;
          const last=TTS._lastFailure;
          toast('🔧 TTS fallback — tried: '+TTS._sourceAttempts.join(', ')+
            (last?(' — last reason: '+last.reason+(last.name?' ('+last.name+')':'')):''),6000);
        }
        isPlaying = false;
        _speakWeb(text, lang, rate, token);
        return;
      }

      const source=sources[currentSourceIndex];
      TTS._sourceAttempts.push(source.id);
      const el = new Audio(source.url); // fresh element per attempt — no shared .src mutation
      activeEl = el;
      el.playbackRate = rate;
      let settled=false;
      const failOnce=(reason='source-error',err=null)=>{
        if(settled||token!==playToken)return;
        settled=true;
        clearTimeout(sourceTimer);
        sourceTimer=null;
        // Fully detach this element before moving on, so a late/slow response from an
        // abandoned attempt can never fire onplaying/onended and clobber the NEXT
        // source's timer or diagnostics (a risk unique to using per-attempt elements).
        el.onplaying=null;
        el.onended=null;
        el.onerror=null;
        try{el.pause();}catch{}
        TTS._lastFailure={source:source.id,reason,name:err&&err.name||'',at:Date.now()};

        // NotAllowedError is an iOS media-permission failure, not a bad Google URL.
        // Trying every other <audio> URL would fail for the same reason, so preserve all
        // rescue sources for real network/decode failures and use the already-primed
        // native voice for this one utterance. A later real tap will re-arm Google audio.
        if(reason==='not-allowed'){
          mediaUnlocked=false;
          needsGestureRecovery=true;
          isPlaying=false;
          _speakWeb(text,lang,rate,token);
          return;
        }

        currentSourceIndex++;
        tryNextSource();
      };

      el.onplaying=()=>{
        if(token!==playToken)return;
        clearTimeout(sourceTimer);
        sourceTimer=null;
        mediaUnlocked=true;
        needsGestureRecovery=false;
        TTS._lastSource=source.id;
        _lastGoodSource.set(wordKey, {id: source.id, at: Date.now()});
      };

      // When audio finishes successfully, allow clicking again
      el.onended = () => {
        if(token!==playToken)return;
        settled=true;
        clearTimeout(sourceTimer);
        isPlaying = false;
        // Unlock MC buttons if we are in listeningWord mode
        if(typeof G_unlockListenMC==='function'&&S?.q?.mode==='listeningWord') G_unlockListenMC();
      };

      // If this specific URL fails (404 error, or Google block), try the next one instantly
      el.onerror = ()=>failOnce('source-error');

      // Play it!
      sourceTimer=setTimeout(()=>failOnce('timeout'),source.timeoutMs||7000);
      let playPromise;
      try{playPromise=el.play();}
      catch(err){
        failOnce(err&&err.name==='NotAllowedError'?'not-allowed':'play-rejected',err);
        return;
      }
      if(playPromise&&typeof playPromise.catch==='function')playPromise.catch(err=>{
        // A rejected autoplay attempt means the remembered media permission is no
        // longer usable (common after an interrupted iOS/PWA lifecycle). Do not keep
        // reporting a stale unlocked state on the next real Start tap.
        failOnce(err&&err.name==='NotAllowedError'?'not-allowed':'play-rejected',err);
      });
    }

    // Start the waterfall process
    tryNextSource();
  }

  function stop() {
    playToken++;
    clearTimeout(sourceTimer);
    clearTimeout(voiceReadyTimer);
    clearTimeout(speechStartTimer);
    sourceTimer=null;
    voiceReadyTimer=null;
    speechStartTimer=null;
    if(activeEl){
      activeEl.onplaying=null;
      activeEl.onended=null;
      activeEl.onerror=null;
      try { activeEl.pause(); activeEl.currentTime = 0; } catch {}
      activeEl=null;
    }
    webUtterance=null;
    isPlaying = false;
    // Cancel Web Speech regardless — covers both the Audio waterfall fallback path
    // and direct _speakWeb() calls. Safe to call even when nothing is speaking.
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch {}
  }

  // 4. Hidden Native Fallback (The robotic voice if offline)
  function _releaseListeningAfterAudioFailure(){
    if(typeof G_unlockListenMC==='function'&&S?.q?.mode==='listeningWord')G_unlockListenMC();
  }

  function _speakWeb(text, lang, rate, token) {
    if (!window.speechSynthesis) {
      isPlaying=false;
      _releaseListeningAfterAudioFailure();
      return;
    }
    window.speechSynthesis.cancel();
    isPlaying = true; // Re-set so stop() can guard against the stuck-state
    TTS._lastPlay = Date.now();

    const u = new SpeechSynthesisUtterance(text);
    u.lang = _nativeLocale(lang);
    u.rate = rate;
    webUtterance = u;

    const doSpeak = match => {
      if(token!==playToken)return;
      u.voice=match;
      TTS._lastNativeVoice={lang:match.lang||'',name:match.name||''};
      let started=false;
      u.onstart = () => {
        if(token!==playToken)return;
        started=true;
        clearTimeout(speechStartTimer);
        speechStartTimer=null;
        TTS._lastSource='ios-native';
      };
      u.onend = () => {
        if(token!==playToken)return;
        clearTimeout(speechStartTimer);
        speechStartTimer=null;
        webUtterance = null;
        isPlaying = false;
        if(typeof G_unlockListenMC==='function'&&S?.q?.mode==='listeningWord') G_unlockListenMC();
      };
      u.onerror = event => {
        if(token!==playToken)return;
        clearTimeout(speechStartTimer);
        speechStartTimer=null;
        webUtterance=null;
        isPlaying=false;
        TTS._lastFailure={source:'ios-native',reason:'speech-error',name:event&&event.error||'',at:Date.now()};
        _releaseListeningAfterAudioFailure();
      };
      try{
        window.speechSynthesis.speak(u);
        // iOS can silently ignore an unprimed utterance without firing onerror. Avoid
        // leaving the engine stuck forever when that happens.
        speechStartTimer=setTimeout(()=>{
          if(token!==playToken||started)return;
          try{window.speechSynthesis.cancel();}catch{}
          webUtterance=null;
          isPlaying=false;
          speechStartTimer=null;
          TTS._lastFailure={source:'ios-native',reason:'speech-not-started',name:u.lang,at:Date.now()};
          _releaseListeningAfterAudioFailure();
        },3000);
      }catch(e){
        webUtterance=null;
        isPlaying=false;
        TTS._lastFailure={source:'ios-native',reason:'speak-error',name:e&&e.name||'',at:Date.now()};
        _releaseListeningAfterAudioFailure();
      }
    };

    // Safari may briefly return an empty voice list. Wait for it for a bounded 600ms,
    // but NEVER call speak() without a matching-language voice: an unset u.voice can
    // make iOS reuse its default/last-primed English voice for words such as "merci".
    const voiceDeadline=Date.now()+600;
    const chooseVoice=()=>{
      if(token!==playToken)return;
      const match=_findNativeVoice(lang);
      if(match){
        clearTimeout(voiceReadyTimer);
        voiceReadyTimer=null;
        doSpeak(match);
        return;
      }
      if(Date.now()<voiceDeadline){
        voiceReadyTimer=setTimeout(chooseVoice,120);
        return;
      }
      voiceReadyTimer=null;
      webUtterance=null;
      isPlaying=false;
      TTS._lastFailure={source:'ios-native',reason:'voice-unavailable',name:_nativeLocale(lang),at:Date.now()};
      _releaseListeningAfterAudioFailure();
    };
    chooseVoice();
  }

  // BUG-FIX #122: if app was backgrounded while audio played, onended may never fire,
  // leaving isPlaying=true permanently. Reset when app returns to foreground.
  function resetIfStuck(){
    if(isPlaying&&TTS._lastPlay&&(Date.now()-TTS._lastPlay)>8000){ stop(); }
  }

  // Recovery happens after the clicked control's own handler has run. It never waits,
  // never speaks a word, and never changes question state; it only re-arms the persistent
  // Audio element when an earlier iOS NotAllowed/initial-unlock failure requested it.
  function recoverFromGesture(event){
    if(event&&event.isTrusted===false)return false;
    if(!needsGestureRecovery||isPlaying||unlockPromise)return false;
    if(navigator.userActivation&&navigator.userActivation.isActive===false)return false;
    try{void unlock(_activeTtsLang());return true;}catch(e){return false;}
  }
  if(typeof document!=='undefined'&&document.addEventListener){
    document.addEventListener('click',recoverFromGesture,false);
  }

  function diagnostics(){
    return {
      mediaUnlocked,
      needsGestureRecovery,
      nativeSpeechPrimed,
      nativePrimedLang,
      lastRequestedLang:TTS._lastRequestedLang||null,
      attemptedSources:[...(TTS._sourceAttempts||[])],
      lastSource:TTS._lastSource||null,
      lastNativeVoice:TTS._lastNativeVoice||null,
      lastFailure:TTS._lastFailure||null
    };
  }
  return { say, stop, unlock, recoverFromGesture, diagnostics, resetIfStuck };
})();







/* ─── SFX ─────────────────────────────────────────────────── */
const SFX = (() => {
  let ctx=null;
  function _c() {
    if(!ctx)try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch{return null;}
    if(ctx.state==='suspended')ctx.resume(); return ctx;
  }
  function _t(f,type,dur,vol,d=0){
    const c=_c(); if(!c)return;
    const o=c.createOscillator(),g=c.createGain();
    o.connect(g);g.connect(c.destination);
    o.type=type;o.frequency.value=f;
    const t=c.currentTime+d;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    o.start(t);o.stop(t+dur);
    // BUG-FIX (iOS Safari AudioNode leak): nodes stopped but still connected accumulate
    // in the Audio Engine on old Safari, causing glitching and eventual audio crash.
    // disconnect() after stop() allows GC to reclaim them immediately.
    o.onended = () => { try{o.disconnect();g.disconnect();}catch{} };
  }
  function _n(dur,vol){
    const c=_c();if(!c)return;
    const buf=c.createBuffer(1,c.sampleRate*dur,c.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    src.buffer=buf;src.connect(f);f.connect(g);g.connect(c.destination);
    f.type='bandpass';f.frequency.value=800;
    const t=c.currentTime;
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    src.start(t);src.stop(t+dur);
    // BUG-FIX (iOS Safari AudioNode leak): same as _t() — disconnect on ended.
    src.onended = () => { try{src.disconnect();f.disconnect();g.disconnect();}catch{} };
  }
  return {
    pop()  { _t(523,'sine',.1,.3);_t(784,'sine',.1,.25,.06);_t(1047,'sine',.1,.2,.12); },
    // Wrong-answer UI and audio are sufficient; the optional mascot stays neutral.
    wrong(){ _n(.06,.18);_t(160,'sawtooth',.15,.2,.02); },
    click(){ _t(1100,'sine',.04,.12); },
    done() { _t(523,'sine',.08,.3);_t(659,'sine',.08,.3,.09);_t(784,'sine',.08,.3,.18);_t(1047,'sine',.22,.35,.27); },
    hint() { _t(880,'sine',.15,.18);_t(660,'sine',.15,.14,.1); },
    // Soft ascending sparkle — plays when an interstitial (tip/cheer) card appears.
    // Deliberately quieter/gentler than pop() so it reads as "reveal", not "correct".
    chime(){ _t(1318,'sine',.12,.18);_t(1568,'sine',.14,.16,.08);_t(2093,'sine',.2,.14,.16); },
    // BUG-FIX #122: called by foreground-resume listeners below
    resumeCtx(){ if(ctx&&ctx.state==='suspended')ctx.resume().catch(()=>{}); }
  };
})();



/* ─── HELPERS ─────────────────────────────────────────────── */
// Wrap kanji in <ruby> with hiragana reading as furigana
// If word === reading (pure kana), return plain word



// Smarter Furigana aligner for mixed kanji/kana words and sentences
/* ─── HELPERS ─────────────────────────────────────────────── */






// Parses custom tip syntax like {漢字|かんじ} into HTML ruby tags automatically
function parseTipRuby(text) {
  if (!text) return '';
  return text.replace(/\{([^|{}]+)\|([^|{}]+)\}/g, '<ruby>$1<rt>$2</rt></ruby>');
}

// BUG-12 FIX: extended jpRuby handles mixed kanji+katakana words (e.g. テレビ番組).
// Old splitter /([一-龯々]+)/ only broke on CJK, treating katakana as a kana-side segment.
// This caused rIdx misalignment: katakana length was consumed from the reading pointer
// but the reading for that stretch is katakana itself (not hiragana), so substring was off.
// New approach: split on ANY non-kana, non-kanji character gap; treat katakana runs as
// pass-through (no furigana needed — katakana is already readable).
function jpRuby(text, reading) {
  if (!text) return '';
  if (!reading || text === reading) return text;

  // Pure kanji block — wrap entire word with reading
  if (/^[一-龯々]+$/.test(text)) return `<ruby>${text}<rt>${reading}</rt></ruby>`;

  // BUG-FIX #352 (Jukujikun guard): words like 今日(きょう), 明日(あした), 今年(ことし)
  // have fused readings that cannot be split per-kanji block. Detect this by comparing
  // the number of kanji characters against the kana mora count in the reading — when the
  // reading mora count is LESS than the kanji count, no safe per-block split is possible.
  // Wrap the entire word as a single ruby rather than producing malformed partial furigana.
  const kanjiCount = (text.match(/[一-龯々]/g) || []).length;
  const kanaCount  = (reading.match(/[\u3040-\u30FF]/g) || []).length;
  if (kanjiCount > 0 && kanaCount < kanjiCount) {
    return `<ruby>${text}<rt>${reading}</rt></ruby>`;
  }

  // Split into alternating [non-kanji, kanji, non-kanji, kanji ...] chunks.
  // Non-kanji includes hiragana, katakana, Latin, punctuation — none need furigana.
  const parts = text.split(/([一-龯々]+)/);
  let out = '', rIdx = 0;

  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i];
    if (!chunk) continue;

    const isKanji = i % 2 !== 0; // odd indices are kanji (from the capture group)

    if (!isKanji) {
      // Pass-through segment (hiragana, katakana, CJK punctuation, Latin …)
      // Advance rIdx by counting how many reading chars correspond to this chunk.
      // For hiragana: reading chars match 1-to-1 with chunk chars.
      // For katakana: the reading is also katakana — advance by chunk length.
      // For CJK punctuation (、。「」『』・ etc.): sentence readings mirror this
      // punctuation verbatim at the same position, so it consumes a reading char too.
      // BUG-FIX (leading punctuation in next kanji's furigana): previously only kana
      // advanced rIdx, so a 、 here left rIdx one short — the next kanji block's <rt>
      // then silently absorbed that unconsumed 、 as a leading character.
      // For Latin/ASCII punctuation: no reading chars consumed.
      let advance = 0;
      for (const ch of chunk) {
        const cp = ch.codePointAt(0);
        const isKana = (cp >= 0x3040 && cp <= 0x30FF) || (cp >= 0xFF65 && cp <= 0xFF9F);
        const isJPPunct = (cp >= 0x3000 && cp <= 0x303F);
        if (isKana || isJPPunct) advance++;
        // Latin/ASCII punctuation do not consume reading chars
      }
      out += chunk;
      rIdx += advance;
    } else {
      // Kanji block — needs furigana.
      // DICTIONARY FIRST: if this exact chunk has a harvested reading (see
      // kanji_readings_ja.js), use it directly and skip position-search
      // entirely for this chunk — immune to alignment bugs by construction,
      // since there's no search/position math involved at all.
      const known = window.KanjiReadings && window.KanjiReadings[chunk];
      if (known) {
        out += `<ruby>${chunk}<rt>${known}</rt></ruby>`;
        rIdx += known.length;
        continue;
      }
      // Not in the dictionary yet — fall back to the existing search-based
      // alignment (unchanged behaviour, still covers every chunk today).
      const nextChunk = parts[i + 1] || '';
      if (nextChunk) {
        // Anchor: find the next chunk's start in the reading string by
        // searching for the next non-kanji segment's kana from rIdx.
        const nextKana = [...nextChunk].filter(ch => {
          const cp = ch.codePointAt(0);
          return (cp >= 0x3040 && cp <= 0x30FF) || (cp >= 0xFF65 && cp <= 0xFF9F);
        }).join('');

        if (nextKana) {
          const found = reading.indexOf(nextKana, rIdx);
          if (found !== -1) {
            out += `<ruby>${chunk}<rt>${reading.substring(rIdx, found)}</rt></ruby>`;
            rIdx = found;
          } else {
            out += `<ruby>${chunk}<rt>${reading.substring(rIdx)}</rt></ruby>`;
            rIdx = reading.length;
          }
        } else {
          // Next chunk has no kana (e.g. Latin punctuation) — consume remaining reading
          out += `<ruby>${chunk}<rt>${reading.substring(rIdx)}</rt></ruby>`;
          rIdx = reading.length;
        }
      } else {
        // Last segment — consume remainder of reading
        out += `<ruby>${chunk}<rt>${reading.substring(rIdx)}</rt></ruby>`;
        rIdx = reading.length;
      }
    }
  }
  return out;
}


// BUG-8 FIX: pipe-phrase words like "Hyvää|huomenta" must return full display form
// "Hyvää huomenta", not just the second token "huomenta". The old code did split('|')[1]
// which caused intro card to only bold the second word of every multi-word phrase.
function _cleanWord(w){
  if(!w)return '';
  w=w.replace(/\|/g,' ').replace(/[¿¡.,!?;:«»"]+$/,'').trim();
  // Strip leading articles for length-balance purposes in genMatchingSet.
  // "der Mann" → "Mann" (8→4), "die Frau" → "Frau", "das Kind" → "Kind",
  // "le chat" → "chat", "la maison" → "maison", "il cane" → "cane", "l'arbre" → "arbre"
  // This prevents German/French/Italian/Spanish nouns with articles being treated as
  // long words and excluded from matching sets alongside shorter bare-word entries.
  // Note: Italian 'i' (masc.pl. article) omitted — 1-char regex too risky (would strip 'I need' → 'need')
  w=w.replace(/^(der|die|das|den|dem|des|ein|eine|einen|einem|eines|le|la|les|l'|un|une|il|lo|gli|uno|una|el|los|las|the)\s+/i,'');
  return w;
}
function _cleanMeaning(m){if(!m)return '';return m.trim();}
function _getCoreWord(w){if(!w)return '';let c=w.includes('|')?w.replace(/\|/g,' '):w;return c.replace(/[¿¡.,!?;:«»"()]+$/,'').trim();}




function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=0|Math.random()*(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;}
function eid(id){return document.getElementById(id);}
function qsa(sel,root=document){return [...root.querySelectorAll(sel)];}
// BUG-16 FIX: dMean now deduplicates near-synonym meanings using the same _meaningKey
// normalizer as genMatchingSet (strips parentheticals, lowercases). Without this,
// at 3000+ words, synonyms like "large"/"big" or "to speak"/"to talk" appear as
// distractors against each other, making definition/spelling questions unfair.
function _dMeanKey(m){if(!m)return '';return m.replace(/\s*\(.*?\)/g,'').trim().toLowerCase();}
function dMean(r,bank,n=3,forbidden=null){
  const targetKey=_dMeanKey(r.meaning);
  const seen=new Set([targetKey]);
  const result=[];
  for(const x of shuffle(bank)){
    if(x.id===r.id)continue;
    if(forbidden&&forbidden.has(x.word))continue;
    const k=_dMeanKey(x.meaning);
    if(seen.has(k))continue;
    seen.add(k);
    result.push(x.meaning);
    if(result.length>=n)break;
  }
  return result;
}
// dWord excludes words that are valid inflected forms of the target (bug 6),
// AND excludes language-specific minimal pairs / homophones (bugs 4,8,36,38,40,
// 60,67,85,92,95,96,125,143) that would create ambiguous or unfair questions.
//
// MINIMAL PAIR MAPS — keyed by language:
// Each entry: [wordA, wordB] — these two should never appear as distractor for each other.
// Finnish: vowel-length minimal pairs (tuli/tuuli, tuli/tulli)
// French: accent pairs and homophones (ou/où, a/à, et/est, son/sont)
// Spanish: B/V homophones (basta/vasta, bello/vello, vino/bino)
// Italian: geminate pairs (pena/penna, nono/nonno, camino/cammino, capello/cappello)
// Hebrew: gender suffix pairs (גדול/גדולה — differ only by ה)
// Japanese: pitch-accent minimal pairs (橋/箸/端 all read hashi)
const MINIMAL_PAIRS = {
  finnish:[
    ['tuli','tuuli'],['tuli','tulli'],['tuuli','tulli'],
    ['tuli','tule'],['maa','maa'],['puu','pu'],
    ['kuusi','kuusi'],['koulu','koulu'],
  ],
  french:[
    ['ou','où'],['a','à'],['et','est'],['son','sont'],
    ['ces','ses'],['la','là'],['du','dû'],['sur','sûr'],
    ['ou','où'],['si','sì'],
  ],
  spanish:[
    ['basta','vasta'],['bello','vello'],['vino','bino'],
    ['tubo','tuvo'],['caza','casa'],['coser','cocer'],
    ['hola','ola'],['ora','hora'],['echo','hecho'],
    ['el','él'],['tu','tú'],['si','sí'],['se','sé'],['mas','más'],
  ],
  italian:[
    ['pena','penna'],['nono','nonno'],['camino','cammino'],
    ['capello','cappello'],['ano','anno'],['tono','tonno'],
    ['gli','li'],['ne','né'],
  ],
  hebrew:[],  // handled by genMatchingSet meaning dedup + length filter
  japanese:[
    ['橋','箸'],['箸','端'],['橋','端'],  // all read hashi
    ['雨','飴'],                           // both read ame
    ['切手','消手'],
  ],
  english_ielts:[
    ['there','their'],['there',"they're"],['their',"they're"],
    ['to','too'],['to','two'],['too','two'],
    ['wear','where'],['wear','were'],
    ['practice','practise'],
    ['affect','effect'],
    ['colour','color'],['behaviour','behavior'],
  ],
  german:[
    ['den','denn'],['den','dem'],['denn','dem'],
    ['seit','seid'],['das','dass'],['wider','wieder'],
    ['mehr','Meer'],['der','dir'],['wer','wir'],
    ['kennen','können'],['lehren','lernen'],
  ]
};

function _isMinimalPair(lang, wordA, wordB){
  const pairs=MINIMAL_PAIRS[lang]||[];
  const a=(wordA||'').toLowerCase().replace(/[¿¡.,!?]/g,'').trim();
  const b=(wordB||'').toLowerCase().replace(/[¿¡.,!?]/g,'').trim();
  return pairs.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
}

function dWord(r,bank,n=3){
  const targetForms=new Set([r.word,...(r.forms||[])].map(f=>f.toLowerCase()));
  return shuffle(bank.filter(x=>{
    if(x.id===r.id)return false;
    if(targetForms.has((x.word||'').toLowerCase()))return false;
    // Exclude minimal pairs / homophones so spelling/listening questions are unambiguous
    if(_isMinimalPair(r.lang,r.word,x.word))return false;
    return true;
  })).slice(0,n).map(x=>x.word);
}
function padArr(a,n,v='—'){const r=[...a];while(r.length<n)r.push(v);return r;}
