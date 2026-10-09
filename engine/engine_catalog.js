/* English browsing facets. Derived from authored POS/headwords; never from example
   sentences, and never written into vocabulary records or learning progress. */
const WordCatalog = (() => {
  const positions = [
    ['noun', 'Nouns'], ['verb', 'Verbs'], ['adjective', 'Adjectives'],
    ['adverb', 'Adverbs'], ['phrase', 'Other phrases'], ['other', 'Other']
  ];
  const groups = {
    noun:'noun', 'plural noun':'noun', 'proper noun':'noun', 'noun phrase':'noun',
    verb:'verb', 'verb phrase':'verb', 'phrasal verb':'verb', 'modal phrase':'verb',
    adjective:'adjective', 'adjective phrase':'adjective',
    adverb:'adverb', 'adverb phrase':'adverb', 'adverbial phrase':'adverb',
    idiom:'phrase', phrase:'phrase', 'prepositional phrase':'phrase',
    'pronoun phrase':'phrase', 'conjunction phrase':'phrase'
  };
  const collator = new Intl.Collator('en', {sensitivity:'base', numeric:true, ignorePunctuation:true});
  function normalize(text){
    return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toLowerCase().replace(/[’‘]/g,"'").replace(/[‐‑–—]/g,'-').replace(/\s+/g,' ').trim();
  }
  function word(r){return _getCoreWord(r.word||'');}
  function pos(r){return groups[normalize(r.pos)]||'other';}
  function initial(r){return (normalize(word(r)).match(/[a-z]/)||['#'])[0].toUpperCase();}
  function matches(r, filters){
    if(filters.pos!=='all' && pos(r)!==filters.pos)return false;
    if(filters.letter!=='all' && initial(r)!==filters.letter)return false;
    const query=normalize(filters.query);
    return !query || [word(r),r.zh,r.zh_def,r.meaning,r.definition,...(r.forms||[])]
      .some(value=>normalize(value).includes(query));
  }
  function sort(records, order){
    const result=records.slice(); // Store order determines lessons: never mutate it.
    if(order==='az'||order==='za')result.sort((a,b)=>
      (order==='za'?-1:1)*collator.compare(word(a),word(b)) || collator.compare(a.id,b.id));
    return result;
  }
  function summary(filters){
    return [filters.pos==='all'?'':positions.find(p=>p[0]===filters.pos)?.[1],
      filters.letter==='all'?'':filters.letter].filter(Boolean).join(' · ');
  }
  function html(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  return {positions,normalize,word,pos,initial,matches,sort,summary,html};
})();

function _matchesWordStatus(r, status){
  return status==='all' || (status==='favorite'?Prog.isFav(S.lang,r.id):Prog.status(S.lang,r.id)===status);
}
function _freePlayWords(){
  if(!Store.isLoadedFor(S.lang)||S.catsCleared)return [];
  return Store.getAll().filter(r=>(!S.cats.size||S.cats.has(r.category)) &&
    _matchesWordStatus(r,S.pool) &&
    (S.lang!=='english_ielts'||WordCatalog.matches(r,S.gameBrowse)));
}
function _reviewWords(){
  if(!Store.isLoadedFor(S.lang))return [];
  const items=Store.getAll().filter(r=>_matchesWordStatus(r,S.revFilter) &&
    (S.revTopic==='all'||r.category===S.revTopic) &&
    (S.lang!=='english_ielts'||WordCatalog.matches(r,S.revBrowse)));
  return S.lang==='english_ielts'?WordCatalog.sort(items,S.revBrowse.sort):items;
}

// A selection is a draft until Apply. Closing the sheet never changes the queue.
let _wordBrowseDraft=null;
function beginWordBrowse(kind){
  const review=kind==='review',ov=eid(review?'ov-topic':'ov-cats');
  ov?.classList.toggle('word-browser',S.lang==='english_ielts');
  if(S.lang!=='english_ielts'){
    _wordBrowseDraft=null;
    if(!review&&eid('game-filter-title'))eid('game-filter-title').textContent='Words to practice';
    const apply=eid(review?'rev-apply-btn':'cats-done-btn');
    if(apply){apply.disabled=false;apply.textContent='Done';}
    return;
  }
  const filters={...(review?S.revBrowse:S.gameBrowse)};
  _wordBrowseDraft={kind,lang:S.lang,filters,pool:review?S.revFilter:S.pool,
    lettersOpen:filters.letter!=='all',opener:document.activeElement};
}
function endWordBrowse(kind){
  if(_wordBrowseDraft?.kind!==kind)return;
  const opener=_wordBrowseDraft.opener;
  _wordBrowseDraft=null;
  if(opener?.isConnected)opener.focus({preventScroll:true});
}
function _browseBase(kind,draft){
  return Store.getAll().filter(r=>_matchesWordStatus(r,draft.pool) &&
    (kind==='review'?(S.revTopic==='all'||r.category===S.revTopic):(!S.cats.size||S.cats.has(r.category))));
}
function buildWordBrowseControls(kind){
  const review=kind==='review',el=eid(review?'rev-word-filters':'game-word-filters');
  if(!el)return;
  const english=S.lang==='english_ielts';
  el.hidden=!english;
  eid(review?'ov-topic':'ov-cats')?.classList.toggle('word-browser',english);
  if(!english){el.innerHTML='';return;}
  if(!Store.isLoadedFor(S.lang)){el.textContent='Loading…';return;}
  const draft=_wordBrowseDraft?.kind===kind?_wordBrowseDraft:
    {filters:review?S.revBrowse:S.gameBrowse,pool:review?S.revFilter:S.pool,lettersOpen:false};
  const f=draft.filters,base=_browseBase(kind,draft);
  const count=(key,value)=>base.filter(r=>WordCatalog.matches(r,{...f,[key]:value})).length;
  const focus=document.activeElement?.closest('[data-browse-key]');
  const focusKey=focus?.dataset.browseKey,focusValue=focus?.dataset.browseValue;
  const type=(value,label)=>{
    const n=count('pos',value);
    return `<button class="browse-type${value==='all'?' browse-all':''}${f.pos===value?' selected':''}${n===0?' no-matches':''}"
      data-browse-key="pos" data-browse-value="${value}" aria-pressed="${f.pos===value}"
      onclick="G_pickBrowse('${kind}','pos','${value}')"><span>${label}</span><span class="browse-count">${n.toLocaleString()}</span></button>`;
  };
  const letters=['all',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  if(base.some(r=>WordCatalog.initial(r)==='#'))letters.push('#');
  const context=[];
  if(review&&draft.pool!=='all')context.push({new:'New',unfamiliar:'Practice',mastered:'Mastered',favorite:'Favorites'}[draft.pool]);
  if(review&&f.query.trim())context.push('“'+f.query.trim()+'”');
  el.innerHTML=`${context.length?`<div class="browse-context">Within ${WordCatalog.html(context.join(' · '))}</div>`:''}
    <div class="browse-section-heading"><span>Part of speech</span><button class="browse-reset" onclick="G_resetBrowseDraft('${kind}')">Reset</button></div>
    <div class="browse-types" role="group" aria-label="Part of speech">
      ${type('all','All types')}${WordCatalog.positions.map(([value,label])=>type(value,label)).join('')}
    </div>
    <div class="browse-alphabet">
      <button class="browse-alphabet-toggle" data-browse-key="expand" data-browse-value="letters"
        aria-expanded="${!!draft.lettersOpen}" aria-controls="${kind}-letters" onclick="G_toggleBrowseLetters('${kind}')">
        <span>First letter</span><span class="browse-letter-choice">${f.letter==='all'?'Any letter':f.letter}
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></span>
      </button>
      <div id="${kind}-letters" class="browse-letters" role="group" aria-label="First letter"${draft.lettersOpen?'':' hidden'}>
        ${letters.map(value=>`<button class="browse-letter${f.letter===value?' selected':''}${count('letter',value)===0?' no-matches':''}"
          data-browse-key="letter" data-browse-value="${value}" aria-pressed="${f.letter===value}"
          aria-label="${value==='all'?'All letters':'Starts with '+value}"
          onclick="G_pickBrowse('${kind}','letter','${value}')">${value==='all'?'All':value}</button>`).join('')}
      </div>
    </div>`;
  const n=base.filter(r=>WordCatalog.matches(r,f)).length;
  const apply=eid(review?'rev-apply-btn':'cats-done-btn');
  if(apply){apply.disabled=n===0;apply.textContent=n===0?'No matching words':(review?'Show ':'Use ')+n.toLocaleString()+(review?' cards':' words');}
  if(!review){
    eid('game-filter-title').textContent='Free practice';
    qsa('#fs-pool-row .fs-pool-chip').forEach(b=>b.classList.toggle('sel',b.dataset.p===draft.pool));
  }
  if(focusKey)el.querySelector(`[data-browse-key="${focusKey}"][data-browse-value="${focusValue}"]`)?.focus({preventScroll:true});
}
function G_pickBrowse(kind,key,value){
  if(_wordBrowseDraft?.kind!==kind||key==='sort'||!_validBrowseValue(key,value))return;
  SFX.click();_wordBrowseDraft.filters[key]=value;
  buildWordBrowseControls(kind);
}
function G_toggleBrowseLetters(kind){
  if(_wordBrowseDraft?.kind!==kind)return;
  SFX.click();_wordBrowseDraft.lettersOpen=!_wordBrowseDraft.lettersOpen;
  buildWordBrowseControls(kind);
}
function G_resetBrowseDraft(kind){
  if(_wordBrowseDraft?.kind!==kind)return;
  SFX.click();
  _wordBrowseDraft.filters.pos='all';_wordBrowseDraft.filters.letter='all';
  if(kind==='game')_wordBrowseDraft.pool='all';
  buildWordBrowseControls(kind);
}
function G_setBrowsePool(pool){
  if(S.lang!=='english_ielts'){G_setPool(pool);return;}
  if(_wordBrowseDraft?.kind!=='game'||!['all','new','unfamiliar','mastered','favorite'].includes(pool))return;
  SFX.click();_wordBrowseDraft.pool=pool;
  buildWordBrowseControls('game');
}
function G_applyWordBrowse(kind){
  const ov=kind==='review'?'ov-topic':'ov-cats',draft=_wordBrowseDraft;
  SFX.click();
  if(S.lang!=='english_ielts'){G_closeOv(ov);return;}
  if(!draft||draft.kind!==kind||draft.lang!==S.lang||!Store.isLoadedFor(S.lang))return;
  if(!_browseBase(kind,draft).some(r=>WordCatalog.matches(r,draft.filters)))return;
  const f={pos:draft.filters.pos,letter:draft.filters.letter};
  if(kind==='review'){
    Object.assign(S.revBrowse,f);
    G_closeOv(ov);renderReview(S.revFilter);
  }else{
    const changed=S.gameBrowse.pos!==f.pos||S.gameBrowse.letter!==f.letter||S.pool!==draft.pool||S.catsCleared||S.lessonGroup!==null;
    S.gameBrowse=f;S.pool=draft.pool;
    G_closeOv(ov);
    if(changed)_applyFreePlayBrowse();
  }
}

function _validBrowseValue(key,value){
  if(key==='pos')return value==='all'||WordCatalog.positions.some(p=>p[0]===value);
  if(key==='letter')return value==='all'||/^[A-Z#]$/.test(value);
  return key==='sort'&&['az','za','original'].includes(value);
}
function G_setReviewBrowse(key,value){
  if(!_validBrowseValue(key,value))return;
  SFX.click();S.revBrowse[key]=value;
  buildRevTopics();renderReview(S.revFilter);
}
function G_setGameBrowse(key,value){
  if(key==='sort'||!_validBrowseValue(key,value))return;
  SFX.click();S.gameBrowse[key]=value;
  _applyFreePlayBrowse();
}
function _applyFreePlayBrowse(){
  S.lessonGroup=null;S._viewingLessonMap=false;S._lessonAutoStart=false;
  S.catsCleared=false;
  _syncTabChrome();
  buildCatSheet();updateCatBtn();_resetSessionDisplay();startSession();
}
function G_resetGameBrowse(all=false){
  SFX.click();S.gameBrowse={pos:'all',letter:'all'};
  if(all){S.pool='all';S.cats=new Set();}
  _applyFreePlayBrowse();
}
function G_resetReviewBrowse(all=false){
  SFX.click();clearTimeout(_reviewSearchTimer);
  S.revTopic='all';S.revBrowse={pos:'all',letter:'all',sort:'az',query:''};
  if(all)S.revFilter='all';
  buildRevTopics();renderReview(S.revFilter);
}
let _reviewSearchTimer=null;
function initWordBrowse(){
  const input=eid('rev-search');if(!input)return;
  let composing=false;
  input.addEventListener('compositionstart',()=>{composing=true;clearTimeout(_reviewSearchTimer);});
  input.addEventListener('compositionend',()=>{composing=false;G_reviewSearch(input.value);});
  input.addEventListener('input',event=>{if(!composing&&!event.isComposing)G_reviewSearch(input.value);});
  document.addEventListener('keydown',event=>{
    if(!_wordBrowseDraft)return;
    const id=_wordBrowseDraft.kind==='review'?'ov-topic':'ov-cats',ov=eid(id);
    if(!ov?.classList.contains('on'))return;
    if(event.key==='Escape'){event.preventDefault();SFX.click();G_closeOv(id);return;}
    if(event.key!=='Tab')return;
    const buttons=[...ov.querySelectorAll('button:not(:disabled)')].filter(el=>el.getClientRects().length);
    const first=buttons[0],last=buttons[buttons.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  });
}
function G_reviewSearch(value){
  S.revBrowse.query=value;
  clearTimeout(_reviewSearchTimer);
  const lang=S.lang;
  _reviewSearchTimer=setTimeout(()=>{
    if(S.lang!==lang||S.activeTab!=='review')return;
    renderReview(S.revFilter);
  },140);
}
function _resetWordBrowse(){
  clearTimeout(_reviewSearchTimer);
  _wordBrowseDraft=null;
  S.gameBrowse={pos:'all',letter:'all'};
  S.revBrowse={pos:'all',letter:'all',sort:'az',query:''};
  S.revTopic='all';S.revFilter='all';
}
function updateReviewBrowse(){
  const english=S.lang==='english_ielts';
  const searchWrap=eid('rev-search-wrap'),search=eid('rev-search'),sort=eid('rev-sort');
  if(searchWrap)searchWrap.hidden=!english;
  if(sort)sort.hidden=!english;
  if(search&&search.value!==S.revBrowse.query)search.value=S.revBrowse.query;
  const label=eid('rev-topic-label'),btn=eid('rev-topic-btn'),badge=eid('rev-filter-badge');
  const selected=[S.revBrowse.pos!=='all',S.revBrowse.letter!=='all'].filter(Boolean).length;
  if(label)label.textContent=english?'Filters':(S.revTopic==='all'?'All topics':S.revTopic);
  _updateRevTopicBtn();
  if(btn){btn.classList.toggle('browse-trigger',english);btn.classList.toggle('active',english?selected>0:S.revTopic!=='all');}
  if(badge){badge.hidden=!english||selected===0;badge.textContent=selected;}
  qsa('.rev-sort button').forEach(b=>{const on=b.dataset.sort===S.revBrowse.sort;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on);});
  const chips=eid('rev-active-filters');
  if(chips){
    chips.hidden=!english||selected===0;
    chips.innerHTML=english?['pos','letter'].filter(key=>S.revBrowse[key]!=='all').map(key=>{
      const label=key==='pos'?WordCatalog.positions.find(([id])=>id===S.revBrowse.pos)?.[1]:'Starts with '+S.revBrowse.letter;
      return `<button class="browse-chip" aria-label="Remove ${WordCatalog.html(label)} filter" onclick="G_setReviewBrowse('${key}','all')">${WordCatalog.html(label)}<span aria-hidden="true">×</span></button>`;
    }).join(''):'';
  }
}
