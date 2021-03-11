const nanoid = require("nanoid")
const url = require("url")
const psl = require("psl")
const validator = require("validator")
const jwt = require('jsonwebtoken')

module.exports = {
  generateUniqueId: function(length) {
    const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

    const generator = nanoid.customAlphabet(alphabet, length)

    return generator()
  },
  getDomainFromUrl: function(paramUrl) {
    const hostname = url.parse(paramUrl).hostname

    const parsed = psl.parse(hostname)

    return parsed ? parsed.domain : null
  },
  validateEmail: function(email) {
    if (email === "") {
      return true
    } else {
      return validator.isEmail(email)
    }
  },
  isValidUrl: function(url) {
    return validator.isURL(url, {require_protocol: true})
  },
  getItemType: function(title, url, text) {
    if (url) {
      if (title.toLowerCase().startsWith("show cn")) {
        return "show"
      } else {
        return "news"
      }
    } else {
      return "ask"
    }
  },
  isValidDate: function(dateString) {
    return validator.isISO8601(dateString)
  },

  signToken: (user, expiresIn = '2y') => {
    return jwt.signAsync({ user: user }, process.env.JWT_SECRET, { expiresIn: expiresIn });
  },

  signTokenSync: (user, expiresIn = '10d') => {
    return jwt.sign({ user: user }, process.env.JWT_SECRET, { expiresIn: expiresIn });
  },

  decodeToken: (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
  },
}
