const dotenv = require("dotenv")
dotenv.config()
const hackernews = require('./pullHackerNews')
const utils = require('../routes/utils')

const UserModel = require('../db/user')
const UserFavoriteModel = require('../db/userFavorite')
const UserHiddenModel = require('../db/userHidden')
const UserVoteModel = require('../db/userVote')
const ModerationLogModel = require('../db/moderationLog')
const ItemModel = require('../db/item')
const CommentModel = require('../db/comment')
const maxDepth = 1

createUserIfNotExists = async (by) => {
  const user = await UserModel.findOne({ username: by })

  if (!user) {
    const hackerUser = await hackernews.getUserById(by)

    const newUser = new UserModel({
      username: hackerUser.id,
      password: 'letmein',
      created: hackerUser.created,
      karma: hackerUser.karma,
    })
    await newUser.save()
    return newUser
  } else {
    return user
  }
}

const createComments = async (item, kids, level = 0, rootItem) => {
  if (level >= maxDepth) {
    return []
  }
  const createdComments = []

  const paredKids = kids.slice(0, 3)
  for (let i = 0; i < paredKids.length; i ++) {
    const comment = await hackernews.getItemById(paredKids[i])

    await createUserIfNotExists(comment.by)

    const newKids = (comment.kids && comment.kids.length > 0)
      ? comment.kids
      : []

    const newComment = new CommentModel({
      id: utils.generateUniqueId(12),
      by: comment.by,
      parentItemId: rootItem.id,
      parentItemTitle: rootItem.title || '',
      isParent: level == 0,
      parentCommentId: level > 0 ? item.id : '',
      children: [],
      text: comment.text,
      points: comment.score,
      created: comment.time,
      dead: false,
    })
    await newComment.save()

    if (level < 2) {
      const childCreatedComments = await createComments(newComment, newKids, level + 1, rootItem)

      newComment.children = childCreatedComments.map(c => c._id)
      await newComment.save()
    }

    createdComments.push(newComment)
  }

  return createdComments
}

const createAModerator = async () => {
  const newUser = new UserModel({
    username: 'moderator',
    password: 'password123',
    created: new Date().getTime(),
    karma: 0,
    isModerator: true,
  })
  await newUser.save()
}

module.exports = async function runSeed(maxStories) {

  const bestStories = await hackernews.getBestStories(maxStories)

  for (let i = 0; i < bestStories.length; i ++) {
    const story = await hackernews.getItemById(bestStories[i])
    if (story.type !== 'story') {
      continue
    }

    const user = await createUserIfNotExists(story.by)
    
    const newItem = await new ItemModel({
      id: utils.generateUniqueId(12),
      by: story.by,
      title: story.title,
      type: utils.getItemType(story.title, story.url, story.text),
      url: story.url,
      domain: utils.getDomainFromUrl(story.url),
      text: story.text,
      created: story.time,
      dead: false,
      score: story.score,
    })
    await newItem.save()

    await createComments(newItem, story.kids, 0, newItem)
  }
  

  await createAModerator()
}