const { app, Menu, MenuItemConstructorOptions, MenuItem } = require('electron')

/** @type Array<(MenuItemConstructorOptions) | (MenuItem)> */
let template = [
  {
    label: 'File',
    submenu: [
      { role: 'close' },
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'togglefullscreen' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' }
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { role: 'minimize' },
      { role: 'close' },
    ]
  }
]

function build() {
  app.on('ready', () => {
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }) 
}

module.exports = {
  template,
  prepend(menuitem) { template.splice(0, 0, menuitem) },
  append(menuitem) { template.push(menuitem) },
  build
}
