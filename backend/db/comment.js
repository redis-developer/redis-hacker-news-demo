const { RedisDb, RedisSchema, RedisDbTypes, RedisModel } = require('../libs/redis-db')
const { rediSearchDb, redisJsonDb } = require('../db')


const CommentSchema = new RedisSchema({
  id: {
    type: RedisDbTypes.STRING,
    unique: true,
    required: true,

    indexed: true,
  },
  by: {
    type: RedisDbTypes.STRING,
    required: true,

    indexed: true,
  },
  parentItemId: {
    type: RedisDbTypes.STRING,
    required: true,

    indexed: true,
  },
  parentItemTitle: {
    type: RedisDbTypes.STRING,
    required: true,

    indexed: true,
    sortable: true,
  },
  isParent: {
    type: RedisDbTypes.BOOLEAN,
    required: true,

    indexed: true,
  },
  parentCommentId: {
    type: RedisDbTypes.STRING,

    indexed: true,
  },
  // children: [
  //   {
  //     type: mongoose.Schema.ObjectId, ref: "Comment"
  //   }
  // ],
  children: {
    type: RedisDbTypes.ARRAY,
    refIdx: 'comment',
    default: [],
  },
  text: {
    type: RedisDbTypes.STRING,
    
    indexed: true,
  },
  points: {
    type: RedisDbTypes.NUMBER,
    default: 1,
    min: -4,

    indexed: true,
    sortable: true,
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

function autoPopulateChildrenComments(next) {
  if (this.options.additionalOptions.getChildrenComments) {
    let filterObj = {}

    if (!this.options.additionalOptions.showDeadComments) filterObj.dead = false

    this.populate({
      path: "children",
      match: filterObj,
      additionalOptions: {
        getChildrenComments: true,
        showDeadComments: this.options.additionalOptions.showDeadComments
      }
    })

    next()
  } else {
    next()
  }
}

CommentSchema.pre("find", autoPopulateChildrenComments)
CommentSchema.pre("findOne", autoPopulateChildrenComments)

module.exports = RedisModel('comment', CommentSchema, {
  rediSearchDb, redisJsonDb,
})
