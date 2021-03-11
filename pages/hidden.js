import { Component } from "react"

import Header from "../components/header.js"
import Footer from "../components/footer.js"
import HeadMetadata from "../components/headMetadata.js"
import ItemsList from "../components/itemsList.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getUserHiddenItemsByPage from "../api/items/getUserHiddenItemsByPage.js"

export default class extends Component {
  static async getInitialProps ({req, query, res}) {
    const page = query.page ? parseInt(query.page) : 1

    const apiResult = await getUserHiddenItemsByPage(page, req)

    if (apiResult.authError) {
      res.writeHead(302, {
        Location: "/login?goto=hidden"
      })

      res.end()
    }

    return {
      items: apiResult && apiResult.items,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      page: page,
      isMore: apiResult && apiResult.isMore,
      getDataError: apiResult && apiResult.getDataError,
      goToString: page > 1 ? `hidden?page=${page}` : "hidden"
    }
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Hidden | Hacker News"
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
          label="hidden"
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
              showWebLink={true}
              showPastLink={true}
              showUnhideOption={true}
              isMoreLink={`/hidden?page=${this.props.page + 1}`}
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
