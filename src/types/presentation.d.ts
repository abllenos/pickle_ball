// Presentation API (casting a page to a Chromecast / Google TV). Not in TypeScript's DOM types yet.

interface PresentationConnection extends EventTarget {
  readonly id: string
  readonly state: 'connecting' | 'connected' | 'closed' | 'terminated'
  send(data: string): void
  close(): void
  terminate(): void
  onconnect: ((event: Event) => void) | null
  onclose: ((event: Event) => void) | null
  onterminate: ((event: Event) => void) | null
  onmessage: ((event: MessageEvent<string>) => void) | null
}

interface PresentationAvailability extends EventTarget {
  readonly value: boolean
  onchange: ((event: Event) => void) | null
}

interface PresentationRequest extends EventTarget {
  start(): Promise<PresentationConnection>
  reconnect(id: string): Promise<PresentationConnection>
  getAvailability(): Promise<PresentationAvailability>
}

declare var PresentationRequest: { new (urls: string | string[]): PresentationRequest } | undefined

interface PresentationConnectionList extends EventTarget {
  readonly connections: PresentationConnection[]
  onconnectionavailable: ((event: Event & { connection: PresentationConnection }) => void) | null
}

interface Presentation {
  defaultRequest: PresentationRequest | null
  readonly receiver: { readonly connectionList: Promise<PresentationConnectionList> } | null
}

interface Navigator {
  readonly presentation?: Presentation
}
