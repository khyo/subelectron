var{contextBridge:g,ipcRenderer:p}=require("electron"),l=function(s){p.send("se",JSON.stringify(s)+`
`)},h=1024,a=-1,d={},c={};function u(s,t,o,e){clearTimeout(t),delete c[s],o(e)}var f={_onMsg(s,t){let[o,e,r]=JSON.parse(t);if(o>0)try{let n=d[e](e,r);Promise.resolve(n).then(function(i){l([o,e,i])})}catch(n){console.error(`ipc: failed to respond to request#${o}: ${e}`,{arg:r,ex:n}),l([o,"_err",String(n)])}else if(o<0){let n=c[o];n?e!="_err"?n[0](r):n[1](r):console.error("ipc: unexpected response",e,r)}else{let n=d[e];n?n(e,r):console.error("ipc: unhandled event",e,r)}},on(s,t){d[s]=t},cancel(s){delete d[s]},send(s,t=null){l([0,s,t])},ask(s,t=null,o=null){let e=a;return a=e>-h?e-1:-1,new Promise(function(r,n){if(!o)c[e]=[r,n];else{let i=setTimeout(function(_){delete c[e],n(_)},o);c[e]=[u.bind(e,i,r),u.bind(e,i,n)]}l([e,s,t])})}};p.on("se",f._onMsg);g.exposeInMainWorld("ipc",f);p.send("preloaded",!0);
