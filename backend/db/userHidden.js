const { RedisDb, RedisSchema, RedisDbTypes, RedisModel } = require('../libs/redis-db')
const { rediSearchDb, redisJsonDb } = require('../db')

const UserHiddenSchema = new RedisSchema({
  username: {
    type: RedisDbTypes.STRING,
    required: true,

    indexed: true,
    sortable: true,
  },
  id: {
    type: RedisDbTypes.STRING,
    required: true,

    indexed: true,
    sortable: true,
  },
  date: {
    type: RedisDbTypes.NUMBER,

    indexed: true,
    sortable: true,
  },
  itemCreationDate: {
    type: RedisDbTypes.NUMBER,

    indexed: true,
    sortable: true,
  },
})

module.exports = RedisModel('user-hidden', UserHiddenSchema, {
  rediSearchDb, redisJsonDb,
})
