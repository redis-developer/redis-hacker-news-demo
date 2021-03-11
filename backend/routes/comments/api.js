const linkifyUrls = require("linkify-urls")
const xss = require("xss")
const moment = require("moment")

const utils = require("../utils.js")

const config = require("../../config.js")

const searchApi = require("../search/api.js")

const CommentModel = require("../../models/comment.js")
const UserModel = require("../../models/user.js")
const ItemModel = require("../../models/item.js")
const UserVoteModel = require("../../models/userVote.js")
const UserFavoriteModel = require("../../models/userFavorite.js")

const commentsPerPage = config.commentsPerPage

module.exports = {
  addNewComment: function(commentData, authUser, callback) {
    console.log(commentData)
    ItemModel.findOne({id: commentData.parentItemId}).lean().exec(function(itemError, item) {
      console.log(item)
      if (itemError || !item) {
        callback({submitError: true})
      } else {
        commentData.text = commentData.text.trim()
        commentData.text = commentData.text.replace(/<[^>]+>/g, "")
        commentData.text = commentData.text.replace(/\*([^*]+)\*/g, "<i>$1</i>")
        commentData.text = linkifyUrls(commentData.text)
        commentData.text = xss(commentData.text)

        const newComment = new CommentModel({
          id: utils.generateUniqueId(12),
          by: authUser.username,
          parentItemId: commentData.parentItemId,
          parentItemTitle: item.title,
          isParent: commentData.isParent,
          parentCommentId: commentData.parentCommentId,
          text: commentData.text,
          points: 1,
          created: moment().unix(),
          dead: authUser.shadowBanned ? true : false
        })

        newComment.save(function(commentSaveError, newCommentDoc) {
          if (commentSaveError) {
            callback({submitError: true})
          } else {
            const promises = [
              UserModel.findOneAndUpdate(
                {username: authUser.username},
                {$inc: {karma: 1}}
              ).lean(),
              ItemModel.findOneAndUpdate(
                {id: commentData.parentItemId},
                {$inc: {commentCount: 1}}
              ).lean()
            ]

            if (!commentData.isParent) {
              const commentRefPromise = CommentModel.findOneAndUpdate(
                {id: commentData.parentCommentId},
                {$push: {children: newCommentDoc._id}}
              ).lean()

              promises.push(commentRefPromise)
            }

            Promise.all(promises).then(function() {
              if (authUser.shadowBanned) {
                callback({success: true})
              } else {
                searchApi.addNewComment(newCommentDoc, item.id, item.commentCount + 1, function() {
                  callback({success: true})
                })
              }
            }).catch(function(promiseError) {
              callback({submitError: true})
            })
          }
        })
      }
    })
  },
  getCommentById: function(commentId, page, authUser, callback) {
    CommentModel.findOne({id: commentId}, null, {getChildrenComments: true, showDeadComments: authUser.showDead})
    .lean()
    .exec(function(commentError, comment) {
      if (commentError) {
        callback({getDataError: true})
      } else if (!comment) {
        callback({notFoundError: true})
      } else {
        comment.pageMetadataTitle = comment.text.replace(/<[^>]+>/g, "")

        comment.children.sort(function(a, b) {
          if (a.points > b.points) return -1
          if (a.points < b.points) return 1

          if (a.created > b.created) return -1
          if (a.created < b.created) return 1
        })

        const totalNumOfChildrenComments = comment.children.length

        comment.children = comment.children.slice((page - 1) * commentsPerPage, page * commentsPerPage)

        if (!authUser.userSignedIn) {
          callback({
            success: true,
            comment: comment,
            isMoreChildrenComments: totalNumOfChildrenComments > (((page - 1) * commentsPerPage) + commentsPerPage) ? true : false
          })
        } else {
          Promise.all([
            UserVoteModel.findOne({username: authUser.username, id: commentId, type: "comment"}).lean(),
            UserFavoriteModel.findOne({username: authUser.username, id: commentId, type: "comment"}).lean(),
            UserVoteModel.find({username: authUser.username, type: "comment", parentItemId: comment.parentItemId}).lean()
          ]).then(function([commentVoteDoc, commentFavoriteDoc, commentVotesByUserDocs]) {
            comment.votedOnByUser = commentVoteDoc ? true : false
            comment.unvoteExpired =  commentVoteDoc && commentVoteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix()
            comment.favoritedByUser = commentFavoriteDoc ? true : false

            if (comment.by === authUser.username) {
              const hasEditAndDeleteExpired =
                comment.created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                comment.children.length > 0

              comment.editAndDeleteExpired = hasEditAndDeleteExpired
            }

            let userCommentVotes = []

            for (let i=0; i < commentVotesByUserDocs.length; i++) {
              userCommentVotes.push(commentVotesByUserDocs[i].id)
            }

            const updateComment = function(parentComment) {
              if (parentComment.by === authUser.username) {
                const hasEditAndDeleteExpired =
                  parentComment.created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                  parentComment.children.length > 0

                parentComment.editAndDeleteExpired = hasEditAndDeleteExpired
              }

              if (userCommentVotes.includes(parentComment.id)) {
                parentComment.votedOnByUser = true

                for (let i=0; i < commentVotesByUserDocs.length; i++) {
                  if (parentComment.id === commentVotesByUserDocs[i].id) {
                    parentComment.unvoteExpired = commentVotesByUserDocs[i].date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                  }
                }
              }

              if (parentComment.children) {
                for (let i=0; i < parentComment.children.length; i++) {
                  updateComment(parentComment.children[i])
                }
              }
            }

            for (let i=0; i < comment.children.length; i++) {
              updateComment(comment.children[i])
            }

            callback({
              success: true,
              comment: comment,
              isMoreChildrenComments: totalNumOfChildrenComments > (((page - 1) * commentsPerPage) + commentsPerPage) ? true : false
            })
          }).catch(function(promiseError) {
            callback({getDataError: true})
          })
        }
      }
    })
  },
  upvoteComment: function(commentId, parentItemId, authUser, callback) {
    Promise.all([
      CommentModel.findOne({id: commentId}),
      UserVoteModel.findOne({username: authUser.username, id: commentId, type: "comment"}).lean()
    ]).then(function([comment, voteDoc]) {
      if (!comment || comment.by === authUser.username || comment.dead) {
        callback({submitError: true})
      } else if (voteDoc) {
        callback({submitError: true})
      } else {
        const newUserVoteDoc = new UserVoteModel({
          username: authUser.username,
          type: "comment",
          id: commentId,
          parentItemId: parentItemId,
          upvote: true,
          downvote: false,
          date: moment().unix()
        })

        newUserVoteDoc.save(function(saveVoteDocError) {
          if (saveVoteDocError) {
            callback({submitError: true})
          } else {
            comment.points = comment.points + 1

            comment.save(function(saveCommentDocError) {
              if (saveCommentDocError) {
                callback({submitError: true})
              } else {
                UserModel.findOneAndUpdate({username: comment.by}, {$inc: {karma: 1}}).lean().exec(function(userError) {
                  if (userError) {
                    callback({submitError: true})
                  } else {
                    searchApi.updateCommentPointsValue(comment.id, comment.points, function() {
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
  downvoteComment: function(commentId, parentItemId, authUser, callback) {
    Promise.all([
      CommentModel.findOne({id: commentId}),
      UserVoteModel.findOne({username: authUser.username, id: commentId, type: "comment"}).lean()
    ]).then(function([comment, voteDoc]) {
      if (!comment || comment.by === authUser.username || comment.dead) {
        callback({submitError: true})
      } else if (voteDoc) {
        callback({submitError: true})
      } else {
        const newUserVoteDoc = new UserVoteModel({
          username: authUser.username,
          type: "comment",
          id: commentId,
          parentItemId: parentItemId,
          upvote: false,
          downvote: true,
          date: moment().unix()
        })

        newUserVoteDoc.save(function(saveVoteDocError) {
          if (saveVoteDocError) {
            callback({submitError: true})
          } else {
            comment.points = comment.points - 1

            comment.save(function(saveCommentDocError) {
              if (saveCommentDocError) {
                callback({submitError: true})
              } else {
                UserModel.findOneAndUpdate({username: comment.by}, {$inc: {karma: -1}})
                .lean()
                .exec(function(userError) {
                  if (userError) {
                    callback({submitError: true})
                  } else {
                    searchApi.updateCommentPointsValue(comment.id, comment.points, function() {
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
  unvoteComment: function(commentId, authUser, callback) {
    Promise.all([
      CommentModel.findOne({id: commentId}),
      UserVoteModel.findOne({username: authUser.username, id: commentId, type: "comment"})
    ]).then(function([comment, voteDoc]) {
      if (!comment || comment.by === authUser.username || comment.dead) {
        callback({submitError: true})
      } else if (!voteDoc || voteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix()) {
        callback({submitError: true})
      } else {
        voteDoc.remove(function(removeError) {
          if (removeError) {
            callback({submitError: true})
          } else {
            comment.points = voteDoc.upvote ? comment.points - 1 : comment.points + 1

            comment.save(function(commentSaveError) {
              if (commentSaveError) {
                callback({submitError: true})
              } else {
                UserModel.findOneAndUpdate({username: comment.by}, {$inc: {karma: voteDoc.upvote ? -1 : 1}})
                .lean()
                .exec(function(userError, user) {
                  if (userError || !user) {
                    callback({submitError: true})
                  } else {
                    searchApi.updateCommentPointsValue(comment.id, comment.points, function() {
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
  favoriteComment: function(commentId, authUser, callback) {
    Promise.all([
      CommentModel.findOne({id: commentId}).lean(),
      UserFavoriteModel.findOne({username: authUser.username, id: commentId, type: "comment"}).lean()
    ]).then(function([comment, favorite]) {
      if (!comment || favorite) {
        callback({submitError: true})
      } else {
        const newFavoriteDoc = new UserFavoriteModel({
          username: authUser.username,
          type: "comment",
          id: commentId,
          date: moment().unix()
        })

        newFavoriteDoc.save(function(newDocError) {
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
  unfavoriteComment: function(commentId, authUser, callback) {
    UserFavoriteModel.findOneAndRemove({username: authUser.username, id: commentId}).lean().exec(function(removeError) {
      if (removeError) {
        callback({submitError: false})
      } else {
        callback({success: true})
      }
    })
  },
  getEditCommentPageData: function(commentId, authUser, callback) {
    CommentModel.findOne({id: commentId}).lean().exec(function(error, comment) {
      if (error) {
        callback({getDataError: true})
      } else if (!comment) {
        callback({notFoundError: true})
      } else if (comment.dead) {
        callback({notAllowedError: true})
      } else if (comment.by !== authUser.username) {
        callback({notAllowedError: true})
      } else if (comment.created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix()) {
        callback({notAllowedError: true})
      } else if (comment.children.length > 0) {
        callback({notAllowedError: true})
      } else {
        comment.textForEditing = comment.text
          .replace(/<a\b[^>]*>/g, "").replace(/<\/a>/g, "")
          .replace(/<i\b[^>]*>/g,"*").replace(/<\/i>/g, "*")

        callback({success: true, comment: comment})
      }
    })
  },
  editComment: function(commentId, newCommentText, authUser, callback) {
    CommentModel.findOne({id: commentId}).exec(function(commentError, comment) {
      if (commentError) {
        callback({submitError: true})
      } else if (!comment) {
        callback({notFoundError: true})
      } else if (comment.dead) {
        callback({notAllowedError: true})
      } else if (comment.by !== authUser.username) {
        callback({notAllowedError: true})
      } else if (comment.created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix()) {
        callback({notAllowedError: true})
      } else if (comment.children.length > 0) {
        callback({notAllowedError: true})
      } else {
        newCommentText = newCommentText.trim()
        newCommentText = newCommentText.replace(/<[^>]+>/g, "")
        newCommentText = newCommentText.replace(/\*([^*]+)\*/g, "<i>$1</i>")
        newCommentText = linkifyUrls(newCommentText)
        newCommentText = xss(newCommentText)

        comment.text = newCommentText

        comment.save(function(saveError) {
          if (saveError) {
            callback({submitError: true})
          } else {
            searchApi.editComment(comment.id, newCommentText, function() {
              callback({success: true})
            })
          }
        })
      }
    })
  },
  getDeleteCommentPageData: function(commentId, authUser, callback) {
    CommentModel.findOne({id: commentId}).lean().exec(function(error, comment) {
      if (error) {
        callback({getDataError: true})
      } else if (!comment) {
        callback({notFoundError: true})
      } else if (comment.dead) {
        callback({notAllowedError: true})
      } else if (comment.by !== authUser.username) {
        callback({notAllowedError: true})
      } else if (comment.created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix()) {
        callback({notAllowedError: true})
      } else if (comment.children.length > 0) {
        callback({notAllowedError: true})
      } else {
        callback({success: true, comment: comment})
      }
    })
  },
  deleteComment: function(commentId, authUser, callback) {
    CommentModel.findOne({id: commentId}).exec(function(commentError, comment) {
      if (commentError) {
        callback({submitError: true})
      } else if (!comment) {
        callback({submitError: true})
      } else if (comment.dead) {
        callback({notAllowedError: true})
      } else if (comment.by !== authUser.username) {
        callback({notAllowedError: true})
      } else if (comment.created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix()) {
        callback({notAllowedError: true})
      } else if (comment.children.length > 0) {
        callback({notAllowedError: true})
      } else {
        comment.remove(function(removeError) {
          if (removeError) {
            callback({submitError: true})
          } else {
            const newUserKarmaValue = authUser.karma - comment.points

            let promises = [
              ItemModel.findOneAndUpdate({id: comment.parentItemId}, {$inc: { commentCount: -1}}).lean(),
              UserModel.findOneAndUpdate({username: authUser.username}, {karma: newUserKarmaValue}).lean()
            ]

            if (!comment.isParent) {
              promises.push(CommentModel.findOneAndUpdate({id: comment.parentCommentId}, {$pullAll: {children: [comment._id]}}).lean())
            }

            Promise.all(promises).then(function([item, updateUserKarma, updateCommentChildrenArray]) {
              searchApi.deleteComment(comment.id, item.id, item.commentCount - 1, function() {
                callback({success: true})
              })
            }).catch(function(promiseError) {
              callback({submitError: true})
            })
          }
        })
      }
    })
  },
  getReplyPageData: function(commentId, authUser, callback) {
    CommentModel.findOne({id: commentId}).lean().exec(function(commentError, comment) {
      if (commentError) {
        callback({getDataError: true})
      } else if (!comment) {
        callback({notFoundError: true})
      } else {
        if (comment.by === authUser.username) {
          const hasEditAndDeleteExpired =
            comment.created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
            comment.children.length > 0

          comment.editAndDeleteExpired = hasEditAndDeleteExpired
        }

        UserVoteModel.findOne({username: authUser.username, id: commentId, type: "comment"})
        .lean()
        .exec(function(commentVoteDocError, commentVoteDoc) {
          if (commentVoteDocError) {
            callback({getDataError: true})
          } else {
            comment.votedOnByUser = commentVoteDoc ? true : false
            comment.unvoteExpired =  commentVoteDoc && commentVoteDoc.date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix()

            callback({success: true, comment: comment})
          }
        })
      }
    })
  },
  getNewestCommentsByPage: function(page, authUser, callback) {
    let commentsDbQuery = {}

    if (!authUser.showDead) commentsDbQuery.dead = false

    Promise.all([
      CommentModel.find(commentsDbQuery)
      .sort({_id: -1})
      .skip((page -1) * commentsPerPage)
      .limit(commentsPerPage)
      .lean(),
      CommentModel.countDocuments(commentsDbQuery).lean()
    ]).then(function([comments, totalCommentsCount]) {
      if (!authUser.userSignedIn) {
        callback({
          success: true,
          comments: comments,
          isMore: totalCommentsCount > (((page -1) * commentsPerPage) + commentsPerPage) ? true : false
        })
      } else {
        let arrayOfCommentIds = []

        for (let i=0; i < comments.length; i++) {
          if (comments[i].by !== authUser.username) arrayOfCommentIds.push(comments[i].id)

          if (comments[i].by === authUser.username) {
            const hasEditAndDeleteExpired =
              comments[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
              comments[i].children.length > 0

            comments[i].editAndDeleteExpired = hasEditAndDeleteExpired
          }
        }

        UserVoteModel.find({username: authUser.username, id: {$in: arrayOfCommentIds}, type: "comment"})
        .lean()
        .exec(function(voteDocsError, voteDocs) {
          if (voteDocsError) {voteDocs
            callback({getDataError: true})
          } else {
            for (let i=0; i < voteDocs.length; i++) {
              const commentObj = comments.find(function(comment) {
                return comment.id === voteDocs[i].id
              })

              if (commentObj) {
                commentObj.votedOnByUser = true
                commentObj.unvoteExpired = voteDocs[i].date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
              }
            }

            callback({
              success: true,
              comments: comments,
              isMore: totalCommentsCount > (((page -1) * commentsPerPage) + commentsPerPage) ? true : false
            })
          }
        })
      }
    }).catch(function(promiseError) {
      callback({getDataError: true})
    })
  },
  getUserCommentsByPage: function(userId, page, authUser, callback) {
    UserModel.findOne({username: userId}).exec(function(userError, user) {
      if (userError) {
        callback({getDataError: true})
      } else if (!user) {
        callback({notFoundError: true})
      } else {
        let commentsDbQuery = {
          by: userId
        }

        if (!authUser.showDead) commentsDbQuery.dead = false

        Promise.all([
          CommentModel.find(commentsDbQuery)
          .sort({_id: -1})
          .skip((page - 1) * commentsPerPage)
          .limit(commentsPerPage)
          .lean(),
          CommentModel.countDocuments(commentsDbQuery).lean()
        ]).then(function([comments, totalCommentsCount]) {
          if (!authUser.userSignedIn) {
            callback({
              success: true,
              comments: comments,
              isMore: totalCommentsCount > (((page -1) * commentsPerPage) + commentsPerPage) ? true : false
            })
          } else {
            let arrayOfCommentIds = []

            for (let i=0; i < comments.length; i++) {
              if (comments[i].by !== authUser.username) arrayOfCommentIds.push(comments[i].id)

              if (comments[i].by === authUser.username) {
                const hasEditAndDeleteExpired =
                  comments[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                  comments[i].children.length > 0

                comments[i].editAndDeleteExpired = hasEditAndDeleteExpired
              }
            }

            UserVoteModel.find({username: authUser.username, id: {$in: arrayOfCommentIds}, type: "comment"})
            .lean()
            .exec(function(voteDocsError, voteDocs) {
              if (voteDocsError) {voteDocs
                callback({getDataError: true})
              } else {
                for (let i=0; i < voteDocs.length; i++) {
                  const commentObj = comments.find(function(comment) {
                    return comment.id === voteDocs[i].id
                  })

                  if (commentObj) {
                    commentObj.votedOnByUser = true
                    commentObj.unvoteExpired = voteDocs[i].date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                  }
                }

                callback({
                  success: true,
                  comments: comments,
                  isMore: totalCommentsCount > (((page -1) * commentsPerPage) + commentsPerPage) ? true : false
                })
              }
            })
          }
        }).catch(function(promiseError) {
          callback({getDataError: true})
        })
      }
    })
  },
  getUserFavoritedCommentsByPage: function(userId, page, authUser, callback) {
    UserModel.findOne({username: userId}).exec(function(userError, user) {
      if (userError) {
        callback({getDataError: true})
      } else if (!user) {
        callback({notFoundError: true})
      } else {
        Promise.all([
          UserFavoriteModel.find({username: userId, type: "comment"})
          .sort({_id: -1})
          .skip((page - 1) * commentsPerPage)
          .limit(commentsPerPage)
          .lean(),
          UserFavoriteModel.countDocuments({username: userId, type: "comment"}).lean()
        ]).then(function([userFavoriteCommentsDocs, totalFavoriteCommentsCount]) {
          let arrayOfCommentIds = []

          for (i=0; i < userFavoriteCommentsDocs.length; i++) {
            arrayOfCommentIds.push(userFavoriteCommentsDocs[i].id)
          }

          let commentsDbQuery = {
            id: {
              $in: arrayOfCommentIds
            }
          }

          if (!authUser.showDead) commentsDbQuery.dead = false

          // TODO: aggregate
          // CommentModel.aggregate([
          //   {
          //     $match: commentsDbQuery
          //   },
          //   {
          //     $addFields: {
          //       __order: {
          //         $indexOfArray: [arrayOfCommentIds, "$id"]
          //       }
          //     }
          //   },
          //   {
          //     $sort: {
          //       __order: 1
          //     }
          //   }
          // ])
          CommentModel.find(commentsDbQuery)
          .exec(function(commentsError, comments) {
            if (commentsError) {
              callback({getDataError: true})
            } else {
              if (!authUser.userSignedIn) {
                callback({
                  success: true,
                  comments: comments,
                  isMore: totalFavoriteCommentsCount > (((page -1) * commentsPerPage) + commentsPerPage) ? true : false
                })
              } else {
                UserVoteModel.find({username: authUser.username, id: {$in: arrayOfCommentIds}, type: "comment"})
                .lean()
                .exec(function(voteDocsError, userCommentVoteDocs) {
                  if (voteDocsError) {
                    callback({getDataError: true})
                  } else {
                    for (let i=0; i < comments.length; i++) {
                      if (comments[i].by === authUser.username) {
                        const hasEditAndDeleteExpired =
                          comments[i].created + (3600 * config.hrsUntilEditAndDeleteExpires) < moment().unix() ||
                          comments[i].children.length > 0

                        comments[i].editAndDeleteExpired = hasEditAndDeleteExpired
                      }
                    }

                    for (let i=0; i < userCommentVoteDocs.length; i++) {
                      const commentObj = comments.find(function(comment) {
                        return comment.id === userCommentVoteDocs[i].id
                      })

                      if (commentObj) {
                        commentObj.votedOnByUser = true
                        commentObj.unvoteExpired = userCommentVoteDocs[i].date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
                      }
                    }

                    callback({
                      success: true,
                      comments: comments,
                      isMore: totalFavoriteCommentsCount > (((page -1) * commentsPerPage) + commentsPerPage) ? true : false
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
  getUserUpvotedCommentsByPage: function(page, authUser, callback) {
    Promise.all([
      UserVoteModel.find({username: authUser.username, upvote: true, type: "comment"})
      .sort({date: -1})
      .skip((page - 1) * commentsPerPage)
      .limit(commentsPerPage)
      .lean(),
      UserVoteModel.countDocuments({username: authUser.username, upvote: true, type: "comment"}).lean()
    ]).then(function([voteDocs, totalUpvotedCommentsCount]) {
      let arrayOfCommentIds = []

      for (i=0; i < voteDocs.length; i++) {
        arrayOfCommentIds.push(voteDocs[i].id)
      }

      let commentsDbQuery = {
        id: {
          $in: arrayOfCommentIds
        }
      }

      if (!authUser.showDead) commentsDbQuery.dead = false

      // CommentModel.aggregate([
      //   {
      //     $match: commentsDbQuery
      //   },
      //   {
      //     $addFields: {
      //       __order: {
      //         $indexOfArray: [arrayOfCommentIds, "$id"]
      //     }
      //     }
      //   },
      //   {
      //     $sort: {
      //       __order: 1
      //     }
      //   }
      // ])
      CommentModel.find(commentsDbQuery)
      .exec(function(commentsError, comments) {
        if (commentsError) {
          callback({getDataError: true})
        } else {
          for (let i=0; i < voteDocs.length; i++) {
            const commentObj = comments.find(function(comment) {
              return comment.id === voteDocs[i].id
            })

            if (commentObj) {
              commentObj.votedOnByUser = true
              commentObj.unvoteExpired = voteDocs[i].date + (3600 * config.hrsUntilUnvoteExpires) < moment().unix() ? true : false
            }
          }

          callback({
            success: true,
            comments: comments,
            isMore: totalUpvotedCommentsCount > (((page -1) * commentsPerPage) + commentsPerPage) ? true : false
          })
        }
      })
    }).catch(function(promiseError) {
      callback({getDataError: true})
    })
  }
}
