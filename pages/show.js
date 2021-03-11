import { Component } from "react"

import "../styles/pages/show.css"

import Header from "../components/header.js"
import Footer from "../components/footer.js"
import HeadMetadata from "../components/headMetadata.js"
import ItemsList from "../components/itemsList.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getRankedShowItemsByPage from "../api/items/getRankedShowItemsByPage.js"

export default class extends Component {
  static async getInitialProps ({req, query}) {
    const page = query.page ? parseInt(query.page) : 1
    const apiResult = await getRankedShowItemsByPage(page, req)

    return {
      items: apiResult && apiResult.items,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      page: page,
      isMore: apiResult && apiResult.isMore,
      getDataError: apiResult && apiResult.getDataError,
      goToString: page > 1 ? `show?page=${page}` : "show"
    }
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="Show | Hacker News"
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
          pageName="show"
        />
        <div className="items-list-content-container">
          {
            !this.props.getDataError ?
            <>
              <div className="show-items-top-text">
                <span>Please read the <a href="/showguidelines">rules</a>. You can also browse the <a href="/shownew">newest</a> Show submissions.</span>
              </div>
              <ItemsList
                items={this.props.items}
                goToString={this.props.goToString}
                userSignedIn={this.props.authUserData.userSignedIn}
                currUsername={this.props.authUserData.username}
                showHideOption={true}
                showRank={true}
                isMoreLink={`/show?page=${this.props.page + 1}`}
                isMore={this.props.isMore}
                isModerator={this.props.authUserData.isModerator}
              />
            </> :
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
