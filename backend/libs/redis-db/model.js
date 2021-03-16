const RedisDbTypes = require('./db-types')
const logger = require('./logger')
const QueryBuilder = require('./query-builder')
const { addModel } = require('./all-models')

const SEARCH_INDEX_MAP = {
  [RedisDbTypes.STRING]: 'TEXT',
  [RedisDbTypes.NUMBER]: 'NUMERIC',
  [RedisDbTypes.BOOLEAN]: 'TEXT',
}

const getSchemaRedisParams = (indexField) => {
  let params = []
  params.push(indexField.key)

  const schemaType = SEARCH_INDEX_MAP[indexField.type]
  params.push(schemaType)

  if (indexField.sortable) {
    params.push('SORTABLE')
  }

  return params
}

async function initializeIndex (idx, schema, searchClient) {
  const indexes = schema.indexFields

  logger.log(`Creating index of ${idx} - ${indexes}`)

  const ftInfo = await searchClient.run('ft_info', [`idx:${idx}`])

  let shouldCreateIndex = true
  if (ftInfo) {
    // if the field does not match simply drop
    const existingIndexFields = ftInfo.fields.map(f => f.key)
    const newIndexFields = schema.indexFields.map(f => f.key)
    doesNotMatch = newIndexFields
      .map(f => newIndexFields.indexOf(f) !== -1)
      .indexOf(false)
      .length > 0

    if (!doesNotMatch) {
      shouldCreateIndex = false
    }
  }

  shouldCreateIndex = shouldCreateIndex || !!process.env.REDIS_REINDEX
  if (shouldCreateIndex) {
    try {
      await searchClient.run('ft_dropindex', [`idx:${idx}`])
      logger.log(`Dropped index of ${idx}`)
    } catch (err) {}
  }

  if (shouldCreateIndex) {

    const params = [
      `idx:${idx}`,
      'ON',
      'hash',
      'PREFIX',
      1,
      `${idx}:`,
      'SCHEMA',
    ]

    for (let i = 0; i < schema.indexFields.length; i ++) {
      const schemaRedisParams = getSchemaRedisParams(schema.indexFields[i])
      
      schemaRedisParams.forEach(p => params.push(p))
    }

    searchClient.run('ft_create', params)
  }
}

