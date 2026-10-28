import { create } from 'zustand'
import { announcementLines, type Announcement } from '../core/announcer'
import { previewName, speak, stopSpeaking } from '../lib/speech'
import { useDeviceSettings } from './deviceSettings'

type AnnouncerState = {
  current: string | null
  queue: Announcement[]
  notice: string | null
  recent: { at: number; call: Announcement }[]
  announce: (a: Announcement) => void
  previewName: (name: string, sayAs?: string) => void
  stop: () => void
  dismiss: () => void
}

export const useAnnouncer = create<AnnouncerState>()((set, get) => {
  const play = (a: Announcement) => {
    const s = useDeviceSettings.getState()
    const text = announcementLines(a, s.language).join(' ')
    set({ current: text })
    speak(a, { lang: s.language, voiceURI: s.voiceURI, style: s.voiceStyle, rate: s.rate, chime: s.chime, sayTwice: s.sayTwice })
      .then(() => {
        if (get().current !== text) return
        const [next, ...rest] = get().queue
        set({ current: null, queue: rest })
        if (next) play(next)
      })
      .catch((error: Error) => set({ current: null, queue: [], notice: error.message }))
  }

  return {
    current: null,
    queue: [],
    notice: null,
    recent: [],
    announce: (a) => {
      const s = useDeviceSettings.getState()
      if (a.kind === 'winner' && !s.announceWinners) return
      if (!s.speakerOn) {
        set({ notice: 'Speaker calls are off on this device. Turn them on in Session.' })
        return
      }
      set((state) => ({ notice: null, recent: [{ at: Date.now(), call: a }, ...state.recent].slice(0, 8) }))
      if (get().current) set((state) => ({ queue: [...state.queue, a] }))
      else play(a)
    },
    previewName: (name, sayAs) => {
      if (get().current) return
      const s = useDeviceSettings.getState()
      previewName(name, sayAs, { lang: s.language, voiceURI: s.voiceURI, style: s.voiceStyle, rate: s.rate, chime: false, sayTwice: false })
    },
    stop: () => {
      stopSpeaking()
      set({ current: null, queue: [] })
    },
    dismiss: () => set({ notice: null }),
  }
})
