// tips_japanese.js — schema: {term, reading, translit, en, zh, emoji}.
// reading = full hiragana reading of term, required for furigana (jpRuby()).
// translit = romaji, for learners who haven't learned kana yet. Both optional
// per-entry (omit if term has no kanji / is already pure kana), but reading is
// what actually drives the furigana display — translit alone won't.
window.LANG_TIPS_JAPANESE = [
  {term:"七転び八起き", reading:"ななころびやおき", translit:"Nana korobi ya oki", en:"fall seven times, stand up eight — the spirit of resilience.", zh:"跌倒七次，站起八次——韌性的精神。", emoji:"🌸"},
  {term:"木漏れ日", reading:"こもれび", translit:"Komorebi", en:"sunlight filtering through leaves.", zh:"陽光透過樹葉灑落的光影。", emoji:"🌿"},
  {term:"猫の手も借りたい", reading:"ねこのてもかりたい", translit:"Neko no te mo karitai", en:"so busy I'd even borrow a cat's paw for help.", zh:"忙到想借貓的手幫忙。", emoji:"🐱"},
  {en:"Japanese uses three writing systems in a single sentence: hiragana, katakana, and kanji.", zh:"日語在同一個句子裡會混用三種文字：平假名、片假名、漢字。", emoji:"✍️"},
  {term:"物の哀れ", reading:"もののあわれ", translit:"Mono no aware", en:"the bittersweet awareness that all things are impermanent.", zh:"萬物終將消逝的苦樂參半感知。", emoji:"🍂"},
  {term:"猿も木から落ちる", reading:"さるもきからおちる", translit:"Saru mo ki kara ochiru", en:"even monkeys fall from trees — even experts make mistakes.", zh:"猴子也會從樹上掉下來——再厲害的人也會犯錯。", emoji:"🐒"},
  {term:"井の中の蛙大海を知らず", reading:"いのなかのかわずたいかいをしらず", translit:"I no naka no kawazu taikai o shirazu", en:"a frog in a well doesn't know the ocean — narrow experience breeds narrow views.", zh:"井底之蛙不知大海——見識狹隘的人不知世界之大。", emoji:"🐸"},
  {en:"Japanese verbs go at the end of the sentence — the subject and object come first, action comes last.", zh:"日語動詞放在句尾——主詞跟受詞先講，動作最後才出現。", emoji:"📐"},
  {term:"時は金なり", reading:"ときはかねなり", translit:"Toki wa kane nari", en:"time is money — a borrowed English idiom that became a common Japanese proverb.", zh:"時間就是金錢——從英文借來、後來變成常見日文諺語的說法。", emoji:"⏱️"},
  {term:"石の上にも三年", reading:"いしのうえにもさんねん", translit:"Ishi no ue ni mo san-nen", en:"three years on a stone — patience and perseverance eventually pay off.", zh:"石頭上坐三年——耐心與堅持終將有回報。", emoji:"🪨"},
  {term:"花より団子", reading:"はなよりだんご", translit:"Hana yori dango", en:"dumplings over flowers — substance over style, practicality over aesthetics.", zh:"糰子勝過花——重實用而非虛華。", emoji:"🍡"},
  {en:"Japanese has no grammatical plural markers on most nouns — \"猫\" (neko) can mean \"cat\" or \"cats\" depending on context alone.", zh:"日語大部分名詞沒有複數標記——「猫」（neko）可以是「一隻貓」也可以是「好幾隻貓」，全靠上下文判斷。", emoji:"🔢"}
];
