import { Component } from "react"

import "../../styles/components/search/noResults.css"

export default class extends Component {
  renderNoResultsTopMsg = () => {
    const searchQueryString = this.props.searchQuery ? <b>{this.props.searchQuery}</b> : "your query"

    if (this.props.itemType === "comment") {
      return <span>We found no <b>comments</b> matching {searchQueryString} for this period.</span>
    } else if (this.props.itemType === "item") {
      return <span>We found no <b>items</b> matching {searchQueryString} for this period.</span>
    } else {
      return <span>We found no <b>comments</b> or <b>items</b> matching {searchQueryString} for this period.</span>
    }
  }

  createLinkForNoResultsDateSuggestion = () => {
    const query = `q=${this.props.searchQuery}`
    const page = `page=${this.props.currPageNumber + 1}`
    const itemType = `itemType=${this.props.itemType}`
    const dateRange = `dateRange=allTime`
    const startDate = `startDate=`
    const endDate = `endDate=`
    const sortBy = `sortBy=${this.props.sortBy}`

    return `/search?${query}&${page}&${itemType}&${dateRange}&${startDate}&${endDate}&${sortBy}`
  }

  createLinkForNoResultsItemsSuggestion = () => {
    const query = `q=${this.props.searchQuery}`
    const page = `page=${this.props.currPageNumber + 1}`
    const itemType = `itemType=item`
    const dateRange = `dateRange=${this.props.dateRange}`
    const startDate = `startDate=${this.props.startDate}`
    const endDate = `endDate=${this.props.endDate}`
    const sortBy = `sortBy=${this.props.sortBy}`

    return `/search?${query}&${page}&${itemType}&${dateRange}&${startDate}&${endDate}&${sortBy}`
  }

  createLinkForNoResultsCommentsSuggestion = () => {
    const query = `q=${this.props.searchQuery}`
    const page = `page=${this.props.currPageNumber + 1}`
    const itemType = `itemType=comment`
    const dateRange = `dateRange=${this.props.dateRange}`
    const startDate = `startDate=${this.props.startDate}`
    const endDate = `endDate=${this.props.endDate}`
    const sortBy = `sortBy=${this.props.sortBy}`

    return `/search?${query}&${page}&${itemType}&${dateRange}&${startDate}&${endDate}&${sortBy}`
  }

  render() {
    return (
      <div className="search-no-results">
        <div className="search-no-results-msg">
          {this.renderNoResultsTopMsg()}
          {
            this.props.dateRange !== "allTime" || this.props.itemType !== "all" ?
            <p className="search-no-results-suggestions-label">Suggestions:</p> : null
          }
          {
            this.props.dateRange !== "allTime" ?
            <div className="search-no-results-suggestion">
              <a href={this.createLinkForNoResultsDateSuggestion()}>Search with a wider date range</a>
            </div> : null
          }
          {
            this.props.itemType === "comment" ?
            <div className="search-no-results-suggestion">
              <a href={this.createLinkForNoResultsItemsSuggestion()}>Search for items instead</a>
            </div> : null
          }
          {
            this.props.itemType === "item" ?
            <div className="search-no-results-suggestion">
              <a href={this.createLinkForNoResultsCommentsSuggestion()}>Search for comments instead</a>
            </div> : null
          }
        </div>
      </div>
    )
  }
}
