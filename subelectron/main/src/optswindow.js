/* Copyright Subinitial LLC, Author: Kyle Howen */

const electron = require('electron')
const JSONSerializer = require("./jsonserializer.js")


async function createOptsWindow({optspath, title, icon, show, isPrimaryInstance, preload}) {
  let woptsFile = new JSONSerializer(optspath)
  let wopts = await woptsFile.loadPromise

  if (wopts.singleInstanceOnly && !isPrimaryInstance) {
    electron.app.quit()
  }

  // let screen = electron.screen.getPrimaryDisplay().bounds
  let screen = electron.screen.getDisplayNearestPoint({x:0, y:0}).bounds

  // Start with sensible window option defaults.
  let defaults = {
    title: "",
    icon: "../default/icon.png",
    show: true,
    x: Math.round(screen.height * 0.1 + screen.x),
    y: Math.round(screen.width * 0.1 + screen.y),
    height: Math.round(screen.height * 0.8),
    width: Math.round(screen.width * 0.8),
    resizable: true,
    maximizable: true,
    kiosk: false,
    fullscreen: false,
    singleInstanceOnly: true,
  }
  if (wopts.startMaximized) {
    defaults.show = false
    const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
    defaults.width = wopts.width = width
    defaults.height = wopts.height = height
    defaults.x = wopts.x = 0
    defaults.y = wopts.y = 0
  }

  // Compose options structure based on stored windows options (wopts).
  let windowOpts = {
    title: title ?? defaults.title,
    icon: icon ?? defaults.icon,
    autoHideMenuBar: wopts.autoHideMenuBar ?? false,
    center: true,
    show: show ?? defaults.show,
    width: wopts.width ?? defaults.width,
    height: wopts.height ?? defaults.height,
    minWidth: wopts.minWidth ?? defaults.minWidth,
    minHeight: wopts.minHeight ?? defaults.minHeight,
    maxWidth: wopts.maxWidth ?? defaults.maxWidth,
    maxHeight: wopts.maxHeight ?? defaults.maxHeight,
    maximizable: wopts.maximizable ?? defaults.maximizable,
    resizable: wopts.resizable ?? defaults.resizable,
    kiosk: wopts.kiosk ?? defaults.kiosk,
    fullscreen: wopts.fullscreen ?? defaults.fullscreen,
    x: wopts.x ?? defaults.x,
    y: wopts.y ?? defaults.y,
    webPreferences: {
      preload,
      nodeIntegration: true,
      devTools: true,
    }
  }

  // Adjust the options if they exceed boundaries/limits.
  try {
    let screen = electron.screen.getDisplayNearestPoint({x: windowOpts.x, y: windowOpts.y}).bounds
    if (windowOpts.x + windowOpts.width > screen.x + screen.width) {
      windowOpts.width = Math.round(screen.width * 0.8)
      windowOpts.x = Math.round(screen.width * 0.1 + screen.x)
      woptsFile.data.width = windowOpts.width
      woptsFile.data.x = windowOpts.x
      woptsFile.queueSave()
    }
    if (windowOpts.y + windowOpts.height > screen.y + screen.height) {
      windowOpts.height = Math.round(screen.height * 0.8)
      windowOpts.y = Math.round(screen.height * 0.1 + screen.y)
      woptsFile.data.y = windowOpts.y
      woptsFile.data.height = windowOpts.height
      woptsFile.queueSave()
    }
  } catch(e) {
    console.error("optswindow.js: Couldn't check window boundaries, resetting to sensible size\n", e)
    let screen = electron.screen.getPrimaryDisplay().bounds
    windowOpts.x = Math.round(screen.height * 0.1 + screen.x)
    windowOpts.y = Math.round(screen.width * 0.1 + screen.y)
    windowOpts.height = Math.round(screen.height * 0.8)
    windowOpts.width = Math.round(screen.width * 0.8)
  }

  // Create the window using the compiled options
  let mainWindow = new electron.BrowserWindow(windowOpts)

  // Wire up all the settings caching
  mainWindow.on('resize', () => {
    let [width, height] = mainWindow.getSize()
    woptsFile.update({width, height})
  })

  mainWindow.on('move', () => {
    let [x, y] = mainWindow.getPosition()
    woptsFile.update({x, y})
  })

  mainWindow.on('maximize', () => { 
    woptsFile.update({maximized: true}) 
  })
  mainWindow.on('unmaximize', () => { 
    woptsFile.update({maximized: false}) 
  })

  mainWindow.webContents.on('devtools-opened', () => {
    woptsFile.update({devtools: true})
  })
  
  mainWindow.webContents.on('devtools-closed', () => {
    woptsFile.update({devtools: false})
  })

  electron.app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (woptsFile.data.singleInstanceOnly ?? defaults.singleInstanceOnly) {
      if (mainWindow.isMinimized())
        mainWindow.restore()
      mainWindow.focus()
    }
  })

  if (woptsFile.data.startMaximized || woptsFile.data.maximized) {
    mainWindow.once('ready-to-show', () => {
      mainWindow.maximize()
    })
  }

  electron.app.on('before-quit', async (e) => {
    try {
      e.preventDefault()
      await woptsFile.flush()
      electron.app.exit(0)
    } catch (e) {
      console.error(e)
      electron.app.exit(1)
    }
  })

  electron.ipcMain.handle('wopts', (event, arg) => {
    if (arg) {
      if ((arg.autoHideMenuBar ?? woptsFile.data.autoHideMenuBar) !== woptsFile.data.autoHideMenuBar) {
        const win = electron.BrowserWindow.getFocusedWindow()
        win.setAutoHideMenuBar(arg.autoHideMenuBar)
        win.setMenuBarVisibility(!arg.autoHideMenuBar)
      }  
      woptsFile.update(arg)
    }
    return woptsFile.data
  })

  if (wopts.devtools) {
    mainWindow.webContents.openDevTools()
  }

  return mainWindow
}



module.exports = {
  createOptsWindow
}
