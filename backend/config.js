const config = {
  productionWebsiteURL: process.env.PRODUCTION_WEBSITE_URL,
  userCookieExpirationLengthInDays: 365,
  hrsUntilUnvoteExpires: 1,
  hrsUntilEditAndDeleteExpires: 2,
  maxAgeOfRankedItemsInDays: 3,
  itemsPerPage: 30,
  minimumKarmaToDownvote: 0,
  commentsPerPage: 30,
  shadowBannedUsersPerPage: 250,
  bannedUsersPerPage: 250,
  moderationLogsPerPage: 250
}

module.exports = config
