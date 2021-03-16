const moment = require("moment")
const linkifyUrls = require("linkify-urls")
const xss = require("xss")

const utils = require("../utils.js")

const config = require("../../config.js")

const emailApi = require("../emails/api.js")

const UserModel = require("../../models/user.js")

module.exports = {
  createNewUser: function(username, password, callback) {
    if (username.length < 2 || username.length > 15) {
      callback({usernameLengthError: true})
    } else if (password.length < 8) {
      callback({passwordLengthError: true})
    } else {
      UserModel.findOne({username: username}).exec(function(error, user) {
        if (error) {
          callback({submitError: true})
        } else if (user) {
          callback({alreadyExistsError: true})
        } else {
          const authTokenString = utils.generateUniqueId(40)
          const authTokenExpirationTimestamp = moment().unix() + (86400 * config.userCookieExpirationLengthInDays)

          const newUserDoc = new UserModel({
            username: username,
            password: password,
            authToken: authTokenString,
            authTokenExpiration: authTokenExpirationTimestamp,
            created: moment().unix()
          })

          newUserDoc.save(function(newUserError, newUser) {
            if (newUserError) {
              callback({submitError: true})
            } else {
              callback({
                success: true,
                username: username,
                authToken: authTokenString,
                authTokenExpirationTimestamp: authTokenExpirationTimestamp
              })
            }
          })
        }
      })
    }
  },
  loginUser: function(username, password, callback) {
    UserModel.findOne({username: username}).exec(function(error, user) {
      console.log(error, user)
      if (error) {
        callback({submitError: true})
      } else if (!user) {
        callback({credentialError: true})
      } else if (user.banned) {
        callback({bannedError: true})
      } else {
        user.comparePassword(password, function(matchError, isMatch) {
          if (matchError) {
            callback({submitError: true})
          } else if (!isMatch) {
            callback({credentialError: true})
          } else {
            const authTokenString = utils.generateUniqueId(40)
            const authTokenExpirationTimestamp = moment().unix() + (86400 * config.userCookieExpirationLengthInDays)

            user.authToken = authTokenString
            user.authTokenExpiration = authTokenExpirationTimestamp

            user.save(function(saveError) {
              if (saveError) {
                callback({submitError: true})
              } else {
                callback({
                  success: true,
                  username: username,
                  authToken: authTokenString,
                  authTokenExpirationTimestamp: authTokenExpirationTimestamp
                })
              }
            })
          }
        })
      }
    })
  },
  authenticateUser: function(username, authToken, callback) {
    UserModel.findOne({username: username}).lean().exec(function(error, user) {
      if (error || !user || authToken !== user.authToken || moment().unix() > user.authTokenExpiration) {
        callback({success: false})
      } else if (user.banned) {
        callback({success: false, banned: true})
      } else {
        callback({
          success: true,
          username: user.username,
          karma: user.karma,
          containsEmail: user.email ? true : false,
          showDead: user.showDead ? true : false,
          isModerator: user.isModerator ? true : false,
          shadowBanned: user.shadowBanned ? true : false
        })
      }
    })
  },
  removeUserAuthData: function(authUser, callback) {
    UserModel.findOneAndUpdate({username: authUser.username}, {authToken: null, authTokenExpiration: null})
    .lean()
    .exec(function(error, user) {
      if (error) {
        callback({submitError: true})
      } else if (!user) {
        callback({success: false})
      } else {
        callback({success: true})
      }
    })
  },
  requestPasswordResetLink: function(username, callback) {
    UserModel.findOne({username: username}).exec(function(error, user) {
      if (error) {
        callback({submitError: true})
      } else if (!user) {
        callback({userNotFoundError: true})
      } else if (!user.email) {
        callback({noEmailError: true})
      } else {
        const resetPasswordToken = utils.generateUniqueId(40)
        const resetPasswordTokenExpiration = moment().unix() + 3600

        user.resetPasswordToken = resetPasswordToken
        user.resetPasswordTokenExpiration = resetPasswordTokenExpiration

        user.save(function(saveError) {
          if (saveError) {
            callback({submitError: true})
          } else {
            emailApi.sendResetPasswordEmail(username, resetPasswordToken, user.email, function(response) {
              if (!response.success) {
                callback({submitError: true})
              } else {
                callback({success: true})
              }
            })
          }
        })
      }
    })
  },
  resetPassword: function(username, newPassword, resetToken, callback) {
    UserModel.findOne({username: username}).exec(function(error, user) {
      if (error || !user) {
        callback({submitError: true})
      } else if (resetToken !== user.resetPasswordToken) {
        callback({invalidTokenError: true})
      } else if (moment().unix() > user.resetPasswordTokenExpiration) {
        callback({expiredTokenError: true})
      } else if (newPassword.length < 8) {
        callback({passwordLengthError: true})
      } else {
        user.password = newPassword
        user.resetPasswordToken = null
        user.resetPasswordTokenExpiration = null

        user.save(function(saveError) {
          if (saveError) {
            callback({submitError: true})
          } else {
            if (user.email) {
              emailApi.sendChangePasswordNotificationEmail(username, user.email, function() {
                callback({success: true})
              })
            } else {
              callback({success: true})
            }
          }
        })
      }
    })
  },
  getPublicUserData: function(username, authUser, callback) {
    UserModel.findOne({username: username}).lean().exec(function(error, user) {
      if (error) {
        callback({getDataError: true})
      } else if (!user) {
        callback({notFoundError: true})
      } else {
        if (authUser.isModerator) {
          callback({
            success: true,
            user: {
              username: user.username,
              created: user.created,
              karma: user.karma,
              about: user.about,
              shadowBanned: user.shadowBanned ? true : false,
              banned: user.banned ? true : false
            }
          })
        } else {
          callback({
            success: true,
            user: {
              username: user.username,
              created: user.created,
              karma: user.karma,
              about: user.about
            }
          })
        }
      }
    })
  },
  getPrivateUserData: function(username, callback) {
    UserModel.findOne({username: username}).lean().exec(function(error, user) {
      if (error) {
        callback({getDataError: true})
      } else if (!user) {
        callback({notFoundError: true})
      } else {
        const aboutText = user.about
          .replace(/<a\b[^>]*>/i,"").replace(/<\/a>/i, "")
          .replace(/<i\b[^>]*>/i,"*").replace(/<\/i>/i, "*")

        callback({
          success: true,
          user: {
            username: user.username,
            created: user.created,
            karma: user.karma,
            about: aboutText,
            email: user.email,
            showDead: user.showDead
          }
        })
      }
    })
  },
  updateUserData: function(username, inputData, callback) {
    UserModel.findOne({username: username}).exec(function(error, user) {
      if (error || !user) {
        callback({submitError: true})
      } else {
        let newAboutText = inputData.about

        newAboutText = newAboutText.trim()
        newAboutText = newAboutText.replace(/<[^>]+>/g, "")
        newAboutText = newAboutText.replace(/\*([^*]+)\*/g, "<i>$1</i>")
        newAboutText = linkifyUrls(newAboutText)
        newAboutText = xss(newAboutText)

        const oldEmail = user.email
        const isNewEmailValid = utils.validateEmail(inputData.email)

        user.about = newAboutText
        user.email = isNewEmailValid ? inputData.email : oldEmail
        user.showDead = inputData.showDead ? true : false

        user.save(function(saveError) {
          if (saveError) {
            callback({submitError: true})
          } else {
            if (oldEmail && oldEmail !== inputData.email) {
              const emailAction = !inputData.email ? "deleted" : "changed"

              emailApi.sendChangeEmailNotificationEmail(username, oldEmail, emailAction, function() {
                callback({success: true})
              })
            } else {
              callback({success: true})
            }
          }
        })
      }
    })
  },
  changePassword: function(username, currentPassword, newPassword, callback) {
    UserModel.findOne({username: username}).exec(function(error, user) {
      if (error || !user) {
        callback({submitError: true})
      } else {
        if (newPassword.length < 8) {
          callback({newPasswordLengthError: true})
        } else {
          user.comparePassword(currentPassword, function(matchError, isMatch) {
            if (matchError) {
              callback({submitError: true})
            } else if (!isMatch) {
              callback({invalidCurrentPassword: true})
            } else {
              user.password = newPassword
              user.authToken = null
              user.authTokenExpiration = null

              user.save(function(saveError) {
                if (saveError) {
                  callback({submitError: true})
                } else {
                  if (user.email) {
                    emailApi.sendChangePasswordNotificationEmail(username, user.email, function() {
                      callback({success: true})
                    })
                  } else {
                    callback({success: true})
                  }
                }
              })
            }
          })
        }
      }
    })
  }
}
