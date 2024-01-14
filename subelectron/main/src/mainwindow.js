/* Copyright Subinitial LLC, Author: Kyle Howen */
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
const http = require('node:http')
const path = require('node:path')
const fs = require('node:fs')
const readline = require('node:readline')

const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const { createOptsWindow } = require('./optswindow.js')

const opts = JSON.parse(process.argv[2])


function make() {
  let mainWindow
  

  let preventClose = false
  ipcMain.handle('prevent-close', (event, arg) => { preventClose = arg })


  const appInfo =  {
    isPackaged: app.isPackaged,
    argv: process.argv,
    primaryInstance: app.requestSingleInstanceLock(),
    debug: process.env.DEBUG === undefined ? true : process.env.DEBUG,
    testing: process.env.TESTING === undefined ? true : process.env.TESTING,
  }
  ipcMain.on('appInfo', (event) => { event.returnValue = appInfo })


  async function createWindow () {
    // Create the browser window.
    mainWindow = await createOptsWindow({
      optspath: path.join(opts.cache, 'wopts.json'),
      title: opts.title,
      icon: path.join(__dirname, "..", "default", 'icon.png'),
      isPrimaryInstance: appInfo.primaryInstance,
      show: process.argv.includes("--show-early"),
      preload: path.join(__dirname, 'preload.js'),
    })

    if (opts.icon) {
      mainWindow.setIcon(opts.icon)
    }

    mainWindow.on('close', (event) => {
      if (preventClose) {
        event.preventDefault()
        mainWindow.webContents.send("close-attempted")  
      }
    })

    mainWindow.on('closed', function () {
      mainWindow = null
    })


    // load the instructed webpage
    
    mainWindow.setTitle(opts.title || 'SubElectron')
    
    const url_or_file = opts.load
    const ul = url_or_file.toLowerCase()

    if (ul.startsWith("plugin:")) {
      // @ts-ignore: launch the plugin and let the plugin load the appropriate URL
      await Promise.resolve(require(ul.slice(7)).main(mainWindow))
    } else if (ul.startsWith('http:') || url_or_file.startsWith("https:")) {
      if (opts.wait_port)
        await waitPortReady(opts.wait_port)
      mainWindow.loadURL(url_or_file);
    } else {
      mainWindow.loadFile(url_or_file);
    }

    // establish the SubElectron Bi-directional Pipe
    ipcMain.on('se', function(e, x) { process.stdout.write(x) })
    const rl = readline.createInterface(process.stdin)
    rl.on('line', (x) => { mainWindow.webContents.send('se', x)})
  }

  ipcMain.handle("dialog", async (event, arg) => {
    return await dialog.showMessageBox(BrowserWindow.getFocusedWindow(), arg)
  })

  ipcMain.handle("dialog-open", async (event, arg) => {
    return await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), arg)
  })

  ipcMain.handle("dialog-save", async (event, arg) => {
    return await dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), arg)
  })
  ipcMain.on('move', (event, arg) => {
    if (arg.x !== undefined && arg.y != undefined) {
      mainWindow.setPosition(arg.x, arg.y)
    }
    if (arg.width && arg.height) {
      mainWindow.setSize(arg.width, arg.height)
    }

    const [x, y] = mainWindow.getPosition()
    const [width, height] = mainWindow.getSize()
    event.returnValue = {x, y, width, height}
  })

  const menus = []

  let pty = null
  const ptys = {}
  ipcMain.handle('pty-start', (event, {file, args, options}) => {
    if (!pty) {
      pty = require("node-pty")
      // try {
      // } catch {
      //   let dir = path.join(process.cwd(), "node_modules", "xgui", "3p", "node-pty")
      //   pty = require(dir)
      // }
    }
    const ptyProcess = pty.spawn(file, args, options)
    const pid = ptyProcess.pid
    ptys[pid] = ptyProcess
    ptyProcess.onData(function(data) { mainWindow.webContents.send('pty-data', {pid, data}) })
    ptyProcess.onExit(function (e) { mainWindow.webContents.send('pty-exit', {pid, exitCode: e.exitCode, signal: e.signal}) })
    return pid
  })
  ipcMain.handle('pty-resize', (event, {pid, columns, rows}) => {
    ptys[pid]?.resize(columns, rows)
  })
  ipcMain.handle('pty-write', (event, {pid, data}) => {
    ptys[pid]?.write(data)
  })
  ipcMain.handle('pty-kill', (event, {pid, signal}) => {
    ptys[pid]?.kill(signal)
  })

  ipcMain.handle("menu-make", (event, template) => {
    const idx = menus.length

    for (const row of template) {
      const click_idx = row.click
      if (click_idx) {
        row.click = function() { menus[idx].resolve(click_idx) }
      }
    }
    const menu = Menu.buildFromTemplate(template)
    menu.on('menu-will-close', function() { setImmediate(menus[idx].resolve) })
    menus.push({menu, resolve(){}})
    return idx
  })

  ipcMain.handle("menu-show", (event, {idx, delay}) => {
    return new Promise((resolve, reject) => {
      if (idx >= menus.length) {
        reject(`invalid menu index: ${idx}`)
      }
      const cache = menus[idx]
      cache.resolve = resolve

      if (cache.timeout) {
        clearTimeout(cache.timeout)
        cache.timeout = null
      }

      if (delay) {
        cache.timeout = setTimeout(function() {
          cache.timeout = null
          cache.menu.popup(BrowserWindow.fromWebContents(event.sender))
        }, delay)
      } else {
        cache.menu.popup(BrowserWindow.fromWebContents(event.sender))
      }
    })
  })

  ipcMain.handle("menu", (event, {template, delay}) => {
    return new Promise((resolve, reject) => {
      for (const row of template) {
        const click_idx = row.click
        if (click_idx) {
          row.click = function() { resolve(click_idx) }
        }
      }
      const menu = Menu.buildFromTemplate(template)
      menu.on('menu-will-close', function() { setImmediate(resolve) })

      if (delay) {
        setTimeout(function() {
          menu.popup(BrowserWindow.fromWebContents(event.sender))
        }, delay)
      } else {
        menu.popup(BrowserWindow.fromWebContents(event.sender))
      }
    })
  })

  ipcMain.handle("close", (event, force) => {
    if (mainWindow) {
      if (force) {
        preventClose = false
      }
      mainWindow.close()
    }
  })

  ipcMain.handle("reload", () => {
    if (mainWindow) {
      mainWindow.reload()
    }
  })

  let shown = false;
  function show(msg) {
    if (!shown && mainWindow) {
      mainWindow.show()
      shown = true
    }
  }
  ipcMain.on('preloaded', () =>{
    show("preloaded in main");
  })

  app.whenReady().then(async () => {
    let p = createWindow()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
    await p
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}


class Timer {
	/**
	 * @returns {number} current time in seconds (s)
	 */
  static time() {
		return Date.now() / 1000
  }

	/** @summary Creates promise that resolves in s seconds
	 * @param {number} s number of seconds to delay
	 * @returns{Promise}
	 */
  static delay(s) {
    return new Promise(function(resolve, reject) {
      setTimeout(resolve, s*1000)
    })
  }

  constructor() {
    // link static into this
    this.delay = Timer.delay
    this.time = Timer.time
    // fields
    this.start = 0
    // init 
    this.restart()
  }

  restart() {
    this.start = Timer.time()
  }

  getEllapsed() {
    return Date.now() / 1000 - this.start
  }

  until(dsFromStart) {
    let ds = (this.start + dsFromStart) - Timer.time()
    if (ds > 0) {
      return this.delay(ds)
    }
    return null
  }
}


function isPortReady(port, timeout = 0.2) {
  let t = new Timer()
  const req = http.request({host: '127.0.0.1', port, method: 'GET', path:'/', timeout})
  req.end()
  return new Promise((resolve, reject) => {
    req.on('error', async e => {
      await t.until(timeout)
      resolve(false)
    })
    req.on('response', d => resolve(true))
  })
}


async function waitPortReady(port, timeout = 3.0) {
  let ping_time = 0.05

  for (let i = timeout / ping_time; i > 0; i--) {
    let is_ready = await isPortReady(port, ping_time)
    if (is_ready)
      return true
  }
  return false
}

module.exports = {make}
