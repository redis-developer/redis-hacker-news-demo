import { Component } from "react"

import "../styles/pages/_error.css"

import HeadMetadata from "../components/headMetadata.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

export default class extends Component {
  render () {
    return (
      <div className="error-wrapper">
        <HeadMetadata
          title="Unkown | Hacker News"
        />
        <GoogleAnalytics />
        <span>Page not found.</span>
      </div>
    )
  }
}
