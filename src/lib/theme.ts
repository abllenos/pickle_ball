import { flushSync } from 'react-dom'
import { useDeviceSettings, type Theme } from '../store/deviceSettings'

const darkQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'auto') return darkQuery?.matches ? 'dark' : 'light'
  return theme
}

function apply() {
  const resolved = resolveTheme(useDeviceSettings.getState().theme)
  document.documentElement.dataset.theme = resolved
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0a110e' : '#128a52')
}

/**
 * Switches the theme with an animation: a circle that grows from `from` (the button that was tapped),
 * or a cross-fade without it. Instant where View Transitions aren't supported or motion is reduced.
 */
export function changeTheme(theme: Theme, from?: { x: number; y: number }) {
  const set = () => flushSync(() => useDeviceSettings.getState().update({ theme }))
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduce) return set()

  const root = document.documentElement
  if (from) root.classList.add('theme-reveal')
  const transition = document.startViewTransition(set)
  if (!from) return

  const radius = Math.hypot(Math.max(from.x, innerWidth - from.x), Math.max(from.y, innerHeight - from.y))
  void transition.ready.then(() =>
    root.animate(
      { clipPath: [`circle(0px at ${from.x}px ${from.y}px)`, `circle(${radius}px at ${from.x}px ${from.y}px)`] },
      { duration: 550, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
    ),
  )
  void transition.finished.finally(() => root.classList.remove('theme-reveal'))
}

/** Keeps <html data-theme> in step with the saved choice and the phone's dark mode. */
export function startThemeSync() {
  apply()
  darkQuery?.addEventListener('change', apply)
  useDeviceSettings.subscribe(apply)
}
