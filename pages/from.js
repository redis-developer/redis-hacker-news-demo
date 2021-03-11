import { Component } from "react"

import Header from "../components/header.js"
import Footer from "../components/footer.js"
import HeadMetadata from "../components/headMetadata.js"
import ItemsList from "../components/itemsList.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getItemsBySiteDomain from "../api/items/getItemsBySiteDomain.js"

export default class extends Component {
  static async getInitialProps ({req, query}) {
    const site = query.site ? query.site : ""
    const page = query.page ? parseInt(query.page) : 1

    const apiResult = await getItemsBySiteDomain(site, page, req)

    return {
      items: apiResult && apiResult.items,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      site: site,
      page: page,
      isMore: apiResult && apiResult.isMore,
      getDataError: apiResult && apiResult.getDataError,
      goToString: page > 1 ? `from?site=${site}&page=${page}` : `from?site=${site}`
    }
  }

  render () {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title={`Submissions from ${this.props.site} | Hacker News`}
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
          label="from"
        />
        <div className="items-list-content-container">
          {
            !this.props.getDataError ?
            <ItemsList
              items={this.props.items}
              goToString={this.props.goToString}
              userSignedIn={this.props.authUserData.userSignedIn}
              currUsername={this.props.authUserData.username}
              showWebLink={true}
              showPastLink={true}
              isMoreLink={`/from?site=${this.props.site}&page=${this.props.page + 1}`}
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
