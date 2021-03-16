const express = require("express")

const api = require("./api.js")

const utils = require("../utils.js")

const config = require("../../config.js")

const authUser = require("../../middlewares/index.js").authUser

const app = express.Router()

app.post("/users/create-new-user", function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({submitError: true})
  } else {
    api.createNewUser(req.body.username, req.body.password, function(response) {
      if (!response.success) {
        res.json(response)
      } else {
        const cookieSettings = {
          path: "/",
          expires: new Date(response.authTokenExpirationTimestamp * 1000),
          httpOnly: true,
          encode: String,
          secure: process.env.NODE_ENV === "production",
          domain: process.env.NODE_ENV === "development" ? "" : utils.getDomainFromUrl(config.productionWebsiteURL)
        }

        res.cookie("user", response.username + "&" + response.authToken, cookieSettings)

        res.json({success: true})
      }
    })
  }
})

app.put("/users/login", function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({submitError: true})
  } else {
    api.loginUser(req.body.username, req.body.password, function(response) {
      if (!response.success) {
        res.json(response)
      } else {
        const cookieSettings = {
          path: "/",
          expires: new Date(response.authTokenExpirationTimestamp * 1000),
          httpOnly: true,
          encode: String,
          secure: process.env.NODE_ENV === "production",
          domain: process.env.NODE_ENV === "development" ? "" : utils.getDomainFromUrl(config.productionWebsiteURL)
        }

        res.cookie("user", response.username + "&" + response.authToken, cookieSettings)

        console.log(cookieSettings)
        res.json({success: true})
      }
    })
  }
})

app.get("/users/authenticate", authUser, function(req, res) {
  if (!res.locals.userSignedIn) {
    res.json({success: false, authUser: res.locals})
  } else {
    res.json({success: true, authUser: res.locals})
  }
})

app.put("/users/logout", authUser, function(req, res) {
  const cookieSettings = {
    path: "/",
    domain: process.env.NODE_ENV === "development" ? "" : utils.getDomainFromUrl(config.productionWebsiteURL)
  }

  res.clearCookie("user", cookieSettings)

  if (!res.locals.userSignedIn) {
    res.json({success: false})
  } else {
    api.removeUserAuthData(res.locals, function(response) {
      res.json(response)
    })
  }
})

app.put("/users/remove-user-cookie-data", function(req, res) {
  const cookieSettings = {
    path: "/",
    domain: process.env.NODE_ENV === "development" ? "" : utils.getDomainFromUrl(config.productionWebsiteURL)
  }

  res.clearCookie("user", cookieSettings)

  res.json({success: true})
})

app.put("/users/request-password-reset-link", function(req, res) {
  if (!req.body.username) {
    res.json({submitError: true})
  } else {
    api.requestPasswordResetLink(req.body.username, function(response) {
      res.json(response)
    })
  }
})

app.put("/users/reset-password", function(req, res) {
  if (!req.body.username || !req.body.newPassword || !req.body.resetToken) {
    res.json({submitError: true})
  } else {
    api.resetPassword(req.body.username, req.body.newPassword, req.body.resetToken, function(response) {
      res.json(response)
    })
  }
})

app.get("/users/get-user-data", authUser, function(req, res) {
  if (!req.query.username) {
    res.json({notFoundError: true, authUser: res.locals})
  } else if (!res.locals.userSignedIn || res.locals.username !== req.query.username) {
    api.getPublicUserData(req.query.username, res.locals, function(response) {
      response.authUser = res.locals
      response.showPrivateUserData = false

      res.json(response)
    })
  } else {
    api.getPrivateUserData(req.query.username, function(response) {
      response.authUser = res.locals
      response.showPrivateUserData = true

      res.json(response)
    })
  }
})

app.put("/users/update-user-data", authUser, function(req, res) {
  if (!req.body.inputData) {
    res.json({submitError: true})
  } else if (!res.locals.userSignedIn) {
    res.json({submitError: true})
  } else {
    api.updateUserData(res.locals.username, req.body.inputData, function(response) {
      res.json(response)
    })
  }
})

app.put("/users/change-password", authUser, function(req, res) {
  if (!req.body.currentPassword || !req.body.newPassword) {
    res.json({submitError: true})
  } else if (!res.locals.userSignedIn) {
    res.json({authError: true})
  } else {
    api.changePassword(res.locals.username, req.body.currentPassword, req.body.newPassword, function(response) {
      if (response.success) {
        const cookieSettings = {
          path: "/",
          secure: process.env.NODE_ENV === "production",
          domain: process.env.NODE_ENV === "development" ? "" : utils.getDomainFromUrl(config.productionWebsiteURL)
        }

        res.clearCookie("user", cookieSettings)
      }

      res.json(response)
    })
  }
})

module.exports = app
