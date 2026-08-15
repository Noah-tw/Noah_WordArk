/* ─── APP STATE ───────────────────────────────────────────── */
// BUG FIX (TTS desync): global timer handle so rapid Next/Skip clicks can cancel
// any pending audio from a skipped question before scheduling new audio.
let _qTtsTimer = null;
function _cancelQueuedTTS(){
  if(_qTtsTimer!==null)clearTimeout(_qTtsTimer);
  _qTtsTimer=null;
}
function _scheduleQueuedTTS(fn,delay){
  _cancelQueuedTTS();
  _qTtsTimer=setTimeout(()=>{
    _qTtsTimer=null;
    fn();
  },delay);
}

const S = {
  lang:'finnish', cats:new Set(), catsCleared:false, pool:'all', 
  get cat(){return this.cats.size===0?'all':[...this.cats][0];}, 
  set cat(v){this.cats=v==='all'?new Set():new Set([v]);},
  modes:['definition','matching','blank','sentenceTiles','listening'],
  romaji:true, // JP: show romaji by default, user can toggle off
  lessonGroup:null, // null=free play; Number=locked to this group
  _interstitialCount:0, // tracks questions since last interstitial card
  queue:[],qi:0,q:null,
  goal: 0,
  score:{ok:0,no:0},


  introSeen:new Set(),
  lastSessionWords: new Set(),
  freshCount: 0,
  fromRound: false,
  statsSnapshot: null,



  // 'waiting' = accepting input. 'done' = question finished, waiting Next tap.
  // We NEVER set to 'wrong' mid-question — that blocked tile taps.
  phase:'waiting',
  // Character tile state
  ct:{ slots:[], bank:[], wrongCount:0 },
  // Sentence tile state
  st:{ placed:[], avail:[] },
  // Matching state
  mt:{ sel:null, hit:[], wrong:[] },
  // Review filter state (independent from game pool/cats)
  revFilter:'all',
  revTopic:'all'
};

/* ─── ENGINE ──────────────────────────────────────────────── */
let _sessionTimer=null;
// Both counters invalidate work that was started for an older UI state. Language
// switches are asynchronous, and queue construction also yields with setTimeout(0),
// so either one can otherwise finish late and overwrite the current language's screen.
let _langSwitchSeq=0;
let _sessionBuildSeq=0;

function cancelSessionBuild(){
  _sessionBuildSeq++;
  clearTimeout(_sessionTimer);
  _sessionTimer=null;
}

