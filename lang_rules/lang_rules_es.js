/* lang_rules_es.js — Spanish: del/al contraction, irregular verbs, accent-fold via expand() */
LangRules.register('spanish', {
  contractions: { de:['del'], a:['al'] },
  contractionsRev: { del:['de','el'], al:['a','el'] },
  irregularVerbs: {
    ser:['soy','eres','es','somos','sois','son','fui','era'],
    estar:['estoy','estás','está','estamos','estáis','están'],
    ir:['voy','vas','va','vamos','vais','van','fui'],
    haber:['he','has','ha','hemos','habéis','han'],
    tener:['tengo','tienes','tiene','tenemos','tenéis','tienen'],
    hacer:['hago','haces','hace','hacemos','hacéis','hacen','hecho'],
    poder:['puedo','puedes','puede','podemos','podéis','pueden'],
    decir:['digo','dices','dice','decimos','decís','dicen','dicho'],
    querer:['quiero','quieres','quiere','queremos','queréis','quieren'],
    ver:['veo','ves','ve','vemos','veis','ven','visto'],
    dar:['doy','das','da','damos','dais','dan'],
    saber:['sé','sabes','sabe','sabemos','sabéis','saben'],
    poner:['pongo','pones','pone','ponemos','ponéis','ponen','puesto'],
    venir:['vengo','vienes','viene','venimos','venís','vienen'],
  },
  expand: function(word, forms, allForms, add) {
    allForms.slice().forEach(f => {
      const stripped = f.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (stripped !== f) add(stripped);
    });
  },
});
