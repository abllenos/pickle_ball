import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language, VoiceStyle } from '../types/models'

export type Theme = 'auto' | 'light' | 'dark'

type DeviceSettings = {
  theme: Theme
  speakerOn: boolean
  language: Language
  voiceURI: string | null
  voiceStyle: VoiceStyle
  rate: number
  chime: boolean
  sayTwice: boolean
  announceWinners: boolean
}

type DeviceSettingsActions = {
  update: (patch: Partial<DeviceSettings>) => void
}

const defaults: DeviceSettings = {
  theme: 'auto',
  speakerOn: true,
  language: 'en',
  voiceURI: null,
  voiceStyle: 'narrator',
  rate: 0.8,
  chime: true,
  sayTwice: false,
  announceWinners: true,
}

export const useDeviceSettings = create<DeviceSettings & DeviceSettingsActions>()(
  persist(
    (set) => ({
      ...defaults,
      update: (patch) => set(patch),
    }),
    { name: 'openplay.device', version: 1 },
  ),
)
