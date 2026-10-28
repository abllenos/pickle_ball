import { spokenLines, spokenName, type Announcement } from '../core/announcer'
import type { Language, VoiceStyle } from '../types/models'

export type SpeakOptions = {
  lang: Language
  voiceURI: string | null
  style: VoiceStyle
  rate: number
  chime: boolean
  sayTwice: boolean
}

const NARRATOR = { pitch: 0.55, rateFactor: 0.9 }
const MALE_VOICE = /\b(male|david|mark|guy|daniel|george|james|ryan|fred|alex|arthur|thomas|andrew|brian|christopher|eric|roger|steffan)\b/i

export const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export function getVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported) return []
  try {
    return window.speechSynthesis.getVoices()
  } catch {
    return []
  }
}

const isTagalog = (v?: SpeechSynthesisVoice) => Boolean(v && /^(fil|tl)/i.test(v.lang))

export function pickVoice(lang: Language, voiceURI: string | null, style: VoiceStyle = 'standard'): SpeechSynthesisVoice | undefined {
  const voices = getVoices()
  const chosen = voiceURI ? voices.find((v) => v.voiceURI === voiceURI) : undefined
  if (chosen) return chosen
  const preferred = lang === 'tl' ? /^(fil|tl)/i : /^en[-_](PH|US|GB)/i
  const groups = [
    voices.filter((v) => preferred.test(v.lang)),
    voices.filter((v) => /^en[-_]PH/i.test(v.lang)),
    voices.filter((v) => /^en/i.test(v.lang)),
  ]
  for (const group of groups) {
    const pick = style === 'narrator' ? (group.find((v) => MALE_VOICE.test(v.name)) ?? group[0]) : group[0]
    if (pick) return pick
  }
  return undefined
}

let audioContext: AudioContext | null = null

function playChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return resolve()
      audioContext ??= new AC()
      const ctx = audioContext
      if (ctx.state === 'suspended') void ctx.resume()
      for (const [freq, offset] of [[880, 0], [660, 0.35]]) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const start = ctx.currentTime + offset
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.35, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6)
        osc.connect(gain).connect(ctx.destination)
        osc.start(start)
        osc.stop(start + 0.65)
      }
      setTimeout(resolve, 1100)
    } catch {
      resolve()
    }
  })
}

let token = 0

function speakRound(a: Announcement, options: SpeakOptions): Promise<void> {
  const voice = pickVoice(options.lang, options.voiceURI, options.style)
  return speakLines(spokenLines(a, options.lang, isTagalog(voice)), voice, options)
}

function speakLines(lines: string[], voice: SpeechSynthesisVoice | undefined, options: SpeakOptions): Promise<void> {
  return new Promise((resolve) => {
    const narrator = options.style === 'narrator'
    lines.forEach((line, i) => {
      const u = new SpeechSynthesisUtterance(line)
      u.rate = narrator ? options.rate * NARRATOR.rateFactor : options.rate
      u.pitch = narrator ? NARRATOR.pitch : 1
      u.lang = voice?.lang ?? (options.lang === 'tl' ? 'fil-PH' : 'en-PH')
      if (voice) u.voice = voice
      if (i === lines.length - 1) {
        u.onend = () => resolve()
        u.onerror = () => resolve()
      }
      window.speechSynthesis.speak(u)
    })
  })
}

export async function speak(a: Announcement, options: SpeakOptions): Promise<void> {
  if (!isSpeechSupported) throw new Error("This browser can't speak. Try Chrome or Edge.")
  const t = ++token
  window.speechSynthesis.cancel()
  if (options.chime) await playChime()
  if (t !== token) return
  await speakRound(a, options)
  if (!options.sayTwice || t !== token) return
  await new Promise((r) => setTimeout(r, 1500))
  if (t === token) await speakRound(a, options)
}

export function previewName(name: string, sayAs: string | undefined, options: SpeakOptions): void {
  if (!isSpeechSupported) return
  const voice = pickVoice(options.lang, options.voiceURI, options.style)
  stopSpeaking()
  void speakLines([spokenName(name, sayAs, isTagalog(voice))], voice, options)
}

export function stopSpeaking() {
  token++
  if (isSpeechSupported) window.speechSynthesis.cancel()
}
