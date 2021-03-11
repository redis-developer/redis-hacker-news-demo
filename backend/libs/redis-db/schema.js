const RedisDbTypes = require('./db-types')

function schema (raw) {
  this.rawFields = raw

  // _id should be always indexed
  const _idField = {
    key: '_id',
    type: RedisDbTypes.STRING,

    indexed: true,
    sortable: true,
  }

  this.fields = Object.keys(raw).map(key => ({ key: key, ...raw[key] }))
  this.fields.push(_idField)

  this.indexFields = this.fields.filter(filed => filed.indexed)


  // Placeholder for static functions to be added
  this.methods = {}

  // Placeholder for events handlers
  this.preEventHandlers = {}
  return this
}

schema.prototype.pre = function (event, func) {
  if (!this.preEventHandlers[event]) {
    this.preEventHandlers[event] = []
  }
  this.preEventHandlers[event].push(func)
}


module.exports = schema