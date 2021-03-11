const express = require("express")

const api = require("./api.js")

const authUser = require("../../middlewares/index.js").authUser

const app = express.Router()

app.put("/moderation/kill-item", authUser, function(req, res) {
  if (!res.locals.userSignedIn || !res.locals.isModerator) {
    res.json({authError: true})
  } else {
    api.killItem(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.put("/moderation/unkill-item", authUser, function(req, res) {
  if (!res.locals.userSignedIn || !res.locals.isModerator) {
    res.json({authError: true})
  } else {
    api.unkillItem(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.put("/moderation/kill-comment", authUser, function(req, res) {
  if (!res.locals.userSignedIn || !res.locals.isModerator) {
    res.json({authError: true})
  } else {
    api.killComment(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.put("/moderation/unkill-comment", authUser, function(req, res) {
  if (!res.locals.userSignedIn || !res.locals.isModerator) {
    res.json({authError: true})
  } else {
    api.unkillComment(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.put("/moderation/add-user-shadow-ban", authUser, function(req, res) {
  if (!res.locals.userSignedIn || !res.locals.isModerator) {
    res.json({authError: true})
  } else {
    api.addUserShadowBan(req.body.username, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.put("/moderation/remove-user-shadow-ban", authUser, function(req, res) {
  if (!res.locals.userSignedIn || !res.locals.isModerator) {
    res.json({authError: true})
  } else {
    api.removeUserShadowBan(req.body.username, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.get("/moderation/get-shadow-banned-users-by-page", authUser, function(req, res) {
  if (!res.locals.userSignedIn || !res.locals.isModerator) {
    res.json({notAllowedError: true})
  } else if (!req.query.page) {
    res.json({getDataError: true})
  } else {
    api.getShadowBannedUsersByPage(req.query.page, function(response) {
      res.json(response)
    })
  }
})

app.put("/moderation/add-user-ban", authUser, function(req, res) {
  if (!res.locals.userSignedIn || !res.locals.isModerator) {
    res.json({authError: true})
  } else {
    api.addUserBan(req.body.username, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.put("/moderation/remove-user-ban", authUser, function(req, res) {
  if (!res.locals.userSignedIn || !res.locals.isModerator) {
    res.json({authError: true})
  } else {
    api.removeUserBan(req.body.username, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.get("/moderation/get-banned-users-by-page", authUser, function(req, res) {
  if (!res.locals.userSignedIn || !res.locals.isModerator) {
    res.json({notAllowedError: true})
  } else if (!req.query.page) {
    res.json({getDataError: true})
  } else {
    api.getBannedUsersByPage(req.query.page, function(response) {
      res.json(response)
    })
  }
})

app.get("/moderation/get-moderation-logs-by-page", authUser, function(req, res) {
  if (!res.locals.userSignedIn || !res.locals.isModerator) {
    res.json({notAllowedError: true})
  } else if (!req.query.category || !req.query.page) {
    res.json({getDataError: true})
  } else {
    api.getModerationLogsByPage(req.query.category, req.query.page, function(response) {
      res.json(response)
    })
  }
})

module.exports = app