function startSession(immediate){
  const buildSeq=++_sessionBuildSeq;
  clearTimeout(_sessionTimer);
  _sessionTimer=null;
  if(immediate){_doStartSession(buildSeq);return;}
  _sessionTimer=setTimeout(()=>{
    _sessionTimer=null;
    _doStartSession(buildSeq);
  },180);
}
function G_playAgain(){
  S.fromRound=true; // badge should show on the upcoming ready screen
  // BUG FIX (stale game-strip): reset qi and score before startSession so that
  // _updateGameStrip() never briefly shows the previous round's values (e.g. "31/30")
  // between G_playAgain() and the first loadQ() of the new round.
  S.qi=0;
  S.score={ok:0,no:0};
  startSession();
}
function _doStartSession(buildSeq){
  if(buildSeq!==_sessionBuildSeq)return;
  // If user is viewing lesson map, don't overwrite q-area with ready/empty screen.
  // Lesson map manages q-area itself; startSession() is a no-op while it's open.
  if(S._viewingLessonMap) return;

// 1. 立刻把舊的進度條藏起來
  const strip = eid('game-strip'); 
  if(strip) strip.style.display = 'none';

  // 2. 把題目區清空，讓使用者看到畫面有在變
  const area = eid('q-area');
  if(area) area.innerHTML = '<div style="text-align:center; padding-top:50px; color:#A0A6BF;">Loading...</div>';


  S.introSeen=new Set();
  S.phase='waiting';
  const buildLang=S.lang;
  const fromRound=S.fromRound; // capture before resetting
  S.fromRound=false;
  const lc=LC[S.lang];
  let valid=S.modes.filter(m=>lc.defaultModes.includes(m));
  if(!valid.length){S.modes=[...lc.defaultModes];valid=[...lc.defaultModes];}
  let pool=Store.getAll();
  // BUG-18 NOTE (intentional behaviour, documented): _usedSentInSession lives on the
  // record objects returned by Store.getAll(). It is reset here at every session start
  // so sentence rotation is fresh each round. On language switch, Store.load() replaces
  // all records anyway, so cross-language contamination is impossible. This is correct —
  // do not persist _usedSentInSession; per-session rotation is the intended behaviour.
  pool.forEach(r=>{r._usedSentInSession=null;});
  if(S.catsCleared) pool=[];                                    // Clear All = no words
  else if(S.cats.size>0) pool=pool.filter(r=>S.cats.has(r.category)); // specific topics
  if(S.pool!=='all')pool=pool.filter(r=>S.pool==='favorite'?Prog.isFav(S.lang,r.id):Prog.status(S.lang,r.id)===S.pool);
  // LESSON MODE: restrict pool to this group's words only
  if(S.lessonGroup!==null) pool=Store.getAll().filter(r=>r._group===S.lessonGroup);
  if(!pool.length){toast('No words here. Try "All Words".');showEmpty();return;}
  // Build queue in background, then show ready screen
  setTimeout(()=>{
    if(buildSeq!==_sessionBuildSeq||S.lang!==buildLang)return;
    S.queue=buildQueue(pool,valid,pool,lc);
    S.qi=0;S.score={ok:0,no:0};
    S.goal=S.queue.length;
    S.statsSnapshot=Prog.stats(buildLang); // snapshot before round for end-of-round delta
    if(!S.queue.length){S._lessonAutoStart=false;toast('Enable more question modes.');return;}
    // LESSON AUTO-START: skip ready screen and go straight into the round
    if(S._lessonAutoStart){
      S._lessonAutoStart=false;
      // Hide bottom bar buttons until G_startRound shows them
      const _bb=eid('btn-next'),_bs=eid('btn-skip'),_bh=eid('btn-hint');
      if(_bb)_bb.style.display='none';
      if(_bs)_bs.style.display='none';
      if(_bh)_bh.style.display='none';
      G_startRound();
      return;
    }
    showReadyScreen(pool, fromRound);
  },0);
}

function _buildLessonCardHtml(){
  const groups=Store.getGroups(S.lang);
  const totalGroups=groups.length;
  const doneGroups=groups.filter(g=>g.done).length;
  // Guard: vocab not yet loaded — show a minimal placeholder card
  if(!totalGroups) return `<div class="ready-card-wrap lesson-wrap" onclick="G_openLessonMap()">
    <div class="ready-card-inner">
      <div class="ready-topic-label">Lessons</div>
      <div class="ready-title">By<br>Curriculum</div>
      <div class="ready-lesson-cta">View Map →</div>
    </div>
  </div>`;
  const curGroup=groups.find(g=>g.inProgress)||groups.find(g=>!g.done)||groups[groups.length-1];
  const curIdx=curGroup?groups.indexOf(curGroup):0;
  const previewStart=Math.max(0,curIdx-1);
  const previewGroups=groups.slice(previewStart,previewStart+3);
  const dotOffsets=[0,10,18];
  const mapDots=previewGroups.map((g,i)=>{
    const isCur=curGroup&&g.group===curGroup.group;
    const cls=g.done?'rmap-dot done':isCur?'rmap-dot cur':'rmap-dot lock';
    const lbl=g.done?'✓':String(g.group);
    const off=dotOffsets[i]||0;
    const line=i<previewGroups.length-1?`<div class="rmap-line" style="margin-left:${off+13}px"></div>`:'';
    return `<div class="rmap-row" style="padding-left:${off}px"><div class="${cls}">${lbl}</div><span class="rmap-txt">L${g.group}</span></div>${line}`;
  }).join('');
  return `<div class="ready-card-wrap lesson-wrap" onclick="G_openLessonMap()">
    <div class="ready-card-inner">
      <div class="ready-topic-label">${totalGroups} lessons total</div>
      <div class="ready-title">By<br>Curriculum</div>
      <div class="ready-round-count">
        <span class="lesson-progress">${doneGroups}</span>
        <span class="ready-round-lbl">&nbsp;done</span>
      </div>
      <div class="rmap-preview">${mapDots}</div>
      <div class="ready-lesson-cta">View Map →</div>
    </div>
  </div>`;
}

