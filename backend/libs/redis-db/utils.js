
const redisArrayToKeyValue = (arr, level, customProcessor) => {
  let res = {}

  for (let i = 0; i < arr.length; i += 2) {
    if (customProcessor[arr[i]]) {
      res[arr[i]] = customProcessor[arr[i]](arr[i + 1])
      continue
    }

    if (typeof arr[i + 1] === 'object') {
      res[arr[i]] = redisArrayToKeyValue(arr[i + 1], level + 1, customProcessor)
    } else {
      res[arr[i]] = arr[i + 1]
    }
  }

  return res
}

module.exports = {
  redisArrayToKeyValue,
}