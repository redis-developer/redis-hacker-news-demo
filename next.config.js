const withCSS = require("@zeit/next-css")

module.exports = withCSS({
  env: {
    "DEVELOPMENT_API_URL": "http://localhost:5000/api",
    "PRODUCTION_API_URL": `${process.env.PRODUCTION_WEBSITE_URL}/api`,
  }
})
