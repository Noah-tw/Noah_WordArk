/* ============================================================================
   lang_rules_core.js — shared matcher + per-language registry
   ----------------------------------------------------------------------------
   Always loads (small, language-independent). Each lang_rules_<code>.js file
   (loaded lazily alongside that language's vocab data) calls LangRules.register()
   to plug its own tables/functions in. This file never needs to know which
   languages exist — it just dispatches to whatever's been registered.
   ============================================================================ */
const LangRules = (() => {
  const _apos = s => s.replace(/[\u2018\u2019\u02bc\u0060]/g, "'");

  function findForm(sentence, form, isJP) {
    if (!sentence || !form) return null;
    const sl = _apos(sentence.normalize('NFC')).toLowerCase();
    const fl = _apos(form.replace(/\|/g, ' ').normalize('NFC')).toLowerCase();
    if (!sl.includes(fl)) return null;
    if (isJP) return fl;
    const esc = fl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const trailingBoundary = fl.endsWith("'") ? '' : '(?![\\p{L}\\p{N}])';
    try {
      const m = new RegExp('(^|[^\\p{L}\\p{N}])' + esc + trailingBoundary, 'iu').exec(sl);
      return m ? m[0].replace(/^[^\p{L}\p{N}]/u, '') : null;
    } catch (e) {
      return sl.includes(fl) ? fl : null;
    }
  }

  function formInSentence(sentence, form, isJP) {
    return findForm(sentence, form, isJP) !== null;
  }

  const _registry = {};

  // Each lang_rules_<code>.js calls this once, after LangRules loads, to plug
  // in its own elision/contraction/irregular tables and (optionally) a custom
  // expand(word, forms, allForms) function for structural cases (German
  // article-stripping, Finnish case suffixes, Italian articles, Spanish accents).
  function register(lang, def) {
    _registry[lang] = Object.assign(_registry[lang] || {}, def);
  }

  function expandForms(word, forms, lang) {
    const out = [word, ...(forms || [])].filter(Boolean).map(f => f.replace(/\|/g, ' ').toLowerCase());
    const add = f => { if (f && !out.includes(f.toLowerCase())) out.push(f.toLowerCase()); };
    const base = out.slice();
    const def = _registry[lang];
    if (!def) return out; // no rules registered for this language yet — word/forms[] only

    base.forEach(f => {
      if (def.elision && def.elision[f]) add(def.elision[f]);
      if (def.contractions && def.contractions[f]) def.contractions[f].forEach(add);
      if (def.contractionsRev && def.contractionsRev[f]) def.contractionsRev[f].forEach(add);
      if (def.irregularVerbs && def.irregularVerbs[f]) def.irregularVerbs[f].forEach(add);
      if (def.irregularNouns && def.irregularNouns[f]) def.irregularNouns[f].forEach(add);
    });

    if (def.regularPlural) {
      const wl = word.toLowerCase();
      const skip = (def.irregularNouns && def.irregularNouns[wl]) ||
                   (def.irregularVerbs && def.irregularVerbs[wl]) ||
                   (def.elision && def.elision[wl]);
      if (!skip) add(def.regularPlural(word));
    }

    if (def.expand) def.expand(word, forms, out, add);

    return out;
  }

  return { findForm, formInSentence, expandForms, register, _registry };
})();
