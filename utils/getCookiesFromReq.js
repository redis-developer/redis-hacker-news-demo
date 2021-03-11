import moment from "moment"

export default function getCookiesFromReq(cookieString) {
  let result

  if (cookieString) {
    result = cookieString.split("; ").reduce((prev, current) => {
      const [name, value] = current.split("=")
      prev[name] = value
      return prev
    }, {})
  } else {
    result = {}
  }

  return result
}
