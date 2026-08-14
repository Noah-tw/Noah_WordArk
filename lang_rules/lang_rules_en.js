/* lang_rules_en.js — English (IELTS word list, independent of the other 7 languages' shared
   2,800 concepts — a separately collected list, per Noah). Basic regular-plural rule only;
   irregular verbs (go/went, be/is/was...) can be added here later the same way as the other
   irregularVerbs tables once the IELTS list is underway. */
LangRules.register('english_ielts', {
  regularPlural: function(w) {
    if (/[sxz]$|[cs]h$/i.test(w)) return w + 'es';
    if (/[^aeiou]y$/i.test(w)) return w.slice(0, -1) + 'ies';
    return w + 's';
  },
});
