/* ─── PUBLIC ACTIONS ──────────────────────────────────────── */
function G_cyclePool(){
  SFX.click();
  const order=['all','new','unfamiliar','mastered'];
  const next=order[(order.indexOf(S.pool)+1)%order.length];
  S.pool=next;
  _updatePoolCycleBtn();
  startSession();
}
function _updatePoolCycleBtn(){
  const btn=eid('pool-cycle-btn');if(!btn)return;
  const map={
    all:  {label:'📚 All',   cls:''},
    new:  {label:'✨ New',   cls:'is-new'},
    unfamiliar:{label:'🔁 Practice',cls:'is-unfamiliar'},
    mastered:  {label:'🏆 Mastered',  cls:'is-mastered'}
  };
  const {label,cls}=map[S.pool]||map.all;
  btn.textContent=label;
  btn.className='btn-pool-cycle'+(cls?' '+cls:'');
}
function G_landingPool(p, btn){
  SFX.click(); S.pool=p;
  // Update all mastery chip groups (landing + filter sheet)
  document.querySelectorAll('.l-mchip').forEach(b=>b.classList.toggle('sel',b.dataset.p===p));
  updateLandingStats();
  G_updateFilterChips();
}
function G_updateFilterChips(){
  const labels={all:'📚 All',new:'✨ New',unfamiliar:'🔁 Practice',mastered:'🏆 Mastered'};
  const chip=eid('filter-pool-chip');
  if(chip){
    chip.textContent=labels[S.pool]||'📚 All';
    chip.classList.toggle('all',S.pool==='all');
  }
  const catChip=eid('filter-cat-chip');
  if(catChip){
    if(S.cat==='all'){catChip.style.display='none';}
    else{catChip.style.display='';catChip.textContent='📂 '+S.cat;}
  }
  // Sync landing category button
  const lBtn=eid('l-cat-btn'); const lText=eid('l-cat-btn-text');
  if(lText)lText.textContent=S.cat==='all'?'All categories':S.cat;
  if(lBtn)lBtn.classList.toggle('active',S.cat!=='all');
  // Sync landing pool chips
  document.querySelectorAll('.l-mchip').forEach(b=>b.classList.toggle('sel',b.dataset.p===S.pool));
}
function G_leaveResume(){
  SFX.click();
  const strip=eid('game-strip');if(strip)strip.style.display='flex';
  _updateGameStrip();
  if(S.q&&S.phase!=='done'){renderQ(S.q);}
  else if(S.qi<S.queue.length){loadQ();}
  else{showComplete();}
}
function G_leaveAndReady(){
  // Build a fresh queue and show the ready screen (not skip it)
  SFX.click();
  _resetSessionDisplay();
  startSession(true);
}
function G_leaveAndNew(){
  SFX.click();
  _resetSessionDisplay();
  startSession(true);
}
function G_goHome(){
  SFX.click();_cancelQueuedTTS();TTS.stop();
  S.lessonGroup=null;
  updateLandingStats();
  buildLandingLangs();
  eid('scr-game').classList.add('hidden');
  eid('scr-landing').classList.remove('hidden');
}
function G_tab(t){
  SFX.click();_cancelQueuedTTS();TTS.stop();
  qsa('.g-tab').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  qsa('.g-panel').forEach(p=>p.classList.toggle('on',p.id==='panel-'+t));
  const sg=eid('subbar-game'),sr=eid('subbar-review'),bb=eid('bot-bar');
  if(sg)sg.style.display=t==='play'?'contents':'none';
  if(sr)sr.style.display=t==='review'?'contents':'none';
  if(bb)bb.style.display=t==='review'?'none':'flex';
  if(t==='review'){_updateRevTopicBtn();buildRevTopics();renderReview(S.revFilter);}
}
function _resetSessionDisplay(){
  S.goal=0;S.score={ok:0,no:0};
  const strip=eid('game-strip');if(strip)strip.style.display='none';
}
function G_toggleCat(c){
  SFX.click();
  if(S.catsCleared){
    // After Clear All, first tap starts a fresh explicit selection (not additive to sentinel)
    S.catsCleared=false;
    S.cats=new Set([c]);
  } else if(S.cats.size===0){
    // All-selected state — tapping one topic means "only this topic"
    S.cats=new Set([c]);
  } else {
    if(S.cats.has(c)) S.cats.delete(c);
    else S.cats.add(c);
  }
  updateCatBtn();buildCatSheet();_resetSessionDisplay();startSession();
}
function G_setCat(c){
  // legacy single-select helper
  SFX.click();
  S.cats=c==='all'?new Set():new Set([c]);
  updateCatBtn();buildCatSheet();_resetSessionDisplay();startSession();
}
function G_selectAllCats(){
  SFX.click();
  S.cats=new Set(); // empty = all topics
  S.catsCleared=false;
  updateCatBtn();buildCatSheet();_resetSessionDisplay();startSession();
}
function G_clearAllCats(){
  SFX.click();
  S.cats=new Set(); // doesn't matter — catsCleared drives render
  S.catsCleared=true;
  updateCatBtn();buildCatSheet();_resetSessionDisplay();startSession();
}
function G_setPool(p){
  SFX.click();S.pool=p;
  // Reset topic selection to all when switching tabs — avoids stale cross-tab selection
  S.cats=new Set();
  S.catsCleared=false;
  updatePoolBtn();
  buildCatSheet();
  S.goal=0; S.score={ok:0,no:0}; renderProg();
  startSession();
}
function G_toggleMode(id){
  // BUG-FIX (silent mode chip): the Question Modes overlay's chips had no SFX at all.
  SFX.click();
  const lc=LC[S.lang];if(!lc.defaultModes.includes(id))return;
  const i=S.modes.indexOf(id);
  if(i>=0){if(S.modes.length<=1){toast('Keep at least one mode.');return;}S.modes.splice(i,1);}
  else S.modes.push(id);
  qsa('.mode-btn').forEach(b=>b.classList.toggle('on',S.modes.includes(b.dataset.id)));
  startSession();
}
function _syncRomajiBtn(){
  const btn=eid('btn-romaji-toggle');if(!btn)return;
  const isJP=S.lang==='japanese';
  btn.style.display=isJP?'flex':'none';
  if(isJP){
    btn.classList.toggle('on',S.romaji);
    const thumb=btn.querySelector('.romaji-thumb');
    if(thumb) thumb.style.left=S.romaji?'14px':'2px';
  }
}
function G_switchLang(id){
  SFX.click();
  if(id===S.lang){G_closeOv('ov-lang');return;}

  const switchSeq=++_langSwitchSeq;
  cancelSessionBuild();
  _cancelQueuedTTS();
  TTS.stop();

  S.lang=id;S.cats=new Set();S.catsCleared=false;S.pool='all';
  // Always use the new language's full default modes — prevents blank screen
  S.modes=[...LC[id].defaultModes];
  // Reset romaji to ON whenever switching to Japanese
  if(id==='japanese') S.romaji=true;
  // BUG-FIX: clear lesson state on lang switch to prevent _doStartSession guard blocking
  S.lessonGroup=null; S._viewingLessonMap=false; S._lessonAutoStart=false;
  S.queue=[];S.qi=0;S.q=null;
  G_closeOv('ov-lang');

  // Show loading indicator while vocab file fetches
  const area=eid('q-area');
  if(area) area.innerHTML='<div style="text-align:center;padding-top:60px;color:#A0A6BF;font-weight:700;font-size:1.1em;">Loading vocabulary… 📚</div>';

  updateLangBtn();
  _showLanguageLoadingState();
  buildModeBtns();buildLangGrid();
  _syncRomajiBtn();
  // BUG-FIX: updateLandingStats() was called here (before Store.load() callback),
  // so _langTotals[id] hadn't been set yet → showed 0 words on language switch.
  // Moved inside the onReady callback below so it always runs after _langTotals is set.

  // BUG-FIX (race condition): Store.load() is async — vocab file may not yet be parsed
  // when startSession() was called on the next line. Pass onReady callback so
  // startSession() only fires after the full vocab array is loaded and processed.
  Store.load(id, activated => {
    if(activated===false||switchSeq!==_langSwitchSeq||S.lang!==id)return;
    updateCatBtn();updatePoolBtn();
    updateLandingStats();
    G_tab('play');
    startSession(true);
  });
}
function _updateRevTopicBtn(){
  const btn=eid('rev-topic-btn');if(!btn)return;
  btn.className='btn-filter';
  if(S.revFilter==='new')             btn.classList.add('pool-new');
  else if(S.revFilter==='unfamiliar') btn.classList.add('pool-unfamiliar');
  else if(S.revFilter==='mastered')   btn.classList.add('pool-mastered');
  else if(S.revFilter==='favorite')   btn.classList.add('pool-favorite');
  else                                btn.classList.add('pool-all');
}
function G_revFilter(f){
  SFX.click();
  S.revFilter=f;
  qsa('.rev-tab').forEach(b=>b.classList.toggle('on',b.dataset.f===f));
  _updateRevTopicBtn();
  renderReview(f);
}
function G_toggleFav(btn){
  SFX.click();
  const {lang,id}=btn.dataset;
  const on=Prog.toggleFav(lang,id);
  btn.classList.toggle('on',on);
  btn.textContent=on?'❤️':'🤍';
  // If viewing the Favorites tab, drop the card immediately on un-favorite
  if(S.revFilter==='favorite'&&!on) renderReview('favorite');
  // Keep word-count badges / topic sheet counts in sync if they're on screen
  if(typeof updatePoolBtn==='function') updatePoolBtn();
}
function G_setRevTopic(cat){
  SFX.click();
  S.revTopic=cat;
  const lbl=eid('rev-topic-label');

  if(lbl)lbl.textContent=cat==='all'?'📂 All topics':_catIcon(cat)+' '+cat;

  const btn=eid('rev-topic-btn');
  if(btn)btn.classList.toggle('active',cat!=='all');
  G_closeOv('ov-topic');
  _updateRevTopicBtn();
  buildRevTopics();
  renderReview(S.revFilter);
}
// Same stale-language race as renderReview() in engine_render.js — own counter so a
// newer call (new filter tap, new language) cleanly supersedes a pending retry.
let _revTopicsBuildSeq = 0;
function buildRevTopics(){
  const el=eid('rev-cat-list');if(!el)return;

  if(!Store.isLoadedFor(S.lang)){
    el.innerHTML='<div class="cat-item cat-all"><span class="cat-item-name">Loading…</span></div>';
    const seq=++_revTopicsBuildSeq;
    setTimeout(()=>{ if(seq===_revTopicsBuildSeq) buildRevTopics(); },50);
    return;
  }
  _revTopicsBuildSeq++; // invalidate any retry queued before this real build

  const cats=Store.getCats();
  const allWords=Store.getAll();

  // BUG-FIX: Store.count() returns current language's count but may be stale during
  // language switches. Use Prog.stats() total (derived from _langTotals) instead.
  const _st=Prog.stats(S.lang);
  const _total=_st.new+_st.unfamiliar+_st.mastered;
  const allItem=`<div class="cat-item cat-all${S.revTopic==='all'?' on':''}" onclick="G_setRevTopic('all')"><span class="cat-item-icon">📂</span><span class="cat-item-name">All topics</span><span class="cat-item-count">${_total} words</span></div>`;


  const catItems=cats.map(c=>{
    const count=allWords.filter(r=>r.category===c).length;
    return `<div class="cat-item${S.revTopic===c?' on':''}" onclick="G_setRevTopic('${c.replace(/'/g,"\\'")}')"><span class="cat-item-icon">${_catIcon(c)}</span><span class="cat-item-name">${c}</span><span class="cat-item-count">${count}</span></div>`;
  }).join('');
  el.innerHTML=allItem+catItems;
}
function G_openOv(id){
  SFX.click();
  if(id==='ov-settings'){const box=eid('xp-box');if(box)box.value='';}
  if(id==='ov-modes'){buildModeBtns();}
  if(id==='ov-cats'){
    // Snapshot state so Done button can detect changes
    S._catsSnapshot={cats:new Set(S.cats),cleared:S.catsCleared};
    buildCatSheet();
  }
  eid(id)?.classList.add('on');
}
function G_closeOv(id){
  // NOTE: deliberately no SFX.click() here — several callers (G_switchLang,
  // G_doReset, G_setRevTopic) already play their own click before reaching this,
  // and two HTML buttons chain straight into G_openOv() which also plays one.
  // Adding a click here would double-fire in those cases. The genuinely silent
  // call sites (backdrop-tap-to-dismiss + standalone Close/Done/Cancel buttons)
  // get SFX.click() added at the call site in index.html instead — see there.
  if(id==='ov-cats') S._catsSnapshot=null; // clear snapshot on close
  eid(id)?.classList.remove('on');
}
function G_exportProgress(){
  SFX.click();const code=Prog.exportCode();
  const box=eid('xp-box');if(box)box.value=code;
  if(navigator.clipboard&&code)
    navigator.clipboard.writeText(code).then(()=>toast('Copied! ✓')).catch(()=>toast('Select text and copy manually.'));
  else toast('Select all text above and copy.');
}
function G_importProgress(){
  SFX.click();const box=eid('xp-box');if(!box)return;
  const code=box.value.trim();
  if(!code){toast('Paste your code first.');return;}
  if(Prog.importCode(code)){toast('Imported! ✓');updateLandingStats();}
  else toast('Invalid code.');
}
function G_speakNow(){
  SFX.click();const q=S.q;if(!q||!q.tts)return;
  _cancelQueuedTTS(); // a manual tap must not be interrupted by an older auto-play timer
  TTS.say(q.tts,LC[S.lang].ttsLang,['listeningWord','listeningSentence'].includes(q.mode)?0.85:0.9);
}
// Called by TTS when audio finishes in listeningWord mode — unlocks MC buttons
function G_unlockListenMC(){
  // BUG FIX (mc-locked bypass): buttons were rendered with disabled=true to block G_onMC.
  // Must remove both the CSS class AND the disabled attribute to make them interactive.
  qsa('.mc-locked').forEach(b=>{
    b.classList.remove('mc-locked');
    b.disabled=false;
  });
  const hint=eid('listen-word-hint');
  if(hint)hint.textContent='Pick the word you heard';
}
function G_toggleRomaji(){
  SFX.click();
  S.romaji=!S.romaji;
  // Sync subbar toggle button
  const btn=eid('btn-romaji-toggle');
  if(btn){
    btn.classList.toggle('on',S.romaji);
    const thumb=btn.querySelector('.romaji-thumb');
    if(thumb) thumb.style.left=S.romaji?'14px':'2px';
  }
  // Update in-place without re-rendering — avoids jump
  const introRomaji=document.querySelector('.intro-romaji');
  if(introRomaji) introRomaji.style.display=S.romaji?'':'none';
  const pronEl=document.querySelector('.wc-pron');
  if(pronEl) pronEl.style.display=S.romaji?'':'none';
  // Toggle romaji labels on kana spelling tiles (bank) and filled slots
  const disp=S.romaji?'':'none';
  qsa('.ct-tile-label').forEach(el=>el.style.display=disp);
  qsa('.ct-slot-rom').forEach(el=>el.style.display=disp);
}
function G_playSentTts(btn){SFX.click();_cancelQueuedTTS();TTS.say(btn.dataset.tts,btn.dataset.lang,0.85);}
function G_toggleSent(btn){
  SFX.click();
  const body=btn.nextElementSibling;
  const open=btn.getAttribute('aria-expanded')==='true';
  btn.setAttribute('aria-expanded',String(!open));
  body.classList.toggle('open',!open);
  btn.textContent=open?'📖 Example':'📖 Hide';
}
function G_doReset(){SFX.click();Prog.reset();S.introSeen=new Set();S.lessonGroup=null;S._viewingLessonMap=false;S._lessonAutoStart=false;G_closeOv('ov-reset');updateLandingStats();startSession();toast('Progress reset.');}



