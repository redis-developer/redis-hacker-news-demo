import { Component } from "react"

import Header from "../components/header.js"
import Footer from "../components/footer.js"
import HeadMetadata from "../components/headMetadata.js"
import ItemsList from "../components/itemsList.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getItemsSubmittedByUser from "../api/items/getItemsSubmittedByUser.js"

export default class extends Component {
  static async getInitialProps ({req, query}) {
    const userId = query.id ? query.id : ""
    const page = query.page ? parseInt(query.page) : 1

    const apiResult = await getItemsSubmittedByUser(userId, page, req)

    return {
      items: apiResult && apiResult.items,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      page: page,
      userId: userId,
      isMore: apiResult && apiResult.isMore,
      getDataError: apiResult && apiResult.getDataError,
      goToString: page > 1 ? `submitted?id=${userId}&page=${page}` : `submitted?id=${userId}`
    }
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title={this.props.userId ? `${this.props.userId}'s Submissions | Hacker News` : "Hacker News"}
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
        />
        <div className="items-list-content-container">
          {
            !this.props.getDataError ?
            <ItemsList
              items={this.props.items}
              goToString={this.props.goToString}
              userSignedIn={this.props.authUserData.userSignedIn}
              currUsername={this.props.authUserData.username}
              showRank={true}
              showPastLink={true}
              showWebLink={true}
              isMoreLink={`/submitted?id=${this.props.userId}&page=${this.props.page + 1}`}
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
