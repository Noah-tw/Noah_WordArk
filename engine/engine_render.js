function showIntroCard(q){
  const area=eid('q-area');if(!area)return;
  if(window.Mascot) Mascot.onQuestion(S.lang,q);
  const lc=getLc();
  const isJP=lc.type==='japanese';
  const isIELTS=lc.type==='ielts';

  // Get the raw record from Store for full data
  const r=Store.getById(S.lang, q.wordId);
  if(!r){renderQ(q);return;} // fallback if no record

  const word=r.word;
  const reading=isJP&&r.reading&&r.word!==r.reading?r.reading:null;
  const romaji=r.romaji||null;
  const meaning=r.meaning||'';
  const ipa=r.ipa||'';
  // FIX (Hebrew showed romaji + IPA as two separate lines): dictionary convention —
  // romaji as the primary reading, IPA as a parenthetical detail on the same line,
  // e.g. "melekh (ˈmɛlɛχ)". IELTS keeps ipa in its own spot below (next to pos),
  // so it's excluded here.
  // FIX: the parens-around-ipa formatting only makes sense when it's paired with
  // romaji on the same line — a language with IPA but no romaji (French/Spanish/
  // etc. entries that give a tricky-pronunciation IPA but no separate romanization)
  // was rendering as an orphaned "(ipa)" with nothing in front of it. Bare IPA now
  // renders plain, no parens; the Hebrew romaji+ipa case is unchanged.
  const pron = isIELTS ? '' : (romaji && ipa) ? `${romaji} (${ipa})` : (romaji || ipa || '');
  const sentence=(isJP?(r.sentence1_reading||r.sentence1):r.sentence1)||'';

  // Build all available sentences as carousel slides
  function _hlWord(sent, w){
    if(!sent||!w)return sent||'';
    const allForms=[_getCoreWord(w),...(r.forms||[]).map(f=>_getCoreWord(f))]
      .filter(Boolean).filter((f,i,a)=>f.length>0&&a.indexOf(f)===i);
    // BUG-FIX: guard against empty alts to prevent broken regex
    if(!allForms.length) return sent;
    const alts=allForms.map(f=>f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
    return sent.replace(new RegExp('('+alts+')','gi'),'<b>$1</b>');
  }


  function _buildSlide(sent, sentReading, sentEn, sentHl){
    if(!sent)return null;
    let hl;
    // BUG-14 FIX: sentence1_hl is the only authored highlight field in the schema.
    // For s2/s3 we use _hlWord regex for ALL languages (not just non-IELTS).
    // Previously IELTS s2/s3 received null for sentHl but also fell through to _hlWord,
    // so behaviour was already correct — made explicit here for clarity.
    if(sentHl){ hl=sentHl; }
    else if(isJP&&sentReading){ hl=_hlWord(jpRuby(sent,sentReading),r.word); }
    else { hl=_hlWord(sent,r.word); }
    const ttsStr=isJP?(sentReading||sent):sent;
    return {hl, en:sentEn||'', tts:ttsStr};
  }
  const introSlides=[
    // BUG-14: pass sentence1_hl for all languages (not just IELTS) — it is the
    // carefully authored highlight for slide 1. Slides 2 and 3 use _hlWord fallback.
    _buildSlide(r.sentence1, r.sentence1_reading, r.sentence1_en, r.sentence1_hl||null),
    _buildSlide(r.sentence2, r.sentence2_reading, r.sentence2_en, null),
    _buildSlide(r.sentence3, r.sentence3_reading, r.sentence3_en, null),
  ].filter(Boolean);
  // Store slides on q for the next-button handler
  q._introSlides=introSlides;
  q._introSlideIdx=0;

  // First slide shown on load
  const firstSlide=introSlides[0]||null;
  const sentenceHl=firstSlide?firstSlide.hl:'';
  const sentenceEn=firstSlide?firstSlide.en:'';



 const zh=r.zh||'';
  const zh_def=r.zh_def||'';
  const pos=r.pos||'';
  const definition=r.definition||'';
  const tts=isJP?(r.reading||r.word):r.word;
  const rtl=lc.rtl?' dir="rtl"':'';

  const wordHtml=(isJP&&reading)?jpRuby(word,reading):word;

  // Cleaner UI layout for IELTS definitions vs other languages
  const dictHtml = isIELTS ? `
    <div class="intro-dict">
      <div class="intro-dict-en">${meaning}</div>
      ${definition ? `<div class="intro-dict-def">${definition}</div>` : ''}
      ${zh ? `
        <div class="intro-dict-zh">
          <span class="intro-dict-zh-word">${zh}</span>
          ${zh_def ? `<span class="intro-dict-zh-sep">—</span><span class="intro-dict-zh-def">${zh_def}</span>` : ''}
        </div>
      ` : ''}
    </div>
  ` : `
    ${meaning?`<div class="intro-meaning">${meaning}</div>`:''}
    ${zh?`<div class="intro-zh">
      <span class="intro-zh-word">${zh}</span>
      ${zh_def?`<span class="intro-zh-sep">—</span><span class="intro-zh-def">${zh_def}</span>`:''}
    </div>`:''}
  `;

  area.innerHTML=`<div class="intro-card">
    <div class="intro-badge">✨ New Word</div>
    ${sentenceHl?`<div class="intro-sent-wrap">
      <div class="intro-sent-block">
        <div class="intro-sent-box"${rtl}>
          <div class="intro-sent-nav">
            <button class="intro-sent-tts" id="intro-sent-tts-btn" data-tts="${(firstSlide?.tts||sentence).replace(/"/g,'&quot;')}" data-lang="${lc.ttsLang}" onclick="G_playSentTts(this)">🔊</button>
            ${introSlides.length>1?`<span class="intro-sent-dots" id="intro-sent-dots">${introSlides.map((_,i)=>`<span class="intro-sent-dot${i===0?' on':''}"></span>`).join('')}</span>
            <button class="intro-sent-next" onclick="G_introNextSent()">next</button>`:''}
          </div>
          <div class="intro-sent ${isIELTS?'ielts-highlight':''}"${rtl} id="intro-sent-text">${sentenceHl}</div>
          <div class="intro-sent-en" id="intro-sent-en">${sentenceEn||''}</div>
        </div>
      </div>
    </div>`:''}
    <div class="intro-word-row">
      <div class="intro-word"${rtl}>${wordHtml}</div>
      <button class="intro-tts" onclick="G_introSpeak()">🔊</button>
    </div>
    ${pron?`<div class="intro-romaji" style="${S.romaji?'':'display:none'}">${pron}</div>`:''}
    ${isIELTS?`
      <div class="intro-meta">
        ${ipa?`<span class="intro-ipa">${ipa}</span>`:''}
        ${pos?`<span class="ielts-pos">${pos}</span>`:''}
      </div>
      <div class="intro-dict intro-dict-tight">
        <div class="intro-dict-en">${meaning}</div>
        ${zh?`<div class="intro-dict-zh-inline">
          <span class="intro-dict-zh-word">${zh}</span>
          ${zh_def?`<span class="intro-dict-zh-sep"> — </span><span class="intro-dict-zh-def">${zh_def}</span>`:''}
        </div>`:''}
      </div>
    `:`
      ${dictHtml}
    `}
    ${r.tip?`<div class="intro-tip">💬 <bdi dir="ltr">${parseTipRuby(r.tip)}</bdi></div>`:''}
  </div>`;

  // Store tts on q for G_introSpeak
  q._introTts=tts;

  // Auto-play — use _qTtsTimer so G_introDone can cancel this if tapped within 400ms.
  _scheduleQueuedTTS(()=>TTS.say(tts,lc.ttsLang,0.85),400);

  // Repurpose btn-next as Got it button
  const btnNext=eid('btn-next');
  const btnSkip=eid('btn-skip');
  const btnHint=eid('btn-hint');
  if(btnNext){btnNext.textContent='Got it →';btnNext.onclick=G_introDone;btnNext.style.display='flex';btnNext.classList.add('btn-next-blue');}
  if(btnSkip)btnSkip.style.display='none';
  if(btnHint)btnHint.style.display='none';
}
function G_introSpeak(){
  SFX.click();
  _cancelQueuedTTS(); // manual replay wins; do not let the pending auto-play cut it off
  const q=S.q;if(!q)return;
  const tts=q._introTts||q.tts;
  if(tts) TTS.say(tts,LC[S.lang].ttsLang,0.85);
}

function G_introNextSent(){
  SFX.click();
  const q=S.q;if(!q||!q._introSlides)return;
  const slides=q._introSlides;
  q._introSlideIdx=(q._introSlideIdx+1)%slides.length;
  const slide=slides[q._introSlideIdx];
  const lc=getLc();
  const sentEl=eid('intro-sent-text');
  const enEl=eid('intro-sent-en');
  const ttsBtn=eid('intro-sent-tts-btn');
  const dotsEl=eid('intro-sent-dots');
  if(sentEl) sentEl.innerHTML=slide.hl;
  if(enEl)   enEl.textContent=slide.en||'';
  if(ttsBtn){ ttsBtn.dataset.tts=slide.tts; ttsBtn.dataset.lang=lc.ttsLang; }
  if(dotsEl){
    dotsEl.querySelectorAll('.intro-sent-dot').forEach((d,i)=>{
      d.classList.toggle('on',i===q._introSlideIdx);
    });
  }
  // Auto-play the new sentence
  _cancelQueuedTTS();
  TTS.say(slide.tts,lc.ttsLang,0.85);
}

function G_introDone(){
  SFX.click();
  // BUG FIX (double TTS on fast tap): cancel any pending intro TTS timer first.
  // showIntroCard() schedules a 400ms auto-play; if the player taps "Got it" before
  // 400ms elapses, the old timer fires AFTER renderQ() schedules its own TTS,
  // causing the word to play twice. Cancelling here ensures only one audio plays.
  _cancelQueuedTTS();
  // Restore btn-next to normal behavior
  const btnNext=eid('btn-next');
  const btnHint=eid('btn-hint');
  if(btnNext){btnNext.textContent='Next →';btnNext.onclick=G_next;btnNext.style.display='none';btnNext.classList.remove('btn-next-blue');}
  if(btnHint)btnHint.style.display='flex';
  eid('btn-skip').style.display='flex';
  const q=S.q;
  renderQ(q);
  // Only auto-play for listening modes, where the audio IS the question stimulus
  // and must play again now that the question card is visible.
  // BUG-FIX (silent auto-play): call synchronously, inside this "Got it" tap, instead
  // of via setTimeout — see matching fix + comment in engine_session.js loadQ().
  if(q.tts && (q.mode==='listeningWord'||q.mode==='listeningSentence')){
    TTS.say(q.tts,LC[S.lang].ttsLang,0.85,false);
  }
}

/* ─── RENDERER ────────────────────────────────────────────── */
function getLc(){return LC[S.lang];}
function toast(msg, duration){
  const el=eid('toast');if(!el)return;
  el.textContent=msg;el.classList.add('on');
  // BUG-FIX: honour optional duration so storage warnings (8000ms) and
  // syntax error alerts have enough time to be read. Default stays 3000ms.
  setTimeout(()=>el.classList.remove('on'), duration||3000);
}
function renderProg(){
  _updateGameStrip();
}

