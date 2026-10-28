// How an English voice should say Filipino and Bisaya names and nicknames.
// A Tagalog voice reads them correctly as written, so this is only used without one.

// Names that don't follow the regular rules below
const RESPELL: Record<string, string> = {
  ana: 'Ah-nah',
  ate: 'Ah-teh',
  dante: 'Dahn-teh',
  eduardo: 'Ed-wahr-doh',
  enrique: 'En-ree-keh',
  gener: 'Heh-nehr',
  inday: 'In-dye',
  jaime: 'High-meh',
  jose: 'Ho-seh',
  juan: 'Wahn',
  jun: 'Joon',
  junjun: 'Joon-joon',
  lourdes: 'Lord-ess',
  manuel: 'Mahn-well',
  marife: 'Mah-ree-feh',
  migs: 'Meegs',
  miguel: 'Mee-gell',
  nene: 'Neh-neh',
  pepe: 'Peh-peh',
  rene: 'Reh-neh',
  rhea: 'Ray-ah',
}

// Spellings that only English names use (Mike, Trisha, Ella, Jay, John, Paul...).
// Those are left for the voice to read normally.
const ENGLISH_SPELLING =
  /th|ch|sh|wh|ph|gh|ck|ee|oo|ea|ie|ou|au|ei|[aeiou]h|[^aeiouyn]y|([b-df-hj-np-tv-z])\1|[^aeiou]e$|[aeiou][^aeiou]es$|^[^aeiou]*[ae]y$|^[^aeiouy]+$/

const VOWEL = /[aeiou]/
const OPEN: Record<string, string> = { a: 'ah', e: 'eh', i: 'ee', o: 'oh', u: 'oo' }
const CLOSED: Record<string, string> = { a: 'ah', e: 'e', i: 'i', o: 'o', u: 'oo' }

type Syllable = { onset: string; vowel: string; coda: string }

function syllables(word: string): Syllable[] {
  // Split into vowel sounds (a, e, ay, oy, aw...) and the consonants around them
  const parts: { vowel: boolean; text: string }[] = []
  for (let i = 0; i < word.length; i++) {
    const ch = word[i]
    const next = word[i + 1] ?? ''
    const prev = parts[parts.length - 1]
    const glide = /[yw]/.test(ch) || (ch === 'i' && /[ao]/.test(prev?.text ?? ''))
    if (prev?.vowel && prev.text.length === 1 && glide && !VOWEL.test(next)) prev.text += ch
    else if (ch === 'n' && next === 'g') parts.push({ vowel: false, text: 'ng' }), i++
    else parts.push({ vowel: VOWEL.test(ch), text: ch })
  }

  const result: Syllable[] = []
  let consonants: string[] = []
  for (const part of parts) {
    if (!part.vowel) {
      consonants.push(part.text)
      continue
    }
    const last = result[result.length - 1]
    // One consonant starts the next syllable; with two or more, the first closes this one
    if (last && consonants.length > 1) last.coda = consonants.shift() ?? ''
    result.push({ onset: consonants.join(''), vowel: part.text, coda: '' })
    consonants = []
  }
  const last = result[result.length - 1]
  if (last) last.coda += consonants.join('')
  return result
}

function sayVowel({ onset, vowel, coda }: Syllable): string {
  if (/^a[iy]$/.test(vowel)) return onset ? 'ye' : 'eye'
  if (/^o[iy]$/.test(vowel)) return 'oy'
  if (vowel === 'uy') return 'ooy'
  if (/^a[ow]$/.test(vowel)) return 'ow'
  if (vowel === 'ey') return 'ay'
  if (vowel === 'iw') return 'ew'
  if (vowel.length > 1) return OPEN[vowel[0]] + vowel.slice(1)
  if (!coda) return OPEN[vowel]
  return vowel === 'e' && coda.startsWith('r') ? 'eh' : CLOSED[vowel]
}

function bisaya(word: string): string {
  const letters = word
    .replace(/qu(?=[ei])/g, 'k')
    .replace(/gu(?=[ei])/g, 'g')
    .replace(/c(?=[ei])/g, 's')
    .replace(/c/g, 'k')
    // Gelo, Angelo: a soft g, as in Angel
    .replace(/g(?=e)/g, 'j')
    .replace(/x/g, 'ks')
  const said = syllables(letters)
    .map((s) => s.onset + sayVowel(s) + s.coda)
    .join('-')
  return said.charAt(0).toUpperCase() + said.slice(1)
}

function respellWord(word: string): string {
  if (/^ma\.?$/i.test(word)) return 'Maria'
  if (word.length < 2 || /[^\p{L}]/u.test(word)) return word
  const plain = word
    .replace(/ñ/gi, 'ny')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    // Jhun, Dhang, Bhoy: the h is only for style
    .replace(/([bdjklmnprtv])h(?=[aeiou])/g, '$1')
  const known = RESPELL[word.toLowerCase()] ?? RESPELL[plain]
  if (known) return known
  if (ENGLISH_SPELLING.test(plain)) return plain === word.toLowerCase() ? word : plain.charAt(0).toUpperCase() + plain.slice(1)
  return bisaya(plain)
}

export function respellName(name: string): string {
  return name.split(/\s+/).map(respellWord).join(' ')
}
