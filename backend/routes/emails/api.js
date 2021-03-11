const nodemailer = require("nodemailer")
const mg = require("nodemailer-mailgun-transport")
const handlebars = require("handlebars")
const fs = require("fs")
const path = require("path")

const resetPasswordTemplate = fs.readFileSync(path.join(__dirname, "/templates/resetPassword.hbs"), "utf8")
const changePasswordNotificationTemplate = fs.readFileSync(path.join(__dirname, "/templates/changePasswordNotification.hbs"), "utf8")
const changeEmailNotificationTemplate = fs.readFileSync(path.join(__dirname, "/templates/changeEmailNotification.hbs"), "utf8")

const config = require("../../config.js")

const mailgunAuth = {
  auth: {
    api_key: process.env.MAILGUN_API_KEY,
    domain: "crfdemo.com"
  }
}

const smtpTransport = nodemailer.createTransport(mg(mailgunAuth))

module.exports = {
  sendResetPasswordEmail: function(username, token, email, callback) {
    const template = handlebars.compile(resetPasswordTemplate)

    const baseWebsiteUrl = process.env.NODE_ENV === "development" ? "http://localhost:3000" : config.productionWebsiteURL

    const htmlToSend = template({
      username: username,
      resetUrl: `${baseWebsiteUrl}/reset?username=${username}&token=${token}`
    })

    const mailOptions = {
      from: "Hacker News <nick@crfdemo.com>",
      to: email,
      subject: "Hacker News Password Recovery",
      html: htmlToSend
    }

    smtpTransport.sendMail(mailOptions, function(error, response) {
      if (error) {
        callback({success:false})
      } else {
        callback({success: true})
      }
    })
  },
  sendChangePasswordNotificationEmail: function(username, email, callback) {
    const template = handlebars.compile(changePasswordNotificationTemplate)

    const htmlToSend = template({
      username: username
    })

    const mailOptions = {
      from: "Hacker News <nick@crfdemo.com>",
      to: email,
      subject: "Password changed for " + username,
      html: htmlToSend
    }

    smtpTransport.sendMail(mailOptions, function(error, response) {
      if (error) {
        callback({success:false})
      } else {
        callback({success: true})
      }
    })
  },
  sendChangeEmailNotificationEmail: function(username, email, actionType, callback) {
    const template = handlebars.compile(changeEmailNotificationTemplate)

    const htmlToSend = template({
      username: username,
      actionType: actionType
    })

    const mailOptions = {
      from: "Hacker News <nick@crfdemo.com>",
      to: email,
      subject: "Email address changed for " + username,
      html: htmlToSend
    }

    smtpTransport.sendMail(mailOptions, function(error, response) {
      if (error) {
        callback({success:false})
      } else {
        callback({success: true})
      }
    })
  }
}
