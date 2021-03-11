const { RedisDb, RedisSchema, RedisDbTypes, RedisModel } = require('../libs/redis-db')
const { rediSearchDb, redisJsonDb } = require('../db')


const ModerationLogSchema = new RedisSchema({
  moderatorUsername: {
    type: RedisDbTypes.STRING,
    required: true,
    
    indexed: true,
    sortable: true,
  },
  actionType: {
    type: RedisDbTypes.STRING,
    required: true,
    
    indexed: true,
    sortable: true,
  },
  username: {
    type: RedisDbTypes.STRING,
    
    indexed: true,
    sortable: true,
  },
  itemId: {
    type: RedisDbTypes.STRING,
    
    indexed: true,
    sortable: true,
  },
  itemTitle: {
    type: RedisDbTypes.STRING,
    
    indexed: true,
    sortable: true,
  },
  itemBy: {
    type: RedisDbTypes.STRING,
    
    indexed: true,
    sortable: true,
  },
  commentId: {
    type: RedisDbTypes.STRING,
    
    indexed: true,
    sortable: true,
  },
  commentBy: {
    type: RedisDbTypes.STRING,
    
    indexed: true,
    sortable: true,
  },
  created: {
    type: RedisDbTypes.NUMBER,
    
    indexed: true,
    sortable: true,
  }
})

module.exports = RedisModel('moderation-log', ModerationLogSchema, {
  rediSearchDb, redisJsonDb,
})
