const usersApi = require("../routes/users/api.js")

const config = require("../config.js")

module.exports = {
  authUser: function(req, res, next) {
    const cookies = req.cookies.user ? req.cookies.user.split("&") : null

    const username = cookies ? cookies[0] : ""
    const authToken = cookies ? cookies[1] : ""

    if (cookies) res.locals.cookiesIncluded = true

    if (!cookies || !username || !authToken) {
      res.locals.userSignedIn = false
      res.locals.username = null
      res.locals.karma = null
      res.locals.showDead = false
      res.locals.showDownvote = false

      next()
    } else {
      usersApi.authenticateUser(username, authToken, function(authResponse) {
        if (!authResponse.success) {
          res.locals.userSignedIn = false
          res.locals.username = null
          res.locals.karma = null
          res.locals.showDead = false
          res.locals.showDownvote = false
          res.locals.banned = authResponse.banned

          next()
        } else {
          res.locals.userSignedIn = true
          res.locals.username = authResponse.username
          res.locals.karma = authResponse.karma
          res.locals.containsEmail = authResponse.containsEmail
          res.locals.showDead = authResponse.showDead
          res.locals.showDownvote = authResponse.karma >= config.minimumKarmaToDownvote
          res.locals.isModerator = authResponse.isModerator
          res.locals.shadowBanned = authResponse.shadowBanned

          next()
        }
      })
    }
  }
}
