// profanity.ts

// Full profanity list (copied from your Flutter UX)
const profaneWords: string[] = [
  'ahole', 'anus', 'ash0le', 'ash0les', 'asholes', 'ass', 'ass monkey',
  'assface', 'assh0le', 'assh0lez', 'asshole', 'assholes', 'assholz',
  'asswipe', 'azzhole', 'bassterds', 'bastard', 'bastards', 'bastardz',
  'basterds', 'basterdz', 'biatch', 'bitch', 'bitches', 'blow job',
  'boffing', 'butthole', 'buttwipe', 'c0ck', 'c0cks', 'c0k',
  'carpet muncher', 'cawk', 'cawks', 'clit', 'cnts', 'cntz', 'cock',
  'cockhead', 'cock-head', 'cocks', 'cocksucker', 'cock-sucker', 'crap',
  'cum', 'cunt', 'cunts', 'cuntz', 'dick', 'dild0', 'dild0s', 'dildo',
  'dildos', 'dilld0', 'dilld0s', 'dominatricks', 'dominatrics',
  'dominatrix', 'dyke', 'enema', 'f u c k', 'f u c k e r', 'fag', 'fag1t',
  'faget', 'fagg1t', 'faggit', 'faggot', 'fagg0t', 'fagit', 'fags',
  'fagz', 'faig', 'faigs', 'fart', 'flipping the bird', 'fuck', 'fucker',
  'fuckin', 'fucking', 'fucks', 'fudge packer', 'fuk', 'fukah', 'fuken',
  'fuker', 'fukin', 'fukk', 'fukkah', 'fukken', 'fukker', 'fukkin',
  'g00k', 'god-damned', 'h00r', 'h0ar', 'h0re', 'hells', 'hoar', 'hoor',
  'hoore', 'jackoff', 'jap', 'japs', 'jerk-off', 'jisim', 'jiss', 'jizm',
  'jizz', 'knob', 'knobs', 'knobz', 'kunt', 'kunts', 'kuntz', 'lezzian',
  'lipshits', 'lipshitz', 'masochist', 'masokist', 'massterbait',
  'masstrbait', 'masstrbate', 'masterbaiter', 'masterbate', 'masterbates',
  'motha fucker', 'motha fuker', 'motha fukkah', 'motha fukker',
  'mother fucker', 'mother fukah', 'mother fuker', 'mother fukkah',
  'mother fukker', 'mother-fucker', 'mutha fucker', 'mutha fukah',
  'mutha fuker', 'mutha fukkah', 'mutha fukker', 'n1gr', 'nastt',
  'nigger;', 'nigur;', 'niiger;', 'niigr;', 'orafis', 'orgasim;',
  'orgasm', 'orgasum', 'oriface', 'orifice', 'orifiss', 'packi', 'packie',
  'packy', 'paki', 'pakie', 'paky', 'pecker', 'peeenus', 'peeenusss',
  'peenus', 'peinus', 'pen1s', 'penas', 'penis', 'penis-breath', 'penus',
  'penuus', 'phuc', 'phuck', 'phuk', 'phuker', 'phukker', 'polac',
  'polack', 'polak', 'poonani', 'pr1c', 'pr1ck', 'pr1k', 'pusse',
  'pussee', 'pussy', 'puuke', 'puuker', 'qweir', 'recktum', 'rectum',
  'retard', 'sadist', 'scank', 'schlong', 'screwing', 'semen', 'sex',
  'sexy', 'sh!t', 'sh1t', 'sh1ter', 'sh1ts', 'sh1tter', 'sh1tz', 'shit',
  'shits', 'shitter', 'shitty', 'shity', 'shitz', 'shyt', 'shyte',
  'shytty', 'shyty', 'skanck', 'skank', 'skankee', 'skankey', 'skanks',
  'skanky', 'slag', 'slut', 'sluts', 'slutty', 'slutz', 'son-of-a-bitch',
  'tit', 'turd', 'va1jina', 'vag1na', 'vagiina', 'vagina', 'vaj1na',
  'vajina', 'vullva', 'vulva', 'w0p', 'wh00r', 'wh0re', 'whore',
  'xrated', 'xxx', 'b!+ch', 'bitch', 'blowjob', 'clit', 'arschloch',
  'fuck', 'shit', 'ass', 'asshole', 'b!tch', 'b17ch', 'b1tch', 'bastard',
  'bi+ch', 'boiolas', 'buceta', 'c0ck', 'cawk', 'chink', 'cipa', 'clits',
  'cock', 'cum', 'cunt', 'dildo', 'dirsa', 'ejakulate', 'fatass', 'fcuk',
  'fuk', 'fux0r', 'hoer', 'hore', 'jism', 'kawk', 'l3itch', 'l3i+ch',
  'masturbate', 'masterbat*', 'masterbat3', 'motherfucker', 's.o.b.',
  'mofo', 'nazi', 'nigga', 'nigger', 'nutsack', 'phuck', 'pimpis', 'pusse',
  'pussy', 'scrotum', 'sh!t', 'shemale', 'shi+', 'sh!+', 'slut', 'smut',
  'teets', 'tits', 'boobs', 'b00bs', 'teez', 'testical', 'testicle',
  'titt', 'w00se', 'jackoff', 'wank', 'whoar', 'whore', '*damn', '*dyke',
  '*fuck*', '*shit*', '@$$', 'amcik', 'andskota', 'arse*', 'assrammer',
  'ayir', 'bi7ch', 'bitch*', 'bollock*', 'breasts', 'butt-pirate', 'cabron',
  'cazzo', 'chraa', 'chuj', 'cock*', 'cunt*', 'd4mn', 'daygo', 'dego',
  'dick*', 'dike*', 'dupa', 'dziwka', 'ejackulate', 'ekrem*', 'ekto',
  'enculer', 'faen', 'fag*', 'fanculo', 'fanny', 'feces', 'feg', 'felcher',
  'ficken', 'fitt*', 'flikker', 'foreskin', 'fotze', 'fu(*', 'fuk*',
  'futkretzn', 'gook', 'guiena', 'h0r', 'h4x0r', 'hell', 'helvete',
  'hoer*', 'honkey', 'huevon', 'hui', 'injun', 'jizz', 'kanker*', 'kike',
  'klootzak', 'kraut', 'knulle', 'kuk', 'kuksuger', 'kurac', 'kurwa',
  'kusi*', 'kyrpa*', 'lesbo', 'mamhoon', 'masturbat*', 'merd*', 'mibun',
  'monkleigh', 'mouliewop', 'muie', 'mulkku', 'muschi', 'nazis',
  'nepesaurio', 'nigger*', 'orospu', 'paska*', 'perse', 'picka',
  'pierdol*', 'pillu*', 'pimmel', 'piss*', 'pizda', 'poontsee', 'poop',
  'porn', 'p0rn', 'pr0n', 'preteen', 'pula', 'pule', 'puta', 'puto',
  'qahbeh', 'queef*', 'rautenberg', 'schaffer', 'scheiss*', 'schlampe',
  'schmuck', 'screw', 'sh!t*', 'sharmuta', 'sharmute', 'shipal', 'shiz',
  'skribz', 'skurwysyn', 'sphencter', 'spic', 'spierdalaj', 'splooge',
  'suka', 'b00b*', 'testicle*', 'titt*', 'twat', 'vittu', 'wank*',
  'wetback*', 'wichser', 'wop*', 'yed', 'zabourah',
];