function showReadyScreen(pool, fromRound=false){
  _cancelQueuedTTS();
  TTS.stop();
  // Hide game strip
  const strip=eid('game-strip');if(strip)strip.style.display='none';
  // Hide bottom bar buttons
  const btnNext=eid('btn-next'),btnSkip=eid('btn-skip'),btnHint=eid('btn-hint');
  if(btnNext)btnNext.style.display='none';
  if(btnSkip)btnSkip.style.display='none';
  if(btnHint)btnHint.style.display='none';

  // Build info for pills
  const totalPool=pool.length;
  const roundQuestions=S.goal;
  // S.goal is the number of QUESTIONS, not words. Matching inserts extra questions,
  // so 10 real words can legitimately produce 12 questions. Count unique IDs separately.
  const roundIds=new Set();
  S.queue.forEach(item=>{
    if(item.wordId!=null)roundIds.add(String(item.wordId));
    if(Array.isArray(item.wordIds))item.wordIds.forEach(id=>roundIds.add(String(id)));
  });
  const roundWords=roundIds.size||Math.min(totalPool,roundQuestions);
  const roundNew=[...roundIds].filter(id=>Prog.status(S.lang,id)==='new').length;
  const roundReview=Math.max(0,roundWords-roundNew);

  // Category label
  const catLabel=S.cats.size===1?_catIcon([...S.cats][0])+' '+[...S.cats][0]
    :S.cats.size>1?S.cats.size+' topics'
    :'All words';

  const showBadge = fromRound;

  const area=eid('q-area');if(!area)return;
  area.innerHTML=`<div class="ready-dual">
  <div class="ready-card-wrap random-wrap">
    <div class="ready-card-inner">
      <div class="ready-topic-label">${catLabel} · ${totalPool.toLocaleString()} words</div>
      <div class="ready-title">Free<br>Practice</div>
      <div class="ready-round-count"><span class="ready-round-num">${roundWords}</span><span class="ready-round-lbl"> words</span></div>
      <div class="ready-question-count">${roundQuestions} questions this round</div>
      <div class="coin-outer" onclick="G_startRound()">
        ${showBadge?`<span class="coin-fresh-badge">New mix!</span>`:''}
        <div class="coin-inner">
          <div class="coin-edge"></div>
          <div class="coin-face${showBadge?' coin-fresh':''}">
            <div class="coin-tri">
              <svg width="54" height="54" viewBox="0 0 54 54" fill="none">
                <path d="M13 7.5C13 5.1 15.6 3.6 17.7 4.8L43.7 20.3C45.8 21.5 45.8 24.5 43.7 25.7L17.7 41.2C15.6 42.4 13 40.9 13 38.5V7.5Z" fill="white"/>
              </svg>
            </div>
            <span class="coin-lbl">Start</span>
          </div>
        </div>
      </div>
      <div class="ready-pills">
        ${roundNew>0?`<span class="ready-pill blue">${roundNew} new`+`</span>`:''}
        ${roundReview>0?`<span class="ready-pill">${roundReview} review`+`</span>`:''}
      </div>
    </div>
  </div>
  ${_buildLessonCardHtml()}
</div>`;
}

