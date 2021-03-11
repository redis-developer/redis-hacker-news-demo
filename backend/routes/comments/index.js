const express = require("express")

const api = require("./api.js")

const authUser = require("../../middlewares/index.js").authUser

const app = express.Router()

app.post("/comments/add-new-comment", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.commentData.text) {
    res.json({textRequiredError: true})
  } else if (req.body.commentData.text.length > 5000) {
    res.json({textTooLongError: true})
  } else {
    api.addNewComment(req.body.commentData, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.get("/comments/get-comment-by-id", authUser, function(req, res) {
  if (!req.query.id) {
    res.json({notFoundError: true, authUser: res.locals})
  } else if (!req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getCommentById(req.query.id, req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.post("/comments/upvote-comment", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.id || !req.body.parentItemId) {
    res.json({submitError: true})
  } else {
    api.upvoteComment(req.body.id, req.body.parentItemId, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.post("/comments/downvote-comment", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.id || !req.body.parentItemId) {
    res.json({submitError: true})
  } else if (!res.locals.showDownvote) {
    res.json({submitError: true})
  } else {
    api.downvoteComment(req.body.id, req.body.parentItemId, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.put("/comments/unvote-comment", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.id) {
    res.json({submitError: true})
  } else {
    api.unvoteComment(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.post("/comments/favorite-comment", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.id) {
    res.json({submitError: true})
  } else {
    api.favoriteComment(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.put("/comments/unfavorite-comment", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.id) {
    res.json({submitError: true})
  } else {
    api.unfavoriteComment(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.get("/comments/get-edit-comment-page-data", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({notAllowedError: true, authUser: res.locals})
  } else if (!req.query.id) {
    res.json({notFoundError: true, authUser: res.locals})
  } else {
    api.getEditCommentPageData(req.query.id, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.put("/comments/edit-comment", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.id) {
    res.json({submitError: true})
  } else if (!req.body.newCommentText) {
    res.json({textRequiredError: true})
  } else if (req.body.newCommentText.length > 5000) {
    res.json({textTooLongError: true})
  } else {
    api.editComment(req.body.id, req.body.newCommentText, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/comments/get-delete-comment-page-data", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({notAllowedError: true, authUser: res.locals})
  } else if (!req.query.id) {
    res.json({notFoundError: true, authUser: res.locals})
  } else {
    api.getDeleteCommentPageData(req.query.id, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.put("/comments/delete-comment", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({notAllowedError: true})
  } else if (!req.body.id) {
    res.json({submitError: true})
  } else {
    api.deleteComment(req.body.id, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/comments/get-reply-page-data", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true, authUser: res.locals})
  } else if (!req.query.id) {
    res.json({notFoundError: true, authUser: res.locals})
  } else {
    api.getReplyPageData(req.query.id, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/comments/get-newest-comments-by-page", authUser, function(req, res) {
  if (!req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getNewestCommentsByPage(req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/comments/get-user-comments-by-page", authUser, function(req, res) {
  if (!req.query.userId || !req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getUserCommentsByPage(req.query.userId, req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/comments/get-user-favorited-comments-by-page", authUser, function(req, res) {
  if (!req.query.userId || !req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getUserFavoritedCommentsByPage(req.query.userId, req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/comments/get-user-upvoted-comments-by-page", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({notAllowedError: true, authUser: res.locals})
  } else if (!req.query.userId || !req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else if (req.query.userId !== res.locals.username) {
    res.json({notAllowedError: true, authUser: res.locals})
  } else {
    api.getUserUpvotedCommentsByPage(req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

module.exports = app
