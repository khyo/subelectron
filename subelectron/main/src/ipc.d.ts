/** Types for superior/inferior inter-process communication via SubElectron */

/** IPC event handler callable */
type Handler = (event: string, arg: any) => any

interface Ipc {
  /** Send one-way event to Superior */
  send(event: string, arg?: any): void
  /** Specify an event handler for one-way event sent from Superior */
  on(event: string, handler: Handler): void
  /** Cancel an event handler and return the handler if one existed */
  cancel(event: string): Handler | undefined
  /** Ask Superior to perform request with arguments, wait for and return the response */
  ask(req: string, arg?: any, timeout?: number): Promise<any>
}
