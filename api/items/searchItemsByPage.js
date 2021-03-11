import axios from "axios"

import apiBaseUrl from "../../utils/apiBaseUrl.js"

export default async function searchItemsByPage(page, req, query = '') {
  try {
    const cookie = req.headers.cookie ? req.headers.cookie : ""

    const response = await axios({
      url: `${apiBaseUrl}/items/search-items-by-page?page=${page}&query=${query}`,
      headers: req ? {cookie: cookie} : "",
      withCredentials: true
    })

    return response.data
  } catch(error) {
    return {getDataError: true}
  }
}