/* ─── INTERSTITIAL ACTIONS ───────────────────────────────── */
function G_continueFromInterstitial(){
  SFX.click();
  _cancelQueuedTTS();       // BUG-FIX: if tapped inside the 550ms auto-pronounce delay,
  TTS.stop();               // the pending timer would otherwise fire late and speak the
                             // old idiom over the next (already-rendered) question.
  // Re-prime from this real tap if iOS revoked audio permission, but NEVER wait for it:
  // the question UI must continue even if Safari leaves play() pending.
  try{void TTS.unlock(LC[S.lang].ttsLang);}catch(e){}
  // Restore bot-bar and game-strip, then render the queued question
  const bb=eid('bot-bar'); if(bb) bb.style.display='flex';
  const strip=eid('game-strip');
  if(strip&&S.goal>0) strip.style.display='flex';
  _updateGameStrip();
  if(S.q) renderQ(S.q);
}

/* ─── LESSON MAP ACTIONS ─────────────────────────────────── */
function G_openLessonMap(){
  SFX.click();
  S._viewingLessonMap=true;
  const strip=eid('game-strip'); if(strip) strip.style.display='none';
  const bb=eid('bot-bar'); if(bb) bb.style.display='none';
  const sb=eid('g-subbar'); if(sb) sb.style.display='none';
  if(typeof updateLessonMapHeader==='function') updateLessonMapHeader();
  buildLessonMap();
}
function G_closeLessonMap(){
  SFX.click();
  S.lessonGroup=null;
  S._viewingLessonMap=false; // BUG-FIX: must clear BEFORE startSession or guard blocks it
  const bb=eid('bot-bar'); if(bb) bb.style.display='flex';
  const sb=eid('g-subbar'); if(sb) sb.style.display='';
  startSession();
}
function G_startLesson(groupNum){
  SFX.click();
  S.lessonGroup=groupNum;
  S._viewingLessonMap=false; // BUG-FIX: clear map view flag before startSession fires
  S.cats=new Set(); S.catsCleared=false; S.pool='all';
  S.modes=[...LC[S.lang].defaultModes];
  S.goal=0; S.score={ok:0,no:0};
  S._lessonAutoStart=true;
  const bb=eid('bot-bar'); if(bb) bb.style.display='flex';
  const sb=eid('g-subbar'); if(sb) sb.style.display='';
  // G_tab() intentionally stops old audio, so it MUST run before unlock(). The previous
  // order started the iOS unlock and immediately cancelled it with G_tab()->TTS.stop().
  G_tab('play');
  try{void TTS.unlock(LC[S.lang].ttsLang);}catch(e){}
  startSession(true);
}
function buildLessonMap(){
  const area=eid('q-area'); if(!area)return;
  const groups=Store.getGroups(S.lang);
  const done=groups.filter(g=>g.done).length;
  const total=groups.length;
  const pct=total?Math.round(done/total*100):0;

  if(!groups.length){
    area.innerHTML='<div style="text-align:center;padding:40px;color:var(--ink3);">Loading…</div>';
    return;
  }

  const offsets=[16,36,56,72,56,36,16,8];
  const dotRows=groups.map((g,i)=>{
    const off=offsets[i%offsets.length];
    const statusCls=g.done?'lg-done':g.inProgress?'lg-active':'lg-locked';
    const lbl=g.done?'✓':String(g.group);
    const pct2=g.total?Math.round(g.mastered/g.total*100):0;
    const ring=g.inProgress
      ?`<svg class="lg-ring" viewBox="0 0 44 44"><circle cx="22" cy="22" r="19" stroke-dasharray="${Math.round(pct2*1.195)} 120"/></svg>`:'';
    const connector=i<groups.length-1
      ?`<div class="lg-connector${g.done?' lg-conn-done':''}" style="margin-left:${off+20}px"></div>`:'';
    return `<div class="lg-row" style="padding-left:${off}px">
      <button class="lg-dot ${statusCls}" onclick="G_startLesson(${g.group})">${lbl}${ring}</button>
      <span class="lg-label">Lesson ${g.group}<span class="lg-sub">${g.mastered}/${g.total}</span></span>
    </div>${connector}`;
  }).join('');

  area.innerHTML=`<div class="lm-wrap">
    <div class="lm-topbar">
      <button class="lm-back-btn" onclick="G_closeLessonMap()">← Back</button>
      <div class="lm-prog-label">${done} / ${total} complete</div>
    </div>
    <div class="prog-track" style="margin:0 16px 16px"><div class="prog-fill" style="width:${pct}%"></div></div>
    <div class="lesson-map-list">${dotRows}</div>
  </div>`;
}

