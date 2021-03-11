const { RedisDb, RedisSchema, RedisDbTypes, RedisModel } = require('../libs/redis-db')
const { rediSearchDb, redisJsonDb } = require('../db')

const ItemSchema = new RedisSchema({
  id: {
    type: RedisDbTypes.STRING,
    unique: true,
    required: true,

    indexed: true,
    sortable: true,
  },
  by: {
    type: RedisDbTypes.STRING,
    required: true,

    indexed: true,
    sortable: true,
  },
  title: {
    type: RedisDbTypes.STRING,
    required: true,

    indexed: true,
    sortable: true,
  },
  type: {
    type: RedisDbTypes.STRING,
    required: true,

    indexed: true,
    sortable: true,
  },
  url: {
    type: RedisDbTypes.STRING,

    indexed: true,
    sortable: true,
  },
  domain: {
    type: RedisDbTypes.STRING,

    indexed: true,
    sortable: true,
  },
  text: {
    type: RedisDbTypes.STRING,

    indexed: true,
    sortable: true,
  },
  points: {
    type: RedisDbTypes.NUMBER,
    default: 1,
    min: 1,

    indexed: true,
    sortable: true,
  },
  score: {
    type: RedisDbTypes.NUMBER,
    default: 0,

    indexed: true,
    sortable: true,
  },
  commentCount: {
    type: RedisDbTypes.NUMBER,
    default: 0,
  },
  created: {
    type: RedisDbTypes.NUMBER,

    indexed: true,
    sortable: true,
  },
  dead: {
    type: RedisDbTypes.BOOLEAN,
    default: false,

    indexed: true,
  }
})

module.exports = RedisModel('item', ItemSchema, {
  rediSearchDb, redisJsonDb,
})
