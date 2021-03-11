import { Component } from "react"

import "../../styles/components/search/pageNumbers.css"

import DoubleLeftArrowsIcon from "./svg/doubleLeftArrowsIcon.js"
import DoubleRightArrowsIcon from "./svg/doubleRightArrowsIcon.js"

export default class extends Component {
  createLinkForPageButton = (pageNumber) => {
    const query = `q=${this.props.searchQuery}`
    const page = `page=${pageNumber}`
    const itemType = `itemType=${this.props.itemType}`
    const dateRange = `dateRange=${this.props.dateRange}`
    const startDate = `startDate=${this.props.startDate}`
    const endDate = `endDate=${this.props.endDate}`
    const sortBy = `sortBy=${this.props.sortBy}`

    return `/search?${query}&${page}&${itemType}&${dateRange}&${startDate}&${endDate}&${sortBy}`
  }

  render() {
    const maxNumOfResults = 3

    const pages = new Array(Math.abs(this.props.totalNumOfPages - 1)).fill(1).map((_, i) => i + 1)

    const headPages = this.props.currPageNumber > 0 ? pages.slice(0, this.props.currPageNumber).slice(-maxNumOfResults) : []
    const tailPages = pages.slice(this.props.currPageNumber, this.props.currPageNumber + maxNumOfResults)

    const isFirstPage = this.props.currPageNumber === 0
    const isLastPage = this.props.currPageNumber === this.props.totalNumOfPages - 1

    if (this.props.totalNumOfPages === 1) return null

    return (
      <div className="search-results-pagination">
        <ul>
          {
            !isFirstPage ?
            <li>
              <a href={this.createLinkForPageButton(1)}>
                <button>
                  <DoubleLeftArrowsIcon />
                </button>
              </a>
            </li> : null
          }
          {
            headPages.map((page) => {
              return (
                <li key={page}>
                  <a href={this.createLinkForPageButton(page)}>
                    <button>
                      {page}
                    </button>
                  </a>
                </li>
              )
            })
          }
          <li className="current">
            <button>{this.props.currPageNumber + 1}</button>
          </li>
          {
            tailPages.map((page) => {
              return (
                <li key={page}>
                  <a href={this.createLinkForPageButton(page + 1)}>
                    <button>
                      {page + 1}
                    </button>
                  </a>
                </li>
              )
            })
          }
          {
            !isLastPage && this.props.totalNumOfPages > maxNumOfResults ?
            <li className="search-results-pagination-item Pagination_next">
              <a href={this.createLinkForPageButton(this.props.totalNumOfPages)}>
                <button>
                  <DoubleRightArrowsIcon />
                </button>
              </a>
            </li> : null
          }
        </ul>
      </div>
    )
  }
}
