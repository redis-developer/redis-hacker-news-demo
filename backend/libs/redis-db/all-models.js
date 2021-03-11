const models = {}

const addModel = (idx, model) => {
  models[idx] = model
}

const getModel = (idx) => {
  return models[idx]
}

module.exports = {
  addModel: addModel,
  getModel: getModel,
}
