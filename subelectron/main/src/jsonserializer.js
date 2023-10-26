/* Copyright Subinitial LLC, Author: Kyle Howen */

let EventEmitter, path, existsSync, fs;
const is_node = (typeof process === 'object');

if (is_node) {
  path = require('path')
  existsSync = require('fs').existsSync
  fs = require('fs/promises')
  EventEmitter = require('events')
} else {
  class DataEvent extends Event {
    constructor(name, data) {
      super(name)
      this.data = data
    }
  }
  class EventEmitterImpl extends EventSource {
    on(event, handler) {
      this.addEventListener(event, function(ev) { handler(ev.data)})
    }
    emit(event, data) {
      this.dispatchEvent(new DataEvent(event, data))
    }
  }
  EventEmitter = EventEmitterImpl
}

class JSONSerializer extends EventEmitter {
	constructor(fileName=null) {
    super()
    this.isLoaded = false
    this.queueDuration = 3000
    this.queueTimer = null
    this.fileName = fileName
    this.boundSave = this.save.bind(this)
		this.data = {}
		this.loadPromise = fileName ? this._load() : null
  }

  load(fileName=null) {
    if (fileName)
      this.fileName = fileName
    this.loadPromise = this._load()
    return this.loadPromise
  }

  async _load() {
    if (is_node) {
      if (existsSync(this.fileName)) {
        try {
          this.data = JSON.parse(await fs.readFile(this.fileName, 'utf8'))
        } catch(e) {
          console.error(`JSONSerializer: Error reading ${this.fileName}\n`)
          this.data = {}
        }
      }
    }
    
    this.emit('load', this.data)
    this.isLoaded = true
    return this.data
  }

  async save() {
    if (this.queueTimer !== null) {
      clearTimeout(this.queueTimer)
    }
    this.queueTimer = null
		this.emit('save', this.data)

    if (is_node) {
      let dir = path.dirname(this.fileName)
      if (!existsSync(dir)) {
        await fs.mkdir(dir, {recursive: true})
      }
      await fs.writeFile(this.fileName, JSON.stringify(this.data, null, 2), 'utf8')
    }
	}
	
	flush() {
		if (this.queueTimer !== null) {
      clearTimeout(this.queueTimer)
      return this.save()
		}
    return this.loadPromise
	}
  
  queueSave() {
    if (this.queueTimer !== null) {
      clearTimeout(this.queueTimer)
    }
    this.queueTimer = setTimeout(this.boundSave, this.queueDuration)
  }

  /// 'save' and 'load' events exist
  on(event, handler) {
    super.on(event, handler)
    if (event === "load" && this.isLoaded)
      handler(this.data)
  }
	
  update(obj) {
    if (obj) {
      let modified = false
      for (let [key, val] of Object.entries(obj)) {
        const prev = this.data[key]
        if (prev !== val) {
          this.data[key] = val
          modified = true;
        }
      }
      if (modified) {
        this.queueSave()
        return true
      }
    }
    return false
  }
}

module.exports /**/ = JSONSerializer
