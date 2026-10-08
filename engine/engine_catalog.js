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

// Native selects remain keyboard- and touch-accessible, even with all 26 letters.
// Counts respect status, search, topic and the OTHER facet, not the facet itself.
function buildWordBrowseControls(kind){
  const el=eid(kind==='review'?'rev-word-filters':'game-word-filters');
  if(!el)return;
  const english=S.lang==='english_ielts';
  el.hidden=!english;
  if(!english){el.innerHTML='';return;}
  if(!Store.isLoadedFor(S.lang)){el.textContent='Loading…';return;}
  const review=kind==='review', f=review?S.revBrowse:S.gameBrowse;
  const status=review?S.revFilter:S.pool;
  const base=Store.getAll().filter(r=>_matchesWordStatus(r,status) &&
    (review?(S.revTopic==='all'||r.category===S.revTopic):(!S.catsCleared&&(!S.cats.size||S.cats.has(r.category)))));
  const count=(key,value)=>base.filter(r=>WordCatalog.matches(r,{...f,[key]:value})).length;
  const option=(key,value,label)=>`<option value="${value}"${f[key]===value?' selected':''}>${label} (${count(key,value)})</option>`;
  const letters=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  if(base.some(r=>WordCatalog.initial(r)==='#'))letters.push('#');
  const action=review?'G_setReviewBrowse':'G_setGameBrowse';
  el.innerHTML=`<div class="word-filter-grid">
    <label>Part of speech<select id="${kind}-pos" onchange="${action}('pos',this.value)">
      ${option('pos','all','All types')}${WordCatalog.positions.map(([value,label])=>option('pos',value,label)).join('')}
    </select></label>
    <label>First letter<select id="${kind}-letter" onchange="${action}('letter',this.value)">
      ${option('letter','all','All letters')}${letters.map(value=>option('letter',value,value)).join('')}
    </select></label>
    ${review?`<label class="word-filter-wide">Sort by<select id="review-sort" onchange="G_setReviewBrowse('sort',this.value)">
      ${[['az','A–Z'],['za','Z–A'],['original','Original order']].map(([value,label])=>`<option value="${value}"${f.sort===value?' selected':''}>${label}</option>`).join('')}
    </select></label>`:''}
  </div>
  <p class="word-filter-note">Phrasal verbs are under Verbs; noun phrases are under Nouns. Other phrases include idioms.</p>
  ${review?'':'<p class="word-filter-note">Changing these filters selects Free play words. Lessons keep their original groups.</p>'}
  <div class="word-filter-footer"><span>${base.filter(r=>WordCatalog.matches(r,f)).length.toLocaleString()} matching cards</span>
    <button type="button" class="word-filter-reset" onclick="${review?'G_resetReviewBrowse()':'G_resetGameBrowse()'}">Reset word filters</button>
  </div>`;
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
  S.gameBrowse={pos:'all',letter:'all'};
  S.revBrowse={pos:'all',letter:'all',sort:'az',query:''};
  S.revTopic='all';S.revFilter='all';
}
function updateReviewBrowse(){
  const english=S.lang==='english_ielts';
  const searchWrap=eid('rev-search-wrap'),search=eid('rev-search');
  if(searchWrap)searchWrap.hidden=!english;
  if(search&&search.value!==S.revBrowse.query)search.value=S.revBrowse.query;
  const label=eid('rev-topic-label'),btn=eid('rev-topic-btn');
  const detail=english?WordCatalog.summary(S.revBrowse):'';
  if(label)label.textContent=english?'📂 '+(detail||'All words')+' · '+({az:'A–Z',za:'Z–A',original:'Original order'}[S.revBrowse.sort])
    :(S.revTopic==='all'?'📂 All topics':_catIcon(S.revTopic)+' '+S.revTopic);
  _updateRevTopicBtn();
  if(btn)btn.classList.toggle('active',!!detail||S.revTopic!=='all');
}
