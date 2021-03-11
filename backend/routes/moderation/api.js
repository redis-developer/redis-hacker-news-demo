const moment = require("moment")

const config = require("../../config.js")

const searchApi = require("../../routes/search/api.js")

const ModerationLogModel = require("../../models/moderationLog.js")
const ItemModel = require("../../models/item.js")
const CommentModel = require("../../models/comment.js")
const UserModel = require("../../models/user.js")

const shadowBannedUsersPerPage = config.shadowBannedUsersPerPage
const bannedUsersPerPage = config.bannedUsersPerPage
const moderationLogsPerPage = config.moderationLogsPerPage

module.exports = {
  killItem: function(itemId, moderator, callback) {
    ItemModel.findOneAndUpdate({id: itemId}, {$set: {dead: true, score: 0}}).lean().exec(function(error, item) {
      if (error || !item) {
        callback({submitError: true})
      } else {
        searchApi.deleteItem(item.id, function() {
          const newModerationLogDoc = new ModerationLogModel({
            moderatorUsername: moderator.username,
            actionType: "kill-item",
            itemId: itemId,
            itemTitle: item.title,
            itemBy: item.by,
            created: moment().unix()
          })

          newModerationLogDoc.save(function(saveError) {
            if (saveError) {
              callback({submitError: true})
            } else {
              callback({success: true})
            }
          })
        })
      }
    })
  },
  unkillItem: function(itemId, moderator, callback) {
    ItemModel.findOneAndUpdate({id: itemId}, {$set: {dead: false}}).lean().exec(function(error, item) {
      if (error || !item) {
        callback({submitError: true})
      } else {
        searchApi.addNewItem(item, function() {
          const newModerationLogDoc = new ModerationLogModel({
            moderatorUsername: moderator.username,
            actionType: "unkill-item",
            itemId: itemId,
            itemTitle: item.title,
            itemBy: item.by,
            created: moment().unix()
          })

          newModerationLogDoc.save(function(saveError) {
            if (saveError) {
              callback({submitError: true})
            } else {
              callback({success: true})
            }
          })
        })
      }
    })
  },
  killComment: function(commentId, moderator, callback) {
    CommentModel.findOneAndUpdate({id: commentId}, {$set: {dead: true}}).lean().exec(function(commentError, comment) {
      if (commentError || !comment) {
        callback({submitError: true})
      } else {
        searchApi.deleteKilledComment(comment.id, function() {
          const newModerationLogDoc = new ModerationLogModel({
            moderatorUsername: moderator.username,
            actionType: "kill-comment",
            commentId: commentId,
            commentBy: comment.by,
            itemTitle: comment.parentItemTitle,
            itemId: comment.parentItemId,
            created: moment().unix()
          })

          newModerationLogDoc.save(function(saveError) {
            if (saveError) {
              callback({submitError: true})
            } else {
              callback({success: true})
            }
          })
        })
      }
    })
  },
  unkillComment: function(commentId, moderator, callback) {
    CommentModel.findOneAndUpdate({id: commentId}, {$set: {dead: false}}).lean().exec(function(commentError, comment) {
      if (commentError || !comment) {
        callback({submitError: true})
      } else {
        searchApi.addUnkilledComment(comment, function() {
          const newModerationLogDoc = new ModerationLogModel({
            moderatorUsername: moderator.username,
            actionType: "unkill-comment",
            commentId: commentId,
            commentBy: comment.by,
            itemTitle: comment.parentItemTitle,
            itemId: comment.parentItemId,
            created: moment().unix()
          })

          newModerationLogDoc.save(function(saveError) {
            if (saveError) {
              callback({submitError: true})
            } else {
              callback({success: true})
            }
          })
        })
      }
    })
  },
  addUserShadowBan: function(username, moderator, callback) {
    UserModel.findOneAndUpdate({username: username}, {$set: {shadowBanned: true}}).lean().exec(function(error, user) {
      if (error || !user) {
        callback({submitError: true})
      } else {
        const newModerationLogDoc = new ModerationLogModel({
          moderatorUsername: moderator.username,
          actionType: "add-user-shadow-ban",
          username: username,
          created: moment().unix()
        })

        newModerationLogDoc.save(function(saveError) {
          if (saveError) {
            callback({submitError: true})
          } else {
            callback({success: true})
          }
        })
      }
    })
  },
  removeUserShadowBan: function(username, moderator, callback) {
    UserModel.findOneAndUpdate({username: username}, {$set: {shadowBanned: false}}).lean().exec(function(error, user) {
      if (error || !user) {
        callback({submitError: true})
      } else {
        const newModerationLogDoc = new ModerationLogModel({
          moderatorUsername: moderator.username,
          actionType: "remove-user-shadow-ban",
          username: username,
          created: moment().unix()
        })

        newModerationLogDoc.save(function(saveError) {
          if (saveError) {
            callback({submitError: true})
          } else {
            callback({success: true})
          }
        })
      }
    })
  },
  getShadowBannedUsersByPage: function(page, callback) {
    Promise.all([
      UserModel.find({shadowBanned: true}, "username")
      .sort({_id: -1})
      .skip((page - 1) * shadowBannedUsersPerPage)
      .limit(shadowBannedUsersPerPage)
      .lean(),
      UserModel.countDocuments({shadowBanned: true}).lean()
    ]).then(function([users, totalNumOfUsers]) {
      callback({
        success: true,
        users: users,
        isMore: totalNumOfUsers > (((page - 1) * shadowBannedUsersPerPage) + shadowBannedUsersPerPage) ? true : false
      })
    }).catch(function(promiseError) {
      callback({getDataError: true})
    })
  },
  addUserBan: function(username, moderator, callback) {
    UserModel.findOneAndUpdate({username: username}, {$set: {banned: true}}).lean().exec(function(error, user) {
      if (error || !user) {
        callback({submitError: true})
      } else {
        const newModerationLogDoc = new ModerationLogModel({
          moderatorUsername: moderator.username,
          actionType: "add-user-ban",
          username: username,
          created: moment().unix()
        })

        newModerationLogDoc.save(function(saveError) {
          if (saveError) {
            callback({submitError: true})
          } else {
            callback({success: true})
          }
        })
      }
    })
  },
  removeUserBan: function(username, moderator, callback) {
    UserModel.findOneAndUpdate({username: username}, {$set: {banned: false}}).lean().exec(function(error, user) {
      if (error || !user) {
        callback({submitError: true})
      } else {
        const newModerationLogDoc = new ModerationLogModel({
          moderatorUsername: moderator.username,
          actionType: "remove-user-ban",
          username: username,
          created: moment().unix()
        })

        newModerationLogDoc.save(function(saveError) {
          if (saveError) {
            callback({submitError: true})
          } else {
            callback({success: true})
          }
        })
      }
    })
  },
  getBannedUsersByPage: function(page, callback) {
    Promise.all([
      UserModel.find({banned: true}, "username")
      .sort({_id: -1})
      .skip((page - 1) * bannedUsersPerPage)
      .limit(bannedUsersPerPage)
      .lean(),
      UserModel.countDocuments({shadowBanned: true}).lean()
    ]).then(function([users, totalNumOfUsers]) {
      callback({
        success: true,
        users: users,
        isMore: totalNumOfUsers > (((page - 1) * bannedUsersPerPage) + bannedUsersPerPage) ? true : false
      })
    }).catch(function(promiseError) {
      callback({getDataError: true})
    })
  },
  getModerationLogsByPage: function(category, page, callback) {
    let dbQuery, categoryString

    if (category === "users") {
      categoryString = "users"
      dbQuery = {
        $or: [
          {actionType: "add-user-shadow-ban"},
          {actionType: "remove-user-shadow-ban"},
          {actionType: "add-user-ban"},
          {actionType: "remove-user-ban"}
        ]
      }
    } else if (category === "items") {
      categoryString = "items"
      dbQuery = {
        $or: [
          {actionType: "kill-item"},
          {actionType: "unkill-item"}
        ]
      }
    } else if (category === "comments") {
      categoryString = "comments"
      dbQuery = {
        $or: [
          {actionType: "kill-comment"},
          {actionType: "unkill-comment"}
        ]
      }
    } else {
      categoryString = "all"
      dbQuery = {}
    }

    Promise.all([
      ModerationLogModel.find(dbQuery)
      .sort({_id: -1})
      .skip((page - 1) * moderationLogsPerPage)
      .limit(moderationLogsPerPage)
      .lean(),
      ModerationLogModel.countDocuments(dbQuery).lean()
    ]).then(function([logs, totalNumOfLogs]) {
      callback({
        success: true,
        logs: logs,
        categoryString: categoryString,
        isMore: totalNumOfLogs > (((page - 1) * moderationLogsPerPage) + moderationLogsPerPage) ? true : false
      })
    }).catch(function(promiseError) {
      callback({getDataError: true})
    })
  }
}
