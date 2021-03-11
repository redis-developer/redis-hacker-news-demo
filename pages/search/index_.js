import { Component } from "react"

import "../../styles/pages/search/index.css"

import HeadMetadata from "../../components/headMetadata.js"
import SearchPageHeader from "../../components/search/header.js"
import SearchPageFooter from "../../components/search/footer.js"
import Item from "../../components/search/item.js"
import Comment from "../../components/search/comment.js"
import Filters from "../../components/search/filters.js"
import NoResults from "../../components/search/noResults.js"
import PageNumbers from "../../components/search/pageNumbers.js"
import GoogleAnalytics from "../../components/googleAnalytics.js"

import getAlgoliaData from "../../api/search/getAlgoliaData.js"

export default class extends Component {
  static async getInitialProps ({ req, query }) {
    const apiResult = await getAlgoliaData(query, req.headers.cookie)

    return {
      searchQuery: query.q ? query.q : "",
      hits: apiResult.hits ? apiResult.hits : [],
      getDataError: apiResult.error,
      totalNumOfHits: apiResult.nbHits,
      processingTimeMS: apiResult.processingTimeMS,
      itemType: apiResult.itemType ? apiResult.itemType : "",
      sortBy: apiResult.sortBy ? apiResult.sortBy : "",
      dateRange: apiResult.dateRange ? apiResult.dateRange : "",
      startDate: query.startDate ? query.startDate : "",
      endDate: query.endDate ? query.endDate : "",
      currPageNumber: apiResult.page,
      totalNumOfPages: apiResult.nbPages
    }
  }

  render () {
    return (
      <div className="search-wrapper">
        <HeadMetadata
          title="Search | Hacker News"
        />
        <GoogleAnalytics />
        <SearchPageHeader
          searchQuery={this.props.searchQuery}
          showSearchBar={true}
          showSettingsButton={true}
          currPageNumber={this.props.currPageNumber}
          itemType={this.props.itemType}
          dateRange={this.props.dateRange}
          startDate={this.props.startDate}
          endDate={this.props.endDate}
          sortBy={this.props.sortBy}
        />
        <div className="search-results">
          <Filters
            searchQuery={this.props.searchQuery}
            currPageNumber={this.props.currPageNumber}
            dateRange={this.props.dateRange}
            startDate={this.props.startDate}
            endDate={this.props.endDate}
            sortBy={this.props.sortBy}
            itemType={this.props.itemType}
            totalNumOfHits={this.props.totalNumOfHits}
            processingTimeMS={this.props.processingTimeMS}
          />
          <div className="search-results-items">
            {
              this.props.hits.length > 0 && !this.props.getDataError ?
              this.props.hits.map((hit, index) => {
                return (
                  hit.type === "item" ?
                  <Item
                    item={hit}
                    key={hit.objectID}
                    searchQuery={this.props.searchQuery}
                  /> :
                  <Comment
                    comment={hit}
                    key={hit.objectID}
                    searchQuery={this.props.searchQuery}
                  />
                )
              }) : null
            }
            {
              this.props.getDataError ?
              <div className="search-error-msg">
                <span>An error occurred.</span>
              </div> : null
            }
            {
              this.props.hits.length === 0 && !this.props.getDataError ?
              <NoResults
                itemType={this.props.itemType}
                searchQuery={this.props.searchQuery}
                dateRange={this.props.dateRange}
                currPageNumber={this.props.currPageNumber}
                sortBy={this.props.sortBy}
                startDate={this.props.startDate}
                endDate={this.props.endDate}
              /> : null
            }
          </div>
          {
            !this.props.getDataError ?
            <PageNumbers
              totalNumOfPages={this.props.totalNumOfPages}
              currPageNumber={this.props.currPageNumber}
              searchQuery={this.props.searchQuery}
              itemType={this.props.itemType}
              dateRange={this.props.dateRange}
              startDate={this.props.startDate}
              endDate={this.props.endDate}
              sortBy={this.props.sortBy}
            /> : null
          }
        </div>
        <SearchPageFooter />
      </div>
    )
  }
}
