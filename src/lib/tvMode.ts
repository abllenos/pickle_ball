type LockableOrientation = ScreenOrientation & { lock?: (orientation: 'landscape') => Promise<void> }

/** Full screen + landscape for showing the TV display on this device. Call from a tap (browsers require it). */
export async function enterTvMode() {
  try {
    await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })
    await (screen.orientation as LockableOrientation).lock?.('landscape')
  } catch {
    // Not supported (e.g. iPhone): DisplayPage.css rotates the display on portrait phones instead
  }
}

export function exitTvMode() {
  try {
    screen.orientation.unlock()
  } catch {
    // Nothing was locked
  }
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
}
