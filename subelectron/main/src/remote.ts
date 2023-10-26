
import {ipcRenderer, MenuItemConstructorOptions, IpcRendererEvent} from 'electron'
// const {ipcRenderer, MenuItemConstructorOptions, IpcRendererEvent} = require('electron')


interface AppInfo {
  name: string,
  version: string,
  appData: string,
  userData: string,
  exe: string,
  appRoot: string,
  downloads: string,
  desktop: string,
  temp: string
  argv: string[],
  isPackaged: boolean,
  debug: boolean,
  testing: boolean
}

interface MoveArgs {
  x: number, y: number,
  width: number, height: number,
}

export function getAppInfo(): AppInfo {
  return ipcRenderer.sendSync('appInfo') as AppInfo
}

export function move(arg={x:undefined, y:undefined, width:0, height:0}): MoveArgs {
  let ret = ipcRenderer.sendSync('move', arg) as MoveArgs
  console.log(JSON.stringify(ret))
  return ret
}

export  async function dialog(opts: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue> {
  return await ipcRenderer.invoke("dialog", opts)
}

export async function openDialog(opts: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue> {
  return await ipcRenderer.invoke("dialog-open", opts)
}

export async function saveDialog(opts: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue> {
  return await ipcRenderer.invoke("dialog-save", opts)
}

function* menuDrill(template: MenuItemConstructorOptions[]): Generator<MenuItemConstructorOptions> {
  for (let row of template) {
    yield row
    if (row.submenu) {
      for (let subrow of menuDrill(row.submenu as MenuItemConstructorOptions[]))
        yield subrow
    }
  }
}

export interface PtyOptions {
  name?: string,
  cols?: number,
  rows?: number,
  cwd?: string,
  env?: any
}

const pyts = {}
ipcRenderer.on('pty-data', (e, {pid, data}) => { pyts[pid]?.onData(data) })
ipcRenderer.on('pty-exit', (e, {pid, exitCode, signal}) => { 
  let pty = pyts[pid]
  if (pty) {  
    pty.onExit(pid, exitCode, signal)
    pty.pid = -1
    delete pyts[pid] 
  }
})

export class Pty {
  pid: number = -1
  startPromise: Promise<number>
  onData = function(data: string) {} 
  onExit = function(pid: number, exitCode: number, signal?: string) {} 

  constructor (public file: string, public args?: string[], options?: PtyOptions) {
    this.startPromise = ipcRenderer.invoke("pty-start", {file, args, options})
    this.startPromise.then((pid) => {
      this.pid = pid
      pyts[pid] = this
    })
  }

  resize(columns: number, rows: number) {
    let pid = this.pid
    if (pid >= 0)
      return ipcRenderer.invoke("pty-resize", {pid, columns, rows})
  }

  write(data: string) {
    let pid = this.pid
    if (pid >= 0)
      return ipcRenderer.invoke("pty-write", {pid, data})
  }

  kill(signal?: string) {
    let pid = this.pid
    if (pid >= 0)
      return ipcRenderer.invoke("pty-kill", {pid, signal})
  }
}

export class Menu {
  private click_map: (() => void)[] = [null]
  private id = -1

  constructor(public template: MenuItemConstructorOptions[] = []) {}

  private register() {
    for (let row of menuDrill(this.template)) {
      const click = row.click as any
      if (click) {
        row.click = this.click_map.length as any
        this.click_map.push(click)
      }
    }
    
    return ipcRenderer.invoke("menu-make", this.template)
  }

  reset(template: MenuItemConstructorOptions[]=null) {
    if (template)
      this.template = template
    this.id = -1
    // memory leak previous poppup'd menu(s), address this someday if it becomes important
  }

  insert(position: number, item: MenuItemConstructorOptions){
    this.template.splice(position, 0, item)
  }

  async popup({delay}={delay:0}) {
    if (this.id < 0) {
      this.id = await this.register()
    }

    // wait for the menu selection to complete
    const click_idx = await ipcRenderer.invoke("menu-show", {idx: this.id, delay})

    // execute the click handler if appropriate
    if (click_idx && click_idx < this.click_map.length) {
      try {
        return this.click_map[click_idx]()
      } catch (e) {
        console.log('exception with click_map[click_idx]:', click_idx, this.click_map)
        throw e
      }
    }
  }
}

export async function menu(template: MenuItemConstructorOptions[], {delay}={delay:0}): Promise<any> {
  // swap out any click handlers with integer id's
  const click_map = [null]
  for (let row of menuDrill(template)) {
    const click = row.click as any
    if (click) {
      row.click = click_map.length as any
      click_map.push(click)
    }
  }

  // wait for the menu selection to complete
  const click_idx = await ipcRenderer.invoke("menu", {template, delay})

  // execute the click handler if appropriate
  if (click_idx && click_idx < click_map.length) {
    try {
      return click_map[click_idx]()
    } catch (e) {
      console.log('exception with click_map[click_idx]:', click_idx, click_map)
      throw e
    }
      
  }
}

export function onBeforeClose(handler: (event: IpcRendererEvent, ...args: any[]) => void) {
  ipcRenderer.on('close-attempted', handler)
  ipcRenderer.invoke('prevent-close', true)
}

export function onBeforeCloseClear() {
  ipcRenderer.invoke('prevent-close', false)
}

export function close({force=false}) {
  ipcRenderer.invoke("close", force)
}

export function updateCheck() {
  ipcRenderer.invoke("update", "check")
}
