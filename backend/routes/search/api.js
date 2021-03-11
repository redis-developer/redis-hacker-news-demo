const algoliasearch = require("algoliasearch")

const client = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_PRIVATE_API_KEY)

const index = client.initIndex("submissions")

module.exports = {
  addNewItem: function(item, callback) {
    index.saveObject({
      objectID: item.id,
      type: "item",
      by: item.by,
      title: item.title,
      itemType: item.type,
      url: item.url,
      domain: item.domain,
      text: item.text,
      created: item.created,
      points: item.points,
      commentCount: item.commentCount
    }).then(function() {
      callback({success: true})
    }).catch(function() {
      callback({success: false})
    })
  },
  editItem: function(id, newItemTitle, newItemText, callback) {
    index.partialUpdateObject({
      objectID: id,
      title: newItemTitle,
      text: newItemText
    }).then(function() {
      callback({success: true})
    }).catch(function() {
      callback({success: false})
    })
  },
  deleteItem: function(id, callback) {
    index.deleteObject(id).then(function() {
      callback({success: true})
    }).catch(function() {
      callback({success: false})
    })
  },
  updateItemPointsCount: function(id, newPointsValue, callback) {
    index.partialUpdateObject({
      objectID: id,
      points: newPointsValue
    }).then(function() {
      callback({success: true})
    }).catch(function() {
      callback({success: false})
    })
  },
  addNewComment: function(comment, parentItemId, newCommentCount, callback) {
    index.saveObject({
      objectID: comment.id,
      type: "comment",
      by: comment.by,
      parentItemId: comment.parentItemId,
      parentItemTitle: comment.parentItemTitle,
      isParent: comment.isParent,
      parentCommentId: comment.parentCommentId,
      text: comment.text,
      points: comment.points,
      created: comment.created
    }).then(function() {
      index.partialUpdateObject({
        objectID: parentItemId,
        commentCount: newCommentCount
      }).then(function() {
        callback({success: true})
      }).catch(function() {
        callback({success: false})
      })
    }).catch(function() {
      callback({success: false})
    })
  },
  editComment: function(id, newCommentText, callback) {
    index.partialUpdateObject({
      objectID: id,
      text: newCommentText
    }).then(function() {
      callback({success: true})
    }).catch(function() {
      callback({success: false})
    })
  },
  deleteComment: function(id, parentItemId, newCommentCount, callback) {
    index.deleteObject(id).then(function() {
      index.partialUpdateObject({
        objectID: parentItemId,
        commentCount: newCommentCount
      }).then(function() {
        callback({success: true})
      }).catch(function() {
        callback({success: false})
      })
    }).catch(function() {
      callback({success: false})
    })
  },
  updateCommentPointsValue: function(id, newPointsValue, callback) {
    index.partialUpdateObject({
      objectID: id,
      points: newPointsValue
    }).then(function() {
      callback({success: true})
    }).catch(function() {
      callback({success: false})
    })
  },
  deleteKilledComment: function(id, callback) {
    index.deleteObject(id).then(function() {
      callback({success: true})
    }).catch(function() {
      callback({success: false})
    })
  },
  addUnkilledComment: function(comment, callback) {
    index.saveObject({
      objectID: comment.id,
      type: "comment",
      by: comment.by,
      parentItemId: comment.parentItemId,
      parentItemTitle: comment.parentItemTitle,
      isParent: comment.isParent,
      parentCommentId: comment.parentCommentId,
      text: comment.text,
      points: comment.points,
      created: comment.created
    }).then(function() {
      callback({success: true})
    }).catch(function() {
      callback({success: false})
    })
  }
}