// ── IELTS context-first card ──────────────────────────────
function ieltsCardHtml(q){
  const sentHl=q.sentence1_hl||q.sentence1||'';
  const posLabel=q.pos?`<span class="ielts-pos">${q.pos}</span>`:'';
  const ipaLabel=q.displayHint?`<span class="ielts-ipa">${q.displayHint}</span>`:'';
  // Chinese translation row: 影響 — 對某情況或人產生的強烈效果
  const zhLine=(q.zh&&q.zh_def)
    ?`<div class="ielts-zh"><span class="ielts-zh-word">${q.zh}</span><span class="ielts-zh-sep">—</span><span class="ielts-zh-def">${q.zh_def}</span></div>`
    :q.zh?`<div class="ielts-zh"><span class="ielts-zh-word">${q.zh}</span></div>`:'';
  const defBlock=q.definition?`
    <button class="ielts-def-toggle" onclick="G_ieltsToggleDef(this)">💡 Show definition ▾</button>
    <div class="ielts-def-body">
      <div class="ielts-def-text">${q.definition}</div>
      <div class="ielts-meaning-pill">${q.answer||''}</div>
    </div>`:'';
  const sentTts=(q.sentence1||'').replace(/"/g,'&quot;');
  return `<div class="wcard ielts-card">
    <div class="ielts-context">
      <div class="ielts-sent">${sentHl}</div>
      <button class="ielts-sent-tts" data-tts="${sentTts}" data-lang="en" onclick="G_playSentTts(this)">🔊</button>
    </div>
    <div class="ielts-word-row">
      <div>
        <div class="ielts-word">${q.displayWord||''}</div>
        <div class="ielts-sub">${ipaLabel}${posLabel}</div>
        ${zhLine}
      </div>
      <button class="wc-tts" onclick="G_speakNow()">🔊</button>
    </div>
    ${defBlock}
  </div>`;
}
function G_ieltsToggleDef(btn){
  SFX.click();
  const body=btn.nextElementSibling;
  const open=body.classList.toggle('open');
  btn.textContent=open?'💡 Hide definition ▴':'💡 Show definition ▾';
}

// ── Word card ──────────────────────────────────────────────
function wordCardHtml(q){
  const lc=getLc();
  const isListen=q.mode==='listening';
  const isReading=q.mode==='reading';
  const label=MODE_LABELS[q.mode]||q.mode;
  const isSpelling=q.mode==='spelling';
  // Spelling: show the WORD big — you see "Hola" and pick from [hoya][hoka][hola]


  const display = _cleanWord(q.displayWord);
  const primary=(lc.type==='japanese'&&q.displayReading)
    ?jpRuby(display,q.displayReading)
    :display;



  const rtl=lc.rtl?' dir="rtl"':'';

  // ── Pronunciation line (IPA / romaji / transliteration) ──
  let pronLine='';
  if(lc.type==='japanese'||lc.rtl){
    // Japanese: only show romaji if toggle is ON
    const romaji=q.meta?.romaji||'';
    if(romaji&&(lc.type!=='japanese'||S.romaji)) pronLine=romaji;
  } else {
    // Definition: displayHint is IPA — show it
    // Spelling: displayHint is meaning (already shown) — use displayIpa instead
    if(q.mode==='definition'&&q.displayHint) pronLine=q.displayHint;
    else if(q.mode==='spelling'&&q.displayIpa) pronLine=q.displayIpa;
  }

  // ── Meaning sub-label ──
  let meaningLine='';
  if(lc.type==='japanese'){
    // Show meaning on definition AND reading — learning aid for both
    if((q.mode==='definition'||q.mode==='reading')&&q.answer){
      meaningLine=`<div class="wc-meaning">${q.answer}</div>`;
    }
  } else {
    if((q.mode==='definition'||q.mode==='spelling')&&q.answer){
      meaningLine=`<div class="wc-meaning">${q.mode==='spelling'?q.displayHint:q.answer}</div>`;
    }
  }

  // kanjiLine kept for any legacy use — ruby handles JP display now
  const readingLine='';
  const kanjiLine=q.displayKanji
    ?`<div class="wc-kanji">${q.displayKanji}</div>`:'';

  // Romaji is always shown for Japanese — no toggle needed
  const romajiBtn='';

  // ── Collapsible example sentence ──
  const hasSent=q.sentence1&&(q.mode==='definition'||q.mode==='listening'||q.mode==='reading');
  const sentTts=lc.type==='japanese'?(q.sentence1_reading||q.sentence1):q.sentence1;
  const sentDisplay=lc.type==='japanese'&&q.sentence1_reading?jpRuby(q.sentence1,q.sentence1_reading):q.sentence1;
  const sentBlock=hasSent?`
    <div class="wc-sent-row">
      <button class="wc-sent-toggle" onclick="G_toggleSent(this)" aria-expanded="false">📖 Example</button>
      <div class="wc-sent-body">
        <div class="wc-sent-content">
          <div class="wc-sent-text"${rtl}>${sentDisplay}</div>
          ${q.sentence1_en?`<div class="wc-sent-en">${q.sentence1_en}</div>`:''}
        </div>
        <button class="wc-sent-tts" data-tts="${(sentTts||'').replace(/"/g,'&quot;')}" data-lang="${lc.ttsLang}" onclick="G_playSentTts(this)" title="Play sentence">🔊</button>
      </div>
    </div>`:'';

  return `<div class="wcard">
    <div class="wc-top">
      <span class="wc-badge">${isListen?'🎧 '+label:label}</span>${romajiBtn}
      <button class="wc-tts" onclick="G_speakNow()">🔊</button>
    </div>
    <div class="wc-word"${rtl}${lc.type==='japanese'?' lang="ja"':''}>${lc.rtl?`<bdi dir="rtl">${primary}</bdi>`:primary}</div>
    ${kanjiLine}
    ${readingLine}
    ${pronLine?`<div class="wc-pron"${rtl}>${pronLine}</div>`:''}
    ${meaningLine}
    ${sentBlock}
  </div>`;
}

// Spelling uses wordCardHtml — it already handles isSpelling flag internally
function spellingCardHtml(q){ return wordCardHtml(q); }

// ── MC options — optionally show translation under each option ──────
function mcHtml(options, q){


  const meanings=q?.optMeanings||{};
  const lc=getLc();
  
  // Spelling: hide sub normally — meaning already on card
  let showSub=q?.mode!=='spelling'&&q?.mode!=='definition'
    ||(q?.mode==='spelling'&&lc.rtl);
    
  // Hide translation sub-label for English IELTS listening and blank modes
  if(lc.type==='ielts' && (q?.mode==='listeningWord' || q?.mode==='blank')){
    showSub = false;
  }
  
  // RTL script sizing only for spelling — definition options are English meanings
  const scriptMode=q?.mode==='spelling'&&lc.rtl;
  
  options=options.filter(o=>o&&o!=='—');

  // listeningWord: lock MC buttons until TTS has played at least once.
  // Prevents answering before hearing — which silently corrupts SRS data.
  const isListenWord=q?.mode==='listeningWord';

  return `<div class="mc-opts" id="mc-opts-wrap">`+options.map((o,i)=>{
    const e=encodeURIComponent(o);
    const m=meanings[o]||'';
    // BUG-FIX #346 (bidi isolation): meaning strings for Hebrew entries often contain
    // Hebrew script inside an English sentence (e.g. 'the house (הבית)').
    // Without <bdi>, the browser's bidi algorithm can mirror surrounding parentheses/
    // punctuation. Wrapping in <bdi> isolates the directionality of this inline segment.
    const sub=(showSub&&m)?`<span class="mc-sub"><bdi>${m}</bdi></span>`:'';
    const rtlAttr=scriptMode?' dir="rtl"':'';
    const langAttr=lc.type==='japanese'?' lang="ja"':'';
    const isMeaningOption=q?.mode==='definition';
    const displayOption=isMeaningOption?o.trim():_cleanWord(o);
    const lockCls=isListenWord?' mc-locked':'';
    const lockDisabled=isListenWord?' disabled':'';
    return `<button class="mc-opt${lockCls}"${lockDisabled} data-a="${e}" onclick="G_onMC(this)">
      <span class="mc-l">${String.fromCharCode(65+i)}</span>
      <div class="mc-body"><span class="mc-t mc-t-script"${rtlAttr}${langAttr}><bdi>${displayOption}</bdi></span>${sub}</div></button>`;
  }).join('')+`</div>`;
}



// ── Sentence tiles card ────────────────────────────────────
// Shows: full foreign sentence + English translation below
function sentenceTilesCardHtml(q){
  const lc=getLc();
  const rtl=lc.rtl?' dir="rtl"':'';
  const foreignSent=q.sentence1||'';
  const engSent=q.sentence1_en||'';
  return `<div class="wcard">
    <div class="wc-top">
      <span class="wc-badge">Sentence Tiles</span>
      <button class="wc-tts" onclick="G_speakNow()">🔊</button>
    </div>
    <div class="st-foreign"${rtl}>${foreignSent}</div>
    ${engSent?`<div class="st-english">${engSent}</div>`:''}
  </div>`;
}

// ── Blank card ────────────────────────────────────────────
function blankCardHtml(q){
  const lc=getLc();
  const rtl=lc.rtl?' dir="rtl"':'';
  // For IELTS sentence1 = sentence1_en (both English) — don't show the translation twice
  const engLine=(q.sentenceEn&&lc.type!=='ielts')
    ?`<div class="blank-eng">${q.sentenceEn}</div>`:'';
  return `<div class="wcard">
    <div class="wc-top">
      <span class="wc-badge">Fill the Blank</span>
      <button class="wc-tts" onclick="G_speakNow()">🔊</button>
    </div>
    ${engLine}
    <div class="blank-box"${rtl}>${q.sentenceDisplay}</div>
  </div>`;
}

// ── Listening sentence card ────────────────────────────────
// Audio only — no text shown. Big play button is the entire question.
// After tapping 🔊, player arranges the words they heard.
// ── Listening word card — audio only, pick the word you heard ──
function listeningWordHtml(q){
  // MC options are rendered disabled and unlocked only after audio plays.
  // This prevents answering before hearing — which would corrupt SRS data.
  return `<div class="wcard wcard-listen">
    <div class="wc-top">
      <span class="wc-badge">🎧 Word</span>
    </div>
    <div class="listen-stimulus">
      <button class="listen-big-btn" onclick="G_speakNow()">🔊</button>
      <div class="listen-big-label" id="listen-word-hint">Tap to hear · then pick the word</div>
    </div>
  </div>`;
}

function listeningSentenceHtml(q){
  // Show English sentence translation big as the question stimulus
  const engLine=q.sentence1_en
    ?`<div class="listen-eng">${q.sentence1_en}</div>`:'';
  // BUG-FIX (duplicate TTS button): removed the small 🔊 from wc-top — only the
  // large listen-big-btn remains, so the UI is unambiguous for listening questions.
  return `<div class="wcard wcard-listen">
    <div class="wc-top">
      <span class="wc-badge">🎧 Sentence</span>
    </div>
    ${engLine}
    <div class="listen-stimulus">
      <button class="listen-big-btn" onclick="G_speakNow()">🔊</button>
      <div class="listen-big-label">Tap to replay</div>
    </div>
  </div>`;
}

// ── Main dispatcher ────────────────────────────────────────
function _promptHtml(q){
  if(!q.prompt)return '';
  return `<div class="q-prompt">${q.prompt}</div>`;
}
function renderQ(q){
  renderProg();
  const area=eid('q-area');if(!area)return;
  if(window.Mascot) Mascot.onQuestion(S.lang,q);
  switch(q.mode){
    case 'definition':
    case 'reading':
      if(S.lang==='english_ielts'&&q.mode==='definition'){
        area.innerHTML=ieltsCardHtml(q)+_promptHtml(q)+mcHtml(q.options,q);
      } else {
        area.innerHTML=wordCardHtml(q)+_promptHtml(q)+mcHtml(q.options,q);
      }
      break;
    case 'spelling':
      area.innerHTML=spellingCardHtml(q)+_promptHtml(q)+mcHtml(q.options,q); break;
    case 'listeningWord':
      area.innerHTML=listeningWordHtml(q)+_promptHtml(q)+mcHtml(q.options,q); break;
    case 'listeningSentence': {
      const _lsLang=getLc().type==='japanese'?' lang="ja"':'';
      area.innerHTML=listeningSentenceHtml(q)+_promptHtml(q)+
        `<div class="tile-zone">
          <div class="t-slots" id="tslots"${getLc().rtl?' dir="rtl"':''}${_lsLang}><span class="t-ph">Tap words below ↓</span></div>
          <div class="t-bank" id="tbank"${getLc().rtl?' dir="rtl"':''}${_lsLang}></div>
        </div>`;
      refreshST(); break;
    }
    case 'blank':
      area.innerHTML=blankCardHtml(q)+_promptHtml(q)+mcHtml(q.options,q); break;
    case 'sentenceTiles': {
      const _stLang=getLc().type==='japanese'?' lang="ja"':'';
      area.innerHTML=sentenceTilesCardHtml(q)+_promptHtml(q)+
        `<div class="tile-zone">
          <div class="t-slots" id="tslots"${getLc().rtl?' dir="rtl"':''}${_stLang}><span class="t-ph">Tap words below ↓</span></div>
          <div class="t-bank" id="tbank"${getLc().rtl?' dir="rtl"':''}${_stLang}></div>
        </div>`;
      refreshST(); break;
    }
    case 'characterTiles':
      renderCT(q); break;
    case 'kanaSpelling':
      renderKS(q); break;
    case 'matching':
      renderMatching(q); break;
  }
  eid('btn-next').style.display='none';
  eid('btn-skip').style.display='flex';
  const _bh=eid('btn-hint');
  if(_bh)_bh.style.display=(q.mode==='characterTiles'||q.mode==='kanaSpelling')?'none':'flex';
}

// ── MC answer handler ──────────────────────────────────────
// Wrong answer: shake + red, player can try again. Correct: lock + green + next.


function G_onMC(btn){
  if(S.phase==='done')return;
  // BUG FIX (double-tap crash): guard on disabled only — dataset.tapped is removed
  // because it conflicted with the wrong-answer retry flow (other buttons were locked
  // by the old qsa disable-all, making retry impossible after a wrong answer).
  if(btn.disabled)return;
  // Lock only THIS button immediately to prevent double-tap on the same option.
  // Other buttons stay enabled so the player can retry after a wrong answer.
  btn.disabled=true;
  SFX.click();
  const enc=btn.dataset.a;
  const ans=decodeURIComponent(enc);
  // For blank mode, accept any inflected form (departs / departed / departing)
  const accepted=S.q.acceptedForms||[S.q.answer];
  const ok=accepted.some(f=>ans===f)||ans===S.q.answer;
  // Speak the option if it's a foreign word (not an English meaning)
  const speakModes=['spelling','blank','reading','listeningWord'];
  if(speakModes.includes(S.q.mode)){
    const cleanText = ans.replace(/<rt>[^<]*<\/rt>/gi, '').replace(/<[^>]+>/g, '');
    TTS.say(cleanText,LC[S.lang].ttsLang,0.9);
  }

  if(ok){
    // Correct — lock ALL options, show green on the chosen button (or canonical answer)
    finishQuestion(true,S.q.wordId);
    const _accepted=S.q.acceptedForms||[S.q.answer];
    qsa('.mc-opt').forEach(b=>{
      b.disabled=true;
      b.classList.add('done');
      const bAns=decodeURIComponent(b.dataset.a);
      if(bAns===ans||_accepted.some(f=>bAns===f))b.classList.add('ok');
    });
    SFX.pop();
    // Fill the blank in the sentence with the correct answer
    if(S.q.mode==='blank'){
      const box=document.querySelector('.blank-box');
      if(box){
        const fillText=S.q.fillWord||S.q.answer;
        const filled=box.innerHTML.replace('___',`<span class="blank-filled">${_cleanWord(fillText)}</span>`);
        box.innerHTML=filled;
        // Grammar note: explain why word changed form
        const r=Store.getById(S.lang,S.q.wordId);
        const filledLower=fillText.toLowerCase();
        const baseLower=(r?.word||'').toLowerCase();
        if(r&&filledLower!==baseLower){
          const note=r.form_notes?.[fillText]||r.form_notes?.[filledLower]||null;
          if(note){
            const noteEl=document.createElement('div');
            noteEl.className='blank-form-note';
            noteEl.innerHTML=`<span class="bfn-icon">💡</span><span class="bfn-text"><b>${_cleanWord(r.word)}</b> → <b>${_cleanWord(fillText)}</b>: ${note}</span>`;
            box.parentNode.insertBefore(noteEl,box.nextSibling);
          }
        }
      }
    }
    // For listening modes: reveal the word and its meaning after correct answer
    const _q=S.q;
    if(_q.mode==='listeningWord'||_q.mode==='listeningSentence'){
      const rev=_q.meta?.revealWord||'';
      const revM=_q.meta?.meaning||'';
      showFeedback(true,null,rev,revM);
    } else {
      showFeedback(true,null);
    }
    showNextBtn();

  } else {
    // Wrong — shake + red, keep other non-locked options active so player can retry
    SFX.wrong();
    btn.classList.add('no','done');
    // Record wrong attempt for mastery tracking
    if(S.q.wordId) S.q._hadWrong=true;
    // Fade the eliminated button so remaining options are visually clearer
    setTimeout(()=>{ btn.style.opacity='0.6'; },600);
    // listeningWord: other buttons are still mc-locked until audio finishes.
    // Re-enable them only if they were already unlocked (i.e. audio already played).
    // mc-locked buttons stay disabled — G_unlockListenMC() handles them after onended.
    if(S.q.mode!=='listeningWord'){
      // For all other MC modes, ensure remaining options are definitely clickable
      qsa('.mc-opt').forEach(b=>{
        if(!b.classList.contains('done')&&!b.classList.contains('mc-locked')) b.disabled=false;
      });
    }
  }
}

// ── Sentence tiles ─────────────────────────────────────────
function refreshST(){
  const se=eid('tslots'),be=eid('tbank');if(!se||!be)return;
  const st=S.st;
  const q=S.q;
  const tt=q.tileTrans||null;
  const _tileMeaning=w=>{
    if(!tt)return '';
    const t1=w.replace(/[¿¡.,!?;:«»"()]+$/,'');
    const t2=t1.replace(/^[¿¡.,!?;:«»"()]+/,'');
    return tt[w]||tt[t1]||tt[t2]||tt[w.toLowerCase()]||tt[t1.toLowerCase()]||tt[t2.toLowerCase()]||'';
  };
  const _tileHtml=(w,cls,onclick)=>{
    const m=_tileMeaning(w);
    // BUG-FIX #318 (event bubbling): pointer-events:none on inner spans so event.target
    // is always the <button> itself, never a child span, regardless of where the tap lands.
    const sub=m?`<span class="tile-trans" style="pointer-events:none">${m}</span>`:'';
    // BUG FIX 3: strip trailing (and leading) punctuation from the visible tile label
    // so "lähti." displays as "lähti" — _stClean already handles comparison; this is display only
    const wDisplay=w.replace(/^[¿¡]+/,'').replace(/[.,!?;:«»"()]+$/,'').trim()||w;
    return `<button class="tile ${cls}" ${onclick}><span class="tile-word" style="pointer-events:none">${wDisplay}</span>${sub}</button>`;
  };

  // For listening sentence mode: show ghost slots for remaining unfilled positions
  const isListening=q.mode==='listeningSentence';
  const totalWords=isListening
    ?(q.answerTiles||((q.answerClean||q.answer).split(' ').map(w=>_stClean(w).toLowerCase()))).length
    :0;
  const remaining=totalWords-st.placed.length;

  let slotsHtml='';
  if(st.placed.length){
    slotsHtml=st.placed.map((w,i)=>_tileHtml(w,'placed',`onclick="G_stRem(${i})"`)).join('');
  }
  if(isListening&&remaining>0){
    // Append ghost underline slots for unfilled positions
    for(let i=0;i<remaining;i++){
      slotsHtml+=`<div class="t-ghost"></div>`;
    }
  }
  se.innerHTML=slotsHtml||'<span class="t-ph">Tap words below ↓</span>';
  be.innerHTML=st.avail.map((w,i)=>_tileHtml(w,'bank',`onclick="G_stPut(${i})"`)).join('');
}


// 加上 g 旗標，確保磁鐵內任何位置的標點都被移除，並統一轉小寫
function _stClean(w){
  if(!w) return '';
  // BUG-FIX (typographic apostrophe): normalise curly/angled apostrophes before stripping
  // punctuation. Without this, l\u2019arbre !== l'arbre even though they look identical.
  w=w.replace(/[\u2018\u2019\u02BC\u02BB\u0060]/g,"'");
  return w.replace(/[¿¡.,!?;:«»"()]/g,'').trim().toLowerCase();
}
// Clean a tile token that may be multi-word (e.g. "act as," → "act as")


function _stCleanTile(w){
  return w.split(' ').map(p=>_stClean(p)).join(' ').toLowerCase();
}
function G_stPut(i){
  if(S.phase==='done')return;
  SFX.click();
  const st=S.st;
  const word=st.avail[i];
  if(word) TTS.say(_cleanWord(word),LC[S.lang].ttsLang,0.9);

  const q=S.q;
  // Use answerTiles (per-token array) when available; fall back to splitting answerClean
  const answerTokens = q.answerTiles || (q.answerClean||q.answer).split(' ').map(w=>_stClean(w).toLowerCase());
  const totalCorrect = answerTokens.length;
  const nextIdx = st.placed.length;
  const tapped = st.avail[i];

  const tappedClean = _stCleanTile(tapped);
  const expectedClean = answerTokens[nextIdx];


  // Accept the tapped tile if it matches expected OR if it's an accepted word form
  // (for sentences where a different tense of the target word is used)



  // --- 精確修正段落開始 ---
  const wordForms = (q._wordForms || []).map(f => _stClean(f));
  
  // 檢查：1. 磁鐵文字完全一樣 OR 2. 磁鐵文字屬於該單字的其中一個時態變形
  const isAcceptedForm = wordForms.length > 0 && wordForms.includes(tappedClean);
  const isCorrect = tappedClean === expectedClean || (isAcceptedForm && wordForms.includes(expectedClean));
  // --- 精確修正段落結束 ---



  if(!isCorrect){
    // WRONG — shake just this tile red in the bank, keep all placed tiles
    SFX.wrong();
    q._hadWrong=true;
    const be=eid('tbank');
    if(be){
      const btns=be.querySelectorAll('.tile.bank');
      const wrongBtn=btns[i];
      if(wrongBtn){
        wrongBtn.classList.add('tile-wrong');
        setTimeout(()=>wrongBtn.classList.remove('tile-wrong'),600);
      }
    }
    return;
  }

  // CORRECT — place the tile
  st.placed.push(st.avail.splice(i,1)[0]);
  refreshST();

  if(st.placed.length===totalCorrect){
    // Check if placed order matches answerTiles OR any altTiles entry (bug 20,54,79,80,81,197)
    const placedClean=st.placed.map(w=>_stCleanTile(w));
    const matchesAny=
      placedClean.every((t,i)=>t===answerTokens[i]) ||
      (q.altTiles||[]).some(alt=>alt.length===placedClean.length&&placedClean.every((t,i)=>t===alt[i]));
    if(!matchesAny){
      // All tiles placed but wrong order — shake the slots, don't finish
      SFX.wrong();
      q._hadWrong=true;
      const se=eid('tslots');
      if(se){se.classList.add('shake');setTimeout(()=>se.classList.remove('shake'),400);}
      // Return all placed tiles to the bank for retry
      while(st.placed.length){st.avail.unshift(st.placed.pop());}
      refreshST();
      return;
    }
    finishQuestion(true,q.wordId);
    SFX.pop();
    qsa('.tile.placed').forEach(t=>t.classList.add('tile-done'));
    showNextBtn();
  }
}
function G_stRem(i){
  if(S.phase==='done')return;
  const st=S.st;
  st.avail.unshift(st.placed.splice(i,1)[0]);
  refreshST();
}

// ── Hebrew letter romanization map ────────────────────────
// Letters that change sound by position (BeGaDKeFaT rule, simplified for modern Hebrew):
// ב = b at word start, v elsewhere
// כ = k at word start, kh elsewhere  
// פ = p at word start, f elsewhere
const HE_CHAR={
  'א':"'", 'ג':'g','ד':'d','ה':'h','ו':'v',
  'ז':'z','ח':'ch','ט':'t','י':'y','ך':'kh',
  'ל':'l','מ':'m','ם':'m','נ':'n','ן':'n','ס':'s',
  'ע':"'", 'ף':'f','צ':'ts','ק':'k','ר':'r',
  'ש':'sh','ת':'t'
};
// Position-sensitive letters: [word-start sound, mid/end sound]
const HE_CHAR_POS={'ב':['b','v'],'כ':['k','kh'],'פ':['p','f']};

function heRom(c, wordPos){
  // wordPos: 0 = first letter of a word token, >0 = middle/end
  if(HE_CHAR_POS[c]) return wordPos===0 ? HE_CHAR_POS[c][0] : HE_CHAR_POS[c][1];
  return HE_CHAR[c]||c;
}

// ── Character tiles ────────────────────────────────────────
// FIX: phase stays 'waiting' throughout — only wrong tiles are shaken, game never locks
function renderCT(q){
  const area=eid('q-area');if(!area)return;
  // Init state
  S.ct.slots=q.chars.map(c=>({char:c,filled:false}));
  S.ct.bank=q.bank.map((t,i)=>({...t,id:i,used:false}));
  S.ct.wrongCount=0;
  area.innerHTML=`
    <div class="wcard">
      <div class="wc-top">
        <span class="wc-badge">Character Tiles</span>
        <button class="wc-tts" onclick="G_speakNow()">🔊</button>
      </div>
      <div class="ct-meaning">${q.displayMeaning}</div>
      <div class="ct-target" id="ct-target" dir="rtl">${q.displayWord}</div>
      ${q.displayRomaji?`<div class="wc-pron">${q.displayRomaji}</div>`:''}
    </div>
    <div class="ct-zone">
      <div class="ct-slots" id="ct-slots" dir="rtl"></div>
      <div class="ct-actions">
        <button class="ct-hint-btn" onclick="G_ctHint()">💡 Hint</button>
      </div>
      <div class="ct-bank" id="ct-bank"></div>
    </div>`;
  // Compute fluid slot size so all slots fit in one row
  const n=q.chars.length;
  const availW=Math.min(window.innerWidth,430)-28-20;
  const gapTotal=(n-1)*5;
  const rawSize=Math.floor((availW-gapTotal)/n);
  const cs=Math.max(28,Math.min(48,rawSize));
  const slotsEl=eid('ct-slots');
  if(slotsEl)slotsEl.style.setProperty('--cs',cs+'px');
  const bankEl=eid('ct-bank');
  if(bankEl)bankEl.style.setProperty('--cs',cs+'px');
  refreshCT();
}

function refreshCT(){
  const se=eid('ct-slots'),be=eid('ct-bank');if(!se||!be)return;
  const ct=S.ct;
  // Slots: romanization on top, Hebrew below
  // Empty: show hint romanization + dash placeholder
  // Filled: show romanization + actual Hebrew character
  se.innerHTML=ct.slots.map((s,i)=>{
    const rom=heRom(s.char,i);
    if(s.filled){
      return `<div class="ct-slot filled" id="cts-${i}">
        <span class="ct-slot-num">${rom}</span>
        <span class="ct-char">${s.char}</span>
      </div>`;
    }
    return `<div class="ct-slot" id="cts-${i}">
      <span class="ct-slot-num">${rom}</span>
      <span class="ct-slot-line"></span>
    </div>`;
  }).join('');
  // Bank tiles: Hebrew big on top, romanization small below
  be.innerHTML=ct.bank.map((t,i)=>{
    const wordPos=t.srcIdx>=0?t.srcIdx:1;
    // BUG-FIX #318 (event bubbling): pointer-events:none on inner spans ensures
    // event.target is always the <button> itself, never a child <span>.
    // Without this, tapping the edge of the Hebrew character hits the span and
    // any handler using event.target.dataset would return undefined.
    return `<button class="ct-tile${t.used?' used':''}" id="ctb-${i}"
      onclick="G_ctTap(${i})"${t.used?' disabled':''}>
      <span class="ct-char" style="pointer-events:none">${t.char}</span>
      <span class="ct-tile-label" style="pointer-events:none">${heRom(t.char,wordPos)}</span>
    </button>`;
  }).join('');
}



function G_ctTap(idx){
  // FIX: NEVER check S.phase here — character tiles stay interactive until word done
  // Only block if this specific tile is already used
  const ct=S.ct;
  const tile=ct.bank[idx];
  if(!tile||tile.used)return;

  // BUG-FIX (last letter silent): old code skipped TTS for the last letter so the
  // full-word audio could follow immediately. But TTS.say() has an isPlaying guard —
  // the previous letter's audio was still playing, so isPlaying=true caused the last
  // letter to be silently swallowed. And then TTS.stop() + SFX.done() fired in the
  // wrong order, cutting off the full-word audio too.
  // Fix: always speak the tapped letter. For the last letter, give the full-word TTS
  // a longer delay (1000ms) so the single-char audio has time to finish first.
  const isLastLetter = ct.slots.filter(s=>!s.filled).length===1 &&
    _nfkc(tile.char)===_nfkc(ct.slots[ct.slots.findIndex(s=>!s.filled)].char);
  TTS.say(tile.char, LC[S.lang].ttsLang, 1.0);

  const slotIdx=ct.slots.findIndex(s=>!s.filled);
  if(slotIdx===-1)return;

  if(_nfkc(tile.char)===_nfkc(ct.slots[slotIdx].char)){
    // CORRECT letter
    SFX.pop();
    tile.used=true;
    ct.slots[slotIdx].filled=true;
    refreshCT();
    // Check if all filled
    if(ct.slots.every(s=>s.filled)){
      const tgt=eid('ct-target');if(tgt)tgt.classList.add('ct-complete');
      qsa('.ct-slot.filled').forEach(s=>s.classList.add('ct-slot-done'));
      const wasFlawless=ct.wrongCount===0;
      finishQuestion(wasFlawless,S.q.wordId);
      SFX.done();
      // Give the last-letter audio time to finish before playing the full word.
      // 1000ms covers single-char Hebrew/kana audio (typically 400-600ms) + buffer.
      const completedWord=S.q.tts, completedLang=LC[S.lang].ttsLang;
      _scheduleQueuedTTS(()=>{TTS.stop();TTS.say(completedWord,completedLang,0.85);},1000);
      showFeedback(true,null);
      showNextBtn();
    }


  } else {
    // 答錯字母：播放錯誤音效，震動該空格
    SFX.wrong();
    ct.wrongCount++;
    
    // 🌟 針對「這個特定的空格 (slotIdx)」記錄錯誤次數
    // 我們把它存在 S.q 物件裡，方便追蹤
    S.q._slotMistakes = S.q._slotMistakes || {};
    S.q._slotMistakes[slotIdx] = (S.q._slotMistakes[slotIdx] || 0) + 1;
    
    // 紀錄這題已經答錯過（影響精通度）
    if(S.q.wordId) S.q._hadWrong = true;

    const slotEl=eid('cts-'+slotIdx);
    if(slotEl){
      slotEl.classList.add('error');
      setTimeout(()=>slotEl.classList.remove('error'),500);
    }
    
    // 🌟 B. 扣分自動提示法：如果在同一個洞連續錯 2 次，自動觸發提示
    if (S.q._slotMistakes[slotIdx] >= 2) {
      setTimeout(() => {
        G_ctHint(); // 呼叫你原本寫好的提示函數，讓正確按鈕閃黃光
      }, 600); // 等震動動畫結束後再閃光，視覺上比較舒服
    }
  }



}

function G_ctHint(){
  SFX.hint();
  const ct=S.ct;
  const slotIdx=ct.slots.findIndex(s=>!s.filled);if(slotIdx===-1)return;
  const expected=ct.slots[slotIdx].char;
  ct.wrongCount++;
  // BUG-FIX (ctHint SRS mismatch): G_ksHint() sets _hadWrong correctly but
  // G_ctHint() was missing it — Hebrew tile hint calls silently promoted words
  // as if the player answered flawlessly from memory.
  if(S.q?.wordId) S.q._hadWrong = true;
  // BUG-FIX: use _nfkc() on both sides so Dagesh/shin-dot ordering differences
  // don't cause the hint tile to silently not be found.
  const tileIdx=ct.bank.findIndex(t=>!t.used&&_nfkc(t.char)===_nfkc(expected));
  if(tileIdx===-1)return;
  const el=eid('ctb-'+tileIdx);
  if(el){
    el.classList.add('hint-glow-tile');
    setTimeout(()=>el.classList.remove('hint-glow-tile'),2000);
  }
}

function G_ctClear(){
  SFX.click();
  const ct=S.ct;
  ct.slots.forEach(s=>s.filled=false);
  ct.bank.forEach(t=>t.used=false);
  // BUG FIX: reset per-slot mistake counts so auto-hint doesn't fire immediately
  // on the first tap of a new attempt if the slot had 2+ mistakes before Clear.
  if(S.q) S.q._slotMistakes={};
  refreshCT();
}

// ── Kana Spelling (Japanese character tiles) ───────────────
function renderKS(q){
  const area=eid('q-area');if(!area)return;
  // Reuse ct state object for kana spelling
  S.ct.slots=q.chars.map(c=>({char:c,filled:false}));
  S.ct.bank=q.bank.map((t,i)=>({...t,id:i,used:false}));
  S.ct.wrongCount=0;
  // Compute fluid tile size
  const n=q.chars.length;
  const availW=Math.min(window.innerWidth,430)-28-20;
  const gapTotal=(n-1)*5;
  const rawSize=Math.floor((availW-gapTotal)/n);
  const cs=Math.max(28,Math.min(52,rawSize));
  // Show kanji word + meaning as context
  const wordDisplay=q.displayWord!==q.displayReading
    ?`<ruby>${q.displayWord}<rt>${q.displayReading}</rt></ruby>`
    :q.displayWord;
  area.innerHTML=`
    <div class="wcard">
      <div class="wc-top">
        <span class="wc-badge">🔤 Kana Spelling</span>
        <button class="wc-tts" onclick="G_speakNow()">🔊</button>
      </div>
      <div class="ks-meaning">${q.displayMeaning}</div>
      <div class="ks-word">${wordDisplay}</div>
      ${q.displayRomaji?`<div class="wc-pron">${q.displayRomaji}</div>`:''}
    </div>
    <div class="ct-zone">
      <div class="ct-slots" id="ct-slots" style="direction:ltr"></div>
      <div class="ct-actions">
        <button class="ct-hint-btn" onclick="G_ksHint()">💡 Hint</button>
      </div>
      <div class="ct-bank" id="ct-bank"></div>
    </div>`;
  const slotsEl=eid('ct-slots');
  if(slotsEl)slotsEl.style.setProperty('--cs',cs+'px');
  const bankEl=eid('ct-bank');
  if(bankEl)bankEl.style.setProperty('--cs',cs+'px');
  refreshKS();
}

function refreshKS(){
  const se=eid('ct-slots'),be=eid('ct-bank');if(!se||!be)return;
  const ct=S.ct;
  const showRom=S.romaji; // respect the global romaji toggle
  se.innerHTML=ct.slots.map((s,i)=>{
    const rom=tileRomaji(s.char);
    const isDigraph=[...s.char].length>1;
    if(s.filled){
      // BUG-FIX (digraph slot vertical stacking): filled slots like きっ were stacking
      // vertically because ct-slot has a fixed width. Force inline-flex row + nowrap
      // on the char span, and let the slot expand width with width:auto for digraphs.
      const slotStyle=isDigraph?'style="width:auto;min-width:max-content;padding:0 4px;"':'';
      const charStyle=isDigraph
        ?'display:inline-flex;flex-direction:row;align-items:center;white-space:nowrap;flex-shrink:0;'
        :'';
      return `<div class="ct-slot ks-slot filled" id="cts-${i}" ${slotStyle}>
        <span class="ct-char"${charStyle?` style="${charStyle}"`:''}>${s.char}</span>
        <span class="ct-slot-rom" style="${showRom?'':'display:none'}">${rom}</span>
      </div>`;
    }
    return `<div class="ct-slot ks-slot" id="cts-${i}">
      <span class="ct-slot-line"></span>
    </div>`;
  }).join('');
  // Bank tiles: kana big, romaji label below (hidden when toggle is off).
  // Digraph tiles (2+ chars) get extra width via ks-tile-wide.
  be.innerHTML=ct.bank.map((t,i)=>{
    const rom=tileRomaji(t.char);
    const isDigraph=[...t.char].length>1;
    // BUG-FIX (digraph vertical stacking): きっ was stacking vertically because
    // the button is display:flex flex-direction:column, which constrains ct-char's
    // width to the button width. For digraphs, force the button itself to be wide
    // enough (min-content), and force ct-char to stay on one row with nowrap.
    const btnStyle=isDigraph?'style="width:auto;min-width:max-content;padding:0 6px;"':'';
    const charStyle=isDigraph
      ?'pointer-events:none;display:inline-flex;flex-direction:row;align-items:center;white-space:nowrap;flex-shrink:0;'
      :'pointer-events:none;';
    return `<button class="ct-tile ks-tile${isDigraph?' ks-tile-wide':''}${t.used?' used':''}" id="ctb-${i}"
      onclick="G_ksTap(${i})"${t.used?' disabled':''} ${btnStyle}>
      <span class="ct-char" style="${charStyle}">${t.char}</span>
      <span class="ct-tile-label" style="pointer-events:none;${showRom?'':'display:none'}">${rom}</span>
    </button>`;
  }).join('');
}

// Japanese long-vowel phonetic equivalence:
// おう and おお represent the same /oː/ sound — different spelling conventions.
// えい and ええ represent the same /eː/ sound.
// A player who taps おお for a word spelled おう is phonetically correct.
// We accept the phonetic equivalent as correct to avoid penalising valid knowledge.
const KANA_PHONETIC_EQUIV={'おう':'おお','おお':'おう','えい':'ええ','ええ':'えい'};
function _kanaMatch(tapped, expected){
  if(_nfkc(tapped)===_nfkc(expected))return true;
  return KANA_PHONETIC_EQUIV[tapped]===expected||KANA_PHONETIC_EQUIV[expected]===tapped;
}

function G_ksTap(idx){
  const ct=S.ct;
  const tile=ct.bank[idx];
  if(!tile||tile.used)return;
  SFX.click();
  const slotIdx=ct.slots.findIndex(s=>!s.filled);
  if(slotIdx===-1)return;
  // BUG-FIX (last kana silent): same root cause as G_ctTap — isPlaying guard in
  // TTS.say() swallowed the last kana because the previous char's audio was still
  // playing. Fix: always speak the tapped kana; delay full-word TTS by 1000ms.
  const isLastChar = ct.slots.filter(s=>!s.filled).length===1 &&
    _kanaMatch(tile.char, ct.slots[slotIdx].char);
  TTS.say(tile.char, LC[S.lang].ttsLang, 1.0);

  if(_kanaMatch(tile.char,ct.slots[slotIdx].char)){
    SFX.pop();
    tile.used=true;
    ct.slots[slotIdx].filled=true;
    refreshKS();
    if(ct.slots.every(s=>s.filled)){
      qsa('.ct-slot.filled').forEach(s=>s.classList.add('ct-slot-done'));
      const wasFlawless=ct.wrongCount===0;
      finishQuestion(wasFlawless,S.q.wordId);
      SFX.done();
      const completedWord=S.q.tts, completedLang=LC[S.lang].ttsLang;
      _scheduleQueuedTTS(()=>{TTS.stop();TTS.say(completedWord,completedLang,0.85);},1000);
      showFeedback(true,null);
      showNextBtn();
    }


 } else {
    SFX.wrong();
    ct.wrongCount++;
    if(S.q.wordId) S.q._hadWrong=true;
    
    // 🌟 同樣的邏輯：記錄這個空格的錯誤次數
    S.q._slotMistakes = S.q._slotMistakes || {};
    S.q._slotMistakes[slotIdx] = (S.q._slotMistakes[slotIdx] || 0) + 1;

    const slotEl=eid('cts-'+slotIdx);
    if(slotEl){
      slotEl.classList.add('error');
      setTimeout(()=>slotEl.classList.remove('error'),500);
    }
    
    // 🌟 連續錯 2 次，觸發假名的提示函數
    if (S.q._slotMistakes[slotIdx] >= 2) {
      setTimeout(() => {
        G_ksHint(); 
      }, 600);
    }
  }


}

function G_ksHint(){
  SFX.hint();
  const ct=S.ct;
  const slotIdx=ct.slots.findIndex(s=>!s.filled);if(slotIdx===-1)return;
  const expected=ct.slots[slotIdx].char;
  ct.wrongCount++;
  if(S.q.wordId) S.q._hadWrong=true;
  // BUG-FIX: use _kanaMatch (handles おう/おお phonetic equivalence) instead of
  // strict === so the hint tile is always found even for long-vowel variants.
  const tileIdx=ct.bank.findIndex(t=>!t.used&&_kanaMatch(t.char,expected));
  if(tileIdx===-1)return;
  const el=eid('ctb-'+tileIdx);
  if(el){
    el.classList.add('hint-glow-tile');
    setTimeout(()=>el.classList.remove('hint-glow-tile'),2000);
  }
}

// ── Matching ───────────────────────────────────────────────
function renderMatching(q){
  const area=eid('q-area');if(!area)return;
  const lc=getLc();
  const ws=shuffle(q.pairs.map(p=>({id:p.id,val:p.word,side:'word'})));
  const ms=shuffle(q.pairs.map(p=>({id:p.id,val:p.meaning,side:'meaning'})));
  const col=items=>items.map(it=>{
    const e=encodeURIComponent(it.val);
    const rtl=it.side==='word'&&lc.rtl?' dir="rtl"':'';
    // Use data-s, data-id, data-v only — onclick reads from dataset, no inline string values
    // For Japanese word-side tiles, wrap with ruby furigana
    const lc2=getLc();


    const dispVal=(it.side==='word'&&lc2.type==='japanese')
      ?jpRuby(it.val, q.pairs.find(p=>p.word===it.val)?.reading||null)
      :_cleanWord(it.val); // 清理符號


    const langAttr=(it.side==='word'&&lc2.type==='japanese')?' lang="ja"':'';

    return `<button class="mbtn ${it.side}" data-id="${it.id}" data-s="${it.side}" data-v="${e}"${rtl}${langAttr}
      onclick="G_onMatchBtn(this)">${dispVal}</button>`;
  }).join('');
  area.innerHTML=`
    <div class="match-hdr">
      <span class="wc-badge">Translation Match</span>
    </div>
    <div class="match-grid">
      <div class="match-col">${col(ws)}</div>
      <div class="match-col">${col(ms)}</div>
    </div>`;
}
// Safe wrapper — reads all values from data attributes, no inline string issues
function G_onMatchBtn(btn){
  const side=btn.dataset.s, id=btn.dataset.id, enc=btn.dataset.v;
  // Play TTS for word-side tiles
  if(side==='word'){
    const word=decodeURIComponent(enc);


    TTS.say(_cleanWord(word),LC[S.lang].ttsLang,0.9);


  }
  G_onMatch(side,id,enc);
}
function refreshMatch(){
  const m=S.mt;
  qsa('.mbtn').forEach(b=>{
    const id=b.dataset.id,si=b.dataset.s;
    b.className='mbtn '+si;b.disabled=false;
    if(m.hit.includes(id)){b.classList.add('hit');b.disabled=true;}
    else if(m.sel?.id===id&&m.sel?.side===si)b.classList.add('sel');
    else if(m.wrong.some(w=>w.id===id&&w.side===si))b.classList.add('miss');
  });
}
function G_onMatch(side,id,encVal){
  if(S.phase==='done')return;
  // BUG FIX (double-tap / two-finger race condition): use a global timestamp lock.
  // Two simultaneous finger taps can fire G_onMatch twice within the same JS tick,
  // corrupting S.mt.sel and making the board unsolvable without a restart.
  const now=Date.now();
  if(G_onMatch._lastTap&&now-G_onMatch._lastTap<250)return;
  G_onMatch._lastTap=now;
  SFX.click();
  const m=S.mt;if(m.hit.includes(id))return;
  if(!m.sel){m.sel={side,id};refreshMatch();return;}
  if(m.sel.side===side){m.sel={side,id};refreshMatch();return;}
  const wId=side==='word'?id:m.sel.id;
  const xId=side==='meaning'?id:m.sel.id;
  if(wId===xId){
    SFX.pop();m.hit.push(id);Prog.rec(S.lang,id,true);m.sel=null;refreshMatch();
    if(m.hit.length===S.q.pairs.length){
      // BUG-FIX: finishQuestion(true, null) for matching — wordId is null because
      // individual Prog.rec() calls already handled each word's SRS above.
      // realOk inside finishQuestion checks S.q._hadWrong which is set on wrong pairs,
      // so score.ok vs score.no is correctly computed.
      finishQuestion(true,null);SFX.done();showFeedback(true,null);showNextBtn();
    }
  } else {
    SFX.wrong();
    // Record wrong attempt for both words in the failed pair
    Prog.rec(S.lang,m.sel.id,false);
    Prog.rec(S.lang,id,false);
    // BUG FIX (matching score): mark question as having had a wrong attempt so
    // finishQuestion correctly computes realOk=false → score.no++ instead of ok++.
    if(S.q) S.q._hadWrong=true;
    m.wrong=[{id:m.sel.id,side:m.sel.side},{id,side}];m.sel=null;refreshMatch();
    setTimeout(()=>{m.wrong=[];refreshMatch();},700);
  }
}

// ── Feedback ── banner removed; MC button colours + SFX give sufficient signal
function showFeedback(ok,correctAns,revealWord,revealMeaning){
  if(ok && window.Mascot) Mascot.cheer();
}
function G_toggleTip(btn){
  SFX.click();
  const body=btn.nextElementSibling;
  const open=btn.getAttribute('aria-expanded')==='true';
  btn.setAttribute('aria-expanded',String(!open));
  body.classList.toggle('open',!open);
  btn.querySelector('.tip-arrow').textContent=open?'▾':'▴';
}
function showNextBtn(){
  eid('btn-next').style.display='flex';
  eid('btn-skip').style.display='none';
  const _bh=eid('btn-hint');if(_bh)_bh.style.display='none';
}

// ── Session complete ───────────────────────────────────────
function showComplete(){
  SFX.done();
  const strip=eid('game-strip');if(strip)strip.style.display='none';
  const st=Prog.stats(S.lang);
  const pct=S.goal?Math.round(S.score.ok/S.goal*100):0;
  const completeArea=eid('q-area');
  completeArea.innerHTML=`<div class="cc">
    <div id="mascot-host" class="cc-mascot"></div>
    <div class="cc-title">Session Complete!</div>
    <div class="cc-score">${S.score.ok}/${S.goal} correct · ${pct}%</div>
    ${_statsDeltaHtml()}
    <div class="cc-stats">
      <div class="ccs"><span class="ccs-v">${st.mastered}</span><span class="ccs-l">Mastered</span></div>
      <div class="ccs"><span class="ccs-v">${st.unfamiliar}</span><span class="ccs-l">Practicing</span></div>
      <div class="ccs"><span class="ccs-v">${st.new}</span><span class="ccs-l">New</span></div>
    </div>
    <button class="btn-cc p" onclick="G_playAgain()">Play Again</button>
    ${S.lessonGroup!==null?`<button class="btn-cc s" onclick="G_openLessonMap()">📖 Back to Lessons</button>`:''}
  </div>`;
  // iOS keeps the previous question's scrollTop after innerHTML replacement. That can
  // leave the mascot (the first item on this page) above the visible viewport. Reset it
  // immediately and once more after layout, then mount into the newly-created host.
  completeArea.scrollTop=0;
  let mascotMountAttempts=0;
  const mountCompleteMascot=()=>{
    completeArea.scrollTop=0;
    const mascotHost=document.getElementById('mascot-host');
    if(!mascotHost) return;
    if(!window.Mascot || typeof window.Mascot.refreshHost!=='function'){
      // A stale iPhone/PWA page can finish rendering before the newly-versioned
      // mascot controller is ready. Give it a short window instead of silently
      // leaving the old completion icon as the only visual feedback.
      if(mascotMountAttempts++<30){
        setTimeout(mountCompleteMascot,100);
        return;
      }
      mascotHost.classList.add('load-error');
      console.error('[WordArk mascot] Completion mascot controller is unavailable.');
      return;
    }
    Promise.resolve(window.Mascot.refreshHost())
      .then(()=>{
        // refreshHost() is asynchronous. Only celebrate after the SVG is really
        // inside the new host; retry if Safari has not committed the replacement yet.
        if(!mascotHost.querySelector('svg')){
          if(mascotMountAttempts++<8){
            setTimeout(mountCompleteMascot,100);
            return;
          }
          throw new Error('Mascot SVG was not inserted into the completion host');
        }
        window.Mascot.celebrate();
      })
      .catch(error=>{
        mascotHost.classList.add('load-error');
        console.error('[WordArk mascot] Completion mount failed:',error);
      });
  };
  if(typeof requestAnimationFrame==='function') requestAnimationFrame(mountCompleteMascot);
  else setTimeout(mountCompleteMascot,0);
  eid('btn-next').style.display='none';
  eid('btn-skip').style.display='none';
  const _bh2=eid('btn-hint');if(_bh2)_bh2.style.display='none';
}
// ── INTERSTITIAL CARDS ────────────────────────────────────────────────────
// Shown every 5 questions. Mix of soft encouragement + language fun facts.
// Content arrays: { en, zh, emoji }
// Language-specific tips loaded per language. Encouragements are universal.

const ENCOURAGEMENTS = [
  {en:"Language learning is hard. The fact that you're here means you're already winning.", zh:"語言學習很難。你還在這裡，就已經贏了。", emoji:"💙"},
  {en:"You should be proud of yourself. Most people never even try.", zh:"你應該為自己驕傲。大多數人從來不曾嘗試。", emoji:"🌟"},
  {en:"Every word you learn is a door that opens.", zh:"你學到的每一個詞，都是一扇打開的門。", emoji:"🚪"},
  {en:"You're doing something your future self will thank you for.", zh:"你正在做一件未來的自己會感謝你的事。", emoji:"🙏"},
  {en:"Slow progress is still progress. Keep going.", zh:"慢慢前進也是前進。繼續走。", emoji:"🐢"},
  {en:"You're building something real, one word at a time.", zh:"你在建造真實的東西，一次一個詞。", emoji:"🧱"},
  {en:"The best time to learn a language was years ago. The second best time is now.", zh:"學語言最好的時機是多年前。第二好的時機就是現在。", emoji:"⏰"},
  {en:"Mistakes are just proof that you're trying.", zh:"犯錯只是證明你在嘗試。", emoji:"✨"},
  {en:"You don't have to be fluent to have fun. You're already having fun.", zh:"你不需要流利才能享受。你已經在享受了。", emoji:"😊"},
  {en:"Every expert was once a beginner who kept showing up.", zh:"每位專家都曾是不斷出現的初學者。", emoji:"🏆"},
  {en:"Working hard on something meaningful — that's a good life.", zh:"努力做一件有意義的事——這就是好好生活。", emoji:"🌱"},
  {en:"You're training your brain to think in a new way. That's extraordinary.", zh:"你在訓練大腦用新的方式思考。這很了不起。", emoji:"🧠"},
];

// LANG_TIPS: content now lives in 8 standalone files (tips_finnish.js, tips_german.js, etc.)
// loaded via <script> tags in index.html as window.LANG_TIPS_<LANG>. This getter maps the
// internal language id to the right global array. Falls back to [] if a tips file hasn't
// loaded yet (e.g. slow network) — _pickInterstitial() already guards against empty arrays.
function _getLangTips(langId){
  const map = {
    finnish: 'LANG_TIPS_FINNISH',
    french: 'LANG_TIPS_FRENCH',
    spanish: 'LANG_TIPS_SPANISH',
    italian: 'LANG_TIPS_ITALIAN',
    japanese: 'LANG_TIPS_JAPANESE',
    hebrew: 'LANG_TIPS_HEBREW',
    german: 'LANG_TIPS_GERMAN',
    english_ielts: 'LANG_TIPS_ENGLISH_IELTS',
  };
  const key = map[langId];
  return (key && window[key]) ? window[key] : [];
}


// Pick a random interstitial card for the current language.
// Returns which pool it came from too, so the card can show an honest eyebrow label
// ("Language Tip" vs "Keep Going") instead of a generic one that doesn't always fit.
function _pickInterstitial(){
  const tips = _getLangTips(S.lang);
  const all  = [...ENCOURAGEMENTS.map(c=>({...c,_kind:'cheer'})), ...tips.map(c=>({...c,_kind:'tip'}))];
  if(!all.length) return {...ENCOURAGEMENTS[0], _kind:'cheer'};
  return all[0|Math.random()*all.length];
}

// Preferred path: entries authored with the new explicit schema
// ({term, translit, en, zh, emoji}) need no parsing at all — just use them.
// Legacy path: entries still in the old flat-string form ("'term' — explanation")
// get best-effort split via regex, so un-migrated content keeps working.
function _getTipParts(card){
  if(card.term) return {term:card.term, translit:card.translit||null, enBody:card.en, zhBody:card.zh};
  return _splitTipCard(card.en, card.zh);
}

// LEGACY PARSER — kept only for tip entries not yet migrated to the explicit
// {term, translit, en, zh} schema above. New content should use that schema
// directly instead of relying on this regex.
function _splitTipCard(en, zh){
  // Greedy middle group (not a negated-char class) so a term containing its
  // own apostrophe ("someone's thumb", "don't judge") — or a parenthetical
  // transliteration that itself contains an apostrophe ("ya'avor") — still
  // resolves to the LAST quote mark that sits right before the (optional
  // parenthetical +) dash, not the first apostrophe encountered.
  const enMatch = en && en.match(/^[\u0027\u2018\u2019"\u201c\u201d](.+)[\u0027\u2018\u2019"\u201c\u201d](?:\s*\(([^)]+)\))?\s*[\u2014\u2013-]\s*(.+)$/);
  if(!enMatch) return {term:null, translit:null, enBody:en, zhBody:zh};
  const zhMatch = zh && zh.match(/^[\u300c\u300e](.+)[\u300d\u300f]\s*(?:\u2014\u2014|--|[\u2014\u2013-])\s*(.+)$/);
  return {
    term: enMatch[1],
    translit: enMatch[2] || null,
    enBody: enMatch[3],
    zhBody: zhMatch ? zhMatch[2] : zh
  };
}

function showInterstitialCard(nextQ){
  const card = _pickInterstitial();
  const lc   = LC[S.lang];
  const strip = eid('game-strip'); if(strip) strip.style.display='none';
  const bb    = eid('bot-bar');    if(bb)    bb.style.display='none';
  const area  = eid('q-area');     if(!area) return;
  const eyebrow = card._kind==='tip' ? `💡 ${lc.name||'Language'} Tip` : '✨ Keep Going';
  const {term, translit, enBody, zhBody} = _getTipParts(card);
  const rtl = lc.rtl ? ' dir="rtl"' : ''; // same pattern used for word/tile display elsewhere
  const cjk = lc.type==='japanese' ? ' ic-term-cjk' : ''; // suppress Latin-tuned tracking/quotes for CJK
  // Speaker button follows the same data-attribute pattern used everywhere else
  // (r-tts, wc-tts, etc.) so quotes/apostrophes in the term never need JS-string
  // escaping — only the standard HTML-attribute &quot; escape.
  // BUG FIX: Hebrew term needs dir="rtl" (row) + <bdi> (term text) or it renders
  // left-to-right and garbles against the Latin punctuation in the surrounding markup —
  // matching how wc-word/r-word/etc. already handle lc.rtl everywhere else in the engine.
  // Font/vibe fix: .ic-term now uses Rubik (with the app's Noto Sans Hebrew stack for
  // RTL, same as .mc-t-script[dir="rtl"]) instead of Outfit, so idiom headlines match
  // the font every other word display in the app already uses. CJK also drops the
  // Latin-tuned negative letter-spacing and the decorative serif quote marks, which
  // read as foreign next to kanji/kana.
  // Transliteration (romaji/Latin) always stays LTR regardless of the card's script.
  // Furigana for Japanese tip-card idioms: reuses the same jpRuby() used
  // everywhere else in the app (word cards, review cards) — only active when
  // the tip entry actually has a "reading" field (hiragana for the whole
  // term). Entries without one just show the term as plain text, same as
  // before — nothing breaks for the entries that haven't been given a
  // reading yet.
  const termForDisplay = (lc.type==='japanese' && card.reading) ? jpRuby(term, card.reading) : term;
  const termHtml = term
    ? `<div class="ic-term-row"${rtl}>
         <span class="ic-term${cjk}">${lc.rtl?`<bdi dir="rtl">${term}</bdi>`:termForDisplay}</span>
         <button class="ic-say-btn" data-word="${term.replace(/"/g,'&quot;')}" data-lang="${lc.ttsLang}"
           onclick="event.stopPropagation();SFX.click();_cancelQueuedTTS();TTS.say(this.dataset.word,this.dataset.lang,0.8)"
           aria-label="Pronounce">🔊</button>
       </div>
       ${translit?`<div class="ic-translit" dir="ltr">${translit}</div>`:''}`
    : '';
  area.innerHTML=`<div class="interstitial-card ic-${card._kind}">
    <div class="ic-eyebrow">${eyebrow}</div>
    <div class="ic-emoji-badge"><div class="ic-emoji">${card.emoji}</div></div>
    ${termHtml}
    <div class="ic-en${term?' ic-en-sub':''}">${enBody}</div>
    <div class="ic-zh">${zhBody}</div>
    <button class="ic-btn" onclick="G_continueFromInterstitial()">Continue →</button>
  </div>`;
  // Little reveal chime as the card animates in.
  SFX.chime();
  // Auto-pronounce the idiom itself once the pop-in animation settles — same
  // delayed-autoplay pattern used for intro cards and listening questions.
  if(term){
    _scheduleQueuedTTS(()=>TTS.say(term,lc.ttsLang,0.8),550);
  }
}

function showEmpty(){
  const strip=eid('game-strip');if(strip)strip.style.display='none';
  const _bh3=eid('btn-hint');if(_bh3)_bh3.style.display='none';
  eid('btn-next').style.display='none';
  eid('btn-skip').style.display='none';
  // Show dual layout: No words on Random side, Lesson card stays normal
  const lessonCard=typeof _buildLessonCardHtml==='function'?_buildLessonCardHtml():'';
  eid('q-area').innerHTML=`<div class="ready-dual">
    <div class="ready-card-wrap random-wrap">
      <div class="ready-card-inner">
        <div class="cc-emo" style="font-size:2rem;margin-top:auto">📭</div>
        <div class="ready-title" style="font-size:.95rem">No words<br>here</div>
        <div class="ready-topic-label" style="text-transform:none;font-size:.75rem;color:var(--ink3)">Try switching to All Words</div>
        <button class="btn-cc p" style="width:100%;margin-top:auto;font-size:.8rem" onclick="G_setPool('all')">Show All</button>
      </div>
    </div>
    ${lessonCard}
  </div>`;
}

// ── Review ─────────────────────────────────────────────────
const CAT_PREVIEW=3, PAGE_SIZE=15, TOPIC_PREVIEW=8;
let _revObserver=null;




function renderReview(f) {
  S.revFilter = f || S.revFilter || 'all';
  const list = eid('rev-list'); if (!list) return;
  
  // 更新上方按鈕的選取狀態 (New/Practice/Mastered)
  qsa('.rev-tab').forEach(b => b.classList.toggle('on', b.dataset.f === S.revFilter));

  const lc = getLc();

  // 1. 篩選資料：考慮狀態與目前選定的主題 (Topic)
  let items = Store.getAll().filter(r => {
    const status = Prog.status(S.lang, r.id);
    const matchesFilter = S.revFilter === 'all' ? true
      : S.revFilter === 'favorite' ? Prog.isFav(S.lang, r.id)
      : status === S.revFilter;
    const matchesTopic = (S.revTopic === 'all' || r.category === S.revTopic);
    return matchesFilter && matchesTopic;
  });

  if (!items.length) {
    list.innerHTML = `<div class="rev-empty">No words here.</div>`;
    return;
  }

  // 2. 效能優化：清空列表並設定「分批載入」
  list.innerHTML = '';
  let pos = 0; 
  const CHUNK = 20; // 每次只畫 20 個字，保證 3000 字也不當機

  function _drawBatch() {
    const batch = items.slice(pos, pos + CHUNK);
    const temp = document.createElement('div');
    
    // 渲染卡片，並確保呼叫 _cleanWord(r.word) 處理 le|vin
    batch.forEach(r => { 
      temp.innerHTML += _revCardHtml(r, lc); 
    });

    // 將新卡片加入列表
    while (temp.firstElementChild) { list.appendChild(temp.firstElementChild); }
    
    pos += CHUNK;

    // 處理「顯示更多」按鈕
    const oldBtn = eid('rev-more-btn'); if (oldBtn) oldBtn.remove();
    if (pos < items.length) {
      const btn = document.createElement('button');
      btn.id = 'rev-more-btn'; 
      btn.className = 'btn-close'; 
      btn.style.cssText = 'width:100%; margin-top:15px; margin-bottom:20px;';
      btn.textContent = `Show more (${items.length - pos} left) ▾`;
      btn.onclick = _drawBatch;
      list.appendChild(btn);
    }
  }

  // 畫出第一批
  _drawBatch();
}







function _revCardHtml(r,lc){
  const hasSents=[r.sentence1,r.sentence2,r.sentence3].some(Boolean);
  const hasExtra=hasSents||r.tip;

  // 1. 高亮工具：比對原形 + forms 陣列裡所有變形（went、gone、going 等）
  function _hl(sent, w){
    if(!sent||!w) return sent||'';
    const allForms=[_getCoreWord(w),...(r.forms||[]).map(f=>_getCoreWord(f))]
      .filter(Boolean).filter((f,i,a)=>f.length>0&&a.indexOf(f)===i);
    // BUG-FIX: guard against empty alts — if no valid forms, return sentence as-is
    // to avoid building a broken regex like /(|)/ that matches every character.
    if(!allForms.length) return sent;
    const alts=allForms.map(f=>f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
    return sent.replace(new RegExp('('+alts+')','gi'),'<b>$1</b>');
  }

  // 2. 處理例句資料結構
  const sents=[
    {s:r.sentence1_hl||(lc.type==='japanese'&&r.sentence1_reading?_hl(jpRuby(r.sentence1,r.sentence1_reading),r.word):_hl(r.sentence1,r.word)), se:r.sentence1_en, ttsText: (lc.type==='japanese'?(r.sentence1_reading||r.sentence1):r.sentence1)},
    {s:lc.type==='japanese'&&r.sentence2_reading?_hl(jpRuby(r.sentence2,r.sentence2_reading),r.word):_hl(r.sentence2,r.word), se:r.sentence2_en, ttsText: (lc.type==='japanese'?(r.sentence2_reading||r.sentence2):r.sentence2)},
    {s:lc.type==='japanese'&&r.sentence3_reading?_hl(jpRuby(r.sentence3,r.sentence3_reading),r.word):_hl(r.sentence3,r.word), se:r.sentence3_en, ttsText: (lc.type==='japanese'?(r.sentence3_reading||r.sentence3):r.sentence3)},
  ].filter(x=>x.s);

  // 3. 返回最終 HTML 模板 (確保 word 部分使用了 _cleanWord)
  const isFav=Prog.isFav(r.lang,r.id);
  return `<div class="r-card" onclick="G_toggleRevCard(this)">
    <div class="r-card-toggle">
      <div style="flex:1;min-width:0;">
        <div class="r-word" dir="${lc.rtl?'rtl':'ltr'}">${lc.type==='japanese'?jpRuby(r.word,r.reading):_cleanWord(r.word)}</div>
        ${r.ipa?`<div class="r-hint">${r.ipa}</div>`:''}
        ${r.reading?`<div class="r-hint">${r.reading}${r.romaji?' · '+r.romaji:''}</div>`:''}
        <div class="r-meaning">${r.meaning||''}</div>
        ${r.zh?`<div class="r-zh">${r.zh}${r.zh_def?`<span class="r-zh-def"> — ${r.zh_def}</span>`:''}</div>`:''}
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
        <button class="r-fav${isFav?' on':''}" data-lang="${r.lang}" data-id="${r.id.replace(/"/g,'&quot;')}" onclick="event.stopPropagation();G_toggleFav(this)">${isFav?'❤️':'🤍'}</button>
        <button class="r-tts" data-word="${r.word.replace(/"/g,'&quot;')}" data-lang="${lc.ttsLang}" onclick="event.stopPropagation();TTS.say(this.dataset.word,this.dataset.lang,0.9)">🔊</button>
      </div>
    </div>
    ${hasExtra?`<div class="r-card-chevron-row"><span class="r-chev">▾</span></div>
    <div class="r-card-body">
      <div style="margin-top:10px;border-top:1.5px solid var(--border);padding-top:10px;">
        ${sents.map(x=>`
          <div class="r-sent-group" style="display:flex; align-items:center; padding-right:8px;">
            <div style="flex:1;">
              <div class="r-sent">${x.s}</div>
              ${x.se?`<div class="r-sent-trans" style="padding-bottom:6px;">${x.se}</div>`:''}
            </div>
            <button class="wc-sent-tts" style="flex-shrink:0; transform:scale(0.85); margin-bottom:4px;" 
              data-tts="${(x.ttsText||'').replace(/"/g,'&quot;')}" data-lang="${lc.ttsLang}" 
              onclick="event.stopPropagation(); TTS.say(this.dataset.tts, this.dataset.lang, 0.85)">🔊</button>
          </div>`).join('')}
        ${r.tip?`<div class="r-tip-wrap">💬 <bdi dir="ltr">${parseTipRuby(r.tip)}</bdi></div>`:''}
      </div>
    </div>`:''}
  </div>`;
}

function G_toggleRevCard(card){
  card.classList.toggle('r-open');
}

// ── UI builders ────────────────────────────────────────────
function renderCats(){
  const el=eid('cat-pills');if(!el)return;
  el.innerHTML=['all',...Store.getCats()].map(c=>
    `<button class="cat-pill${S.cat===c?' on':''}" onclick="G_setCat('${c.replace(/'/g,"\\'")}')">
      ${c==='all'?'All':c}</button>`
  ).join('');
}
function updateCatBtn(){_updateFilterBtn();}
function _updateFilterBtn(){
  const btn=eid('filter-btn');
  const lbl=eid('filter-btn-label');
  if(!btn||!lbl)return;
  const poolLabels={new:'✨ New',unfamiliar:'🔁 Practice',mastered:'🏆 Mastered',favorite:'❤️ Favorites'};
  const hasPool=S.pool!=='all';
  const hasCat=S.cats.size>0;
  let catLabel;
  if(!hasCat)               catLabel='';
  else if(S.cats.size===1)  catLabel=_catIcon([...S.cats][0])+' '+[...S.cats][0];
  else                      catLabel=S.cats.size+' topics';
  let label;
  if(S.catsCleared)         label='✕ No topics';  // Clear All — nothing selected
  else if(!hasPool&&!hasCat)     label='📂 All words';
  else if(hasPool&&!hasCat) label=poolLabels[S.pool];
  else if(!hasPool&&hasCat) label=catLabel;
  else                      label=poolLabels[S.pool]+' · '+catLabel;
  lbl.textContent=label;
  btn.className='btn-filter';
  if(S.catsCleared)         btn.classList.add('active','pool-cleared');
  else if(hasPool||hasCat)  btn.classList.add('active');
  if(S.pool==='new')        btn.classList.add('pool-new');
  if(S.pool==='unfamiliar') btn.classList.add('pool-unfamiliar');
  if(S.pool==='mastered')   btn.classList.add('pool-mastered');
  if(S.pool==='favorite')   btn.classList.add('pool-favorite');
  qsa('.fs-pool-chip').forEach(b=>b.classList.toggle('sel',b.dataset.p===S.pool));
  // Word count badge
  const wc=eid('filter-word-count');
  if(wc){
    let pool=Store.getAll();
    if(S.catsCleared) pool=[];
    else if(S.cats.size>0) pool=pool.filter(r=>S.cats.has(r.category));
    if(S.pool!=='all') pool=pool.filter(r=>S.pool==='favorite'?Prog.isFav(S.lang,r.id):Prog.status(S.lang,r.id)===S.pool);
    if(pool.length>0){
      wc.textContent=pool.length.toLocaleString();
      wc.style.display='inline-block';
    } else {
      wc.style.display='none';
    }
  }
}
function updatePoolBtn(){
  _updateFilterBtn();
}
function updateLessonMapHeader(){
  const groups=Store.getGroups(S.lang);
  const done=groups.filter(g=>g.done).length;
  const total=groups.length;
  const pct=total?Math.round(done/total*100):0;
  const lbl=eid('lm-prog-label'),fill=eid('lm-pfill');
  if(lbl)lbl.textContent=done+' / '+total+' lessons complete';
  if(fill)fill.style.width=pct+'%';
}

function updateLandingStats(){
  const st=Prog.stats(S.lang);
  // This runs after Store.load() for the active language, so the loaded catalogue is the
  // source of truth. Progress records for old/deleted IDs must never inflate this number.
  const total=Store.count();
  const seen=Math.min(total,st.mastered+st.unfamiliar);
  const pct=total?Math.round(seen/total*100):0;
  const ge=id=>document.getElementById(id);
  if(ge('l-total'))   ge('l-total').textContent=total;
  if(ge('l-mastered'))ge('l-mastered').textContent=st.mastered;
  if(ge('l-pfill'))   ge('l-pfill').style.width=pct+'%';
  if(ge('l-pct'))     ge('l-pct').textContent=pct+'%';
}

// Do not show the previous language's word count while the newly selected catalogue
// is still loading. Cached languages replace this state synchronously; first loads show
// a neutral ellipsis instead of misleading transitions such as Italian 10 -> English 1,017.
function _showLanguageLoadingState(){
  const btn=eid('filter-btn'),lbl=eid('filter-btn-label'),wc=eid('filter-word-count');
  if(btn)btn.className='btn-filter';
  if(lbl)lbl.textContent='📂 All words';
  if(wc){wc.textContent='';wc.style.display='none';}
  const total=eid('l-total'),mastered=eid('l-mastered'),pct=eid('l-pct'),fill=eid('l-pfill');
  if(total)total.textContent='…';
  if(mastered)mastered.textContent='…';
  if(pct)pct.textContent='…';
  if(fill)fill.style.width='0%';
}
const LANG_CODE={finnish:'FI',french:'FR',spanish:'ES',italian:'IT',hebrew:'HE',japanese:'JP',english_ielts:'EN',german:'DE'};
function updateLangBtn(){
  const lc=LC[S.lang];
  const el=eid('cur-lang');if(!el)return;
  const flagEl=el.querySelector('.blsw-flag');
  const codeEl=el.querySelector('.blsw-code');
  if(flagEl) flagEl.textContent=lc.flag||'🌐';
  if(codeEl) codeEl.textContent=LANG_CODE[S.lang]||lc.name.slice(0,2).toUpperCase();
  if(window.Mascot) Mascot.setLanguage(S.lang);
}
function buildModeBtns(){
  const lc=LC[S.lang],el=eid('mode-btns');if(!el)return;
  el.innerHTML='';
  lc.defaultModes.forEach(id=>{
    const b=document.createElement('button');
    b.className='mode-btn'+(S.modes.includes(id)?' on':'');
    b.dataset.id=id;b.textContent=MODE_LABELS[id]||id;
    b.onclick=()=>G_toggleMode(id);
    el.appendChild(b);
  });
}
function buildLangGrid(){
  const grid=eid('lang-grid');if(!grid)return;grid.innerHTML='';
  Object.values(LC).forEach(lc=>{
    const b=document.createElement('button');
    b.className='lang-card'+(lc.id===S.lang?' on':'');
    b.innerHTML=`<span class="lc-f">${lc.flag}</span><span class="lc-n">${lc.id==='english_ielts'?'English':lc.name}</span>`;
    b.onclick=()=>G_switchLang(lc.id);
    grid.appendChild(b);
  });
}
function buildLandingLangs(){
  const row=eid('l-lang-row');if(!row)return;row.innerHTML='';
  Object.values(LC).forEach(lc=>{
    const b=document.createElement('button');
    b.className='l-lang'+(lc.id===S.lang?' sel':'');
    const code=LANG_CODE[lc.id]||lc.name.slice(0,2).toUpperCase();
    b.innerHTML=`<span class="l-lang-flag">${lc.flag}</span><span class="l-lang-code">${lc.id==='english_ielts'?'English':lc.name}</span>`;
    b.style.cssText='display:flex;flex-direction:column;align-items:center;gap:3px;';
    b.title=lc.name;
    b.onclick=()=>{
      if(lc.id===S.lang) return; // already selected, no-op
      const switchSeq=++_langSwitchSeq;
      cancelSessionBuild();
      _cancelQueuedTTS();
      TTS.stop();
      S.lang=lc.id;S.cats=new Set();S.pool='all';
      S.catsCleared=false;
      S.modes=[...lc.defaultModes];
      if(lc.id==='japanese') S.romaji=true;
      // BUG-FIX: clear lesson state on landing lang switch (mirrors G_switchLang fix)
      S.lessonGroup=null; S._viewingLessonMap=false; S._lessonAutoStart=false;
      // Reset any in-progress session so next Start uses the new language.
      S.queue=[]; S.qi=0; S.q=null;
      _showLanguageLoadingState();
      row.querySelectorAll('.l-lang').forEach(x=>x.classList.remove('sel'));
      b.classList.add('sel');

      // Ignore a callback from a language the player has already left. Store.load()
      // performs the same guard before it can replace the active catalogue.
      Store.load(lc.id, activated => {
        if(activated===false||switchSeq!==_langSwitchSeq||S.lang!==lc.id)return;
        updateLandingStats();
        updateLangBtn();
        buildLangGrid();
        updateCatBtn();
        updatePoolBtn();
        buildModeBtns();
        _syncRomajiBtn();
      });
    };
    row.appendChild(b);
  });
}
const CAT_ICONS={'Greetings':'👋','Core Phrases':'💬','Food & Drink':'🍽️','Numbers':'🔢','Colors':'🎨','Animals':'🐾','Family':'👪','Travel':'✈️','Weather':'🌤️','Body':'🧍','Time':'⏰','Work':'💼','School':'🏫','Health':'💊','Shopping':'🛒','Sports':'⚽','Nature':'🌿','Technology':'💻','Home':'🏠','Academic':'🎓','Vocabulary':'📖','Writing':'✏️','Grammar':'📐'};
function _catIcon(c){return CAT_ICONS[c]||'📂';}


function buildCatSheet(){
  const targets=[eid('cat-list')].filter(Boolean);
  if(!targets.length)return;
  const allCats=Store.getCats();
  const allWords=Store.getAll();
  const _matches=r=>{
    if(S.pool==='all') return true;
    if(S.pool==='favorite') return Prog.isFav(S.lang,r.id);
    return Prog.status(S.lang,r.id)===S.pool;
  };
  const counts={};let totalCount=0;
  allWords.forEach(r=>{
    if(_matches(r)){counts[r.category]=(counts[r.category]||0)+1;totalCount++;}
  });
  const poolKey=S.pool==='all'?'all':S.pool;
  const tint=' tint-'+poolKey;

  // Sync tab row class so inactive tab bottom borders match panel border
  const poolRow=eid('fs-pool-row');
  if(poolRow){
    poolRow.className='fs-pool-row pool-tabs-'+poolKey;
  }
  // Sync panel colour class
  const panel=eid('cat-panel');
  if(panel) panel.className='cat-panel panel-'+poolKey;
  // Sync pinned bridge colour (must always match panel)
  const bridge=eid('cat-panel-bridge');
  if(bridge) bridge.className='cat-panel-bridge bridge-'+poolKey;

  // catsCleared=true means nothing selected. S.cats empty + catsCleared=false means all selected.
  const noneSelected = S.catsCleared;
  const allSelected  = !S.catsCleared && S.cats.size===0;
  const items=allCats.map(c=>{
    const count=counts[c]||0;
    const isOn = allSelected || (!noneSelected && S.cats.has(c));
    const isEmpty=count===0;
    return `<button class="cat-item${isOn?' on':''}${tint}${isEmpty?' cat-empty-item':''}" data-cat="${c.replace(/"/g,'&quot;')}" onclick="G_toggleCat('${c.replace(/'/g,"\'")}')">
    <span class="cat-item-icon">${_catIcon(c)}</span>
    <span class="cat-item-name">${c}</span>
    <span class="cat-item-count">${isEmpty?'—':count}</span>
  </button>`;
  }).join('');

  const empty=totalCount===0?`<div class="cat-empty">No ${S.pool==='all'?'':({new:'new',unfamiliar:'practice',mastered:'mastered',favorite:'favorited'}[S.pool]+' ')}words yet</div>`:'';
  targets.forEach(t=>{t.innerHTML=items+empty;});

  // Two-button row: grey out whichever isn't applicable
  const selectBtn=eid('btn-cat-select-all');
  const clearBtn =eid('btn-cat-clear-all');
  if(selectBtn) selectBtn.disabled = allSelected;
  if(clearBtn)  clearBtn.disabled  = noneSelected;

  // Light up Done button green when selection has changed since sheet opened
  const doneBtn=eid('cats-done-btn');
  if(doneBtn&&S._catsSnapshot){
    const snap=S._catsSnapshot;
    const setsEqual=(a,b)=>a.size===b.size&&[...a].every(x=>b.has(x));
    const changed=S.catsCleared!==snap.cleared||!setsEqual(S.cats,snap.cats);
    doneBtn.classList.toggle('changed',changed);
    doneBtn.textContent=changed?'✓ Done':'Done';
  }
  updatePoolBtn();
}




function G_filterCats(q){
  const term=q.toLowerCase().trim();
  qsa('.cat-item').forEach(b=>{
    const name=(b.dataset.cat||'').toLowerCase();
    b.classList.toggle('cat-hidden',term.length>0&&!name.includes(term));
  });
}
function G_setCatPool(p){
  SFX.click();
  S.pool=p;
  updatePoolBtn();
  startSession();
}
