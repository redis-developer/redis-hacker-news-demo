const { promisify } = require("util")
const redis = require('redis')
const redisearch = require('redis-redisearch')

// Add addiontal commands
redisearch(redis)
redis.addCommand('ft.dropindex')
redis.addCommand('json.set')
redis.addCommand('json.get')
redis.addCommand('json.del')
redis.addCommand('json.mget')
redis.addCommand('json.type')
redis.addCommand('json.objkeys')


const clientWrapper = require('../libs/redis-db/client')


const rediSearchClient = redis.createClient(process.env.SEARCH_REDIS_SERVER_URL, {
  password: process.env.SEARCH_REDIS_PASSWORD
});

const redisJsonClient = redis.createClient(process.env.JSON_REDIS_SERVER_URL, {
  password: process.env.JSON_REDIS_PASSWORD
});

const rediSearchDb = new clientWrapper(rediSearchClient)

const redisJsonDb = new clientWrapper(redisJsonClient)

module.exports = {
  rediSearchClient,
  redisJsonClient,
  rediSearchDb,
  redisJsonDb
}
