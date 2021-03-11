import { Component } from "react"

import Header from "../components/header.js"
import Footer from "../components/footer.js"
import HeadMetadata from "../components/headMetadata.js"
import CommentsList from "../components/commentsList.js"
import GoogleAnalytics from "../components/googleAnalytics.js"

import getNewestCommentsByPage from "../api/comments/getNewestCommentsByPage.js"

export default class extends Component {
  static async getInitialProps ({ req, query }) {
    const page = query.page ? parseInt(query.page) : 1

    const apiResult = await getNewestCommentsByPage(page, req)

    return {
      comments: apiResult && apiResult.comments,
      authUserData: apiResult && apiResult.authUser ? apiResult.authUser : {},
      page: page,
      isMore: apiResult && apiResult.isMore,
      getDataError: apiResult && apiResult.getDataError,
      goToString: page > 1 ? `newcomments?page=${page}` : `newcomments`
    }
  }

  render() {
    return (
      <div className="layout-wrapper">
        <HeadMetadata
          title="New Comments | Hacker News"
        />
        <GoogleAnalytics />
        <Header
          userSignedIn={this.props.authUserData && this.props.authUserData.userSignedIn}
          username={this.props.authUserData && this.props.authUserData.username}
          karma={this.props.authUserData && this.props.authUserData.karma}
          goto={this.props.goToString}
          pageName="newcomments"
        />
        <div className="comments-list-content-container">
          {
            !this.props.getDataError ?
            <CommentsList
              comments={this.props.comments}
              userSignedIn={this.props.authUserData.userSignedIn}
              currUsername={this.props.authUserData.username}
              goToString={this.props.goToString}
              showDownvote={this.props.authUserData.showDownvote}
              isMore={this.props.isMore}
              isMoreLink={`/newcomments?page=${this.props.page + 1}`}
              isModerator={this.props.authUserData.isModerator}
            /> :
            <div className="comments-list-error-msg">
              <span>An error occurred.</span>
            </div>
          }
        </div>
        <Footer />
      </div>
    )
  }
}
