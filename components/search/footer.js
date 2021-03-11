import { Component } from "react"

import "../../styles/components/search/footer.css"

export default class extends Component {
  render() {
    return (
      <div className="search-footer">
        <ul>
          <li>
            <a href="/search/about">About</a>
          </li>
          <li>•</li>
          <li>
            <a href="/search/settings">Settings</a>
          </li>
          <li>•</li>
          <li>
            <a href="/">Hacker News</a>
          </li>
        </ul>
      </div>
    )
  }
}
