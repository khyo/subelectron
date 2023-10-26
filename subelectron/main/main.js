var V=Object.create;var D=Object.defineProperty;var $=Object.getOwnPropertyDescriptor;var Y=Object.getOwnPropertyNames;var Z=Object.getPrototypeOf,K=Object.prototype.hasOwnProperty;var b=(t,n)=>()=>(n||t((n={exports:{}}).exports,n),n.exports);var Q=(t,n,r,h)=>{if(n&&typeof n=="object"||typeof n=="function")for(let u of Y(n))!K.call(t,u)&&u!==r&&D(t,u,{get:()=>n[u],enumerable:!(h=$(n,u))||h.enumerable});return t};var C=(t,n,r)=>(r=t!=null?V(Z(t)):{},Q(n||!t||!t.__esModule?D(r,"default",{value:t,enumerable:!0}):r,t));var O=b((ce,N)=>{var{app:X,Menu:B,MenuItemConstructorOptions:de,MenuItem:he}=require("electron"),q=[{label:"File",submenu:[{role:"close"}]},{label:"Edit",submenu:[{role:"undo"},{role:"redo"},{type:"separator"},{role:"cut"},{role:"copy"},{role:"paste"},{role:"selectAll"}]},{label:"View",submenu:[{role:"togglefullscreen"},{role:"resetZoom"},{role:"zoomIn"},{role:"zoomOut"}]},{label:"Window",submenu:[{role:"forceReload"},{role:"toggleDevTools"},{role:"minimize"},{role:"close"}]}];function ee(){X.on("ready",()=>{let t=B.buildFromTemplate(q);B.setApplicationMenu(t)})}N.exports={template:q,prepend(t){q.splice(0,0,t)},append(t){q.push(t)},build:ee}});var F=b((me,H)=>{var T,_,z,M,W=typeof process=="object";if(W)_=require("path"),z=require("fs").existsSync,M=require("fs/promises"),T=require("events");else{class t extends Event{constructor(h,u){super(h),this.data=u}}class n extends EventSource{on(h,u){this.addEventListener(h,function(f){u(f.data)})}emit(h,u){this.dispatchEvent(new t(h,u))}}T=n}var k=class extends T{constructor(n=null){super(),this.isLoaded=!1,this.queueDuration=3e3,this.queueTimer=null,this.fileName=n,this.boundSave=this.save.bind(this),this.data={},this.loadPromise=n?this._load():null}load(n=null){return n&&(this.fileName=n),this.loadPromise=this._load(),this.loadPromise}async _load(){if(W&&z(this.fileName))try{this.data=JSON.parse(await M.readFile(this.fileName,"utf8"))}catch{console.error(`JSONSerializer: Error reading ${this.fileName}
`),this.data={}}return this.emit("load",this.data),this.isLoaded=!0,this.data}async save(){if(this.queueTimer!==null&&clearTimeout(this.queueTimer),this.queueTimer=null,this.emit("save",this.data),W){let n=_.dirname(this.fileName);z(n)||await M.mkdir(n,{recursive:!0}),await M.writeFile(this.fileName,JSON.stringify(this.data,null,2),"utf8")}}flush(){return this.queueTimer!==null?(clearTimeout(this.queueTimer),this.save()):this.loadPromise}queueSave(){this.queueTimer!==null&&clearTimeout(this.queueTimer),this.queueTimer=setTimeout(this.boundSave,this.queueDuration)}on(n,r){super.on(n,r),n==="load"&&this.isLoaded&&r(this.data)}update(n){if(n){let r=!1;for(let[h,u]of Object.entries(n))this.data[h]!==u&&(this.data[h]=u,r=!0);if(r)return this.queueSave(),!0}return!1}};H.exports=k});var L=b((pe,j)=>{var p=require("electron"),te=F();async function ie({optspath:t,title:n,icon:r,show:h,isPrimaryInstance:u,preload:f}){let l=new te(t),c=await l.loadPromise;c.singleInstanceOnly&&!u&&p.app.quit();let w=p.screen.getDisplayNearestPoint({x:0,y:0}).bounds,i={title:"",icon:"../default/icon.png",show:!0,x:Math.round(w.height*.1+w.x),y:Math.round(w.width*.1+w.y),height:Math.round(w.height*.8),width:Math.round(w.width*.8),resizable:!0,maximizable:!0,kiosk:!1,fullscreen:!1,singleInstanceOnly:!0};if(c.startMaximized){i.show=!1;let{width:s,height:a}=p.screen.getPrimaryDisplay().workAreaSize;i.width=c.width=s,i.height=c.height=a,i.x=c.x=0,i.y=c.y=0}let e={title:n??i.title,icon:r??i.icon,autoHideMenuBar:c.autoHideMenuBar??!1,center:!0,show:h??i.show,width:c.width??i.width,height:c.height??i.height,minWidth:c.minWidth??i.minWidth,minHeight:c.minHeight??i.minHeight,maxWidth:c.maxWidth??i.maxWidth,maxHeight:c.maxHeight??i.maxHeight,maximizable:c.maximizable??i.maximizable,resizable:c.resizable??i.resizable,kiosk:c.kiosk??i.kiosk,fullscreen:c.fullscreen??i.fullscreen,x:c.x??i.x,y:c.y??i.y,webPreferences:{preload:f,nodeIntegration:!0,devTools:!0}};try{let s=p.screen.getDisplayNearestPoint({x:e.x,y:e.y}).bounds;e.x+e.width>s.x+s.width&&(e.width=Math.round(s.width*.8),e.x=Math.round(s.width*.1+s.x),l.data.width=e.width,l.data.x=e.x,l.queueSave()),e.y+e.height>s.y+s.height&&(e.height=Math.round(s.height*.8),e.y=Math.round(s.height*.1+s.y),l.data.y=e.y,l.data.height=e.height,l.queueSave())}catch(s){console.error(`optswindow.js: Couldn't check window boundaries, resetting to sensible size
`,s);let a=p.screen.getPrimaryDisplay().bounds;e.x=Math.round(a.height*.1+a.x),e.y=Math.round(a.width*.1+a.y),e.height=Math.round(a.height*.8),e.width=Math.round(a.width*.8)}let o=new p.BrowserWindow(e);return o.on("resize",()=>{let[s,a]=o.getSize();l.update({width:s,height:a})}),o.on("move",()=>{let[s,a]=o.getPosition();l.update({x:s,y:a})}),o.on("maximize",()=>{l.update({maximized:!0})}),o.on("unmaximize",()=>{l.update({maximized:!1})}),o.webContents.on("devtools-opened",()=>{l.update({devtools:!0})}),o.webContents.on("devtools-closed",()=>{l.update({devtools:!1})}),p.app.on("second-instance",(s,a,d)=>{(l.data.singleInstanceOnly??i.singleInstanceOnly)&&(o.isMinimized()&&o.restore(),o.focus())}),(l.data.startMaximized||l.data.maximized)&&o.once("ready-to-show",()=>{o.maximize()}),p.app.on("before-quit",async s=>{try{s.preventDefault(),await l.flush(),p.app.exit(0)}catch(a){console.error(a),p.app.exit(1)}}),p.ipcMain.handle("wopts",(s,a)=>{if(a){if((a.autoHideMenuBar??l.data.autoHideMenuBar)!==l.data.autoHideMenuBar){let d=p.BrowserWindow.getFocusedWindow();d.setAutoHideMenuBar(a.autoHideMenuBar),d.setMenuBarVisibility(!a.autoHideMenuBar)}l.update(a)}return l.data}),c.devtools&&o.webContents.openDevTools(),o}j.exports={createOptsWindow:ie}});var G=b((we,A)=>{process.env.ELECTRON_DISABLE_SECURITY_WARNINGS="true";var ne=require("node:http"),S=require("node:path"),fe=require("node:fs"),se=require("node:readline"),{app:v,BrowserWindow:y,dialog:P,ipcMain:m,Menu:R}=require("electron"),{createOptsWindow:oe}=L(),x=JSON.parse(process.argv[2]);function ae(){let t,n=!1;m.handle("prevent-close",(i,e)=>{n=e});let r={isPackaged:v.isPackaged,argv:process.argv,primaryInstance:v.requestSingleInstanceLock(),debug:process.env.DEBUG===void 0?!0:process.env.DEBUG,testing:process.env.TESTING===void 0?!0:process.env.TESTING};m.on("appInfo",i=>{i.returnValue=r});async function h(){t=await oe({optspath:S.join(x.cache,"wopts.json"),title:x.title,icon:S.join(__dirname,"..","default","icon.png"),isPrimaryInstance:r.primaryInstance,show:process.argv.includes("--show-early"),preload:S.join(__dirname,"preload.js")}),t.on("close",s=>{n&&(s.preventDefault(),t.webContents.send("close-attempted"))}),t.on("closed",function(){t=null}),t.setTitle(x.title||"SubElectron");let i=x.load,e=i.toLowerCase();e.startsWith("plugin:")?await Promise.resolve(require(e.slice(7)).main(t)):e.startsWith("http:")||i.startsWith("https:")?(x.wait_port&&await le(x.wait_port),t.loadURL(i)):t.loadFile(i),m.on("se",function(s,a){process.stdout.write(a)}),se.createInterface(process.stdin).on("line",s=>{t.webContents.send("se",s)})}m.handle("dialog",async(i,e)=>await P.showMessageBox(y.getFocusedWindow(),e)),m.handle("dialog-open",async(i,e)=>await P.showOpenDialog(y.getFocusedWindow(),e)),m.handle("dialog-save",async(i,e)=>await P.showSaveDialog(y.getFocusedWindow(),e)),m.on("move",(i,e)=>{e.x!==void 0&&e.y!=null&&t.setPosition(e.x,e.y),e.width&&e.height&&t.setSize(e.width,e.height);let[o,s]=t.getPosition(),[a,d]=t.getSize();i.returnValue={x:o,y:s,width:a,height:d}});let u=[],f=null,l={};m.handle("pty-start",(i,{file:e,args:o,options:s})=>{f||(f=require("node-pty"));let a=f.spawn(e,o,s),d=a.pid;return l[d]=a,a.onData(function(g){t.webContents.send("pty-data",{pid:d,data:g})}),a.onExit(function(g){t.webContents.send("pty-exit",{pid:d,exitCode:g.exitCode,signal:g.signal})}),d}),m.handle("pty-resize",(i,{pid:e,columns:o,rows:s})=>{l[e]?.resize(o,s)}),m.handle("pty-write",(i,{pid:e,data:o})=>{l[e]?.write(o)}),m.handle("pty-kill",(i,{pid:e,signal:o})=>{l[e]?.kill(o)}),m.handle("menu-make",(i,e)=>{let o=u.length;for(let a of e){let d=a.click;d&&(a.click=function(){u[o].resolve(d)})}let s=R.buildFromTemplate(e);return s.on("menu-will-close",function(){setImmediate(u[o].resolve)}),u.push({menu:s,resolve(){}}),o}),m.handle("menu-show",(i,{idx:e,delay:o})=>new Promise((s,a)=>{e>=u.length&&a(`invalid menu index: ${e}`);let d=u[e];d.resolve=s,d.timeout&&(clearTimeout(d.timeout),d.timeout=null),o?d.timeout=setTimeout(function(){d.timeout=null,d.menu.popup(y.fromWebContents(i.sender))},o):d.menu.popup(y.fromWebContents(i.sender))})),m.handle("menu",(i,{template:e,delay:o})=>new Promise((s,a)=>{for(let g of e){let I=g.click;I&&(g.click=function(){s(I)})}let d=R.buildFromTemplate(e);d.on("menu-will-close",function(){setImmediate(s)}),o?setTimeout(function(){d.popup(y.fromWebContents(i.sender))},o):d.popup(y.fromWebContents(i.sender))})),m.handle("close",(i,e)=>{t&&(e&&(n=!1),t.close())}),m.handle("reload",()=>{t&&t.reload()});let c=!1;function w(i){!c&&t&&(t.show(),c=!0)}m.on("preloaded",()=>{w("preloaded in main")}),v.whenReady().then(async()=>{let i=h();v.on("activate",()=>{y.getAllWindows().length===0&&h()}),await i}),v.on("window-all-closed",()=>{process.platform!=="darwin"&&v.quit()})}var E=class t{static time(){return Date.now()/1e3}static delay(n){return new Promise(function(r,h){setTimeout(r,n*1e3)})}constructor(){this.delay=t.delay,this.time=t.time,this.start=0,this.restart()}restart(){this.start=t.time()}getEllapsed(){return Date.now()/1e3-this.start}until(n){let r=this.start+n-t.time();return r>0?this.delay(r):null}};function re(t,n=.2){let r=new E,h=ne.request({host:"127.0.0.1",port:t,method:"GET",path:"/",timeout:n});return h.end(),new Promise((u,f)=>{h.on("error",async l=>{await r.until(n),u(!1)}),h.on("response",l=>u(!0))})}async function le(t,n=3){let r=.05;for(let h=n/r;h>0;h--)if(await re(t,r))return!0;return!1}A.exports={make:ae}});var J=C(O()),U=C(G());J.build();(0,U.make)();