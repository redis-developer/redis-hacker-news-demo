const xss = require("xss")
const linkifyUrls = require("linkify-urls")
const moment = require("moment")

const utils = require("../utils.js")

const config = require("../../config.js")

const searchApi = require("../search/api.js")

const ItemModel = require("../../models/item.js")
const UserModel = require("../../models/user.js")
const UserVoteModel = require("../../models/userVote.js")
const UserFavoriteModel = require("../../models/userFavorite.js")
const UserHiddenModel = require("../../models/userHidden.js")
const CommentModel = require("../../models/comment.js")

const maxAgeOfRankedItemsInDays = config.maxAgeOfRankedItemsInDays
const itemsPerPage = config.itemsPerPage
const commentsPerPage = config.commentsPerPage

module.exports = {
  submitNewItem: function(title, url, text, authUser, callback) {
    const isValidUrl = utils.isValidUrl(url)

    if (url && !isValidUrl) {
      callback({invalidUrlError: true})
    } else {
      title = title.trim()
      title = xss(title)

      url = url.trim()
      url = xss(url)

      if (text) {
        text = text.trim()
        text = text.replace(/<[^>]+>/g, "")
        text = text.replace(/\*([^*]+)\*/g, "<i>$1</i>")
        text = linkifyUrls(text)
        text = xss(text)
      }

      const domain = url ? utils.getDomainFromUrl(url) : ""

      const itemType = utils.getItemType(title, url, text)

      const newItem = new ItemModel({
        id: utils.generateUniqueId(12),
        by: authUser.username,
        title: title,
        type: itemType,
        url: url,
        domain: domain,
        text: text,
        created: moment().unix(),
        dead: authUser.shadowBanned ? true : false
      })

      newItem.save(function(saveError, newItemDoc) {
        if (saveError) {
          callback({submitError: true})
        } else {
          UserModel.findOneAndUpdate({username: authUser.username}, {$inc: {karma: 1}}).exec(function(updateUserError) {
            if (updateUserError) {
              callback({submitError: true})
            } else {
              if (authUser.shadowBanned) {
                callback({success: true})
              } else {
                searchApi.addNewItem(newItemDoc, function() {
                  callback({success: true})
                })
              }
            }
          })
        }
      })
    }
  },
  getItemById: function(itemId, page, authUser, callback) {
    const showDeadComments = authUser.showDead ? true : false

    let commentsDbQuery = {
      parentItemId: itemId,
      isParent: true
    }

    if (!showDeadComments) commentsDbQuery.dead = false

    Promise.all([
      ItemModel.findOne({id: itemId}).lean(),
      CommentModel.find(commentsDbQuery, null, {getChildrenComments: true, showDeadComments: showDeadComments})
      .sort({points: -1, created: -1})
      .skip((page - 1) * commentsPerPage)
      .limit(commentsPerPage)
      .lean(),
      // CommentModel.countDocuments(commentsDbQuery).lean()
    ]).then(function([item, comments, totalNumOfComments]) {
      if (!item) {
        callback({notFoundError: true})
      } else if (!authUser.userSignedIn) {
        callback({
          success: true,
          item: item,
          comments: comments,
          isMoreComments: totalNumOfComments > (((page - 1) * commentsPerPage) + commentsPerPage) ? true : false
        })
      } else {
        Promise.all([
          UserVoteModel.findOne({username: authUser.username, id: itemId, type: "item"}).lean(),
          UserFavoriteModel.findOne({username: authUser.username, id: itemId, type: "item"}).lean(),
          UserHiddenModel.findOne({username: authUser.username, id: itemId}).lean(),
          UserVoteModel.find({username: authUser.username, type: "comment", parentItemId: itemId}).lean()
        ]).then(function([voteDoc, favoriteDoc, hiddenDoc, commentVoteDocs]) {
          item.votedOnByUser = voteDoc ? true : false
          item.unvoteExpired = voteDoc && voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix()
          item.favoritedByUser = favoriteDoc ? true : false
          item.hiddenByUser = hiddenDoc ? true : false

          if (item.by === authUser.username) {
            const hasEditAndDeleteExpired =
              item.created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
              item.commentCount > 0

            item.editAndDeleteExpired = hasEditAndDeleteExpired
          }

          let userCommentVotes = []

          for (let i=0; i < commentVoteDocs.length; i++) {
            userCommentVotes.push(commentVoteDocs[i].id)
          }

          const updateComment = function(comment) {
            if (comment.by === authUser.username) {
              const hasEditAndDeleteExpired =
                comment.created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                comment.children.length > 0

              comment.editAndDeleteExpired = hasEditAndDeleteExpired
            }

            if (userCommentVotes.includes(comment.id)) {
              comment.votedOnByUser = true

              for (let i=0; i < commentVoteDocs.length; i++) {
                if (comment.id === commentVoteDocs[i].id) {
                  comment.unvoteExpired = commentVoteDocs[i].date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                }
              }
            }

            if (comment.children) {
              for (let i=0; i < comment.children.length; i++) {
                updateComment(comment.children[i])
              }
            }
          }

          for (let i=0; i < comments.length; i++) {
            updateComment(comments[i])
          }

          callback({
            success: true,
            item: item,
            comments: comments,
            isMoreComments: totalNumOfComments > (((page - 1) * commentsPerPage) + commentsPerPage) ? true : false
          })
        }).catch(function(promiseError) {
          callback({getDataError: true})
        })
      }
    }).catch(function(promiseError) {
      callback({getDataError: true})
    })
  },
  upvoteItem: function(itemId, authUser, callback) {
    Promise.all([
      ItemModel.findOne({id: itemId}),
      UserVoteModel.findOne({username: authUser.username, id: itemId, type: "item"}).lean()
    ]).then(function([item, voteDoc]) {
      if (!item || item.by === authUser.username || item.dead) {
        callback({submitError: true})
      } else if (voteDoc) {
        callback({submitError: true})
      } else {
        const newUserVoteDoc = new UserVoteModel({
          username: authUser.username,
          type: "item",
          id: itemId,
          upvote: true,
          downvote: false,
          date: moment().unix()
        })

        newUserVoteDoc.save(function(saveVoteDocError) {
          if (saveVoteDocError) {
            callback({submitError: true})
          } else {
            item.points = item.points + 1

            item.save(function(saveItemDocError, updatedItem) {
              if (saveItemDocError) {
                callback({submitError: true})
              } else {
                UserModel.findOneAndUpdate({username: item.by}, {$inc: { karma: 1 }}).lean().exec(function(userError) {
                  if (userError) {
                    callback({submitError: true})
                  } else {
                    searchApi.updateItemPointsCount(item.id, item.points, function() {
                      callback({success: true})
                    })
                  }
                })
              }
            })
          }
        })
      }
    }).catch(function(promiseError) {
      callback({submitError: true})
    })
  },
  unvoteItem: function(itemId, authUser, callback) {
    Promise.all([
      ItemModel.findOne({id: itemId}),
      UserVoteModel.findOne({username: authUser.username, id: itemId, type: "item"})
    ]).then(function([item, voteDoc]) {
      if (!item || item.by === authUser.username || item.dead) {
        callback({submitError: true})
      } else if (!voteDoc || voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix()) {
        callback({submitError: true})
      } else {
        voteDoc.remove(function(removeError) {
          if (removeError) {
            callback({submitError: true})
          } else {
            item.points = item.points - 1

            item.save(function(saveItemDocError, updatedItem) {
              if (saveItemDocError) {
                callback({submitError: true})
              } else {
                UserModel.findOneAndUpdate({username: item.by}, {$inc: { karma: -1 }}).lean().exec(function(updateUserError) {
                  if (updateUserError) {
                    callback({submitError: true})
                  } else {
                    searchApi.updateItemPointsCount(item.id, item.points, function() {
                      callback({success: true})
                    })
                  }
                })
              }
            })
          }
        })
      }
    }).catch(function(promiseError) {
      callback({submitError: true})
    })
  },
  favoriteItem: function(itemId, authUser, callback) {
    Promise.all([
      ItemModel.findOne({id: itemId}).lean(),
      UserFavoriteModel.findOne({username: authUser.username, id: itemId, type: "item"}).lean()
    ]).then(function([item, favorite]) {
      if (!item || favorite) {
        callback({submitError: true})
      } else {
        const newFavoriteDoc = new UserFavoriteModel({
          username: authUser.username,
          type: "item",
          id: itemId,
          date: moment().unix()
        })

        newFavoriteDoc.save(function(newDocError, newDoc) {
          if (newDocError) {
            callback({submitError: true})
          } else {
            callback({success: true})
          }
        })
      }
    }).catch(function(promiseError) {
      callback({submitError: true})
    })
  },
  unfavoriteItem: function(itemId, authUser, callback) {
    UserFavoriteModel.findOneAndRemove({username: authUser.username, id: itemId}).exec(function(error) {
      if (error) {
        callback({submitError: true})
      } else {
        callback({success: true})
      }
    })
  },
  hideItem: function(itemId, authUser, callback) {
    Promise.all([
      ItemModel.findOne({id: itemId}).lean(),
      UserHiddenModel.findOne({username: authUser.username, id: itemId}).lean()
    ]).then(function([item, hiddenDoc]) {
      if (!item || hiddenDoc) {
        callback({submitError: true})
      } else {
        const newHiddenDoc = new UserHiddenModel({
          username: authUser.username,
          id: itemId,
          date: moment().unix(),
          itemCreationDate: item.created
        })

        newHiddenDoc.save(function(newDocError, newDoc) {
          if (newDocError) {
            callback({submitError: true})
          } else {
            callback({success: true})
          }
        })
      }
    }).catch(function(promiseError) {
      callback({submitError: true})
    })
  },
  unhideItem: function(itemId, authUser, callback) {
    UserHiddenModel.findOneAndRemove({username: authUser.username, id: itemId}).exec(function(error) {
      if (error) {
        callback({submitError: true})
      } else {
        callback({success: true})
      }
    })
  },
  getEditItemPageData: function(itemId, authUser, callback) {
    ItemModel.findOne({id: itemId}).lean().exec(function(error, item) {
      if (error) {
        callback({getDataError: true})
      } else if (!item) {
        callback({notFoundError: true})
      } else if (item.dead) {
        callback({notAllowedError: true})
      } else if (item.by !== authUser.username) {
        callback({notAllowedError: true})
      } else if (item.created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix()) {
        callback({notAllowedError: true})
      } else if (item.commentCount > 0) {
        callback({notAllowedError: true})
      } else {
        if (item.text) {
          item.textForEditing = item.text
            .replace(/<a\b[^>]*>/g,"").replace(/<\/a>/g, "")
            .replace(/<i\b[^>]*>/g,"*").replace(/<\/i>/g, "*")
        } else {
          item.textForEditing = ""
        }

        callback({success: true, item: item})
      }
    })
  },
  editItem: function(itemId, newItemTitle, newItemText, authUser, callback) {
    ItemModel.findOne({id: itemId}).exec(function(error, item) {
      if (error || !item) {
        callback({submitError: true})
      } else if (item.dead) {
        callback({notAllowedError: true})
      } else if (item.by !== authUser.username) {
        callback({notAllowedError: true})
      } else if (item.created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix()) {
        callback({notAllowedError: true})
      } else if (item.commentCount > 0) {
        callback({notAllowedError: true})
      } else {
        const ogItemTitle = item.title

        newItemTitle = newItemTitle.trim()
        newItemTitle = xss(newItemTitle)

        item.title = newItemTitle

        if (!item.url && newItemText) {
          newItemText = newItemText.trim()
          newItemText = newItemText.replace(/<[^>]+>/g, "")
          newItemText = newItemText.replace(/\*([^*]+)\*/g, "<i>$1</i>")
          newItemText = linkifyUrls(newItemText)
          newItemText = xss(newItemText)
        }

        item.text = newItemText

        if (ogItemTitle !== newItemTitle) {
          item.type = utils.getItemType(newItemTitle, item.url, newItemText)
        }

        item.save(function(saveError) {
          if (saveError) {
            callback({submitError: true})
          } else {
            searchApi.editItem(itemId, newItemTitle, newItemText, function() {
              callback({success: true})
            })
          }
        })
      }
    })
  },
  getDeleteItemPageData: function(itemId, authUser, callback) {
    ItemModel.findOne({id: itemId}).lean().exec(function(error, item) {
      if (error) {
        callback({getDataError: true})
      } else if (!item) {
        callback({notFoundError: true})
      } else if (item.dead) {
        callback({notAllowedError: true})
      } else if (item.by !== authUser.username) {
        callback({notAllowedError: true})
      } else if (item.created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix()) {
        callback({notAllowedError: true})
      } else if (item.commentCount > 0) {
        callback({notAllowedError: true})
      } else {
        callback({success: true, item: item})
      }
    })
  },
  deleteItem: function(itemId, authUser, callback) {
    ItemModel.findOne({id: itemId}).exec(function(error, item) {
      if (error) {
        callback({submitError: true})
      } else if (!item) {
        callback({notFoundError: true})
      } else if (item.dead) {
        callback({notAllowedError: true})
      } else if (item.by !== authUser.username) {
        callback({notAllowedError: true})
      } else if (item.created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix()) {
        callback({notAllowedError: true})
      } else if (item.commentCount > 0) {
        callback({notAllowedError: true})
      } else {
        item.remove(function(removeError) {
          if (removeError) {
            callback({submitError: true})
          } else {
            const newUserKarmaValue = authUser.karma - item.points

            UserModel.findOneAndUpdate({username: authUser.username}, {karma: newUserKarmaValue}).exec(function(updateKarmaError) {
              if (updateKarmaError) {
                callback({submitError: true})
              } else {
                searchApi.deleteItem(item.id, function() {
                  callback({success: true})
                })
              }
            })
          }
        })
      }
    })
  },
  getRankedItemsByPage: function(page, authUser, callback) {
    const startDate = moment().unix() - (86400 * maxAgeOfRankedItemsInDays)

    if (!authUser.userSignedIn) {
      Promise.all([
        ItemModel.find({created: {$gt: startDate}, dead: false})
        .sort({score: -1, _id: -1})
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .lean(),
        ItemModel.countDocuments({created: {$gt: startDate}, dead: false}).lean()
      ]).then(function([items, totalItemCount]) {
        for (i=0; i < items.length; i++) {
          items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)
        }

        callback({
          success: true,
          items: items,
          isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
        })
      }).catch(function(promiseError) {
        callback({getDataError: true})
      })
    } else {
      UserHiddenModel.find({username: authUser.username, itemCreationDate: {$gte: startDate}}).lean().exec(function(hiddenDocsError, hiddenDocs) {
        if (hiddenDocsError) {
          callback({getDataError: true})
        } else {
          let arrayOfHiddenItems = []

          for (let i=0; i < hiddenDocs.length; i++) {
            arrayOfHiddenItems.push(hiddenDocs[i].id)
          }

          let itemsDbQuery = {
            created: {
              $gte: startDate
            },
            id: {
              $nin: arrayOfHiddenItems
            }
          }

          if (!authUser.showDead) itemsDbQuery.dead = false

          ItemModel.find(itemsDbQuery)
          .sort({score: -1, _id: -1})
          .skip((page - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .lean()
          .exec(function(itemsError, items) {
            if (itemsError) {
              callback({getDataError: true})
            } else {
              let arrayOfItemIds = []

              for (let i = 0; i < items.length; i ++) {
                arrayOfItemIds.push(items[i].id)
              }

              Promise.all([
                UserVoteModel.find({username: authUser.username, date: {$gte: startDate}, id: {$in: arrayOfItemIds}, type: "item"}).lean(),
                ItemModel.countDocuments(itemsDbQuery).lean()
              ]).then(function([userItemVoteDocs, totalItemCount]) {
                for (let i=0; i < items.length; i++) {
                  items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)

                  if (items[i].by === authUser.username) {
                    const hasEditAndDeleteExpired =
                      items[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                      items[i].commentCount > 0

                    items[i].editAndDeleteExpired = hasEditAndDeleteExpired
                  }

                  const voteDoc = userItemVoteDocs.find(function(voteDoc) {
                    return voteDoc.id === items[i].id
                  })

                  if (voteDoc) {
                    items[i].votedOnByUser = true
                    items[i].unvoteExpired = voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                  }
                }

                callback({
                  success: true,
                  items: items,
                  isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
                })
              }).catch(function(promiseError) {
                callback({getDataError: true})
              })
            }
          })
        }
      })
    }
  },
  // Exact same as getRankedItemsByPage
  searchItemsByPage: function(page, query, authUser, callback) {
    const startDate = moment().unix() - (86400 * maxAgeOfRankedItemsInDays)

    console.log('xx')
    const options = {}
    if (query) {
      options.title = { $like: query }
    }

    if (!authUser.userSignedIn) {
      Promise.all([
        ItemModel.find({ ...options, dead: false })
        .sort({score: -1, _id: -1})
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .lean(),
        ItemModel.countDocuments({ ...options, dead: false }).lean()
      ]).then(function([items, totalItemCount]) {
        for (i=0; i < items.length; i++) {
          items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)
        }

        callback({
          success: true,
          items: items,
          isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
        })
      }).catch(function(promiseError) {
        callback({getDataError: true})
      })
    } else {
      UserHiddenModel.find({username: authUser.username, itemCreationDate: {$gte: startDate}}).lean().exec(function(hiddenDocsError, hiddenDocs) {
        if (hiddenDocsError) {
          callback({getDataError: true})
        } else {
          let arrayOfHiddenItems = []

          for (let i=0; i < hiddenDocs.length; i++) {
            arrayOfHiddenItems.push(hiddenDocs[i].id)
          }

          let itemsDbQuery = {
            ...options,
            id: {
              $nin: arrayOfHiddenItems
            }
          }

          if (!authUser.showDead) itemsDbQuery.dead = false

          ItemModel.find(itemsDbQuery)
          .sort({score: -1, _id: -1})
          .skip((page - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .lean()
          .exec(function(itemsError, items) {
            if (itemsError) {
              callback({getDataError: true})
            } else {
              let arrayOfItemIds = []

              for (let i = 0; i < items.length; i ++) {
                arrayOfItemIds.push(items[i].id)
              }

              Promise.all([
                UserVoteModel.find({username: authUser.username, date: {$gte: startDate}, id: {$in: arrayOfItemIds}, type: "item"}).lean(),
                ItemModel.countDocuments(itemsDbQuery).lean()
              ]).then(function([userItemVoteDocs, totalItemCount]) {
                for (let i=0; i < items.length; i++) {
                  items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)

                  if (items[i].by === authUser.username) {
                    const hasEditAndDeleteExpired =
                      items[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                      items[i].commentCount > 0

                    items[i].editAndDeleteExpired = hasEditAndDeleteExpired
                  }

                  const voteDoc = userItemVoteDocs.find(function(voteDoc) {
                    return voteDoc.id === items[i].id
                  })

                  if (voteDoc) {
                    items[i].votedOnByUser = true
                    items[i].unvoteExpired = voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                  }
                }

                callback({
                  success: true,
                  items: items,
                  isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
                })
              }).catch(function(promiseError) {
                callback({getDataError: true})
              })
            }
          })
        }
      })
    }
  },
  getNewestItemsByPage: function(page, authUser, callback) {
    if (!authUser.userSignedIn) {
      Promise.all([
        ItemModel.find({dead: false}).sort({_id: -1}).skip((page - 1) * itemsPerPage).limit(itemsPerPage).lean(),
        ItemModel.countDocuments({dead: false}).lean()
      ]).then(function([items, totalItemCount]) {
        for (let i=0; i < items.length; i++) {
          items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)
        }

        callback({
          success: true,
          items: items,
          isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
        })
      }).catch(function(promiseError) {
        callback({getDataError: true})
      })
    } else {
      UserHiddenModel.find({username: authUser.username}).lean().exec(function(hiddenDocsError, hiddenDocs) {
        if (hiddenDocsError) {
          callback({getDataError: true})
        } else {
          let arrayOfHiddenItems = []

          for (let i=0; i < hiddenDocs.length; i++) {
            arrayOfHiddenItems.push(hiddenDocs[i].id)
          }

          let itemsDbQuery = {
            id: {
              $nin: arrayOfHiddenItems
            }
          }

          if (!authUser.showDead) itemsDbQuery.dead = false

          ItemModel.find(itemsDbQuery)
          .sort({_id: -1})
          .skip((page - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .lean()
          .exec(function(itemsError, items) {
            if (itemsError) {
              callback({getDataError: true})
            } else {
              let arrayOfItemIds = []

              for (let i=0; i < items.length; i++) {
                arrayOfItemIds.push(items[i].id)
              }

              Promise.all([
                UserVoteModel.find({username: authUser.username, id: {$in: arrayOfItemIds}, type: "item"}).lean(),
                ItemModel.countDocuments(itemsDbQuery).lean()
              ]).then(function([userItemVoteDocs, totalItemCount]) {
                for (let i=0; i < items.length; i++) {
                  items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)

                  if (items[i].by === authUser.username) {
                    const hasEditAndDeleteExpired =
                      items[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                      items[i].commentCount > 0

                    items[i].editAndDeleteExpired = hasEditAndDeleteExpired
                  }

                  const voteDoc = userItemVoteDocs.find(function(voteDoc) {
                    return voteDoc.id === items[i].id
                  })

                  if (voteDoc) {
                    items[i].votedOnByUser = true
                    items[i].unvoteExpired = voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                  }
                }

                callback({
                  success: true,
                  items: items,
                  isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
                })
              }).catch(function(promiseError) {
                callback({getDataError: true})
              })
            }
          })
        }
      })
    }
  },
  getRankedShowItemsByPage: function(page, authUser, callback) {
    const startDate = moment().unix() - (86400 * maxAgeOfRankedItemsInDays)

    if (!authUser.userSignedIn) {
      Promise.all([
        ItemModel.find({type: "show", created: {$gte: startDate}, dead: false})
        .sort({score: -1, _id: -1})
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .lean(),
        ItemModel.countDocuments({type: "show", created: {$gte: startDate}, dead: false}).lean()
      ]).then(function([items, totalItemCount]) {
        for (i=0; i < items.length; i++) {
          items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)
        }

        callback({
          success: true,
          items: items,
          isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
        })
      }).catch(function(promiseError) {
        callback({getDataError: true})
      })
    } else {
      UserHiddenModel.find({username: authUser.username, itemCreationDate: {$gte: startDate}})
      .lean()
      .exec(function(hiddenDocsError, hiddenDocs) {
        if (hiddenDocsError) {
          callback({getDataError: true})
        } else {
          let arrayOfHiddenItems = []

          for (let i=0; i < hiddenDocs.length; i++) {
            arrayOfHiddenItems.push(hiddenDocs[i].id)
          }

          let itemsDbQuery = {
            type: "show",
            created: {
              $gte: startDate
            },
            id: {
              $nin: arrayOfHiddenItems
            }
          }

          if (!authUser.showDead) itemsDbQuery.dead = false

          ItemModel.find(itemsDbQuery)
          .sort({score: -1, _id: -1})
          .skip((page - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .lean()
          .exec(function(itemsError, items) {
            if (itemsError) {
              callback({getDataError: true})
            } else {
              let arrayOfItemIds = []

              for (let i=0; i < items.length; i++) {
                arrayOfItemIds.push(items[i].id)
              }

              Promise.all([
                UserVoteModel.find({username: authUser.username, date: {$gte: startDate}, id: {$in: arrayOfItemIds}, type: "item"}).lean(),
                ItemModel.countDocuments(itemsDbQuery).lean()
              ]).then(function([userItemVoteDocs, totalItemCount]) {
                for (let i=0; i < items.length; i++) {
                  items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)

                  if (items[i].by === authUser.username) {
                    const hasEditAndDeleteExpired =
                      items[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                      items[i].commentCount > 0

                    items[i].editAndDeleteExpired = hasEditAndDeleteExpired
                  }

                  const voteDoc = userItemVoteDocs.find(function(voteDoc) {
                    return voteDoc.id === items[i].id
                  })

                  if (voteDoc) {
                    items[i].votedOnByUser = true
                    items[i].unvoteExpired = voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                  }
                }

                callback({
                  success: true,
                  items: items,
                  isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
                })
              }).catch(function(promiseError) {
                callback({getDataError: true})
              })
            }
          })
        }
      })
    }
  },
  getNewestShowItemsByPage: function(page, authUser, callback) {
    if (!authUser.userSignedIn) {
      Promise.all([
        ItemModel.find({type: "show", dead: false})
        .sort({_id: -1})
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .lean(),
        ItemModel.countDocuments({type: "show", dead: false}).lean()
      ]).then(function([items, totalItemCount]) {
        for (i=0; i < items.length; i++) {
          items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)
        }

        callback({
          success: true,
          items: items,
          isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
        })
      }).catch(function(promiseError) {
        callback({getDataError: true})
      })
    } else {
      UserHiddenModel.find({username: authUser.username}).lean().exec(function(hiddenDocsError, hiddenDocs) {
        if (hiddenDocsError) {
          callback({getDataError: true})
        } else {
          let arrayOfHiddenItems = []

          for (let i=0; i < hiddenDocs.length; i++) {
            arrayOfHiddenItems.push(hiddenDocs[i].id)
          }

          let itemsDbQuery = {
            type: "show",
            id: {
              $nin: arrayOfHiddenItems
            }
          }

          if (!authUser.showDead) itemsDbQuery.dead = false

          ItemModel.find(itemsDbQuery)
          .sort({_id: -1})
          .skip((page - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .lean()
          .exec(function(itemsError, items) {
            if (itemsError) {
              callback({getDataError: true})
            } else {
              let arrayOfItemIds = []

              for (let i=0; i < items.length; i++) {
                arrayOfItemIds.push(items[i].id)
              }

              Promise.all([
                UserVoteModel.find({username: authUser.username, id: {$in: arrayOfItemIds}, type: "item"}).lean(),
                ItemModel.countDocuments(itemsDbQuery).lean()
              ]).then(function([userItemVoteDocs, totalItemCount]) {
                for (let i=0; i < items.length; i++) {
                  items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)

                  if (items[i].by === authUser.username) {
                    const hasEditAndDeleteExpired =
                      items[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                      items[i].commentCount > 0

                    items[i].editAndDeleteExpired = hasEditAndDeleteExpired
                  }

                  const voteDoc = userItemVoteDocs.find(function(voteDoc) {
                    return voteDoc.id === items[i].id
                  })

                  if (voteDoc) {
                    items[i].votedOnByUser = true
                    items[i].unvoteExpired = voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                  }
                }

                callback({
                  success: true,
                  items: items,
                  isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
                })
              }).catch(function(promiseError) {
                callback({getDataError: true})
              })
            }
          })
        }
      })
    }
  },
  getRankedAskItemsByPage: function(page, authUser, callback) {
    const startDate = moment().unix() - (86400 * maxAgeOfRankedItemsInDays)

    if (!authUser.userSignedIn) {
      Promise.all([
        ItemModel.find({type: "ask", created: {$gt: startDate}, dead: false})
        .sort({score: -1, _id: -1})
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .lean(),
        ItemModel.countDocuments({type: "ask", created: {$gt: startDate}, dead: false}).lean()
      ]).then(function([items, totalItemCount]) {
        for (i=0; i < items.length; i++) {
          items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)
        }

        callback({
          success: true,
          items: items,
          isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
        })
      }).catch(function(promiseError) {
        callback({getDataError: true})
      })
    } else {
      UserHiddenModel.find({username: authUser.username, itemCreationDate: {$gte: startDate}})
      .lean()
      .exec(function(hiddenDocsError, hiddenDocs) {
        if (hiddenDocsError) {
          callback({getDataError: true})
        } else {
          let arrayOfHiddenItems = []

          for (let i=0; i < hiddenDocs.length; i++) {
            arrayOfHiddenItems.push(hiddenDocs[i].id)
          }

          let itemsDbQuery = {
            type: "ask",
            created: {
              $gte: startDate
            },
            id: {
              $nin: arrayOfHiddenItems
            }
          }

          if (!authUser.showDead) itemsDbQuery.dead = false

          ItemModel.find(itemsDbQuery)
          .sort({score: -1, _id: -1})
          .skip((page - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .lean()
          .exec(function(itemsError, items) {
            if (itemsError) {
              callback({getDataError: true})
            } else {
              let arrayOfItemIds = []

              for (let i=0; i < items.length; i++) {
                arrayOfItemIds.push(items[i].id)
              }

              Promise.all([
                UserVoteModel.find({username: authUser.username, date: {$gte: startDate}, id: {$in: arrayOfItemIds}, type: "item"}).lean(),
                ItemModel.countDocuments(itemsDbQuery).lean()
              ]).then(function([userItemVoteDocs, totalItemCount]) {
                for (let i=0; i < items.length; i++) {
                  items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)

                  if (items[i].by === authUser.username) {
                    const hasEditAndDeleteExpired =
                      items[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                      items[i].commentCount > 0

                    items[i].editAndDeleteExpired = hasEditAndDeleteExpired
                  }

                  const voteDoc = userItemVoteDocs.find(function(voteDoc) {
                    return voteDoc.id === items[i].id
                  })

                  if (voteDoc) {
                    items[i].votedOnByUser = true
                    items[i].unvoteExpired = voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                  }
                }

                callback({
                  success: true,
                  items: items,
                  isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
                })
              }).catch(function(promiseError) {
                callback({getDataError: true})
              })
            }
          })
        }
      })
    }
  },
  getItemsBySiteDomain: function(domain, page, authUser, callback) {
    if (!authUser.userSignedIn) {
      Promise.all([
        ItemModel.find({domain: domain, dead: false})
        .sort({_id: -1})
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .lean(),
        ItemModel.countDocuments({domain: domain, dead: false}).lean()
      ]).then(function([items, totalItemCount]) {
        callback({
          success: true,
          items: items,
          isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
        })
      }).catch(function(promiseError) {
        callback({getDataError: true})
      })
    } else {
      UserHiddenModel.find({username: authUser.username}).lean().exec(function(hiddenDocsError, hiddenDocs) {
        if (hiddenDocsError) {
          callback({getDataError: true})
        } else {
          let arrayOfHiddenItems = []

          for (let i=0; i < hiddenDocs.length; i++) {
            arrayOfHiddenItems.push(hiddenDocs[i].id)
          }

          let itemsDbQuery = {
            domain: domain,
            id: {
              $nin: arrayOfHiddenItems
            }
          }

          if (!authUser.showDead) itemsDbQuery.dead = false

          ItemModel.find(itemsDbQuery)
          .sort({_id: -1})
          .skip((page - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .lean()
          .exec(function(itemsError, items) {
            if (itemsError) {
              callback({getDataError: true})
            } else {
              let arrayOfItemIds = []

              for (let i=0; i < items.length; i++) {
                arrayOfItemIds.push(items[i].id)
              }

              Promise.all([
                UserVoteModel.find({username: authUser.username, id: {$in: arrayOfItemIds}, type: "item"}).lean(),
                ItemModel.countDocuments(itemsDbQuery).lean()
              ]).then(function([userItemVoteDocs, totalItemCount]) {
                for (let i=0; i < items.length; i++) {
                  if (items[i].by === authUser.username) {
                    const hasEditAndDeleteExpired =
                      items[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                      items[i].commentCount > 0

                    items[i].editAndDeleteExpired = hasEditAndDeleteExpired
                  }

                  const voteDoc = userItemVoteDocs.find(function(voteDoc) {
                    return voteDoc.id === items[i].id
                  })

                  if (voteDoc) {
                    items[i].votedOnByUser = true
                    items[i].unvoteExpired = voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                  }
                }

                callback({
                  success: true,
                  items: items,
                  isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
                })
              }).catch(function(promiseError) {
                callback({getDataError: true})
              })
            }
          })
        }
      })
    }
  },
  getItemsSubmittedByUser: function(userId, page, authUser, callback) {
    if (!authUser.userSignedIn) {
      Promise.all([
        ItemModel.find({by: userId, dead: false})
        .sort({_id: -1})
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .lean(),
        ItemModel.countDocuments({by: userId, dead: false}).lean()
      ]).then(function([items, totalItemCount]) {
        for (i=0; i < items.length; i++) {
          items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)
        }

        callback({
          success: true,
          items: items,
          isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
        })
      }).catch(function(promiseError) {
        callback({getDataError: true})
      })
    } else {
      UserHiddenModel.find({username: authUser.username}).lean().exec(function(hiddenDocsError, hiddenDocs) {
        if (hiddenDocsError) {
          callback({getDataError: true})
        } else {
          let arrayOfHiddenItems = []

          for (let i=0; i < hiddenDocs.length; i++) {
            arrayOfHiddenItems.push(hiddenDocs[i].id)
          }

          let itemsDbQuery = {
            by: userId,
            id: {
              $nin: arrayOfHiddenItems
            }
          }

          if (!authUser.showDead) itemsDbQuery.dead = false

          ItemModel.find(itemsDbQuery)
          .sort({_id: -1})
          .skip((page - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .lean()
          .exec(function(itemsError, items) {
            if (itemsError) {
              callback({getDataError: true})
            } else {
              let arrayOfItemIds = []

              for (let i=0; i < items.length; i++) {
                arrayOfItemIds.push(items[i].id)
              }

              Promise.all([
                UserVoteModel.find({username: authUser.username, id: {$in: arrayOfItemIds}, type: "item"}).lean(),
                ItemModel.countDocuments(itemsDbQuery).lean()
              ]).then(function([userItemVoteDocs, totalItemCount]) {
                for (let i=0; i < items.length; i++) {
                  items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)

                  if (items[i].by === authUser.username) {
                    const hasEditAndDeleteExpired =
                      items[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                      items[i].commentCount > 0

                    items[i].editAndDeleteExpired = hasEditAndDeleteExpired
                  }

                  const voteDoc = userItemVoteDocs.find(function(voteDoc) {
                    return voteDoc.id === items[i].id
                  })

                  if (voteDoc) {
                    items[i].votedOnByUser = true
                    items[i].unvoteExpired = voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                  }
                }

                callback({
                  success: true,
                  items: items,
                  isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
                })
              }).catch(function(promiseError) {
                callback({getDataError: true})
              })
            }
          })
        }
      })
    }
  },
  getRankedItemsByDay: function(day, page, authUser, callback) {
    const isValidDate = utils.isValidDate(day)

    if (!isValidDate) {
      callback({invalidDateError: true})
    } else {
      const startTimestamp = moment(day).startOf("day").unix()
      const endTimestamp = moment(day).endOf("day").unix()

      if (!authUser.userSignedIn) {
        Promise.all([
          ItemModel.find({created: {$gte: startTimestamp, $lte: endTimestamp}, dead: false})
          .sort({points: -1, _id: -1})
          .skip((page - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .lean(),
          ItemModel.countDocuments({created: {$gte: startTimestamp, $lte: endTimestamp}, dead: false}).lean()
        ]).then(function([items, totalItemCount]) {
          for (i=0; i < items.length; i++) {
            items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)
          }

          callback({
            success: true,
            items: items,
            isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
          })
        }).catch(function(promiseError) {
          callback({getDataError: true})
        })
      } else {
        UserHiddenModel.find({username: authUser.username, itemCreationDate: {$gte: startTimestamp, $lte: endTimestamp}})
        .lean()
        .exec(function(hiddenDocsError, hiddenDocs) {
          if (hiddenDocsError) {
            callback({getDataError: true})
          } else {
            let arrayOfHiddenItems = []

            for (let i=0; i < hiddenDocs.length; i++) {
              arrayOfHiddenItems.push(hiddenDocs[i].id)
            }

            let itemsDbQuery = {
              created: {
                $gte: startTimestamp,
                $lte: endTimestamp
              },
              id: {
                $nin: arrayOfHiddenItems
              }
            }

            if (!authUser.showDead) itemsDbQuery.dead = false

            ItemModel.find(itemsDbQuery)
            .sort({points: -1, _id: -1})
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .lean()
            .exec(function(itemsError, items) {
              if (itemsError) {
                callback({getDataError: true})
              } else {
                let arrayOfItemIds = []

                for (let i=0; i < items.length; i++) {
                  arrayOfItemIds.push(items[i].id)
                }

                Promise.all([
                  UserVoteModel.find({username: authUser.username, id: {$in: arrayOfItemIds}, type: "item"}).lean(),
                  ItemModel.countDocuments(itemsDbQuery).lean()
                ]).then(function([userItemVoteDocs, totalItemCount]) {
                  for (let i=0; i < items.length; i++) {
                    items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)

                    if (items[i].by === authUser.username) {
                      const hasEditAndDeleteExpired =
                        items[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                        items[i].commentCount > 0

                      items[i].editAndDeleteExpired = hasEditAndDeleteExpired
                    }

                    const voteDoc = userItemVoteDocs.find(function(voteDoc) {
                      return voteDoc.id === items[i].id
                    })

                    if (voteDoc) {
                      items[i].votedOnByUser = true
                      items[i].unvoteExpired = voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                    }
                  }

                  callback({
                    success: true,
                    items: items,
                    isMore: totalItemCount > (((page - 1) * itemsPerPage) + itemsPerPage) ? true : false
                  })
                }).catch(function(promiseError) {
                  callback({getDataError: true})
                })
              }
            })
          }
        })
      }
    }
  },
  getUserFavoritedItemsByPage: function(username, page, authUser, callback) {
    UserModel.findOne({username: username}).exec(function(userError, user) {
      if (userError) {
        callback({getDataError: true})
      } else if (!user) {
        callback({notFoundError: true})
      } else {
        Promise.all([
          UserFavoriteModel.find({username: username, type: "item"})
          .sort({_id: -1})
          .skip((page - 1) * itemsPerPage)
          .limit(itemsPerPage)
          .lean(),
          UserFavoriteModel.countDocuments({username: username, type: "item"}).lean()
        ]).then(function([userFavoriteItemsDocs, totalFavoriteItemsCount]) {
          let arrayOfItemIds = []

          for (i=0; i < userFavoriteItemsDocs.length; i++) {
            arrayOfItemIds.push(userFavoriteItemsDocs[i].id)
          }

          let itemsDbQuery = {
            id: {
              $in: arrayOfItemIds
            }
          }

          if (!authUser.showDead) itemsDbQuery.dead = false

          // ItemModel.aggregate([
          //   {
          //     $match: itemsDbQuery
          //   },
          //   {
          //     $addFields: {
          //       __order: {
          //         $indexOfArray: [arrayOfItemIds, "$id"]
          //       }
          //     }
          //   },
          //   {
          //     $sort: {
          //       __order: 1
          //     }
          //   }
          // ])
          ItemModel.find(itemsDbQuery)
          .exec(function(itemsError, items) {
            if (itemsError) {
              callback({getDataError: true})
            } else {
              for (i=0; i < items.length; i++) {
                items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)
              }

              if (!authUser.userSignedIn) {
                callback({
                  success: true,
                  items: items,
                  isMore: totalFavoriteItemsCount > (((page -1) * itemsPerPage) + itemsPerPage) ? true : false
                })
              } else {
                UserVoteModel.find({username: authUser.username, id: {$in: arrayOfItemIds}, type: "item"})
                .lean()
                .exec(function(userItemVoteDocsError, userItemVoteDocs) {
                  if (userItemVoteDocsError) {
                    callback({getDataError: true})
                  } else {
                    for (let i=0; i < items.length; i++) {
                      if (items[i].by === authUser.username) {
                        const hasEditAndDeleteExpired =
                          items[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                          items[i].commentCount > 0

                        items[i].editAndDeleteExpired = hasEditAndDeleteExpired
                      }

                      const voteDoc = userItemVoteDocs.find(function(voteDoc) {
                        return voteDoc.id === items[i].id
                      })

                      if (voteDoc) {
                        items[i].votedOnByUser = true
                        items[i].unvoteExpired = voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                      }
                    }

                    callback({
                      success: true,
                      items: items,
                      isMore: totalFavoriteItemsCount > (((page -1) * itemsPerPage) + itemsPerPage) ? true : false
                    })
                  }
                })
              }
            }
          })
        }).catch(function(promiseError) {
          callback({getDataError: true})
        })
      }
    })
  },
  getUserHiddenItemsByPage: function(page, authUser, callback) {
    UserHiddenModel.find({username: authUser.username})
    .sort({_id: -1})
    .skip((page - 1) * itemsPerPage)
    .limit(itemsPerPage)
    .lean()
    .exec(function(hiddenDocsError, hiddenDocs) {
      if (hiddenDocsError) {
        callback({getDataError: true})
      } else if (!hiddenDocs) {
        callback({success: true, items: [], isMore: false})
      } else {
        let arrayOfItemIds = []

        for (i=0; i < hiddenDocs.length; i++) {
          arrayOfItemIds.push(hiddenDocs[i].id)
        }

        let itemsDbQuery = {
          id: {
            $in: arrayOfItemIds
          }
        }

        if (!authUser.showDead) itemsDbQuery.dead = false

        // ItemModel.aggregate([
        //   {
        //     $match: itemsDbQuery
        //   },
        //   {
        //     $addFields: {
        //       __order: {
        //         $indexOfArray: [arrayOfItemIds, "$id"]
        //       }
        //     }
        //   },
        //   {
        //     $sort: {
        //       __order: 1
        //     }
        //   }
        // ])
        ItemModel.find(itemsDbQuery)
        .exec(function(itemsError, items) {
          if (itemsError) {
            callback({getDataError: true})
          } else {
            Promise.all([
              UserVoteModel.find({username: authUser.username, id: {$in: arrayOfItemIds}, type: "item"}).lean(),
              UserHiddenModel.countDocuments({username: authUser.username}).lean()
            ]).then(function([userItemVoteDocs, totalNumOfHiddenItems]) {
              for (let i=0; i < items.length; i++) {
                items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)

                items[i].hiddenByUser = true

                if (items[i].by === authUser.username) {
                  const hasEditAndDeleteExpired =
                    items[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                    items[i].commentCount > 0

                  items[i].editAndDeleteExpired = hasEditAndDeleteExpired
                }

                const voteDoc = userItemVoteDocs.find(function(voteDoc) {
                  return voteDoc.id === items[i].id
                })

                if (voteDoc) {
                  items[i].votedOnByUser = true
                  items[i].unvoteExpired = voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                }
              }

              callback({
                success: true,
                items: items,
                isMore: totalNumOfHiddenItems > (((page -1) * itemsPerPage) + itemsPerPage) ? true : false
              })
            }).catch(function(promiseError) {
              callback({getDataError: true})
            })
          }
        })
      }
    })
  },
  getUserUpvotedItemsByPage: function(page, authUser, callback) {
    Promise.all([
      UserVoteModel.find({username: authUser.username, upvote: true, type: "item"})
      .sort({_id: -1})
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .lean(),
      UserVoteModel.countDocuments({username: authUser.username, upvote: true, type: "item"}).exec()
    ]).then(function([voteDocs, totalItemCount]) {
      let arrayOfItemIds = []

      for (i=0; i < voteDocs.length; i++) {
        arrayOfItemIds.push(voteDocs[i].id)
      }

      let itemsDbQuery = {
        id: {
          $in: arrayOfItemIds
        }
      }

      if (!authUser.showDead) itemsDbQuery.dead = false

      // ItemModel.aggregate([
      //   {
      //     $match: itemsDbQuery
      //   },
      //   {
      //     $addFields: {
      //       __order: {
      //         $indexOfArray: [arrayOfItemIds, "$id"]
      //       }
      //     }
      //   },
      //   {
      //     $sort: {
      //       __order: 1
      //     }
      //   }
      // ])
      ItemModel.find(itemsDbQuery)
      .exec(function(itemsError, items) {
        if (itemsError) {
          callback({getDataError: true})
        } else {
          for (i=0; i < items.length; i++) {
            items[i].rank = ((page - 1) * itemsPerPage) + (i + 1)

            items[i].votedOnByUser = true
            items[i].unvoteExpired = voteDocs[i].date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
          }

          callback({
            success: true,
            items: items,
            isMore: totalItemCount > (((page -1) * itemsPerPage) + itemsPerPage) ? true : false
          })
        }
      })
    }).catch(function(promiseError) {
      callback({getDataError: true})
    })
  },
  updateScoreForItems: function(callback) {
    const startDate = moment().unix() - (86400 * maxAgeOfRankedItemsInDays)

    ItemModel.find({created: {$gt: startDate}, points: {$gt: 1}, dead: false}).exec(function(error, items) {
      if (error) {
        callback({success: false})
      } else {
        items.map(function(item) {
          const ageInHours = ((moment().unix() - item.created) / 3600)

          const gravity = 1.8

          const score = (item.points - 1) / (Math.pow((ageInHours + 2), gravity))

          item.score = score.toFixed(3)

          item.save(function(saveError) {
            if (saveError) {
              callback({success: false})
            }
          })
        })

        callback({success: true})
      }
    })
  }
}
