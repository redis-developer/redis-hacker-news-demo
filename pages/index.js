import { Component } from "react"

import HeadMetadata from "../components/headMetadata.js"
import Header from "../components/header.js"
import Footer from "../components/footer.js"
import ItemsList from "../components/itemsList.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getRankedItemsByPage from "../api/items/getRankedItemsByPage.js"

export default class extends Component {
  static async getInitialProps ({req, query}) {
    const page = 1

    const apiResult = await getRankedItemsByPage(page, req)

    return {
      items: apiResult && apiResult.items,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      page: page,
      isMore: apiResult && apiResult.isMore,
      getDataError: apiResult && apiResult.getDataError,
      goToString: ""
    }
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Hacker News"
          description="News and discussion for software engineers."
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData.userSignedIn}
          username={this.props.authUserData.username}
          karma={this.props.authUserData.karma}
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
              showHideOption={true}
              showRank={true}
              isMoreLink={"/news?page=2"}
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
