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
  // BUG-FIX (stale-language session build): `recs` only tells callers WHAT the current
  // records are, never WHICH language they belong to. Every non-language-switch caller of
  // startSession() (mode toggles, category/pool pickers, lesson nav, "Go" button — see
  // engine_session.js _doStartSession) reads Store.getAll() assuming it already matches
  // S.lang. During the async window while a language switch is still fetching its vocab
  // files, that assumption is false: getAll() still returns the PREVIOUS language's cached
  // array. _recsLang records which language `recs` actually holds right now so callers can
  // check before building a session against it. See isLoadedFor() below.
  let _recsLang = null;
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
    // Mark `recs` as belonging to langId now that it's fully built — the ONLY place this
    // is set. Any code that read Store.getAll() before this line for this load was reading
    // the previous language's data; isLoadedFor(langId) lets callers detect that.
    _recsLang = langId;
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
  // True only once `recs` has actually finished loading AND matches langId — false while
  // a switch to langId is still mid-flight (rules/forms/tips/batch files still fetching).
  function isLoadedFor(langId) { return _recsLang === langId; }
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
    // Defensive: comment above load() says the active language is never evicted here,
    // but if that guarantee is ever violated, isLoadedFor(langId) must not keep answering
    // true for data that was just deleted out from under it.
    if (_recsLang === langId) _recsLang = null;
  }

  return { load, unload, getAll, isLoadedFor, getById, getCats, count, getGroups, get phraseSet(){ return phraseSet; }, get tileTransBase(){ return tileTransBase; } };
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
    '2': old => old, // Existing per-word records remain valid; never discard a backup for missing schema metadata.
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


  // English confidence is bounded *in storage*, independent of lifetime totals.
  // Optional metadata lives alongside the old fields so existing progress/favorites survive.
  function _learn(c){
    if(!c.learn)c.learn={score:c.status==='mastered'?3:Math.max(-2,Math.min(2,(c.correct||0)-(c.wrong||0)))};
    return c.learn;
  }
  function touch(l,id,mode,sentence){
    if(l!=='english_ielts')return;
    const k=_k(l,id),c=db[k]||{status:'new',correct:0,wrong:0,seen:0};
    const learn=_learn(c);
    learn.lastSeen=Date.now();
    if(mode&&mode!=='matching')learn.lastMode=mode;
    if(sentence)learn.lastSentence=String(sentence).slice(0,1200);
    db[k]=c;_defer();
  }
  function rec(l,id,ok,evidence={}) {
    const k=_k(l,id), c=db[k]||{status:'new',correct:0,wrong:0,seen:0};
    const prevStatus=c.status||'new';
    if(l==='english_ielts')_learn(c);
    c.seen++; 
    ok ? c.correct++ : c.wrong++;

    let newStatus;
    if(l==='english_ielts'){
      const learn=c.learn,round=String(evidence.round||'');
      learn.lastSeen=Date.now();
      if(evidence.assisted)learn.assisted=(learn.assisted||0)+1;
      if(!ok && (!round||learn.errorRound!==round)){
        // A later mistake in the same round cancels that round's positive credit.
        if(round&&learn.creditRound===round&&learn.creditApplied)learn.score=Math.max(-2,learn.score-1);
        learn.score=Math.max(-2,learn.score-1);
        learn.errorRound=round;
      }else if(ok&&evidence.independent===true&&round&&learn.creditRound!==round&&learn.errorRound!==round){
        learn.creditApplied=learn.score<3;
        learn.score=Math.min(3,learn.score+1);
        learn.creditRound=round;
      }
      // One slip has a grace margin; repeated failures return a word to practice.
      newStatus=learn.score>=3||(prevStatus==='mastered'&&learn.score>=2)?'mastered':'unfamiliar';
    }else{
    const netScore = Math.max(-2, c.correct - c.wrong);
    if (netScore >= 3) {
      newStatus = 'mastered';
    } else if(prevStatus==='mastered'){
      // BUG-9 FIX: grace window — require net score to drop below 1 (not just below 3)
      // before demoting. One misclick or accidental tap won't demote a well-known word.
      newStatus = netScore >= 1 ? 'mastered' : 'unfamiliar';
    } else {
      newStatus = 'unfamiliar';
    }
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
        if(k.startsWith('english_ielts:')&&v.learn&&typeof v.learn==='object'&&!Array.isArray(v.learn)){
          const raw=v.learn,learn={score:Number.isFinite(raw.score)?Math.max(-2,Math.min(3,Math.trunc(raw.score))):(status==='mastered'?3:0)};
          if(Number.isFinite(raw.lastSeen)&&raw.lastSeen>=0)learn.lastSeen=Math.min(Date.now(),Math.floor(raw.lastSeen));
          if(Number.isFinite(raw.assisted)&&raw.assisted>=0)learn.assisted=Math.floor(raw.assisted);
          if(typeof raw.creditApplied==='boolean')learn.creditApplied=raw.creditApplied;
          for(const field of ['creditRound','errorRound','lastMode','lastSentence']){
            if(typeof raw[field]==='string')learn[field]=raw[field].slice(0,field==='lastSentence'?1200:80);
          }
          sanitized[k].learn=learn;
        }
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
  return { load, get, rec, touch, status, isFav, toggleFav, stats, reset, exportCode, importCode, saveLastSession, loadLastSession, setLangTotal, setLangCatalog };
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
  // The first A+B repair correctly stopped real word audio from starting while
  // WebKit was still finishing a volume-0 speechSynthesis utterance.  Its slow
  // side effect came from waiting for that utterance to finish naturally.  Keep
  // the same barrier, but settle the prime as soon as WebKit has actually started
  // it, cancel it, and wait for the terminal callback / observable idle state.
  let nativePrimeState = 'idle'; // idle | priming | ready | failed
  let nativePrimePromise = null;
  let nativePrimeUtterance = null;
  let nativePrimeTimer = null;
  let unlockPromise = null;
  let cancelMediaProbe = null;
  let pendingUnlockSay = null;
  let sourceTimer = null;
  let voiceReadyTimer = null;
  let speechStartTimer = null;
  let playToken = 0;
  let webUtterance = null;
  let activeEl = null; // fresh per-utterance Audio element currently playing/attempting real TTS content

  // Successful-source memory keeps an immediate replay on the source that actually
  // reached `playing`, rather than re-running the complete remote waterfall.
  const _lastGoodSource = new Map(); // key: `${lang}|${text}` -> {id, at}
  const GOOD_SOURCE_TTL_MS = 3 * 60 * 1000;

  // AUDIO-FAST-BOUNDED V3: remember per-word failures too. The previous code remembered
  // only success, so a missing MP3 or stalled host was retried on every replay; if all
  // URLs failed and native speech was used, nothing was remembered at all. Short TTLs
  // preserve recovery while preventing the same known-bad URL from delaying a session.
  const _failedSourceUntil = new Map(); // `${lang}|${text}|${sourceId}` -> expiry
  const MAX_FAILED_SOURCE_RECORDS = 500;
  // Both GB and US legacy catalogue URLs were independently verified as HTTP 404.
  // Keep this small evidence-based negative manifest so these exact cards never pay
  // even the bounded first-request dictionary probe. Runtime failures cover the rest.
  const LEGACY_DICT_MISSING = new Set(['municipality','longevity']);
  // The legacy analogical GB URL returns HTTP 200 but the recording does not
  // match the requested word (reported as "analogously", independently checked
  // against the text-to-speech recording). A successful HTTP response is not
  // evidence of a correct pronunciation. Bypass it in playback AND preloading.
  const LEGACY_DICT_MISMATCH = new Set(['analogical']);
  // Short, verified citation recordings. Keys include POS: noun/verb homographs
  // must never share a cache entry or silently reuse a different pronunciation.
  // Source URLs and audio hashes are retained with the validation evidence.
  // attribute (verb): https://www.oxfordlearnersdictionaries.com/definition/english/attribute_1
  // attribute (noun): https://www.oxfordlearnersdictionaries.com/definition/english/attribute_2
  // extract (noun): https://www.oxfordlearnersdictionaries.com/definition/english/extract_1
  // extract (verb): https://www.oxfordlearnersdictionaries.com/definition/english/extract_2
  // elaborate (adjective): https://www.oxfordlearnersdictionaries.com/definition/english/elaborate_1
  // elaborate (verb): https://www.oxfordlearnersdictionaries.com/definition/english/elaborate_2
  // conduct (verb): https://www.oxfordlearnersdictionaries.com/definition/english/conduct_1
  // analogical: previously verified Google citation audio; avoids the mislabeled legacy clip.
  const ENGLISH_RECORDINGS = {"attribute|verb":"data:audio/mpeg;base64,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FUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==","attribute|noun":"data:audio/mpeg;base64,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","extract|noun":"data:audio/mpeg;base64,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5dJEZFxBErDcJmHEin5fxAS6otFQcsEp5IiAXgYaMjsEqJHpbVeuGVjXD5StY9jMVx+odGTh1rCKOlTIlOH4Wt1R1dbHmiARziiiuSFSopNkiOiZDHZcqoIbKRX82nEKLNW3XTWFTJqhoQI5Mq2lU7ishRJbU73KTZpdAlhqK17ja/KNrwjqJZtAfQolUjttutKaIla2+pv10Y1A6YRiQ1Mv3fc8pUn0nuaya8q7TputmO1iLVp76uM2HtPdTSHxk6lMQU1F//ugxPWAINYPFQy9g8OAwaP9h6XwMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUpXuTXGOpEgmGRbMeqhs1mYp62VJGo69rKofcmWOE01G5caAV9G2jM09Mjd25M3JdEZA1qOK+dmW4U1a21mDYS/0rh2aiz6xiHWxMGbi2rAoHcmYncv1vfXFpWPyaPSCDU4LSZGenRdUCUnEUcSwTkp60qW9JycCMKSgCRbAidgRKg7ElZfmqnUZyiEIrh6AoqB8STwyhUrm3mXDJKiXel9bEuv31TRGV1tHpk5fElIOxVNSU+Y+c0ena4803FbLqTpuOWaLr1paZterKEqHFeJKNS9od/9XWMvY0ZSYy/9tYKAZkssWRMQU1FMy45OS41//ugxHiD3OH5D6wwfWgAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV","extract|verb":"data:audio/mpeg;base64,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qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjk5Lv/7osQEg8AAAaQAAAAgAAA0gAAABDWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkxBTUUzLjk5LjX/+6DEBQPAAAGkAAAAIAAANIAAAASqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqo=","elaborate|adjective":"data:audio/mpeg;base64,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qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqg==","elaborate|verb":"data:audio/mpeg;base64,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","conduct|verb":"data:audio/mpeg;base64,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4sq60P5wQp6dBJWnMBWHZanxsdSa1tqEp5bsNARMTVCV2snWhMqiOBD9YesQXqclIktHJ6IzbJficgXPluqGXWIFxwcvwMoPRPvLlJs1ihCPFpUSWNmkdYCYIbBMEFoUnwaagY3xlK4uREIWxHKS6M0KVSE/UyYX1BKhqgUc6uLsptrJbwvCnJmT9DTJ5/rk0x+kIJNFZTjLahAm4t4uqBOdVHAcwN1mHCW4WMuo/yWpyGjxFSwi4IsRAWkGwEYJUcbYL1sK//ugxP+AIYILGew9k0yDwaCk9j8pJoOQl5czCIIc5nogfZfxDkEmSxBDEUYJFIEWw2QVAasS4DGSEKUJaJ6inJbhzQIMAqyQikhFIVBFghBESwaTZqVET0KTUSIEgqZIhUFEgESSOXlgEJIoiiKOMS2iwDeVRyWuaSSdGSOVUznOJEki3z6NWLWr1Oq58rmb4fWth8rmaV7VhZcxYTNLM+sxPa6UxpKqC91h9O9q2oayyH6PSXElIuKVjVhQkiTknJcVmFtTMq8TpnNEto9Jkq18rmaE+hH8aRfhJQwTJiK5rXBxF9ZzReF+EKCRDiUSeLahLCcqwFUBCEyJcdyOocwkwDsCqBVEuLahJ+lxVqtVrAHEJqISP1lXAhRTBwgB0AHAOQ4i5FuRxPSwkyHpISegR4f0qdOU5RvA5hYkylBvDiOowRNlW4HMdRzEqE2QphZdEAFJyhIyMjIzyMjJv+RGRkZDAX/kZGR///8yMjI5ONOLKLMPdnZ2eL3///tU07OzlHGnCQI8w8wx2dna8mpZ2co1On8iUUkUgi04o2llYmtqhwGtuTx+opEpJJohFpxSNbEpVMuVwrz6JaQYkJRGyYBdy6FmOUcwwRZhkjQFnGAN862TL5hbmtwOIeoV1ubWqHAhwIUGFBklgQ4FN//4za0GFBklgQ4kW0GTNLyQWFibW5rbG9gf//ugxOOCIgYQ+KSZ9QLfwVCMEz/RjkxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV","analogical|adjective":"data:audio/mpeg;base64,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"}; // VERIFIED_ENGLISH_AUDIO
  function sayRecord(record,text,lang,rate=0.9,patient=true,onEnded=null){
    const sameWord=record&&lang==='en'&&_getCoreWord(text).toLowerCase()===_getCoreWord(record.word).toLowerCase();
    const candidate=sameWord?_getCoreWord(record.word).toLowerCase()+'|'+record.pos:null;
    const key=candidate&&ENGLISH_RECORDINGS[candidate]?candidate:null;
    say(text,lang,rate,patient,onEnded,null,Date.now(),key);
  }
  function _dictionaryEligible(text,lang){
    return lang==='en'&&/^[a-z]+$/i.test(text)&&!/(ing|ed|es|s)$/i.test(text)&&
      !LEGACY_DICT_MISSING.has(text.toLowerCase())&&!LEGACY_DICT_MISMATCH.has(text.toLowerCase());
  }
  function _failedSourceKey(wordKey,sourceId){return `${wordKey}|${sourceId}`;}
  function _sourceIsCooling(wordKey,sourceId,now=Date.now()){
    const key=_failedSourceKey(wordKey,sourceId);
    const until=_failedSourceUntil.get(key)||0;
    if(until<=now){if(until)_failedSourceUntil.delete(key);return false;}
    return true;
  }
  function _rememberSourceFailure(wordKey,sourceId,reason){
    let ttl=30*1000;
    if(reason==='timeout')ttl=90*1000;
    else if(reason==='source-error')ttl=sourceId.startsWith('dictionary-gstatic-')?30*60*1000:60*1000;
    _failedSourceUntil.set(_failedSourceKey(wordKey,sourceId),Date.now()+ttl);
    if(_failedSourceUntil.size>MAX_FAILED_SOURCE_RECORDS){
      const now=Date.now();
      for(const [key,until] of _failedSourceUntil){
        if(until<=now||_failedSourceUntil.size>MAX_FAILED_SOURCE_RECORDS)_failedSourceUntil.delete(key);
        if(_failedSourceUntil.size<=MAX_FAILED_SOURCE_RECORDS)break;
      }
    }
  }
  function _forgetSourceFailure(wordKey,sourceId){
    _failedSourceUntil.delete(_failedSourceKey(wordKey,sourceId));
  }

  // An impatient re-tap of the SAME word while the previous attempt is still mid-
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
    const synth=window.speechSynthesis;
    const requestedLang=lang||_activeTtsLang();
    if(!synth||typeof SpeechSynthesisUtterance==='undefined'){
      nativePrimeState='failed';
      return Promise.resolve(false);
    }
    if(nativePrimeState==='ready'&&nativePrimedLang===requestedLang)return Promise.resolve(true);
    if(nativePrimeState==='failed'&&nativePrimedLang===requestedLang)return Promise.resolve(false);
    if(nativePrimeState==='priming'&&nativePrimePromise)return nativePrimePromise;
    // If the browser exposes userActivation, never incorrectly mark an async attempt as
    // primed. Older Safari versions do not expose it, so they are allowed to try.
    if(navigator.userActivation&&navigator.userActivation.isActive===false)return Promise.resolve(false);

    nativePrimeState='priming';
    nativePrimedLang=requestedLang;
    const prime=new SpeechSynthesisUtterance('\u00a0');
    prime.lang=_nativeLocale(requestedLang);
    const voice=_findNativeVoice(requestedLang);
    if(voice)prime.voice=voice;
    prime.volume=0;
    prime.rate=10;
    nativePrimeUtterance=prime; // retain it; iOS may drop unreferenced utterances
    webUtterance=prime;

    let resolvePrime;
    let settled=false;
    let started=false;
    let cancelRequested=false;
    let cancelAt=0;
    let terminalSeen=false;
    let terminalOk=false;
    const beganAt=Date.now();
    const finish=ok=>{
      if(settled)return;
      settled=true;
      clearTimeout(nativePrimeTimer);
      nativePrimeTimer=null;
      prime.onstart=prime.onend=prime.onerror=null;
      nativePrimeUtterance=null;
      if(webUtterance===prime)webUtterance=null;
      nativeSpeechPrimed=!!ok;
      nativePrimeState=ok?'ready':'failed';
      const resolver=resolvePrime;
      nativePrimePromise=null;
      resolver?.(!!ok);
    };
    const requestCancel=()=>{
      if(cancelRequested||settled)return;
      cancelRequested=true;
      cancelAt=Date.now();
      try{synth.cancel();}catch(e){finish(false);}
    };
    const observe=()=>{
      if(settled)return;
      let speaking=false,pending=false;
      try{speaking=!!synth.speaking;pending=!!synth.pending;}catch(e){}
      // Some WebKit versions expose `speaking` a task earlier than onstart. `pending`
      // alone only proves it is queued, not that the native voice path really started.
      if(!started&&speaking)started=true;
      if(started&&!cancelRequested)requestCancel();
      // Do not wait for the silent utterance's natural duration. If WebKit has not
      // emitted onstart promptly, cancel the accepted/queued request after 180 ms.
      if(!cancelRequested&&Date.now()-beganAt>=180)requestCancel();
      // Terminal events are preferred. This idle fallback covers Safari builds that
      // omit an event on cancel: require an observable quiet period before opening the
      // real-audio gate, so the old cancel/play race cannot return.
      if(cancelRequested&&!speaking&&!pending&&Date.now()-cancelAt>=80){
        finish(terminalSeen?terminalOk:started);
        return;
      }
      nativePrimeTimer=setTimeout(observe,16);
    };
    prime.onstart=()=>{
      if(settled)return;
      started=true;
      requestCancel();
    };
    prime.onend=()=>{
      started=true; // onend itself proves WebKit accepted and processed the utterance
      terminalSeen=true;
      terminalOk=true;
    };
    prime.onerror=event=>{
      const reason=String(event&&event.error||'').toLowerCase();
      // canceled/interrupted after onstart is the expected fast-prime terminal state.
      terminalSeen=true;
      terminalOk=started&&reason!=='not-allowed';
    };
    nativePrimePromise=new Promise(resolve=>{resolvePrime=resolve;});
    try{synth.speak(prime);}
    catch(e){finish(false);return Promise.resolve(false);}
    nativePrimeTimer=setTimeout(observe,0);
    return nativePrimePromise||Promise.resolve(nativeSpeechPrimed);
  }

  function _probeHtmlMediaFromGesture(token){
    if(mediaUnlocked)return Promise.resolve(true);
    return new Promise(resolve=>{
      let settled=false;
      let sawPlaying=false;
      const finish=ok=>{
        if(settled)return;
        settled=true;
        clearTimeout(timeout);
        player.onplaying=player.onended=player.onerror=null;
        cancelMediaProbe=null;
        try{player.pause();player.currentTime=0;}catch(e){}
        if(ok){mediaUnlocked=true;needsGestureRecovery=false;}
        else if(token===playToken){mediaUnlocked=false;needsGestureRecovery=true;}
        resolve(!!ok);
      };
      cancelMediaProbe=()=>finish(false);
      player.onplaying=()=>{
        if(token!==playToken){finish(false);return;}
        sawPlaying=true;
        // `playing`, unlike play()'s promise, is proof that WebKit activated the
        // HTMLMedia output path. Pause immediately so it cannot overlap the word.
        finish(true);
      };
      player.onended=()=>finish(token===playToken&&sawPlaying);
      player.onerror=()=>finish(false);
      // The probe is an in-memory one-sample WAV. If it cannot actually reach
      // `playing` quickly, release the queue and let the real source attempt recovery.
      const timeout=setTimeout(()=>finish(false),300);
      player.src=SILENT_AUDIO;
      player.playbackRate=1;
      player.volume=1;
      player.load();
      try{
        const playResult=player.play();
        if(playResult&&typeof playResult.catch==='function')playResult.catch(()=>finish(false));
      }catch(e){finish(false);}
    });
  }

  function unlock(requestedLang) {
    const lang=requestedLang||_activeTtsLang();
    // Coalesce repeated Start/Continue taps. The first A+B repair proved that the word
    // must wait until both output paths have settled; this version keeps that invariant.
    if(unlockPromise)return unlockPromise;
    const nativeReady=nativePrimeState==='ready'&&nativePrimedLang===lang;
    if(mediaUnlocked&&nativeReady){needsGestureRecovery=false;return Promise.resolve(true);}
    stop();
    const token=playToken;
    const mediaReady=_probeHtmlMediaFromGesture(token);
    const nativeReadyPromise=_primeNativeSpeechFromGesture(lang);
    let gate;
    gate=Promise.all([mediaReady,nativeReadyPromise]).then(([mediaOk])=>mediaOk).finally(()=>{
      if(unlockPromise===gate)unlockPromise=null;
    });
    unlockPromise=gate;
    return gate;
  }

  function _cleanForPendingPreload(text,lang){
    text=String(text||'').replace(/\|/g,' ');
    if(lang==='ja')return text.replace(/[！？｡。、・「」『』【】〔〕…―〜]/g,c=>({
      '！':'!','？':'?','。':'.','、':',','…':'...','―':'-','〜':'~'
    }[c]||' ')).trim();
    if(lang==='he')return text.replace(/[!?.]/g,' ').replace(/\s+/g,' ').trim();
    return text.replace(/[!?.]/g,' ').trim();
  }

  // Start downloading the likely first source while the iOS readiness barrier settles.
  // This does not call play(), cannot produce sound, and is reused only if its URL is
  // still first when the real waterfall starts. Safari may ignore preload; that is safe.
  function _preloadPendingSource(text,lang,rate,recordingKey=null){
    try{
      const clean=_cleanForPendingPreload(text,lang);
      if(!clean)return null;
      const dictWorthy=_dictionaryEligible(clean,lang);
      let url;
      if(recordingKey&&ENGLISH_RECORDINGS[recordingKey]){
        url=ENGLISH_RECORDINGS[recordingKey];
      }else if(dictWorthy){
        const lower=clean.toLowerCase();
        const key=/^(con|aux|nul|prn)/.test(lower)?`x${lower}`:lower;
        url=`https://ssl.gstatic.com/dictionary/static/sounds/20200429/${key}--_gb_1.mp3`;
      }else{
        url=`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(clean)}`;
      }
      const el=new Audio(url);
      el.preload='auto';
      el.playbackRate=rate;
      try{el.load();}catch(e){}
      return {url,el,used:false};
    }catch(e){return null;}
  }

  function _discardPendingPreload(preloaded){
    if(!preloaded||preloaded.used)return;
    try{preloaded.el.pause();}catch(e){}
  }

  function cancelPending(){
    const pending=pendingUnlockSay;
    pendingUnlockSay=null;
    if(!pending)return false;
    _discardPendingPreload(pending.preloaded);
    return true;
  }

  // `patient` still distinguishes manual/card pronunciation from automatic listening
  // audio, but both paths now have a hard total remote-start budget below. No caller can
  // wait through an open-ended per-source chain before the already-primed native fallback.
  function say(text, lang, rate = 0.9, patient = true, onEnded = null, _preloaded = null, _requestedAt = Date.now(), _recordingKey = null) {
    // onEnded (optional): fires exactly once when THIS specific utterance's audio
    // truly finishes — successfully, or via total failure with nothing left to try.
    // Added for the character-tile "last letter" fix (see G_ctTap/G_ksTap in
    // engine_render.js) so callers can wait for the real finish instead of guessing
    // a fixed delay. Every existing call site omits it (defaults to null, a no-op)
    // and is completely unaffected.
    if (!text) { onEnded?.(); return; }
    // Automatic New Word / Listening audio may arrive while iOS readiness is settling.
    // Keep only the newest request. Its likely first URL begins preloading immediately,
    // so the native-prime barrier and network fetch overlap instead of adding together.
    if(unlockPromise){
      if(!patient) console.debug('[TTS-DEBUG] auto-play deferred, unlock still pending:',text);
      cancelPending();
      const pending={text,lang,rate,patient,onEnded,requestedAt:_requestedAt,recordingKey:_recordingKey,preloaded:_preloadPendingSource(text,lang,rate,_recordingKey)};
      pendingUnlockSay=pending;
      const gate=unlockPromise;
      gate.finally(()=>{
        if(pendingUnlockSay!==pending)return;
        pendingUnlockSay=null;
        say(pending.text,pending.lang,pending.rate,pending.patient,pending.onEnded,pending.preloaded,pending.requestedAt,pending.recordingKey);
      });
      return;
    }

    // Guard 2: near-instant duplicate tap on the same word — see module-level comment.
    // BUG-FIX (Aug 2026, per Noah): only suppress for patient=true (manual tap/preview/
    // replay) calls. patient=false is used exclusively by the two "audio IS the question
    // stimulus" listening auto-plays (loadQ / G_introDone in engine_session.js /
    // engine_render.js). A New Word intro card auto-plays the word at 400ms
    // (showIntroCard's _scheduleQueuedTTS); if the player tapped "Got it" within the next
    // 400ms, G_introDone's guaranteed replay of that SAME word was silently swallowed by
    // this guard — no audio played, and nothing else ran to unlock/retry it, so the
    // listening question looked stuck until a manual 🔊 tap. That's the "which TTS goes
    // first / eventually no one goes" symptom. patient=false calls now always go through.
    const wordKey = lang + '|' + text + (_recordingKey?'|'+_recordingKey:'');
    // A queued first play retains the instant at which the player/game requested it.
    // Measuring from the later gate-release time could wrongly swallow a legitimate
    // replay made shortly after the sound finally became audible.
    const _now = _requestedAt;
    if (patient && wordKey === _lastRequestKey && (_now - _lastRequestAt) < DUPLICATE_GUARD_MS){
      console.debug('[TTS-DEBUG] Guard 2 swallowed duplicate request:',text);
      onEnded?.();
      return;
    }
    if(!patient) console.debug('[TTS-DEBUG] guaranteed auto-play starting:',text);
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
    // utterance, so a Google failure applies only to the current word/sentence.
    const sources = [];
    if(_recordingKey&&ENGLISH_RECORDINGS[_recordingKey]){
      sources.push({id:'verified-recording',timeoutMs:500,url:ENGLISH_RECORDINGS[_recordingKey]});
    }

    // Only a plain alphabetic citation form may try the legacy dictionary catalogue.
    // A hyphenated compound such as "earth-shattering" is one JavaScript token, but it
    // is not one catalogue headword; treating it as one produced three known-bad URLs.
    const _isEnglishSingleToken = lang === 'en' && /^[a-z]+$/i.test(clean);
    const _dictWorthy = !_recordingKey&&_dictionaryEligible(clean,lang);

    // Oxford's legacy 20200429 audio catalogue escapes asset keys whose three-letter
    // shard would be a reserved DOS/Windows device name. For example, the real file is
    // `xcongestion--_gb_1.mp3`, not `congestion--_gb_1.mp3`. Without this transform,
    // every plain `con...` request 404s on both the GB and US dictionary sources.
    function _legacyOxfordAudioKey(word){
      const reservedShard = /^(con|aux|nul|prn)/.test(word);
      return reservedShard ? `x${word}` : word;
    }

    function _pushDictSources(){
      const lowerWord = clean.toLowerCase();
      const legacyOxfordKey = _legacyOxfordAudioKey(lowerWord);
      // A pronunciation that cannot BEGIN promptly is not useful in a game. Keep the
      // preferred GB human recording, retain US as a same-host fallback for a fast 404,
      // but never allow either candidate to hold the player for seven seconds.
      const dictTimeout = patient?650:500;
      sources.push({id:'dictionary-gstatic-gb',timeoutMs:dictTimeout,
        url:`https://ssl.gstatic.com/dictionary/static/sounds/20200429/${legacyOxfordKey}--_gb_1.mp3`});
      sources.push({id:'dictionary-gstatic-us',timeoutMs:dictTimeout,
        url:`https://ssl.gstatic.com/dictionary/static/sounds/20200429/${legacyOxfordKey}--_us_1.mp3`});
    }
    if (_dictWorthy) _pushDictSources();

    // Google remains the general source for phrases, inflections, compounds and every
    // non-English language. These are startup deadlines, not audio-duration limits.
    sources.push({
      id:'google-primary', timeoutMs: patient?1200:900,
      url:`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(clean)}`
    });

    sources.push({
      id:'google-backup', timeoutMs: patient?600:650,
      url:`https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=${lang}&q=${encodeURIComponent(clean)}`
    });

    // Removed: a blind `${word}-uk.mp3` Dictionary API guess. The API contract returns
    // an audio URL from a metadata lookup; it does not promise that every guessed UK
    // filename exists. That host was also the reproducible seven-second stall shared by
    // municipality/longevity/earth-shattering. Metadata may be prepared outside the
    // playback-critical path in a future verified-source manifest.

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
    const remoteBudgetMs=patient?2000:1600;
    const remoteDeadline=(Number.isFinite(_requestedAt)?_requestedAt:Date.now())+remoteBudgetMs;
    const skipSourceIds=new Set();
    TTS._sourceAttempts=[];
    TTS._skippedSources=[];
    TTS._remoteBudgetMs=remoteBudgetMs;
    TTS._budgetExhausted=false;
    TTS._lastRequestedLang=lang;
    TTS._lastSource=null;
    TTS._lastNativeVoice=null;
    TTS._lastFailure=null;
    // 3. Try URLs one by one until one works. FIX (v38): each attempt gets its OWN fresh
    // Audio element (matching the proven standalone-game pattern) instead of reassigning
    // .src on one shared element — see the module-level comment for why that was unreliable.
    function fallbackToNative(){
      if(_preloaded&&!_preloaded.used){
        _discardPendingPreload(_preloaded);
        _preloaded.used=true;
      }
      isPlaying = false;
      _speakWeb(text, lang, rate, token, onEnded);
    }
    function tryNextSource() {
      if(token!==playToken)return;
      while(currentSourceIndex<sources.length){
        const candidate=sources[currentSourceIndex];
        let reason='';
        if(skipSourceIds.has(candidate.id))reason='same-host-timeout';
        else if(_sourceIsCooling(wordKey,candidate.id))reason='recent-failure';
        if(!reason)break;
        TTS._skippedSources.push({id:candidate.id,reason});
        currentSourceIndex++;
      }
      if (currentSourceIndex >= sources.length) {
        // All web URLs failed (or user has no internet). Use robotic native voice, silently
        // — no user-facing toast. (Removed Aug 2026: was a temp debug message, its job is
        // done. TTS._sourceAttempts/_lastFailure/_lastSource are still updated above/below
        // for anyone checking from devtools, just no longer surfaced to the player.)
        fallbackToNative();
        return;
      }
      const remainingBudget=remoteDeadline-Date.now();
      if(remainingBudget<=0){
        TTS._budgetExhausted=true;
        for(let i=currentSourceIndex;i<sources.length;i++){
          TTS._skippedSources.push({id:sources[i].id,reason:'budget-exhausted'});
        }
        fallbackToNative();
        return;
      }

      const source=sources[currentSourceIndex];
      TTS._sourceAttempts.push(source.id);
      // Reuse the muted/non-playing preload created while the readiness barrier ran,
      // but only when it is still this exact first source. Every other attempt keeps
      // the original fresh-element behavior.
      let el;
      if(_preloaded&&!_preloaded.used&&_preloaded.url===source.url){
        el=_preloaded.el;
        _preloaded.used=true;
      }else{
        if(_preloaded&&!_preloaded.used){
          _discardPendingPreload(_preloaded);
          _preloaded.used=true;
        }
        el=new Audio(source.url); // fresh element per attempt — no shared .src mutation
      }
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
          _speakWeb(text,lang,rate,token,onEnded);
          return;
        }

        _rememberSourceFailure(wordKey,source.id,reason);
        const remembered=_lastGoodSource.get(wordKey);
        if(remembered&&remembered.id===source.id)_lastGoodSource.delete(wordKey);
        // GB and US live on the same gstatic host. If one request did not return at all,
        // immediately trying the alternate accent is the same poisoned experiment twice.
        // A fast onerror/404 still permits the alternate file, because only that asset
        // may be absent while the host itself is healthy.
        if(reason==='timeout'&&source.id.startsWith('dictionary-gstatic-')){
          skipSourceIds.add('dictionary-gstatic-gb');
          skipSourceIds.add('dictionary-gstatic-us');
          const alternate=source.id==='dictionary-gstatic-gb'?'dictionary-gstatic-us':'dictionary-gstatic-gb';
          _rememberSourceFailure(wordKey,alternate,'timeout');
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
        _forgetSourceFailure(wordKey,source.id);
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
        onEnded?.();
      };

      // If this specific URL fails (404 error, or Google block), try the next one instantly
      el.onerror = ()=>failOnce('source-error');

      // Play it!
      sourceTimer=setTimeout(()=>failOnce('timeout'),Math.max(1,Math.min(source.timeoutMs||remainingBudget,remainingBudget)));
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
    cancelPending();
    // Detach any old readiness gate immediately. Its own callbacks may still settle,
    // but a new trusted tap must be able to start a fresh media probe instead of being
    // coalesced onto a probe that this stop is about to cancel.
    unlockPromise=null;
    playToken++;
    clearTimeout(sourceTimer);
    clearTimeout(voiceReadyTimer);
    clearTimeout(speechStartTimer);
    sourceTimer=null;
    voiceReadyTimer=null;
    speechStartTimer=null;
    if(cancelMediaProbe){
      const cancel=cancelMediaProbe;
      cancelMediaProbe=null;
      try{cancel();}catch(e){}
    }
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

  function _speakWeb(text, lang, rate, token, onEnded) {
    if (!window.speechSynthesis) {
      isPlaying=false;
      _releaseListeningAfterAudioFailure();
      onEnded?.();
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
        onEnded?.();
      };
      u.onerror = event => {
        if(token!==playToken)return;
        clearTimeout(speechStartTimer);
        speechStartTimer=null;
        webUtterance=null;
        isPlaying=false;
        TTS._lastFailure={source:'ios-native',reason:'speech-error',name:event&&event.error||'',at:Date.now()};
        _releaseListeningAfterAudioFailure();
        onEnded?.();
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
          onEnded?.();
        },3000);
      }catch(e){
        webUtterance=null;
        isPlaying=false;
        TTS._lastFailure={source:'ios-native',reason:'speak-error',name:e&&e.name||'',at:Date.now()};
        _releaseListeningAfterAudioFailure();
        onEnded?.();
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
      onEnded?.();
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
      nativePrimeState,
      preparationPending:!!unlockPromise,
      queuedSpeech:pendingUnlockSay?{
        text:pendingUnlockSay.text,
        lang:pendingUnlockSay.lang,
        patient:pendingUnlockSay.patient,
        preloading:!!pendingUnlockSay.preloaded
      }:null,
      lastRequestedLang:TTS._lastRequestedLang||null,
      attemptedSources:[...(TTS._sourceAttempts||[])],
      skippedSources:[...(TTS._skippedSources||[])],
      remoteBudgetMs:TTS._remoteBudgetMs||null,
      budgetExhausted:!!TTS._budgetExhausted,
      lastSource:TTS._lastSource||null,
      lastNativeVoice:TTS._lastNativeVoice||null,
      lastFailure:TTS._lastFailure||null
    };
  }
  return { say, sayRecord, stop, unlock, cancelPending, recoverFromGesture, diagnostics, resetIfStuck };
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

  // BUG-FIX (Aug 2026, per Noah): the click tone above is a Web Audio oscillator —
  // a SEPARATE audio pathway from TTS's <audio>/speechSynthesis playback. On phones,
  // whichever one of those two pathways the OS currently favors can silently swallow
  // the other; in practice the still-playing TTS audio was winning, so the click went
  // silent instead of layering on top of it. This is a second, independent playback
  // path for the SAME click sound — a tiny pre-rendered WAV (1100Hz, 60ms, same pitch/
  // length as the oscillator tone above) played through a real <audio> element, i.e.
  // the same kind of pathway TTS itself uses. It is fired ALONGSIDE the oscillator,
  // never instead of it, and never touches TTS.stop()/TTS state at all — so on a device
  // where the oscillator alone was getting swallowed, this element has an independent
  // chance to still be heard, and on a device where the oscillator was already fine,
  // both are the same short tone landing together. Wrapped in try/catch and a swallowed
  // .catch() because this is a bonus channel — if it can't play for any reason, the
  // oscillator above already covers the sound as it always has.
  const CLICK_BEEP_WAV='data:audio/wav;base64,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';
  function _playClickBeepEl(){
    try{
      const a=new Audio(CLICK_BEEP_WAV);
      const p=a.play();
      if(p&&typeof p.catch==='function')p.catch(()=>{});
    }catch(e){}
  }

  return {
    pop()  { _t(523,'sine',.1,.3);_t(784,'sine',.1,.25,.06);_t(1047,'sine',.1,.2,.12); },
    // Wrong-answer UI and audio are sufficient; the optional mascot stays neutral.
    wrong(){ _n(.06,.18);_t(160,'sawtooth',.15,.2,.02); },
    // Was .04s/.12 vol — bumped slightly, it was very easy to miss on a phone speaker.
    // Also fires _playClickBeepEl() alongside — see comment above CLICK_BEEP_WAV.
    // BUG-FIX (Aug 2026, per Noah): every SFX.click() call site (G_speakNow, etc.) speaks
    // a TTS word immediately afterward. Starting the click-beep <audio> element and the
    // TTS <audio> element in the exact same tick let mobile OS audio-session ducking kick
    // in on whichever one lost the race — observed as the dictionary TTS clip playing
    // quieter with its first 1-2 syllables cut ("confident" -> "fident"). The oscillator
    // still fires instantly for tactile feedback (separate WebAudio pathway, no <audio>
    // element, doesn't compete); the bonus/rescue <audio> click is nudged ~80ms later by
    // default so the TTS element gets an uncontested head start on the audio pipeline.
    // UPDATE (Aug 19 2026, per Noah): the listening-question "sometimes doesn't auto-play"
    // report persisted after the Guard-2 fix below. G_next()/G_skip() also call
    // SFX.click() immediately before the NEXT question's TTS.say() — a much higher-traffic
    // collision than the New-Word-intro case Guard 2 covers, since it fires on every
    // ordinary "Next"/"Skip" tap into a listening question, not just new words. A delay
    // may not always be enough on a slow/contended device, so those two call sites now
    // pass skipBonus=true and drop the <audio>-element channel entirely rather than race
    // it — the oscillator alone still gives tactile click feedback there.
    click(skipBonus){ _t(1100,'sine',.06,.2); if(!skipBonus) setTimeout(_playClickBeepEl,80); },
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
