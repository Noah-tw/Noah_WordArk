/* lang_rules_it.js — Italian: article stripping, preposition+article contractions, irregular verbs/nouns */
LangRules.register('italian', {
  contractions: {
    di:['del','dello','della',"dell'",'dei','degli','delle'],
    a:['al','allo','alla',"all'",'ai','agli','alle'],
    da:['dal','dallo','dalla',"dall'",'dai','dagli','dalle'],
    in:['nel','nello','nella',"nell'",'nei','negli','nelle'],
    su:['sul','sullo','sulla',"sull'",'sui','sugli','sulle'],
    con:['col','coi'],
    lo:["l'"], la:["l'"], una:["un'"],
  },
  irregularVerbs: {
    essere:['sono','sei','è','siamo','siete','stato'],
    avere:['ho','hai','ha','abbiamo','avete','hanno','avuto'],
    andare:['vado','vai','va','andiamo','andate','vanno','andato'],
    fare:['faccio','fai','fa','facciamo','fate','fanno','fatto'],
    potere:['posso','puoi','può','possiamo','potete','possono'],
    volere:['voglio','vuoi','vuole','vogliamo','volete','vogliono'],
    dovere:['devo','devi','deve','dobbiamo','dovete','devono'],
    sapere:['so','sai','sa','sappiamo','sapete','sanno'],
    dire:['dico','dici','dice','diciamo','dite','dicono','detto'],
    venire:['vengo','vieni','viene','veniamo','venite','vengono','venuto'],
    bere:['bevo','bevi','beve','beviamo','bevete','bevono','bevuto'],
    dare:['do','dai','dà','diamo','date','danno'],
  },
  irregularNouns: {
    uovo:['uova'], dito:['dita'], mano:['mani'], uomo:['uomini'],
    braccio:['braccia'], paio:['paia'], centinaio:['centinaia'],
  },
  regularPlural: function(w) {
    if (/a$/i.test(w)) return w.slice(0, -1) + 'e';
    if (/[eo]$/i.test(w)) return w.slice(0, -1) + 'i';
    return w;
  },
  expand: function(word, forms, allForms, add) {
    const artRe=/^(il|lo|la|l'|i|gli|le|un|uno|una|un'|del|dello|della|dell'|dei|degli|delle|al|allo|alla|all'|ai|agli|alle|dal|dallo|dalla|dall'|dai|dagli|dalle|nel|nello|nella|nell'|nei|negli|nelle|sul|sullo|sulla|sull'|sui|sugli|sulle|col|coi)\s+/i;
    const bare = word.replace(/\|/g,' ').replace(artRe,'').trim().toLowerCase();
    if (bare && bare !== word.toLowerCase()) add(bare);
  },
});
