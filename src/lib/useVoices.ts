import { useEffect, useState } from 'react'
import { getVoices, isSpeechSupported } from './speech'

export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState(getVoices)

  useEffect(() => {
    if (!isSpeechSupported) return
    const update = () => setVoices(getVoices())
    window.speechSynthesis.addEventListener('voiceschanged', update)
    update()
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])

  return voices
}
