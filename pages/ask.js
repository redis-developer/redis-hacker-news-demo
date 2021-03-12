import { Component } from "react"

import Header from "../components/header.js"
import Footer from "../components/footer.js"
import HeadMetadata from "../components/headMetadata.js"
import ItemsList from "../components/itemsList.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getRankedAskItemsByPage from "../api/items/getRankedAskItemsByPage.js"

export default class extends Component {
  static async getInitialProps ({req, query}) {
    const page = query.page ? parseInt(query.pageName) : 1
    const apiResult = await getRankedAskItemsByPage(page, req)

    return {
      items: apiResult && apiResult.items,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      page: page,
      isMore: apiResult && apiResult.isMore,
      getDataError: apiResult && apiResult.getDataError,
      goToString: page > 1 ? `ask?page=${page}` : "ask"
    }
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Ask | Hacker News"
          description="News and discussion for software engineers."
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
          pageName="ask"
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
              isMoreLink={`/ask?page=${this.props.page + 1}`}
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
