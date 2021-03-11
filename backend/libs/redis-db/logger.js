function logger () {
}


logger.prototype.log = function () {
  if (process.env.LOG_LEVEL) {
    console.log('REDIS', ...arguments)
  }
}

logger.prototype.error = function () {
  if (process.env.LOG_LEVEL) {
    console.error('REDIS', ...arguments)
  }
}

module.exports = new logger()
