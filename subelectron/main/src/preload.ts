/// <reference types="./electron" />
const { contextBridge, ipcRenderer } = require('electron')

const _send = function(msg) { ipcRenderer.send('se', JSON.stringify(msg) + '\n') }

const MAX_ASK_COUNT = 1024

let ask_id = -1

const handlers = {}
const responses = {}

function responder(aid, tmr, func, val) {
  clearTimeout(tmr)
  delete responses[aid]
  func(val)
}

const ipc = {
  _onMsg(e, json_str) {
    const [aid, op, arg] = JSON.parse(json_str)

    if (aid > 0) {
      // superior asked us a request, we must respond
      try {
        const resp = handlers[op](op, arg)
        Promise.resolve(resp).then(function(resp) {
          _send([aid, op, resp])
        })
      }
      catch (ex) {
        console.error(`ipc: failed to respond to request#${aid}: ${op}`, {arg, ex})
        _send([aid, "_err", String(ex)])
      }
    }
    else if (aid < 0) {
      // superior sent us a response to a prior request
      const resolve_reject = responses[aid]
      if (resolve_reject) {
        if (op != "_err") {
          resolve_reject[0](arg)
        } else {
          resolve_reject[1](arg)
        }
      } else {
        console.error("ipc: unexpected response", op, arg)
      }
      
    }
    else {
      // superior sent us an event
      const handler = handlers[op]
      if (handler) {
        handler(op, arg)
      } else {
        console.error("ipc: unhandled event", op, arg)
      }
    }
  },


  send(command: string, arg: any = null) {
    _send([0, command, arg])
  },

	on(event: string, handler: Handler) {
		handlers[event] = handler
	},

  cancel(event: string) {
    const retval = handlers[event]
		delete handlers[event]
		return retval
  },

  ask(req, arg=null, timeout=null) {
    const aid = ask_id;
    ask_id = aid > -MAX_ASK_COUNT ? aid - 1 : -1;

    return new Promise(function (resolve, reject) {
      if (!timeout) {
        responses[aid] = [resolve, reject]
      }
      else {
        const tmr = setTimeout(
            function(err) {
              delete responses[aid]
              reject(err)
            }, 
            timeout)

            responses[aid] = [responder.bind(aid, tmr, resolve), responder.bind(aid, tmr, reject)]
      }
      _send([aid, req, arg])
    })
  },
}
ipcRenderer.on('se', ipc._onMsg)

contextBridge.exposeInMainWorld('ipc', ipc)

ipcRenderer.send('preloaded', true)