// Character substitutions
const leetMap: Record<string, string> = {
  '@': 'a',
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '9': 'g',
  '!': 'i',
  '|': 'i',
  '+': 't',
};

// Normalize string like Flutter version
function normalizeForProfanity(input: string): string {
  if (!input) return '';
  let buf = '';
  const s = input.toLowerCase();
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const rep = leetMap[ch];
    if (rep) {
      buf += rep;
      continue;
    }
    const code = ch.charCodeAt(0);
    const isAlpha = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    if (isAlpha || isDigit) {
      buf += ch;
      continue;
    }
    if (['_', '-', '.', '/', '\\'].includes(ch)) {
      buf += ' ';
      continue;
    }
    if (ch.trim() === '') {
      buf += ' ';
      continue;
    }
    // drop everything else
  }
  return buf.replace(/\s+/g, ' ').trim();
}

// Cache regex
const regexCache: Record<string, RegExp | null> = {};

function buildProfanityPattern(word: string): RegExp | null {
  const w = normalizeForProfanity(word.trim());
  if (!w) return null;
  const parts = w.split(/\s+/).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const core = parts.join('\\s+');
  return new RegExp(`(^|[^a-z0-9])${core}([^a-z0-9]|$)`, 'i');
}

export function containsProfanity(input: string): boolean {
  if (!input.trim()) return false;
  const text = normalizeForProfanity(input);
  for (const w of profaneWords) {
    if (!regexCache[w]) {
      regexCache[w] = buildProfanityPattern(w);
    }
    const re = regexCache[w];
    if (re && re.test(text)) return true;
  }
  return false;
}
