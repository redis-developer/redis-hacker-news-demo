import { Component } from "react"

import "../../styles/pages/search/about.css"

import HeadMetadata from "../../components/headMetadata.js"
import SearchPageHeader from "../../components/search/header.js"
import SearchPageFooter from "../../components/search/footer.js"
import GoogleAnalytics from "../../components/googleAnalytics.js"

export default class extends Component {
  render () {
    return (
      <div className="search-about-wrapper">
        <HeadMetadata
          title="Search About | Hacker News"
        />
        <GoogleAnalytics />
        <SearchPageHeader
          showBackButton={true}
        />
        <div className="search-about-content">
          <div className="search-about-page-label">
            <span>About</span>
          </div>
          <p>Hacker News search provides real-time full-text search for the Hacker News community website. The search backend is implemented using <a href="http://www.algolia.com">Algolia</a> instant search engine.</p>
          <h3>How it works</h3>
          <p>Items and comments are updated in real-time and indexed in the <a href="http://www.algolia.com">Algolia</a> search engine.</p>
          <h3>Credits</h3>
          <p><a href="http://www.algolia.com">Algolia</a></p>
          <p><a href="https://github.com/algolia/algoliasearch-client-javascript">Algolia JavaScript API</a></p>
          <p><a href="https://news.ycombinator.com/">Hacker News</a></p>
        </div>
        <SearchPageFooter />
      </div>
    )
  }
}
