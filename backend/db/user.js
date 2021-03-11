const { RedisDb, RedisSchema, RedisDbTypes, RedisModel } = require('../libs/redis-db')
const { rediSearchDb, redisJsonDb } = require('../db')

const bcrypt = require("bcryptjs")

const UserSchema = new RedisSchema({
  username: {
    type: RedisDbTypes.STRING,
    unique: true,
    required: true,

    indexed: true,
    sortable: true,
  },
  password: {
    type: RedisDbTypes.STRING,
    required: true
  },
  authToken: {
    type: RedisDbTypes.STRING,
  },
  authTokenExpiration: {
    type: RedisDbTypes.NUMBER,
  },
  resetPasswordToken: {
    type: RedisDbTypes.STRING,
  },
  resetPasswordTokenExpiration: {
    type: RedisDbTypes.NUMBER,
  },
  email: {
    type: RedisDbTypes.STRING,
    lowercase: true,
    default: "",

    indexed: true,
    sortable: true,
  },
  created: {
    type: RedisDbTypes.NUMBER,
    indexed: true,

    indexed: true,
    sortable: true,
  },
  karma: {
    type: RedisDbTypes.NUMBER,
    default: 0,
    min: 0,

    indexed: true,
    sortable: true,
  },
  about: {
    type: RedisDbTypes.STRING,
    default: "",

    indexed: true,
  },
  showDead: {
    type: RedisDbTypes.BOOLEAN,
    default: false,

    indexed: true,
  },
  isModerator: {
    type: RedisDbTypes.BOOLEAN,
    default: false,

    indexed: true,
  },
  shadowBanned: {
    type: RedisDbTypes.BOOLEAN,
    default: false,

    indexed: true,
  },
  banned: {
    type: RedisDbTypes.BOOLEAN,
    default: false,

    indexed: true,
  }
})

UserSchema.pre("save", function (next) {
  const user = this
  if (this.isModified("password") || this.isNew()) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err)
      }

      bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) {
          return next(err)
        }

        user.password = hash
        next()
      })
    })
  } else {
    return next()
  }
})

UserSchema.methods.comparePassword = function(pw, cb) {
  bcrypt.compare(pw, this.password, function(err, isMatch) {
    if (err) {
      return cb(err)
    }

    cb(null, isMatch)
  })
}


module.exports = RedisModel('user', UserSchema, {
  rediSearchDb, redisJsonDb,
})
