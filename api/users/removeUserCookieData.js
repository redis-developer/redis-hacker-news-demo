import axios from "axios"

import apiBaseUrl from "../../utils/apiBaseUrl.js"

export default function removeUserCookieData() {
  axios.put(`${apiBaseUrl}/users/remove-user-cookie-data`, {}, {withCredentials: true})
  .then(function(response) {
    return response.data
  })
  .catch(function(error) {
    return
  })
}
