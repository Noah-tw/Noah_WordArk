/* lang_rules_fi.js — Finnish: agglutinated case-suffix stripping + vowel-harmony case generation */
LangRules.register('finnish', {
  expand: function(word, forms, allForms, add) {
    const infEnd=/(?:ella|ellä|lla|llä|da|dä|ta|tä|a|ä)$/;
    const sfxStrip=/(?:lla|llä|lta|ltä|lle|ssa|ssä|sta|stä|hun|hyn|hän|hin|hon|seen|ksi|na|nä|ta|tä|a|ä|n|t|en|ien|ia|iä|ita|itä|illa|illä|ilta|iltä|ille|issa|issä|ista|istä)$/;
    const wordFi = word.replace(/\|/g,' ').toLowerCase();
    const stemFi = wordFi.replace(infEnd,'');
    if (stemFi.length >= 3 && stemFi !== wordFi) {
      add(stemFi);
      const lastVowel = s => { for (let i=s.length-1;i>=0;i--) if (/[aouäöy]/i.test(s[i])) return s[i].toLowerCase(); return 'a'; };
      const isBack = !/[äöy]/i.test(lastVowel(stemFi)) && /[aou]/i.test(lastVowel(stemFi));
      const vh = (back,front) => isBack ? back : front;
      [stemFi+vh('ssa','ssä'), stemFi+vh('sta','stä'), stemFi+vh('an','ään'), stemFi+'n',
       stemFi+vh('a','ä'), stemFi+vh('lla','llä'), stemFi+vh('lta','ltä'), stemFi+'lle',
       stemFi+vh('na','nä'), stemFi+'ksi', stemFi+'t'].forEach(add);
    }
    (forms||[]).forEach(f => {
      const bare = f.replace(/\|/g,' ').replace(sfxStrip,'').toLowerCase();
      if (bare.length >= 3) add(bare);
    });
  },
});
