
export default class JSONSerializer<T=any> {
  isLoaded: boolean
  queueDuration: number
  fileName: string
  data: T
  loadPromise: Promise<void>

  constructor(fileName?: string)

  load(fileName?: string): Promise<void>
  save(): Promise<void>
  flush(): Promise<void>
  queueSave(): void
  on(event: string, handler: (data: T) => void)
  update(obj: {[key: string]: any}): boolean
}
