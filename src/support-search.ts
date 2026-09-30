// Small, local search index: related terms and minor typos, with no external service.
const groups = [
  ['license', 'licence', 'purchase', 'paid', 'payment', 'buy', 'bought'],
  ['invoice', 'receipt', 'billing'],
  ['microphone', 'mic', 'audio'],
  ['text', 'words', 'word', 'script', 'scripts'],
  ['scrolling', 'scroll', 'moving', 'move'],
  ['work', 'works', 'working'],
  ['stuck', 'frozen', 'freeze', 'stopped', 'stops', 'stop'],
  ['slow', 'lag', 'lagging', 'delay', 'delayed', 'faster', 'speed', 'behind'],
  ['record', 'recording', 'film', 'filming', 'video'],
  ['rotate', 'rotation', 'sideways', 'landscape', 'horizontal'],
  ['transparent', 'transparency', 'opacity'],
  ['hide', 'hidden', 'invisible'],
  ['monitor', 'display', 'screen'],
  ['import', 'upload', 'paste', 'load'],
  ['start', 'begin', 'launch'],
  ['natural', 'gaze', 'eyes'],
  ['sync', 'syncing', 'transfer', 'restore'],
  ['iphone', 'ios'], ['ipad', 'ipados'], ['mac', 'macos', 'macbook'],
];
const aliases = new Map(groups.flatMap(group => group.map(word => [word, group[0]] as const)));
const ignored = new Set('a an the i my me we you your it its is are was be been do does did how what why where when can could would should to for from of on in with and or as at that this have has get app voiceprompter please help not no don t doesn isn aren won cannot want need use using'.split(' '));
const normalize = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/picture[ -]in[ -]picture/g, 'pip');
// Normalize negative phrases together, without losing their meaning for phrase ranking.
const phraseText = (text: string) => normalize(text)
  .replace(/\b(?:doesn|don|isn|aren|won|can)['’]?t\b|\bcannot\b/g, 'not')
  .replace(/\b(?:does|do|is|are|will|can) not\b/g, 'not')
  .replace(/[^a-z0-9]+/g, ' ').trim();
const tokens = (text: string) => [...new Set((phraseText(text).match(/[a-z0-9]+/g) || []).filter(word => !ignored.has(word)).map(word => aliases.get(word) || word))];
function near(a: string, b: string) {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4 || Math.abs(a.length - b.length) > 1) return false;
  // One insertion, deletion, substitution, or adjacent transposition.
  if (a.length === b.length) {
    const different = [...a].map((c, i) => c === b[i] ? -1 : i).filter(i => i !== -1);
    return different.length === 1 || (different.length === 2 && different[1] === different[0] + 1 && a[different[0]] === b[different[1]] && a[different[1]] === b[different[0]]);
  }
  const [short, long] = a.length < b.length ? [a, b] : [b, a];
  let i = 0;
  while (i < short.length && short[i] === long[i]) i++;
  return short.slice(i) === long.slice(i + 1);
}
export function createSupportSearch(entries: { id: string; question: string; keywords: string; text: string; searchPhrases?: string[] }[]) {
  const index = entries.map(entry => ({ ...entry, title: tokens(entry.question), hints: tokens(`${entry.keywords} ${(entry.searchPhrases || []).join(' ')}`), body: tokens(entry.text), phrases: (entry.searchPhrases || []).map(phraseText) }));
  return (query: string) => {
    const words = tokens(query);
    const phrase = ` ${phraseText(query)} `;
    return new Map(index.map(entry => {
      let matched = 0;
      let score = 0;
      for (const word of words) {
        const weight = (field: string[], value: number) => field.includes(word) ? value : field.some(token => near(word, token)) ? value * .65 : 0;
        const best = Math.max(weight(entry.title, 5), weight(entry.hints, 4), weight(entry.body, 1));
        if (best) matched++;
        score += best;
      }
      // Keep results relevant; a loose single-word overlap is not enough.
      const relevant = words.length > 0 && matched >= Math.ceil(words.length * .75);
      // One phrase bonus only; longer lists do not inflate the score.
      const phraseMatch = entry.phrases.some(value => phrase.includes(` ${value} `));
      return [entry.id, !query.trim() ? 1 : relevant ? score + (phraseMatch ? 12 : 0) : 0];
    }));
  };
}
