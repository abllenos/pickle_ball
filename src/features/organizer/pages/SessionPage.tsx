import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CastButton } from '../../../components/CastButton/CastButton'
import { Icon } from '../../../components/Icon'
import { PageHeader } from '../../../components/PageHeader/PageHeader'
import { Segmented } from '../../../components/Segmented'
import { announcementLines } from '../../../core/announcer'
import { isSpeechSupported } from '../../../lib/speech'
import { changeTheme } from '../../../lib/theme'
import { enterTvMode } from '../../../lib/tvMode'
import { formatLeft, useNow, wallClock } from '../../../lib/time'
import { useVoices } from '../../../lib/useVoices'
import { mockTestCall } from '../../../mocks/mockData'
import { useAnnouncer } from '../../../store/announcerStore'
import { useDeviceSettings, type Theme } from '../../../store/deviceSettings'
import { rentalHours, useSession } from '../../../store/sessionStore'
import { SCORE_LIMITS, type Language, type VoiceStyle } from '../../../types/models'
import './SessionPage.css'

type ToggleRowProps = {
  id: string
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ id, label, hint, checked, onChange }: ToggleRowProps) {
  return (
    <label htmlFor={id} className="session__row">
      <span>
        <b>{label}</b>
        {hint && (
          <>
            <br />
            <span className="session__hint">{hint}</span>
          </>
        )}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}

export default function SessionPage() {
  const settings = useDeviceSettings()
  const { update } = settings
  const { announce, recent } = useAnnouncer()
  const session = useSession()
  const voices = useVoices()
  const now = useNow()
  const navigate = useNavigate()
  const [confirmEnd, setConfirmEnd] = useState(false)

  const langMatch = settings.language === 'tl' ? /^(fil|tl)/i : /^en/i
  const sortedVoices = [...voices].sort(
    (a, b) => Number(langMatch.test(b.lang)) - Number(langMatch.test(a.lang)) || a.name.localeCompare(b.name),
  )

  const rentalLeft = session.rentalEndsAt - now
  const starts = wallClock(session.rentalStartsAt)
  const ends = wallClock(session.rentalEndsAt)
  const hours = rentalHours(session)

  return (
    <>
      <PageHeader eyebrow={session.name} title="Session" />

      <section className="card session__card">
        <h2 className="session__title">Appearance</h2>
        <div className="session__row session__row--stack">
          <Segmented<Theme>
            label="Appearance"
            value={settings.theme}
            onChange={(theme) => changeTheme(theme)}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <span className="session__hint">Auto follows your phone's dark mode setting.</span>
        </div>
      </section>

      <section className="card session__card">
        <h2 className="session__title">Games</h2>
        <div className="session__row session__row--stack">
          <b>Play to</b>
          <Segmented
            label="Score limit"
            value={String(session.scoreLimit)}
            onChange={(v) => session.setScoreLimit(Number(v) as (typeof SCORE_LIMITS)[number])}
            options={SCORE_LIMITS.map((n) => ({ value: String(n), label: `${n} points` }))}
          />
          <span className="session__hint">A court's game ends when a team reaches this score.</span>
        </div>
        <ToggleRow
          id="auto-fill"
          label="Fill courts automatically"
          hint="When a game ends, the next four go on that court right away"
          checked={session.autoFill}
          onChange={session.setAutoFill}
        />
        <div className="session__row">
          <span>
            <b>Courts</b>
            <br />
            <span className="session__hint">Only an open court can be removed</span>
          </span>
          <span className="session__stepper">
            <button
              type="button"
              className="session__step"
              aria-label="Remove a court"
              disabled={session.courts.length <= 1 || Boolean(session.courts[session.courts.length - 1].players)}
              onClick={session.removeCourt}
            >
              −
            </button>
            <span className="session__count" aria-live="polite">
              {session.courts.length}
            </span>
            <button type="button" className="session__step" aria-label="Add a court" onClick={session.addCourt}>
              +
            </button>
          </span>
        </div>
        <div className="session__row">
          <span>
            <b>Hours</b>
            <br />
            <span className="session__hint">
              {starts.time} {starts.meridiem} – {ends.time} {ends.meridiem} ·{' '}
              {rentalLeft > 0 ? `${formatLeft(rentalLeft)} left` : 'ended'}
            </span>
          </span>
          <span className="session__stepper">
            <button
              type="button"
              className="session__step"
              aria-label="One hour less"
              disabled={hours <= 1}
              onClick={() => session.setRentalHours(hours - 1)}
            >
              −
            </button>
            <span className="session__count" aria-live="polite">
              {hours}
            </span>
            <button
              type="button"
              className="session__step"
              aria-label="One hour more"
              disabled={hours >= 12}
              onClick={() => session.setRentalHours(hours + 1)}
            >
              +
            </button>
          </span>
        </div>
        <div className="session__row session__row--stack">
          <b>Last call</b>
          <Segmented
            label="Stop new games before the rental ends"
            value={String(session.lastCallMinutes)}
            onChange={(v) => session.setLastCallMinutes(Number(v))}
            options={[
              { value: '0', label: 'Off' },
              { value: '5', label: '5 min' },
              { value: '10', label: '10 min' },
              { value: '15', label: '15 min' },
            ]}
          />
          <span className="session__hint">
            {session.lastCallMinutes
              ? `No new games start in the last ${session.lastCallMinutes} minutes of the rental. You can still start one by hand.`
              : 'New games keep starting until the rental ends.'}
          </span>
        </div>
      </section>

      {!isSpeechSupported && (
        <div className="session__warning">This browser can't speak. Use Chrome or Edge on the speaker device.</div>
      )}

      <section className="card session__card">
        <h2 className="session__title">Speaker</h2>
        <ToggleRow
          id="speaker-on"
          label="Play calls on this device"
          hint="Connect this phone to the venue speaker"
          checked={settings.speakerOn}
          onChange={(speakerOn) => update({ speakerOn })}
        />
        <div className="session__row session__row--stack">
          <b>Voice style</b>
          <Segmented<VoiceStyle>
            label="Voice style"
            value={settings.voiceStyle}
            onChange={(voiceStyle) => update({ voiceStyle })}
            options={[
              { value: 'narrator', label: 'Deep narrator' },
              { value: 'standard', label: 'Standard' },
            ]}
          />
          <span className="session__hint">Deep narrator uses a low, slow male voice for a big-event feel.</span>
        </div>
        <div className="session__row session__row--stack">
          <b>Language</b>
          <Segmented<Language>
            label="Announcement language"
            value={settings.language}
            onChange={(language) => update({ language, voiceURI: null })}
            options={[
              { value: 'en', label: 'English' },
              { value: 'tl', label: 'Tagalog' },
            ]}
          />
        </div>
        <div className="session__row session__row--stack">
          <label htmlFor="voice">
            <b>Voice</b>
          </label>
          <select
            id="voice"
            className="input session__select"
            value={settings.voiceURI ?? ''}
            onChange={(event) => update({ voiceURI: event.target.value || null })}
          >
            <option value="">Automatic (best match)</option>
            {sortedVoices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
          {settings.language === 'tl' && !voices.some((v) => /^(fil|tl)/i.test(v.lang)) && (
            <span className="session__hint">
              No Tagalog voice on this device. Calls use an English voice with Tagalog-style spelling.
            </span>
          )}
        </div>
        <div className="session__row session__row--stack">
          <label htmlFor="rate" className="session__rate-label">
            <b>Speed</b>
            <span className="session__hint">{settings.rate.toFixed(1)}×</span>
          </label>
          <input
            id="rate"
            type="range"
            min={0.5}
            max={1.2}
            step={0.1}
            value={settings.rate}
            onChange={(event) => update({ rate: Number(event.target.value) })}
            className="session__range"
          />
        </div>
        <ToggleRow id="chime" label="Chime before each call" checked={settings.chime} onChange={(chime) => update({ chime })} />
        <ToggleRow
          id="twice"
          label="Say each call twice"
          checked={settings.sayTwice}
          onChange={(sayTwice) => update({ sayTwice })}
        />
        <ToggleRow
          id="winners"
          label="Announce each court's winner"
          checked={settings.announceWinners}
          onChange={(announceWinners) => update({ announceWinners })}
        />
        <button type="button" className="btn btn--accent btn--block session__test" onClick={() => announce(mockTestCall)}>
          <Icon name="speaker" size={18} />
          Play a test call
        </button>
      </section>

      <section className="card session__card">
        <h2 className="session__title">Recent calls</h2>
        {recent.length === 0 ? (
          <p className="session__hint session__empty">Calls you make on this device show up here.</p>
        ) : (
          <ul className="session__calls">
            {recent.map(({ at, call }) => {
              const t = wallClock(at)
              return (
                <li key={at} className="session__call">
                  <span className="session__time">{t.time}</span>
                  <span className="session__call-text">{announcementLines(call, settings.language).join(' ')}</span>
                  <button
                    type="button"
                    className="session__replay"
                    aria-label={`Replay call from ${t.time}`}
                    onClick={() => announce(call)}
                  >
                    <Icon name="play" size={16} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <CastButton />
      <button
        type="button"
        className="btn btn--secondary btn--block"
        onClick={() => {
          void enterTvMode()
          navigate('/display', { state: { fromApp: true } })
        }}
      >
        Show TV screen on this phone
      </button>
      <button
        type="button"
        className={confirmEnd ? 'btn btn--secondary btn--block session__end session__end--confirm' : 'btn btn--secondary btn--block session__end'}
        onClick={() => {
          if (!confirmEnd) return setConfirmEnd(true)
          session.endSession()
          navigate('/')
        }}
      >
        {confirmEnd ? 'Tap again to end the session' : 'End session'}
      </button>
    </>
  )
}
