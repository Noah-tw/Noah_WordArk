/* lang_rules_fr.js — French: elision, preposition contractions, irregular verbs/nouns, regular plural */
LangRules.register('french', {
  elision: { je:"j'", me:"m'", te:"t'", se:"s'", le:"l'", la:"l'", de:"d'",
             ne:"n'", que:"qu'", ce:"c'", jusque:"jusqu'", lorsque:"lorsqu'",
             puisque:"puisqu'", quoique:"quoiqu'" },
  contractions: { de:["du","d'","des","de l'","de la"], à:["au","aux","à l'","à la"],
                  le:["l'","du","au"], la:["l'","de la","à la"], les:["des","aux"] },
  contractionsRev: { du:['de'], des:['de'], au:['à'], aux:['à'] },
  irregularVerbs: {
    être:['suis','es','est','sommes','êtes','sont','été'],
    avoir:['ai','as','a','avons','avez','ont','eu'],
    aller:['vais','vas','va','allons','allez','vont','allé'],
    faire:['fais','fait','faisons','faites','font'],
    vouloir:['veux','veut','voulons','voulez','veulent','voulu'],
    pouvoir:['peux','peut','pouvons','pouvez','peuvent','pu'],
    savoir:['sais','sait','savons','savez','savent','su'],
    devoir:['dois','doit','devons','devez','doivent','dû'],
    voir:['vois','voit','voyons','voyez','voient','vu'],
    prendre:['prends','prend','prenons','prenez','prennent','pris'],
    venir:['viens','vient','venons','venez','viennent','venu'],
    dire:['dis','dit','disons','dites','disent'],
    mettre:['mets','met','mettons','mettez','mettent','mis'],
    partir:['pars','part','partons','partez','partent','parti'],
    sortir:['sors','sort','sortons','sortez','sortent','sorti'],
    connaître:['connais','connaît','connaissons','connaissez','connaissent','connu'],
    croire:['crois','croit','croyons','croyez','croient','cru'],
    boire:['bois','boit','buvons','buvez','boivent','bu'],
    tenir:['tiens','tient','tenons','tenez','tiennent','tenu'],
  },
  irregularNouns: {
    œil:['yeux'], ciel:['cieux'], travail:['travaux'], cheval:['chevaux'],
    journal:['journaux'], animal:['animaux'], hôpital:['hôpitaux'], œuf:['œufs'],
  },
  regularPlural: function(w) {
    if (/[sxz]$/i.test(w)) return w;
    if (/al$/i.test(w)) return w.slice(0, -2) + 'aux';
    if (/eu$/i.test(w)) return w + 'x';
    return w + 's';
  },
});
