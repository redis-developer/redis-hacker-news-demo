const { redisArrayToKeyValue } = require('./utils')
const logger = require('./logger')

function clientWrapper (client) {
  this.client = client

  return this
}

clientWrapper.prototype.run = async function (command, params = []) {
  logger.log('REDIS RUN - ', command.split('_').join('.').toUpperCase(), params.join(' '))
  if (this[command] && typeof this[command] === 'function') {
    const result = await this[command](params)
    logger.log('REDIS RESULT - ', JSON.stringify(result))
    return result
  }

  return new Promise((resolve, reject) => {
    this.client[command](params, async (err, res) => {
      if (err) {
        reject(err)
      }

      logger.log('REDIS RESULT - ', JSON.stringify(res))
      resolve(res)
    })
  })
}

clientWrapper.prototype.ft_info = function (params) {
  return new Promise((resolve, reject) => {
    this.client['ft_info'](params, (err, res) => {
      if (err || !res) {
        return resolve(null)
      }

      const customProcessor = {
        fields: (data) => {
          return data.map(d => {
            return {
              key: d[0],
              body: d.slice(1),
            }
          })
        }
      }
      resolve(redisArrayToKeyValue(res, 0, customProcessor))
    })
  })
}

clientWrapper.prototype.json_set = function (params) {
  return new Promise((resolve, reject) => {
    const [ path, key, value ] = params

    const stringifyValue = JSON.stringify(value)

    logger.log('REDIS RUN REFORMAT - ', 'JSON.SET', path, key, "'" + stringifyValue + "'")
    this.client['json_set']([path, key, stringifyValue], (err, res) => {
      if (err || !res) {
        return reject(err)
      }

      resolve(null)
    })
  })
}

clientWrapper.prototype.json_get = function (params) {
  return new Promise((resolve, reject) => {
    this.client['json_get'](params, (err, res) => {
      if (err || !res) {
        return reject(err)
      }

      resolve(JSON.parse(res))
    })
  })
}

clientWrapper.prototype.json_mget = function (params) {
  return new Promise((resolve, reject) => {
    this.client['json_mget'](params, (err, res) => {
      if (err || !res) {
        return reject(err)
      }

      const result = res.map(r => JSON.parse(r))
      resolve(result)
    })
  })
}


module.exports = clientWrapper