/* ─── BOOT ────────────────────────────────────────────────── */
// BUG-FIX #122 (iOS AudioContext suspension): iOS Safari suspends AudioContext when
// the user backgrounds the app. visibilitychange/pageshow/focus fire on return.
// resumeCtx() un-suspends the AudioContext; resetIfStuck() clears any stuck isPlaying flag.
(function(){
  function _onFg(){
    try{SFX.resumeCtx();}catch{}
    setTimeout(()=>{try{TTS.resetIfStuck();}catch{}},300);
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)_onFg();});
  window.addEventListener('pageshow',e=>{if(e.persisted)_onFg();}); // bfcache restore
  window.addEventListener('focus',_onFg); // desktop tab focus
})();

document.addEventListener('DOMContentLoaded',()=>{
  console.log('game.js loaded: VocabGame Engine v5 - intro+hint');
  Prog.load();
  S.lastSessionWords = Prog.loadLastSession(); // BUG-6 FIX: restore SRS spacing after reload
  const lc=LC[S.lang];
  S.modes=[...lc.defaultModes];
  // BUG-FIX (race condition): use onReady callback to ensure UI builds only after
  // vocab data is fully loaded. In normal operation the default vocab_<lang>.js is
  // pre-loaded via <script> tag so this fires synchronously. In split-file or slow
  // network scenarios it ensures btn-go never fires against an empty word store.
  Store.load(S.lang, () => {
    buildLandingLangs();buildLangGrid();buildModeBtns();
    updateLangBtn();updateCatBtn();updatePoolBtn();_updateFilterBtn();updateLandingStats();
    _syncRomajiBtn();
  });
  eid('btn-go').onclick=()=>{
    SFX.click();
    eid('scr-landing').classList.add('hidden');
    eid('scr-game').classList.remove('hidden');
    // FIX (Aug 2026, standalone-PWA bottom gap): the cold-launch heal burst in
    // index.html only ever touches #scr-landing, since that's what's visible
    // when it runs — #scr-game wasn't on screen yet at that point, and by the
    // time the user gets here it never got its own layout recompute. Same fix,
    // just re-triggered now that #scr-game is the element actually visible.
    if(window.__dlog) window.__dlog('btn-go: isStandalonePWA=' + window.isStandalonePWA + ', healScreenLayout=' + (typeof window.healScreenLayout));
    if(window.isStandalonePWA && window.healScreenLayout){
      setTimeout(window.healScreenLayout, 50);
    }
    // BUG-FIX (stale tab across language switch): if the user left off on the Review
    // tab for a previous language, G_goHome() never resets tab state, so re-entering
    // via btn-go would show review's leftover DOM/CSS state for the OLD language until
    // the user manually clicked a tab. Starting a session should always land on Play.
    G_tab('play');
    startSession(true);
  };
});
