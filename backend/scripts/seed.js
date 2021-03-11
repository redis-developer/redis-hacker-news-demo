
const dotenv = require("dotenv")
dotenv.config()

const { rediSearchDb, redisJsonDb } = require('../db')

async function run () {
  // clean
  await rediSearchDb.run('flushall')
  await redisJsonDb.run('flushall')

  const runSeed = require('./runSeed')
  runSeed()
}

run()