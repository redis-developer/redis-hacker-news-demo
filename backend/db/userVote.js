const { RedisDb, RedisSchema, RedisDbTypes, RedisModel } = require('../libs/redis-db')
const { rediSearchDb, redisJsonDb } = require('../db')


const UserVoteSchema = new RedisSchema({
  username: {
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
  id: {
    type: RedisDbTypes.STRING,
    required: true,

    indexed: true,
    sortable: true,
  },
  parentItemId: {
    type: RedisDbTypes.STRING,

    indexed: true,
    sortable: true,
  },
  upvote: {
    type: RedisDbTypes.BOOLEAN,
    required: true,

    indexed: true,
    sortable: true,
  },
  downvote: {
    type: RedisDbTypes.BOOLEAN,
    required: true,

    indexed: true,
    sortable: true,
  },
  date: {
    type: RedisDbTypes.NUMBER,

    indexed: true,
    sortable: true,
  }
})

module.exports = RedisModel('user-vote', UserVoteSchema, {
  rediSearchDb, redisJsonDb,
})
