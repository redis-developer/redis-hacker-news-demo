const BASE_URL = 'https://hacker-news.firebaseio.com/v0'
const axios = require('axios')

module.exports.getCommentById = async (id) => {
  const url = `${BASE_URL}/comment/${id}.json?print=pretty`

  const response = await axios({
    method: 'get',
    url,
  })

  return response.data
}

module.exports.getUserById = async (id) => {
  const url = `${BASE_URL}/user/${id}.json?print=pretty`

  const response = await axios({
    method: 'get',
    url,
  })

  return response.data
}

module.exports.getItemById = async (id) => {
  const url = `${BASE_URL}/item/${id}.json?print=pretty`

  const response = await axios({
    method: 'get',
    url,
  })

  return response.data
}

module.exports.getBestStories = async (limit = 3) => {
  const url = `${BASE_URL}/beststories.json?print=pretty&orderBy="$key"&limitToFirst=${limit}`

  const response = await axios({
    method: 'get',
    url,
  })

  return response.data
}