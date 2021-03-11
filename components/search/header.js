import { Component } from "react"

import "../../styles/components/search/header.css"

import SearchBarIcon from "./svg/searchBarIcon.js"
import AlgoliaLogo from "./svg/algoliaLogo.js"
import SettingsIcon from "./svg/settingsIcon.js"
import LeftArrow from "./svg/leftArrow.js"

export default class extends Component {
  constructor(props) {
    super(props)
    this.state = {
      searchInputValue: this.props.searchQuery
    }
  }

  updateSearchInputValue = (event) => {
    this.setState({searchInputValue: event.target.value})
  }

  checkForEnterKeypress = (event) => {
    if (event.keyCode === 13 || event.which === 13) {
      this.submitSearchInputRequest(event.target.value)
    }
  }

  submitSearchInputRequest = (inputValue) => {
    const query = `q=${inputValue}`
    const page = `page=1`
    const itemType = `itemType=${this.props.itemType}`
    const dateRange = `dateRange=${this.props.dateRange}`
    const startDate = `startDate=${this.props.startDate}`
    const endDate = `endDate=${this.props.endDate}`
    const sortBy = `sortBy=${this.props.sortBy}`

    window.location.href = `/search?${query}&${page}&${itemType}&${dateRange}&${startDate}&${endDate}&${sortBy}`
  }

  render() {
    return (
      <div className="search-header">
        <a className="search-header-logo" href="/search">
          <img src="/search-logo.png" />
          <div className="search-header-logo-label">
            <span>Search <br />Hacker News</span>
          </div>
        </a>
        {
          this.props.showSearchBar ?
          <div className="search-header-bar">
            <span className="search-header-bar-icon">
              <SearchBarIcon />
            </span>
            <input
              type="search"
              placeholder="Search stories by title, url, or author"
              value={this.state.searchInputValue}
              onChange={this.updateSearchInputValue}
              onKeyUp={this.checkForEnterKeypress}
            />
            <div className="search-header-bar-powered-by">
              <span className="search-header-bar-powered-by-label">Search by</span>
              <a href="https://www.algolia.com">
                <AlgoliaLogo />
              </a>
            </div>
          </div> : null
        }
        {
          this.props.showSettingsButton ?
          <div className="search-header-settings">
            <a href="/search/settings">
              <SettingsIcon />
              <span className="search-header-settings-label">Settings</span>
            </a>
          </div> : null
        }
        {
          this.props.showBackButton ?
          <div className="search-header-back">
            <a href="/search">
              <LeftArrow />
              Back
            </a>
          </div> : null
        }
      </div>
    )
  }
}
