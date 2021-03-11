const { redisArrayToKeyValue } = require('./utils')
const logger = require('./logger')
const RedisDbTypes = require('./db-types')
const { getModel } = require('./all-models')

function QueryBuilder (query, model) {
  var self = this;

  this.query = query
  this.options = {
    additionalOptions: {},
  }
  this.model = model
  this.options.preHandlerName = 'find'
  this.populateOptions = []
  return this
}

QueryBuilder.prototype = Object.create(Promise.prototype)
QueryBuilder.prototype.constructor = QueryBuilder

QueryBuilder.prototype.catch = function() {
  var promise = this.executor()
  return promise.catch.apply(promise, arguments)
}

QueryBuilder.prototype.then = function() {
  var promise = this.executor()
  return promise.then.apply(promise, arguments)
};



QueryBuilder.prototype.select = function (select) {
  this.options.select = select
  return this
}

QueryBuilder.prototype.additionalOptions = function (options) {
  this.options.additionalOptions = options || {}
  return this
}

QueryBuilder.prototype.skip = function (skip) {
  this.options.skip = skip
  this.options.hasPagination = true
  return this
}

QueryBuilder.prototype.limit = function (limit) {
  this.options.limit = limit
  this.options.hasPagination = true
  return this
}

QueryBuilder.prototype.sort = function (sort) {
  this.options.sort = sort
  return this
}

QueryBuilder.prototype.count = function () {
  this.options.count = true
  return this
}


QueryBuilder.prototype.lean = function () {
  this.options.lean = true
  return this
}

QueryBuilder.prototype.findOne = function () {
  this.options.findOne = true
  this.options.preHandlerName = 'findOne'
  return this
}

QueryBuilder.prototype.populate = function (popuplateOptions) {
  this.populateOptions.push(popuplateOptions)
  return this
}

QueryBuilder.prototype.findOneAndUpdate = function (updates) {
  this.options.findOne = true
  this.options.findOneAndUpdate = true
  this.options.updateToMade = updates
  return this
}


const getAdditionalQuery = (isIndexKey, key, query) => {
  let additionalQuery = ''

  const secondKeys = Object.keys(query)

  // If it's $in query
  if (secondKeys.indexOf('$in') !== -1) {
    if (query['$in'].length > 0) {
      additionalQuery += `(@${key}:(${query['$in'].map(q => `"${q}"`).join('|')}))`
    } else {
      // This is special case, we need evaluate this as false always...false
      // To evaluate false, assume that nothing wil start with a$$$$$
      additionalQuery += `(@${key}:"aaaaaaaaa")`
    }
  }
  // $nin
  else if (secondKeys.indexOf('$nin') !== -1) {
    if (query['$nin'].length > 0) {
      additionalQuery += `(-(@${key}:(${query['$nin'].map(q => `"${q}"`).join('|')})))`
    } else {
      // This is special case, we need evaluate this as false always...false
      // To evaluate false, assume that nothing wil start with a$$$$$
      additionalQuery += `(-(@${key}:"aaaaaaaaa"))`
    }
  }
  // $like
  else if (secondKeys.indexOf('$like') !== -1) {
    additionalQuery += `(@${key}:${`${query['$like']}*`})`
  }
  // If it's number
  else if (isIndexKey.type === RedisDbTypes.NUMBER) {
    // If it includes $gt $lt
    if (secondKeys.indexOf('$gt') !== -1
      || secondKeys.indexOf('$lt') !== -1
      || secondKeys.indexOf('$gte') !== -1
      || secondKeys.indexOf('$lte') !== -1
    ) {
      const left = (query['$gt'] ? '(' + query['$gt'] : '')
        || query['$gte']
        || '-inf'
      const right = (query['$lt'] ? query['$lt'] + ')' : '')
        || query['$lte']
        || '+inf'

      additionalQuery += `(@${key}:[${left} ${right}])`
    }
  }

  return additionalQuery
}

QueryBuilder.prototype.getQuery = function (query, schema) {
  // If query is not defined or no keys defined, it shuld return '*' (which means everything)
  if (!query || Object.keys(query).length === 0) {
    return '*'
  }

  let queryString = ''
  for (let key in query) {
    if (key === '$or') {
      queryString += '('
      queryString += query[key].map(q => this.getQuery(q, schema)).join('|')
      queryString += ')'
      continue
    }

    const isIndexKey = schema.indexFields.find(f => f.key === key)
    if (isIndexKey) {  // To exact match it should be @username:"xyz"

      if (typeof query[key] === 'object') {
        let additionalQuery = getAdditionalQuery(isIndexKey, key, query[key])
        queryString += ' ' + additionalQuery
      } else {
        queryString += ' '
        queryString += '('
        queryString += `@${key}:"${query[key]}"`
        queryString += ')'
      }
      continue
    }
  }

  return queryString
}

