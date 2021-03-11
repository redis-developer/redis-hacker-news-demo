import { Component } from "react"

import "../styles/pages/formatdoc.css"

import AlternateHeader from "../components/alternateHeader.js"
import HeadMetadata from "../components/headMetadata.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

export default class extends Component {
  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Formatting Options | Hacker News"
        />
        <GoogleAnalytics />
        <AlternateHeader
          displayMessage="Formatting Options"
        />
        <div className="formatdoc-content-container">
          <div className="formatdoc-content-text">
            <p>Blank lines separate paragraphs.</p>
            <p>Text surrounded by asterisks is italicized.</p>
            <p>Urls become links in the text content of items and comments. The same goes for the about section of the user profile page.</p>
          </div>
        </div>
      </div>
    )
  }
}
