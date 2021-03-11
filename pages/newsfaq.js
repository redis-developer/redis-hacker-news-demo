import { Component } from "react"

import "../styles/pages/newsfaq.css"

import HeadMetadata from "../components/headMetadata.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

export default class extends Component {
  render () {
    return (
      <div className="news-faq-wrapper">
        <HeadMetadata
          title="Hacker News FAQ"
        />
        <GoogleAnalytics />
        <div className="news-faq-top-image">
          <a href="/">
            <img src="/coder-news-large-logo.png" />
          </a>
        </div>
        <div className="news-faq-text-container">
          <p className="news-faq-text-title">Hacker News FAQ</p>
          <p className="news-faq-text-title">Are there rules about submissions and comments?</p>
          <p><a href="/newsguidelines">Newsguidelines page</a></p>
          <p className="news-faq-text-title">How are items ranked?</p>
          <p>The basic algorithm divides points by a power of the time since an item was submitted.</p>
          <p className="news-faq-text-title">How is a user’s karma calculated?</p>
          <p>The number of upvotes on their items and comments minus the number of downvotes.</p>
          <p className="news-faq-text-title">Why don’t I see down arrows?</p>
          <p>There are no down arrows on items. They appear on comments after users reach a certain karma threshold.</p>
          <p className="news-faq-text-title">What kind of formatting can you use in comments?</p>
          <p><a href="/formatdoc">Formatting options page</a></p>
          <p className="news-faq-text-title">How do I submit a question?</p>
          <p>Use the submit link in the top bar, and leave the url field blank.</p>
          <p className="news-faq-text-title">How do I make a link in a question?</p>
          <p>You can’t. This is to prevent people from submitting a link with their comments in a privileged position at the top of the page. If you want to submit a link with comments, just submit it, then add a regular comment.</p>
          <p className="news-faq-text-title">In my profile, what does showdead do?</p>
          <p>If you turn it on, you’ll see all the items and comments that have been killed by moderators.</p>
          <div className="news-faq-bottom-divider"></div>
        </div>
      </div>
    )
  }
}