function modelGenerator (idx, schema, clients) {
  // TODO: params validation
  function model (values) {
    this.idx = idx
    this.schema = schema
    this.searchClient = clients.rediSearchDb
    this.jsonClient = clients.redisJsonDb

    this.values = values || {}
    this.modifiedFields = []

    schema.fields.forEach(field => {
      Object.defineProperty(this, field.key, {
        get: function () {
          return this.values[field.key];
        },
        set: function (val) {
          if (val !== this.values[field.key]) {
            this.modifiedFields.push(field.key)
          }

          if (field === '_id') {
            throw new Error('No allowed to set _id')
          }
          return this.values[field.key] = val;
        }
      });
    })

    Object.defineProperty(this, 'dbId', {
      get: function () {
        return `${idx}:${this._id}`;
      },
    });

    return this
  }

  const ID_INDICATOR = `${idx}:id-indicator`

  //------------------------------- Model static functions ----------------------- //

  model._getById = async function (id) {
    const jsonValue = await clients.redisJsonDb.run('json_get', [id, '.'])
    return new model(jsonValue)
  }

  model.find = function (query, select, options) {
    // process query
    return new QueryBuilder(query, model)
      .select(select)
      .additionalOptions(options)
  }

  model.countDocuments = function (query) {
    // process query
    return new QueryBuilder(query, model)
      .count()
  }

  model.findOne = function (query, select, options) {
    let queryBuilder = model
      .find(query)
      .findOne()
      .select(select)
      .additionalOptions(options)

    return queryBuilder
  }

  model.findOneAndUpdate = function (query, updates) {
    return model
      .find(query)
      .findOneAndUpdate(updates)
  }



  //------------------------------- Model functions ------------------------------ //

  // Register schema methods
  for (let funcName in schema.methods) {
    model.prototype[funcName] = schema.methods[funcName]
  }

  model.prototype.isModified = function (field) {
    return this.modifiedFields.indexOf(field) !== -1
  }

  model.prototype.isNew = function () {
    return !this._id
  }

  model.prototype.toObject = function () {
    return {
      ...this.values,
      _id: this._id,
    }
  }

  model.prototype.setUnderscoreId = function (id) {
    this.values._id = id
  }

  model.prototype.getNextId = async function () {
    const currentId = await this.searchClient.run('get', [`${ID_INDICATOR}`]) || 1
    const nextId = +currentId + 1
    await this.searchClient.run('incr', [`${ID_INDICATOR}`])
    return +currentId
  }

  model.prototype.getFieldValueWithDefault = function (fieldKey) {
    const field = this.schema.fields.find(f => f.key === fieldKey)
    if (typeof this.values[fieldKey] !== 'undefined') {
      return this.values[fieldKey]
    }

    if (field && typeof field.default !== 'undefined') {
      return field.default
    }

    return undefined
  }

  model.prototype.runFuncArray = function (funcs) {
    return new Promise((resolve, reject) => {
      const promisedNext = (error) => {
        if (error) {
          return reject(error)
        }

        if (funcs.length == 0) {
          resolve()
        }
        this.runFuncArray(funcs.slice(1))
        resolve()
      }

      if (funcs.length == 0) {
        resolve()
      }
      const nextFunc = funcs[0]
      nextFunc.bind(this)(promisedNext)
    })
  }

  model.prototype._save = async function () {
    const hashValue = {}

    const redisHashParams = [] // save id
    this.schema.indexFields.forEach(field => {
      hashValue[field.key] = this.getFieldValueWithDefault(field.key)
      if (typeof hashValue[field.key] === 'undefined') {
        return
      }

      redisHashParams.push(field.key)
      if (hashValue[field.key] === null) {
        redisHashParams.push('NULL')
      } else {
        redisHashParams.push(hashValue[field.key])
      }
    })

    const jsonValue = {}
    this.schema.fields.forEach(field => {
      jsonValue[field.key] = this.getFieldValueWithDefault(field.key)
    })

    await this.searchClient.run('hset', [this.dbId].concat(redisHashParams))
    await this.jsonClient.run('json_set', [this.dbId, '.', jsonValue])
    const newModel = await model._getById(this.dbId)

    return newModel
  }

  model.prototype.save = async function (callback) {
    try {
      if (this.schema.preEventHandlers['save'] && this.schema.preEventHandlers['save'].length > 0) {
        await this.runFuncArray(this.schema.preEventHandlers['save'])
      }

      if (this.isNew()) {
        this.setUnderscoreId(await this.getNextId())

        const savedModel = await this._save()
        callback && callback(null, savedModel)
        return savedModel
      } else {
        const savedModel = await this._save()
        callback && callback(null, savedModel)
        return savedModel
      }
    } catch (err) {
      logger.error(err)
      callback && callback(err, null)
    }
  }

  model.prototype.update = async function (updates) {
    try {
      if (!updates) {
        return this
      }
      if (this.isNew()) {
        throw new Error('Please save first to update')
      }

      for (let key in updates) {
        const isExistingKey = this.schema.fields.find(f => f.key === key)
        if (isExistingKey) {
          this[key] = updates[key]
          continue
        }

        if (key === '$inc') {
          for (let key1 in updates[key]) {
            this[key1] += updates[key][key1]
          }
        }

        if (key === '$set') {
          for (let key1 in updates[key]) {
            this[key1] = updates[key][key1]
          } 
        }

        if (key === '$push') {
          for (let key1 in updates[key]) {
            this[key1].push(updates[key][key1])
          } 
        }
        
      }

      await this._save()
      return this
    } catch (err) {
      logger.error(err)
    }
  }

  model.prototype._remove = async function () {
    await this.searchClient.run('del', [this.dbId])
    await this.jsonClient.run('del', [this.dbId])
  }

  model.prototype.remove = async function (callback) {
    try {
      await this._remove()
      callback && callback(null, { removed: true })
      return this
    } catch (err) {
      logger.error(err)
      callback && callback(err, null)
    }
  }

  initializeIndex(idx, schema, clients.rediSearchDb)

  addModel(idx, model)
  return model
}

module.exports = modelGenerator