/* lang_rules_de.js — German: article strip, weak-verb stem, separable prefixes, preposition contraction */
LangRules.register('german', {
  contractions: { zu:['zum','zur'], in:['ins','im'], an:['am','ans'], bei:['beim'],
                   von:['vom'], vor:['vors'], auf:['aufs'], durch:['durchs'], für:['fürs'], um:['ums'] },
  irregularVerbs: {
    sein:['bin','bist','ist','sind','seid','war','gewesen'],
    haben:['habe','hast','hat','haben','habt','hatte','gehabt'],
    werden:['werde','wirst','wird','werden','werdet','wurde','geworden'],
    können:['kann','kannst','können','könnt','konnte'],
    müssen:['muss','musst','müssen','müsst','musste'],
    wollen:['will','willst','wollen','wollt','wollte'],
    sollen:['soll','sollst','sollen','sollt','sollte'],
    dürfen:['darf','darfst','dürfen','dürft','durfte'],
    mögen:['mag','magst','mögen','mögt','mochte'],
    gehen:['gehe','gehst','geht','gehen','ging','gegangen'],
    kommen:['komme','kommst','kommt','kommen','kam','gekommen'],
    sehen:['sehe','siehst','sieht','sehen','sah','gesehen'],
    geben:['gebe','gibst','gibt','geben','gab','gegeben'],
    nehmen:['nehme','nimmst','nimmt','nehmen','nahm','genommen'],
    essen:['esse','isst','essen','aß','gegessen'],
    trinken:['trinke','trinkst','trinkt','trinken','trank','getrunken'],
    schlafen:['schlafe','schläfst','schläft','schlafen','schlief','geschlafen'],
  },
  expand: function(word, forms, allForms, add) {
    const artRe=/^(der|die|das|den|dem|des|ein|eine|einen|einem|eines)\s+/i;
    const wc = word.replace(artRe,'').trim().toLowerCase();
    const bare = word.replace(/\|/g,' ').replace(artRe,'').trim().toLowerCase();
    if (bare && bare !== word.toLowerCase()) add(bare);
    if (/(?:e[lr]n|en)$/.test(wc)) {
      const stem = wc.replace(/(?:e[lr]n|en)$/, '');
      if (stem.length >= 3) {
        ['', 'e', 'st', 't', 'en', 'te', 'test', 'ten'].forEach(sfx => add(stem + sfx));
        add('ge' + stem + 't'); add('ge' + stem + 'en');
      }
    }
    const prefixes=['ab','an','auf','aus','bei','durch','ein','fort','her','hin','hoch','los','mit','nach','nieder','um','vor','weg','zu','zurück','zusammen'];
    const pfx = prefixes.find(p => wc.startsWith(p) && wc.length > p.length + 2);
    if (pfx) {
      const baseVerb = wc.slice(pfx.length);
      add(pfx);
      const baseStem = baseVerb.replace(/(?:e[lr]n|en)$/, '');
      if (baseStem.length >= 2) ['', 'e', 'st', 't', 'te', 'ten'].forEach(sfx => add(baseStem + sfx));
    }
  },
});