QueryBuilder.prototype.runFuncArray = function (funcs) {
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

QueryBuilder.prototype.runPreHandlers = async function (schema) {
  if (!this.options.preHandlerName) {
    return
  }

  const preEventHandlers = schema.preEventHandlers[this.options.preHandlerName]
  if (preEventHandlers && preEventHandlers.length > 0) {
    await this.runFuncArray(preEventHandlers)
  }
}

QueryBuilder.prototype.runPopulate = async function (rows) {
  if (this.options.findOneAndUpdate) {
    // do not run populate when to update
    return ;
  }
  const modelTempl = new this.model()
  const schema = modelTempl.schema
  const idx = modelTempl.idx

  for (let i = 0; i < this.populateOptions.length; i ++) {
    const populateOption = this.populateOptions[i]

    // Find the field from schema
    const matchField = schema.fields.find(f => f.key === populateOption.path)

    // Find the reference model
    const refModel = getModel(matchField.refIdx)

    if (!matchField || !refModel) {
      continue;
    }


    const queryOptions = []
    rows.map(row => {
      // add pouplate options's match
      const query = { ...populateOption.match }
      let empty = false

      // please notice we try to find the itmes by _id: $in: [id array]
      // also to reduce the api requests, if children is empty or null, just resolve empty right away
      if (matchField.type === RedisDbTypes.ARRAY) {
        query._id = { $in: row[matchField.key] }
        if (!row[matchField.key] || row[matchField.key].length === 0) {
          empty = true
        }
      } else {
        query._id = { $in: [row[matchField.key]] }
        if (!row[matchField.key]) {
          empty = true
        }
      }

      let promise = null
      if (empty) promise = Promise.resolve([])
      else if (matchField.type === RedisDbTypes.ARRAY) {
        promise = refModel.find(query, null, populateOption.additionalOptions).lean()
      } else {
        promise = refModel.findOne(query, null, populateOption.additionalOptions).lean()
      }
      queryOptions.push({
        promise,
        parentId: row._id,
      })
    })

    const results = await Promise.all(queryOptions.map(q => q.promise))

    results.forEach((res, index) => {
      rows[index][matchField.key] = res
    })
  }

  return rows
}

QueryBuilder.prototype._exec = async function () {
  try {
    const modelTempl = new this.model()
    const searchClient = modelTempl.searchClient
    const jsonClient = modelTempl.jsonClient
    const schema = modelTempl.schema
    const idx = modelTempl.idx

    // Run pre handlers    
    await this.runPreHandlers(schema)

    const params = [`idx:${idx}`]

    const query = this.getQuery(this.query, schema)
    params.push(query)

    // NOCONTENT : If it appears after the query, we only return the document ids and not the content. This is useful if RediSearch is only an index on an external document collection
    this.noContent = true
    if (this.noContent) {
      params.push('NOCONTENT')
    }

    const options = this.options

    // if limit add the parameters
    if (this.options.count) {
      params.push('LIMIT');
      params.push(0);
      params.push(0);
    } else if (options.skip || options.limit) {
      const offset = options.skip || 0;
      const limit = options.limit || 10

      params.push('LIMIT');
      params.push(offset);
      params.push(limit);
    } else {
      params.push('LIMIT');
      params.push(0);
      // TODO: critical - need to iterate for other elements if there're more than 10000
      if (this.options.findOne) {
        params.push(1);
      } else {
        params.push(10000); // get all
      }
    }

    // if sortby add the parameters
    if (options.sort) {
      // redis only allow 1 sort by
      params.push('SORTBY');

      const firstSortKey = Object.keys(options.sort)[0]
      params.push(firstSortKey);
      params.push((options.sort[firstSortKey]) ? 'ASC' : 'DESC');
    } else {
      params.push('SORTBY');

      params.push('_id');
      params.push('DESC');
    }

    const res = await searchClient.run('ft_search', params)

    let ids = []
    const totalNumber = res[0]

    const searchRows = res.slice(1)
    if (this.noContent) {
      ids = searchRows
    } else {
      debugger
      // TODO handle when content is included
      // const ids = 
    }


    // Get the JSON documents
    // MGET user:1 user:2 .
    const rows = ids.length > 0
      ? await jsonClient.run('json_mget', ids.concat(['.']))
      : []


    let returnValue = rows.map(row => new this.model(row))


    await this.runPopulate(returnValue)

    if (this.options.findOne) {
      returnValue = returnValue.length > 0 ? returnValue[0] : null

      if (returnValue) {
        if (this.options.findOneAndUpdate) {
          await returnValue.update(this.options.updateToMade)
        }

        if (this.options.lean) {
          returnValue = returnValue.toObject()
        }
      }
    } else if (this.options.count) {
      returnValue = totalNumber
    } else {
      returnValue = rows
    }

    return returnValue
  } catch (err) {
    logger.log(err)
    throw err
  }
}

QueryBuilder.prototype.exec = async function (callback) {
  try {
    const results = await this._exec()
    callback(null, results)
  } catch (error) {
    logger.error(error)
    callback(error, [])
  }
}

QueryBuilder.prototype.executor = function () {
  return this._exec()
}

module.exports = QueryBuilder