function G_startRound(){
  // Unlock the SAME persistent Google-TTS player used by all later automatic audio.
  // IMPORTANT: never await this on iPhone. Safari can leave play() pending, but the
  // question UI must load immediately. loadQ(true) preserves this in-flight unlock.
  try{void TTS.unlock(LC[S.lang].ttsLang);}catch(e){}
  // BUG-FIX: coin button = Random mode. Clear lesson lock so pool is unrestricted.
  S.lessonGroup=null;
  SFX.pop();
  // Show game strip
  const strip=eid('game-strip');
  if(strip)strip.style.display='flex';
  _updateGameStrip();
  loadQ(true);
}

function _updateGameStrip(){
  const frac=eid('gs-frac');
  const fill=eid('gs-bar-fill');
  if(frac) frac.textContent=(S.qi+1)+' / '+S.goal;
  if(fill) fill.style.width=(S.goal?Math.round((S.qi/S.goal)*100):0)+'%';
}

// ── Stats delta — what actually moved this round ────────────
function _statsDeltaHtml(){
  const before=S.statsSnapshot;
  const after=Prog.stats(S.lang);
  if(!before) return '';
  const gained=after.mastered-before.mastered; // words promoted to mastered
  const lost=before.mastered-after.mastered;   // words dropped from mastered (rare)
  if(gained<=0&&lost<=0) return '';
  const parts=[];
  if(gained>0) parts.push(`<span class="delta-gained">+${gained} mastered 🏆</span>`);
  if(lost>0)   parts.push(`<span class="delta-lost">${lost} need more practice</span>`);
  return `<div class="cc-delta">${parts.join(' · ')}</div>`;
}

function G_endRound(){
  SFX.click();_cancelQueuedTTS();TTS.stop();
  // Just show the results — same as finishing naturally.
  // The only extra affordance is a small "go back" link if they tapped by accident.
  const canResume=S.q&&S.qi<S.queue.length;
  SFX.done();
  const strip=eid('game-strip');if(strip)strip.style.display='none';
  const st=Prog.stats(S.lang);
  const pct=S.goal?Math.round(S.score.ok/S.goal*100):0;
  const area=eid('q-area');if(!area)return;
  area.innerHTML=`<div class="cc">
    <div class="cc-emo">${pct>=80?'🏆':pct>=50?'⭐':'💪'}</div>
    <div class="cc-title">Round ended</div>
    <div class="cc-score">${S.score.ok}/${S.goal} correct · ${pct}%</div>
    ${_statsDeltaHtml()}
    <div class="cc-stats">
      <div class="ccs"><span class="ccs-v">${st.mastered}</span><span class="ccs-l">Mastered</span></div>
      <div class="ccs"><span class="ccs-v">${st.unfamiliar}</span><span class="ccs-l">Practicing</span></div>
      <div class="ccs"><span class="ccs-v">${st.new}</span><span class="ccs-l">New</span></div>
    </div>
    <button class="btn-cc p" onclick="G_playAgain()">Play Again</button>
    ${S.lessonGroup!==null?`<button class="btn-cc s" onclick="G_openLessonMap()">📖 Back to Lessons</button>`:''}
    ${canResume?`<button class="btn-cc s" onclick="G_leaveResume()">↩ Back to question</button>`:''}
  </div>`;
  eid('btn-next').style.display='none';
  eid('btn-skip').style.display='none';
  const bh=eid('btn-hint');if(bh)bh.style.display='none';
}

