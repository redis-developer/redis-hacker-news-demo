import axios from "axios"

import apiBaseUrl from "../../utils/apiBaseUrl.js"

export default function createNewUser(username, password, callback) {
  axios.post(apiBaseUrl + "/users/create-new-user", {
    username: username,
    password: password
  }, {
    withCredentials: true
  })
  .then(function(response) {
    callback(response.data)
  })
  .catch(function(error) {
    callback({submitError: true})
  })
}
