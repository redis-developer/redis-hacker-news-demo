import { Component } from "react"

import HeadMetadata from "../components/headMetadata.js"
import Header from "../components/header.js"
import Footer from "../components/footer.js"
import ItemsList from "../components/itemsList.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getNewestItemsByPage from "../api/items/getNewestItemsByPage.js"

export default class extends Component {
  static async getInitialProps ({req, query}) {
    const page = query.page ? parseInt(query.page) : 1

    const apiResult = await getNewestItemsByPage(page, req)

    return {
      items: apiResult && apiResult.items,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      page: page,
      isMore: apiResult && apiResult.isMore,
      getDataError: apiResult && apiResult.getDataError,
      goToString: page > 1 ? `newest?page=${page}` : "newest"
    }
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Newest Items | Hacker News"
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
          pageName="newest"
        />
        <div className="items-list-content-container">
          {
            !this.props.getDataError ?
            <ItemsList
              items={this.props.items}
              goToString={this.props.goToString}
              userSignedIn={this.props.authUserData.userSignedIn}
              currUsername={this.props.authUserData.username}
              showHideOption={true}
              showRank={true}
              showWebLink={true}
              showPastLink={true}
              isMoreLink={`/newest?page=${this.props.page + 1}`}
              isMore={this.props.isMore}
              isModerator={this.props.authUserData.isModerator}
            /> :
            <div className="items-list-error-msg">
              <span>An error occurred.</span>
            </div>
          }
        </div>
        <Footer />
      </div>
    )
  }
}