function loadQ(preserveTTSUnlock=false){
  // Stop BOTH an already-playing clip and a delayed clip that has not fired yet.
  // Without this, an old 300/500ms timer can wake up on the next card and cancel its
  // iPhone playback — especially when the next mode is matching/sentenceTiles.
  _cancelQueuedTTS();
  if(!preserveTTSUnlock)TTS.stop();
  if(S.qi>=S.queue.length){showComplete();return;}
  const q=S.queue[S.qi];
  S.q=q; S.phase='waiting';
  S.ct={slots:[],bank:[],wrongCount:0};
  // Reshuffle tile order on replay so player can't rely on position memory
  if((q.mode==='sentenceTiles'||q.mode==='listeningSentence')&&q._seenBefore){
    q.tiles=shuffle([...q.tiles]);
  }
  if(q.mode==='sentenceTiles'||q.mode==='listeningSentence') q._seenBefore=true;
  S.st={placed:[],avail:q.tiles?[...q.tiles]:[]};
  S.mt={sel:null,hit:[],wrong:[]};

  // INTERSTITIAL CARD: every 5 questions, show an encouragement or language tip card.
  // BUG FIX: this must increment BEFORE the new-word intro check below. Intro cards
  // return early, and if the count only advanced after that check, a pool of mostly
  // new words (e.g. right after a big vocab push) would starve this counter forever —
  // it would never reach 5, so the tip card would never appear.
  S._interstitialCount = (S._interstitialCount||0) + 1;

  // Show intro card for new words (first ever encounter)
  const wordId=q.wordId||null;
  const isNew=wordId&&Prog.status(S.lang,wordId)==='new';
  const alreadyIntro=wordId&&S.introSeen.has(S.lang+':'+wordId);
  if(isNew&&!alreadyIntro&&q.mode!=='matching'){
    if(wordId) S.introSeen.add(S.lang+':'+wordId);
    showIntroCard(q);
    return; // question renders after "Got it" tap
  }

  if(S._interstitialCount >= 5 && q.mode !== 'matching'){
    S._interstitialCount = 0;
    showInterstitialCard(q);
    return; // question renders after "Continue" tap
  }

  renderQ(q);
  if(q.tts){
    // BUG-FIX (sentenceTiles double TTS): sentenceTiles shows the sentence as text,
    // so auto-play is not needed — the wc-top 🔊 button is there for voluntary replay.
    // Auto-playing AND having a tap button caused two TTS requests to collide (one from
    // the timer, one from the user tapping the button within 300ms), producing a cut-off
    // or doubled audio. Only auto-play for listening modes where audio IS the question.
    const isListeningMode = q.mode==='listeningWord' || q.mode==='listeningSentence';
    const isSentenceTiles = q.mode==='sentenceTiles';
    if(isListeningMode){
      // BUG-FIX (silent auto-play): fire synchronously, inside the same tap that
      // triggered loadQ() (Next/Start/Got it). iOS Safari's native speechSynthesis
      // fallback requires a LIVE user gesture — a setTimeout callback runs outside
      // that window, so once Google fails and it drops to native voice, the
      // scheduled auto-play went silent and only a manual 🔊 tap (a real gesture)
      // could produce sound. Calling say() here keeps it inside the live gesture.
      TTS.say(q.tts,LC[S.lang].ttsLang,0.85,false);
    } else if(!isSentenceTiles){
      _scheduleQueuedTTS(()=>TTS.say(q.tts,LC[S.lang].ttsLang,0.85),300);
    }
  }
}

function finishQuestion(ok,wordId){
  if(S.phase==='done')return;
  S.phase='done';
  // If player had any wrong attempts before getting it right, count as wrong for mastery.
  // GUARD FIX: use explicit boolean check instead of relying on !undefined === true,
  // so behaviour is predictable even if S.q is null during rapid page transitions.
  const hadWrong = S.q != null && S.q._hadWrong === true;
  const realOk = ok && !hadWrong;
  if(wordId)Prog.rec(S.lang,wordId,realOk);
  // BUG FIX (score illusion): mirror realOk so the end-of-round % reflects actual
  // first-try accuracy, not "eventually got it right after many wrong taps".
  // BUG FIX (score gap): plain else ensures every question lands in exactly one bucket.
  if(realOk){S.score.ok++;}else{S.score.no++;}
}

