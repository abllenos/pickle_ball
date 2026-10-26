import { create } from 'zustand'
import { useSession } from '../store/sessionStore'

/**
 * Cast to TV with the Presentation API: the TV (Chromecast / Google TV) loads /display itself,
 * and this phone sends it the session every time it changes. The phone stays on the organizer screens.
 */

type CastStatus = 'idle' | 'connecting' | 'connected'

export const useCast = create<{ supported: boolean; available: boolean; status: CastStatus }>(() => ({
  supported: typeof PresentationRequest !== 'undefined',
  available: false,
  status: 'idle',
}))

const ID_KEY = 'openplay.cast-id'
const HELLO = 'hello'

let request: PresentationRequest | null = null
let connection: PresentationConnection | null = null
let unsubscribe: (() => void) | null = null

function remember(id: string | null) {
  try {
    if (id) localStorage.setItem(ID_KEY, id)
    else localStorage.removeItem(ID_KEY)
  } catch {
    // Storage blocked: casting still works, it just won't reconnect after a reload
  }
}

function detach() {
  unsubscribe?.()
  unsubscribe = null
  connection = null
  useCast.setState({ status: 'idle' })
}

function attach(c: PresentationConnection) {
  connection = c
  remember(c.id)
  // Functions in the store are dropped by JSON.stringify, so this sends the session data only
  const send = () => {
    if (c.state === 'connected') c.send(JSON.stringify(useSession.getState()))
  }
  c.onconnect = () => {
    useCast.setState({ status: 'connected' })
    send()
  }
  c.onclose = detach
  c.onterminate = () => {
    remember(null)
    detach()
  }
  c.onmessage = (event) => {
    if (event.data === HELLO) send()
  }
  unsubscribe?.()
  unsubscribe = useSession.subscribe(send)
  if (c.state === 'connected') c.onconnect(new Event('connect'))
}

/** Phone side: set up casting and reconnect to a TV that was still showing the dashboard. */
export function initCast() {
  if (typeof PresentationRequest === 'undefined') return
  request = new PresentationRequest([new URL('/display', location.href).href])
  if (navigator.presentation) navigator.presentation.defaultRequest = request

  request
    .getAvailability()
    .then((availability) => {
      const update = () => useCast.setState({ available: availability.value })
      update()
      availability.onchange = update
    })
    // Some phones can't watch for TVs in the background; the picker still finds them
    .catch(() => useCast.setState({ available: true }))

  let id: string | null = null
  try {
    id = localStorage.getItem(ID_KEY)
  } catch {
    // Storage blocked
  }
  if (id) request.reconnect(id).then(attach, () => remember(null))
}

/** Opens the TV picker. Must be called from a tap. */
export async function startCast() {
  if (!request) return
  useCast.setState({ status: 'connecting' })
  try {
    attach(await request.start())
  } catch {
    // Picker dismissed or no TV found
    useCast.setState({ status: connection ? 'connected' : 'idle' })
  }
}

export function stopCast() {
  connection?.terminate()
}

/** TV side: when this page was opened by a cast, show whatever session the phone sends. */
export function startCastReceiver() {
  const receiver = navigator.presentation?.receiver
  if (!receiver) return
  const listen = (c: PresentationConnection) => {
    c.onmessage = (event) => useSession.setState(JSON.parse(event.data))
    if (c.state === 'connected') c.send(HELLO)
    else c.onconnect = () => c.send(HELLO)
  }
  void receiver.connectionList.then((list) => {
    list.connections.forEach(listen)
    list.onconnectionavailable = (event) => listen(event.connection)
  })
}
