const express = require("express")
const cron = require("node-cron")

const api = require("./api.js")

const authUser = require("../../middlewares/index.js").authUser

const app = express.Router()

cron.schedule("*/10 * * * *", function() {
  api.updateScoreForItems(function(response) {
  })
})

app.post("/items/submit-new-item", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.title) {
    res.json({titleRequiredError: true})
  } else if (req.body.title.length > 80) {
    res.json({titleTooLongError: true})
  } else if (req.body.url && req.body.text) {
    res.json({urlAndTextError: true})
  } else if (req.body.text.length > 5000) {
    res.json({textTooLongError: true})
  } else {
    api.submitNewItem(req.body.title, req.body.url, req.body.text, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.get("/items/get-item-by-id", authUser, function(req, res) {
  if (!req.query.id) {
    res.json({notFoundError: true, authUser: res.locals})
  } else if (!req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getItemById(req.query.id, req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.post("/items/upvote-item", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.id) {
    res.json({submitError: true})
  } else {
    api.upvoteItem(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.put("/items/unvote-item", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.id) {
    res.json({submitError: true})
  } else {
    api.unvoteItem(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.post("/items/favorite-item", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.id) {
    res.json({submitError: true})
  } else {
    api.favoriteItem(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.put("/items/unfavorite-item", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.id) {
    res.json({submitError: true})
  } else {
    api.unfavoriteItem(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.post("/items/hide-item", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.id) {
    res.json({submitError: true})
  } else {
    api.hideItem(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.put("/items/unhide-item", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.id) {
    res.json({submitError: true})
  } else {
    api.unhideItem(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.get("/items/get-edit-item-page-data", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({notAllowedError: true, authUser: res.locals})
  } else if (!req.query.id) {
    res.json({notFoundError: true, authUser: res.locals})
  } else {
    api.getEditItemPageData(req.query.id, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.put("/items/edit-item", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.body.id || !req.body.newItemTitle) {
    res.json({submitError: true})
  } else if (req.body.newItemTitle.length > 80) {
    res.json({titleTooLongError: true})
  } else if (req.body.newItemText.length > 5000) {
    res.json({textTooLongError: true})
  } else {
    api.editItem(req.body.id, req.body.newItemTitle, req.body.newItemText, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.get("/items/get-delete-item-page-data", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({notAllowedError: true, authUser: res.locals})
  } else if (!req.query.id) {
    res.json({notFoundError: true, authUser: res.locals})
  } else {
    api.getDeleteItemPageData(req.query.id, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.put("/items/delete-item", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({notAllowedError: true})
  } else if (!req.body.id) {
    res.json({submitError: true})
  } else {
    api.deleteItem(req.body.id, res.locals, function(response) {
      res.json(response)
    })
  }
})

app.get("/items/get-ranked-items-by-page", authUser, function(req, res) {
  if (!req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getRankedItemsByPage(req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/items/search-items-by-page", authUser, function(req, res) {
  if (!req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.searchItemsByPage(req.query.page, req.query.query, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/items/get-newest-items-by-page", authUser, function(req, res) {
  if (!req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getNewestItemsByPage(req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/items/get-ranked-show-items-by-page", authUser, function(req, res) {
  if (!req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getRankedShowItemsByPage(req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/items/get-newest-show-items-by-page", authUser, function(req, res) {
  if (!req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getNewestShowItemsByPage(req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/items/get-ranked-ask-items-by-page", authUser, function(req, res) {
  if (!req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getRankedAskItemsByPage(req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/items/get-items-by-site-domain", authUser, function(req, res) {
  if (!req.query.domain || !req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getItemsBySiteDomain(req.query.domain, req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/items/get-items-submitted-by-user", authUser, function(req, res) {
  if (!req.query.userId || !req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getItemsSubmittedByUser(req.query.userId, req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/items/get-ranked-items-by-day", authUser, function(req, res) {
  if (!req.query.day || !req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getRankedItemsByDay(req.query.day, req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/items/get-user-favorited-items-by-page", authUser, function(req, res) {
  if (!req.query.userId || !req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getUserFavoritedItemsByPage(req.query.userId, req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/items/get-user-hidden-items-by-page", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else if (!req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else {
    api.getUserHiddenItemsByPage(req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

app.get("/items/get-user-upvoted-items-by-page", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({notAllowedError: true, authUser: res.locals})
  } else if (!req.query.userId || !req.query.page) {
    res.json({getDataError: true, authUser: res.locals})
  } else if (req.query.userId !== res.locals.username) {
    res.json({notAllowedError: true, authUser: res.locals})
  } else {
    api.getUserUpvotedItemsByPage(req.query.page, res.locals, function(response) {
      response.authUser = res.locals
      res.json(response)
    })
  }
})

module.exports = app