function G_next(){ SFX.click(); S.qi++; loadQ(); }
function G_hint(){
  SFX.hint();
  const q=S.q;if(!q||S.phase==='done')return;
  if(q.wordId) q._hadWrong=true;

  // ── Sentence tiles: glow the next correct tile in the bank ──
  if(q.mode==='sentenceTiles'||q.mode==='listeningSentence'){
    const answerTokens = q.answerTiles || (q.answerClean||q.answer).split(' ').map(w=>_stClean(w).toLowerCase());
    const nextToken = answerTokens[S.st.placed.length];
    if(!nextToken)return;
    const bankBtns=qsa('.tile.bank');
    const target=bankBtns.find(b=>{
      const w=b.querySelector('.tile-word');
      return w&&_stCleanTile(w.textContent.trim())===nextToken;
    });
    if(target){
      target.classList.add('hint-glow-tile');
      setTimeout(()=>target.classList.remove('hint-glow-tile'),2000);
    }
    return;
  }

  // ── Matching: glow one random unmatched pair (word + meaning) ──
  if(q.mode==='matching'){
    const unmatched=q.pairs.filter(p=>!S.mt.hit.includes(p.id));
    if(!unmatched.length)return;
    const pair=unmatched[0|Math.random()*unmatched.length];
    const allBtns=qsa('.mbtn');
    allBtns.forEach(b=>{
      if(b.dataset.id===pair.id&&!b.classList.contains('hit')){
        b.classList.add('hint-glow-tile');
        setTimeout(()=>b.classList.remove('hint-glow-tile'),2000);
      }
    });
    return;
  }

  // ── Character tiles (Hebrew): delegate to the card's own hint ──
  if(q.mode==='characterTiles'){
    G_ctHint();
    return;
  }

  // ── Kana Spelling (Japanese): delegate to kana hint ──
  if(q.mode==='kanaSpelling'){
    G_ksHint();
    return;
  }

  // ── MC questions: glow the letter badge of the correct answer ──
  const btns=qsa('.mc-opt');
  if(btns.length){
    // BUG-FIX: blank mode uses acceptedForms (may include inflected variants with
    // different casing). Check against all accepted forms, not just q.answer,
    // so the hint always lights up the correct button even when sentence-start
    // capitalisation makes q.answer !== the encoded button value.
    const accepted=new Set([q.answer,...(q.acceptedForms||[])]);
    btns.forEach(b=>{
      const bAns=decodeURIComponent(b.dataset.a);
      if(accepted.has(bAns)){
        const badge=b.querySelector('.mc-l');
        if(badge){
          badge.classList.add('hint-glow');
          setTimeout(()=>badge.classList.remove('hint-glow'),2500);
        }
      }
    });
    return;
  }
  // Non-MC fallback: toast
  const meaning=q.answer||q.meta?.meaning||'';
  if(meaning) toast('💡 '+meaning);
}


function G_skip(){
  SFX.click();
  const q=S.q;
  if(!q)return;

  // BUG-13 FIX: guard against infinite skip loop. If this question has been skipped
  // as many times as there are remaining questions, everyone remaining is unanswerable —
  // force advance past it rather than cycling forever.
  q._skipCount=(q._skipCount||0)+1;
  const remaining=S.queue.length-S.qi;
  if(q._skipCount>=remaining){
    toast('⚠️ Moving on — try enabling more question modes if this keeps happening.');
    S.qi++;loadQ();return;
  }

  // Still mark as wrong for mastery tracking (affects SRS, not score)
  if(q.wordId&&S.phase==='waiting'){
    Prog.rec(S.lang,q.wordId,false);
    q._hadWrong=true;
  }

  // Move current question to end of remaining queue
  S.queue.splice(S.qi,1);   // remove from current position
  S.queue.push(q);           // add to end
  // S.qi stays the same — it now points to what was the next question
  // S.goal stays the same — total count unchanged
  // S.score unchanged — skip doesn't count as wrong in score

  loadQ();
  toast('💡 沒關係，等一下再試一次這題');
}

/* ─── INTRO CARD ─────────────────────────────────────────── */
