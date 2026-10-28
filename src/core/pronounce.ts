// How an English voice should say common Filipino names and nicknames.
// A Tagalog voice reads them correctly as written, so this is only used without one.
const RESPELL: Record<string, string> = {
  ana: 'Ah-nah',
  analyn: 'Ah-nah-lin',
  ate: 'Ah-teh',
  boboy: 'Bo-boy',
  bong: 'Bohng',
  celso: 'Sell-so',
  cha: 'Chah',
  dante: 'Dahn-teh',
  dodong: 'Doh-dong',
  eduardo: 'Ed-wahr-doh',
  ely: 'Eh-lee',
  enrique: 'En-ree-keh',
  gener: 'Heh-nehr',
  inday: 'In-die',
  jaime: 'High-meh',
  jhun: 'Joon',
  jose: 'Ho-seh',
  juan: 'Wahn',
  jun: 'Joon',
  junjun: 'Joon-joon',
  kuya: 'Koo-yah',
  ligaya: 'Lee-guy-yah',
  lito: 'Lee-toe',
  loida: 'Loy-dah',
  lourdes: 'Lord-ess',
  luzviminda: 'Looz-vee-min-dah',
  manuel: 'Mahn-well',
  maricel: 'Mah-ree-sell',
  marife: 'Mah-ree-feh',
  marites: 'Mah-ree-tess',
  migs: 'Meegs',
  miguel: 'Mee-gell',
  nene: 'Neh-neh',
  nonoy: 'No-noy',
  pepe: 'Peh-peh',
  pia: 'Pee-ah',
  ramil: 'Rah-mill',
  ramon: 'Rah-mohn',
  rene: 'Reh-neh',
  rhea: 'Ray-ah',
  teresita: 'Teh-reh-see-tah',
  tonyo: 'Tone-yoh',
  toto: 'Toe-toe',
  totoy: 'Toe-toy',
}

function respellWord(word: string): string {
  if (/^ma\.?$/i.test(word)) return 'Maria'
  const known = RESPELL[word.toLowerCase()]
  if (known) return known
  return word.replace(/ñ/g, 'ny').replace(/Ñ/g, 'Ny')
}

export function respellName(name: string): string {
  return name.split(/\s+/).map(respellWord).join(' ')
}
